import { InventoryAction } from "@prisma/client";

import type { AuthenticatedUser } from "../auth/auth-user";
import type { LocationResolverService } from "../inventory/location-resolver.service";
import type { PrismaService } from "../prisma/prisma.service";
import { AiService } from "./ai.service";

const actor: AuthenticatedUser = {
  subject: "keycloak-worker",
  username: "worker1",
  email: "worker1@nirka.local",
  roles: ["worker"],
};

const products = [
  {
    id: "product-cable",
    sku: "ITEM-108",
    name: "Cable",
    unit: "unit",
    safetyStock: 12,
  },
];

const locations = [
  { id: "location-1", code: "L001", name: "Storage 1" },
  { id: "location-3", code: "L003", name: "Storage 3" },
];

describe("AiService deterministic extraction", () => {
  let service: AiService;
  let fetchSpy: jest.SpyInstance;
  const originalAiEnv = {
    apiKey: process.env.RUNPOD_API_KEY,
    endpointId: process.env.RUNPOD_ENDPOINT_ID,
    model: process.env.RUNPOD_MODEL,
    numPredict: process.env.RUNPOD_NUM_PREDICT,
    numCtx: process.env.RUNPOD_NUM_CTX,
  };

  beforeEach(() => {
    process.env.RUNPOD_API_KEY = "runpod-test-key";
    process.env.RUNPOD_ENDPOINT_ID = "test-endpoint";
    process.env.RUNPOD_MODEL = "Qwen/Qwen3-4B";
    process.env.RUNPOD_NUM_PREDICT = "256";
    process.env.RUNPOD_NUM_CTX = "2048";
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: "user-worker",
          employeeId: "WORKER1",
          email: "worker1@nirka.local",
        }),
      },
      product: { findMany: jest.fn().mockResolvedValue(products) },
      location: { findMany: jest.fn().mockResolvedValue(locations) },
      voiceEvidence: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };
    const resolver = {
      resolveWorkerZone: jest.fn().mockResolvedValue(null),
      resolveShippingSource: jest.fn().mockResolvedValue(null),
    };
    service = new AiService(
      prisma as unknown as PrismaService,
      resolver as unknown as LocationResolverService,
    );
    fetchSpy = jest.spyOn(global, "fetch");
  });

  afterEach(() => {
    fetchSpy.mockRestore();
    process.env.RUNPOD_API_KEY = originalAiEnv.apiKey;
    process.env.RUNPOD_ENDPOINT_ID = originalAiEnv.endpointId;
    process.env.RUNPOD_MODEL = originalAiEnv.model;
    process.env.RUNPOD_NUM_PREDICT = originalAiEnv.numPredict;
    process.env.RUNPOD_NUM_CTX = originalAiEnv.numCtx;
  });

  it.each([
    [
      "Received five units of Cable into Storage 1.",
      InventoryAction.RECEIVE,
      null,
      "L001",
      5,
    ],
    [
      "Shipped one unit of Cable from Storage 1.",
      InventoryAction.SHIP,
      "L001",
      null,
      1,
    ],
    [
      "Transferred one unit of Cable from Storage 1 to Storage 3.",
      InventoryAction.TRANSFER,
      "L001",
      "L003",
      1,
    ],
    [
      "Counted fifty units of Cable at Storage 1.",
      InventoryAction.CYCLE_COUNT,
      "L001",
      null,
      50,
    ],
    [
      "Damaged one unit of Cable at Storage 1.",
      InventoryAction.DAMAGE,
      "L001",
      null,
      1,
    ],
  ])(
    "extracts %s without calling Runpod",
    async (transcript, action, source, destination, quantity) => {
      const result = await service.extractInventory({ transcript }, actor);

      expect(result.model).toBe("deterministic-fast-path");
      expect(result.readyForConfirmation).toBe(true);
      expect(result.fields.action).toBe(action);
      expect(result.fields.product?.sku).toBe("ITEM-108");
      expect(result.fields.quantity).toBe(quantity);
      expect(result.fields.sourceLocation?.code ?? null).toBe(source);
      expect(result.fields.destinationLocation?.code ?? null).toBe(destination);
      expect(fetchSpy).not.toHaveBeenCalled();
    },
  );

  it("returns one missing-location question immediately", async () => {
    const result = await service.extractInventory(
      { transcript: "Received five units of Cable." },
      actor,
    );

    expect(result.model).toBe("deterministic-fast-path");
    expect(result.readyForConfirmation).toBe(false);
    expect(result.missingFields).toEqual(["destinationLocation"]);
    expect(result.clarificationQuestions).toEqual([
      "Where should it go?",
    ]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("uses a bare numeric transcript as the quantity for an assigned recount task", async () => {
    const result = await service.extractInventory(
      {
        transcript: "100.",
        context: {
          action: "CYCLE_COUNT",
          productSku: "ITEM-108",
          productName: "Cable",
          sourceLocationCode: "L001",
        },
      },
      actor,
    );

    expect(result.model).toBe("deterministic-fast-path");
    expect(result.readyForConfirmation).toBe(true);
    expect(result.fields.action).toBe(InventoryAction.CYCLE_COUNT);
    expect(result.fields.product?.sku).toBe("ITEM-108");
    expect(result.fields.quantity).toBe(100);
    expect(result.fields.sourceLocation?.code).toBe("L001");
    expect(result.missingFields).not.toContain("quantity");
    expect(result.clarificationQuestions).not.toContain("How many?");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("uses Qwen when a reference must be extracted", async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => ({
        status: "COMPLETED",
        output: [
          {
            choices: [
              {
                tokens: [
                  JSON.stringify({
                    action: "SHIP",
                    productSku: "ITEM-108",
                    quantity: 1,
                    quantityKnown: true,
                    sourceLocationCode: "L001",
                    destinationLocationCode: "",
                    condition: "GOOD",
                    referenceNumber: "ORDER-1001",
                    notes: "",
                    fieldConfidence: {
                      action: 1,
                      product: 1,
                      quantity: 1,
                      sourceLocation: 1,
                      destinationLocation: 0,
                      condition: 1,
                      referenceNumber: 1,
                    },
                  }),
                ],
              },
            ],
          },
        ],
      }),
    } as Response);

    const result = await service.extractInventory(
      {
        transcript:
          "Shipped one unit of Cable from Storage 1 for ORDER-1001.",
      },
      actor,
    );

    expect(result.model).toBe("Qwen/Qwen3-4B");
    expect(result.fields.referenceNumber).toBe("ORDER-1001");
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    const [url, request] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://api.runpod.ai/v2/test-endpoint/runsync",
    );
    expect(request.headers).toEqual({
      Authorization: "Bearer runpod-test-key",
      "Content-Type": "application/json",
    });
    const body = JSON.parse(String(request.body));
    expect(String(request.body)).not.toContain("runpod-test-key");
    expect(body.input.messages).toHaveLength(2);
    expect(body.input.sampling_params).toMatchObject({
      temperature: 0,
      seed: 42,
      max_tokens: 256,
      truncate_prompt_tokens: 2048,
      chat_template_kwargs: { enable_thinking: false },
      structured_outputs: { json: expect.any(Object) },
    });
    expect(body.input).not.toHaveProperty("keep_alive");
    expect(body.input).not.toHaveProperty("format");
  });

  it("accepts a bare number as the answer to a quantity clarification", async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => ({
        status: "COMPLETED",
        output: [
          {
            choices: [
              {
                tokens: [
                  JSON.stringify({
                    action: "CYCLE_COUNT",
                    productSku: "ITEM-108",
                    quantity: 0,
                    quantityKnown: false,
                    sourceLocationCode: "L001",
                    destinationLocationCode: "",
                    condition: "GOOD",
                    referenceNumber: "",
                    notes: "",
                    fieldConfidence: {
                      action: 1,
                      product: 1,
                      quantity: 0,
                      sourceLocation: 1,
                      destinationLocation: 1,
                      condition: 1,
                      referenceNumber: 0,
                    },
                  }),
                ],
              },
            ],
          },
        ],
      }),
    } as Response);

    const result = await service.extractInventory(
      {
        transcript:
          'Counted Cable at Storage 1. Clarification answer to "What quantity should be recorded?": 100.',
      },
      actor,
    );

    expect(result.fields.quantity).toBe(100);
    expect(result.missingFields).not.toContain("quantity");
    expect(result.clarificationQuestions).not.toContain(
      "What quantity should be recorded?",
    );
  });
});
