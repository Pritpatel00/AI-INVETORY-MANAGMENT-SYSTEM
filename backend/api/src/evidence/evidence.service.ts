import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { readFile, mkdir, unlink, writeFile } from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";

import {
  DiscrepancyAuditAction,
  DiscrepancyStatus,
  Prisma,
  UserRole,
} from "@prisma/client";

import type { AuthenticatedUser } from "../auth/auth-user";
import { PrismaService } from "../prisma/prisma.service";
import { DiscrepancyAuditService } from "../discrepancies/discrepancy-audit.service";

/** Allowed photo formats. The stored extension is ALWAYS derived from the
 * validated MIME type — never from the user-provided filename. */
const ALLOWED_PHOTO_TYPES: ReadonlyMap<string, string> = new Map([
  ["image/jpeg", "jpg"],
  ["image/jpg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

const DECIDABLE_STATUSES: DiscrepancyStatus[] = [
  DiscrepancyStatus.OPEN,
  DiscrepancyStatus.AWAITING_REVIEW,
  DiscrepancyStatus.RECOUNT_REQUESTED,
];

const TRANSACTION_ACTIONS_WITH_PHOTO = new Set(["DAMAGE", "RECEIVE"]);
const TRANSACTION_STATUSES_ACCEPTING_PHOTO = new Set([
  "PENDING",
  "RECOUNT_REQUESTED",
  "APPROVED",
]);

/**
 * Evidence metadata exposed to clients. The physical storage path
 * (storageKey) is deliberately never selected here — callers can only ever
 * download the file through the authorized evidence file endpoint.
 */
const evidenceListSelect = {
  id: true,
  discrepancyId: true,
  transactionId: true,
  originalFilename: true,
  mimeType: true,
  sizeBytes: true,
  createdAt: true,
  uploadedBy: {
    select: { id: true, employeeId: true, displayName: true },
  },
} satisfies Prisma.DiscrepancyEvidenceSelect;

@Injectable()
export class EvidenceService {
  private readonly evidenceRoot = resolve(
    process.env.EVIDENCE_STORAGE_PATH ?? "../../.local/evidence",
  );

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: DiscrepancyAuditService,
  ) {}

  /**
   * Upload a photo for a discrepancy case. Managers and administrators may
   * attach to any case; the worker who created the case may attach while the
   * case is still decidable. The file is stored on local disk with a random
   * server-side name and only its metadata is stored in PostgreSQL.
   */
  async uploadForDiscrepancy(
    discrepancyId: string,
    file: Express.Multer.File,
    actor: AuthenticatedUser,
  ) {
    const user = await this.resolveUser(actor);
    const discrepancy = await this.prisma.discrepancy.findUnique({
      where: { id: discrepancyId },
      select: {
        id: true,
        caseNumber: true,
        transactionId: true,
        workerId: true,
        status: true,
        expectedQuantity: true,
        countedQuantity: true,
        differenceQuantity: true,
      },
    });
    if (!discrepancy) {
      throw new NotFoundException("Discrepancy not found.");
    }

    const isManager = this.hasManagerAccess(actor);
    const isCaseWorker =
      discrepancy.workerId !== null && user.id === discrepancy.workerId;
    const canUpload =
      isManager ||
      (isCaseWorker && DECIDABLE_STATUSES.includes(discrepancy.status));
    if (!canUpload) {
      throw new ForbiddenException(
        "You are not allowed to attach evidence to this case.",
      );
    }

    const extension = this.validatePhoto(file);
    const evidence = await this.storeAndRecord(
      file,
      extension,
      user.id,
      discrepancy.transactionId,
      discrepancyId,
    );

    await this.audit.write(this.prisma, {
      discrepancyId: discrepancy.id,
      caseNumber: discrepancy.caseNumber,
      action: DiscrepancyAuditAction.PHOTO_UPLOADED,
      previousStatus: discrepancy.status,
      newStatus: discrepancy.status,
      expectedQuantity: discrepancy.expectedQuantity,
      countedQuantity: discrepancy.countedQuantity,
      differenceQuantity: discrepancy.differenceQuantity,
      actorWorkerId: isManager ? null : user.id,
      actorManagerId: isManager ? user.id : null,
      transactionId: discrepancy.transactionId,
      evidenceId: evidence.id,
      reason: `${file.mimetype} evidence uploaded (${evidence.sizeBytes} bytes).`,
    });

    return evidence;
  }

  /**
   * Upload a photo for a worker action (Damage or receiving-condition
   * problem) before or after manager review. Only the transaction creator or
   * a manager may upload.
   */
  async uploadForTransaction(
    transactionId: string,
    file: Express.Multer.File,
    actor: AuthenticatedUser,
  ) {
    const user = await this.resolveUser(actor);
    const transaction = await this.prisma.inventoryTransaction.findUnique({
      where: { id: transactionId },
      select: {
        id: true,
        action: true,
        status: true,
        createdById: true,
      },
    });
    if (!transaction) {
      throw new NotFoundException("Inventory transaction not found.");
    }
    if (!TRANSACTION_ACTIONS_WITH_PHOTO.has(transaction.action)) {
      throw new BadRequestException(
        "Photo evidence is only accepted for Damage and receiving-condition transactions.",
      );
    }
    if (!TRANSACTION_STATUSES_ACCEPTING_PHOTO.has(transaction.status)) {
      throw new BadRequestException(
        "Evidence can no longer be attached to this transaction.",
      );
    }

    const isManager = this.hasManagerAccess(actor);
    const isCreator =
      transaction.createdById !== null && user.id === transaction.createdById;
    if (!isManager && !isCreator) {
      throw new ForbiddenException(
        "Only the recording executive or a manager can attach evidence.",
      );
    }

    const extension = this.validatePhoto(file);
    return this.storeAndRecord(
      file,
      extension,
      user.id,
      transaction.id,
      null,
    );
  }

  async listForDiscrepancy(
    discrepancyId: string,
    actor: AuthenticatedUser,
  ) {
    const user = await this.resolveUser(actor);
    const discrepancy = await this.prisma.discrepancy.findUnique({
      where: { id: discrepancyId },
      select: { id: true, workerId: true, transactionId: true },
    });
    if (!discrepancy) {
      throw new NotFoundException("Discrepancy not found.");
    }
    const isManager = this.hasManagerAccess(actor);
    const isCaseWorker =
      discrepancy.workerId !== null && user.id === discrepancy.workerId;
    if (!isManager && !isCaseWorker) {
      throw new ForbiddenException(
        "You are not allowed to view evidence for this case.",
      );
    }
    // A case shows evidence attached directly to it AND evidence attached to
    // its source transaction, so a photo recorded before the discrepancy was
    // raised is visible here without ever duplicating the physical file.
    return this.prisma.discrepancyEvidence.findMany({
      where: {
        OR: [
          { discrepancyId },
          ...(discrepancy.transactionId
            ? [{ transactionId: discrepancy.transactionId }]
            : []),
        ],
      },
      select: evidenceListSelect,
      orderBy: { createdAt: "asc" },
    });
  }

  /**
   * List photo evidence attached to one inventory transaction. Managers and
   * administrators may view any transaction's evidence; the Warehouse
   * Executive who created the transaction may view their own. Other users get
   * a 403. The physical storage path is never returned.
   */
  async listForTransaction(
    transactionId: string,
    actor: AuthenticatedUser,
  ) {
    const user = await this.resolveUser(actor);
    const transaction = await this.prisma.inventoryTransaction.findUnique({
      where: { id: transactionId },
      select: { id: true, createdById: true },
    });
    if (!transaction) {
      throw new NotFoundException("Inventory transaction not found.");
    }
    const isManager = this.hasManagerAccess(actor);
    const isCreator =
      transaction.createdById !== null && user.id === transaction.createdById;
    if (!isManager && !isCreator) {
      throw new ForbiddenException(
        "Only the recording executive or a manager can view evidence for this transaction.",
      );
    }
    return this.prisma.discrepancyEvidence.findMany({
      where: { transactionId: transaction.id },
      select: evidenceListSelect,
      orderBy: { createdAt: "asc" },
    });
  }

  /** Stream one stored file back to an authorized caller. The response is
   * always an attachment with an allow-listed Content-Type and no sniffing,
   * so an uploaded file can never execute as a script. */
  async getFile(evidenceId: string, actor: AuthenticatedUser) {
    const user = await this.resolveUser(actor);
    const evidence = await this.prisma.discrepancyEvidence.findUnique({
      where: { id: evidenceId },
      include: {
        discrepancy: { select: { workerId: true } },
        transaction: {
          select: { createdById: true, action: true },
        },
      },
    });
    if (!evidence) throw new NotFoundException("Evidence not found.");

    const isManager = this.hasManagerAccess(actor);
    const isCaseWorker =
      evidence.discrepancy?.workerId !== null &&
      evidence.discrepancy?.workerId !== undefined &&
      evidence.discrepancy.workerId === user.id;
    const isTransactionCreator =
      evidence.transaction?.createdById !== null &&
      evidence.transaction?.createdById !== undefined &&
      evidence.transaction.createdById === user.id;
    if (!isManager && !isCaseWorker && !isTransactionCreator) {
      throw new ForbiddenException("Evidence access is restricted.");
    }

    const storagePath = join(this.evidenceRoot, evidence.storageKey);
    let buffer: Buffer;
    try {
      buffer = await readFile(storagePath);
    } catch {
      throw new NotFoundException(
        "The stored evidence file is missing on disk.",
      );
    }

    return {
      buffer,
      mimeType: evidence.mimeType,
      originalFilename: evidence.originalFilename,
      sizeBytes: evidence.sizeBytes,
    };
  }

  /** Validate MIME type, size and filename extension; return the extension to
   * use for the stored file (always derived from the MIME type). */
  private validatePhoto(file: Express.Multer.File): string {
    const mime = file.mimetype.toLowerCase();
    const extension = ALLOWED_PHOTO_TYPES.get(mime);
    if (!extension) {
      throw new BadRequestException(
        `Unsupported image type: ${mime}. Only JPEG, PNG and WebP are accepted.`,
      );
    }
    if (file.size > MAX_PHOTO_BYTES) {
      throw new BadRequestException(
        `Photo is ${Math.round(file.size / 1024 / 1024)} MB. The maximum size is 8 MB.`,
      );
    }
    const originalExtension = extname(file.originalname ?? "").toLowerCase();
    if (
      originalExtension &&
      !["", ".jpg", ".jpeg", ".png", ".webp"].includes(originalExtension)
    ) {
      throw new BadRequestException(
        `Filename extension ${originalExtension} does not match an accepted image format.`,
      );
    }
    return extension;
  }

  private async storeAndRecord(
    file: Express.Multer.File,
    extension: string,
    uploadedById: string,
    transactionId: string | null,
    discrepancyId: string | null,
  ) {
    // Server-side random filename: never derived from user input. Stored
    // under .local/evidence/photos, outside any web root.
    const dateFolder = new Date().toISOString().slice(0, 10);
    const storageKey = `photos/${dateFolder}/${randomUUID()}.${extension}`;
    const storagePath = join(this.evidenceRoot, storageKey);
    await mkdir(dirname(storagePath), { recursive: true });
    try {
      await writeFile(storagePath, file.buffer, { flag: "wx" });
    } catch {
      throw new BadRequestException("The photo could not be stored. Try again.");
    }

    try {
      return await this.prisma.discrepancyEvidence.create({
        data: {
          discrepancyId,
          transactionId,
          storageKey,
          originalFilename: this.sanitizeFilename(file.originalname),
          mimeType: file.mimetype.toLowerCase(),
          sizeBytes: file.size,
          uploadedById,
        },
        select: evidenceListSelect,
      });
    } catch (error) {
      await unlink(storagePath).catch(() => undefined);
      throw error;
    }
  }

  /** Keep only the base filename (no path segments) and control characters. */
  private sanitizeFilename(filename: string) {
    const base = filename.split(/[\\/]/).pop() ?? "evidence";
    const cleaned = base
      .replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_")
      .replace(/\s+/g, " ")
      .trim();
    return (cleaned || "evidence").slice(0, 160);
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
}
