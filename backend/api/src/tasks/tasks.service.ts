import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { NotificationType, TaskStatus, TaskType, TaskPriority, UserRole } from "@prisma/client";
import type { AuthenticatedUser } from "../auth/auth-user";
import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/prisma.service";
import { ReservationsService } from "../reservations/reservations.service";
import { CreateTaskDto } from "./create-task.dto";
import { CreateCycleCountPlanDto } from "./create-cycle-count-plan.dto";

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reservations: ReservationsService,
    private readonly notifications: NotificationsService,
  ) {}
  async list(actor: AuthenticatedUser) {
    const user = await this.resolveUser(actor);
    const manager = actor.roles.some((r) => r === "manager" || r === "administrator");
    return this.prisma.inventoryTask.findMany({
      // Workers see their own tasks plus the shared pool of unassigned open
      // tasks (for example expected-receiving tasks created when a purchase
      // order is approved). Any available executive can claim one by starting
      // it. Unassigned reservation shipments are excluded: they wait for a
      // manager to assign them from the reservation card and must not appear
      // in a worker's queue as claimable work.
      where: manager ? undefined : {
        OR: [
          { assignedToId: user.id },
          { assignedToId: null, status: TaskStatus.OPEN, NOT: { type: TaskType.SHIP } },
        ],
      },
      include: {
        product: true,
        location: true,
        sourceLocation: true,
        destinationLocation: true,
        assignedTo: true,
        cycleCountPlan: {
          include: {
            tasks: { select: { id: true, status: true } },
          },
        },
        // Recount tasks expose their linked discrepancy so the worker queue
        // can show the case number and previous count details.
        discrepancies: {
          select: {
            id: true,
            caseNumber: true,
            expectedQuantity: true,
            countedQuantity: true,
            differenceQuantity: true,
            status: true,
            managerNotes: true,
          },
        },
        // Reservation shipment tasks expose the order reference so the queue
        // can show which reservation is being shipped.
        reservation: {
          select: {
            id: true,
            reservationNumber: true,
            request: { select: { referenceNumber: true, requestedFor: true } },
          },
        },
      },
      orderBy: [{ status: "asc" }, { priority: "desc" }, { dueAt: "asc" }],
    });
  }
  /**
   * Active Warehouse Executives with their current actionable open-task count.
   * The manager UI uses the count to pick a worker and the prepare-shipment
   * modal shows it next to each candidate.
   */
  async listAssignees() {
    const workers = await this.prisma.user.findMany({
      where: { active: true, role: UserRole.WORKER },
      select: { id: true, employeeId: true, displayName: true, shift: true, warehouseZone: true },
      orderBy: [{ warehouseZone: "asc" }, { shift: "asc" }, { displayName: "asc" }],
    });
    const counts = await this.prisma.inventoryTask.groupBy({
      by: ["assignedToId"],
      where: {
        assignedToId: { in: workers.map((worker) => worker.id) },
        status: { in: [TaskStatus.OPEN, TaskStatus.IN_PROGRESS] },
      },
      _count: { _all: true },
    });
    const countByWorker = new Map(counts.map((entry) => [entry.assignedToId, entry._count._all]));
    return workers.map((worker) => ({ ...worker, openTaskCount: countByWorker.get(worker.id) ?? 0 }));
  }
  async create(input: CreateTaskDto) {
    const [worker, product, location, sourceLocation, destinationLocation] = await Promise.all([
      this.prisma.user.findFirst({ where: { id: input.assignedToId, active: true, role: UserRole.WORKER } }),
      input.productId ? this.prisma.product.findFirst({ where: { id: input.productId, active: true } }) : null,
      input.locationId ? this.prisma.location.findFirst({ where: { id: input.locationId, active: true } }) : null,
      input.sourceLocationId ? this.prisma.location.findFirst({ where: { id: input.sourceLocationId, active: true } }) : null,
      input.destinationLocationId ? this.prisma.location.findFirst({ where: { id: input.destinationLocationId, active: true } }) : null,
    ]);
    if (!worker) throw new NotFoundException("Active Warehouse Executive not found.");
    if (input.productId && !product) throw new NotFoundException("Active product not found.");
    if (input.locationId && !location) throw new NotFoundException("Active warehouse location not found.");
    if (input.sourceLocationId && !sourceLocation) throw new NotFoundException("Active source location not found.");
    if (input.destinationLocationId && !destinationLocation) throw new NotFoundException("Active destination location not found.");

    if (input.type === TaskType.TRANSFER) {
      if (!product || !input.quantity || !sourceLocation || !destinationLocation) {
        throw new BadRequestException(
          "A transfer task requires a product, quantity, source location and destination location.",
        );
      }
      if (sourceLocation.id === destinationLocation.id) {
        throw new BadRequestException(
          "Transfer source and destination locations must be different.",
        );
      }
      const balance = await this.prisma.inventoryBalance.findUnique({
        where: {
          productId_locationId: {
            productId: product.id,
            locationId: sourceLocation.id,
          },
        },
      });
      const available =
        (balance?.quantity ?? 0) - (balance?.reservedQuantity ?? 0);
      if (input.quantity > available) {
        throw new ConflictException(
          `Only ${Math.max(0, available)} units are available at ${sourceLocation.name}.`,
        );
      }
    }
    if (input.type === TaskType.CYCLE_COUNT) {
      if (!product || !location) {
        throw new BadRequestException("A cycle-count task requires a product and counting location.");
      }
      const duplicate = await this.prisma.inventoryTask.findFirst({
        where: {
          type: TaskType.CYCLE_COUNT,
          productId: product.id,
          locationId: location.id,
          status: { in: [TaskStatus.OPEN, TaskStatus.IN_PROGRESS] },
        },
      });
      if (duplicate) {
        throw new ConflictException("An open cycle-count task already exists for this item and location.");
      }
    }

    return this.prisma.inventoryTask.create({
      data: {
        type: input.type,
        priority: input.priority,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        dueAt: input.dueAt ? new Date(input.dueAt) : null,
        assignedToId: input.assignedToId,
        productId: input.productId || null,
        locationId: input.type === TaskType.TRANSFER ? null : input.locationId || null,
        quantity: input.type === TaskType.TRANSFER ? input.quantity : null,
        sourceLocationId:
          input.type === TaskType.TRANSFER ? input.sourceLocationId : null,
        destinationLocationId:
          input.type === TaskType.TRANSFER
            ? input.destinationLocationId
            : null,
      },
      include: {
        assignedTo: true,
        product: true,
        location: true,
        sourceLocation: true,
        destinationLocation: true,
      },
    });
  }

  async createCycleCountPlan(input: CreateCycleCountPlanDto) {
    if (input.dueAt && input.dueAt.slice(0, 7) !== input.periodMonth) {
      throw new BadRequestException("The cycle-count due date must be inside the selected count period.");
    }
    const locationIds = [...new Set(input.locationIds)];
    const [worker, locations, balances, existing] = await Promise.all([
      this.prisma.user.findFirst({
        where: { id: input.assignedToId, active: true, role: UserRole.WORKER },
      }),
      this.prisma.location.findMany({
        where: { id: { in: locationIds }, active: true },
        orderBy: { name: "asc" },
      }),
      this.prisma.inventoryBalance.findMany({
        where: {
          locationId: { in: locationIds },
          quantity: { gt: 0 },
          product: { active: true },
          location: { active: true },
        },
        include: { product: true, location: true },
        orderBy: [{ location: { name: "asc" } }, { product: { name: "asc" } }],
      }),
      this.prisma.inventoryTask.findMany({
        where: {
          type: TaskType.CYCLE_COUNT,
          status: { in: [TaskStatus.OPEN, TaskStatus.IN_PROGRESS] },
          locationId: { in: locationIds },
        },
        select: { productId: true, locationId: true },
      }),
    ]);
    if (!worker) throw new NotFoundException("Active Warehouse Executive not found.");
    if (locations.length !== locationIds.length) {
      throw new BadRequestException("One or more selected warehouse locations are inactive or unavailable.");
    }
    if (balances.length === 0) {
      throw new BadRequestException("No active products with stock were found at the selected locations.");
    }
    const duplicateKeys = new Set(existing.map((task) => `${task.productId}:${task.locationId}`));
    const taskBalances = balances.filter((balance) => !duplicateKeys.has(`${balance.productId}:${balance.locationId}`));
    if (taskBalances.length === 0) {
      throw new ConflictException("Every selected item and location already has an open cycle-count task.");
    }
    const dueAt = input.dueAt ? new Date(input.dueAt) : null;
    const planNumber = `CC-${new Date().toISOString().replace(/\D/g, "").slice(0, 14)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const periodLabel = new Date(`${input.periodMonth}-01T00:00:00.000Z`).toLocaleString("en-US", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
    const title = locations.length === 1
      ? `${periodLabel} cycle count — ${locations[0].name}`
      : `${periodLabel} cycle count — ${locations.length} locations`;
    return this.prisma.$transaction(async (database) => {
      const plan = await database.cycleCountPlan.create({
        data: {
          planNumber,
          title,
          periodMonth: input.periodMonth,
          priority: input.priority,
          dueAt,
          blindCount: input.blindCount ?? true,
          assignedToId: worker.id,
        },
      });
      await database.inventoryTask.createMany({
        data: taskBalances.map((balance) => ({
          type: TaskType.CYCLE_COUNT,
          priority: input.priority,
          title: `Count ${balance.product.name}`,
          description: `${input.blindCount ?? true ? "Blind count" : "Cycle count"} for ${balance.product.name} at ${balance.location.name} (${balance.location.code}). Count only this item at this location.`,
          dueAt,
          assignedToId: worker.id,
          productId: balance.productId,
          locationId: balance.locationId,
          cycleCountPlanId: plan.id,
        })),
      });
      const tasks = await database.inventoryTask.findMany({
        where: { cycleCountPlanId: plan.id },
        include: { product: true, location: true, assignedTo: true },
        orderBy: [{ location: { name: "asc" } }, { product: { name: "asc" } }],
      });
      return {
        ...plan,
        tasks,
        createdTasks: tasks.length,
        skippedDuplicates: balances.length - taskBalances.length,
        selectedLocations: locations.length,
      };
    });
  }
  async removeOpen(id: string) {
    const task = await this.prisma.inventoryTask.findUnique({ where: { id } });
    if (!task) throw new NotFoundException("Task not found.");
    if (task.status !== TaskStatus.OPEN) {
      throw new ConflictException("Only open tasks that have not started can be deleted.");
    }
    return this.prisma.inventoryTask.update({
      where: { id },
      data: { status: TaskStatus.CANCELLED },
    });
  }
  async changeStatus(id: string, status: TaskStatus, actor: AuthenticatedUser) {
    const user = await this.resolveUser(actor);
    const task = await this.prisma.inventoryTask.findUnique({ where: { id } });
    if (!task) throw new NotFoundException("Task not found.");
    const manager = actor.roles.some((r) => r === "manager" || r === "administrator");
    const shipmentTask = task.type === TaskType.SHIP && task.reservationId !== null;
    const unassigned = task.assignedToId === null;
    if (shipmentTask && unassigned && !manager) {
      throw new ForbiddenException(
        "This shipment task is not assigned yet. A manager must assign it before it can be started or completed.",
      );
    }
    if (!manager && task.assignedToId !== user.id && !unassigned) {
      throw new ForbiddenException("This task is assigned to another user.");
    }
    if (task.status === TaskStatus.COMPLETED) {
      throw new ConflictException("Completed tasks cannot be changed.");
    }
    if (task.status === TaskStatus.CANCELLED) {
      throw new ConflictException("Cancelled tasks cannot be changed.");
    }

    // A reservation shipment is posted atomically with the task completion:
    // the Ship transaction, the on-hand/reserved reduction and the reservation
    // status change all commit together.
    if (shipmentTask && status === TaskStatus.COMPLETED) {
      return this.reservations.completeShipmentTask(id, actor);
    }

    // A worker claims an unassigned task (for example an expected-receiving
    // task from an approved purchase order) the moment they start or complete
    // it, so the queue always records who performed the work. The claim is a
    // conditional update on assignedToId: null so only the first worker wins
    // when two people start the same task at the same time.
    if (unassigned) {
      const claimed = await this.prisma.inventoryTask.updateMany({
        where: { id, assignedToId: null },
        data: {
          status,
          ...(status === TaskStatus.IN_PROGRESS
            ? { startedAt: new Date(), assignedToId: user.id }
            : {}),
          ...(status === TaskStatus.COMPLETED
            ? { completedAt: new Date(), assignedToId: user.id }
            : {}),
        },
      });
      if (claimed.count === 0) {
        throw new ConflictException(
          "This task was already claimed by another warehouse executive.",
        );
      }
      return this.prisma.inventoryTask.findUniqueOrThrow({ where: { id } });
    }

    return this.prisma.inventoryTask.update({
      where: { id },
      data: {
        status,
        ...(status === TaskStatus.IN_PROGRESS ? { startedAt: new Date() } : {}),
        ...(status === TaskStatus.COMPLETED ? { completedAt: new Date() } : {}),
      },
    });
  }

  /**
   * Manager-only reassignment. Validates that the target is an active
   * Warehouse Executive (never a Manager or Administrator), records the
   * reassignment in the reservation audit when the task belongs to a
   * reservation, and notifies the newly assigned worker.
   */
  async reassign(id: string, workerId: string, actor: AuthenticatedUser) {
    const user = await this.resolveUser(actor);
    const task = await this.prisma.inventoryTask.findUnique({
      where: { id },
      include: {
        reservation: { select: { id: true, stockRequestId: true } },
      },
    });
    if (!task) throw new NotFoundException("Task not found.");
    if (task.status === TaskStatus.COMPLETED || task.status === TaskStatus.CANCELLED) {
      throw new ConflictException("Completed or cancelled tasks cannot be reassigned.");
    }
    const worker = await this.prisma.user.findFirst({
      where: { id: workerId, active: true, role: UserRole.WORKER },
    });
    if (!worker) throw new NotFoundException("Active Warehouse Executive not found.");
    if (task.assignedToId === worker.id) {
      return { idempotent: true, task: await this.prisma.inventoryTask.findUniqueOrThrow({ where: { id } }) };
    }
    const updated = await this.prisma.inventoryTask.update({
      where: { id },
      data: {
        assignedToId: worker.id,
        // Reassigning an unstarted task keeps it open; a started task stays
        // in progress under the new assignee.
        ...(task.status === TaskStatus.IN_PROGRESS ? {} : { startedAt: null }),
      },
    });
    if (task.reservation) {
      await this.prisma.reservationAuditEvent.create({
        data: {
          stockRequestId: task.reservation.stockRequestId,
          reservationId: task.reservation.id,
          action: "SHIPMENT_REASSIGNED",
          details: `${task.shipmentReference ?? "Shipment"} reassigned to ${worker.displayName}.`,
          actorId: user.id,
        },
      });
    }
    await this.notifications.createForUser(this.prisma, {
      userId: worker.id,
      type: NotificationType.SHIPMENT_TASK_ASSIGNED,
      title: "Shipment task assigned to you",
      message: `${task.title}${task.shipmentReference ? ` (${task.shipmentReference})` : ""}.`,
      linkType: "task",
      linkId: task.id,
    });
    return { idempotent: false, task: updated };
  }
  createRecountTask(transaction: { id: string; productId: string; createdById: string | null; sourceLocationId: string | null; product: { name: string } }) {
    const dueAt = new Date(); dueAt.setHours(17, 0, 0, 0);
    return this.prisma.inventoryTask.upsert({ where: { sourceTransactionId: transaction.id }, update: {}, create: { type: TaskType.RECOUNT, priority: TaskPriority.HIGH, title: `Recount ${transaction.product.name}`, description: "Manager requested a physical recount before inventory adjustment.", dueAt, assignedToId: transaction.createdById, productId: transaction.productId, locationId: transaction.sourceLocationId, sourceTransactionId: transaction.id } });
  }
  private async resolveUser(actor: AuthenticatedUser) {
    const email = actor.email?.toLowerCase();
    const found = email
      ? await this.prisma.user.findUnique({ where: { email } })
      : await this.prisma.user.findUnique({ where: { employeeId: actor.username.toUpperCase() } });
    if (found) return found;
    const role = actor.roles.includes("administrator")
      ? UserRole.ADMINISTRATOR
      : actor.roles.includes("manager")
        ? UserRole.MANAGER
        : UserRole.WORKER;
    return this.prisma.user.create({ data: { employeeId: actor.username.toUpperCase(), email: email ?? `${actor.username}@keycloak.local`, displayName: actor.username, role } });
  }
}
