import { Injectable } from "@nestjs/common";
import { DiscrepancyAuditAction, Prisma } from "@prisma/client";

/**
 * Append-only discrepancy audit log.
 *
 * Every case action is recorded once and never updated or deleted by the
 * normal application APIs. The event stores a denormalized `caseNumber` and
 * the full expected/counted/difference snapshot so the history stays readable
 * even if product or location names change later.
 */
@Injectable()
export class DiscrepancyAuditService {
  /**
   * Write one audit event. Pass a transaction client to keep the event atomic
   * with the business action that produced it (stock change + event commit
   * together).
   */
  write(
    client: Prisma.TransactionClient | PrismaServiceLike,
    input: {
      discrepancyId: string;
      caseNumber: string;
      action: DiscrepancyAuditAction;
      previousStatus?: string | null;
      newStatus?: string | null;
      expectedQuantity?: number | null;
      countedQuantity?: number | null;
      differenceQuantity?: number | null;
      severityRule?: string | null;
      previousStock?: number | null;
      newStock?: number | null;
      actorWorkerId?: string | null;
      actorManagerId?: string | null;
      reason?: string | null;
      transactionId?: string | null;
      evidenceId?: string | null;
      rawTranscript?: string | null;
      aiValues?: string | null;
    },
  ) {
    return client.discrepancyAuditEvent.create({
      data: {
        discrepancyId: input.discrepancyId,
        caseNumber: input.caseNumber,
        action: input.action,
        previousStatus: input.previousStatus ?? null,
        newStatus: input.newStatus ?? null,
        expectedQuantity: input.expectedQuantity ?? null,
        countedQuantity: input.countedQuantity ?? null,
        differenceQuantity: input.differenceQuantity ?? null,
        severityRule: input.severityRule ?? null,
        previousStock: input.previousStock ?? null,
        newStock: input.newStock ?? null,
        actorWorkerId: input.actorWorkerId ?? null,
        actorManagerId: input.actorManagerId ?? null,
        reason: input.reason ?? null,
        transactionId: input.transactionId ?? null,
        evidenceId: input.evidenceId ?? null,
        rawTranscript: input.rawTranscript ?? null,
        aiValues: input.aiValues ?? null,
      },
    });
  }
}

/** Minimal structural type so callers can pass either a Prisma tx client or
 * the PrismaService (both expose the same `discrepancyAuditEvent` delegate). */
type PrismaServiceLike = {
  discrepancyAuditEvent: {
    create(data: Prisma.DiscrepancyAuditEventCreateArgs): Promise<unknown>;
  };
};
