import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { readFile } from "node:fs/promises";
import { DiscrepancyAuditAction } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";
import type { AuthenticatedUser } from "../auth/auth-user";
import { EvidenceService } from "./evidence.service";
import { DiscrepancyAuditService } from "../discrepancies/discrepancy-audit.service";

jest.mock("node:fs/promises", () => ({
  mkdir: jest.fn(async () => undefined),
  writeFile: jest.fn(async () => undefined),
  unlink: jest.fn(async () => undefined),
  readFile: jest.fn(async () => Buffer.from("fake-image-bytes")),
}));

const workerActor: AuthenticatedUser = {
  subject: "sub-worker",
  username: "wh101",
  email: "worker@keycloak.local",
  roles: ["worker"],
};

const managerActor: AuthenticatedUser = {
  subject: "sub-manager",
  username: "mg101",
  email: "manager@keycloak.local",
  roles: ["manager"],
};

type UploadFile = Parameters<EvidenceService["uploadForDiscrepancy"]>[1];

function makeFile(overrides: Partial<Omit<UploadFile, "buffer">> & { buffer?: Buffer } = {}): UploadFile {
  return {
    fieldname: "photo",
    originalname: "shelf-count.jpg",
    encoding: "7bit",
    mimetype: "image/jpeg",
    size: 2048,
    buffer: Buffer.from("fake-image-bytes"),
    ...overrides,
  } as UploadFile;
}

function createPrismaMock() {
  const evidenceCreate = jest.fn(async (args: unknown) => ({
    id: "evidence-1",
    ...(args as { data?: object }).data,
  }));
  const evidenceFindMany = jest.fn(
    async () => [] as Array<Record<string, unknown>>,
  );
  const evidenceFindUnique = jest.fn(async () => null as unknown);
  const discrepancyFindUnique = jest.fn(async () => null as unknown);
  const transactionFindUnique = jest.fn(async () => null as unknown);
  const auditEventCreate = jest.fn(async () => ({}));
  const userFindUnique = jest.fn(
    async ({ where }: { where: { email?: string; employeeId?: string } }) => {
      if (where.email === "worker@keycloak.local") {
        return { id: "user-worker-1", role: "WORKER" };
      }
      if (where.email === "manager@keycloak.local") {
        return { id: "user-manager-1", role: "MANAGER" };
      }
      if (where.email === "admin@keycloak.local") {
        return { id: "user-admin-1", role: "ADMINISTRATOR" };
      }
      return null;
    },
  );
  const userCreate = jest.fn(async () => ({ id: "user-created", role: "WORKER" }));

  const prisma = {
    discrepancyEvidence: {
      create: evidenceCreate,
      findMany: evidenceFindMany,
      findUnique: evidenceFindUnique,
    },
    discrepancy: { findUnique: discrepancyFindUnique },
    inventoryTransaction: { findUnique: transactionFindUnique },
    discrepancyAuditEvent: { create: auditEventCreate },
    user: { findUnique: userFindUnique, create: userCreate },
  } as unknown as PrismaService;

  const service = new EvidenceService(prisma, new DiscrepancyAuditService());

  function openDiscrepancy(partial: Record<string, unknown> = {}) {
    discrepancyFindUnique.mockResolvedValue({
      id: "disc-1",
      caseNumber: "DSC-20260810-0001",
      transactionId: "tx-1",
      workerId: "user-worker-1",
      status: "AWAITING_REVIEW",
      expectedQuantity: 100,
      countedQuantity: 115,
      differenceQuantity: 15,
      ...partial,
    });
  }

  function openTransaction(partial: Record<string, unknown> = {}) {
    transactionFindUnique.mockResolvedValue({
      id: "tx-1",
      action: "DAMAGE",
      status: "PENDING",
      createdById: "user-worker-1",
      ...partial,
    });
  }

  return {
    prisma,
    service,
    evidenceCreate,
    evidenceFindMany,
    evidenceFindUnique,
    discrepancyFindUnique,
    transactionFindUnique,
    auditEventCreate,
    openDiscrepancy,
    openTransaction,
  };
}

