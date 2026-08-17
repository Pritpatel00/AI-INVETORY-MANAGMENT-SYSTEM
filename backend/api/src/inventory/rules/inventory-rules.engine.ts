import { BadRequestException, ConflictException, Injectable } from "@nestjs/common";
import { InventoryAction } from "@prisma/client";

export interface TransactionRuleInput {
  action: InventoryAction;
  quantity: number;
  sourceLocationId?: string | null;
  destinationLocationId?: string | null;
}

export interface ReorderDecision {
  lowStock: boolean;
  available: number;
  suggestedQuantity: number;
}

/**
 * A recent transaction used for quantity-deviation analysis.
 */
export interface RecentTransaction {
  quantity: number;
  createdAt: Date;
}

/**
 * A recent correction (cancelled or recounted transaction) for the same item.
 */
export interface RecentCorrection {
  productId: string;
  createdAt: Date;
}

/**
 * Minimal product info needed for the controlled-item rule.
 */
export interface ProductInfo {
  id: string;
  controlled: boolean;
}

/**
 * Input for the extended manager-review check.
 * All threshold fields are optional and fall back to the defaults
 * documented in .clinerules §8.2–8.5.
 */
export interface ManagerReviewInput {
  action: InventoryAction;
  quantity: number;
  productId: string;
  sourceLocationId?: string | null;
  destinationLocationId?: string | null;
  /** Available stock at the source location (for near-zero check). */
  availableStock?: number;
  /** Recent transactions for the same product (for quantity-deviation check). */
  recentTransactions?: RecentTransaction[];
  /** Recent corrections for the same product (for repeated-correction check). */
  recentCorrections?: RecentCorrection[];
  /** Product record (for controlled-item check). */
  product?: ProductInfo;

  // --- Configurable thresholds (all optional, see .clinerules §8) ---
  /** % deviation from recent average that triggers review (default 50). */
  quantityDeviationThreshold?: number;
  /** Number of recent transactions to consider (default 10). */
  recentTransactionCount?: number;
  /** Days window for "recent" transactions (default 30). */
  recentTransactionWindowDays?: number;
  /** Number of corrections that triggers review (default 3). */
  correctionThreshold?: number;
  /** Time window in ms for correction counting (default 3_600_000 = 1 h). */
  correctionWindowMs?: number;
  /** Available stock at/below which a review is triggered (default 5). */
  nearZeroThreshold?: number;
}

/**
 * Result of the extended review check — explains *why* a review is needed.
 */
export interface ManagerReviewResult {
  requiresReview: boolean;
  reasons: string[];
}

/**
 * Actions that reduce stock at a source location.
 * Used by the controlled-item and near-zero rules.
 */
const STOCK_REDUCING_ACTIONS = new Set<InventoryAction>([
  InventoryAction.SHIP,
  InventoryAction.DAMAGE,
  InventoryAction.CYCLE_COUNT,
]);

@Injectable()
export class InventoryRulesEngine {
  private readonly reviewActions = new Set<InventoryAction>([
    InventoryAction.CYCLE_COUNT,
    InventoryAction.DAMAGE,
  ]);

  // ── Existing methods (unchanged) ──────────────────────────────────

  validateTransaction(input: TransactionRuleInput) {
    if (
      input.action === InventoryAction.USE ||
      input.action === InventoryAction.LOSS
    ) {
      throw new BadRequestException(
        "Use stock and Loss actions have been removed. Use Ship for outgoing stock or Damage for unusable stock.",
      );
    }

    if (!Number.isInteger(input.quantity) || input.quantity <= 0) {
      throw new BadRequestException("Quantity must be a whole number greater than zero.");
    }

    const sourceRequired = ([
      InventoryAction.SHIP,
      InventoryAction.CYCLE_COUNT,
      InventoryAction.DAMAGE,
    ] as InventoryAction[]).includes(input.action);

    if (input.action === InventoryAction.RECEIVE && !input.destinationLocationId) {
      throw new BadRequestException("Receiving stock requires a destination location.");
    }
    if (sourceRequired && !input.sourceLocationId) {
      throw new BadRequestException(`${input.action} requires a source location.`);
    }
    if (input.action === InventoryAction.TRANSFER && (!input.sourceLocationId || !input.destinationLocationId)) {
      throw new BadRequestException("A transfer requires both source and destination locations.");
    }
    if (input.sourceLocationId && input.sourceLocationId === input.destinationLocationId) {
      throw new BadRequestException("Source and destination locations must be different.");
    }
  }

