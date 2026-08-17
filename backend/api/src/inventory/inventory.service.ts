import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  type LocationSource,
  DiscrepancyAuditAction,
  DiscrepancyStatus,
  InventoryAction,
  NotificationType,
  Prisma,
  ReorderStatus,
  TaskStatus,
  TaskType,
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
import { ReviewTransactionDto } from "./dto/review-transaction.dto";
import { InventoryRulesEngine } from "./rules/inventory-rules.engine";
import { TasksService } from "../tasks/tasks.service";
import { DiscrepancyRulesService } from "../discrepancies/discrepancy-rules.service";
import { DiscrepanciesService } from "../discrepancies/discrepancies.service";
import { DiscrepancyAuditService } from "../discrepancies/discrepancy-audit.service";
import { NotificationsService } from "../notifications/notifications.service";
import { ReservationsService } from "../reservations/reservations.service";

const transactionInclude = {
  product: true,
  sourceLocation: true,
  destinationLocation: true,
  createdBy: true,
  approvedBy: true,
  // Managers show a photo-evidence badge with the number of photos attached
  // to each transaction (worker uploads for Damage/Receive).
  _count: { select: { evidence: true } },
  // The shipment task a transaction was created from (one-to-one via the
  // task's sourceTransactionId) so the confirmation router can apply the
  // reservation-aware shipment posting.
  task: true,
} satisfies Prisma.InventoryTransactionInclude;

