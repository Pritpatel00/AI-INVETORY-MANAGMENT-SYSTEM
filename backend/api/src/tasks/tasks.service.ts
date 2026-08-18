import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { NotificationType, Prisma, TaskStatus, TaskType, TaskPriority, UserRole } from "@prisma/client";
import { createHash } from "node:crypto";
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
    if (input.dueAt) {
      const due = new Date(input.dueAt);
      if (Number.isNaN(due.getTime())) {
        throw new BadRequestException("The cycle-count due date is invalid.");
      }
      if (due.getTime() < Date.now()) {
        throw new BadRequestException("The cycle-count due date must be in the future.");
      }
    }
    const locationIds = [...new Set(input.locationIds)];
    const blindCount = input.blindCount ?? true;
    const instructions = input.instructions?.trim() || null;
    const requestKey = createCycleCountRequestKey({
      periodMonth: input.periodMonth,
      locationIds,
      assignedToId: input.assignedToId,
      priority: input.priority,
      dueAt: input.dueAt ?? null,
      blindCount,
      instructions,
    });
    const planInclude = {
      assignedTo: { select: { id: true, employeeId: true, displayName: true } },
      tasks: {
        include: {
          product: true,
          location: true,
          assignedTo: { select: { id: true, employeeId: true, displayName: true } },
        },
        orderBy: [{ location: { name: "asc" } }, { product: { name: "asc" } }],
      },
    } satisfies Prisma.CycleCountPlanInclude;

    // Idempotency: repeating the exact same request returns the existing plan
    // and its tasks instead of creating duplicates. The unique requestKey on
    // the plan makes this safe even under concurrent identical submissions.
    const existing = await this.prisma.cycleCountPlan.findUnique({
      where: { requestKey },
      include: planInclude,
    });
    if (existing) {
      return {
        ...existing,
        createdTasks: existing.tasks.length,
        skippedDuplicates: 0,
        selectedLocations: locationIds.length,
        idempotent: true,
      };
    }

    const [worker, locations, balances, existingTasks] = await Promise.all([
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
      // Duplicate prevention is scoped to the count period: an existing
      // cycle-count task for the same period, product and location blocks a
      // new one. The database partial unique index enforces the same rule
      // even when two requests race.
      this.prisma.inventoryTask.findMany({
        where: {
          type: TaskType.CYCLE_COUNT,
          periodMonth: input.periodMonth,
          locationId: { in: locationIds },
        },
        select: { productId: true, locationId: true },
      }),
    ]);
    if (!worker) throw new NotFoundException("Active Warehouse Executive not found.");
    if (locations.length !== locationIds.length) {
      throw new BadRequestException("One or more selected warehouse locations are inactive or unavailable.");
    }
    const periodLabel = formatPeriodMonth(input.periodMonth);
    // Reject any selected location that has no stocked items: a month-end
    // count only ever targets items with on-hand quantity greater than zero.
    const stockedLocationIds = new Set(balances.map((balance) => balance.locationId));
    const emptyLocation = locations.find((location) => !stockedLocationIds.has(location.id));
    if (emptyLocation) {
      throw new BadRequestException(
        `${emptyLocation.name} has no items with stock to count for ${periodLabel}.`,
      );
    }
    const duplicateKeys = new Set(
      existingTasks.map((task) => `${task.productId}:${task.locationId}`),
    );
    const taskBalances = balances.filter(
      (balance) => !duplicateKeys.has(`${balance.productId}:${balance.locationId}`),
    );
    if (taskBalances.length === 0) {
      throw new ConflictException(
        "Every selected item and location already has a cycle-count task for this period.",
      );
    }
    const dueAt = input.dueAt ? new Date(input.dueAt) : null;
    const planNumber = `CC-${new Date().toISOString().replace(/\D/g, "").slice(0, 14)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const title = locations.length === 1
      ? `${periodLabel} cycle count — ${locations[0].name}`
      : `${periodLabel} cycle count — ${locations.length} locations`;
    try {
      return await this.prisma.$transaction(async (database) => {
        const plan = await database.cycleCountPlan.create({
          data: {
            planNumber,
            title,
            periodMonth: input.periodMonth,
            priority: input.priority,
            dueAt,
            blindCount,
            instructions,
            requestKey,
            assignedToId: worker.id,
          },
        });
        const created = await database.inventoryTask.createMany({
          data: taskBalances.map((balance) => ({
            type: TaskType.CYCLE_COUNT,
            priority: input.priority,
            title: `Count ${balance.product.name}`,
            description: buildCycleCountDescription(
              balance,
              blindCount,
              instructions,
            ),
            dueAt,
            assignedToId: worker.id,
            productId: balance.productId,
            locationId: balance.locationId,
            cycleCountPlanId: plan.id,
            periodMonth: input.periodMonth,
          })),
          // A concurrent request may have already inserted the same
          // period/product/location rows; skip those instead of failing.
          skipDuplicates: true,
        });
        if (created.count === 0) {
          throw new ConflictException(
            "Every selected item and location already has a cycle-count task for this period.",
          );
        }
        const tasks = await database.inventoryTask.findMany({
          where: { cycleCountPlanId: plan.id },
          include: {
            product: true,
            location: true,
            assignedTo: { select: { id: true, employeeId: true, displayName: true } },
          },
          orderBy: [{ location: { name: "asc" } }, { product: { name: "asc" } }],
        });
        // Notify the assigned Warehouse Executive so the new count work is
        // visible immediately.
        await this.notifications.createForUser(database, {
          userId: worker.id,
          type: NotificationType.CYCLE_COUNT_PLAN_ASSIGNED,
          title: "Month-End Cycle Count plan assigned",
          message: `${planNumber}: ${tasks.length} count task${tasks.length === 1 ? "" : "s"} assigned for ${periodLabel}.`,
          linkType: "task",
          linkId: plan.id,
        });
        return {
          ...plan,
          assignedTo: worker,
          tasks,
          createdTasks: tasks.length,
          skippedDuplicates: balances.length - taskBalances.length,
          selectedLocations: locations.length,
          idempotent: false,
        };
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        // Two identical requests raced and one plan won the unique requestKey.
        // Return the winner's plan and tasks instead of failing.
        const winner = await this.prisma.cycleCountPlan.findUnique({
          where: { requestKey },
          include: planInclude,
        });
        if (winner) {
          return {
            ...winner,
            createdTasks: winner.tasks.length,
            skippedDuplicates: 0,
            selectedLocations: locationIds.length,
            idempotent: true,
          };
        }
      }
      throw error;
    }
  }

  /**
   * Month-End Cycle Count plans for the manager monitoring section, each with
   * derived task statistics and the number of discrepancies produced by the
   * plan's tasks (linked through the count transaction).
   */
  async listCycleCountPlans() {
    const plans = await this.prisma.cycleCountPlan.findMany({
      include: {
        assignedTo: { select: { id: true, employeeId: true, displayName: true } },
        tasks: {
          select: {
            id: true,
            status: true,
            location: { select: { id: true, code: true, name: true } },
          },
        },
      },
      orderBy: [{ createdAt: "desc" }],
    });
    const taskIds = plans.flatMap((plan) => plan.tasks.map((task) => task.id));
    const discrepancyCounts = await this.countDiscrepanciesByTask(taskIds);
    return plans.map((plan) => this.summarizePlan(plan, discrepancyCounts));
  }

  /**
   * One Month-End Cycle Count plan with every generated task, its product,
   * location, status and any linked discrepancy cases.
   */
  async getCycleCountPlan(id: string) {
    const plan = await this.prisma.cycleCountPlan.findUnique({
      where: { id },
      include: {
        assignedTo: { select: { id: true, employeeId: true, displayName: true } },
        tasks: {
          include: {
            product: true,
            location: true,
            assignedTo: { select: { id: true, employeeId: true, displayName: true } },
          },
          orderBy: [{ location: { name: "asc" } }, { product: { name: "asc" } }],
        },
      },
    });
    if (!plan) throw new NotFoundException("Cycle count plan not found.");
    const taskIds = plan.tasks.map((task) => task.id);
    const discrepancyCounts = await this.countDiscrepanciesByTask(taskIds);
    const discrepancies = taskIds.length
      ? await this.prisma.discrepancy.findMany({
          where: { transaction: { taskId: { in: taskIds } } },
          select: {
            id: true,
            caseNumber: true,
            status: true,
            expectedQuantity: true,
            countedQuantity: true,
            transaction: { select: { taskId: true } },
          },
          orderBy: { createdAt: "asc" },
        })
      : [];
    const discrepanciesByTask = new Map<string, typeof discrepancies>();
    for (const entry of discrepancies) {
      const taskId = entry.transaction?.taskId;
      if (!taskId) continue;
      const list = discrepanciesByTask.get(taskId) ?? [];
      list.push(entry);
      discrepanciesByTask.set(taskId, list);
    }
    const tasks = plan.tasks.map((task) => ({
      ...task,
      discrepancies: discrepanciesByTask.get(task.id) ?? [],
    }));
    return {
      ...this.summarizePlan(plan, discrepancyCounts),
      instructions: plan.instructions,
      tasks,
      discrepancyCount: discrepancies.length,
    };
  }

  /**
   * Count discrepancies whose originating count transaction is linked to the
   * given task ids (taskId -> count).
   */
  private async countDiscrepanciesByTask(taskIds: string[]) {
    const counts = new Map<string, number>();
    if (taskIds.length === 0) return counts;
    const rows = await this.prisma.discrepancy.findMany({
      where: { transaction: { taskId: { in: taskIds } } },
      select: { transaction: { select: { taskId: true } } },
    });
    for (const row of rows) {
      const taskId = row.transaction?.taskId;
      if (!taskId) continue;
      counts.set(taskId, (counts.get(taskId) ?? 0) + 1);
    }
    return counts;
  }

  /**
   * Derive the manager-facing summary for a plan: distinct locations, task
   * totals by status, plan status and discrepancy count.
   */
  private summarizePlan(
    plan: {
      id: string;
      planNumber: string;
      title: string;
      periodMonth: string;
      priority: TaskPriority;
      dueAt: Date | null;
      blindCount: boolean;
      assignedToId: string;
      createdAt: Date;
      assignedTo?: { id: string; employeeId: string; displayName: string };
      tasks: Array<{ id: string; status: TaskStatus; location?: { id: string; code: string; name: string } | null }>;
    },
    discrepancyCounts: Map<string, number>,
  ) {
    const locationMap = new Map<string, { id: string; code: string; name: string }>();
    for (const task of plan.tasks) {
      if (task.location) locationMap.set(task.location.id, task.location);
    }
    const totalTasks = plan.tasks.length;
    const openTasks = plan.tasks.filter((task) => task.status === TaskStatus.OPEN).length;
    const inProgressTasks = plan.tasks.filter((task) => task.status === TaskStatus.IN_PROGRESS).length;
    const completedTasks = plan.tasks.filter((task) => task.status === TaskStatus.COMPLETED).length;
    const cancelledTasks = plan.tasks.filter((task) => task.status === TaskStatus.CANCELLED).length;
    const status =
      totalTasks === 0
        ? "EMPTY"
        : completedTasks === totalTasks
          ? "COMPLETED"
          : inProgressTasks > 0
            ? "IN_PROGRESS"
            : openTasks > 0
              ? "OPEN"
              : "CANCELLED";
    return {
      id: plan.id,
      planNumber: plan.planNumber,
      title: plan.title,
      periodMonth: plan.periodMonth,
      priority: plan.priority,
      dueAt: plan.dueAt,
      blindCount: plan.blindCount,
      assignedToId: plan.assignedToId,
      createdAt: plan.createdAt,
      assignedTo: plan.assignedTo,
      locations: [...locationMap.values()],
      totalTasks,
      openTasks,
      inProgressTasks,
      completedTasks,
      cancelledTasks,
      discrepancyCount: plan.tasks.reduce(
        (sum, task) => sum + (discrepancyCounts.get(task.id) ?? 0),
        0,
      ),
      status,
    };
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

/**
 * Deterministic fingerprint of a normalized plan request. The exact same
 * request (same period, locations, assignee, priority, due date, blind flag
 * and instructions) always produces the same key, which is what makes plan
 * creation idempotent.
 */
function createCycleCountRequestKey(input: {
  periodMonth: string;
  locationIds: string[];
  assignedToId: string;
  priority: TaskPriority;
  dueAt: string | null;
  blindCount: boolean;
  instructions: string | null;
}) {
  const canonical = JSON.stringify({
    periodMonth: input.periodMonth,
    locationIds: [...input.locationIds].sort(),
    assignedToId: input.assignedToId,
    priority: input.priority,
    dueAt: input.dueAt,
    blindCount: input.blindCount,
    instructions: input.instructions,
  });
  return createHash("sha256").update(canonical).digest("hex");
}

function formatPeriodMonth(periodMonth: string) {
  return new Date(`${periodMonth}-01T00:00:00.000Z`).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function buildCycleCountDescription(
  balance: { product: { name: string }; location: { name: string; code: string } },
  blindCount: boolean,
  instructions: string | null,
) {
  const base = `${blindCount ? "Blind count" : "Cycle count"} for ${balance.product.name} at ${balance.location.name} (${balance.location.code}). Count only this item at this location.`;
  return instructions ? `${base}\nInstructions: ${instructions}` : base;
}
