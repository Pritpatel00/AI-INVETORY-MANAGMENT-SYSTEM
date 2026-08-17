import { DiscrepancySeverity } from "@prisma/client";
import { DiscrepancyRulesService } from "./discrepancy-rules.service";

const rules = new DiscrepancyRulesService();

describe("DiscrepancyRulesService — difference calculation", () => {
  test("exact count produces NONE severity and a zero difference", () => {
    const result = rules.evaluateDiscrepancy(50, 50);
    expect(result.differenceQuantity).toBe(0);
    expect(result.differenceAbsolute).toBe(0);
    expect(result.differencePercentage).toBe(0);
    expect(result.severity).toBe(DiscrepancySeverity.NONE);
  });

  test("positive discrepancy (counted above expected)", () => {
    const result = rules.evaluateDiscrepancy(50, 55);
    expect(result.differenceQuantity).toBe(5);
    expect(result.differenceAbsolute).toBe(5);
    expect(result.differencePercentage).toBe(10);
    expect(result.severity).toBe(DiscrepancySeverity.MAJOR);
  });

  test("negative discrepancy (counted below expected)", () => {
    const result = rules.evaluateDiscrepancy(50, 45);
    expect(result.differenceQuantity).toBe(-5);
    expect(result.differenceAbsolute).toBe(5);
    expect(result.differencePercentage).toBe(10);
    expect(result.severity).toBe(DiscrepancySeverity.MAJOR);
  });

  test("expected quantity of zero with counted above zero is 100%", () => {
    const result = rules.evaluateDiscrepancy(0, 5);
    expect(result.differenceQuantity).toBe(5);
    expect(result.differencePercentage).toBe(100);
    expect(result.severity).toBe(DiscrepancySeverity.CRITICAL);
  });

  test("expected and counted both zero has no difference", () => {
    const result = rules.evaluateDiscrepancy(0, 0);
    expect(result.differenceQuantity).toBe(0);
    expect(result.differencePercentage).toBe(0);
    expect(result.severity).toBe(DiscrepancySeverity.NONE);
  });
});

describe("DiscrepancyRulesService — severity thresholds", () => {
  test("quantity threshold: difference within 2 units is MINOR when percentage is tiny", () => {
    // 1000 expected, 1002 counted → 2 units, 0.2%
    const result = rules.evaluateDiscrepancy(1000, 1002);
    expect(result.differenceAbsolute).toBe(2);
    expect(result.severity).toBe(DiscrepancySeverity.MINOR);
  });

  test("quantity threshold: difference above 2 units is at least MEDIUM", () => {
    // 1000 expected, 1003 counted → 3 units, 0.3%
    const result = rules.evaluateDiscrepancy(1000, 1003);
    expect(result.differenceAbsolute).toBe(3);
    expect(result.severity).toBe(DiscrepancySeverity.MEDIUM);
  });

  test("percentage threshold: 2% stays MINOR", () => {
    const result = rules.evaluateDiscrepancy(100, 102);
    expect(result.differencePercentage).toBe(2);
    expect(result.severity).toBe(DiscrepancySeverity.MINOR);
  });

  test("percentage threshold: above 2% is MEDIUM", () => {
    const result = rules.evaluateDiscrepancy(100, 103);
    expect(result.differencePercentage).toBe(3);
    expect(result.severity).toBe(DiscrepancySeverity.MEDIUM);
  });

  test("percentage threshold: 5% is MEDIUM, above 5% is MAJOR", () => {
    expect(rules.evaluateDiscrepancy(100, 105).severity).toBe(
      DiscrepancySeverity.MEDIUM,
    );
    expect(rules.evaluateDiscrepancy(100, 106).severity).toBe(
      DiscrepancySeverity.MAJOR,
    );
  });

  test("percentage threshold: 15% is MAJOR, above 15% is CRITICAL", () => {
    expect(rules.evaluateDiscrepancy(100, 115).severity).toBe(
      DiscrepancySeverity.MAJOR,
    );
    expect(rules.evaluateDiscrepancy(100, 116).severity).toBe(
      DiscrepancySeverity.CRITICAL,
    );
  });

  test("most severe result wins when quantity and percentage disagree", () => {
    // 10 expected, 11 counted → 1 unit (MINOR by quantity) but 10% (MAJOR by percentage)
    const result = rules.evaluateDiscrepancy(10, 11);
    expect(result.differenceAbsolute).toBe(1);
    expect(result.differencePercentage).toBe(10);
    expect(result.severity).toBe(DiscrepancySeverity.MAJOR);
  });

  test("controlled product with any difference is CRITICAL", () => {
    const small = rules.evaluateDiscrepancy(1000, 1002, true);
    expect(small.severity).toBe(DiscrepancySeverity.CRITICAL);
  });

  test("controlled product with matching count is NONE", () => {
    const exact = rules.evaluateDiscrepancy(50, 50, true);
    expect(exact.severity).toBe(DiscrepancySeverity.NONE);
  });
});

