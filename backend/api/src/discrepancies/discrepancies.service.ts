import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  DiscrepancyAuditAction,
  DiscrepancyReason,
  DiscrepancySeverity,
  DiscrepancyStatus,
  InventoryAction,
  NotificationType,
  Prisma,
  TaskPriority,
  TaskStatus,
  TaskType,
  TransactionStatus,
  UserRole,
} from "@prisma/client";

import type { AuthenticatedUser } from "../auth/auth-user";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { InventoryRulesEngine } from "../inventory/rules/inventory-rules.engine";
import { ListDiscrepanciesDto } from "./dto/list-discrepancies.dto";
import { DiscrepancyRulesService } from "./discrepancy-rules.service";
import { DiscrepancyAuditService } from "./discrepancy-audit.service";
import {
  ApproveDiscrepancyDto,
  RejectDiscrepancyDto,
  RequestRecountDto,
  ResolveTransferDto,
} from "./dto/discrepancy-decision.dto";

const discrepancyEvidenceInclude = {
  select: {
    id: true,
    originalFilename: true,
    mimeType: true,
    sizeBytes: true,
    createdAt: true,
    uploadedBy: { select: { id: true, employeeId: true, displayName: true } },
  },
  orderBy: { createdAt: "asc" },
} satisfies Prisma.DiscrepancyEvidenceFindManyArgs;

const discrepancyInclude = {
  product: true,
  location: true,
  transaction: true,
  worker: { select: { id: true, employeeId: true, displayName: true } },
  assignedManager: {
    select: { id: true, employeeId: true, displayName: true },
  },
  recountTask: {
    select: { id: true, title: true, status: true, dueAt: true },
  },
  resolutionTransaction: {
    select: { id: true, action: true, status: true, postedAt: true },
  },
  resolvedBy: {
    select: { id: true, employeeId: true, displayName: true },
  },
  evidence: discrepancyEvidenceInclude,
} satisfies Prisma.DiscrepancyInclude;

/** Statuses that can still be decided by a manager. */
const DECIDABLE_STATUSES: DiscrepancyStatus[] = [
  DiscrepancyStatus.OPEN,
  DiscrepancyStatus.AWAITING_REVIEW,
  DiscrepancyStatus.RECOUNT_REQUESTED,
];

const ACTIVE_DISCREPANCY_STATUSES: DiscrepancyStatus[] = [
  DiscrepancyStatus.OPEN,
  DiscrepancyStatus.AWAITING_REVIEW,
  DiscrepancyStatus.RECOUNT_REQUESTED,
];

