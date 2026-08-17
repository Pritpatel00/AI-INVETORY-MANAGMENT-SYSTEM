import { Injectable } from "@nestjs/common";
import { DiscrepancySeverity } from "@prisma/client";

/**
 * Configurable severity thresholds. These live in backend configuration so
 * business rules can be tuned without a code change.
 */
export interface DiscrepancyThresholds {
  /** Absolute-unit tolerance for a MINOR discrepancy (default 2). */
  minorUnits: number;
  /** Percentage tolerance for a MINOR discrepancy (default 2%). */
  minorPercent: number;
  /** Percentage ceiling for a MEDIUM discrepancy (default 5%). */
  mediumPercent: number;
  /** Percentage ceiling for a MAJOR discrepancy (default 15%). */
  majorPercent: number;
}

export const DEFAULT_DISCREPANCY_THRESHOLDS: DiscrepancyThresholds = {
  minorUnits: 2,
  minorPercent: 2,
  mediumPercent: 5,
  majorPercent: 15,
};

export interface DiscrepancyEvaluation {
  differenceQuantity: number;
  differenceAbsolute: number;
  differencePercentage: number;
  severity: DiscrepancySeverity;
  /** Human-readable backend rule (thresholds used) that produced the severity. */
  rule: string;
}

const SEVERITY_RANK: Record<DiscrepancySeverity, number> = {
  NONE: 0,
  MINOR: 1,
  MEDIUM: 2,
  MAJOR: 3,
  CRITICAL: 4,
};

@Injectable()
export class DiscrepancyRulesService {
  private readonly thresholds: DiscrepancyThresholds;

  constructor(thresholds: Partial<DiscrepancyThresholds> = {}) {
    this.thresholds = {
      ...DEFAULT_DISCREPANCY_THRESHOLDS,
      ...thresholds,
    };
  }

  /**
   * Calculates the difference between the system quantity and the counted
   * quantity, then applies the default severity rules.
   *
   * Severity uses the most severe result from the quantity, percentage and
   * controlled-product rules:
   * - NONE:      no difference
   * - MINOR:     within `minorUnits` units and `minorPercent`%
   * - MEDIUM:    above the minor bounds, up to `mediumPercent`%
   * - MAJOR:     above `mediumPercent`%, up to `majorPercent`%
   * - CRITICAL:  above `majorPercent`% or a controlled product
   *
   * The returned `rule` names the deterministic threshold that produced the
   * severity so managers can see exactly why a case was classified.
   */
  evaluateDiscrepancy(
    expectedQuantity: number,
    countedQuantity: number,
    controlled = false,
  ): DiscrepancyEvaluation {
    const differenceQuantity = countedQuantity - expectedQuantity;
    const differenceAbsolute = Math.abs(differenceQuantity);
    const differencePercentage =
      expectedQuantity > 0
        ? (differenceAbsolute / expectedQuantity) * 100
        : countedQuantity > 0
          ? 100
          : 0;
    const roundedPercentage = Math.round(differencePercentage * 100) / 100;

    const { severity, rule } = this.evaluateSeverity(
      differenceAbsolute,
      roundedPercentage,
      controlled,
    );

    return {
      differenceQuantity,
      differenceAbsolute,
      differencePercentage: roundedPercentage,
      severity,
      rule,
    };
  }

  private evaluateSeverity(
    differenceAbsolute: number,
    differencePercentage: number,
    controlled: boolean,
  ): { severity: DiscrepancySeverity; rule: string } {
    const { minorUnits, minorPercent, mediumPercent, majorPercent } =
      this.thresholds;

    // NONE: no difference
    if (differenceAbsolute === 0) {
      return {
        severity: DiscrepancySeverity.NONE,
        rule: "Counted quantity matches the system stock.",
      };
    }

    // Quantity-based severity (never exceeds MEDIUM on its own).
    const quantitySeverity =
      differenceAbsolute <= minorUnits
        ? DiscrepancySeverity.MINOR
        : DiscrepancySeverity.MEDIUM;

    // Percentage-based severity.
    let percentageSeverity: DiscrepancySeverity;
    if (differencePercentage <= minorPercent) {
      percentageSeverity = DiscrepancySeverity.MINOR;
    } else if (differencePercentage <= mediumPercent) {
      percentageSeverity = DiscrepancySeverity.MEDIUM;
    } else if (differencePercentage <= majorPercent) {
      percentageSeverity = DiscrepancySeverity.MAJOR;
    } else {
      percentageSeverity = DiscrepancySeverity.CRITICAL;
    }

    // Most severe of quantity and percentage.
    let severity =
      SEVERITY_RANK[quantitySeverity] >= SEVERITY_RANK[percentageSeverity]
        ? quantitySeverity
        : percentageSeverity;

    const differenceText = `${differenceAbsolute} unit${differenceAbsolute === 1 ? "" : "s"} (${differencePercentage}%)`;
    let rule: string;
    switch (severity) {
      case DiscrepancySeverity.MINOR:
        rule = `Difference of ${differenceText} stays within the minor tolerance (${minorUnits} units or ${minorPercent}%).`;
        break;
      case DiscrepancySeverity.MEDIUM:
        rule = `Difference of ${differenceText} exceeds the minor tolerance (${minorUnits} units or ${minorPercent}%) but stays within ${mediumPercent}% of system stock.`;
        break;
      case DiscrepancySeverity.MAJOR:
        rule = `Difference of ${differenceText} exceeds ${mediumPercent}% but stays within ${majorPercent}% of system stock.`;
        break;
      default:
        rule = `Difference of ${differenceText} exceeds ${majorPercent}% of system stock.`;
        break;
    }

    // Controlled products are always CRITICAL when a difference exists.
    if (controlled) {
      severity = DiscrepancySeverity.CRITICAL;
      rule = `Controlled product with any count difference (${differenceText}).`;
    }

    return { severity, rule };
  }
}