  requiresManagerReview(action: InventoryAction) {
    return this.reviewActions.has(action);
  }

  assertAvailableStock(requested: number, quantity: number, reservedQuantity = 0) {
    const available = Math.max(0, quantity - reservedQuantity);
    if (available < requested) {
      throw new ConflictException(`Insufficient available stock. Requested ${requested}; available ${available}.`);
    }
    return available;
  }

  assertCycleCountAllowed(countedQuantity: number, reservedQuantity: number) {
    if (countedQuantity < reservedQuantity) {
      throw new ConflictException("The physical count is below the reserved quantity. Resolve reservations before approval.");
    }
  }

  evaluateDiscrepancy(systemQuantity: number, countedQuantity: number) {
    const difference = countedQuantity - systemQuantity;
    const absoluteDifference = Math.abs(difference);
    const percentageDifference = systemQuantity === 0
      ? (absoluteDifference > 0 ? 100 : 0)
      : (absoluteDifference / systemQuantity) * 100;
    return {
      difference,
      absoluteDifference,
      percentageDifference: Number(percentageDifference.toFixed(2)),
      significant: absoluteDifference >= 5 || percentageDifference >= 10,
    };
  }

  evaluateReorder(quantity: number, reservedQuantity: number, safetyStock: number, reorderQuantity: number): ReorderDecision {
    const available = quantity - reservedQuantity;
    const lowStock = safetyStock > 0 && available < safetyStock;
    return {
      lowStock,
      available,
      suggestedQuantity: lowStock ? Math.max(reorderQuantity, safetyStock - available) : 0,
    };
  }

  // ── New isolated rule functions (.clinerules §8.2–8.5) ───────────

  /**
   * §8.2 Quantity-based routing.
   *
   * Returns `true` when the proposed quantity deviates from the item's
   * recent average by more than `deviationThresholdPercent` (default 50).
   *
   * "Recent" transactions are filtered to the last `recentTransactionCount`
   * (default 10) within `recentTransactionWindowDays` (default 30) days.
   *
   * If there is no recent history the rule is **not** triggered — a new
   * item has no baseline to compare against.
   */
  isQuantityUnusual(
    quantity: number,
    recentTransactions: RecentTransaction[],
    deviationThresholdPercent = 50,
    recentTransactionCount = 10,
    recentTransactionWindowDays = 30,
  ): boolean {
    if (!Number.isFinite(quantity) || quantity <= 0) return false;
    if (!recentTransactions || recentTransactions.length === 0) return false;

    const now = new Date();
    const windowMs = recentTransactionWindowDays * 24 * 60 * 60 * 1000;
    const cutoff = new Date(now.getTime() - windowMs);

    const recent = recentTransactions
      .filter((tx) => tx.createdAt >= cutoff)
      .slice(-recentTransactionCount);

    if (recent.length === 0) return false;

    const average = recent.reduce((sum, tx) => sum + tx.quantity, 0) / recent.length;
    if (average === 0) return quantity > 0; // any positive quantity is unusual if average is 0

    const deviation = Math.abs(quantity - average) / average;
    return deviation * 100 > deviationThresholdPercent;
  }

  /**
   * §8.3 Repeated-correction routing.
   *
   * Returns `true` when the same product has been corrected (cancelled or
   * recount-requested) more than `correctionThreshold` times (default 3)
   * within the last `correctionWindowMs` milliseconds (default 1 hour).
   */
  isRepeatedCorrection(
    productId: string,
    recentCorrections: RecentCorrection[],
    correctionThreshold = 3,
    correctionWindowMs = 3_600_000,
  ): boolean {
    if (!productId || !recentCorrections || recentCorrections.length === 0) return false;

    const now = new Date();
    const cutoff = new Date(now.getTime() - correctionWindowMs);

    const matching = recentCorrections.filter(
      (correction) =>
        correction.productId === productId && correction.createdAt >= cutoff,
    );

    return matching.length > correctionThreshold;
  }

