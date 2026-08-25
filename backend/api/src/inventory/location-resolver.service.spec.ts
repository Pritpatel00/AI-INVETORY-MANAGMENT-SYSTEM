import { PrismaService } from "../prisma/prisma.service";
import { LocationResolverService } from "./location-resolver.service";

// Minimal mock of PrismaService that only provides the methods used by
// LocationResolverService.
function createPrismaMock(overrides: {
  userZone?: string | null;
  zoneLocation?: { id: string; code: string; name: string } | null;
  balance?: { quantity: number } | null;
}): PrismaService {
  const locationFindFirst = jest.fn(async () => {
    return overrides.zoneLocation ?? null;
  });
  const userFindUnique = jest.fn(async () => ({
    warehouseZone: overrides.userZone ?? null,
  }));
  const inventoryBalanceFindUnique = jest.fn(async () => overrides.balance ?? null);

  return {
    location: { findFirst: locationFindFirst },
    user: { findUnique: userFindUnique },
    inventoryBalance: { findUnique: inventoryBalanceFindUnique },
  } as unknown as PrismaService;
}

describe("LocationResolverService", () => {
  test("resolves the worker assigned zone when it matches an active location", async () => {
    const prisma = createPrismaMock({
      userZone: "storage",
      zoneLocation: { id: "zone-1", code: "STORAGE", name: "Storage" },
    });
    const service = new LocationResolverService(prisma);
    const result = await service.resolveWorkerZone("user-1");
    expect(result).toEqual({
      id: "zone-1",
      code: "STORAGE",
      name: "Storage",
      source: "WORKER_ZONE",
      label: "Storage — your assigned zone",
    });
  });

  test("returns null when the worker has no assigned zone", async () => {
    const prisma = createPrismaMock({ userZone: null });
    const service = new LocationResolverService(prisma);
    const result = await service.resolveWorkerZone("user-1");
    expect(result).toBeNull();
  });

  test("returns null when the assigned zone does not match any active location", async () => {
    const prisma = createPrismaMock({
      userZone: "unknown zone",
      zoneLocation: null,
    });
    const service = new LocationResolverService(prisma);
    const result = await service.resolveWorkerZone("user-1");
    expect(result).toBeNull();
  });

  test("uses the assigned zone for shipping when the product has stock there", async () => {
    const prisma = createPrismaMock({
      userZone: "storage",
      zoneLocation: { id: "zone-1", code: "STORAGE", name: "Storage" },
      balance: { quantity: 50 },
    });
    const service = new LocationResolverService(prisma);
    const result = await service.resolveShippingSource("user-1", "prod-1");
    expect(result).toEqual({
      id: "zone-1",
      code: "STORAGE",
      name: "Storage",
      source: "WORKER_ZONE",
      label: "Storage — your assigned zone",
    });
  });

  test("does NOT use the assigned zone for shipping when stock is insufficient", async () => {
    const prisma = createPrismaMock({
      userZone: "storage",
      zoneLocation: { id: "zone-1", code: "STORAGE", name: "Storage" },
      balance: { quantity: 10 },
    });
    const service = new LocationResolverService(prisma);
    const result = await service.resolveShippingSource("user-1", "prod-1");
    expect(result).toBeNull();
  });

  test("does NOT use the assigned zone for shipping when there is no balance record", async () => {
    const prisma = createPrismaMock({
      userZone: "storage",
      zoneLocation: { id: "zone-1", code: "STORAGE", name: "Storage" },
      balance: null,
    });
    const service = new LocationResolverService(prisma);
    const result = await service.resolveShippingSource("user-1", "prod-1");
    expect(result).toBeNull();
  });

  test("does NOT use the assigned zone for shipping when the worker has no zone", async () => {
    const prisma = createPrismaMock({ userZone: null });
    const service = new LocationResolverService(prisma);
    const result = await service.resolveShippingSource("user-1", "prod-1");
    expect(result).toBeNull();
  });
});
