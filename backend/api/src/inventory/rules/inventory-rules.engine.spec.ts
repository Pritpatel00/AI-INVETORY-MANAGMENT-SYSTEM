import assert from "node:assert/strict";
import test from "node:test";
import { InventoryAction } from "@prisma/client";
import { InventoryRulesEngine } from "./inventory-rules.engine";

const rules = new InventoryRulesEngine();

test("requires positive whole quantities", () => {
  assert.throws(() => rules.validateTransaction({ action: InventoryAction.RECEIVE, quantity: 0, destinationLocationId: "B" }));
});

test("requires the correct locations for each action", () => {
  assert.throws(
    () =>
      rules.validateTransaction({
        action: InventoryAction.RECEIVE,
        quantity: 5,
      }),
    /destination location/i,
  );
  assert.throws(() => rules.validateTransaction({ action: InventoryAction.TRANSFER, quantity: 5, sourceLocationId: "A" }));
  assert.throws(() => rules.validateTransaction({ action: InventoryAction.TRANSFER, quantity: 5, sourceLocationId: "A", destinationLocationId: "A" }));
});

test("routes controlled adjustments to manager review", () => {
  assert.equal(rules.requiresManagerReview(InventoryAction.CYCLE_COUNT), true);
  assert.equal(rules.requiresManagerReview(InventoryAction.DAMAGE), true);
  assert.equal(rules.requiresManagerReview(InventoryAction.RECEIVE), false);
  assert.equal(rules.requiresManagerReview(InventoryAction.SHIP), false);
  assert.equal(rules.requiresManagerReview(InventoryAction.TRANSFER), false);
});

test("rejects removed Use stock and Loss actions", () => {
  for (const action of [InventoryAction.USE, InventoryAction.LOSS]) {
    assert.throws(
      () =>
        rules.validateTransaction({
          action,
          quantity: 1,
          sourceLocationId: "A",
        }),
      /have been removed/i,
    );
  }
});

test("prevents negative available stock", () => {
  assert.throws(() => rules.assertAvailableStock(6, 10, 5));
  assert.equal(rules.assertAvailableStock(5, 10, 5), 5);
});

test("flags material cycle-count discrepancies", () => {
  assert.equal(rules.evaluateDiscrepancy(100, 98).significant, false);
  assert.equal(rules.evaluateDiscrepancy(100, 89).significant, true);
});

test("creates the correct reorder recommendation", () => {
  assert.deepEqual(rules.evaluateReorder(50, 0, 60, 25), { lowStock: true, available: 50, suggestedQuantity: 25 });
  assert.equal(rules.evaluateReorder(70, 0, 60, 25).lowStock, false);
});
