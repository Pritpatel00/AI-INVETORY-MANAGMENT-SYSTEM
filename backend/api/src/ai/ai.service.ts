import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import {
  InventoryAction,
  StockCondition,
} from "@prisma/client";
import { z } from "zod";

import type { AuthenticatedUser } from "../auth/auth-user";
import { PrismaService } from "../prisma/prisma.service";
import {
  ExtractInventoryContextDto,
  ExtractInventoryDto,
} from "./dto/extract-inventory.dto";
import { LocationResolverService } from "../inventory/location-resolver.service";

const actionValues = [
  "RECEIVE",
  "SHIP",
  "TRANSFER",
  "CYCLE_COUNT",
  "DAMAGE",
  "UNKNOWN",
] as const;
const conditionValues = ["GOOD", "DAMAGED", "HOLD", "UNKNOWN"] as const;

const fieldConfidenceSchema = z
  .object({
    action: z.number().min(0).max(1),
    product: z.number().min(0).max(1),
    quantity: z.number().min(0).max(1),
    sourceLocation: z.number().min(0).max(1),
    destinationLocation: z.number().min(0).max(1),
    condition: z.number().min(0).max(1),
    referenceNumber: z.number().min(0).max(1),
  })
  .strict();

const modelExtractionSchema = z
  .object({
    action: z.enum(actionValues),
    productSku: z.string().max(80),
    quantity: z.number().int().min(0),
    quantityKnown: z.boolean(),
    sourceLocationCode: z.string().max(80),
    destinationLocationCode: z.string().max(80),
    condition: z.enum(conditionValues),
    referenceNumber: z.string().max(80),
    notes: z.string().max(500),
    fieldConfidence: fieldConfidenceSchema,
  })
  .strict();

const extractionJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    action: { type: "string", enum: actionValues },
    productSku: { type: "string", maxLength: 80 },
    quantity: { type: "integer", minimum: 0 },
    quantityKnown: { type: "boolean" },
    sourceLocationCode: { type: "string", maxLength: 80 },
    destinationLocationCode: { type: "string", maxLength: 80 },
    condition: { type: "string", enum: conditionValues },
    referenceNumber: { type: "string", maxLength: 80 },
    notes: { type: "string", maxLength: 500 },
    fieldConfidence: {
      type: "object",
      additionalProperties: false,
      properties: {
        action: { type: "number", minimum: 0, maximum: 1 },
        product: { type: "number", minimum: 0, maximum: 1 },
        quantity: { type: "number", minimum: 0, maximum: 1 },
        sourceLocation: { type: "number", minimum: 0, maximum: 1 },
        destinationLocation: { type: "number", minimum: 0, maximum: 1 },
        condition: { type: "number", minimum: 0, maximum: 1 },
        referenceNumber: { type: "number", minimum: 0, maximum: 1 },
      },
      required: [
        "action",
        "product",
        "quantity",
        "sourceLocation",
        "destinationLocation",
        "condition",
        "referenceNumber",
      ],
    },
  },
  required: [
    "action",
    "productSku",
    "quantity",
    "quantityKnown",
    "sourceLocationCode",
    "destinationLocationCode",
    "condition",
    "referenceNumber",
    "notes",
    "fieldConfidence",
  ],
} as const;

interface OllamaChatResponse {
  model: string;
  message?: { content?: string };
  total_duration?: number;
}

