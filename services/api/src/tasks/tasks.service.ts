import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, TaskStatus, TaskType, TaskPriority, UserRole } from "@prisma/client";
import type { AuthenticatedUser } from "../auth/auth-user";
import { PrismaService } from "../prisma/prisma.service";
import { CreateTaskDto } from "./create-task.dto";

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}
  async list(actor: AuthenticatedUser) {
    const user = await this.resolveUser(actor);
    const manager = actor.roles.some((r) => r === "manager" || r === "administrator");
    return this.prisma.inventoryTask.findMany({
      // Workers see their own tasks plus the shared pool of unassigned open
      // tasks (for example expected-receiving tasks created when a purchase
      // order is approved). Any available executive can claim one by starting it.
      where: manager ? undefined : { OR: [{ assignedToId: user.id }, { assignedToId: null, status: TaskStatus.OPEN }] },
      include: { product: true, location: true, assignedTo: true },
      orderBy: [{ status: "asc" }, { priority: "desc" }, { dueAt: "asc" }],
    });
  }
  listAssignees() {
    return this.prisma.user.findMany({ where: { active: true, role: UserRole.WORKER }, select: { id: true, employeeId: true, displayName: true }, orderBy: { displayName: "asc" } });
  }
  async create(input: CreateTaskDto) {
    const [worker, product, location] = await Promise.all([
      this.prisma.user.findFirst({ where: { id: input.assignedToId, active: true, role: UserRole.WORKER } }),
      input.productId ? this.prisma.product.findFirst({ where: { id: input.productId, active: true } }) : null,
      input.locationId ? this.prisma.location.findFirst({ where: { id: input.locationId, active: true } }) : null,
    ]);
    if (!worker) throw new NotFoundException("Active Warehouse Executive not found.");
    if (input.productId && !product) throw new NotFoundException("Active product not found.");
    if (input.locationId && !location) throw new NotFoundException("Active warehouse location not found.");
    return this.prisma.inventoryTask.create({ data: { type: input.type, priority: input.priority, title: input.title.trim(), description: input.description?.trim() || null, dueAt: input.dueAt ? new Date(input.dueAt) : null, assignedToId: input.assignedToId, productId: input.productId || null, locationId: input.locationId || null }, include: { assignedTo: true, product: true, location: true } });
  }
  async changeStatus(id: string, status: TaskStatus, actor: AuthenticatedUser) {
    const user = await this.resolveUser(actor);
    const task = await this.prisma.inventoryTask.findUnique({ where: { id } });
    if (!task) throw new NotFoundException("Task not found.");
    const manager = actor.roles.some((r) => r === "manager" || r === "administrator");
    const unassigned = task.assignedToId === null;
    if (!manager && task.assignedToId !== user.id && !unassigned) {
      throw new ForbiddenException("This task is assigned to another user.");
    }
    if (task.status === TaskStatus.COMPLETED) {
      throw new ConflictException("Completed tasks cannot be changed.");
    }
    if (task.status === TaskStatus.CANCELLED) {
      throw new ConflictException("Cancelled tasks cannot be changed.");
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
  createRecountTask(transaction: { id: string; productId: string; createdById: string | null; sourceLocationId: string | null; product: { name: string } }) {
    const dueAt = new Date(); dueAt.setHours(17, 0, 0, 0);
    return this.prisma.inventoryTask.upsert({ where: { sourceTransactionId: transaction.id }, update: {}, create: { type: TaskType.RECOUNT, priority: TaskPriority.HIGH, title: `Recount ${transaction.product.name}`, description: "Manager requested a physical recount before inventory adjustment.", dueAt, assignedToId: transaction.createdById, productId: transaction.productId, locationId: transaction.sourceLocationId, sourceTransactionId: transaction.id } });
  }
  /**
   * Creates the expected-receiving task for an approved reorder draft (the
   * purchase order). The unique sourceReorderDraftId link makes the operation
   * idempotent: re-approving an approved draft never creates a second task.
   * The task starts unassigned in the shared pool and is due by the supplier's
   * lead time so any warehouse executive can pick it up when the delivery lands.
   */
  createExpectedReceivingTask(
    draft: {
      id: string;
      productId: string;
      locationId: string;
      suggestedQuantity: number;
      product: {
        name: string;
        unit: string;
        supplier?: { leadTimeDays: number } | null;
      };
    },
    client: Prisma.TransactionClient = this.prisma,
  ) {
    const dueAt = new Date();
    const leadTimeDays = draft.product.supplier?.leadTimeDays ?? 0;
    if (leadTimeDays > 0) dueAt.setDate(dueAt.getDate() + leadTimeDays);
    dueAt.setHours(17, 0, 0, 0);
    const unit = draft.product.unit;
    const quantityLabel = `${draft.suggestedQuantity} ${unit}${draft.suggestedQuantity === 1 ? "" : "s"}`;
    return client.inventoryTask.upsert({
      where: { sourceReorderDraftId: draft.id },
      update: {},
      create: {
        type: TaskType.RECEIVE,
        priority: TaskPriority.HIGH,
        title: `Receive ${draft.product.name}`,
        description: `Expected receiving for approved purchase order: ${quantityLabel}, expected by ${new Intl.DateTimeFormat("en", { day: "2-digit", month: "short", year: "numeric" }).format(dueAt)}.`,
        dueAt,
        assignedToId: null,
        productId: draft.productId,
        locationId: draft.locationId,
        sourceReorderDraftId: draft.id,
      },
    });
  }
  /**
   * Closes the linked expected-receiving task when a purchase order is
   * cancelled (manually by a manager or automatically when stock recovers).
   * Completed tasks are preserved for the audit trail.
   */
  async cancelTasksForReorderDraft(
    draftId: string,
    client: Prisma.TransactionClient = this.prisma,
  ) {
    await client.inventoryTask.updateMany({
      where: {
        sourceReorderDraftId: draftId,
        status: { in: [TaskStatus.OPEN, TaskStatus.IN_PROGRESS] },
      },
      data: { status: TaskStatus.CANCELLED },
    });
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
