import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  InventoryAction,
  TransactionStatus,
  UserRole,
} from "@prisma/client";

import type { AuthenticatedUser } from "../auth/auth-user";
import {
  getAuthenticatedEmail,
  getAuthenticatedEmployeeId,
  resolveCanonicalUser,
} from "../auth/canonical-user";
import { PrismaService } from "../prisma/prisma.service";
import { CreateSetupAssignmentDto } from "./dto/create-setup-assignment.dto";
import { CreateSetupOpeningStockDto } from "./dto/create-setup-opening-stock.dto";
import { AssignWorkerDto } from "./dto/assign-worker.dto";

export interface SetupStatus {
  locationCreated: boolean;
  productCreated: boolean;
  productAssigned: boolean;
  openingStockEntered: boolean;
  workerAssigned: boolean;
  completionPercent: number;
}

@Injectable()
export class SetupService {
  constructor(private readonly prisma: PrismaService) {}

  /** Setup progress always comes from real PostgreSQL records — never localStorage. */
  async getStatus(): Promise<SetupStatus> {
    const [locations, products, assignments, stockedAssignments, assignedWorkers] =
      await Promise.all([
        this.prisma.location.count({ where: { active: true } }),
        this.prisma.product.count({ where: { active: true } }),
        this.prisma.inventoryBalance.count(),
        this.prisma.inventoryBalance.count({ where: { quantity: { gt: 0 } } }),
        this.prisma.user.count({
          where: {
            role: UserRole.WORKER,
            active: true,
            shift: { not: null },
            warehouseZone: { not: null },
          },
        }),
      ]);

    const locationCreated = locations > 0;
    const productCreated = products > 0;
    const productAssigned = assignments > 0;
    const openingStockEntered = stockedAssignments > 0;
    const workerAssigned = assignedWorkers > 0;

    const completed = [
      locationCreated,
      productCreated,
      productAssigned,
      openingStockEntered,
      workerAssigned,
    ].filter(Boolean).length;
    const completionPercent = Math.round((completed / 5) * 100);

    return {
      locationCreated,
      productCreated,
      productAssigned,
      openingStockEntered,
      workerAssigned,
      completionPercent,
    };
  }

  /** Everything the Review step needs to show, from real records only. */
  async getSummary() {
    const [locations, products, balances, workers] = await Promise.all([
      this.prisma.location.findMany({ where: { active: true }, orderBy: { code: "asc" } }),
      this.prisma.product.findMany({
        where: { active: true },
        orderBy: { name: "asc" },
      }),
      this.prisma.inventoryBalance.findMany({
        where: { product: { active: true } },
        include: { product: true, location: true },
        orderBy: [{ location: { code: "asc" } }, { product: { name: "asc" } }],
      }),
      this.prisma.user.findMany({
        where: { role: UserRole.WORKER, active: true },
        select: { id: true, employeeId: true, displayName: true, shift: true, warehouseZone: true },
        orderBy: { displayName: "asc" },
      }),
    ]);

    return { locations, products, balances, workers };
  }

  /**
   * Step 4 — assign a product to a location without entering stock yet.
   * The assignment is the product+location InventoryBalance row at zero quantity.
   */
  async createAssignment(input: CreateSetupAssignmentDto) {
    const [product, location] = await Promise.all([
      this.prisma.product.findFirst({ where: { id: input.productId, active: true } }),
      this.prisma.location.findFirst({ where: { id: input.locationId, active: true } }),
    ]);
    if (!product) throw new NotFoundException("Active product not found.");
    if (!location) throw new NotFoundException("Active warehouse location not found.");

    const existing = await this.prisma.inventoryBalance.findUnique({
      where: {
        productId_locationId: { productId: input.productId, locationId: input.locationId },
      },
    });
    if (existing) {
      throw new ConflictException("This product is already assigned to the selected location.");
    }

    try {
      return await this.prisma.inventoryBalance.create({
        data: { productId: input.productId, locationId: input.locationId, quantity: 0 },
        include: { product: true, location: true },
      });
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      throw error;
    }
  }