function envNumber(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

@Injectable()
export class AiService {
  private readonly ollamaUrl =
    process.env.OLLAMA_URL ?? "http://127.0.0.1:11434";
  private readonly ollamaModel = process.env.OLLAMA_MODEL ?? "qwen3:4b";
  // How long Ollama keeps the model loaded after a request. A short value
  // causes a cold model reload on the next extraction, which is the most
  // common cause of slow AI responses. Use a valid Ollama duration such as
  // "30m" to keep it warm between warehouse commands.
  private readonly ollamaKeepAlive =
    process.env.OLLAMA_KEEP_ALIVE ?? "30m";
  // The extraction JSON is small, so capping output tokens avoids wasting time
  // on a long tail. The structured-output schema already bounds the answer, and
  // the default leaves comfortable headroom for the free-text notes field.
  private readonly ollamaNumPredict = envNumber("OLLAMA_NUM_PREDICT", 256);
  // Bounds the context window (Qwen3's native context can be 32k tokens), which
  // reduces memory and speeds up generation on CPU while fitting the catalog
  // prompt easily.
  private readonly ollamaNumCtx = envNumber("OLLAMA_NUM_CTX", 2048);
  // Optional CPU thread count; Ollama decides automatically when unset.
  private readonly ollamaNumThreads =
    envNumber("OLLAMA_NUM_THREADS", 0) || undefined;

  constructor(
    private readonly prisma: PrismaService,
    private readonly locationResolver: LocationResolverService,
  ) {}

  async extractInventory(
    input: ExtractInventoryDto,
    actor: AuthenticatedUser,
  ) {
    const transcript = input.transcript.trim();
    const user = await this.resolveUser(actor);

    if (input.evidenceId) {
      const evidence = await this.prisma.voiceEvidence.findFirst({
        where: { id: input.evidenceId, createdById: user.id },
        select: { id: true },
      });
      if (!evidence) {
        throw new BadRequestException(
          "The voice evidence does not belong to this user.",
        );
      }
    }

    const [products, locations] = await Promise.all([
      this.prisma.product.findMany({
        where: { active: true },
        select: {
          id: true,
          sku: true,
          name: true,
          unit: true,
          safetyStock: true,
        },
        orderBy: { sku: "asc" },
      }),
      this.prisma.location.findMany({
        where: { active: true },
        select: { id: true, code: true, name: true },
        orderBy: { code: "asc" },
      }),
    ]);

    // Assigned task details are trusted context. The worker should not have to
    // repeat the action, item, SKU, or location when answering a clarification.
    const contextAction = input.context?.action
      ? (input.context.action as InventoryAction)
      : null;
    const contextProduct = input.context
      ? (products.find(
          (product) =>
            (input.context?.productSku &&
              product.sku.toLowerCase() ===
                input.context.productSku.toLowerCase()) ||
            (input.context?.productName &&
              this.normalize(product.name) ===
                this.normalize(input.context.productName)),
        ) ?? null)
      : null;
    const contextSourceLocation = input.context?.sourceLocationCode
      ? (locations.find(
          (location) =>
            location.code.toLowerCase() ===
            input.context!.sourceLocationCode!.toLowerCase(),
        ) ?? null)
      : null;
    const contextDestinationLocation = input.context?.destinationLocationCode
      ? (locations.find(
          (location) =>
            location.code.toLowerCase() ===
            input.context!.destinationLocationCode!.toLowerCase(),
        ) ?? null)
      : null;

    const fastExtraction = await this.tryDeterministicExtraction(
      transcript,
      input.evidenceId,
      user.id,
      products,
      locations,
      input.context,
    );
    if (fastExtraction) {
      if (input.evidenceId) {
        await this.prisma.voiceEvidence.update({
          where: { id: input.evidenceId },
          data: { transcript },
        });
      }
      return fastExtraction;
    }

    const prompt = [
      "Extract one warehouse inventory transaction from the transcript.",
      "Use only the products and locations listed below.",
      "Never invent a SKU or location code.",
      "Use UNKNOWN or an empty string when information is not explicit.",
      "Clarification answers are short speech transcripts and may contain phonetic or spelling errors.",
      "When a clarification question is present, map its answer to the closest allowed action, product, quantity or location only when the intended value is reasonably clear.",
      "Action rules:",
      "- received/incoming/delivered/put at/added to/put in => RECEIVE",
      "- shipped/dispatched => SHIP",
      "- moved/transferred from one location to another => TRANSFER",
      "- counted/physical count => CYCLE_COUNT",
      "- damaged/broken => DAMAGE",
      "For RECEIVE, the spoken location is destinationLocationCode.",
      "For SHIP, CYCLE_COUNT and DAMAGE, it is sourceLocationCode.",
      "For TRANSFER, capture both source and destination.",
      "For RECEIVE, the worker must say the actual destination location. If it is missing, leave destinationLocationCode empty so the system asks for it.",
      "For CYCLE_COUNT and DAMAGE, if the worker does not say a location, leave sourceLocationCode empty — the backend will use the worker's assigned zone.",
      "For SHIP, if the worker does not say a location, the backend will check the worker's zone for stock — leave sourceLocationCode empty.",
      ...(input.context
        ? [
            "Assigned task context is authoritative. Do not ask the worker to repeat any assigned action, item, SKU, or location.",
            `Assigned task context: ${JSON.stringify(input.context)}`,
          ]
        : []),
      "An order or business reference belongs in referenceNumber.",
      "Return only data matching the supplied JSON schema.",
      `Products: ${JSON.stringify(products.map(({ sku, name, unit }) => ({ sku, name, unit })))}`,
      `Locations: ${JSON.stringify(locations.map(({ code, name }) => ({ code, name })))}`,
      `Transcript: ${JSON.stringify(transcript)}`,
    ].join("\n");

    let response: Response;
    try {
      response = await fetch(`${this.ollamaUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.ollamaModel,
          stream: false,
          think: false,
          keep_alive: this.ollamaKeepAlive,
          format: extractionJsonSchema,
          options: {
            temperature: 0,
            seed: 42,
            num_predict: this.ollamaNumPredict,
            num_ctx: this.ollamaNumCtx,
            ...(this.ollamaNumThreads
              ? { num_thread: this.ollamaNumThreads }
              : {}),
          },
          messages: [
            {
              role: "system",
              content:
                "You are a careful warehouse data extraction service. Do not make inventory decisions and do not invent missing data.",
            },
            { role: "user", content: prompt },
          ],
        }),
        signal: AbortSignal.timeout(120_000),
      });
    } catch {
      throw new ServiceUnavailableException(
        "The local Ollama AI service is unavailable.",
      );
    }

    if (!response.ok) {
      const details = await response.text();
      throw new BadGatewayException(
        `AI extraction failed with status ${response.status}: ${details}`,
      );
    }

    const ollamaResponse = (await response.json()) as OllamaChatResponse;
    const content = ollamaResponse.message?.content;
    if (!content) {
      throw new BadGatewayException("The AI model returned no extraction.");
    }

    let rawExtraction: z.infer<typeof modelExtractionSchema>;
    try {
      rawExtraction = modelExtractionSchema.parse(JSON.parse(content));
    } catch {
      throw new BadGatewayException(
        "The AI model returned information in an invalid format.",
      );
    }

    // A clarification reply is often only a number (for example, "100").
    // Do not make the model infer the quantity again from that short answer:
    // the question already establishes that the answer is the quantity.
    const clarifiedQuantity = this.extractClarificationQuantity(transcript);
    const contextQuantity =
      input.context &&
      !/\b(?:order|reference|purchase order|po number|because|notes?)\b/i.test(
        transcript,
      )
        ? this.parseQuantityWords(
            transcript
              .toLowerCase()
              .replace(/[.,?!]+/g, "")
              .replace(
                /\b(?:units?|pieces?|boxes?|rolls?|pairs?|packs?|cartons?)\b$/,
                "",
              )
              .trim()
              .split(/\s+/)
              .filter(Boolean),
          )
        : null;
    if (clarifiedQuantity !== null) {
      rawExtraction.quantity = clarifiedQuantity;
      rawExtraction.quantityKnown = true;
      rawExtraction.fieldConfidence.quantity = 1;
    } else if (contextQuantity !== null) {
      // In an assigned task, a short answer such as “100” is the missing
      // quantity. Do not ask the worker for the same quantity again.
      rawExtraction.quantity = contextQuantity;
      rawExtraction.quantityKnown = true;
      rawExtraction.fieldConfidence.quantity = 1;
    }

    const clarifiedFields = this.findClarifiedFields(transcript);
    const clarifiedAction = this.inferActionFromClarification(transcript);
    const clarifiedSourceLocation = this.inferLocationFromClarification(
      transcript,
      "which location did the stock come from",
      locations,
    );
    const clarifiedDestinationLocation = this.inferLocationFromClarification(
      transcript,
      "where should it go",
      locations,
    );
    const action =
      contextAction ?? this.inferActionFromTranscript(transcript) ?? clarifiedAction;
    const validatedFieldConfidence = {
      ...rawExtraction.fieldConfidence,
      action: contextAction
        ? 1
        : clarifiedAction
          ? Math.max(rawExtraction.fieldConfidence.action, 0.85)
          : rawExtraction.fieldConfidence.action,
      product: contextProduct
        ? 1
        : rawExtraction.fieldConfidence.product,
      quantity:
        contextQuantity !== null || clarifiedQuantity !== null
          ? 1
        : rawExtraction.fieldConfidence.quantity,
      sourceLocation: contextSourceLocation
        ? 1
        : clarifiedSourceLocation
          ? Math.max(rawExtraction.fieldConfidence.sourceLocation, 0.85)
          : rawExtraction.fieldConfidence.sourceLocation,
      destinationLocation: contextDestinationLocation
        ? 1
        : clarifiedDestinationLocation
          ? Math.max(rawExtraction.fieldConfidence.destinationLocation, 0.85)
          : rawExtraction.fieldConfidence.destinationLocation,
    };
    const product = contextProduct ?? this.matchProduct(
      rawExtraction.productSku,
      transcript,
      products,
      clarifiedFields.has("product") &&
        rawExtraction.fieldConfidence.product >= 0.5,
    );
    const matchedSourceLocation =
      contextSourceLocation ??
      clarifiedSourceLocation ??
      this.matchLocation(
        rawExtraction.sourceLocationCode,
        transcript,
        locations,
        clarifiedFields.has("sourceLocation") &&
          rawExtraction.fieldConfidence.sourceLocation >= 0.5,
      );
    const matchedDestinationLocation =
      contextDestinationLocation ??
      clarifiedDestinationLocation ??
      this.matchLocation(
        rawExtraction.destinationLocationCode,
        transcript,
        locations,
        clarifiedFields.has("destinationLocation") &&
          rawExtraction.fieldConfidence.destinationLocation >= 0.5,
      );
    // Determine initial location sources from matching or clarification.
    let sourceLocationSource: string | null = null;
    let destinationLocationSource: string | null = null;
    if (matchedSourceLocation) {
      sourceLocationSource = contextSourceLocation
        ? "ASSIGNED_TASK"
        : clarifiedSourceLocation
          ? "CLARIFIED"
          : "SPOKEN";
    }
    if (matchedDestinationLocation) {
      destinationLocationSource = contextDestinationLocation
        ? "ASSIGNED_TASK"
        : clarifiedDestinationLocation
          ? "CLARIFIED"
          : "SPOKEN";
    }

    // Assign locations based on action and try auto-resolution.
    let sourceLocation = action === InventoryAction.RECEIVE ? null : matchedSourceLocation;
    const destinationLocation = action === InventoryAction.RECEIVE || action === InventoryAction.TRANSFER ? matchedDestinationLocation : null;

    // Auto-resolve: Cycle count or Damage without spoken source → use worker zone.
    if (
      action != null &&
      (action === InventoryAction.CYCLE_COUNT || action === InventoryAction.DAMAGE) &&
      !sourceLocation
    ) {
      const zone = await this.locationResolver.resolveWorkerZone(user.id);
      if (zone) {
        sourceLocation = { id: zone.id, code: zone.code, name: zone.name };
        sourceLocationSource = "WORKER_ZONE";
      }
    }

    // Auto-resolve: Ship without spoken source → use worker zone if stock is available.
    if (
      action != null &&
      action === InventoryAction.SHIP &&
      !sourceLocation &&
      product
    ) {
      const shipping = await this.locationResolver.resolveShippingSource(user.id, product.id);
      if (shipping) {
        sourceLocation = { id: shipping.id, code: shipping.code, name: shipping.name };
        sourceLocationSource = "WORKER_ZONE";
      }
    }
    const condition =
      action === InventoryAction.DAMAGE
        ? StockCondition.DAMAGED
        : rawExtraction.condition === "HOLD" &&
            /\bhold|quarantine|inspection\b/i.test(transcript)
          ? StockCondition.HOLD
          : StockCondition.GOOD;
    const quantityKnown =
      rawExtraction.quantityKnown &&
      (contextQuantity !== null ||
        this.hasExplicitQuantity(
        transcript,
        rawExtraction.quantity,
        product?.sku,
        ) ||
        (clarifiedFields.has("quantity") &&
          rawExtraction.fieldConfidence.quantity >= 0.5));
    const referenceNumber =
      rawExtraction.referenceNumber.trim() &&
      this.normalize(transcript).includes(
        this.normalize(rawExtraction.referenceNumber),
      )
        ? rawExtraction.referenceNumber.trim()
        : null;
    const notes =
      rawExtraction.notes.trim() &&
      this.normalize(transcript).includes(this.normalize(rawExtraction.notes))
        ? rawExtraction.notes.trim()
        : null;

    const missingFields = this.findMissingFields({
      action,
      product,
      quantityKnown,
      sourceLocation,
      destinationLocation,
    });

    // Override field confidence for auto-resolved locations. A location that
    // the deterministic matcher grounded in the spoken transcript (exact
    // alias mention or a single unambiguous fuzzy mention) is treated as
    // high-confidence even when the local model rates it lower — the matcher
    // already proved the value against the worker's actual words, so re-asking
    // for the same field would only add a redundant clarification step.
    const srcLocConfidence = sourceLocationSource === "RECEIVING_DEFAULT" || sourceLocationSource === "WORKER_ZONE" || Boolean(matchedSourceLocation)
      ? 1
      : rawExtraction.fieldConfidence.sourceLocation;
    const destLocConfidence = destinationLocationSource === "RECEIVING_DEFAULT" || destinationLocationSource === "WORKER_ZONE" || Boolean(matchedDestinationLocation)
      ? 1
      : rawExtraction.fieldConfidence.destinationLocation;

    const essentialConfidences: Array<[string, number]> = [
      ["action", validatedFieldConfidence.action],
      ["product", rawExtraction.fieldConfidence.product],
      ["quantity", rawExtraction.fieldConfidence.quantity],
    ];
    if (action === InventoryAction.TRANSFER) {
      essentialConfidences.push(
        ["sourceLocation", srcLocConfidence],
        ["destinationLocation", destLocConfidence],
      );
    } else if (action === InventoryAction.RECEIVE) {
      essentialConfidences.push(
        ["destinationLocation", destLocConfidence],
      );
    } else if (action) {
      essentialConfidences.push([
        "sourceLocation",
        srcLocConfidence,
      ]);
    }
    const relevantConfidences = essentialConfidences.map(([, value]) => value);
    const confidence =
      relevantConfidences.reduce((sum, value) => sum + value, 0) /
      relevantConfidences.length;
    const lowConfidenceFields = essentialConfidences
      .filter(
        ([field, value]) => value < 0.5 && !missingFields.includes(field),
      )
      .map(([field]) => field);
    const clarificationQuestions = this.buildClarificationQuestions([
      ...new Set([...missingFields, ...lowConfidenceFields]),
    ]);

    if (input.evidenceId) {
      await this.prisma.voiceEvidence.update({
        where: { id: input.evidenceId },
        data: { transcript },
      });
    }

    return {
      transcript,
      evidenceId: input.evidenceId ?? null,
      model: ollamaResponse.model || this.ollamaModel,
      readyForConfirmation:
        missingFields.length === 0 && lowConfidenceFields.length === 0,
      requiresManagerReview:
        action !== null &&
        (
          [
            InventoryAction.CYCLE_COUNT,
            InventoryAction.DAMAGE,
          ] as InventoryAction[]
        ).includes(action),
      confidence: Number(confidence.toFixed(3)),
      missingFields,
      lowConfidenceFields,
      clarificationQuestions,
      sourceLocationSource,
      destinationLocationSource,
      fields: {
        action,
        product,
        quantity: quantityKnown ? rawExtraction.quantity : null,
        sourceLocation,
        destinationLocation,
        condition,
        referenceNumber,
        notes,
      },
      fieldConfidence: validatedFieldConfidence,
      safetyNotice:
        "AI extracted these details but did not create or post an inventory transaction.",
    };
  }

  /**
   * Clear warehouse commands do not need a generative model. Grounding the
   * action, item, quantity and location in master data makes the common path
   * both faster and stricter. Ambiguous speech, clarification answers and
   * free-text references still use Qwen below.
   */
  private async tryDeterministicExtraction(
    transcript: string,
    evidenceId: string | undefined,
    userId: string,
    products: Array<{
      id: string;
      sku: string;
      name: string;
      unit: string;
      safetyStock: number;
    }>,
    locations: Array<{ id: string; code: string; name: string }>,
    context?: ExtractInventoryContextDto,
  ) {
    if (
      /clarification answer to/i.test(transcript) ||
      /\b(?:order|reference|purchase order|po number|because|notes?)\b/i.test(
        transcript,
      )
    ) {
      return null;
    }

    const action = context?.action
      ? (context.action as InventoryAction)
      : this.inferUnambiguousAction(transcript);
    if (!action) return null;

    const spoken = this.normalize(transcript);
    const mentionedProducts = products.filter((product) =>
      this.transcriptExplicitlyMentionsProduct(spoken, product),
    );
    if (mentionedProducts.length > 1) return null;
    const contextProduct = context?.productSku
      ? products.find(
          (candidate) =>
            candidate.sku.toLowerCase() === context.productSku!.toLowerCase(),
        ) ?? null
      : context?.productName
        ? products.find(
            (candidate) =>
              this.normalize(candidate.name) ===
              this.normalize(context.productName!),
          ) ?? null
        : null;
    const product = contextProduct ?? mentionedProducts[0] ?? null;
    const contextQuantity =
      context &&
      !/\b(?:order|reference|purchase order|po number|because|notes?)\b/i.test(
        transcript,
      )
        ? this.parseQuantityWords(
            transcript
              .toLowerCase()
              .replace(/[.,?!]+/g, "")
              .replace(
                /\b(?:units?|pieces?|boxes?|rolls?|pairs?|packs?|cartons?)\b$/,
                "",
              )
              .trim()
              .split(/\s+/)
              .filter(Boolean),
          )
        : null;
    const quantity =
      this.extractDeterministicQuantity(transcript, product?.unit) ??
      contextQuantity;
    const quantityKnown = quantity !== null;

    let sourceLocation: (typeof locations)[number] | null = null;
    let destinationLocation: (typeof locations)[number] | null = null;
    let sourceLocationSource: string | null = null;
    let destinationLocationSource: string | null = null;

    if (context?.sourceLocationCode) {
      sourceLocation =
        locations.find(
          (location) =>
            location.code.toLowerCase() ===
            context.sourceLocationCode!.toLowerCase(),
        ) ?? null;
      sourceLocationSource = sourceLocation ? "ASSIGNED_TASK" : null;
    }
    if (context?.destinationLocationCode) {
      destinationLocation =
        locations.find(
          (location) =>
            location.code.toLowerCase() ===
            context.destinationLocationCode!.toLowerCase(),
        ) ?? null;
      destinationLocationSource = destinationLocation ? "ASSIGNED_TASK" : null;
    }

    if (action === InventoryAction.TRANSFER) {
      const route = spoken.match(/\bfrom\b\s+(.+?)\s+\bto\b\s+(.+)$/);
      if (route && !sourceLocation && !destinationLocation) {
        sourceLocation = this.matchLocation("", route[1], locations);
        destinationLocation = this.matchLocation("", route[2], locations);
      }
      if (sourceLocation && !sourceLocationSource) sourceLocationSource = "SPOKEN";
      if (destinationLocation && !destinationLocationSource)
        destinationLocationSource = "SPOKEN";
    } else if (!sourceLocation && !destinationLocation) {
      const spokenLocation = this.matchLocation("", transcript, locations);
      if (action === InventoryAction.RECEIVE) {
        destinationLocation = spokenLocation;
        if (destinationLocation) destinationLocationSource = "SPOKEN";
      } else {
        sourceLocation = spokenLocation;
        if (sourceLocation) sourceLocationSource = "SPOKEN";
      }
    }

    if (
      (action === InventoryAction.CYCLE_COUNT ||
        action === InventoryAction.DAMAGE) &&
      !sourceLocation
    ) {
      const zone = await this.locationResolver.resolveWorkerZone(userId);
      if (zone) {
        sourceLocation = { id: zone.id, code: zone.code, name: zone.name };
        sourceLocationSource = "WORKER_ZONE";
      }
    }

    if (action === InventoryAction.SHIP && !sourceLocation && product) {
      const shipping = await this.locationResolver.resolveShippingSource(
        userId,
        product.id,
      );
      if (shipping) {
        sourceLocation = {
          id: shipping.id,
          code: shipping.code,
          name: shipping.name,
        };
        sourceLocationSource = "WORKER_ZONE";
      }
    }

    const missingFields = this.findMissingFields({
      action,
      product,
      quantityKnown,
      sourceLocation,
      destinationLocation,
    });
    const fieldConfidence = {
      action: 1,
      product: product ? 1 : 0,
      quantity: quantityKnown ? 1 : 0,
      sourceLocation: sourceLocation ? 1 : 0,
      destinationLocation: destinationLocation ? 1 : 0,
      condition: 1,
      referenceNumber: 0,
    };
    const relevantConfidence = [
      fieldConfidence.action,
      fieldConfidence.product,
      fieldConfidence.quantity,
      action === InventoryAction.RECEIVE
        ? fieldConfidence.destinationLocation
        : fieldConfidence.sourceLocation,
      ...(action === InventoryAction.TRANSFER
        ? [fieldConfidence.destinationLocation]
        : []),
    ];
    const confidence =
      relevantConfidence.reduce((sum, value) => sum + value, 0) /
      relevantConfidence.length;

    return {
      transcript,
      evidenceId: evidenceId ?? null,
      model: "deterministic-fast-path",
      readyForConfirmation: missingFields.length === 0,
      requiresManagerReview: (
        [
          InventoryAction.CYCLE_COUNT,
          InventoryAction.DAMAGE,
        ] as InventoryAction[]
      ).includes(action),
      confidence: Number(confidence.toFixed(3)),
      missingFields,
      lowConfidenceFields: [] as string[],
      clarificationQuestions: this.buildClarificationQuestions(missingFields),
      sourceLocationSource,
      destinationLocationSource,
      fields: {
        action,
        product,
        quantity,
        sourceLocation,
        destinationLocation,
        condition:
          action === InventoryAction.DAMAGE
            ? StockCondition.DAMAGED
            : StockCondition.GOOD,
        referenceNumber: null,
        notes: null,
      },
      fieldConfidence,
      safetyNotice:
        "AI extracted these details but did not create or post an inventory transaction.",
    };
  }

  private inferUnambiguousAction(transcript: string) {
    const spoken = this.normalize(transcript);
    const rules: Array<[InventoryAction, RegExp]> = [
      [InventoryAction.TRANSFER, /\b(?:transfer|transferred|move|moved)\b/],
      [
        InventoryAction.RECEIVE,
        /\b(?:receive|received|incoming|delivered|put|placed|add|added)\b/,
      ],
      [InventoryAction.SHIP, /\b(?:ship|shipped|dispatch|dispatched)\b/],
      [InventoryAction.CYCLE_COUNT, /\b(?:count|counted|cycle count)\b/],
      [InventoryAction.DAMAGE, /\b(?:damage|damaged|broken)\b/],
    ];
    const matches = rules.filter(([, pattern]) => pattern.test(spoken));
    return matches.length === 1 ? matches[0][0] : null;
  }

  private transcriptExplicitlyMentionsProduct(
    spoken: string,
    product: { sku: string; name: string },
  ) {
    const sku = this.normalize(product.sku);
    const skuNumber = sku.replace(/^item\s*/, "");
    const name = this.normalize(product.name);
    return (
      new RegExp(`(?:^|\\s)${this.escapeRegExp(sku)}(?:\\s|$)`).test(spoken) ||
      (skuNumber.length >= 3 &&
        new RegExp(`\\b${this.escapeRegExp(skuNumber)}\\b`).test(spoken)) ||
      new RegExp(`(?:^|\\s)${this.escapeRegExp(name)}(?:\\s|$)`).test(spoken)
    );
  }

  private extractDeterministicQuantity(
    transcript: string,
    productUnit?: string,
  ) {
    const words = this.normalize(transcript).split(" ").filter(Boolean);
    const units = new Set([
      "unit",
      "units",
      "piece",
      "pieces",
      "box",
      "boxes",
      "roll",
      "rolls",
      "pair",
      "pairs",
      "pack",
      "packs",
      "carton",
      "cartons",
    ]);
    const normalizedUnit = productUnit ? this.normalize(productUnit) : "";
    if (normalizedUnit) {
      units.add(normalizedUnit);
      units.add(`${normalizedUnit}s`);
    }

    const numberWords = new Set([
      "zero",
      "one",
      "two",
      "three",
      "four",
      "five",
      "six",
      "seven",
      "eight",
      "nine",
      "ten",
      "eleven",
      "twelve",
      "thirteen",
      "fourteen",
      "fifteen",
      "sixteen",
      "seventeen",
      "eighteen",
      "nineteen",
      "twenty",
      "thirty",
      "forty",
      "fifty",
      "sixty",
      "seventy",
      "eighty",
      "ninety",
      "hundred",
      "and",
    ]);
    const candidates: number[] = [];

    for (let index = 0; index < words.length; index += 1) {
      if (!units.has(words[index])) continue;
      const quantityWords: string[] = [];
      for (
        let cursor = index - 1;
        cursor >= 0 && quantityWords.length < 6;
        cursor -= 1
      ) {
        const word = words[cursor];
        if (!/^\d+$/.test(word) && !numberWords.has(word)) break;
        quantityWords.unshift(word);
      }
      const parsed = this.parseQuantityWords(quantityWords);
      if (parsed !== null) candidates.push(parsed);
    }

    const unique = [...new Set(candidates)];
    return unique.length === 1 ? unique[0] : null;
  }

  private parseQuantityWords(words: string[]) {
    if (words.length === 1 && /^\d+$/.test(words[0])) {
      const value = Number(words[0]);
      return Number.isSafeInteger(value) ? value : null;
    }
    if (words.length === 0 || words.some((word) => /^\d+$/.test(word))) {
      return null;
    }
    const values: Record<string, number> = {
      zero: 0,
      one: 1,
      two: 2,
      three: 3,
      four: 4,
      five: 5,
      six: 6,
      seven: 7,
      eight: 8,
      nine: 9,
      ten: 10,
      eleven: 11,
      twelve: 12,
      thirteen: 13,
      fourteen: 14,
      fifteen: 15,
      sixteen: 16,
      seventeen: 17,
      eighteen: 18,
      nineteen: 19,
      twenty: 20,
      thirty: 30,
      forty: 40,
      fifty: 50,
      sixty: 60,
      seventy: 70,
      eighty: 80,
      ninety: 90,
    };
    let value = 0;
    let current = 0;
    let recognized = false;
    for (const word of words) {
      if (word === "and") continue;
      if (word === "hundred") {
        if (current === 0) return null;
        current *= 100;
        recognized = true;
        continue;
      }
      const numeric = values[word];
      if (numeric === undefined) return null;
      current += numeric;
      recognized = true;
    }
    value += current;
    return recognized && value <= 999_999 ? value : null;
  }

  private extractClarificationQuantity(transcript: string): number | null {
    const match = transcript.match(
      /Clarification answer to "([^"]+)":\s*([^\n]+)/i,
    );
    if (!match || !/quantity|how many|number of/i.test(match[1])) {
      return null;
    }

    const answer = match[2]
      .trim()
      .replace(/[.!?,]+$/g, "")
      .replace(
        /\b(?:units?|pieces?|boxes?|rolls?|pairs?|packs?|cartons?)\b$/i,
        "",
      )
      .trim()
      .toLowerCase();
    if (/^\d+$/.test(answer)) {
      const value = Number(answer);
      return Number.isSafeInteger(value) && value <= 999_999 ? value : null;
    }
    return this.parseQuantityWords(answer.split(/\s+/));
  }

  private async resolveUser(actor: AuthenticatedUser) {
    const user = actor.email
      ? await this.prisma.user.findUnique({
          where: { email: actor.email.toLowerCase() },
        })
      : await this.prisma.user.findUnique({
          where: { employeeId: actor.username.toUpperCase() },
        });
    if (!user) {
      throw new ServiceUnavailableException(
        "The authenticated inventory user profile is unavailable.",
      );
    }
    return user;
  }

  private matchProduct<
    T extends { id: string; sku: string; name: string; unit: string },
  >(
    requestedSku: string,
    transcript: string,
    products: T[],
    allowClarifiedValue = false,
  ) {
    const requested = this.normalize(requestedSku);
    const spoken = this.normalize(transcript);
    const mentionedProducts = products.filter((product) =>
      this.transcriptMentionsProduct(spoken, product),
    );
    const requestedProduct = products.find(
      (product) => this.normalize(product.sku) === requested,
    );
    if (
      requestedProduct &&
      (mentionedProducts.includes(requestedProduct) || allowClarifiedValue)
    ) {
      return requestedProduct;
    }
    return mentionedProducts.length === 1 ? mentionedProducts[0] : null;
  }

  private matchLocation<
    T extends { id: string; code: string; name: string },
  >(
    requestedCode: string,
    transcript: string,
    locations: T[],
    allowClarifiedValue = false,
  ) {
    const requested = this.normalize(requestedCode);
    const spoken = this.normalize(transcript);
    let mentionedLocations = locations.filter((location) =>
      this.transcriptMentionsLocation(spoken, location),
    );
    if (mentionedLocations.length === 0) {
      const fuzzyMatches = locations.filter((location) =>
        this.transcriptFuzzilyMentionsLocation(spoken, location),
      );
      if (fuzzyMatches.length === 1) mentionedLocations = fuzzyMatches;
    }
    const directMatch = locations.find(
      (location) =>
        (this.normalize(location.code) === requested ||
          this.normalize(location.name) === requested) &&
        (mentionedLocations.includes(location) || allowClarifiedValue),
    );
    if (directMatch) return directMatch;
    return mentionedLocations.length === 1 ? mentionedLocations[0] : null;
  }

  private inferLocationFromClarification<
    T extends { id: string; code: string; name: string },
  >(transcript: string, expectedQuestion: string, locations: T[]) {
    const legacyQuestion =
      expectedQuestion === "where did it come from"
        ? "which location did the stock come from"
        : expectedQuestion === "where should it go"
          ? "where did you place the received stock"
          : null;
    const answer =
      this.getClarificationAnswer(transcript, expectedQuestion) ??
      (legacyQuestion
        ? this.getClarificationAnswer(transcript, legacyQuestion)
        : null);
    if (!answer) return null;

    const exactMatches = locations.filter((location) =>
      this.getLocationAliases(location).some((alias) => answer === alias),
    );
    if (exactMatches.length === 1) return exactMatches[0];
    if (exactMatches.length > 1) return null;

    const answerCompact = answer.replaceAll(" ", "");
    const ranked = locations
      .map((location) => {
        const distance = Math.min(
          ...this.getLocationAliases(location).map((alias) =>
            this.levenshteinDistance(
              answerCompact,
              alias.replaceAll(" ", ""),
            ),
          ),
        );
        return { location, distance };
      })
      .sort((left, right) => left.distance - right.distance);
    const best = ranked[0];
    const second = ranked[1];
    if (
      best &&
      best.distance <= 2 &&
      (!second || best.distance < second.distance)
    ) {
      return best.location;
    }
    return null;
  }

  private transcriptMentionsLocation(
    spoken: string,
    location: { code: string; name: string },
  ) {
    return this.getLocationAliases(location).some((alias) => {
      const pattern = new RegExp(
        `(?:^|\\s)${this.escapeRegExp(alias)}(?:\\s|$)`,
      );
      return pattern.test(spoken);
    });
  }

  private transcriptFuzzilyMentionsLocation(
    spoken: string,
    location: { code: string; name: string },
  ) {
    const spokenWords = spoken.split(" ").filter(Boolean);
    return this.getLocationAliases(location).some((alias) => {
      const aliasWords = alias.split(" ").filter(Boolean);
      const aliasCompact = aliasWords.join("");
      if (aliasCompact.length < 5) return false;

      for (
        let start = 0;
        start <= spokenWords.length - aliasWords.length;
        start += 1
      ) {
        const candidate = spokenWords
          .slice(start, start + aliasWords.length)
          .join("");
        if (
          Math.abs(candidate.length - aliasCompact.length) <= 2 &&
          this.levenshteinDistance(candidate, aliasCompact) <= 2
        ) {
          return true;
        }
      }
      return false;
    });
  }

  private getLocationAliases(location: { code: string; name: string }) {
    const code = this.normalize(location.code);
    const name = this.normalize(location.name);
    const aliases = new Set([code, name]);
    aliases.add(code.replaceAll(" ", ""));
    aliases.add(name.replaceAll(" ", ""));

    // Numeric location codes such as "1-1-1" or "1,1,1" are often spoken as
    // "one one one", "one one one" or just "111". Expanding each alias into
    // its spoken number words lets those statements match the location instead
    // of being treated as unknown or mapped to a different shelf.
    for (const alias of [...aliases]) {
      for (const expanded of this.expandSpokenNumberAliases(alias)) {
        aliases.add(expanded);
      }
    }

    if (name === "shelf b" || code === "shelf b") {
      [
        "shelf bee",
        "shelf be",
        "shelfbee",
        "shelfbe",
        "shelby",
        "self b",
        "self bee",
        "self be",
        "selfb",
        "selfbee",
        "selfbe",
      ].forEach((alias) => aliases.add(alias));
    }
    if (name === "dispatch" || code === "dispatch") {
      ["dis patch", "the spatch", "this patch", "spatch"].forEach((alias) =>
        aliases.add(alias),
      );
    }
    return [...aliases].filter(Boolean);
  }

  private expandSpokenNumberAliases(value: string) {
    if (!/\d/.test(value)) return [];
    const spoken = value
      .replace(/\d/g, (digit) => `${this.spokenDigit(digit)} `)
      .trim()
      .replace(/\s+/g, " ");
    const compact = spoken.replaceAll(" ", "");
    return [...new Set([spoken, compact])].filter(
      (alias) => alias.length <= 24,
    );
  }

  private spokenDigit(digit: string) {
    const words: Record<string, string> = {
      "0": "zero",
      "1": "one",
      "2": "two",
      "3": "three",
      "4": "four",
      "5": "five",
      "6": "six",
      "7": "seven",
      "8": "eight",
      "9": "nine",
    };
    return words[digit] ?? digit;
  }

  private findMissingFields(input: {
    action: InventoryAction | null;
    product: unknown;
    quantityKnown: boolean;
    sourceLocation: unknown;
    destinationLocation: unknown;
  }) {
    const missing: string[] = [];
    if (!input.action) missing.push("action");
    if (!input.product) missing.push("product");
    if (!input.quantityKnown) missing.push("quantity");

    if (input.action === InventoryAction.RECEIVE) {
      if (!input.destinationLocation) missing.push("destinationLocation");
    } else if (input.action === InventoryAction.TRANSFER) {
      if (!input.sourceLocation) missing.push("sourceLocation");
      if (!input.destinationLocation) missing.push("destinationLocation");
    } else if (input.action) {
      if (!input.sourceLocation) missing.push("sourceLocation");
    }
    return missing;
  }

  private buildClarificationQuestions(missingFields: string[]) {
    const questions: Record<string, string> = {
      action: "What did you do?",
      product: "Which item?",
      quantity: "How many?",
      sourceLocation: "Where did it come from?",
      destinationLocation: "Where should it go?",
    };
    return missingFields.map((field) => questions[field]);
  }

  private findClarifiedFields(transcript: string) {
    const fieldByQuestion: Record<string, string> = {
      "what did you do": "action",
      "what inventory action did you perform": "action",
      "which inventory action did you perform": "action",
      "which item": "product",
      "which item or sku does this update apply to": "product",
      "how many": "quantity",
      "what quantity should be recorded": "quantity",
      "where did it come from": "sourceLocation",
      "which location did the stock come from": "sourceLocation",
      "where should it go": "destinationLocation",
      "where did you place the received stock": "destinationLocation",
    };
    const fields = new Set<string>();
    const marker =
      /Clarification answer to "([^"]+)":\s*([^\n]+)/gi;
    for (const match of transcript.matchAll(marker)) {
      const question = this.normalize(match[1]);
      const answer = this.normalize(match[2]);
      const field = fieldByQuestion[question];
      if (field && answer && !/\b(?:unknown|unsure|dont know)\b/.test(answer)) {
        fields.add(field);
      }
    }
    return fields;
  }

  private normalize(value: string) {
    return value
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  private transcriptMentionsProduct(
    spoken: string,
    product: { sku: string; name: string },
  ) {
    const sku = this.normalize(product.sku);
    const skuNumber = sku.replace(/^item\s*/, "");
    return (
      spoken.includes(sku) ||
      (skuNumber.length >= 3 &&
        new RegExp(`\\b${this.escapeRegExp(skuNumber)}\\b`).test(spoken)) ||
      spoken.includes(this.normalize(product.name))
    );
  }

  private inferActionFromTranscript(transcript: string) {
    const spoken = this.normalize(transcript);
    const rules: Array<[InventoryAction, RegExp]> = [
      [InventoryAction.TRANSFER, /\b(?:transfer|transferred|move|moved)\b/],
      [InventoryAction.RECEIVE, /\b(?:receive|received|incoming|delivered|put|placed|add|added)\b/],
      [InventoryAction.SHIP, /\b(?:ship|shipped|dispatch|dispatched)\b/],
      [InventoryAction.CYCLE_COUNT, /\b(?:count|counted|cycle count)\b/],
      [InventoryAction.DAMAGE, /\b(?:damage|damaged|broken)\b/],
    ];
    return rules.find(([, pattern]) => pattern.test(spoken))?.[0] ?? null;
  }

  private inferActionFromClarification(transcript: string) {
    const answer =
      this.getClarificationAnswer(transcript, "what did you do") ??
      this.getClarificationAnswer(
        transcript,
        "which inventory action did you perform",
      ) ??
      this.getClarificationAnswer(
        transcript,
        "what inventory action did you perform",
      );
    if (!answer) return null;

    const aliases: Array<[InventoryAction, string[]]> = [
      [
        InventoryAction.RECEIVE,
        [
          "receive",
          "received",
          "incoming",
          "delivery",
          "delivered",
          "put",
          "placed",
          "add",
          "added",
        ],
      ],
      [
        InventoryAction.SHIP,
        ["ship", "shipped", "dispatch", "dispatched"],
      ],
      [
        InventoryAction.TRANSFER,
        ["transfer", "transferred", "move", "moved"],
      ],
      [
        InventoryAction.CYCLE_COUNT,
        [
          "cycle count",
          "cycle account",
          "shaikal count",
          "count",
          "collection",
          "coleccion",
        ],
      ],
      [InventoryAction.DAMAGE, ["damage", "damaged", "broken"]],
    ];

    for (const [action, actionAliases] of aliases) {
      if (
        actionAliases.some(
          (alias) =>
            answer === alias ||
            answer.includes(alias) ||
            this.isClosePhrase(answer, alias),
        )
      ) {
        return action;
      }
    }
    return null;
  }

  private getClarificationAnswer(transcript: string, expectedQuestion: string) {
    const marker =
      /Clarification answer to "([^"]+)":\s*([^\n]+)/gi;
    let answer = "";
    for (const match of transcript.matchAll(marker)) {
      if (this.normalize(match[1]) === this.normalize(expectedQuestion)) {
        answer = this.normalize(match[2]);
      }
    }
    return answer;
  }

  private isClosePhrase(value: string, candidate: string) {
    if (Math.abs(value.length - candidate.length) > 4) return false;
    const limit = Math.max(2, Math.floor(candidate.length * 0.3));
    return this.levenshteinDistance(value, candidate) <= limit;
  }

  private levenshteinDistance(left: string, right: string) {
    const previous = Array.from(
      { length: right.length + 1 },
      (_, index) => index,
    );
    for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
      const current = [leftIndex];
      for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
        current[rightIndex] = Math.min(
          current[rightIndex - 1] + 1,
          previous[rightIndex] + 1,
          previous[rightIndex - 1] +
            (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1),
        );
      }
      previous.splice(0, previous.length, ...current);
    }
    return previous[right.length];
  }

  private hasExplicitQuantity(
    transcript: string,
    quantity: number,
    productSku?: string,
  ) {
    let spoken = this.normalize(transcript);
    if (productSku) {
      const skuNumber = this.normalize(productSku).replace(/^item\s*/, "");
      spoken = spoken.replace(
        new RegExp(`\\bitem\\s+${this.escapeRegExp(skuNumber)}\\b`, "g"),
        " ",
      );
    }

    if (new RegExp(`\\b${quantity}\\b`).test(spoken)) return true;
    const quantityWords = this.numberToWords(quantity);
    return Boolean(quantityWords && spoken.includes(quantityWords));
  }

  private numberToWords(value: number): string {
    const small = [
      "zero",
      "one",
      "two",
      "three",
      "four",
      "five",
      "six",
      "seven",
      "eight",
      "nine",
      "ten",
      "eleven",
      "twelve",
      "thirteen",
      "fourteen",
      "fifteen",
      "sixteen",
      "seventeen",
      "eighteen",
      "nineteen",
    ];
    const tens = [
      "",
      "",
      "twenty",
      "thirty",
      "forty",
      "fifty",
      "sixty",
      "seventy",
      "eighty",
      "ninety",
    ];
    if (value < 0 || value > 999 || !Number.isInteger(value)) return "";
    if (value < 20) return small[value];
    if (value < 100) {
      const remainder = value % 10;
      return `${tens[Math.floor(value / 10)]}${remainder ? ` ${small[remainder]}` : ""}`;
    }
    const remainder = value % 100;
    return `${small[Math.floor(value / 100)]} hundred${
      remainder ? ` ${this.numberToWords(remainder)}` : ""
    }`;
  }

  private escapeRegExp(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}
