import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  InventoryAction,
  NotificationType,
  Prisma,
  StockCondition,
  StockRequestStatus,
  StockReservationStatus,
  TaskPriority,
  TaskStatus,
  TaskType,
  TransactionStatus,
  UserRole,
} from "@prisma/client";
import type { AuthenticatedUser } from "../auth/auth-user";
import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateStockRequestDto, PrepareShipmentDto } from "./reservation.dto";

const requestInclude = {
  createdBy: { select: { displayName: true, employeeId: true } },
  lines: {
    include: { product: true },
    orderBy: { product: { name: "asc" } },
  },
  reservations: {
    include: {
      allocations: { include: { product: true, location: true } },
      shipmentTasks: {
        include: {
          assignedTo: { select: { id: true, employeeId: true, displayName: true } },
          preparedBy: { select: { id: true, employeeId: true, displayName: true } },
          product: { select: { id: true, name: true, sku: true, unit: true } },
          sourceLocation: { select: { id: true, code: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  },
  auditEvents: {
    include: { actor: { select: { displayName: true } } },
    orderBy: { createdAt: "desc" },
  },
} satisfies Prisma.StockRequestInclude;

const shipmentTaskInclude = {
  assignedTo: { select: { id: true, employeeId: true, displayName: true } },
  preparedBy: { select: { id: true, employeeId: true, displayName: true } },
  product: { select: { id: true, name: true, sku: true, unit: true } },
  sourceLocation: { select: { id: true, code: true, name: true } },
  reservation: {
    select: {
      id: true,
      reservationNumber: true,
      request: { select: { referenceNumber: true, requestedFor: true } },
    },
  },
} satisfies Prisma.InventoryTaskInclude;

@Injectable()
export class ReservationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  private assertEnabled() {
    if (process.env.STOCK_RESERVATIONS_ENABLED === "false") {
      throw new NotFoundException("Stock reservations are not enabled.");
    }
  }

  listRequests() {
    this.assertEnabled();
    return this.prisma.stockRequest.findMany({
      include: requestInclude,
      orderBy: [{ requiredDate: "asc" }, { createdAt: "desc" }],
    });
  }

  listReservations() {
    this.assertEnabled();
    return this.prisma.stockReservation.findMany({
      include: {
        request: { include: { lines: { include: { product: true } } } },
        createdBy: { select: { displayName: true, employeeId: true } },
        allocations: { include: { product: true, location: true } },
        shipmentTasks: { include: shipmentTaskInclude, orderBy: { createdAt: "desc" } },
        auditEvents: { include: { actor: { select: { displayName: true } } }, orderBy: { createdAt: "desc" } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async createRequest(input: CreateStockRequestDto, actor: AuthenticatedUser) {
    this.assertEnabled();
    const productIds = [...new Set(input.lines.map((line) => line.productId))];
    if (productIds.length !== input.lines.length) {
      throw new BadRequestException("Each item may appear only once in a stock request.");
    }
    const products = await this.prisma.product.findMany({ where: { id: { in: productIds }, active: true } });
    if (products.length !== productIds.length) throw new BadRequestException("One or more selected items are unavailable.");
    const user = await this.resolveUser(actor);
    const externalReference = input.referenceNumber?.trim().toUpperCase() || null;
    return this.runCreateRequest(input, user.id, externalReference);
  }

  /**
   * Create a request and allocate its REQ-001 style number in one database
   * transaction. The counter row is locked by PostgreSQL, so concurrent
   * managers can never receive the same number. Serialization conflicts are
   * retried without exposing an intermittent 500 to the UI.
   */
  private async runCreateRequest(
    input: CreateStockRequestDto,
    userId: string,
    externalReference: string | null,
  ) {
    let attemptsLeft = 3;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        return await this.prisma.$transaction(async (database) => {
          if (externalReference) {
            const duplicate = await database.stockRequest.findUnique({
              where: { referenceNumber: externalReference },
            });
            if (duplicate) {
              throw new ConflictException("This external order or request reference already exists.");
            }
          }

          const requestNumber = await this.nextRequestNumber(database);
          const referenceNumber = externalReference ?? requestNumber;
          return database.stockRequest.create({
            data: {
              requestNumber,
              requestType: input.requestType.trim().toUpperCase(),
              referenceNumber,
              requestedFor: input.requestedFor.trim(),
              requiredDate: new Date(input.requiredDate),
              notes: input.notes?.trim() || null,
              createdById: userId,
              lines: { create: input.lines.map((line) => ({ productId: line.productId, requiredQuantity: line.requiredQuantity })) },
              auditEvents: {
                create: {
                  action: "REQUEST_CONFIRMED",
                  details: `Confirmed from ${input.requestType}. Internal reference ${requestNumber}.`,
                  actorId: userId,
                },
              },
            },
            include: requestInclude,
          });
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      } catch (error) {
        if (
          attemptsLeft > 0 &&
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2034"
        ) {
          attemptsLeft -= 1;
          continue;
        }
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          throw new ConflictException("This external order or request reference already exists.");
        }
        throw error;
      }
    }
  }

  private async nextRequestNumber(database: Prisma.TransactionClient): Promise<string> {
    await database.$executeRaw`UPDATE "request_reference_counters" SET "last_value" = "last_value" + 1 WHERE "id" = 1`;
    const rows = await database.$queryRaw<Array<{ last_value: number | bigint }>>`SELECT "last_value" FROM "request_reference_counters" WHERE "id" = 1`;
    const value = Number(rows[0]?.last_value ?? 1);
    return `REQ-${String(value).padStart(3, "0")}`;
  }

  async getAvailability(id: string) {
    this.assertEnabled();
    const request = await this.prisma.stockRequest.findUnique({ where: { id }, include: { lines: { include: { product: true } } } });
    if (!request) throw new NotFoundException("Stock request not found.");
    const balances = await this.prisma.inventoryBalance.findMany({
      where: { productId: { in: request.lines.map((line) => line.productId) }, quantity: { gt: 0 }, location: { active: true } },
      include: { location: true, product: true },
      orderBy: [{ product: { name: "asc" } }, { quantity: "desc" }],
    });
    return request.lines.map((line) => ({
      requestLineId: line.id,
      product: line.product,
      requiredQuantity: line.requiredQuantity,
      remainingQuantity: Math.max(0, line.requiredQuantity - line.reservedQuantity - line.shippedQuantity),
      locations: balances.filter((balance) => balance.productId === line.productId).map((balance) => ({
        locationId: balance.locationId,
        locationCode: balance.location.code,
        locationName: balance.location.name,
        onHand: balance.quantity,
        reserved: balance.reservedQuantity,
        available: Math.max(0, balance.quantity - balance.reservedQuantity),
      })).filter((balance) => balance.available > 0),
    }));
  }

  async reserveRecommended(id: string, actor: AuthenticatedUser) {
    this.assertEnabled();
    const user = await this.resolveUser(actor);
    return this.prisma.$transaction(async (database) => {
      const request = await database.stockRequest.findUnique({ where: { id }, include: { lines: { include: { product: true } } } });
      if (!request) throw new NotFoundException("Stock request not found.");
      if (
        request.status === StockRequestStatus.CANCELLED ||
        request.status === StockRequestStatus.COMPLETED ||
        request.status === StockRequestStatus.EXPIRED
      ) {
        throw new ConflictException("This stock request cannot be reserved.");
      }
      const balances = await database.inventoryBalance.findMany({
        where: { productId: { in: request.lines.map((line) => line.productId) }, quantity: { gt: 0 }, location: { active: true } },
        include: { location: true },
        orderBy: { quantity: "desc" },
      });
      const allocations: Array<{ requestLineId: string; productId: string; locationId: string; quantity: number }> = [];
      for (const line of request.lines) {
        let remaining = Math.max(0, line.requiredQuantity - line.reservedQuantity - line.shippedQuantity);
        for (const balance of balances.filter((entry) => entry.productId === line.productId)) {
          if (remaining === 0) break;
          const available = Math.max(0, balance.quantity - balance.reservedQuantity);
          const quantity = Math.min(remaining, available);
          if (quantity > 0) {
            allocations.push({ requestLineId: line.id, productId: line.productId, locationId: balance.locationId, quantity });
            remaining -= quantity;
            balance.reservedQuantity += quantity;
          }
        }
      }
      if (allocations.length === 0) throw new ConflictException("No available stock can be reserved for this request.");
      const reservationNumber = `RSV-${Date.now().toString(36).toUpperCase()}`;
      const reservation = await database.stockReservation.create({
        data: {
          reservationNumber,
          stockRequestId: request.id,
          createdById: user.id,
          allocations: { create: allocations },
        },
      });
      for (const allocation of allocations) {
        await database.inventoryBalance.update({
          where: { productId_locationId: { productId: allocation.productId, locationId: allocation.locationId } },
          data: { reservedQuantity: { increment: allocation.quantity } },
        });
        await database.stockRequestLine.update({
          where: { id: allocation.requestLineId },
          data: { reservedQuantity: { increment: allocation.quantity } },
        });
      }
      const updatedLines = await database.stockRequestLine.findMany({ where: { stockRequestId: request.id } });
      const fullyReserved = updatedLines.every((line) => line.reservedQuantity + line.shippedQuantity >= line.requiredQuantity);
      await database.stockRequest.update({
        where: { id: request.id },
        data: { status: fullyReserved ? StockRequestStatus.FULLY_RESERVED : StockRequestStatus.PARTIALLY_RESERVED },
      });
      await database.reservationAuditEvent.create({
        data: { stockRequestId: request.id, reservationId: reservation.id, action: "STOCK_RESERVED", details: `${allocations.reduce((sum, item) => sum + item.quantity, 0)} units reserved from available stock.`, actorId: user.id },
      });
      return database.stockRequest.findUniqueOrThrow({ where: { id: request.id }, include: requestInclude });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  /**
   * Prepare a shipment against one reserved allocation. No stock changes here:
   * a single actionable SHIP task is created and the internal shipment
   * reference (SHIP-001, SHIP-002, ...) is generated from a database-backed
   * counter inside the same transaction.
   *
   * Assignment modes:
   *   AUTO       – the Warehouse Executive with the fewest actionable open
   *                tasks is selected (deterministic employee-id tie-break).
   *   MANUAL     – the caller's assignedToId must be an active WORKER user.
   *   UNASSIGNED – the task is created with assignedToId = null and the
   *                managers are notified so they can assign it later.
   *
   * Duplicate protection: only one actionable SHIP task may exist for the same
   * reservation and quantity (enforced by a partial unique index). Repeated or
   * concurrent requests return the existing task and its reference instead of
   * creating a duplicate, consuming another reference, or writing duplicate
   * notifications or audit records.
   */
  async prepareShipment(reservationId: string, input: PrepareShipmentDto, actor: AuthenticatedUser) {
    this.assertEnabled();
    const user = await this.resolveUser(actor);
    return this.runPrepareShipment(reservationId, input, user);
  }

  /**
   * Runs the prepare-shipment transaction, retrying on a serialization
   * conflict (P2034) or unique-violation race (P2002). Both happen when two
   * managers prepare the same reservation and quantity at the same time; the
   * retry re-runs the idempotency check and returns the winner's task without
   * consuming an extra shipment reference (the failed attempt rolls back).
   */
  private async runPrepareShipment(
    reservationId: string,
    input: PrepareShipmentDto,
    user: { id: string },
  ) {
    let attemptsLeft = 3;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        return await this.prisma.$transaction(async (database) => {
        const reservation = await database.stockReservation.findUnique({
          where: { id: reservationId },
          include: {
            request: { select: { id: true, referenceNumber: true, requestedFor: true } },
            allocations: { include: { product: true, location: true } },
          },
        });
        if (!reservation) throw new NotFoundException("Reservation not found.");
        if (reservation.status !== StockReservationStatus.ACTIVE && reservation.status !== StockReservationStatus.PARTIALLY_SHIPPED) {
          throw new ConflictException("Only an active reservation can be prepared for shipment.");
        }
        const allocation = reservation.allocations.find((entry) => entry.id === input.allocationId);
        if (!allocation) throw new BadRequestException("The selected reserved item is not part of this reservation.");
        const remaining = allocation.quantity - allocation.shippedQuantity - allocation.releasedQuantity;
        if (input.quantity > remaining) {
          throw new ConflictException(`Only ${remaining} ${allocation.product.unit} remain reserved for ${allocation.product.name}.`);
        }
        const existing = await database.inventoryTask.findFirst({
          where: {
            type: TaskType.SHIP,
            reservationId,
            productId: allocation.productId,
            sourceLocationId: allocation.locationId,
            quantity: input.quantity,
            status: { in: [TaskStatus.OPEN, TaskStatus.IN_PROGRESS] },
          },
          include: shipmentTaskInclude,
        });
        if (existing) return { idempotent: true, task: existing, reservation };

        const { assignedToId, assignmentLabel } = await this.resolveAssignment(database, input);
        const shipmentReference = await this.nextShipmentReference(database);
        const task = await database.inventoryTask.create({
          data: {
            type: TaskType.SHIP,
            priority: input.priority ?? TaskPriority.MEDIUM,
            status: TaskStatus.OPEN,
            title: `Ship ${allocation.product.name}`,
            description: [
              input.instructions?.trim(),
              `Order ${reservation.request.referenceNumber} · ${reservation.request.requestedFor}`,
            ].filter(Boolean).join("\n") || null,
            dueAt: input.dueAt ? new Date(input.dueAt) : null,
            assignedToId,
            productId: allocation.productId,
            quantity: input.quantity,
            sourceLocationId: allocation.locationId,
            reservationId,
            shipmentReference,
            preparedById: user.id,
          },
          include: shipmentTaskInclude,
        });
        if (assignedToId) {
          await this.notifications.createForUser(database, {
            userId: assignedToId,
            type: NotificationType.SHIPMENT_TASK_ASSIGNED,
            title: "Shipment task assigned",
            message: `${allocation.product.name} · ${input.quantity} ${allocation.product.unit} from ${allocation.location.name} for ${reservation.request.referenceNumber} (${shipmentReference}).`,
            linkType: "task",
            linkId: task.id,
          });
        } else {
          await this.notifications.createForManagers(database, {
            type: NotificationType.SHIPMENT_PREPARED,
            title: "Shipment needs a worker",
            message: `${shipmentReference} for ${reservation.request.referenceNumber} needs a Warehouse Executive. Assign it from the reservation card.`,
            linkType: "task",
            linkId: task.id,
          });
        }
        const externalNote = input.externalReference?.trim()
          ? ` External reference: ${input.externalReference.trim()}.`
          : "";
        await database.reservationAuditEvent.create({
          data: {
            stockRequestId: reservation.request.id,
            reservationId,
            action: "SHIPMENT_PREPARED",
            details: `${shipmentReference}: ${input.quantity} ${allocation.product.unit} of ${allocation.product.name} from ${allocation.location.name} — ${assignmentLabel}. Stock unchanged.${externalNote}`,
            actorId: user.id,
          },
        });
          return { idempotent: false, task, reservation };
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      } catch (error) {
        if (
          attemptsLeft > 0 &&
          error instanceof Prisma.PrismaClientKnownRequestError &&
          (error.code === "P2034" || error.code === "P2002")
        ) {
          attemptsLeft -= 1;
          continue;
        }
        throw error;
      }
    }
  }

  /**
   * Resolve the assignment for a prepared shipment. AUTO runs the existing
   * fewest-open-tasks algorithm; MANUAL validates the selected active WORKER;
   * UNASSIGNED always stores null and asks the manager to assign it later.
   */
  private async resolveAssignment(
    database: Prisma.TransactionClient,
    input: PrepareShipmentDto,
  ): Promise<{ assignedToId: string | null; assignmentLabel: string }> {
    if (input.assignmentMode === "UNASSIGNED") {
      return { assignedToId: null, assignmentLabel: "left unassigned (manager assignment required)" };
    }
    if (input.assignmentMode === "MANUAL") {
      if (!input.assignedToId) {
        throw new BadRequestException("Select a Warehouse Executive to assign this shipment to.");
      }
      const worker = await database.user.findFirst({
        where: { id: input.assignedToId, active: true, role: UserRole.WORKER },
        select: { id: true, displayName: true, employeeId: true },
      });
      if (!worker) {
        throw new BadRequestException("The selected user is not an active Warehouse Executive and cannot be assigned this shipment.");
      }
      return { assignedToId: worker.id, assignmentLabel: `assigned manually to ${worker.displayName}` };
    }
    const worker = await this.selectShipmentWorker(database);
    return {
      assignedToId: worker?.id ?? null,
      assignmentLabel: worker
        ? `assigned automatically to ${worker.displayName}`
        : "left unassigned (no eligible worker)",
    };
  }

  /**
   * Issue the next internal shipment reference from the single-row
   * shipment_reference_counters table. The atomic UPDATE ... RETURNING (row
   * lock) inside this transaction guarantees that two managers preparing
   * concurrently can never receive the same number, and that a failed prepare
   * rolls the increment back so no number is wasted. References are never
   * reused: the counter only moves forward.
   */
  private async nextShipmentReference(database: Prisma.TransactionClient): Promise<string> {
    await database.$executeRaw`UPDATE "shipment_reference_counters" SET "last_value" = "last_value" + 1 WHERE "id" = 1`;
    const rows = await database.$queryRaw<Array<{ last_value: number | bigint }>>`SELECT "last_value" FROM "shipment_reference_counters" WHERE "id" = 1`;
    const value = Number(rows[0]?.last_value ?? 1);
    return `SHIP-${String(value).padStart(3, "0")}`;
  }

  /**
   * Complete a reservation shipment task without the voice pipeline
   * ("Complete task"). The Ship transaction is created and posted in the same
   * database transaction as the stock movement, the reservation status change
   * and the task completion.
   */
  async completeShipmentTask(taskId: string, actor: AuthenticatedUser) {
    this.assertEnabled();
    const user = await this.resolveUser(actor);
    const task = await this.prisma.inventoryTask.findUnique({
      where: { id: taskId },
      include: { reservation: { include: { request: true } } },
    });
    if (!task) throw new NotFoundException("Task not found.");
    if (task.type !== TaskType.SHIP || !task.reservationId) {
      throw new ConflictException("This task is not a reservation shipment task.");
    }
    if (!task.assignedToId || task.assignedToId !== user.id) {
      throw new ForbiddenException("Only the assigned Warehouse Executive can complete this shipment task.");
    }
    if (task.status === TaskStatus.COMPLETED) return { idempotent: true, task, transaction: null };
    if (task.status === TaskStatus.CANCELLED) {
      throw new ConflictException("Cancelled shipment tasks cannot be completed.");
    }
    return this.prisma.$transaction(async (database) => {
      const current = await database.inventoryTask.findUnique({ where: { id: taskId } });
      if (!current || current.status === TaskStatus.COMPLETED) {
        return { idempotent: true, task: current, transaction: null };
      }
      if (current.status === TaskStatus.CANCELLED) {
        throw new ConflictException("Cancelled shipment tasks cannot be completed.");
      }
      const { transaction } = await this.postShipment(database, current, { createdById: user.id });
      const completedTask = await database.inventoryTask.findUniqueOrThrow({
        where: { id: taskId },
        include: shipmentTaskInclude,
      });
      return { idempotent: false, task: completedTask, transaction };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  /**
   * Voice-confirmed shipment path used by the inventory confirmation router.
   * The pending transaction was already linked to the shipment task; this
   * posts it with the reservation-aware stock movement.
   */
  async confirmShipmentTransaction(transactionId: string, actor: AuthenticatedUser) {
    this.assertEnabled();
    const user = await this.resolveUser(actor);
    return this.prisma.$transaction(async (database) => {
      const current = await database.inventoryTransaction.findUnique({
        where: { id: transactionId },
        include: { task: true },
      });
      if (!current) throw new NotFoundException("Transaction not found.");
      if (current.status === TransactionStatus.POSTED) {
        const complete = await database.inventoryTransaction.findUniqueOrThrow({
          where: { id: transactionId },
          include: shipmentTransactionInclude,
        });
        return { outcome: "POSTED", idempotent: true, transaction: complete };
      }
      if (current.status !== TransactionStatus.PENDING) {
        throw new ConflictException(`A ${current.status.toLowerCase()} transaction cannot be confirmed.`);
      }
      const task = current.task;
      if (!task || task.type !== TaskType.SHIP || !task.reservationId) {
        throw new ConflictException("This transaction is not linked to a reservation shipment task.");
      }
      if (!task.assignedToId || task.assignedToId !== user.id) {
        throw new ForbiddenException("Only the assigned Warehouse Executive can confirm this shipment.");
      }
      const { transaction } = await this.postShipment(database, task, {
        createdById: user.id,
        transactionId: current.id,
      });
      return { outcome: "POSTED", idempotent: false, transaction };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  /**
   * Atomic shipment: reduce on-hand and reserved quantities together, move the
   * reserved quantity to shipped, mark the reservation fulfilled (or partially
   * fulfilled), complete the shipment task, create/post the Ship transaction
   * and write audit + notification records — all in one database transaction.
   */
  private async postShipment(
    database: Prisma.TransactionClient,
    task: { id: string; reservationId: string | null; productId: string | null; sourceLocationId: string | null; quantity: number | null; shipmentReference: string | null },
    opts: { createdById: string; transactionId?: string },
  ) {
    if (!task.productId || !task.sourceLocationId || !task.quantity || task.quantity <= 0) {
      throw new ConflictException("The shipment task is missing its product, location or quantity.");
    }
    const shipmentQuantity = task.quantity;
    const reservation = await database.stockReservation.findUnique({
      where: { id: task.reservationId! },
      include: {
        request: true,
        allocations: { include: { product: true, location: true } },
      },
    });
    if (!reservation) throw new NotFoundException("Reservation not found.");
    if (reservation.status !== StockReservationStatus.ACTIVE && reservation.status !== StockReservationStatus.PARTIALLY_SHIPPED) {
      throw new ConflictException(`This reservation is ${reservation.status.toLowerCase()} and can no longer be shipped.`);
    }
    const allocation = reservation.allocations.find(
      (entry) => entry.productId === task.productId && entry.locationId === task.sourceLocationId,
    );
    if (!allocation) {
      throw new ConflictException("The reserved stock for this shipment could not be found.");
    }
    const remaining = allocation.quantity - allocation.shippedQuantity - allocation.releasedQuantity;
    if (task.quantity > remaining) {
      throw new ConflictException(
        `Only ${remaining} ${allocation.product.unit} remain reserved for ${allocation.product.name}. The total shipped can never exceed the reservation quantity.`,
      );
    }
    const balance = await database.inventoryBalance.findUnique({
      where: { productId_locationId: { productId: allocation.productId, locationId: allocation.locationId } },
    });
    if (!balance || balance.quantity < task.quantity || balance.reservedQuantity < task.quantity) {
      throw new ConflictException(
        `Reserved stock for ${allocation.product.name} at ${allocation.location.name} is no longer available. Verify the balance before shipping.`,
      );
    }
    const quantityBefore = balance.quantity;
    await database.inventoryBalance.update({
      where: { productId_locationId: { productId: allocation.productId, locationId: allocation.locationId } },
      data: { quantity: { decrement: task.quantity }, reservedQuantity: { decrement: task.quantity } },
    });
    await database.stockRequestLine.update({
      where: { id: allocation.requestLineId },
      data: { reservedQuantity: { decrement: task.quantity }, shippedQuantity: { increment: task.quantity } },
    });
    await database.stockReservationAllocation.update({
      where: { id: allocation.id },
      data: { shippedQuantity: { increment: task.quantity } },
    });
    const postedAt = new Date();
    const shipmentLabel = task.shipmentReference ?? "reservation shipment";
    let transaction: { id: string };
    if (opts.transactionId) {
      transaction = await database.inventoryTransaction.update({
        where: { id: opts.transactionId },
        data: {
          status: TransactionStatus.POSTED,
          confirmedAt: postedAt,
          postedAt,
          approvedById: opts.createdById,
          referenceNumber: reservation.request.referenceNumber,
          notes: `Shipped from ${reservation.reservationNumber} (${shipmentLabel}).`,
          systemQuantityAfter: quantityBefore - task.quantity,
        },
        select: { id: true },
      });
    } else {
      transaction = await database.inventoryTransaction.create({
        data: {
          action: InventoryAction.SHIP,
          status: TransactionStatus.POSTED,
          productId: allocation.productId,
          sourceLocationId: allocation.locationId,
          quantity: task.quantity,
          condition: StockCondition.GOOD,
          referenceNumber: reservation.request.referenceNumber,
          notes: `Shipped from ${reservation.reservationNumber} (${shipmentLabel}).`,
          systemQuantityBefore: quantityBefore,
          systemQuantityAfter: quantityBefore - task.quantity,
          createdById: opts.createdById,
          approvedById: opts.createdById,
          confirmedAt: postedAt,
          approvedAt: postedAt,
          postedAt,
        },
        select: { id: true },
      });
      await database.inventoryTask.update({
        where: { id: task.id },
        data: { sourceTransactionId: transaction.id },
      });
    }
    const remainingAcrossReservation = reservation.allocations.reduce((total, entry) => {
      const allocationRemaining = entry.quantity - entry.shippedQuantity - entry.releasedQuantity;
      return total + (entry.id === allocation.id ? allocationRemaining - shipmentQuantity : allocationRemaining);
    }, 0);
    const reservationStatus =
      remainingAcrossReservation === 0 ? StockReservationStatus.COMPLETED : StockReservationStatus.PARTIALLY_SHIPPED;
    await database.stockReservation.update({
      where: { id: reservation.id },
      data: { status: reservationStatus },
    });
    const lines = await database.stockRequestLine.findMany({ where: { stockRequestId: reservation.stockRequestId } });
    const complete = lines.every((line) => line.shippedQuantity >= line.requiredQuantity);
    await database.stockRequest.update({
      where: { id: reservation.stockRequestId },
      data: { status: complete ? StockRequestStatus.COMPLETED : StockRequestStatus.PARTIALLY_FULFILLED },
    });
    await database.inventoryTask.update({
      where: { id: task.id },
      data: { status: TaskStatus.COMPLETED, completedAt: postedAt },
    });
    await database.reservationAuditEvent.create({
      data: {
        stockRequestId: reservation.stockRequestId,
        reservationId: reservation.id,
        action: "SHIPMENT_COMPLETED",
        details: `${shipmentLabel}: ${task.quantity} ${allocation.product.unit} of ${allocation.product.name} shipped from ${allocation.location.name} for ${reservation.request.referenceNumber}. Reservation is now ${reservationStatus}.`,
        actorId: opts.createdById,
      },
    });
    await this.notifications.createForUser(database, {
      userId: opts.createdById,
      type: NotificationType.SHIPMENT_COMPLETED,
      title: "Shipment completed",
      message: `${shipmentLabel} · ${task.quantity} ${allocation.product.unit} of ${allocation.product.name} shipped for ${reservation.request.referenceNumber}.`,
      linkType: "task",
      linkId: task.id,
    });
    await this.notifications.createForManagers(database, {
      type: NotificationType.SHIPMENT_COMPLETED,
      title: "Shipment completed",
      message: `${shipmentLabel} · ${task.quantity} ${allocation.product.unit} of ${allocation.product.name} shipped for ${reservation.request.referenceNumber}.`,
      linkType: "task",
      linkId: task.id,
    });
    return { transaction, reservation: { ...reservation, status: reservationStatus } };
  }

  /**
   * Automatic worker selection for a prepared shipment.
   *
   * Eligibility: active users with the Warehouse Executive role. Managers and
   * administrators are never selected. When locations carry a warehouse
   * assignment in the future, workers outside the relevant warehouse are
   * excluded here; locations currently have no warehouse field, so every
   * active executive is eligible.
   *
   * Selection: the worker with the fewest actionable open tasks (OPEN or
   * IN_PROGRESS across all task types). Ties break deterministically by
   * employee id so repeated prepares always pick the same worker.
   */
  private async selectShipmentWorker(database: Prisma.TransactionClient | PrismaService) {
    const workers = await database.user.findMany({
      where: { active: true, role: UserRole.WORKER },
      select: { id: true, employeeId: true, displayName: true },
      orderBy: { employeeId: "asc" },
    });
    if (workers.length === 0) return null;
    const openTaskCounts = await database.inventoryTask.groupBy({
      by: ["assignedToId"],
      where: {
        assignedToId: { in: workers.map((worker) => worker.id) },
        status: { in: [TaskStatus.OPEN, TaskStatus.IN_PROGRESS] },
      },
      _count: { _all: true },
    });
    const counts = new Map(openTaskCounts.map((entry) => [entry.assignedToId, entry._count._all]));
    return [...workers]
      .sort(
        (left, right) =>
          (counts.get(left.id) ?? 0) - (counts.get(right.id) ?? 0) ||
          left.employeeId.localeCompare(right.employeeId),
      )[0];
  }

  async release(id: string, reason: string, actor: AuthenticatedUser) {
    this.assertEnabled();
    if (!reason.trim()) throw new BadRequestException("A release reason is required.");
    const user = await this.resolveUser(actor);
    return this.prisma.$transaction(async (database) => {
      const reservation = await database.stockReservation.findUnique({ where: { id }, include: { allocations: true, request: true } });
      if (!reservation) throw new NotFoundException("Reservation not found.");
      if (reservation.status !== StockReservationStatus.ACTIVE && reservation.status !== StockReservationStatus.PARTIALLY_SHIPPED) {
        throw new ConflictException("This reservation is no longer active.");
      }
      for (const allocation of reservation.allocations) {
        const activeQuantity = allocation.quantity - allocation.shippedQuantity - allocation.releasedQuantity;
        if (activeQuantity <= 0) continue;
        await database.inventoryBalance.update({
          where: { productId_locationId: { productId: allocation.productId, locationId: allocation.locationId } },
          data: { reservedQuantity: { decrement: activeQuantity } },
        });
        await database.stockRequestLine.update({ where: { id: allocation.requestLineId }, data: { reservedQuantity: { decrement: activeQuantity } } });
        await database.stockReservationAllocation.update({ where: { id: allocation.id }, data: { releasedQuantity: { increment: activeQuantity } } });
      }
      // Cancel any open shipment task linked to the reservation so the worker
      // queue never shows work that can no longer be performed. Completed
      // tasks and posted transactions are never touched.
      const openTasks = await database.inventoryTask.findMany({
        where: { reservationId: id, type: TaskType.SHIP, status: TaskStatus.OPEN },
      });
      for (const openTask of openTasks) {
        await database.inventoryTask.update({
          where: { id: openTask.id },
          data: { status: TaskStatus.CANCELLED, completedAt: new Date() },
        });
        if (openTask.assignedToId) {
          await this.notifications.createForUser(database, {
            userId: openTask.assignedToId,
            type: NotificationType.SHIPMENT_CANCELLED,
            title: "Shipment task cancelled",
            message: `${openTask.shipmentReference ?? "Shipment"} was cancelled because the reservation was released: ${reason.trim()}`,
            linkType: "task",
            linkId: openTask.id,
          });
        }
      }
      await database.stockReservation.update({ where: { id }, data: { status: StockReservationStatus.RELEASED, releaseReason: reason.trim() } });
      const lines = await database.stockRequestLine.findMany({ where: { stockRequestId: reservation.stockRequestId } });
      const hasReserved = lines.some((line) => line.reservedQuantity > 0);
      await database.stockRequest.update({ where: { id: reservation.stockRequestId }, data: { status: hasReserved ? StockRequestStatus.PARTIALLY_RESERVED : StockRequestStatus.CONFIRMED } });
      await database.reservationAuditEvent.create({
        data: {
          stockRequestId: reservation.stockRequestId,
          reservationId: id,
          action: "RESERVATION_RELEASED",
          details: `${reason.trim()}${openTasks.length > 0 ? ` ${openTasks.length} open shipment task(s) cancelled.` : ""}`,
          actorId: user.id,
        },
      });
      await this.notifications.createForManagers(database, {
        type: NotificationType.SHIPMENT_CANCELLED,
        title: "Reservation released",
        message: `Reservation ${reservation.reservationNumber} was released: ${reason.trim()}`,
        linkType: "reservation",
        linkId: id,
      });
      return { id, status: StockReservationStatus.RELEASED, cancelledShipmentTasks: openTasks.length };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async cancelRequest(id: string, reason: string, actor: AuthenticatedUser) {
    this.assertEnabled();
    if (!reason.trim()) throw new BadRequestException("A cancellation reason is required.");
    const user = await this.resolveUser(actor);
    return this.prisma.$transaction(async (database) => {
      const request = await database.stockRequest.findUnique({
        where: { id },
        include: { reservations: { include: { allocations: true } } },
      });
      if (!request) throw new NotFoundException("Stock request not found.");
      if (request.status === StockRequestStatus.COMPLETED) {
        throw new ConflictException("A completed stock request cannot be cancelled.");
      }
      if (request.status === StockRequestStatus.CANCELLED) {
        return { id, status: StockRequestStatus.CANCELLED, idempotent: true };
      }

      for (const reservation of request.reservations) {
        if (reservation.status !== StockReservationStatus.ACTIVE && reservation.status !== StockReservationStatus.PARTIALLY_SHIPPED) continue;
        for (const allocation of reservation.allocations) {
          const activeQuantity = allocation.quantity - allocation.shippedQuantity - allocation.releasedQuantity;
          if (activeQuantity <= 0) continue;
          await database.inventoryBalance.update({
            where: { productId_locationId: { productId: allocation.productId, locationId: allocation.locationId } },
            data: { reservedQuantity: { decrement: activeQuantity } },
          });
          await database.stockRequestLine.update({
            where: { id: allocation.requestLineId },
            data: { reservedQuantity: { decrement: activeQuantity } },
          });
          await database.stockReservationAllocation.update({
            where: { id: allocation.id },
            data: { releasedQuantity: { increment: activeQuantity } },
          });
        }
        const openTasks = await database.inventoryTask.findMany({
          where: { reservationId: reservation.id, type: TaskType.SHIP, status: TaskStatus.OPEN },
        });
        for (const openTask of openTasks) {
          await database.inventoryTask.update({
            where: { id: openTask.id },
            data: { status: TaskStatus.CANCELLED, completedAt: new Date() },
          });
          if (openTask.assignedToId) {
            await this.notifications.createForUser(database, {
              userId: openTask.assignedToId,
              type: NotificationType.SHIPMENT_CANCELLED,
              title: "Shipment task cancelled",
              message: `${openTask.shipmentReference ?? "Shipment"} was cancelled because the stock request was cancelled: ${reason.trim()}`,
              linkType: "task",
              linkId: openTask.id,
            });
          }
        }
        await database.stockReservation.update({
          where: { id: reservation.id },
          data: { status: StockReservationStatus.CANCELLED, releaseReason: reason.trim() },
        });
      }
      await database.stockRequest.update({ where: { id }, data: { status: StockRequestStatus.CANCELLED } });
      await database.reservationAuditEvent.create({
        data: { stockRequestId: id, action: "REQUEST_CANCELLED", details: reason.trim(), actorId: user.id },
      });
      await this.notifications.createForManagers(database, {
        type: NotificationType.SHIPMENT_CANCELLED,
        title: "Stock request cancelled",
        message: `Request ${request.referenceNumber} was cancelled: ${reason.trim()}`,
        linkType: "request",
        linkId: id,
      });
      return { id, status: StockRequestStatus.CANCELLED, idempotent: false };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async fulfil(id: string, reason: string, actor: AuthenticatedUser) {
    this.assertEnabled();
    if (!reason.trim()) throw new BadRequestException("A fulfilment note is required.");
    const user = await this.resolveUser(actor);
    return this.prisma.$transaction(async (database) => {
      const reservation = await database.stockReservation.findUnique({
        where: { id },
        include: { request: true, allocations: { include: { product: true, location: true } } },
      });
      if (!reservation) throw new NotFoundException("Reservation not found.");
      if (reservation.status !== StockReservationStatus.ACTIVE && reservation.status !== StockReservationStatus.PARTIALLY_SHIPPED) {
        throw new ConflictException("Only an active reservation can be fulfilled.");
      }

      let fulfilledQuantity = 0;
      for (const allocation of reservation.allocations) {
        const activeQuantity = allocation.quantity - allocation.shippedQuantity - allocation.releasedQuantity;
        if (activeQuantity <= 0) continue;
        const balance = await database.inventoryBalance.findUnique({
          where: { productId_locationId: { productId: allocation.productId, locationId: allocation.locationId } },
        });
        if (!balance || balance.quantity < activeQuantity || balance.reservedQuantity < activeQuantity) {
          throw new ConflictException(`Reserved stock for ${allocation.product.name} at ${allocation.location.name} is inconsistent. Verify the balance before fulfilment.`);
        }
        await database.inventoryBalance.update({
          where: { productId_locationId: { productId: allocation.productId, locationId: allocation.locationId } },
          data: { quantity: { decrement: activeQuantity }, reservedQuantity: { decrement: activeQuantity } },
        });
        await database.stockRequestLine.update({
          where: { id: allocation.requestLineId },
          data: { reservedQuantity: { decrement: activeQuantity }, shippedQuantity: { increment: activeQuantity } },
        });
        await database.stockReservationAllocation.update({
          where: { id: allocation.id },
          data: { shippedQuantity: { increment: activeQuantity } },
        });
        const postedAt = new Date();
        await database.inventoryTransaction.create({
          data: {
            action: InventoryAction.SHIP,
            status: TransactionStatus.POSTED,
            productId: allocation.productId,
            sourceLocationId: allocation.locationId,
            quantity: activeQuantity,
            condition: StockCondition.GOOD,
            referenceNumber: reservation.request.referenceNumber,
            notes: `Fulfilled from ${reservation.reservationNumber}. ${reason.trim()}`,
            systemQuantityBefore: balance.quantity,
            systemQuantityAfter: balance.quantity - activeQuantity,
            createdById: user.id,
            approvedById: user.id,
            confirmedAt: postedAt,
            approvedAt: postedAt,
            postedAt,
          },
        });
        fulfilledQuantity += activeQuantity;
      }
      if (fulfilledQuantity === 0) throw new ConflictException("This reservation has no remaining quantity to fulfil.");

      await database.stockReservation.update({ where: { id }, data: { status: StockReservationStatus.COMPLETED } });
      const lines = await database.stockRequestLine.findMany({ where: { stockRequestId: reservation.stockRequestId } });
      const complete = lines.every((line) => line.shippedQuantity >= line.requiredQuantity);
      await database.stockRequest.update({
        where: { id: reservation.stockRequestId },
        data: { status: complete ? StockRequestStatus.COMPLETED : StockRequestStatus.PARTIALLY_FULFILLED },
      });
      await database.reservationAuditEvent.create({
        data: { stockRequestId: reservation.stockRequestId, reservationId: id, action: "RESERVATION_FULFILLED", details: `${fulfilledQuantity} units shipped. ${reason.trim()}`, actorId: user.id },
      });
      return { id, status: StockReservationStatus.COMPLETED, fulfilledQuantity };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async expireDue(actor: AuthenticatedUser) {
    this.assertEnabled();
    const user = await this.resolveUser(actor);
    return this.prisma.$transaction(async (database) => {
      const requests = await database.stockRequest.findMany({
        where: {
          requiredDate: { lt: new Date() },
          status: { in: [StockRequestStatus.CONFIRMED, StockRequestStatus.PARTIALLY_RESERVED, StockRequestStatus.FULLY_RESERVED, StockRequestStatus.PARTIALLY_FULFILLED] },
        },
        include: { reservations: { include: { allocations: true } } },
      });
      for (const request of requests) {
        for (const reservation of request.reservations) {
          if (reservation.status !== StockReservationStatus.ACTIVE && reservation.status !== StockReservationStatus.PARTIALLY_SHIPPED) continue;
          for (const allocation of reservation.allocations) {
            const activeQuantity = allocation.quantity - allocation.shippedQuantity - allocation.releasedQuantity;
            if (activeQuantity <= 0) continue;
            await database.inventoryBalance.update({
              where: { productId_locationId: { productId: allocation.productId, locationId: allocation.locationId } },
              data: { reservedQuantity: { decrement: activeQuantity } },
            });
            await database.stockRequestLine.update({
              where: { id: allocation.requestLineId },
              data: { reservedQuantity: { decrement: activeQuantity } },
            });
            await database.stockReservationAllocation.update({
              where: { id: allocation.id },
              data: { releasedQuantity: { increment: activeQuantity } },
            });
          }
          await database.stockReservation.update({
            where: { id: reservation.id },
            data: { status: StockReservationStatus.EXPIRED, releaseReason: "Required date passed before fulfilment." },
          });
        }
        await database.stockRequest.update({ where: { id: request.id }, data: { status: StockRequestStatus.EXPIRED } });
        await database.reservationAuditEvent.create({
          data: { stockRequestId: request.id, action: "REQUEST_EXPIRED", details: "Required date passed; all unused reserved stock was released.", actorId: user.id },
        });
      }
      return { expiredRequests: requests.length };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  private async resolveUser(actor: AuthenticatedUser) {
    const email = actor.email?.toLowerCase();
    const existing = email
      ? await this.prisma.user.findUnique({ where: { email } })
      : await this.prisma.user.findUnique({ where: { employeeId: actor.username.toUpperCase() } });
    if (existing) return existing;
    const role = actor.roles.includes("administrator") ? UserRole.ADMINISTRATOR : UserRole.MANAGER;
    return this.prisma.user.create({
      data: { employeeId: actor.username.toUpperCase(), email: email ?? `${actor.username}@keycloak.local`, displayName: actor.username, role },
    });
  }
}

const shipmentTransactionInclude = {
  product: true,
  sourceLocation: true,
  destinationLocation: true,
  createdBy: true,
  approvedBy: true,
  _count: { select: { evidence: true } },
  task: {
    include: {
      reservation: { include: { request: { select: { referenceNumber: true, requestedFor: true } } } },
    },
  },
} satisfies Prisma.InventoryTransactionInclude;