@Injectable()
export class DiscrepanciesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rules: DiscrepancyRulesService,
    private readonly notifications: NotificationsService,
    private readonly inventoryRules: InventoryRulesEngine,
    private readonly auditService: DiscrepancyAuditService,
  ) {}

  /**
   * Create a discrepancy for a confirmed Cycle Count difference.
   * Expected quantity always comes from the database balance, never from the
   * client. The case number is unique and human-readable (DSC-YYYYMMDD-XXXX).
   * One transaction can never produce more than one discrepancy because the
   * `transactionId` column is unique. Managers are notified in the same
   * transaction; major and critical cases get their own high-priority alert.
   */
  async createForCycleCount(database: Prisma.TransactionClient, input: {
    transactionId: string;
    productId: string;
    locationId: string;
    expectedQuantity: number;
    countedQuantity: number;
    workerId: string | null;
    workerNotes?: string | null;
    controlled?: boolean;
    transcript?: string | null;
  }) {
    const evaluation = this.rules.evaluateDiscrepancy(
      input.expectedQuantity,
      input.countedQuantity,
      input.controlled ?? false,
    );
    const caseNumber = await this.nextCaseNumber(database);
    const discrepancy = await database.discrepancy.create({
      data: {
        caseNumber,
        transactionId: input.transactionId,
        productId: input.productId,
        locationId: input.locationId,
        expectedQuantity: input.expectedQuantity,
        countedQuantity: input.countedQuantity,
        differenceQuantity: evaluation.differenceQuantity,
        differencePercentage: evaluation.differencePercentage,
        severity: evaluation.severity,
        severityRule: evaluation.rule,
        status: DiscrepancyStatus.AWAITING_REVIEW,
        reasonCode: DiscrepancyReason.COUNT_DIFFERENCE,
        workerNotes: input.workerNotes ?? null,
        workerId: input.workerId,
      },
    });

    // Append-only audit trail: the case is created and the worker's count is
    // recorded with the full before/after snapshot and the voice transcript.
    const snapshot = {
      discrepancyId: discrepancy.id,
      caseNumber,
      previousStatus: null,
      newStatus: DiscrepancyStatus.AWAITING_REVIEW,
      expectedQuantity: input.expectedQuantity,
      countedQuantity: input.countedQuantity,
      differenceQuantity: evaluation.differenceQuantity,
      severityRule: evaluation.rule,
      previousStock: input.expectedQuantity,
      actorWorkerId: input.workerId,
      transactionId: input.transactionId,
      rawTranscript: input.transcript ?? null,
    };
    await this.auditService.write(database, {
      ...snapshot,
      action: DiscrepancyAuditAction.CASE_CREATED,
      reason: "Cycle Count difference detected by the inventory rules.",
    });
    await this.auditService.write(database, {
      ...snapshot,
      action: DiscrepancyAuditAction.WORKER_CONFIRMED,
      reason: "Worker confirmed the physical count.",
    });

    const majorSeverities: DiscrepancySeverity[] = [
      DiscrepancySeverity.MAJOR,
      DiscrepancySeverity.CRITICAL,
    ];
    const major = majorSeverities.includes(evaluation.severity);
    await this.notifications.createForManagers(database, {
      type: major
        ? NotificationType.MAJOR_CRITICAL_DISCREPANCY
        : NotificationType.NEW_DISCREPANCY,
      title: major
        ? `Major discrepancy ${caseNumber}`
        : `New discrepancy ${caseNumber}`,
      message: `${input.countedQuantity} counted vs ${input.expectedQuantity} expected (${evaluation.severity}). Review required.`,
      linkType: "DISCREPANCY",
      linkId: discrepancy.id,
    });
    return discrepancy;
  }

  async list(actor: AuthenticatedUser, query: ListDiscrepanciesDto) {
    const user = await this.resolveUser(actor);
    const canSeeAll = this.hasManagerAccess(actor);
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));

    // Workers may only ever see their own records. A worker-provided workerId
    // filter is ignored so a worker cannot inspect another worker's cases.
    const workerFilter = canSeeAll
      ? query.workerId ?? undefined
      : user.id;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);

    const dashboardViewWhere: Prisma.DiscrepancyWhereInput =
      query.view === "OPEN"
        ? { status: DiscrepancyStatus.AWAITING_REVIEW }
        : query.view === "AWAITING_RECOUNT"
          ? { status: DiscrepancyStatus.RECOUNT_REQUESTED }
          : query.view === "HIGH_PRIORITY"
            ? {
                severity: {
                  in: [DiscrepancySeverity.MAJOR, DiscrepancySeverity.CRITICAL],
                },
              }
            : query.view === "RESOLVED_TODAY"
              ? { resolvedAt: { gte: startOfToday, lt: endOfToday } }
              : query.view === "MISSING"
                ? {
                    status: { in: ACTIVE_DISCREPANCY_STATUSES },
                    differenceQuantity: { lt: 0 },
                  }
                : query.view === "EXTRA"
                  ? {
                      status: { in: ACTIVE_DISCREPANCY_STATUSES },
                      differenceQuantity: { gt: 0 },
                    }
                  : {};

    const where: Prisma.DiscrepancyWhereInput = {
      ...dashboardViewWhere,
      ...(workerFilter ? { workerId: workerFilter } : {}),
      ...(query.productId ? { productId: query.productId } : {}),
      ...(query.locationId ? { locationId: query.locationId } : {}),
      ...(query.severity ? { severity: query.severity } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.difference
        ? {
            differenceQuantity:
              query.difference === "POSITIVE" ? { gt: 0 } : { lt: 0 },
          }
        : {}),
      ...(query.from || query.to
        ? {
            createdAt: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
    };

    // Sort by the chosen field in the requested direction. `sort` is validated
    // against a fixed allow-list by the DTO, so it is safe to interpolate.
    const direction = query.order === "asc" ? "asc" : "desc";
    const orderedBy: Prisma.DiscrepancyOrderByWithRelationInput = {
      [query.sort ?? "createdAt"]: direction,
    };

    const [items, total] = await Promise.all([
      this.prisma.discrepancy.findMany({
        where,
        include: discrepancyInclude,
        orderBy: orderedBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.discrepancy.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      hasMore: page * pageSize < total,
    };
  }

  async summary(actor: AuthenticatedUser) {
    const user = await this.resolveUser(actor);
    const canSeeAll = this.hasManagerAccess(actor);
    const baseWhere: Prisma.DiscrepancyWhereInput = canSeeAll
      ? {}
      : { workerId: user.id };

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);

    const [
      total,
      bySeverity,
      byStatus,
      awaitingReview,
      criticalOpen,
      resolvedToday,
      missingAggregate,
      extraAggregate,
    ] =
      await Promise.all([
        this.prisma.discrepancy.count({ where: baseWhere }),
        this.prisma.discrepancy.groupBy({
          by: ["severity"],
          where: baseWhere,
          _count: { _all: true },
        }),
        this.prisma.discrepancy.groupBy({
          by: ["status"],
          where: baseWhere,
          _count: { _all: true },
        }),
        this.prisma.discrepancy.count({
          where: {
            ...baseWhere,
            status: DiscrepancyStatus.AWAITING_REVIEW,
          },
        }),
        this.prisma.discrepancy.count({
          where: {
            ...baseWhere,
            severity: DiscrepancySeverity.CRITICAL,
            status: {
              in: [
                DiscrepancyStatus.OPEN,
                DiscrepancyStatus.AWAITING_REVIEW,
                DiscrepancyStatus.RECOUNT_REQUESTED,
              ],
            },
          },
        }),
        this.prisma.discrepancy.count({
          where: {
            ...baseWhere,
            resolvedAt: { gte: startOfToday, lt: endOfToday },
          },
        }),
        this.prisma.discrepancy.aggregate({
          where: {
            ...baseWhere,
            status: { in: ACTIVE_DISCREPANCY_STATUSES },
            differenceQuantity: { lt: 0 },
          },
          _sum: { differenceQuantity: true },
        }),
        this.prisma.discrepancy.aggregate({
          where: {
            ...baseWhere,
            status: { in: ACTIVE_DISCREPANCY_STATUSES },
            differenceQuantity: { gt: 0 },
          },
          _sum: { differenceQuantity: true },
        }),
      ]);

    const severityCounts = Object.values(DiscrepancySeverity).reduce<
      Record<string, number>
    >((acc, severity) => {
      acc[severity] = 0;
      return acc;
    }, {});
    for (const row of bySeverity) {
      severityCounts[row.severity] = row._count._all;
    }

    const statusCounts = Object.values(DiscrepancyStatus).reduce<
      Record<string, number>
    >((acc, status) => {
      acc[status] = 0;
      return acc;
    }, {});
    for (const row of byStatus) {
      statusCounts[row.status] = row._count._all;
    }

    return {
      total,
      awaitingReview,
      criticalOpen,
      resolvedToday,
      missingQuantity: Math.abs(missingAggregate._sum.differenceQuantity ?? 0),
      extraQuantity: extraAggregate._sum.differenceQuantity ?? 0,
      bySeverity: severityCounts,
      byStatus: statusCounts,
    };
  }

  async findOne(id: string, actor: AuthenticatedUser) {
    const user = await this.resolveUser(actor);
    // Resolve the source transaction first so the case detail can surface
    // photo evidence attached to that transaction as well — the same physical
    // files are shown, never duplicated.
    const source = await this.prisma.discrepancy.findUnique({
      where: { id },
      select: { id: true, transactionId: true },
    });
    if (!source) throw new NotFoundException("Discrepancy not found.");

    const discrepancy = await this.prisma.discrepancy.findUnique({
      where: { id },
      include: {
        ...discrepancyInclude,
        evidence: {
          ...discrepancyEvidenceInclude,
          where: {
            OR: [
              { discrepancyId: id },
              ...(source.transactionId
                ? [{ transactionId: source.transactionId }]
                : []),
            ],
          },
        },
      },
    });
    if (!discrepancy) throw new NotFoundException("Discrepancy not found.");

    if (!this.hasManagerAccess(actor) && discrepancy.workerId !== user.id) {
      throw new ForbiddenException(
        "Workers can view only discrepancies created from their own work.",
      );
    }

    // Record the first time a manager opens an undecided case for review.
    // Guarded so repeated reads never duplicate the event.
    if (
      this.hasManagerAccess(actor) &&
      DECIDABLE_STATUSES.includes(discrepancy.status)
    ) {
      const alreadyOpened = await this.prisma.discrepancyAuditEvent.count({
        where: {
          discrepancyId: id,
          action: DiscrepancyAuditAction.REVIEW_OPENED,
        },
      });
      if (alreadyOpened === 0) {
        await this.auditService.write(this.prisma, {
          discrepancyId: id,
          caseNumber: discrepancy.caseNumber,
          action: DiscrepancyAuditAction.REVIEW_OPENED,
          previousStatus: discrepancy.status,
          newStatus: discrepancy.status,
          expectedQuantity: discrepancy.expectedQuantity,
          countedQuantity: discrepancy.countedQuantity,
          differenceQuantity: discrepancy.differenceQuantity,
          actorManagerId: user.id,
          reason: "Manager opened the case for review.",
        });
      }
    }
    return discrepancy;
  }

  /**
   * Approve the physical count. The stock balance is set to the counted
   * quantity, the original cycle-count transaction becomes the posted ledger
   * entry, and the case is marked APPROVED — all in one transaction.
   */
  async approve(id: string, input: ApproveDiscrepancyDto, actor: AuthenticatedUser) {
    this.assertManagerAccess(actor);
    const manager = await this.resolveUser(actor);
    const discrepancy = await this.loadDecidable(id);
    // A decision must never race an in-flight physical recount: stock cannot
    // change while a recount task is still open for the same case.
    await this.assertNoOpenRecountTask(discrepancy.recountTaskId);
    const note = input.note.trim();

    try {
      await this.prisma.$transaction(
        async (database) => {
          const current = await database.discrepancy.findUnique({
            where: { id },
            include: { transaction: true },
          });
          if (!current) throw new NotFoundException("Discrepancy not found.");
          if (!DECIDABLE_STATUSES.includes(current.status)) {
            throw new ConflictException(
              `This case is already ${current.status.toLowerCase().replaceAll("_", " ")}.`,
            );
          }

          const balance = await database.inventoryBalance.findUnique({
            where: {
              productId_locationId: {
                productId: current.productId,
                locationId: current.locationId,
              },
            },
          });
          const reserved = balance?.reservedQuantity ?? 0;
          this.inventoryRules.assertCycleCountAllowed(
            current.countedQuantity,
            reserved,
          );

          await database.inventoryBalance.upsert({
            where: {
              productId_locationId: {
                productId: current.productId,
                locationId: current.locationId,
              },
            },
            update: { quantity: current.countedQuantity },
            create: {
              productId: current.productId,
              locationId: current.locationId,
              quantity: current.countedQuantity,
            },
          });

          await database.inventoryTransaction.update({
            where: { id: current.transactionId },
            data: {
              status: TransactionStatus.POSTED,
              approvedById: manager.id,
              approvedAt: new Date(),
              postedAt: new Date(),
              reviewNotes: note,
            },
          });

          await database.discrepancy.update({
            where: { id },
            data: {
              status: DiscrepancyStatus.APPROVED,
              assignedManagerId: manager.id,
              resolvedById: manager.id,
              resolvedAt: new Date(),
              resolutionTransactionId: current.transactionId,
              managerNotes: note,
            },
          });

          const previousStock = balance?.quantity ?? 0;
          await this.auditService.write(database, {
            discrepancyId: id,
            caseNumber: current.caseNumber,
            action: DiscrepancyAuditAction.APPROVED,
            previousStatus: current.status,
            newStatus: DiscrepancyStatus.APPROVED,
            expectedQuantity: current.expectedQuantity,
            countedQuantity: current.countedQuantity,
            differenceQuantity: current.differenceQuantity,
            severityRule: current.severityRule,
            previousStock,
            newStock: current.countedQuantity,
            actorManagerId: manager.id,
            reason: note,
            transactionId: current.transactionId,
          });
          await this.auditService.write(database, {
            discrepancyId: id,
            caseNumber: current.caseNumber,
            action: DiscrepancyAuditAction.CASE_CLOSED,
            previousStatus: current.status,
            newStatus: DiscrepancyStatus.APPROVED,
            expectedQuantity: current.expectedQuantity,
            countedQuantity: current.countedQuantity,
            differenceQuantity: current.differenceQuantity,
            actorManagerId: manager.id,
            reason: "Case closed by approval.",
          });

          if (current.workerId) {
            await this.notifications.createForUser(database, {
              userId: current.workerId,
              type: NotificationType.DISCREPANCY_APPROVED,
              title: `Discrepancy ${current.caseNumber} approved`,
              message: `Your count of ${current.countedQuantity} was approved. The stock balance was updated to the approved quantity.`,
              linkType: "DISCREPANCY",
              linkId: current.id,
            });
          }
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
      return this.findOne(id, actor);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2034"
      ) {
        throw new ConflictException(
          "The case changed during approval. Refresh and try again.",
        );
      }
      throw error;
    }
  }

  /**
   * Request a physical recount. Creates a RECOUNT task for the original
   * worker (or a selected executive), links it to this case and marks the case
   * RECOUNT_REQUESTED. Stock is never changed.
   */
  async requestRecount(id: string, input: RequestRecountDto, actor: AuthenticatedUser) {
    this.assertManagerAccess(actor);
    const manager = await this.resolveUser(actor);
    await this.loadDecidable(id);
    const instructions = input.instructions.trim();

    try {
      await this.prisma.$transaction(
        async (database) => {
          const current = await database.discrepancy.findUnique({
            where: { id },
            include: { transaction: true, product: true, worker: true },
          });
          if (!current) throw new NotFoundException("Discrepancy not found.");
          if (!DECIDABLE_STATUSES.includes(current.status)) {
            throw new ConflictException(
              `This case is already ${current.status.toLowerCase().replaceAll("_", " ")}.`,
            );
          }

          const dueAt = new Date();
          dueAt.setHours(17, 0, 0, 0);
          const assignedToId =
            input.assignedWorkerId ?? current.workerId ?? null;

          // Prevent duplicate open recount tasks for the same case: a second
          // recount must never be assigned while one is still being worked.
          if (current.recountTaskId) {
            const existingTask = await database.inventoryTask.findUnique({
              where: { id: current.recountTaskId },
              select: { status: true },
            });
            if (
              existingTask?.status === TaskStatus.OPEN ||
              existingTask?.status === TaskStatus.IN_PROGRESS
            ) {
              throw new ConflictException(
                "A recount task is already open for this case. Complete or cancel it before requesting another recount.",
              );
            }
            // A completed/cancelled task still owns the unique
            // sourceTransactionId; release it so the new task can link the
            // same original cycle count without violating the constraint.
            await database.inventoryTask.updateMany({
              where: { id: current.recountTaskId },
              data: { sourceTransactionId: null },
            });
          }

          const task = await database.inventoryTask.create({
            data: {
              type: TaskType.RECOUNT,
              priority: TaskPriority.HIGH,
              status: TaskStatus.OPEN,
              title: `Recount ${current.product.name}`,
              description: instructions,
              dueAt,
              assignedToId,
              productId: current.productId,
              locationId: current.locationId,
              sourceTransactionId: current.transactionId,
            },
          });

          await database.discrepancy.update({
            where: { id },
            data: {
              status: DiscrepancyStatus.RECOUNT_REQUESTED,
              assignedManagerId: manager.id,
              recountTaskId: task.id,
              managerNotes: instructions,
            },
          });

          await this.auditService.write(database, {
            discrepancyId: id,
            caseNumber: current.caseNumber,
            action: DiscrepancyAuditAction.RECOUNT_REQUESTED,
            previousStatus: current.status,
            newStatus: DiscrepancyStatus.RECOUNT_REQUESTED,
            expectedQuantity: current.expectedQuantity,
            countedQuantity: current.countedQuantity,
            differenceQuantity: current.differenceQuantity,
            severityRule: current.severityRule,
            actorManagerId: manager.id,
            reason: instructions,
            transactionId: current.transactionId,
          });

          if (assignedToId) {
            await this.notifications.createForUser(database, {
              userId: assignedToId,
              type: NotificationType.RECOUNT_ASSIGNED,
              title: `Recount assigned · ${current.caseNumber}`,
              message: instructions,
              linkType: "TASK",
              linkId: task.id,
            });
          }
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
      return this.findOne(id, actor);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2034") {
          throw new ConflictException(
            "The case changed during the recount request. Refresh and try again.",
          );
        }
        if (error.code === "P2002") {
          throw new ConflictException(
            "A recount task is already assigned for this case.",
          );
        }
      }
      throw error;
    }
  }

  /** Reject the count. Stock stays unchanged and the audit history is kept. */
  async reject(id: string, input: RejectDiscrepancyDto, actor: AuthenticatedUser) {
    this.assertManagerAccess(actor);
    const manager = await this.resolveUser(actor);
    const discrepancy = await this.loadDecidable(id);
    await this.assertNoOpenRecountTask(discrepancy.recountTaskId);
    const reason = input.reason.trim();

    try {
      await this.prisma.$transaction(
        async (database) => {
          const current = await database.discrepancy.findUnique({
            where: { id },
          });
          if (!current) throw new NotFoundException("Discrepancy not found.");
          if (!DECIDABLE_STATUSES.includes(current.status)) {
            throw new ConflictException(
              `This case is already ${current.status.toLowerCase().replaceAll("_", " ")}.`,
            );
          }
          await database.discrepancy.update({
            where: { id },
            data: {
              status: DiscrepancyStatus.REJECTED,
              assignedManagerId: manager.id,
              resolvedById: manager.id,
              resolvedAt: new Date(),
              managerNotes: reason,
            },
          });
          await this.auditService.write(database, {
            discrepancyId: id,
            caseNumber: current.caseNumber,
            action: DiscrepancyAuditAction.REJECTED,
            previousStatus: current.status,
            newStatus: DiscrepancyStatus.REJECTED,
            expectedQuantity: current.expectedQuantity,
            countedQuantity: current.countedQuantity,
            differenceQuantity: current.differenceQuantity,
            severityRule: current.severityRule,
            actorManagerId: manager.id,
            reason,
            transactionId: current.transactionId,
          });
          await this.auditService.write(database, {
            discrepancyId: id,
            caseNumber: current.caseNumber,
            action: DiscrepancyAuditAction.CASE_CLOSED,
            previousStatus: current.status,
            newStatus: DiscrepancyStatus.REJECTED,
            expectedQuantity: current.expectedQuantity,
            countedQuantity: current.countedQuantity,
            differenceQuantity: current.differenceQuantity,
            actorManagerId: manager.id,
            reason: "Case closed by rejection.",
          });
          if (current.workerId) {
            await this.notifications.createForUser(database, {
              userId: current.workerId,
              type: NotificationType.DISCREPANCY_REJECTED,
              title: `Discrepancy ${current.caseNumber} rejected`,
              message: `Your count was not accepted. ${reason}`,
              linkType: "DISCREPANCY",
              linkId: current.id,
            });
          }
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
      return this.findOne(id, actor);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2034"
      ) {
        throw new ConflictException(
          "The case changed during rejection. Refresh and try again.",
        );
      }
      throw error;
    }
  }

  /**
   * Resolve a misplaced-stock case by moving the difference between two
   * locations. Creates a POSTED TRANSFER ledger entry and adjusts both
   * balances atomically. Total company inventory is preserved.
   */
  async resolveTransfer(id: string, input: ResolveTransferDto, actor: AuthenticatedUser) {
    this.assertManagerAccess(actor);
    const manager = await this.resolveUser(actor);
    const discrepancy = await this.loadDecidable(id);
    await this.assertNoOpenRecountTask(discrepancy.recountTaskId);

    if (input.sourceLocationId === input.destinationLocationId) {
      throw new BadRequestException(
        "Source and destination locations must be different.",
      );
    }
    if (
      discrepancy.differenceQuantity > 0 &&
      input.destinationLocationId !== discrepancy.locationId
    ) {
      throw new BadRequestException(
        "For extra stock, the destination must be the location where the stock was physically counted.",
      );
    }
    if (
      discrepancy.differenceQuantity < 0 &&
      input.sourceLocationId !== discrepancy.locationId
    ) {
      throw new BadRequestException(
        "For missing stock, the source must be the location where the shortage was counted.",
      );
    }
    const transferQuantity = Math.abs(discrepancy.differenceQuantity);
    if (transferQuantity <= 0) {
      throw new ConflictException(
        "This case has no difference to move. Use approve instead.",
      );
    }

    try {
      await this.prisma.$transaction(
        async (database) => {
          const current = await database.discrepancy.findUnique({
            where: { id },
          });
          if (!current) throw new NotFoundException("Discrepancy not found.");
          if (!DECIDABLE_STATUSES.includes(current.status)) {
            throw new ConflictException(
              `This case is already ${current.status.toLowerCase().replaceAll("_", " ")}.`,
            );
          }

          const [sourceLocation, destinationLocation] = await Promise.all([
            database.location.findFirst({
              where: { id: input.sourceLocationId, active: true },
            }),
            database.location.findFirst({
              where: { id: input.destinationLocationId, active: true },
            }),
          ]);
          if (!sourceLocation) {
            throw new NotFoundException("Active source location not found.");
          }
          if (!destinationLocation) {
            throw new NotFoundException("Active destination location not found.");
          }

          const sourceBalance = await database.inventoryBalance.findUnique({
            where: {
              productId_locationId: {
                productId: current.productId,
                locationId: input.sourceLocationId,
              },
            },
          });
          this.inventoryRules.assertAvailableStock(
            transferQuantity,
            sourceBalance?.quantity ?? 0,
            sourceBalance?.reservedQuantity ?? 0,
          );
          const destinationBalance = await database.inventoryBalance.findUnique({
            where: {
              productId_locationId: {
                productId: current.productId,
                locationId: input.destinationLocationId,
              },
            },
          });
          const sourceQuantityBefore = sourceBalance?.quantity ?? 0;
          const destinationQuantityBefore = destinationBalance?.quantity ?? 0;
          const sourceQuantityAfter = sourceQuantityBefore - transferQuantity;
          const destinationQuantityAfter =
            destinationQuantityBefore + transferQuantity;
          const totalBefore = sourceQuantityBefore + destinationQuantityBefore;
          const totalAfter = sourceQuantityAfter + destinationQuantityAfter;
          if (totalBefore !== totalAfter) {
            throw new ConflictException(
              "Transfer validation failed because total inventory would change.",
            );
          }

          await database.inventoryBalance.update({
            where: {
              productId_locationId: {
                productId: current.productId,
                locationId: input.sourceLocationId,
              },
            },
            data: { quantity: { decrement: transferQuantity } },
          });
          await database.inventoryBalance.upsert({
            where: {
              productId_locationId: {
                productId: current.productId,
                locationId: input.destinationLocationId,
              },
            },
            update: { quantity: { increment: transferQuantity } },
            create: {
              productId: current.productId,
              locationId: input.destinationLocationId,
              quantity: transferQuantity,
            },
          });

          const postedAt = new Date();
          const reason = input.note.trim();
          const balanceAuditNote =
            `${reason}\n` +
            `Transfer resolution: ${sourceLocation.name} ${sourceQuantityBefore} → ${sourceQuantityAfter}; ` +
            `${destinationLocation.name} ${destinationQuantityBefore} → ${destinationQuantityAfter}; ` +
            `total ${totalBefore} → ${totalAfter}.`;
          const transfer = await database.inventoryTransaction.create({
            data: {
              action: InventoryAction.TRANSFER,
              status: TransactionStatus.POSTED,
              productId: current.productId,
              quantity: transferQuantity,
              condition: "GOOD",
              sourceLocationId: input.sourceLocationId,
              destinationLocationId: input.destinationLocationId,
              sourceLocationSource: "CLARIFIED",
              destinationLocationSource: "CLARIFIED",
              referenceNumber: `DSC-RESOLVE-${current.caseNumber.slice(-4)}`,
              notes: balanceAuditNote,
              systemQuantityBefore: sourceQuantityBefore,
              createdById: current.workerId ?? manager.id,
              approvedById: manager.id,
              confirmedAt: postedAt,
              approvedAt: postedAt,
              postedAt,
            },
          });

          // The original count must never remain actionable after the transfer
          // is posted; otherwise it could later be approved and duplicate stock.
          await database.inventoryTransaction.update({
            where: { id: current.transactionId },
            data: {
              status: TransactionStatus.CANCELLED,
              approvedById: manager.id,
              approvedAt: postedAt,
              reviewNotes:
                `Resolved by linked transfer ${transfer.id}. ${reason}`,
            },
          });

          await database.discrepancy.update({
            where: { id },
            data: {
              status: DiscrepancyStatus.RESOLVED_AS_TRANSFER,
              assignedManagerId: manager.id,
              resolvedById: manager.id,
              resolvedAt: new Date(),
              resolutionTransactionId: transfer.id,
              managerNotes: balanceAuditNote,
            },
          });

          await this.auditService.write(database, {
            discrepancyId: id,
            caseNumber: current.caseNumber,
            action: DiscrepancyAuditAction.RESOLVED_AS_TRANSFER,
            previousStatus: current.status,
            newStatus: DiscrepancyStatus.RESOLVED_AS_TRANSFER,
            expectedQuantity: current.expectedQuantity,
            countedQuantity: current.countedQuantity,
            differenceQuantity: current.differenceQuantity,
            severityRule: current.severityRule,
            actorManagerId: manager.id,
            reason: balanceAuditNote,
            transactionId: transfer.id,
          });
          await this.auditService.write(database, {
            discrepancyId: id,
            caseNumber: current.caseNumber,
            action: DiscrepancyAuditAction.CASE_CLOSED,
            previousStatus: current.status,
            newStatus: DiscrepancyStatus.RESOLVED_AS_TRANSFER,
            expectedQuantity: current.expectedQuantity,
            countedQuantity: current.countedQuantity,
            differenceQuantity: current.differenceQuantity,
            actorManagerId: manager.id,
            reason: "Case closed by transfer resolution.",
            transactionId: transfer.id,
          });

          if (current.workerId) {
            await this.notifications.createForUser(database, {
              userId: current.workerId,
              type: NotificationType.RESOLVED_AS_TRANSFER,
              title: `Discrepancy ${current.caseNumber} resolved as transfer`,
              message: `${transferQuantity} units were moved from ${sourceLocation.name} to ${destinationLocation.name}.`,
              linkType: "DISCREPANCY",
              linkId: current.id,
            });
          }
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
      return this.findOne(id, actor);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2034"
      ) {
        throw new ConflictException(
          "The case or stock changed during the transfer. Refresh and try again.",
        );
      }
      throw error;
    }
  }

  /** Append-only history for one case, oldest first, same visibility as the
   * case itself. */
  async audit(id: string, actor: AuthenticatedUser) {
    const user = await this.resolveUser(actor);
    const discrepancy = await this.prisma.discrepancy.findUnique({
      where: { id },
      select: { id: true, caseNumber: true, workerId: true },
    });
    if (!discrepancy) throw new NotFoundException("Discrepancy not found.");
    if (!this.hasManagerAccess(actor) && discrepancy.workerId !== user.id) {
      throw new ForbiddenException(
        "Workers can view only the history of their own cases.",
      );
    }
    return this.prisma.discrepancyAuditEvent.findMany({
      where: { discrepancyId: id },
      orderBy: { createdAt: "asc" },
    });
  }

  /**
   * Manager discrepancy reports computed from real database records only.
   * No client-provided values and no sample data are ever used.
   */
  async reports(actor: AuthenticatedUser) {
    this.assertManagerAccess(actor);

    const [
      byProductRows,
      byLocationRows,
      byWorkerRows,
      severityRows,
      positiveRows,
      negativeRows,
      approvedRows,
      recountEvents,
      resolutions,
      cycleCounts,
      caseTimeline,
    ] = await Promise.all([
      this.prisma.discrepancy.groupBy({
        by: ["productId"],
        _count: { _all: true },
        _sum: { differenceQuantity: true },
      }),
      this.prisma.discrepancy.groupBy({
        by: ["locationId"],
        _count: { _all: true },
      }),
      this.prisma.discrepancy.groupBy({
        by: ["workerId"],
        where: { workerId: { not: null } },
        _count: { _all: true },
      }),
      this.prisma.discrepancy.groupBy({
        by: ["severity"],
        _count: { _all: true },
      }),
      this.prisma.discrepancy.groupBy({
        by: ["status"],
        where: { differenceQuantity: { gt: 0 } },
        _count: { _all: true },
        _sum: { differenceQuantity: true },
      }),
      this.prisma.discrepancy.groupBy({
        by: ["status"],
        where: { differenceQuantity: { lt: 0 } },
        _count: { _all: true },
        _sum: { differenceQuantity: true },
      }),
      this.prisma.discrepancy.groupBy({
        by: ["status"],
        where: { status: DiscrepancyStatus.APPROVED },
        _count: { _all: true },
        _sum: { differenceQuantity: true },
      }),
      this.prisma.discrepancyAuditEvent.count({
        where: { action: DiscrepancyAuditAction.RECOUNT_REQUESTED },
      }),
      this.prisma.discrepancy.findMany({
        where: { resolvedAt: { not: null } },
        select: { createdAt: true, resolvedAt: true },
      }),
      this.prisma.inventoryTransaction.findMany({
        where: { action: InventoryAction.CYCLE_COUNT },
        select: { createdAt: true },
      }),
      this.prisma.discrepancy.findMany({
        select: { createdAt: true },
      }),
    ]);

    const positiveTotal = positiveRows.reduce(
      (sum, row) => sum + (row._count._all || 0),
      0,
    );
    const positiveUnits = positiveRows.reduce(
      (sum, row) => sum + Math.abs(row._sum.differenceQuantity ?? 0),
      0,
    );
    const negativeTotal = negativeRows.reduce(
      (sum, row) => sum + (row._count._all || 0),
      0,
    );
    const negativeUnits = negativeRows.reduce(
      (sum, row) => sum + Math.abs(row._sum.differenceQuantity ?? 0),
      0,
    );

    const approvedAdjustmentQuantity = Math.abs(
      approvedRows.reduce(
        (sum, row) => sum + (row._sum.differenceQuantity ?? 0),
        0,
      ),
    );

    // Average resolution time in hours across resolved cases.
    let averageResolutionHours = null;
    if (resolutions.length > 0) {
      const totalHours = resolutions.reduce((sum, row) => {
        const end = row.resolvedAt?.getTime() ?? 0;
        const start = row.createdAt.getTime();
        return sum + Math.max(0, (end - start) / 3_600_000);
      }, 0);
      averageResolutionHours = Math.round((totalHours / resolutions.length) * 10) / 10;
    }

    const products = await this.prisma.product.findMany({
      where: { id: { in: byProductRows.map((row) => row.productId) } },
      select: { id: true, name: true, sku: true },
    });
    const productNames = new Map(products.map((product) => [product.id, product]));
    const byProduct = byProductRows
      .map((row) => ({
        productId: row.productId,
        name: productNames.get(row.productId)?.name ?? "Unknown product",
        sku: productNames.get(row.productId)?.sku ?? "",
        cases: row._count._all,
        netDifference: row._sum.differenceQuantity ?? 0,
      }))
      .sort((a, b) => b.cases - a.cases);

    const locations = await this.prisma.location.findMany({
      where: { id: { in: byLocationRows.map((row) => row.locationId) } },
      select: { id: true, name: true },
    });
    const locationNames = new Map(locations.map((location) => [location.id, location]));
    const byLocation = byLocationRows
      .map((row) => ({
        locationId: row.locationId,
        name: locationNames.get(row.locationId)?.name ?? "Unknown location",
        cases: row._count._all,
      }))
      .sort((a, b) => b.cases - a.cases);

    const workers = await this.prisma.user.findMany({
      where: { id: { in: byWorkerRows.map((row) => row.workerId as string) } },
      select: { id: true, displayName: true, employeeId: true },
    });
    const workerNames = new Map(workers.map((worker) => [worker.id, worker]));
    const byWorker = byWorkerRows
      .map((row) => ({
        workerId: row.workerId as string,
        name: workerNames.get(row.workerId as string)?.displayName ?? "Unknown worker",
        employeeId: workerNames.get(row.workerId as string)?.employeeId ?? "",
        cases: row._count._all,
      }))
      .sort((a, b) => b.cases - a.cases);

    const severityDistribution = Object.values(DiscrepancySeverity).reduce<
      Record<string, number>
    >((acc, severity) => {
      acc[severity] = 0;
      return acc;
    }, {});
    for (const row of severityRows) {
      severityDistribution[row.severity] = row._count._all;
    }

    // Month buckets for the stock-accuracy trend. Accuracy is the share of
    // cycle counts that produced no discrepancy that month (null when no
    // counts happened).
    const monthKey = (date: Date) =>
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const cycleByMonth = new Map<string, number>();
    for (const row of cycleCounts) {
      const key = monthKey(row.createdAt);
      cycleByMonth.set(key, (cycleByMonth.get(key) ?? 0) + 1);
    }
    const caseByMonth = new Map<string, number>();
    for (const row of caseTimeline) {
      const key = monthKey(row.createdAt);
      caseByMonth.set(key, (caseByMonth.get(key) ?? 0) + 1);
    }
    const months = new Set([...cycleByMonth.keys(), ...caseByMonth.keys()]);
    const stockAccuracyTrend = [...months]
      .sort()
      .map((month) => {
        const counts = cycleByMonth.get(month) ?? 0;
        const cases = caseByMonth.get(month) ?? 0;
        return {
          month,
          cycleCounts: counts,
          discrepancies: cases,
          accuracy:
            counts === 0
              ? null
              : Math.round(((counts - Math.min(cases, counts)) / counts) * 1000) /
                10,
        };
      });

    return {
      differenceSplit: {
        positive: { cases: positiveTotal, units: positiveUnits },
        negative: { cases: negativeTotal, units: negativeUnits },
      },
      severityDistribution,
      byProduct,
      byLocation,
      byWorker,
      repeatedProducts: byProduct.filter((row) => row.cases >= 2).slice(0, 10),
      repeatedLocations: byLocation
        .filter((row) => row.cases >= 2)
        .slice(0, 10),
      averageResolutionHours,
      recountFrequency: recountEvents,
      approvedAdjustmentQuantity,
      stockAccuracyTrend,
      generatedAt: new Date(),
    };
  }

  /**
   * CSV export honoring the caller's role and the active filters. Cells are
   * escaped for both CSV (quotes) and spreadsheet formula injection (cells
   * starting with = + - @ or tab/CR are prefixed with an apostrophe).
   */
  async exportCsv(actor: AuthenticatedUser, query: ListDiscrepanciesDto) {
    const user = await this.resolveUser(actor);
    const canSeeAll = this.hasManagerAccess(actor);
    const workerFilter = canSeeAll ? query.workerId ?? undefined : user.id;

    const where: Prisma.DiscrepancyWhereInput = {
      ...(workerFilter ? { workerId: workerFilter } : {}),
      ...(query.productId ? { productId: query.productId } : {}),
      ...(query.locationId ? { locationId: query.locationId } : {}),
      ...(query.severity ? { severity: query.severity } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.difference
        ? {
            differenceQuantity:
              query.difference === "POSITIVE" ? { gt: 0 } : { lt: 0 },
          }
        : {}),
      ...(query.from || query.to
        ? {
            createdAt: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
    };

    const rows = await this.prisma.discrepancy.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 10_000,
      include: {
        product: { select: { name: true, sku: true } },
        location: { select: { name: true } },
        worker: { select: { displayName: true } },
        assignedManager: { select: { displayName: true } },
        resolvedBy: { select: { displayName: true } },
      },
    });

    const escape = (value: unknown): string => {
      const raw = value === null || value === undefined ? "" : String(value);
      const guarded = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
      return `"${guarded.replaceAll('"', '""')}"`;
    };

    const headers = [
      "Case number",
      "Date",
      "Product",
      "SKU",
      "Location",
      "Expected quantity",
      "Counted quantity",
      "Difference",
      "Difference %",
      "Severity",
      "Status",
      "Worker",
      "Manager",
      "Resolved by",
      "Reason",
    ];
    const formatDate = (value: Date | null | undefined) =>
      value
        ? new Intl.DateTimeFormat("en-CA", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          }).format(value).replace(",", "")
        : "";

    const lines = rows.map((row) =>
      [
        escape(row.caseNumber),
        escape(formatDate(row.createdAt)),
        escape(row.product.name),
        escape(row.product.sku),
        escape(row.location.name),
        escape(row.expectedQuantity),
        escape(row.countedQuantity),
        escape(row.differenceQuantity),
        escape(row.differencePercentage),
        escape(row.severity),
        escape(row.status),
        escape(row.worker?.displayName ?? ""),
        escape(row.assignedManager?.displayName ?? ""),
        escape(row.resolvedBy?.displayName ?? ""),
        escape(row.managerNotes ?? row.reasonCode ?? ""),
      ].join(","),
    );

    return {
      filename: `discrepancies-${new Date().toISOString().slice(0, 10)}.csv`,
      csv: [headers.map((header) => escape(header)).join(","), ...lines].join(
        "\r\n",
      ),
    };
  }

  private async loadDecidable(id: string) {
    const discrepancy = await this.prisma.discrepancy.findUnique({
      where: { id },
      include: discrepancyInclude,
    });
    if (!discrepancy) throw new NotFoundException("Discrepancy not found.");
    if (!DECIDABLE_STATUSES.includes(discrepancy.status)) {
      throw new ConflictException(
        `This case is already ${discrepancy.status.toLowerCase().replaceAll("_", " ")}.`,
      );
    }
    return discrepancy;
  }

  /**
   * A decision (approve / reject / resolve-transfer) is blocked while a
   * recount task is still open or in progress for the case, so stock can
   * never change while a physical recount is in flight. Request-recount has
   * its own guard that rejects a second open task.
   */
  private async assertNoOpenRecountTask(recountTaskId: string | null) {
    if (!recountTaskId) return;
    const task = await this.prisma.inventoryTask.findUnique({
      where: { id: recountTaskId },
      select: { status: true },
    });
    if (
      task?.status === TaskStatus.OPEN ||
      task?.status === TaskStatus.IN_PROGRESS
    ) {
      throw new ConflictException(
        "This case has an open recount task. Complete or cancel it before taking a decision.",
      );
    }
  }

  private async nextCaseNumber(database: Prisma.TransactionClient) {
    const now = new Date();
    const stamp = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("");
    const prefix = `DSC-${stamp}-`;
    const existing = await database.discrepancy.findMany({
      where: { caseNumber: { startsWith: prefix } },
      select: { caseNumber: true },
    });
    let sequence = existing.length + 1;
    let caseNumber = `${prefix}${String(sequence).padStart(4, "0")}`;
    // Guard against an unlikely sequence collision inside the same day.
    const used = new Set(existing.map((row) => row.caseNumber));
    while (used.has(caseNumber)) {
      sequence += 1;
      caseNumber = `${prefix}${String(sequence).padStart(4, "0")}`;
    }
    return caseNumber;
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

  private hasManagerAccess(actor: AuthenticatedUser) {
    return (
      actor.roles.includes("manager") ||
      actor.roles.includes("administrator")
    );
  }

  private assertManagerAccess(actor: AuthenticatedUser) {
    if (!this.hasManagerAccess(actor)) {
      throw new ForbiddenException(
        "Manager access is required to decide a discrepancy.",
      );
    }
  }
}