const reorderDraftInclude = {
  product: { include: { supplier: true } },
  location: true,
} satisfies Prisma.ReorderDraftInclude;

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rules: InventoryRulesEngine,
    private readonly tasks: TasksService,
    private readonly discrepancyRules: DiscrepancyRulesService,
    private readonly discrepancies: DiscrepanciesService,
    private readonly auditService: DiscrepancyAuditService,
    private readonly notifications: NotificationsService,
    private readonly reservations: ReservationsService,
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

  async deactivateProduct(id: string, administratorOverride = false) {
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
    if (stockedBalances.length > 0 && !administratorOverride) {
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
      ...(stockedBalances.length === 0
        ? [this.prisma.inventoryBalance.deleteMany({ where: { productId: id } })]
        : []),
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
            systemQuantityBefore: 0,
            systemQuantityAfter: input.quantity,
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
        data: { action: InventoryAction.CYCLE_COUNT, status: TransactionStatus.POSTED, productId: current.productId, sourceLocationId: current.locationId, quantity: input.quantity, systemQuantityBefore: current.quantity, systemQuantityAfter: input.quantity, referenceNumber: `ADJUSTMENT-${postedAt.toISOString().slice(0,10).replaceAll("-","")}`, notes: `Administrator correction from ${current.quantity} on hand / ${current.reservedQuantity} reserved to ${input.quantity} on hand / ${input.reservedQuantity} reserved. Reason: ${reason}`, createdById: user.id, approvedById: user.id, confirmedAt: postedAt, approvedAt: postedAt, postedAt },
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
      this.prisma.discrepancy.deleteMany(),
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
      discrepancies: deleted[1].count,
      tasks: deleted[2].count,
      reorderDrafts: deleted[3].count,
      transactions: deleted[4].count,
      balances: deleted[5].count,
      accessAudit: deleted[6].count,
      products: deleted[7].count,
      locations: deleted[8].count,
      suppliers: deleted[9].count,
    };
    return { cleared: true, counts };
  }

  async listTransactions(actor: AuthenticatedUser) {
    const user = await this.resolveUser(actor);
    const canReviewAll = this.hasManagerAccess(actor);

    if (!canReviewAll) {
      return this.prisma.inventoryTransaction.findMany({
        take: 100,
        where: { createdById: user.id },
        include: transactionInclude,
        orderBy: { createdAt: "desc" },
      });
    }

    // Pending approvals must never disappear simply because more than 100
    // newer history records exist. Return every worker-confirmed pending
    // transaction together with the newest ledger records, then remove any
    // overlap between the two result sets.
    const [pendingApprovals, recentTransactions] = await Promise.all([
      this.prisma.inventoryTransaction.findMany({
        where: {
          status: TransactionStatus.PENDING,
          confirmedAt: { not: null },
        },
        include: transactionInclude,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.inventoryTransaction.findMany({
        take: 100,
        include: transactionInclude,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return Array.from(
      new Map(
        [...pendingApprovals, ...recentTransactions].map((transaction) => [
          transaction.id,
          transaction,
        ]),
      ).values(),
    ).sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
  }

  async listReorderDrafts(actor: AuthenticatedUser) {
    this.assertManagerAccess(actor);
    return this.prisma.reorderDraft.findMany({
      take: 100,
      where: {
        status: ReorderStatus.DRAFT,
        activeKey: { not: null },
        product: { active: true },
      },
      include: reorderDraftInclude,
      orderBy: { createdAt: "desc" },
    });
  }

  async refreshReorderDrafts(actor: AuthenticatedUser) {
    this.assertManagerAccess(actor);
    // Refresh every active product, including products whose only assignments
    // currently have zero stock. This keeps Purchase Items complete while
    // still excluding deleted catalogue records.
    const products = await this.prisma.product.findMany({
      where: { active: true },
      select: {
        id: true,
        balances: { select: { locationId: true } },
      },
      orderBy: { sku: "asc" },
    });
    for (const product of products) {
      await this.syncReorderDraftsWithRetry(
        product.id,
        [...new Set(product.balances.map((balance) => balance.locationId))],
      );
    }
    return this.listReorderDrafts(actor);
  }

  /**
   * Keep each product refresh in a short transaction and retry the two safe
   * concurrency outcomes. This prevents manual Purchase Items refreshes from
   * intermittently failing when a stock movement updates the same SKU.
   */
  private async syncReorderDraftsWithRetry(
    productId: string,
    locationIds: string[],
  ) {
    let attemptsLeft = 3;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        await this.prisma.$transaction(
          (database) => this.syncReorderDrafts(database, productId, locationIds),
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );
        return;
      } catch (error) {
        const retryable =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          (error.code === "P2034" || error.code === "P2002");
        if (retryable && attemptsLeft > 0) {
          attemptsLeft -= 1;
          continue;
        }
        if (retryable) {
          throw new ConflictException(
            "Purchase Items changed during refresh. Please refresh once more.",
          );
        }
        throw error;
      }
    }
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
    // Audit ledger snapshot: the primary location is the destination for a
    // Receive and the source for every other movement.
    const primaryLocationId =
      input.action === InventoryAction.RECEIVE
        ? input.destinationLocationId
        : input.sourceLocationId;
    if (primaryLocationId) {
      const balance = await this.prisma.inventoryBalance.findUnique({
        where: {
          productId_locationId: {
            productId: input.productId,
            locationId: primaryLocationId,
          },
        },
        select: { quantity: true },
      });
      systemQuantityBefore = balance?.quantity ?? 0;
    }
    if (
      input.action === InventoryAction.CYCLE_COUNT ||
      input.action === InventoryAction.DAMAGE ||
      input.action === InventoryAction.LOSS
    ) {
      const expectedQuantity = systemQuantityBefore ?? 0;
      const resultingQuantity =
        input.action === InventoryAction.CYCLE_COUNT
          ? input.quantity
          : Math.max(0, expectedQuantity - input.quantity);
      const discrepancy = this.rules.evaluateDiscrepancy(
        expectedQuantity,
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
          sourceLocationSource: input.sourceLocationSource as LocationSource | null | undefined,
          destinationLocationSource: input.destinationLocationSource as LocationSource | null | undefined,
          referenceNumber: input.referenceNumber,
          notes: input.notes,
          transcript: input.transcript,
          clientRequestId: input.clientRequestId,
          recountTaskId: input.recountTaskId ?? null,
          systemQuantityBefore,
          discrepancyDifference,
          discrepancyPercentage,
          significantDiscrepancy,
          createdById: user.id,
          status: TransactionStatus.PENDING,
        },
      });
      // A voice-confirmed reservation shipment links its Ship transaction to
      // the assigned SHIP task. The confirmation router then applies the
      // reservation-aware movement (on-hand and reserved both decrease and
      // the reservation moves towards fulfilled) instead of a plain Ship.
      if (input.taskId) {
        const task = await database.inventoryTask.findUnique({ where: { id: input.taskId } });
        if (!task || task.type !== TaskType.SHIP || !task.reservationId) {
          throw new BadRequestException("This task is not a reservation shipment task.");
        }
        if (task.status === TaskStatus.COMPLETED || task.status === TaskStatus.CANCELLED) {
          throw new ConflictException("This shipment task can no longer be worked on.");
        }
        if (!task.assignedToId || task.assignedToId !== user.id) {
          throw new ForbiddenException("This shipment task is assigned to another warehouse executive.");
        }
        if (task.productId !== input.productId || task.sourceLocationId !== input.sourceLocationId) {
          throw new BadRequestException("The transaction details do not match the assigned shipment task.");
        }
        await database.inventoryTask.update({
          where: { id: task.id },
          data: { sourceTransactionId: transaction.id },
        });
      }
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

    // Cycle Count uses the discrepancy rules to decide routing.
    if (transaction.action === InventoryAction.CYCLE_COUNT) {
      return this.confirmCycleCount(transaction, id, user);
    }

    // A Ship transaction created from an assigned reservation shipment task
    // posts through the reservation-aware movement: on-hand AND reserved both
    // decrease, the reservation advances towards fulfilled, the task is
    // completed and audit + notification records are written atomically.
    if (transaction.task?.type === TaskType.SHIP && transaction.task?.reservationId) {
      return this.reservations.confirmShipmentTransaction(id, actor);
    }

    // Only Cycle Count and Damage can require manager review. The extended
    // evaluator adds risk reasons to those actions; it does not escalate a
    // normal Receive, Ship or Transfer movement.
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

          const movement = await this.applyStockMovement(database, current);
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
              systemQuantityAfter: movement.primaryQuantityAfter,
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

  /**
   * Cycle Count confirm routing.
   *
   * The expected quantity always comes from the database balance — never
   * from the client. A matching count posts normally; a differing count
   * creates one discrepancy (unique per transaction) and stays pending
   * review with stock unchanged. The transaction update and the discrepancy
   * creation run in a single atomic transaction.
   */
  private async confirmCycleCount(
    transaction: {
      id: string;
      productId: string;
      sourceLocationId: string | null;
      quantity: number;
      createdById: string | null;
      notes: string | null;
      transcript: string | null;
      confirmedAt: Date | null;
      reviewReasons: string | null;
      recountTaskId?: string | null;
      product?: { controlled?: boolean } | null;
    },
    id: string,
    user: { id: string },
  ) {
    if (!transaction.sourceLocationId) {
      throw new BadRequestException(
        "A cycle count requires a source location.",
      );
    }
    const balance = await this.prisma.inventoryBalance.findUnique({
      where: {
        productId_locationId: {
          productId: transaction.productId,
          locationId: transaction.sourceLocationId,
        },
      },
      select: { quantity: true, reservedQuantity: true },
    });
    const expectedQuantity = balance?.quantity ?? 0;
    const controlled = transaction.product?.controlled ?? false;
    const evaluation = this.discrepancyRules.evaluateDiscrepancy(
      expectedQuantity,
      transaction.quantity,
      controlled,
    );

    // A cycle count created as the result of a recount task must resolve the
    // original discrepancy instead of creating an unrelated duplicate case.
    if (transaction.recountTaskId) {
      return this.confirmRecountResult(
        transaction,
        id,
        user,
        expectedQuantity,
        evaluation,
      );
    }

    // Matching count completes normally — posted directly, no discrepancy.
    if (evaluation.severity === "NONE") {
      return this.postMatchingCycleCount(id);
    }

    // Differing count: create the discrepancy and route to review atomically.
    try {
      const pendingReview = await this.prisma.$transaction(
        async (database) => {
          // Unique transactionId constraint prevents duplicate cases.
          const existing = await database.discrepancy.findUnique({
            where: { transactionId: id },
            select: { id: true },
          });
          if (!existing) {
            await this.discrepancies.createForCycleCount(database, {
              transactionId: id,
              productId: transaction.productId,
              locationId: transaction.sourceLocationId!,
              expectedQuantity,
              countedQuantity: transaction.quantity,
              workerId: transaction.createdById ?? user.id,
              workerNotes:
                transaction.notes ?? transaction.transcript ?? null,
              controlled,
              transcript: transaction.transcript,
            });
          }
          return database.inventoryTransaction.update({
            where: { id },
            data: {
              confirmedAt: transaction.confirmedAt ?? new Date(),
              reviewReasons:
                transaction.reviewReasons ??
                `Cycle count differs from system stock: expected ${expectedQuantity}, counted ${transaction.quantity} (${evaluation.severity}).`,
            },
            include: transactionInclude,
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
      return {
        outcome: "PENDING_REVIEW",
        idempotent: Boolean(transaction.confirmedAt),
        transaction: pendingReview,
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
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        // A case-number collision between two concurrent confirms is possible.
        // The unique constraints keep data safe; the worker simply retries.
        throw new ConflictException(
          "A discrepancy case could not be created because of a concurrent confirmation. Please try again.",
        );
      }
      throw error;
    }
  }

  /**
   * Resolve a recount-task result against its original discrepancy.
   *
   * The new count either confirms the system stock (case CLOSED, transaction
   * posted) or updates the case with the recount numbers and returns it to
   * manager review. The recount task is completed in both paths. A new
   * discrepancy is never created.
   */
  private async confirmRecountResult(
    transaction: {
      id: string;
      productId: string;
      sourceLocationId: string | null;
      quantity: number;
      createdById: string | null;
      confirmedAt: Date | null;
      reviewReasons: string | null;
      recountTaskId?: string | null;
      product?: { controlled?: boolean } | null;
    },
    id: string,
    user: { id: string },
    expectedQuantity: number,
    evaluation: ReturnType<DiscrepancyRulesService["evaluateDiscrepancy"]>,
  ) {
    const task = await this.prisma.inventoryTask.findUnique({
      where: { id: transaction.recountTaskId! },
      include: {
        discrepancies: {
          where: { status: DiscrepancyStatus.RECOUNT_REQUESTED },
          take: 1,
        },
      },
    });
    const discrepancy = task?.discrepancies[0];
    if (!discrepancy) {
      throw new ConflictException(
        "This recount task is no longer linked to an open discrepancy case.",
      );
    }

    const matches = evaluation.severity === "NONE";
    try {
      await this.prisma.$transaction(
        async (database) => {
          // Complete the recount task so it leaves the worker queue.
          await database.inventoryTask.update({
            where: { id: task.id },
            data: { status: TaskStatus.COMPLETED, completedAt: new Date() },
          });

          if (matches) {
            const current = await database.inventoryTransaction.findUnique({
              where: { id },
            });
            if (!current) throw new NotFoundException("Transaction not found.");
            if (current.status === TransactionStatus.POSTED) return current;
            await this.applyCycleCountBalance(database, current);
            await this.syncReorderDrafts(
              database,
              current.productId,
              this.getAffectedLocationIds(current),
            );
            await database.inventoryTransaction.update({
              where: { id },
              data: {
                status: TransactionStatus.POSTED,
                confirmedAt: current.confirmedAt ?? new Date(),
                postedAt: new Date(),
                systemQuantityAfter: current.quantity,
              },
            });
          } else {
            await database.inventoryTransaction.update({
              where: { id },
              data: {
                confirmedAt: transaction.confirmedAt ?? new Date(),
                reviewReasons:
                  `Recount still differs from system stock: expected ${expectedQuantity}, counted ${transaction.quantity} (${evaluation.severity}).`,
              },
            });
          }

          // Update the original case with the recount numbers and final state.
          await database.discrepancy.update({
            where: { id: discrepancy.id },
            data: {
              countedQuantity: transaction.quantity,
              differenceQuantity: evaluation.differenceQuantity,
              differencePercentage: evaluation.differencePercentage,
              severity: evaluation.severity,
              severityRule: evaluation.rule,
              ...(matches
                ? {
                    status: DiscrepancyStatus.CLOSED,
                    resolvedById: user.id,
                    resolvedAt: new Date(),
                    resolutionTransactionId: id,
                  }
                : { status: DiscrepancyStatus.AWAITING_REVIEW }),
            },
          });

          // Append-only audit record of the completed recount against the
          // original case — the case is never duplicated.
          await this.auditService.write(database, {
            discrepancyId: discrepancy.id,
            caseNumber: discrepancy.caseNumber,
            action: DiscrepancyAuditAction.RECOUNT_COMPLETED,
            previousStatus: DiscrepancyStatus.RECOUNT_REQUESTED,
            newStatus: matches
              ? DiscrepancyStatus.CLOSED
              : DiscrepancyStatus.AWAITING_REVIEW,
            expectedQuantity,
            countedQuantity: transaction.quantity,
            differenceQuantity: evaluation.differenceQuantity,
            severityRule: evaluation.rule,
            actorWorkerId: user.id,
            reason: matches
              ? "Recount confirms the system stock; case closed."
              : "Recount still differs from system stock; returned to manager review.",
            transactionId: id,
          });

          if (matches) {
            await this.notifications.createForManagers(database, {
              type: NotificationType.RECOUNT_COMPLETED,
              title: `Recount completed · ${discrepancy.caseNumber}`,
              message: `The recount confirms the system stock of ${transaction.quantity}. Case closed.`,
              linkType: "DISCREPANCY",
              linkId: discrepancy.id,
            });
          } else {
            await this.notifications.createForManagers(database, {
              type: NotificationType.RECOUNT_COMPLETED,
              title: `Recount completed · ${discrepancy.caseNumber}`,
              message: `The recount reported ${transaction.quantity} vs ${expectedQuantity} expected (${evaluation.severity}). Review again required.`,
              linkType: "DISCREPANCY",
              linkId: discrepancy.id,
            });
          }
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );

      const completeTransaction =
        await this.prisma.inventoryTransaction.findUniqueOrThrow({
          where: { id },
          include: transactionInclude,
        });
      return {
        outcome: matches ? "POSTED" : "PENDING_REVIEW",
        idempotent: false,
        transaction: completeTransaction,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2034"
      ) {
        throw new ConflictException(
          "Stock changed during the recount confirmation. Please review and try again.",
        );
      }
      throw error;
    }
  }

  /** Post a matching cycle count atomically (counted === expected). */
  private async postMatchingCycleCount(id: string) {
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

          await this.applyCycleCountBalance(database, current);
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
              systemQuantityAfter: current.quantity,
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

  /** Set the balance quantity to the counted value (cycle-count semantics). */
  private async applyCycleCountBalance(
    database: Prisma.TransactionClient,
    transaction: {
      productId: string;
      sourceLocationId: string | null;
      quantity: number;
    },
  ) {
    if (!transaction.sourceLocationId) {
      throw new BadRequestException(
        "A cycle count requires a source location.",
      );
    }
    const balance = await database.inventoryBalance.findUnique({
      where: {
        productId_locationId: {
          productId: transaction.productId,
          locationId: transaction.sourceLocationId,
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
          locationId: transaction.sourceLocationId,
        },
      },
      update: { quantity: transaction.quantity },
      create: {
        productId: transaction.productId,
        locationId: transaction.sourceLocationId,
        quantity: transaction.quantity,
      },
    });
  }

  /** Resolve the discrepancy linked to a transaction after a manager decision. */
  private async resolveDiscrepancy(
    transactionId: string,
    data: {
      status: DiscrepancyStatus;
      resolvedById?: string;
      resolutionTransactionId?: string;
      recountTaskId?: string;
      managerNotes?: string | null;
    },
    client: Prisma.TransactionClient = this.prisma,
  ) {
    await client.discrepancy.updateMany({
      where: { transactionId },
      data: {
        status: data.status,
        ...(data.resolvedById
          ? { resolvedById: data.resolvedById, resolvedAt: new Date() }
          : {}),
        ...(data.resolutionTransactionId
          ? { resolutionTransactionId: data.resolutionTransactionId }
          : {}),
        ...(data.recountTaskId ? { recountTaskId: data.recountTaskId } : {}),
        ...(data.managerNotes !== undefined
          ? { managerNotes: data.managerNotes }
          : {}),
      },
    });
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

          const movement = await this.applyManagerApprovedMovement(
            database,
            current,
          );
          await this.syncReorderDrafts(
            database,
            current.productId,
            this.getAffectedLocationIds(current),
          );
          const updated = await database.inventoryTransaction.update({
            where: { id },
            data: {
              status: TransactionStatus.POSTED,
              approvedById: manager.id,
              approvedAt: new Date(),
              postedAt: new Date(),
              reviewNotes: input.note?.trim() || null,
              systemQuantityAfter: movement?.primaryQuantityAfter ?? null,
            },
          });
          // A manager approval resolves any linked discrepancy atomically with
          // the posting so stock and case status can never diverge.
          if (current.action === InventoryAction.CYCLE_COUNT) {
            await this.resolveDiscrepancy(
              id,
              {
                status: DiscrepancyStatus.APPROVED,
                resolvedById: manager.id,
                resolutionTransactionId: id,
                managerNotes: input.note?.trim() ?? null,
              },
              database,
            );
          }
          return updated;
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
    await this.resolveDiscrepancy(id, {
      status: DiscrepancyStatus.CLOSED,
      resolvedById: user.id,
      managerNotes: "Cancelled before posting. No stock was changed.",
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
    const task = await this.tasks.createRecountTask(result.transaction);
    await this.resolveDiscrepancy(id, {
      status: DiscrepancyStatus.RECOUNT_REQUESTED,
      resolvedById: result.transaction.approvedById ?? undefined,
      recountTaskId: task.id,
      managerNotes: input.note?.trim() ?? null,
    });
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
    // A rejection closes the linked discrepancy; a recount is handled by the
    // caller so it can link the created task id.
    if (status === TransactionStatus.REJECTED) {
      await this.resolveDiscrepancy(id, {
        status: DiscrepancyStatus.REJECTED,
        resolvedById: manager.id,
        managerNotes: input.note?.trim() ?? null,
      });
    }
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
      reviewReasons?: string | null;
      product?: { id: string; controlled: boolean } | null;
    },
    client: Prisma.TransactionClient = this.prisma,
  ) {
    // Older releases could route normal stock movements to review because of
    // quantity-risk signals. Keep those already-confirmed records reviewable
    // so a manager can post or reject them one at a time. New movements never
    // enter this compatibility path because they no longer receive reasons.
    const legacyAutomaticReview =
      ([
        InventoryAction.RECEIVE,
        InventoryAction.SHIP,
        InventoryAction.USE,
        InventoryAction.TRANSFER,
      ] as InventoryAction[]).includes(transaction.action) &&
      Boolean(transaction.reviewReasons);
    if (
      !legacyAutomaticReview &&
      !this.rules.requiresManagerReview(transaction.action)
    ) {
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
  ): Promise<{ primaryQuantityAfter: number }> {
    if (transaction.action === InventoryAction.RECEIVE) {
      const balance = await this.increaseBalance(
        database,
        transaction.productId,
        transaction.destinationLocationId!,
        transaction.quantity,
      );
      return { primaryQuantityAfter: balance.quantity };
    }

    if (
      transaction.action === InventoryAction.SHIP ||
      transaction.action === InventoryAction.USE
    ) {
      const balance = await this.decreaseBalance(
        database,
        transaction.productId,
        transaction.sourceLocationId!,
        transaction.quantity,
      );
      return { primaryQuantityAfter: balance.quantity };
    }

    if (transaction.action === InventoryAction.TRANSFER) {
      const sourceBalance = await this.decreaseBalance(
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
      // The audit columns snapshot the source location (the primary one).
      return { primaryQuantityAfter: sourceBalance.quantity };
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
      destinationLocationId: string | null;
    },
  ): Promise<{ primaryQuantityAfter: number } | null> {
    // Normal movements created before the approval-routing correction may
    // still be waiting in the manager queue. An explicit approval uses the
    // same fixed-rule, atomic movement as their normal confirmation path.
    if (
      [
        InventoryAction.RECEIVE,
        InventoryAction.SHIP,
        InventoryAction.USE,
        InventoryAction.TRANSFER,
      ].includes(transaction.action as
        | typeof InventoryAction.RECEIVE
        | typeof InventoryAction.SHIP
        | typeof InventoryAction.USE
        | typeof InventoryAction.TRANSFER)
    ) {
      return this.applyStockMovement(database, transaction);
    }
    if (transaction.action === InventoryAction.CYCLE_COUNT) {
      await this.applyCycleCountBalance(database, transaction);
      return { primaryQuantityAfter: transaction.quantity };
    }
    if (
      transaction.action === InventoryAction.DAMAGE ||
      transaction.action === InventoryAction.LOSS
    ) {
      const balance = await this.decreaseBalance(
        database,
        transaction.productId,
        transaction.sourceLocationId!,
        transaction.quantity,
      );
      return { primaryQuantityAfter: balance.quantity };
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
    // Serialize every reorder evaluation behind one advisory transaction
    // lock, on every path that touches the draft table (a posted movement
    // and a manual refresh can otherwise run concurrently). Each sync reads
    // the active draft and then updates it, so two serializable transactions
    // on the same product can abort each other with a Prisma P2034
    // write-conflict. The lock makes the read-modify-write sequence run one
    // at a time instead of surfacing 500s to the client.
    await database.$executeRawUnsafe(
      "SELECT pg_advisory_xact_lock(727272)",
    );
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

    const activeKey = `${productId}:SYSTEM`;
    const [balances, activeDraft] = await Promise.all([
      database.inventoryBalance.findMany({ where: { productId } }),
      database.reorderDraft.findUnique({ where: { activeKey } }),
    ]);
    const onHand = balances.reduce((sum, balance) => sum + balance.quantity, 0);
    const reserved = balances.reduce(
      (sum, balance) => sum + balance.reservedQuantity,
      0,
    );
    const reorder = this.rules.evaluateReorder(
      onHand,
      reserved,
      product.safetyStock,
      product.reorderQuantity,
    );
    const { available, lowStock } = reorder;
    const suggestedQuantity = Math.max(
      reorder.suggestedQuantity,
      product.supplier?.minimumOrderQuantity ?? 0,
    );

    // Purchase Items is a product-level list. Retire older location-level
    // drafts so one SKU can never appear more than once.
    await database.reorderDraft.updateMany({
      where: {
        productId,
        status: ReorderStatus.DRAFT,
        activeKey: { not: activeKey },
      },
      data: {
        status: ReorderStatus.CANCELLED,
        activeKey: null,
        cancelledAt: new Date(),
        reviewNotes: "Replaced by the system-wide product stock calculation.",
      },
    });

    if (lowStock) {
      if (activeDraft) {
        await database.reorderDraft.update({
          where: { id: activeDraft.id },
          data: { currentStock: available, safetyStock: product.safetyStock, suggestedQuantity },
        });
      } else {
        const locationId = balances[0]?.locationId ?? locationIds[0];
        if (!locationId) return;
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
        data: {
          status: ReorderStatus.CANCELLED,
          activeKey: null,
          currentStock: available,
          cancelledAt: new Date(),
          reviewNotes: "Automatically cancelled because system-wide available stock recovered.",
        },
      });
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
