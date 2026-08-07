import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  InventoryAction,
  Prisma,
  ReorderStatus,
  TransactionStatus,
  UserRole,
} from "@prisma/client";

import type { AuthenticatedUser } from "../auth/auth-user";
import { PrismaService } from "../prisma/prisma.service";
import { CreateTransactionDto } from "./dto/create-transaction.dto";
import { CreateProductDto, UpdateProductDto } from "./dto/manage-product.dto";
import { CreateLocationDto, UpdateLocationDto } from "./dto/manage-location.dto";
import { OpeningBalanceDto } from "./dto/opening-balance.dto";
import { AdjustBalanceDto } from "./dto/adjust-balance.dto";
import { ReorderDecisionDto } from "./dto/reorder-decision.dto";
import { ReviewTransactionDto } from "./dto/review-transaction.dto";
import { InventoryRulesEngine } from "./rules/inventory-rules.engine";
import { TasksService } from "../tasks/tasks.service";

const transactionInclude = {
  product: true,
  sourceLocation: true,
  destinationLocation: true,
  createdBy: true,
  approvedBy: true,
} satisfies Prisma.InventoryTransactionInclude;

const reorderDraftInclude = {
  product: { include: { supplier: true } },
  location: true,
  approvedBy: true,
  // The expected-receiving task created when the draft was approved, so the
  // manager reorder view can show the linked task status and the executive
  // who claimed it next to each PO.
  receivingTask: { include: { assignedTo: true } },
} satisfies Prisma.ReorderDraftInclude;

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rules: InventoryRulesEngine,
    private readonly tasks: TasksService,
  ) {}

  listProducts() {
    return this.prisma.product.findMany({
      where: { active: true },
      include: {
        supplier: true,
        balances: {
          include: { location: true },
          orderBy: { location: { code: "asc" } },
        },
      },
      orderBy: { name: "asc" },
    });
  }

  async createProduct(input: CreateProductDto) {
    const sku = input.sku.trim().toUpperCase();
    const existing = await this.prisma.product.findUnique({ where: { sku } });
    if (existing && existing.active) {
      throw new ConflictException(`Product SKU ${sku} already exists.`);
    }
    const supplier = input.supplierId ? await this.prisma.supplier.findFirst({ where: { id: input.supplierId, active: true } }) : null;
    if (input.supplierId && !supplier) throw new NotFoundException("Active supplier not found.");
    if (supplier && input.reorderQuantity < supplier.minimumOrderQuantity) {
      throw new BadRequestException(
        `Reorder quantity ${input.reorderQuantity} is below ${supplier.name}'s minimum order quantity of ${supplier.minimumOrderQuantity}.`,
      );
    }
    const data = {
      sku,
      name: input.name.trim(),
      unit: input.unit.trim().toLowerCase(),
      safetyStock: input.safetyStock,
      reorderQuantity: input.reorderQuantity,
      supplierId: supplier?.id ?? null,
      supplierName: (supplier?.name ?? input.supplierName?.trim()) || null,
      supplierEmail: (supplier?.email ?? input.supplierEmail?.trim().toLowerCase()) || null,
      controlled: input.controlled ?? false,
    };
    try {
      if (existing) {
        // A previously deleted (soft-deleted) product with this SKU is restored
        // with the new details so the code can be reused. Any leftover location
        // assignments from before the deletion are cleared so the restored item
        // starts with no stock and must be re-assigned deliberately.
        await this.prisma.$transaction([
          this.prisma.inventoryBalance.deleteMany({
            where: { productId: existing.id },
          }),
          this.prisma.product.update({
            where: { id: existing.id },
            data: { ...data, active: true },
          }),
        ]);
        return this.prisma.product.findUniqueOrThrow({
          where: { id: existing.id },
        });
      }
      return await this.prisma.product.create({ data });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException(`Product SKU ${sku} already exists.`);
      }
      throw error;
    }
  }

  async deactivateProduct(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException("Product not found.");
    if (!product.active) return product;

    // An item with stock on hand cannot be deleted from the master list.
    // Stock must be moved or removed first so the audit ledger keeps a record
    // of every unit instead of silently discarding it.
    const stockedBalances = await this.prisma.inventoryBalance.findMany({
      where: {
        productId: id,
        OR: [{ quantity: { gt: 0 } }, { reservedQuantity: { gt: 0 } }],
      },
      include: { location: true },
    });
    if (stockedBalances.length > 0) {
      const stockSummary = stockedBalances
        .map((balance) => `${balance.location.code} (${balance.quantity} on hand)`)
        .join(", ");
      throw new ConflictException(
        `Product "${product.name}" still has stock on hand at ${stockSummary} and cannot be deleted. Move or remove the stock first, then try again.`,
      );
    }

    await this.prisma.$transaction([
      this.prisma.product.update({ where: { id }, data: { active: false } }),
      // Deleting a product also removes its location assignments (balances),
      // so the item stops appearing at every location. The transaction ledger
      // is preserved and still references the product for the audit trail.
      this.prisma.inventoryBalance.deleteMany({ where: { productId: id } }),
      this.prisma.reorderDraft.updateMany({
        where: { productId: id, status: ReorderStatus.DRAFT },
        data: {
          status: ReorderStatus.CANCELLED,
          activeKey: null,
          cancelledAt: new Date(),
          reviewNotes: "Product was deleted from the master list.",
        },
      }),
    ]);
    return this.prisma.product.findUniqueOrThrow({ where: { id } });
  }

  async updateProduct(id: string, input: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException("Product not found.");
    const sku = input.sku?.trim().toUpperCase();
    if (sku && sku !== product.sku) {
      const duplicate = await this.prisma.product.findUnique({ where: { sku } });
      if (duplicate) throw new ConflictException(`Product SKU ${sku} already exists.`);
    }
    const supplier = input.supplierId ? await this.prisma.supplier.findFirst({ where: { id: input.supplierId, active: true } }) : null;
    if (input.supplierId && !supplier) throw new NotFoundException("Active supplier not found.");
    const effectiveSupplier =
      input.supplierId !== undefined
        ? supplier
        : product.supplierId
          ? await this.prisma.supplier.findFirst({ where: { id: product.supplierId, active: true } })
          : null;
    const effectiveReorderQuantity = input.reorderQuantity ?? product.reorderQuantity;
    if (
      (input.reorderQuantity !== undefined || input.supplierId !== undefined) &&
      effectiveSupplier &&
      effectiveReorderQuantity < effectiveSupplier.minimumOrderQuantity
    ) {
      throw new BadRequestException(
        `Reorder quantity ${effectiveReorderQuantity} is below ${effectiveSupplier.name}'s minimum order quantity of ${effectiveSupplier.minimumOrderQuantity}.`,
      );
    }
    return this.prisma.product.update({
      where: { id },
      data: {
        ...(sku ? { sku } : {}),
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.unit !== undefined ? { unit: input.unit.trim().toLowerCase() } : {}),
        ...(input.safetyStock !== undefined ? { safetyStock: input.safetyStock } : {}),
        ...(input.reorderQuantity !== undefined ? { reorderQuantity: input.reorderQuantity } : {}),
        ...(input.supplierName !== undefined ? { supplierName: input.supplierName.trim() || null } : {}),
        ...(input.supplierEmail !== undefined ? { supplierEmail: input.supplierEmail.trim().toLowerCase() || null } : {}),
        ...(input.supplierId !== undefined ? { supplierId: supplier?.id ?? null, supplierName: supplier?.name ?? null, supplierEmail: supplier?.email ?? null } : {}),
        ...(input.controlled !== undefined ? { controlled: input.controlled } : {}),
      },
    });
  }

  listLocations() {
    return this.prisma.location.findMany({
      where: { active: true },
      orderBy: { code: "asc" },
    });
  }

  async createLocation(input: CreateLocationDto) {
    const code = input.code.trim().toUpperCase();
    if (await this.prisma.location.findUnique({ where: { code } })) throw new ConflictException(`Location code ${code} already exists.`);
    return this.prisma.location.create({ data: { code, name: input.name.trim(), description: input.description?.trim() || null } });
  }

  async updateLocation(id: string, input: UpdateLocationDto) {
    const current = await this.prisma.location.findUnique({ where: { id } });
    if (!current) throw new NotFoundException("Warehouse location not found.");
    const code = input.code?.trim().toUpperCase();
    if (code && code !== current.code && await this.prisma.location.findUnique({ where: { code } })) throw new ConflictException(`Location code ${code} already exists.`);
    if (input.active === false) {
      const [stock, pending] = await Promise.all([
        this.prisma.inventoryBalance.count({ where: { locationId: id, OR: [{ quantity: { gt: 0 } }, { reservedQuantity: { gt: 0 } }] } }),
        this.prisma.inventoryTransaction.count({ where: { status: TransactionStatus.PENDING, OR: [{ sourceLocationId: id }, { destinationLocationId: id }] } }),
      ]);
      if (stock || pending) throw new ConflictException("This location cannot be deactivated while it contains stock or pending transactions.");
    }
    return this.prisma.location.update({ where: { id }, data: { ...(code ? { code } : {}), ...(input.name !== undefined ? { name: input.name.trim() } : {}), ...(input.description !== undefined ? { description: input.description.trim() || null } : {}), ...(input.active !== undefined ? { active: input.active } : {}) } });
  }

  async deleteLocation(id: string) {
    const current = await this.prisma.location.findUnique({ where: { id } });
    if (!current) throw new NotFoundException("Warehouse location not found.");
    const [stock, transactions, drafts, tasks] = await Promise.all([
      this.prisma.inventoryBalance.count({ where: { locationId: id } }),
      this.prisma.inventoryTransaction.count({ where: { OR: [{ sourceLocationId: id }, { destinationLocationId: id }] } }),
      this.prisma.reorderDraft.count({ where: { locationId: id } }),
      this.prisma.inventoryTask.count({ where: { locationId: id } }),
    ]);
    if (stock || transactions || drafts || tasks) {
      throw new ConflictException("This location cannot be deleted because it contains stock, transactions, reorder drafts or assigned tasks. Deactivate it instead to keep the audit history intact.");
    }
    await this.prisma.location.delete({ where: { id } });
    return { deleted: true, id };
  }

  listBalances() {
    // Only active products can hold stock. Filtering here hides balances of
    // previously deleted (soft-deleted) products from every page so a removed
    // item never reappears at a location.
    return this.prisma.inventoryBalance.findMany({
      where: { product: { active: true } },
      include: { product: true, location: true },
      orderBy: [{ location: { code: "asc" } }, { product: { name: "asc" } }],
    });
  }

  async createOpeningBalance(input: OpeningBalanceDto, actor: AuthenticatedUser) {
    this.assertAdministratorAccess(actor);
    if (input.reservedQuantity > input.quantity) {
      throw new BadRequestException("Reserved quantity cannot be greater than the opening quantity.");
    }
    const reason = input.reason.trim();
    if (!reason) throw new BadRequestException("An opening-stock reason is required.");

    const [product, location, user] = await Promise.all([
      this.prisma.product.findFirst({ where: { id: input.productId, active: true } }),
      this.prisma.location.findFirst({ where: { id: input.locationId, active: true } }),
      this.resolveUser(actor),
    ]);
    if (!product) throw new NotFoundException("Active product not found.");
    if (!location) throw new NotFoundException("Active warehouse location not found.");

    try {
      return await this.prisma.$transaction(async (database) => {
        const existing = await database.inventoryBalance.findUnique({
          where: { productId_locationId: { productId: input.productId, locationId: input.locationId } },
        });
        if (existing) throw new ConflictException("This product is already assigned to the selected location. Use an inventory adjustment instead.");

        const balance = await database.inventoryBalance.create({
          data: { productId: input.productId, locationId: input.locationId, quantity: input.quantity, reservedQuantity: input.reservedQuantity },
          include: { product: true, location: true },
        });
        const postedAt = new Date();
        const transaction = await database.inventoryTransaction.create({
          data: {
            action: InventoryAction.CYCLE_COUNT,
            status: TransactionStatus.POSTED,
            productId: input.productId,
            sourceLocationId: input.locationId,
            quantity: input.quantity,
            referenceNumber: `OPENING-${input.effectiveDate.replaceAll("-", "")}`,
            notes: `Opening stock effective ${input.effectiveDate}. ${reason} Reserved quantity: ${input.reservedQuantity}.`,
            createdById: user.id,
            approvedById: user.id,
            confirmedAt: postedAt,
            approvedAt: postedAt,
            postedAt,
          },
          include: transactionInclude,
        });
        return { balance, transaction };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException("This product is already assigned to the selected location.");
      }
      throw error;
    }
  }

  async adjustBalance(input: AdjustBalanceDto, actor: AuthenticatedUser) {
    this.assertAdministratorAccess(actor);
    if (input.reservedQuantity > input.quantity) throw new BadRequestException("Reserved quantity cannot be greater than the corrected quantity.");
    const reason = input.reason.trim();
    if (!reason) throw new BadRequestException("An adjustment reason is required.");
    const user = await this.resolveUser(actor);
    return this.prisma.$transaction(async (database) => {
      const current = await database.inventoryBalance.findUnique({ where: { id: input.balanceId } });
      if (!current) throw new NotFoundException("Inventory balance not found.");
      const balance = await database.inventoryBalance.update({ where: { id: current.id }, data: { quantity: input.quantity, reservedQuantity: input.reservedQuantity }, include: { product: true, location: true } });
      const postedAt = new Date();
      const transaction = await database.inventoryTransaction.create({
        data: { action: InventoryAction.CYCLE_COUNT, status: TransactionStatus.POSTED, productId: current.productId, sourceLocationId: current.locationId, quantity: input.quantity, referenceNumber: `ADJUSTMENT-${postedAt.toISOString().slice(0,10).replaceAll("-","")}`, notes: `Administrator correction from ${current.quantity} on hand / ${current.reservedQuantity} reserved to ${input.quantity} on hand / ${input.reservedQuantity} reserved. Reason: ${reason}`, createdById: user.id, approvedById: user.id, confirmedAt: postedAt, approvedAt: postedAt, postedAt },
        include: transactionInclude,
      });
      return { balance, transaction };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async removeDefaultData(actor: AuthenticatedUser) {
    this.assertManagerAccess(actor);

    // Wipe every inventory record so the application starts empty. Users are
    // preserved so existing sign-in accounts keep working. Deletion order
    // respects foreign keys (child rows first).
    const deleted = await this.prisma.$transaction([
      this.prisma.voiceEvidence.deleteMany(),
      this.prisma.inventoryTask.deleteMany(),
      this.prisma.reorderDraft.deleteMany(),
      this.prisma.inventoryTransaction.deleteMany(),
      this.prisma.inventoryBalance.deleteMany(),
      this.prisma.userAccessAudit.deleteMany(),
      this.prisma.product.deleteMany(),
      this.prisma.location.deleteMany(),
      this.prisma.supplier.deleteMany(),
    ]);

    const counts = {
      voiceEvidence: deleted[0].count,
      tasks: deleted[1].count,
      reorderDrafts: deleted[2].count,
      transactions: deleted[3].count,
      balances: deleted[4].count,
      accessAudit: deleted[5].count,
      products: deleted[6].count,
      locations: deleted[7].count,
      suppliers: deleted[8].count,
    };
    return { cleared: true, counts };
  }

  async listTransactions(actor: AuthenticatedUser) {
    const user = await this.resolveUser(actor);
    const canReviewAll = this.hasManagerAccess(actor);

    return this.prisma.inventoryTransaction.findMany({
      take: 100,
      where: canReviewAll ? undefined : { createdById: user.id },
      include: transactionInclude,
      orderBy: { createdAt: "desc" },
    });
  }

  async listReorderDrafts(actor: AuthenticatedUser) {
    this.assertManagerAccess(actor);
    return this.prisma.reorderDraft.findMany({
      take: 100,
      include: reorderDraftInclude,
      orderBy: { createdAt: "desc" },
    });
  }

  async refreshReorderDrafts(actor: AuthenticatedUser) {
    this.assertManagerAccess(actor);
    const balances = await this.prisma.inventoryBalance.findMany({
      select: { productId: true, locationId: true },
    });
    await this.prisma.$transaction(
      async (database) => {
        const productLocations = new Map<string, Set<string>>();
        balances.forEach(({ productId, locationId }) => {
          const locations =
            productLocations.get(productId) ?? new Set<string>();
          locations.add(locationId);
          productLocations.set(productId, locations);
        });
        for (const [productId, locationIds] of productLocations) {
          await this.syncReorderDrafts(
            database,
            productId,
            [...locationIds],
          );
        }
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    return this.listReorderDrafts(actor);
  }

  async approveReorderDraft(
    id: string,
    input: ReorderDecisionDto,
    actor: AuthenticatedUser,
  ) {
    this.assertManagerAccess(actor);
    const manager = await this.resolveUser(actor);
    const draft = await this.prisma.reorderDraft.findUnique({
      where: { id },
      include: reorderDraftInclude,
    });
    if (!draft) throw new NotFoundException("Reorder draft not found.");
    if (draft.status === ReorderStatus.APPROVED) return draft;
    if (draft.status !== ReorderStatus.DRAFT) {
      throw new ConflictException(
        `A ${draft.status.toLowerCase()} reorder draft cannot be approved.`,
      );
    }
    let approvedQuantity = draft.suggestedQuantity;
    if (input.quantity !== undefined) {
      const minimum = draft.product.supplier?.minimumOrderQuantity ?? 0;
      if (minimum > 0 && input.quantity < minimum) {
        throw new BadRequestException(
          `Order quantity ${input.quantity} is below the supplier minimum order quantity of ${minimum}.`,
        );
      }
      approvedQuantity = input.quantity;
    }
    // The approval and its expected-receiving task are written in one
    // transaction so an approved purchase order always produces exactly one
    // receiving task for the worker queue (the unique sourceReorderDraftId
    // link also protects against duplicates on any retry).
    return this.prisma.$transaction(async (database) => {
      const approved = await database.reorderDraft.update({
        where: { id },
        data: {
          status: ReorderStatus.APPROVED,
          approvedById: manager.id,
          approvedAt: new Date(),
          suggestedQuantity: approvedQuantity,
          reviewNotes: input.note?.trim() || null,
        },
        include: reorderDraftInclude,
      });
      await this.tasks.createExpectedReceivingTask(approved, database);
      return approved;
    });
  }

  async cancelReorderDraft(
    id: string,
    input: ReorderDecisionDto,
    actor: AuthenticatedUser,
  ) {
    this.assertManagerAccess(actor);
    const manager = await this.resolveUser(actor);
    const draft = await this.prisma.reorderDraft.findUnique({
      where: { id },
      include: reorderDraftInclude,
    });
    if (!draft) throw new NotFoundException("Reorder draft not found.");
    if (draft.status === ReorderStatus.CANCELLED) return draft;
    if (
      draft.status !== ReorderStatus.DRAFT &&
      draft.status !== ReorderStatus.APPROVED
    ) {
      throw new ConflictException(
        `A ${draft.status.toLowerCase()} reorder draft cannot be cancelled.`,
      );
    }
    // Cancelling the purchase order also closes its expected-receiving task so
    // the worker queue never shows a receive task for an order that no longer
    // exists. Completed receiving work stays recorded for the audit trail.
    return this.prisma.$transaction(async (database) => {
      const cancelled = await database.reorderDraft.update({
        where: { id },
        data: {
          status: ReorderStatus.CANCELLED,
          activeKey: null,
          approvedById: manager.id,
          cancelledAt: new Date(),
          reviewNotes: input.note?.trim() || null,
        },
        include: reorderDraftInclude,
      });
      await this.tasks.cancelTasksForReorderDraft(id, database);
      return cancelled;
    });
  }

  async getTransaction(id: string, actor: AuthenticatedUser) {
    const transaction = await this.prisma.inventoryTransaction.findUnique({
      where: { id },
      include: transactionInclude,
    });
    if (!transaction) throw new NotFoundException("Transaction not found.");

    const user = await this.resolveUser(actor);
    this.assertTransactionAccess(transaction.createdById, user.id, actor);
    return transaction;
  }

  async createTransaction(
    input: CreateTransactionDto,
    actor: AuthenticatedUser,
  ) {
    this.rules.validateTransaction(input);
    const user = await this.resolveUser(actor);

    const product = await this.prisma.product.findUnique({
      where: { id: input.productId },
      select: { id: true, active: true },
    });
    if (!product?.active) {
      throw new NotFoundException("Active product not found.");
    }

    await this.validateLocationRecords(input);

    if (input.clientRequestId) {
      const existing = await this.prisma.inventoryTransaction.findUnique({
        where: { clientRequestId: input.clientRequestId },
        include: transactionInclude,
      });
      if (existing) {
        this.assertTransactionAccess(existing.createdById, user.id, actor);
        return existing;
      }
    }

    if (input.evidenceId) {
      const evidence = await this.prisma.voiceEvidence.findUnique({
        where: { id: input.evidenceId },
        select: { createdById: true, transactionId: true },
      });
      if (!evidence) throw new NotFoundException("Voice evidence not found.");
      if (evidence.createdById !== user.id) {
        throw new ForbiddenException(
          "Voice evidence belongs to another inventory user.",
        );
      }
      if (evidence.transactionId) {
        throw new ConflictException(
          "This voice evidence is already linked to a transaction.",
        );
      }
    }

    let systemQuantityBefore: number | null = null;
    let discrepancyDifference: number | null = null;
    let discrepancyPercentage: number | null = null;
    let significantDiscrepancy = false;
    if (
      input.sourceLocationId &&
      ([
        InventoryAction.CYCLE_COUNT,
        InventoryAction.DAMAGE,
        InventoryAction.LOSS,
      ] as InventoryAction[]).includes(input.action)
    ) {
      const balance = await this.prisma.inventoryBalance.findUnique({
        where: {
          productId_locationId: {
            productId: input.productId,
            locationId: input.sourceLocationId,
          },
        },
        select: { quantity: true },
      });
      systemQuantityBefore = balance?.quantity ?? 0;
      const resultingQuantity =
        input.action === InventoryAction.CYCLE_COUNT
          ? input.quantity
          : Math.max(0, systemQuantityBefore - input.quantity);
      const discrepancy = this.rules.evaluateDiscrepancy(
        systemQuantityBefore,
        resultingQuantity,
      );
      discrepancyDifference = discrepancy.difference;
      discrepancyPercentage = discrepancy.percentageDifference;
      significantDiscrepancy = discrepancy.significant;
    }

    return this.prisma.$transaction(async (database) => {
      const transaction = await database.inventoryTransaction.create({
        data: {
          action: input.action,
          productId: input.productId,
          quantity: input.quantity,
          condition: input.condition,
          sourceLocationId: input.sourceLocationId,
          destinationLocationId: input.destinationLocationId,
          referenceNumber: input.referenceNumber,
          notes: input.notes,
          transcript: input.transcript,
          clientRequestId: input.clientRequestId,
          systemQuantityBefore,
          discrepancyDifference,
          discrepancyPercentage,
          significantDiscrepancy,
          createdById: user.id,
          status: TransactionStatus.PENDING,
        },
      });
      if (input.evidenceId) {
        await database.voiceEvidence.update({
          where: { id: input.evidenceId },
          data: { transactionId: transaction.id },
        });
      }
      return database.inventoryTransaction.findUniqueOrThrow({
        where: { id: transaction.id },
        include: transactionInclude,
      });
    });
  }

  async confirmTransaction(id: string, actor: AuthenticatedUser) {
    const user = await this.resolveUser(actor);
    const transaction = await this.prisma.inventoryTransaction.findUnique({
      where: { id },
      include: transactionInclude,
    });
    if (!transaction) throw new NotFoundException("Transaction not found.");

    this.assertTransactionAccess(transaction.createdById, user.id, actor);

    if (transaction.status === TransactionStatus.POSTED) {
      return { outcome: "POSTED", idempotent: true, transaction };
    }
    if (transaction.status !== TransactionStatus.PENDING) {
      throw new ConflictException(
        `A ${transaction.status.toLowerCase()} transaction cannot be confirmed.`,
      );
    }

    // §8.1 action-based routing plus the extended §8.2–8.5 risk rules.
    // Either one flagging the transaction routes it to manager review.
    const extendedReview = await this.evaluateManagerReview(transaction);
    if (
      this.rules.requiresManagerReview(transaction.action) ||
      extendedReview.requiresReview
    ) {
      const pendingReview = await this.prisma.inventoryTransaction.update({
        where: { id },
        data: {
          confirmedAt: transaction.confirmedAt ?? new Date(),
          // Record why the transaction is being held for manager review.
          // Preserve the original reasons on an idempotent re-confirm.
          reviewReasons:
            transaction.reviewReasons ??
            (extendedReview.reasons.join("\n") || null),
        },
        include: transactionInclude,
      });
      return {
        outcome: "PENDING_REVIEW",
        idempotent: Boolean(transaction.confirmedAt),
        transaction: pendingReview,
      };
    }

    try {
      const posted = await this.prisma.$transaction(
        async (database) => {
          const current = await database.inventoryTransaction.findUnique({
            where: { id },
          });
          if (!current) throw new NotFoundException("Transaction not found.");
          if (current.status === TransactionStatus.POSTED) return current;
          if (current.status !== TransactionStatus.PENDING) {
            throw new ConflictException(
              `A ${current.status.toLowerCase()} transaction cannot be posted.`,
            );
          }

          await this.applyStockMovement(database, current);
          await this.syncReorderDrafts(
            database,
            current.productId,
            this.getAffectedLocationIds(current),
          );

          return database.inventoryTransaction.update({
            where: { id },
            data: {
              status: TransactionStatus.POSTED,
              confirmedAt: current.confirmedAt ?? new Date(),
              postedAt: new Date(),
            },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );

      const completeTransaction =
        await this.prisma.inventoryTransaction.findUniqueOrThrow({
          where: { id: posted.id },
          include: transactionInclude,
        });
      return {
        outcome: "POSTED",
        idempotent: false,
        transaction: completeTransaction,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2034"
      ) {
        throw new ConflictException(
          "Stock changed during confirmation. Please review and try again.",
        );
      }
      throw error;
    }
  }

  async approveTransaction(
    id: string,
    input: ReviewTransactionDto,
    actor: AuthenticatedUser,
  ) {
    this.assertManagerAccess(actor);
    const manager = await this.resolveUser(actor);
    const transaction = await this.prisma.inventoryTransaction.findUnique({
      where: { id },
      include: transactionInclude,
    });
    if (!transaction) throw new NotFoundException("Transaction not found.");
    if (transaction.status === TransactionStatus.POSTED) {
      return { outcome: "POSTED", idempotent: true, transaction };
    }      await this.assertManagerReviewable(transaction);

    try {
      const posted = await this.prisma.$transaction(
        async (database) => {
          const current = await database.inventoryTransaction.findUnique({
            where: { id },
            include: transactionInclude,
          });
          if (!current) throw new NotFoundException("Transaction not found.");
          if (current.status === TransactionStatus.POSTED) return current;
          await this.assertManagerReviewable(current, database);

          await this.applyManagerApprovedMovement(database, current);
          await this.syncReorderDrafts(
            database,
            current.productId,
            this.getAffectedLocationIds(current),
          );
          return database.inventoryTransaction.update({
            where: { id },
            data: {
              status: TransactionStatus.POSTED,
              approvedById: manager.id,
              approvedAt: new Date(),
              postedAt: new Date(),
              reviewNotes: input.note?.trim() || null,
            },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
      const completeTransaction =
        await this.prisma.inventoryTransaction.findUniqueOrThrow({
          where: { id: posted.id },
          include: transactionInclude,
        });
      return {
        outcome: "POSTED",
        idempotent: false,
        transaction: completeTransaction,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2034"
      ) {
        throw new ConflictException(
          "Stock changed during approval. Review the latest balance and try again.",
        );
      }
      throw error;
    }
  }

  async cancelTransaction(
    id: string,
    input: ReviewTransactionDto,
    actor: AuthenticatedUser,
  ) {
    const user = await this.resolveUser(actor);
    const transaction = await this.prisma.inventoryTransaction.findUnique({
      where: { id },
      include: transactionInclude,
    });
    if (!transaction) throw new NotFoundException("Transaction not found.");

    this.assertTransactionAccess(transaction.createdById, user.id, actor);

    if (transaction.status === TransactionStatus.CANCELLED) {
      return { outcome: "CANCELLED", idempotent: true, transaction };
    }
    if (transaction.status === TransactionStatus.POSTED) {
      throw new ConflictException(
        "A posted transaction cannot be cancelled because it already changed stock.",
      );
    }

    const cancelled = await this.prisma.inventoryTransaction.update({
      where: { id },
      data: {
        status: TransactionStatus.CANCELLED,
        approvedById: user.id,
        approvedAt: new Date(),
        reviewNotes:
          input.note?.trim() ||
          "Cancelled before posting. No stock was changed.",
      },
      include: transactionInclude,
    });
    return { outcome: "CANCELLED", idempotent: false, transaction: cancelled };
  }

  async rejectTransaction(
    id: string,
    input: ReviewTransactionDto,
    actor: AuthenticatedUser,
  ) {
    return this.recordManagerDecision(
      id,
      TransactionStatus.REJECTED,
      "REJECTED",
      input,
      actor,
    );
  }

  async requestRecount(
    id: string,
    input: ReviewTransactionDto,
    actor: AuthenticatedUser,
  ) {
    const result = await this.recordManagerDecision(
      id,
      TransactionStatus.RECOUNT_REQUESTED,
      "RECOUNT_REQUESTED",
      input,
      actor,
    );
    await this.tasks.createRecountTask(result.transaction);
    return result;
  }

  private async recordManagerDecision(
    id: string,
    status: TransactionStatus,
    outcome: "REJECTED" | "RECOUNT_REQUESTED",
    input: ReviewTransactionDto,
    actor: AuthenticatedUser,
  ) {
    this.assertManagerAccess(actor);
    const manager = await this.resolveUser(actor);
    const transaction = await this.prisma.inventoryTransaction.findUnique({
      where: { id },
      include: transactionInclude,
    });
    if (!transaction) throw new NotFoundException("Transaction not found.");
    if (transaction.status === status) {
      return { outcome, idempotent: true, transaction };
    }
    await this.assertManagerReviewable(transaction);

    const reviewed = await this.prisma.inventoryTransaction.update({
      where: { id },
      data: {
        status,
        approvedById: manager.id,
        approvedAt: new Date(),
        reviewNotes: input.note?.trim() || null,
      },
      include: transactionInclude,
    });
    return { outcome, idempotent: false, transaction: reviewed };
  }

  /**
   * Combines the legacy action-based rule (§8.1) with the extended risk rules
   * (§8.2–8.5) into a single decision with human-readable reasons.
   *
   * The extended rules need recent posted history, recent corrections, the
   * product's `controlled` flag and the current available stock at the source
   * location, so those are fetched here before the rules run.
   */
  private async evaluateManagerReview(
    transaction: {
      id: string;
      action: InventoryAction;
      quantity: number;
      productId: string;
      sourceLocationId: string | null;
      destinationLocationId: string | null;
      product?: { id: string; controlled: boolean } | null;
    },
    client: Prisma.TransactionClient = this.prisma,
  ) {
    const [recentTransactions, recentCorrections, balance] = await Promise.all([
      client.inventoryTransaction.findMany({
        where: {
          productId: transaction.productId,
          status: TransactionStatus.POSTED,
          id: { not: transaction.id },
        },
        select: { quantity: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      client.inventoryTransaction.findMany({
        where: {
          productId: transaction.productId,
          status: {
            in: [
              TransactionStatus.CANCELLED,
              TransactionStatus.RECOUNT_REQUESTED,
            ],
          },
          id: { not: transaction.id },
        },
        select: { productId: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      transaction.sourceLocationId
        ? client.inventoryBalance.findUnique({
            where: {
              productId_locationId: {
                productId: transaction.productId,
                locationId: transaction.sourceLocationId,
              },
            },
            select: { quantity: true, reservedQuantity: true },
          })
        : Promise.resolve(null),
    ]);

    return this.rules.requiresManagerReviewExtended({
      action: transaction.action,
      quantity: transaction.quantity,
      productId: transaction.productId,
      sourceLocationId: transaction.sourceLocationId,
      destinationLocationId: transaction.destinationLocationId,
      product: transaction.product ?? undefined,
      availableStock:
        balance === null
          ? undefined
          : Math.max(0, balance.quantity - balance.reservedQuantity),
      recentTransactions,
      recentCorrections,
    });
  }

  private async assertManagerReviewable(
    transaction: {
      id: string;
      action: InventoryAction;
      quantity: number;
      productId: string;
      sourceLocationId: string | null;
      destinationLocationId: string | null;
      status: TransactionStatus;
      confirmedAt: Date | null;
      product?: { id: string; controlled: boolean } | null;
    },
    client: Prisma.TransactionClient = this.prisma,
  ) {
    // §8.1 remains the fast path; the extended §8.2–8.5 rules are only
    // consulted when the action alone would not flag the transaction.
    if (!this.rules.requiresManagerReview(transaction.action)) {
      const review = await this.evaluateManagerReview(transaction, client);
      if (!review.requiresReview) {
        throw new BadRequestException(
          "This transaction does not require manager review.",
        );
      }
    }
    if (!transaction.confirmedAt) {
      throw new ConflictException(
        "The worker must confirm this transaction before manager review.",
      );
    }
    if (transaction.status !== TransactionStatus.PENDING) {
      throw new ConflictException(
        `A ${transaction.status.toLowerCase()} transaction cannot be reviewed.`,
      );
    }
  }

  private async applyStockMovement(
    database: Prisma.TransactionClient,
    transaction: {
      action: InventoryAction;
      productId: string;
      quantity: number;
      sourceLocationId: string | null;
      destinationLocationId: string | null;
    },
  ) {
    if (transaction.action === InventoryAction.RECEIVE) {
      await this.increaseBalance(
        database,
        transaction.productId,
        transaction.destinationLocationId!,
        transaction.quantity,
      );
      return;
    }

    if (
      transaction.action === InventoryAction.SHIP ||
      transaction.action === InventoryAction.USE
    ) {
      await this.decreaseBalance(
        database,
        transaction.productId,
        transaction.sourceLocationId!,
        transaction.quantity,
      );
      return;
    }

    if (transaction.action === InventoryAction.TRANSFER) {
      await this.decreaseBalance(
        database,
        transaction.productId,
        transaction.sourceLocationId!,
        transaction.quantity,
      );
      await this.increaseBalance(
        database,
        transaction.productId,
        transaction.destinationLocationId!,
        transaction.quantity,
      );
      return;
    }

    throw new BadRequestException(
      `${transaction.action} requires manager review before stock can change.`,
    );
  }

  private async applyManagerApprovedMovement(
    database: Prisma.TransactionClient,
    transaction: {
      action: InventoryAction;
      productId: string;
      quantity: number;
      sourceLocationId: string | null;
    },
  ) {
    if (transaction.action === InventoryAction.CYCLE_COUNT) {
      const balance = await database.inventoryBalance.findUnique({
        where: {
          productId_locationId: {
            productId: transaction.productId,
            locationId: transaction.sourceLocationId!,
          },
        },
      });
      this.rules.assertCycleCountAllowed(
        transaction.quantity,
        balance?.reservedQuantity ?? 0,
      );
      await database.inventoryBalance.upsert({
        where: {
          productId_locationId: {
            productId: transaction.productId,
            locationId: transaction.sourceLocationId!,
          },
        },
        update: { quantity: transaction.quantity },
        create: {
          productId: transaction.productId,
          locationId: transaction.sourceLocationId!,
          quantity: transaction.quantity,
        },
      });
      return;
    }
    if (
      transaction.action === InventoryAction.DAMAGE ||
      transaction.action === InventoryAction.LOSS
    ) {
      await this.decreaseBalance(
        database,
        transaction.productId,
        transaction.sourceLocationId!,
        transaction.quantity,
      );
      return;
    }
    throw new BadRequestException(
      "This action does not use the manager approval workflow.",
    );
  }

  private getAffectedLocationIds(transaction: {
    sourceLocationId: string | null;
    destinationLocationId?: string | null;
  }) {
    return [
      ...new Set(
        [
          transaction.sourceLocationId,
          transaction.destinationLocationId,
        ].filter((id): id is string => Boolean(id)),
      ),
    ];
  }

  private async syncReorderDrafts(
    database: Prisma.TransactionClient,
    productId: string,
    locationIds: string[],
  ) {
    const product = await database.product.findUnique({
      where: { id: productId },
      select: {
        active: true,
        safetyStock: true,
        reorderQuantity: true,
        supplier: { select: { minimumOrderQuantity: true } },
      },
    });
    if (!product) throw new NotFoundException("Product not found.");
    if (!product.active) return; // Deleted products must never generate reorder drafts.

    for (const locationId of locationIds) {
      const activeKey = `${productId}:${locationId}`;
      const [balance, activeDraft] = await Promise.all([
        database.inventoryBalance.findUnique({
          where: { productId_locationId: { productId, locationId } },
        }),
        database.reorderDraft.findUnique({ where: { activeKey } }),
      ]);
      const reorder = this.rules.evaluateReorder(
        balance?.quantity ?? 0,
        balance?.reservedQuantity ?? 0,
        product.safetyStock,
        product.reorderQuantity,
      );
      const { available, lowStock } = reorder;
      const suggestedQuantity = Math.max(reorder.suggestedQuantity, product.supplier?.minimumOrderQuantity ?? 0);

      if (lowStock) {
        if (activeDraft) {
          await database.reorderDraft.update({
            where: { id: activeDraft.id },
            data:
              activeDraft.status === ReorderStatus.DRAFT
                ? {
                    currentStock: available,
                    safetyStock: product.safetyStock,
                    suggestedQuantity,
                  }
                : {
                    currentStock: available,
                    safetyStock: product.safetyStock,
                  },
          });
        } else {
          await database.reorderDraft.create({
            data: {
              activeKey,
              productId,
              locationId,
              currentStock: available,
              safetyStock: product.safetyStock,
              suggestedQuantity,
              status: ReorderStatus.DRAFT,
            },
          });
        }
      } else if (activeDraft) {
        await database.reorderDraft.update({
          where: { id: activeDraft.id },
          data:
            activeDraft.status === ReorderStatus.DRAFT
              ? {
                  status: ReorderStatus.CANCELLED,
                  activeKey: null,
                  currentStock: available,
                  cancelledAt: new Date(),
                  reviewNotes:
                    "Automatically cancelled because available stock recovered.",
                }
              : {
                  status: ReorderStatus.CANCELLED,
                  activeKey: null,
                  currentStock: available,
                  cancelledAt: new Date(),
                  reviewNotes:
                    "Purchase order fulfilled — the ordered stock was received. The reorder was removed from the active list.",
                },
        });
        // When an approved order is auto-cancelled (for example because the
        // ordered stock was received), close its expected-receiving task too.
        await this.tasks.cancelTasksForReorderDraft(activeDraft.id, database);
      }
    }
  }

  private increaseBalance(
    database: Prisma.TransactionClient,
    productId: string,
    locationId: string,
    quantity: number,
  ) {
    return database.inventoryBalance.upsert({
      where: { productId_locationId: { productId, locationId } },
      update: { quantity: { increment: quantity } },
      create: { productId, locationId, quantity },
    });
  }

  private async decreaseBalance(
    database: Prisma.TransactionClient,
    productId: string,
    locationId: string,
    quantity: number,
  ) {
    const balance = await database.inventoryBalance.findUnique({
      where: { productId_locationId: { productId, locationId } },
    });
    this.rules.assertAvailableStock(
      quantity,
      balance?.quantity ?? 0,
      balance?.reservedQuantity ?? 0,
    );

    return database.inventoryBalance.update({
      where: { productId_locationId: { productId, locationId } },
      data: { quantity: { decrement: quantity } },
    });
  }

  private async resolveUser(actor: AuthenticatedUser) {
    const email = actor.email?.toLowerCase();
    const existing = email
      ? await this.prisma.user.findUnique({ where: { email } })
      : await this.prisma.user.findUnique({
          where: { employeeId: actor.username.toUpperCase() },
        });
    if (existing) return existing;

    const role = actor.roles.includes("administrator")
      ? UserRole.ADMINISTRATOR
      : actor.roles.includes("manager")
        ? UserRole.MANAGER
        : UserRole.WORKER;

    return this.prisma.user.create({
      data: {
        employeeId: actor.username.toUpperCase(),
        email: email ?? `${actor.username}@keycloak.local`,
        displayName: actor.username,
        role,
      },
    });
  }

  private assertTransactionAccess(
    createdById: string | null,
    userId: string,
    actor: AuthenticatedUser,
  ) {
    if (this.hasManagerAccess(actor) || createdById === userId) return;
    throw new ForbiddenException(
      "Workers can access only their own inventory transactions.",
    );
  }

  private hasManagerAccess(actor: AuthenticatedUser) {
    return (
      actor.roles.includes("manager") ||
      actor.roles.includes("administrator")
    );
  }

  private assertManagerAccess(actor: AuthenticatedUser) {
    if (this.hasManagerAccess(actor)) return;
    throw new ForbiddenException(
      "Manager access is required to review this transaction.",
    );
  }

  private assertAdministratorAccess(actor: AuthenticatedUser) {
    if (actor.roles.includes("administrator")) return;
    throw new ForbiddenException("Administrator access is required to set opening stock.");
  }

  private async validateLocationRecords(input: CreateTransactionDto) {
    const locationIds = [
      input.sourceLocationId,
      input.destinationLocationId,
    ].filter((id): id is string => Boolean(id));
    if (!locationIds.length) return;

    const uniqueIds = [...new Set(locationIds)];
    const activeLocations = await this.prisma.location.count({
      where: { id: { in: uniqueIds }, active: true },
    });
    if (activeLocations !== uniqueIds.length) {
      throw new NotFoundException("An active warehouse location was not found.");
    }
  }

  private validateLocations(input: CreateTransactionDto) {
    const sourceActions: InventoryAction[] = [
      InventoryAction.SHIP,
      InventoryAction.USE,
      InventoryAction.CYCLE_COUNT,
      InventoryAction.DAMAGE,
      InventoryAction.LOSS,
    ];
    const needsSource = sourceActions.includes(input.action);

    if (
      input.action === InventoryAction.RECEIVE &&
      !input.destinationLocationId
    ) {
      throw new BadRequestException(
        "Receiving stock requires a destination location.",
      );
    }
    if (needsSource && !input.sourceLocationId) {
      throw new BadRequestException(
        `${input.action} requires a source location.`,
      );
    }
    if (
      input.action === InventoryAction.TRANSFER &&
      (!input.sourceLocationId || !input.destinationLocationId)
    ) {
      throw new BadRequestException(
        "A transfer requires both source and destination locations.",
      );
    }
    if (
      input.sourceLocationId &&
      input.sourceLocationId === input.destinationLocationId
    ) {
      throw new BadRequestException(
        "Source and destination locations must be different.",
      );
    }
    if (input.action !== InventoryAction.CYCLE_COUNT && input.quantity === 0) {
      throw new BadRequestException("Quantity must be greater than zero.");
    }
  }
}