  /**
   * Step 5 — enter opening stock for an existing product-location assignment.
   * The assignment must exist first. Quantity cannot be negative. The operation
   * writes a controlled, posted ledger record with the manager identity and time.
   */
  async createOpeningStock(input: CreateSetupOpeningStockDto, actor: AuthenticatedUser) {
    if (input.quantity < 0) {
      throw new BadRequestException("Opening quantity cannot be negative.");
    }

    const balance = await this.prisma.inventoryBalance.findUnique({
      where: {
        productId_locationId: { productId: input.productId, locationId: input.locationId },
      },
      include: { product: true, location: true },
    });
    if (!balance) {
      throw new BadRequestException(
        "Assign the product to the location before entering opening stock.",
      );
    }

    const user = await this.resolveUser(actor);
    const postedAt = new Date();
    const reference =
      input.reference?.trim() ||
      `OPENING-${postedAt.toISOString().slice(0, 10).replaceAll("-", "")}`;

    return this.prisma.$transaction(async (database) => {
      // Prevent duplicate accidental submissions — only one opening ledger entry per assignment.
      const existingOpening = await database.inventoryTransaction.findFirst({
        where: {
          productId: input.productId,
          sourceLocationId: input.locationId,
          referenceNumber: { startsWith: "OPENING-" },
          action: InventoryAction.CYCLE_COUNT,
        },
      });
      if (existingOpening) {
        throw new ConflictException(
          "Opening stock has already been recorded for this product and location.",
        );
      }

      const updated = await database.inventoryBalance.update({
        where: { id: balance.id },
        data: { quantity: input.quantity },
        include: { product: true, location: true },
      });

      const transaction = await database.inventoryTransaction.create({
        data: {
          action: InventoryAction.CYCLE_COUNT,
          status: TransactionStatus.POSTED,
          productId: input.productId,
          sourceLocationId: input.locationId,
          quantity: input.quantity,
          referenceNumber: reference,
          notes: `First-time setup opening stock. ${input.note?.trim() ?? ""}`.trim(),
          createdById: user.id,
          approvedById: user.id,
          confirmedAt: postedAt,
          approvedAt: postedAt,
          postedAt,
        },
        include: {
          product: true,
          sourceLocation: true,
          destinationLocation: true,
          createdBy: true,
          approvedBy: true,
        },
      });

      return { balance: updated, transaction };
    });
  }

  /**
   * Step 6 — a Manager assigns a Warehouse Executive's shift and warehouse zone.
   * Workers cannot change their own assignments; only the Manager does this in setup.
   */
  async assignWorker(input: AssignWorkerDto, actor: AuthenticatedUser) {
    const target = await this.prisma.user.findFirst({
      where: { id: input.userId, active: true, role: UserRole.WORKER },
    });
    if (!target) {
      throw new NotFoundException("Active Warehouse Executive not found.");
    }
    if (getAuthenticatedEmail(actor) && target.email === getAuthenticatedEmail(actor)) {
      throw new ForbiddenException("A Manager cannot assign their own account.");
    }

    const shift = input.shift.trim();
    const warehouseZone = input.warehouseZone.trim();
    if (!shift || !warehouseZone) {
      throw new BadRequestException("Shift and warehouse zone are required.");
    }

    const updated = await this.prisma.user.update({
      where: { id: target.id },
      data: { shift, warehouseZone },
      select: { id: true, employeeId: true, displayName: true, shift: true, warehouseZone: true },
    });

    await this.prisma.userAccessAudit.create({
      data: {
        action: "WORKER_ASSIGNED",
        actorUsername: getAuthenticatedEmployeeId(actor),
        actorEmail: getAuthenticatedEmail(actor) ?? null,
        targetUserId: target.id,
        targetEmployeeId: target.employeeId,
        targetDisplayName: target.displayName,
        details: `Shift: ${shift}; warehouse zone: ${warehouseZone}`,
      },
    });

    return updated;
  }

  private async resolveUser(actor: AuthenticatedUser) {
    return resolveCanonicalUser(this.prisma, actor);
  }
}