describe("DiscrepancyRulesService — applied rule is exposed for managers", () => {
  test("NONE describes the matching count", () => {
    const result = rules.evaluateDiscrepancy(50, 50);
    expect(result.rule).toContain("matches the system stock");
  });

  test("MINOR names the minor tolerance", () => {
    const result = rules.evaluateDiscrepancy(1000, 1002);
    expect(result.severity).toBe(DiscrepancySeverity.MINOR);
    expect(result.rule).toContain("minor tolerance");
    expect(result.rule).toContain("2 units");
  });

  test("MEDIUM names the medium ceiling", () => {
    const result = rules.evaluateDiscrepancy(100, 103);
    expect(result.severity).toBe(DiscrepancySeverity.MEDIUM);
    expect(result.rule).toContain("5%");
  });

  test("MAJOR names the major ceiling and the actual difference", () => {
    const result = rules.evaluateDiscrepancy(100, 106);
    expect(result.severity).toBe(DiscrepancySeverity.MAJOR);
    expect(result.rule).toContain("6 units (6%)");
    expect(result.rule).toContain("15%");
  });

  test("CRITICAL names the exceeded ceiling", () => {
    const result = rules.evaluateDiscrepancy(100, 116);
    expect(result.severity).toBe(DiscrepancySeverity.CRITICAL);
    expect(result.rule).toContain("exceeds 15%");
  });

  test("controlled products expose a dedicated rule", () => {
    const result = rules.evaluateDiscrepancy(1000, 1002, true);
    expect(result.severity).toBe(DiscrepancySeverity.CRITICAL);
    expect(result.rule).toContain("Controlled product");
  });

  test("custom thresholds are reflected in the rule text", () => {
    const custom = new DiscrepancyRulesService({
      minorUnits: 5,
      minorPercent: 1,
      mediumPercent: 10,
      majorPercent: 20,
    });
    const result = custom.evaluateDiscrepancy(100, 125);
    expect(result.severity).toBe(DiscrepancySeverity.CRITICAL);
    expect(result.rule).toContain("20%");
  });
});

describe("DiscrepancyRulesService — configurable thresholds", () => {
  test("custom thresholds change the severity boundaries", () => {
    const custom = new DiscrepancyRulesService({
      minorUnits: 5,
      minorPercent: 1,
      mediumPercent: 10,
      majorPercent: 20,
    });
    // 5 units with 0.5% → MINOR under custom minorUnits of 5
    expect(custom.evaluateDiscrepancy(1000, 1005).severity).toBe(
      DiscrepancySeverity.MINOR,
    );
    // 12 units with 1.2% → MEDIUM under custom mediumPercent of 10
    expect(custom.evaluateDiscrepancy(1000, 1012).severity).toBe(
      DiscrepancySeverity.MEDIUM,
    );
    // 25% → CRITICAL under custom majorPercent of 20
    expect(custom.evaluateDiscrepancy(100, 125).severity).toBe(
      DiscrepancySeverity.CRITICAL,
    );
  });

  test("percentage rounding keeps results stable", () => {
    // 3 units out of 7 → 42.857...% → rounds to 42.86 → CRITICAL
    const result = rules.evaluateDiscrepancy(7, 10);
    expect(result.differencePercentage).toBe(42.86);
    expect(result.severity).toBe(DiscrepancySeverity.CRITICAL);
  });
});