  /**
   * §8.4 Controlled / high-value item routing.
   *
   * Returns `true` when the product is flagged as `controlled` **and** the
   * action is stock-reducing (SHIP, DAMAGE, CYCLE_COUNT).
   */
  isControlledItem(product: ProductInfo | null | undefined, action: InventoryAction): boolean {
    if (!product?.controlled) return false;
    return STOCK_REDUCING_ACTIONS.has(action);
  }

  /**
   * §8.5 Near-zero stock routing.
   *
   * Returns `true` when the transaction would bring available stock at the
   * source location to within `nearZeroThreshold` units of zero (default 5).
   *
   * Applies only to stock-reducing actions.
   */
  isNearZeroStock(
    availableStock: number | null | undefined,
    quantity: number,
    action: InventoryAction,
    nearZeroThreshold = 5,
  ): boolean {
    if (!STOCK_REDUCING_ACTIONS.has(action)) return false;
    if (availableStock === null || availableStock === undefined) return false;
    if (!Number.isFinite(quantity) || quantity <= 0) return false;

    const resultingStock = availableStock - quantity;
    return resultingStock <= nearZeroThreshold && resultingStock >= 0;
  }

  /**
   * §8.6 Negative-stock prevention.
   *
   * Returns `true` when the transaction would result in negative available
   * stock. Callers should throw a `ConflictException` rather than route
   * for review.
   */
  wouldCauseNegativeStock(
    availableStock: number | null | undefined,
    quantity: number,
    action: InventoryAction,
  ): boolean {
    if (!STOCK_REDUCING_ACTIONS.has(action)) return false;
    if (availableStock === null || availableStock === undefined) return false;
    if (!Number.isFinite(quantity) || quantity <= 0) return false;

    return availableStock - quantity < 0;
  }

  /**
   * Extended manager-review check that combines the existing action-based
   * rule (§8.1) with the new quantity, correction, controlled-item, and
   * near-zero rules (§8.2–8.5).
   *
   * Returns a `ManagerReviewResult` with `requiresReview` and a list of
   * human-readable `reasons` explaining why a review is needed.
   */
  requiresManagerReviewExtended(input: ManagerReviewInput): ManagerReviewResult {
    const reasons: string[] = [];

    // Business approval policy: RECEIVE, SHIP and TRANSFER post after
    // their fixed validation rules pass. Only CYCLE_COUNT and DAMAGE
    // enter manager review. Risk signals remain useful as review reasons for
    // those review actions, but must not turn a normal movement into an
    // approval transaction.
    if (!this.requiresManagerReview(input.action)) {
      return { requiresReview: false, reasons };
    }

    // §8.1 — action-based routing
    reasons.push(`Action ${input.action} always requires manager review.`);

    // §8.2 — quantity-based routing
    if (
      input.recentTransactions &&
      input.recentTransactions.length > 0 &&
      this.isQuantityUnusual(
        input.quantity,
        input.recentTransactions,
        input.quantityDeviationThreshold,
        input.recentTransactionCount,
        input.recentTransactionWindowDays,
      )
    ) {
      reasons.push(
        `Quantity ${input.quantity} deviates significantly from the recent average.`,
      );
    }

    // §8.3 — repeated-correction routing
    if (
      input.recentCorrections &&
      input.recentCorrections.length > 0 &&
      this.isRepeatedCorrection(
        input.productId,
        input.recentCorrections,
        input.correctionThreshold,
        input.correctionWindowMs,
      )
    ) {
      reasons.push(
        `Item has been corrected more than the allowed threshold within the time window.`,
      );
    }

    // §8.4 — controlled / high-value item routing
    if (this.isControlledItem(input.product ?? null, input.action)) {
      reasons.push(
        `Product is flagged as controlled and the action ${input.action} reduces stock.`,
      );
    }

    // §8.5 — near-zero stock routing
    if (
      input.availableStock !== undefined &&
      this.isNearZeroStock(
        input.availableStock,
        input.quantity,
        input.action,
        input.nearZeroThreshold,
      )
    ) {
      reasons.push(
        `Transaction would bring available stock to within the near-zero threshold.`,
      );
    }

    return {
      requiresReview: reasons.length > 0,
      reasons,
    };
  }
}
