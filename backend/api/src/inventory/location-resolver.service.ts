import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

export type LocationSourceType =
  | "SPOKEN"
  | "RECEIVING_DEFAULT"
  | "WORKER_ZONE"
  | "CLARIFIED"
  | "ASSIGNED_TASK";

export interface ResolvedLocationResult {
  id: string;
  code: string;
  name: string;
  source: LocationSourceType;
  /** Human-readable label for the confirmation UI. */
  label: string;
}

@Injectable()
export class LocationResolverService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resolve the worker's assigned warehouse zone to a matching active location.
   * The zone string is compared against both location codes and names (case-insensitive).
   */
  async resolveWorkerZone(userId: string): Promise<ResolvedLocationResult | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { warehouseZone: true },
    });
    if (!user?.warehouseZone) return null;

    const zone = user.warehouseZone.trim().toLowerCase();
    const location = await this.prisma.location.findFirst({
      where: {
        active: true,
        OR: [
          { code: { equals: zone, mode: "insensitive" } },
          { name: { equals: zone, mode: "insensitive" } },
        ],
      },
      select: { id: true, code: true, name: true },
    });
    if (!location) return null;
    return {
      id: location.id,
      code: location.code,
      name: location.name,
      source: "WORKER_ZONE",
      label: `${location.name} — your assigned zone`,
    };
  }

  /**
   * Resolve a shipping source location for SHIP actions.
   * First tries the worker's assigned zone, then only uses it if the
   * product actually has stock at that location.
   */
  async resolveShippingSource(
    userId: string,
    productId: string,
  ): Promise<ResolvedLocationResult | null> {
    const zoneLocation = await this.resolveWorkerZone(userId);
    if (!zoneLocation) return null;

    const balance = await this.prisma.inventoryBalance.findUnique({
      where: {
        productId_locationId: {
          productId,
          locationId: zoneLocation.id,
        },
      },
      select: { quantity: true },
    });
    if (!balance) return null;
    const available = balance.quantity;
    if (available <= 0) return null;

    return zoneLocation;
  }
}
