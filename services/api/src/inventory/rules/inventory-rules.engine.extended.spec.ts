import { InventoryAction } from "@prisma/client";
import { InventoryRulesEngine } from "./inventory-rules.engine";

const rules = new InventoryRulesEngine();

// ── Helper: create a date N minutes from now ───────────────────────
function minutesFromNow(minutes: number): Date {
  return new Date(Date.now() + minutes * 60_000);
}

function minutesAgo(minutes: number): Date {
  return new Date(Date.now() - minutes * 60_000);
}

// ════════════════════════════════════════════════════════════════════
// §8.2 — Quantity-based routing
// ════════════════════════════════════════════════════════════════════

describe("§8.2 isQuantityUnusual", () => {
  test("returns false when there is no recent history", () => {
    expect(rules.isQuantityUnusual(100, [])).toBe(false);
  });

  test("returns false when quantity is within the default 50% threshold", () => {
    const recent = [
      { quantity: 100, createdAt: minutesAgo(1) },
      { quantity: 110, createdAt: minutesAgo(2) },
      { quantity: 90, createdAt: minutesAgo(3) },
    ];
    // average = 100, 120 is 20% deviation → below 50%
    expect(rules.isQuantityUnusual(120, recent)).toBe(false);
  });

  test("returns true when quantity deviates more than 50% from the average", () => {
    const recent = [
      { quantity: 100, createdAt: minutesAgo(1) },
      { quantity: 100, createdAt: minutesAgo(2) },
      { quantity: 100, createdAt: minutesAgo(3) },
    ];
    // average = 100, 200 is 100% deviation → above 50%
    expect(rules.isQuantityUnusual(200, recent)).toBe(true);
  });

  test("returns true when quantity is far below the average", () => {
    const recent = [
      { quantity: 100, createdAt: minutesAgo(1) },
      { quantity: 100, createdAt: minutesAgo(2) },
    ];
    // average = 100, 10 is 90% deviation → above 50%
    expect(rules.isQuantityUnusual(10, recent)).toBe(true);
  });

  test("respects a custom deviation threshold", () => {
    const recent = [
      { quantity: 100, createdAt: minutesAgo(1) },
      { quantity: 100, createdAt: minutesAgo(2) },
    ];
    // average = 100, 130 is 30% deviation
    // With 20% threshold → true; with 50% threshold → false
    expect(rules.isQuantityUnusual(130, recent, 20)).toBe(true);
    expect(rules.isQuantityUnusual(130, recent, 50)).toBe(false);
  });

  test("filters out transactions older than the window", () => {
    const recent = [
      { quantity: 100, createdAt: minutesAgo(1) },
      { quantity: 100, createdAt: minutesAgo(2) },
      // 40 days ago — outside the default 30-day window
      { quantity: 100, createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000) },
    ];
    // Only the two recent transactions count; average = 100
    // 200 is 100% deviation → true
    expect(rules.isQuantityUnusual(200, recent)).toBe(true);
  });

  test("respects a custom transaction count limit", () => {
    const recent = [
      { quantity: 100, createdAt: minutesAgo(1) },
      { quantity: 100, createdAt: minutesAgo(2) },
      { quantity: 100, createdAt: minutesAgo(3) },
      { quantity: 100, createdAt: minutesAgo(4) },
      { quantity: 100, createdAt: minutesAgo(5) },
    ];
    // With count=2, only the last 2 transactions are used; average = 100
    // 200 is 100% deviation → true
    expect(rules.isQuantityUnusual(200, recent, 50, 2)).toBe(true);
  });

  test("returns false for zero or negative quantities", () => {
    const recent = [{ quantity: 100, createdAt: minutesAgo(1) }];
    expect(rules.isQuantityUnusual(0, recent)).toBe(false);
    expect(rules.isQuantityUnusual(-5, recent)).toBe(false);
  });

  test("returns true when average is 0 and quantity is positive", () => {
    const recent = [
      { quantity: 0, createdAt: minutesAgo(1) },
      { quantity: 0, createdAt: minutesAgo(2) },
    ];
    expect(rules.isQuantityUnusual(50, recent)).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════
// §8.3 — Repeated-correction routing
// ════════════════════════════════════════════════════════════════════

describe("§8.3 isRepeatedCorrection", () => {
  test("returns false when there are no corrections", () => {
    expect(rules.isRepeatedCorrection("item-1", [])).toBe(false);
  });

  test("returns false when corrections are for a different product", () => {
    const corrections = [
      { productId: "item-2", createdAt: minutesAgo(10) },
      { productId: "item-2", createdAt: minutesAgo(20) },
      { productId: "item-2", createdAt: minutesAgo(30) },
      { productId: "item-2", createdAt: minutesAgo(40) },
    ];
    expect(rules.isRepeatedCorrection("item-1", corrections)).toBe(false);
  });

  test("returns false when corrections are below the threshold (3)", () => {
    const corrections = [
      { productId: "item-1", createdAt: minutesAgo(10) },
      { productId: "item-1", createdAt: minutesAgo(20) },
      { productId: "item-1", createdAt: minutesAgo(30) },
    ];
    // 3 corrections, threshold is 3 → not > 3 → false
    expect(rules.isRepeatedCorrection("item-1", corrections)).toBe(false);
  });

  test("returns true when corrections exceed the threshold (4 > 3)", () => {
    const corrections = [
      { productId: "item-1", createdAt: minutesAgo(10) },
      { productId: "item-1", createdAt: minutesAgo(20) },
      { productId: "item-1", createdAt: minutesAgo(30) },
      { productId: "item-1", createdAt: minutesAgo(40) },
    ];
    expect(rules.isRepeatedCorrection("item-1", corrections)).toBe(true);
  });

  test("filters out corrections outside the time window", () => {
    const corrections = [
      { productId: "item-1", createdAt: minutesAgo(10) },
      { productId: "item-1", createdAt: minutesAgo(20) },
      { productId: "item-1", createdAt: minutesAgo(30) },
      // 2 hours ago — outside the default 1-hour window
      { productId: "item-1", createdAt: minutesAgo(120) },
    ];
    // Only 3 within the window → not > 3 → false
    expect(rules.isRepeatedCorrection("item-1", corrections)).toBe(false);
  });

  test("respects a custom correction threshold", () => {
    const corrections = [
      { productId: "item-1", createdAt: minutesAgo(10) },
      { productId: "item-1", createdAt: minutesAgo(20) },
    ];
    // 2 corrections, threshold 1 → 2 > 1 → true
    expect(rules.isRepeatedCorrection("item-1", corrections, 1)).toBe(true);
    // 2 corrections, threshold 3 → 2 > 3 → false
    expect(rules.isRepeatedCorrection("item-1", corrections, 3)).toBe(false);
  });

  test("respects a custom time window", () => {
    const corrections = [
      { productId: "item-1", createdAt: minutesAgo(10) },
      { productId: "item-1", createdAt: minutesAgo(20) },
      { productId: "item-1", createdAt: minutesAgo(30) },
      { productId: "item-1", createdAt: minutesAgo(40) },
    ];
    // All 4 are within 60 minutes → 4 > 3 → true
    expect(rules.isRepeatedCorrection("item-1", corrections, 3, 60 * 60_000)).toBe(true);
    // With a 20-minute window, only 2 are within range → 2 > 3 → false
    expect(rules.isRepeatedCorrection("item-1", corrections, 3, 20 * 60_000)).toBe(false);
  });

  test("returns false for empty product ID", () => {
    const corrections = [
      { productId: "item-1", createdAt: minutesAgo(10) },
      { productId: "item-1", createdAt: minutesAgo(20) },
      { productId: "item-1", createdAt: minutesAgo(30) },
      { productId: "item-1", createdAt: minutesAgo(40) },
    ];
    expect(rules.isRepeatedCorrection("", corrections)).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════════
// §8.4 — Controlled / high-value item routing
// ════════════════════════════════════════════════════════════════════

describe("§8.4 isControlledItem", () => {
  test("returns true for a controlled product with a stock-reducing action", () => {
    const product = { id: "p1", controlled: true };
    expect(rules.isControlledItem(product, InventoryAction.SHIP)).toBe(true);
    expect(rules.isControlledItem(product, InventoryAction.USE)).toBe(true);
    expect(rules.isControlledItem(product, InventoryAction.DAMAGE)).toBe(true);
    expect(rules.isControlledItem(product, InventoryAction.LOSS)).toBe(true);
    expect(rules.isControlledItem(product, InventoryAction.CYCLE_COUNT)).toBe(true);
  });

  test("returns false for a controlled product with a non-stock-reducing action", () => {
    const product = { id: "p1", controlled: true };
    expect(rules.isControlledItem(product, InventoryAction.RECEIVE)).toBe(false);
    expect(rules.isControlledItem(product, InventoryAction.TRANSFER)).toBe(false);
  });

  test("returns false for a non-controlled product", () => {
    const product = { id: "p1", controlled: false };
    expect(rules.isControlledItem(product, InventoryAction.SHIP)).toBe(false);
    expect(rules.isControlledItem(product, InventoryAction.USE)).toBe(false);
    expect(rules.isControlledItem(product, InventoryAction.DAMAGE)).toBe(false);
    expect(rules.isControlledItem(product, InventoryAction.LOSS)).toBe(false);
    expect(rules.isControlledItem(product, InventoryAction.CYCLE_COUNT)).toBe(false);
  });

  test("returns false when product is null or undefined", () => {
    expect(rules.isControlledItem(null, InventoryAction.SHIP)).toBe(false);
    expect(rules.isControlledItem(undefined, InventoryAction.SHIP)).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════════
// §8.5 — Near-zero stock routing
// ════════════════════════════════════════════════════════════════════

describe("§8.5 isNearZeroStock", () => {
  test("returns true when resulting stock is within the default threshold (5)", () => {
    // available = 10, quantity = 6 → resulting = 4 → 4 <= 5 → true
    expect(rules.isNearZeroStock(10, 6, InventoryAction.SHIP)).toBe(true);
  });

  test("returns true when resulting stock is exactly at the threshold", () => {
    // available = 10, quantity = 5 → resulting = 5 → 5 <= 5 → true
    expect(rules.isNearZeroStock(10, 5, InventoryAction.SHIP)).toBe(true);
  });

  test("returns false when resulting stock is above the threshold", () => {
    // available = 100, quantity = 6 → resulting = 94 → 94 > 5 → false
    expect(rules.isNearZeroStock(100, 6, InventoryAction.SHIP)).toBe(false);
  });

  test("returns false for non-stock-reducing actions", () => {
    // RECEIVE increases stock, so near-zero check should not apply
    expect(rules.isNearZeroStock(10, 6, InventoryAction.RECEIVE)).toBe(false);
    expect(rules.isNearZeroStock(10, 6, InventoryAction.TRANSFER)).toBe(false);
  });

  test("returns false when available stock is null or undefined", () => {
    expect(rules.isNearZeroStock(null, 6, InventoryAction.SHIP)).toBe(false);
    expect(rules.isNearZeroStock(undefined, 6, InventoryAction.SHIP)).toBe(false);
  });

  test("returns false when quantity is zero or negative", () => {
    expect(rules.isNearZeroStock(10, 0, InventoryAction.SHIP)).toBe(false);
    expect(rules.isNearZeroStock(10, -5, InventoryAction.SHIP)).toBe(false);
  });

  test("respects a custom near-zero threshold", () => {
    // available = 10, quantity = 6 → resulting = 4
    // With threshold 3 → 4 > 3 → false
    expect(rules.isNearZeroStock(10, 6, InventoryAction.SHIP, 3)).toBe(false);
    // With threshold 5 → 4 <= 5 → true
    expect(rules.isNearZeroStock(10, 6, InventoryAction.SHIP, 5)).toBe(true);
  });

  test("returns false when resulting stock would be negative (that is a rejection, not a review)", () => {
    // available = 3, quantity = 10 → resulting = -7 → negative → false (handled by wouldCauseNegativeStock)
    expect(rules.isNearZeroStock(3, 10, InventoryAction.SHIP)).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════════
// §8.6 — Negative-stock prevention
// ════════════════════════════════════════════════════════════════════

describe("§8.6 wouldCauseNegativeStock", () => {
  test("returns true when quantity exceeds available stock", () => {
    expect(rules.wouldCauseNegativeStock(5, 10, InventoryAction.SHIP)).toBe(true);
  });

  test("returns false when quantity equals available stock", () => {
    expect(rules.wouldCauseNegativeStock(5, 5, InventoryAction.SHIP)).toBe(false);
  });

  test("returns false when quantity is less than available stock", () => {
    expect(rules.wouldCauseNegativeStock(10, 5, InventoryAction.SHIP)).toBe(false);
  });

  test("returns false for non-stock-reducing actions", () => {
    expect(rules.wouldCauseNegativeStock(5, 10, InventoryAction.RECEIVE)).toBe(false);
    expect(rules.wouldCauseNegativeStock(5, 10, InventoryAction.TRANSFER)).toBe(false);
  });

  test("returns false when available stock is null or undefined", () => {
    expect(rules.wouldCauseNegativeStock(null, 10, InventoryAction.SHIP)).toBe(false);
    expect(rules.wouldCauseNegativeStock(undefined, 10, InventoryAction.SHIP)).toBe(false);
  });

  test("returns false when quantity is zero or negative", () => {
    expect(rules.wouldCauseNegativeStock(5, 0, InventoryAction.SHIP)).toBe(false);
    expect(rules.wouldCauseNegativeStock(5, -5, InventoryAction.SHIP)).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════════
// Combined: requiresManagerReviewExtended
// ════════════════════════════════════════════════════════════════════

describe("requiresManagerReviewExtended — combined routing", () => {
  test("§8.1: CYCLE_COUNT, DAMAGE, LOSS always require review", () => {
    for (const action of [InventoryAction.CYCLE_COUNT, InventoryAction.DAMAGE, InventoryAction.LOSS]) {
      const result = rules.requiresManagerReviewExtended({
        action,
        quantity: 5,
        productId: "p1",
      });
      expect(result.requiresReview).toBe(true);
      expect(result.reasons.some((r) => r.includes("always requires"))).toBe(true);
    }
  });

  test("§8.1: RECEIVE, SHIP, USE, TRANSFER do not require review by action alone", () => {
    for (const action of [InventoryAction.RECEIVE, InventoryAction.SHIP, InventoryAction.USE, InventoryAction.TRANSFER]) {
      const result = rules.requiresManagerReviewExtended({
        action,
        quantity: 5,
        productId: "p1",
      });
      expect(result.requiresReview).toBe(false);
    }
  });

  test("§8.2: unusual quantity triggers review", () => {
    const recent = [
      { quantity: 100, createdAt: minutesAgo(1) },
      { quantity: 100, createdAt: minutesAgo(2) },
      { quantity: 100, createdAt: minutesAgo(3) },
    ];
    const result = rules.requiresManagerReviewExtended({
      action: InventoryAction.SHIP,
      quantity: 500, // 400% deviation
      productId: "p1",
      recentTransactions: recent,
    });
    expect(result.requiresReview).toBe(true);
    expect(result.reasons.some((r) => r.includes("deviates significantly"))).toBe(true);
  });

  test("§8.3: repeated correction triggers review", () => {
    const corrections = [
      { productId: "p1", createdAt: minutesAgo(10) },
      { productId: "p1", createdAt: minutesAgo(20) },
      { productId: "p1", createdAt: minutesAgo(30) },
      { productId: "p1", createdAt: minutesAgo(40) },
    ];
    const result = rules.requiresManagerReviewExtended({
      action: InventoryAction.SHIP,
      quantity: 5,
      productId: "p1",
      recentCorrections: corrections,
    });
    expect(result.requiresReview).toBe(true);
    expect(result.reasons.some((r) => r.includes("corrected more than"))).toBe(true);
  });

  test("§8.4: controlled item with stock-reducing action triggers review", () => {
    const result = rules.requiresManagerReviewExtended({
      action: InventoryAction.SHIP,
      quantity: 5,
      productId: "p1",
      product: { id: "p1", controlled: true },
    });
    expect(result.requiresReview).toBe(true);
    expect(result.reasons.some((r) => r.includes("controlled"))).toBe(true);
  });

  test("§8.4: controlled item with non-stock-reducing action does NOT trigger review", () => {
    const result = rules.requiresManagerReviewExtended({
      action: InventoryAction.RECEIVE,
      quantity: 5,
      productId: "p1",
      product: { id: "p1", controlled: true },
    });
    expect(result.requiresReview).toBe(false);
  });

  test("§8.5: near-zero stock triggers review", () => {
    const result = rules.requiresManagerReviewExtended({
      action: InventoryAction.SHIP,
      quantity: 6,
      productId: "p1",
      availableStock: 10, // resulting = 4, within threshold of 5
    });
    expect(result.requiresReview).toBe(true);
    expect(result.reasons.some((r) => r.includes("near-zero"))).toBe(true);
  });

  test("§8.5: near-zero stock does NOT trigger for non-stock-reducing actions", () => {
    const result = rules.requiresManagerReviewExtended({
      action: InventoryAction.RECEIVE,
      quantity: 6,
      productId: "p1",
      availableStock: 10,
    });
    expect(result.requiresReview).toBe(false);
  });

  test("§8.6: negative stock is NOT a review trigger (it is a rejection)", () => {
    // available = 3, quantity = 10 → resulting = -7 → negative
    // This should NOT trigger a review; it should be rejected by the caller.
    const result = rules.requiresManagerReviewExtended({
      action: InventoryAction.SHIP,
      quantity: 10,
      productId: "p1",
      availableStock: 3,
    });
    expect(result.requiresReview).toBe(false);
  });

  test("multiple rules can trigger simultaneously", () => {
    const recent = [
      { quantity: 100, createdAt: minutesAgo(1) },
      { quantity: 100, createdAt: minutesAgo(2) },
    ];
    const corrections = [
      { productId: "p1", createdAt: minutesAgo(10) },
      { productId: "p1", createdAt: minutesAgo(20) },
      { productId: "p1", createdAt: minutesAgo(30) },
      { productId: "p1", createdAt: minutesAgo(40) },
    ];
    const result = rules.requiresManagerReviewExtended({
      action: InventoryAction.DAMAGE, // §8.1
      quantity: 500, // §8.2
      productId: "p1",
      availableStock: 10, // §8.5
      recentTransactions: recent,
      recentCorrections: corrections,
      product: { id: "p1", controlled: true }, // §8.4
    });
    expect(result.requiresReview).toBe(true);
    expect(result.reasons.length).toBe(4); // §8.1, §8.2, §8.4, §8.5 (not §8.3 since 4 > 3 is true, so that's 5)
  });

  test("a safe transaction with no risk factors does not require review", () => {
    const result = rules.requiresManagerReviewExtended({
      action: InventoryAction.SHIP,
      quantity: 5,
      productId: "p1",
      availableStock: 100,
      recentTransactions: [
        { quantity: 10, createdAt: minutesAgo(1) },
        { quantity: 10, createdAt: minutesAgo(2) },
      ],
      recentCorrections: [],
      product: { id: "p1", controlled: false },
    });
    expect(result.requiresReview).toBe(false);
  });

  test("configurable thresholds are respected", () => {
    const recent = [
      { quantity: 100, createdAt: minutesAgo(1) },
      { quantity: 100, createdAt: minutesAgo(2) },
    ];
    // 120 is 20% deviation
    // With 10% threshold → true
    const result1 = rules.requiresManagerReviewExtended({
      action: InventoryAction.SHIP,
      quantity: 120,
      productId: "p1",
      recentTransactions: recent,
      quantityDeviationThreshold: 10,
    });
    expect(result1.requiresReview).toBe(true);

    // With 50% threshold → false
    const result2 = rules.requiresManagerReviewExtended({
      action: InventoryAction.SHIP,
      quantity: 120,
      productId: "p1",
      recentTransactions: recent,
      quantityDeviationThreshold: 50,
    });
    expect(result2.requiresReview).toBe(false);
  });
});