describe("EvidenceService — discrepancy photo upload", () => {
  test("stores a valid photo with metadata and writes a PHOTO_UPLOADED audit event", async () => {
    const { prisma, service, openDiscrepancy, auditEventCreate } = createPrismaMock();
    openDiscrepancy();

    const result =    await service.uploadForDiscrepancy(
      "disc-1",
      makeFile(),
      workerActor,
    );

    expect(prisma.discrepancyEvidence.create).toHaveBeenCalledTimes(1);
    const createArgs = (prisma.discrepancyEvidence.create as jest.Mock).mock.calls[0][0];
    expect(createArgs.data.discrepancyId).toBe("disc-1");
    expect(createArgs.data.transactionId).toBe("tx-1");
    expect(createArgs.data.mimeType).toBe("image/jpeg");
    expect(createArgs.data.sizeBytes).toBe(2048);
    expect(createArgs.data.uploadedById).toBe("user-worker-1");
    // Storage key is server-generated, random, and never user-controlled.
    expect(createArgs.data.storageKey).toMatch(
      /^photos\/\d{4}-\d{2}-\d{2}\/[0-9a-f-]{36}\.jpg$/,
    );
    expect(auditEventCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: DiscrepancyAuditAction.PHOTO_UPLOADED,
          discrepancyId: "disc-1",
          evidenceId: result.id,
        }),
      }),
    );
  });

  test("rejects an unsupported file type", async () => {
    const { service, openDiscrepancy } = createPrismaMock();
    openDiscrepancy();
    await expect(
      service.uploadForDiscrepancy(
        "disc-1",
        makeFile({ mimetype: "application/x-executable", originalname: "evil.exe" }),
        workerActor,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  test("rejects an oversized photo", async () => {
    const { service, openDiscrepancy } = createPrismaMock();
    openDiscrepancy();
    await expect(
      service.uploadForDiscrepancy(
        "disc-1",
        makeFile({ size: 9 * 1024 * 1024 }),
        workerActor,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  test("rejects a filename extension that contradicts the declared type", async () => {
    const { service, openDiscrepancy } = createPrismaMock();
    openDiscrepancy();
    await expect(
      service.uploadForDiscrepancy(
        "disc-1",
        makeFile({ originalname: "script.js" }),
        workerActor,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  test("denies upload to a worker who did not create the case", async () => {
    const { service, openDiscrepancy } = createPrismaMock();
    openDiscrepancy({ workerId: "user-other-worker" });
    await expect(
      service.uploadForDiscrepancy("disc-1", makeFile(), workerActor),
    ).rejects.toThrow(ForbiddenException);
  });

  test("allows a manager to upload to any case", async () => {
    const { service, openDiscrepancy, evidenceCreate } = createPrismaMock();
    openDiscrepancy({ workerId: "user-other-worker" });
    await service.uploadForDiscrepancy("disc-1", makeFile(), managerActor);
    expect(evidenceCreate).toHaveBeenCalled();
  });

  test("rejects upload to a missing discrepancy", async () => {
    const { service } = createPrismaMock();
    await expect(
      service.uploadForDiscrepancy("disc-missing", makeFile(), managerActor),
    ).rejects.toThrow(NotFoundException);
  });
});

describe("EvidenceService — worker transaction photo (Damage/Receive)", () => {
  test("allows the transaction creator to attach a photo", async () => {
    const { prisma, service, openTransaction } = createPrismaMock();
    openTransaction();
    const result = await service.uploadForTransaction(
      "tx-1",
      makeFile({ originalname: "damage.png", mimetype: "image/png" }),
      workerActor,
    );
    expect(prisma.discrepancyEvidence.create).toHaveBeenCalled();
    const createArgs = (prisma.discrepancyEvidence.create as jest.Mock).mock.calls[0][0];
    expect(createArgs.data.transactionId).toBe("tx-1");
    expect(createArgs.data.discrepancyId).toBeNull();
    expect(createArgs.data.storageKey).toMatch(/\.png$/);
    expect(result.id).toBe("evidence-1");
  });

  test("rejects evidence for a non-photo action", async () => {
    const { service, openTransaction } = createPrismaMock();
    openTransaction({ action: "TRANSFER" });
    await expect(
      service.uploadForTransaction("tx-1", makeFile(), workerActor),
    ).rejects.toThrow(BadRequestException);
  });

  test("denies upload to a worker who did not create the transaction", async () => {
    const { service, openTransaction } = createPrismaMock();
    openTransaction({ createdById: "user-other-worker" });
    await expect(
      service.uploadForTransaction("tx-1", makeFile(), workerActor),
    ).rejects.toThrow(ForbiddenException);
  });
});

describe("EvidenceService — access control", () => {
  test("case worker can list evidence for their own case", async () => {
    const { prisma, service, openDiscrepancy } = createPrismaMock();
    openDiscrepancy();
    await service.listForDiscrepancy("disc-1", workerActor);
    // The case shows evidence attached to itself AND to its source transaction.
    expect(prisma.discrepancyEvidence.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [{ discrepancyId: "disc-1" }, { transactionId: "tx-1" }],
        },
      }),
    );
  });

  test("case evidence listing never exposes the physical storage path", async () => {
    const { service, evidenceFindMany, openDiscrepancy } = createPrismaMock();
    openDiscrepancy();
    evidenceFindMany.mockResolvedValue([
      {
        id: "evidence-1",
        discrepancyId: "disc-1",
        transactionId: "tx-1",
        originalFilename: "shelf-count.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 2048,
        createdAt: new Date("2026-08-10T10:00:00.000Z"),
        uploadedBy: { id: "user-worker-1", employeeId: "WH101", displayName: "Warehouse Executive" },
      },
    ]);
    const rows = await service.listForDiscrepancy("disc-1", workerActor);
    expect(rows[0]).not.toHaveProperty("storageKey");
    expect(rows[0]).toMatchObject({
      id: "evidence-1",
      originalFilename: "shelf-count.jpg",
      uploadedBy: { id: "user-worker-1" },
    });
  });

  test("a stranger worker cannot list evidence for a case they did not create", async () => {
    const { service, openDiscrepancy } = createPrismaMock();
    openDiscrepancy({ workerId: "user-other-worker" });
    await expect(service.listForDiscrepancy("disc-1", workerActor)).rejects.toThrow(
      ForbiddenException,
    );
  });

  test("file download works for the case worker with safe attachment metadata", async () => {
    const { service, evidenceFindUnique } = createPrismaMock();
    evidenceFindUnique.mockResolvedValue({
      id: "evidence-1",
      storageKey: "photos/2026-08-10/abc.jpg",
      mimeType: "image/jpeg",
      originalFilename: "shelf-count.jpg",
      sizeBytes: 2048,
      discrepancy: { workerId: "user-worker-1" },
      transaction: null,
    });
    const file = await service.getFile("evidence-1", workerActor);
    expect(file.mimeType).toBe("image/jpeg");
    expect(file.buffer).toEqual(Buffer.from("fake-image-bytes"));
  });

  test("transaction evidence list is returned to the transaction creator", async () => {
    const { prisma, service, evidenceFindMany, openTransaction } = createPrismaMock();
    openTransaction();
    evidenceFindMany.mockResolvedValue([
      { id: "evidence-1", originalFilename: "damage.png", createdAt: new Date() },
    ]);
    const rows = await service.listForTransaction("tx-1", workerActor);
    expect(rows).toHaveLength(1);
    expect(prisma.discrepancyEvidence.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { transactionId: "tx-1" },
        select: expect.objectContaining({ originalFilename: true }),
      }),
    );
  });

  test("transaction evidence list is returned to managers", async () => {
    const { prisma, service, openTransaction } = createPrismaMock();
    openTransaction({ createdById: "user-other-worker" });
    await service.listForTransaction("tx-1", managerActor);
    expect(prisma.discrepancyEvidence.findMany).toHaveBeenCalled();
  });

  test("transaction evidence list is returned to administrators", async () => {
    const { prisma, service, openTransaction } = createPrismaMock();
    openTransaction({ createdById: "user-other-worker" });
  const administratorActor: AuthenticatedUser = {
      subject: "sub-admin",
      username: "ad101",
      email: "admin@keycloak.local",
      roles: ["administrator"],
    };
    await service.listForTransaction("tx-1", administratorActor);
    expect(prisma.discrepancyEvidence.findMany).toHaveBeenCalled();
  });

  test("transaction evidence list rejects a worker who did not create the transaction", async () => {
    const { service, openTransaction } = createPrismaMock();
    openTransaction({ createdById: "user-other-worker" });
    await expect(service.listForTransaction("tx-1", workerActor)).rejects.toThrow(
      ForbiddenException,
    );
  });

  test("transaction evidence list rejects a missing transaction", async () => {
    const { service } = createPrismaMock();
    await expect(service.listForTransaction("tx-missing", managerActor)).rejects.toThrow(
      NotFoundException,
    );
  });

  test("transaction evidence list returns an empty array when there is no evidence", async () => {
    const { service, evidenceFindMany, openTransaction } = createPrismaMock();
    openTransaction();
    evidenceFindMany.mockResolvedValue([]);
    const rows = await service.listForTransaction("tx-1", workerActor);
    expect(rows).toEqual([]);
  });

  test("transaction evidence list returns multiple photos in upload order", async () => {
    const { service, evidenceFindMany, openTransaction } = createPrismaMock();
    openTransaction();
    evidenceFindMany.mockResolvedValue([
      { id: "evidence-1", originalFilename: "first.jpg", createdAt: new Date("2026-08-10T08:00:00.000Z") },
      { id: "evidence-2", originalFilename: "second.png", createdAt: new Date("2026-08-10T09:00:00.000Z") },
      { id: "evidence-3", originalFilename: "third.webp", createdAt: new Date("2026-08-10T10:00:00.000Z") },
    ]);
    const rows = await service.listForTransaction("tx-1", managerActor);
    expect(rows.map((row) => row.id)).toEqual(["evidence-1", "evidence-2", "evidence-3"]);
    expect(evidenceFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: "asc" } }),
    );
  });

  test("file download is denied to unauthorized users", async () => {
    const { service, evidenceFindUnique } = createPrismaMock();
    evidenceFindUnique.mockResolvedValue({
      id: "evidence-1",
      storageKey: "photos/2026-08-10/abc.jpg",
      mimeType: "image/jpeg",
      originalFilename: "shelf-count.jpg",
      sizeBytes: 2048,
      discrepancy: { workerId: "user-other-worker" },
      transaction: null,
    });
    await expect(service.getFile("evidence-1", workerActor)).rejects.toThrow(
      ForbiddenException,
    );
  });

  test("file download returns 404 when the file is missing on disk", async () => {
    const { service, evidenceFindUnique } = createPrismaMock();
    evidenceFindUnique.mockResolvedValue({
      id: "evidence-1",
      storageKey: "photos/2026-08-10/abc.jpg",
      mimeType: "image/jpeg",
      originalFilename: "shelf-count.jpg",
      sizeBytes: 2048,
      discrepancy: { workerId: "user-worker-1" },
      transaction: null,
    });
    (readFile as jest.Mock).mockRejectedValueOnce(new Error("ENOENT"));
    await expect(service.getFile("evidence-1", workerActor)).rejects.toThrow(
      NotFoundException,
    );
  });
});
