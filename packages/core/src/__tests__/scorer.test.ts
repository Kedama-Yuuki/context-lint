import { describe, it, expect } from "vitest";
import { createScorer } from "../scorer.js";
import type { LintMessage } from "../types.js";

describe("createScorer", () => {
  const scorer = createScorer();

  it("returns 100 and AI-Ready for no messages", () => {
    const result = scorer.calculate([]);
    expect(result.score).toBe(100);
    expect(result.rank).toBe("AI-Ready");
  });

  it("deducts 20 per critical issue", () => {
    const messages: LintMessage[] = [
      { ruleId: "L2-003", severity: "critical", message: "test", line: 1, column: 1 },
    ];
    const result = scorer.calculate(messages);
    expect(result.score).toBe(80);
    expect(result.rank).toBe("Mostly Ready");
  });

  it("returns Not AI-Ready for score below 50", () => {
    const messages: LintMessage[] = Array.from({ length: 6 }, (_, i) => ({
      ruleId: `L${i}`,
      severity: "high" as const,
      message: "test",
      line: 1,
      column: 1,
    }));
    const result = scorer.calculate(messages);
    expect(result.score).toBe(40);
    expect(result.rank).toBe("Not AI-Ready");
  });

  it("clamps score to 0 minimum", () => {
    const messages: LintMessage[] = Array.from({ length: 10 }, () => ({
      ruleId: "test",
      severity: "critical" as const,
      message: "test",
      line: 1,
      column: 1,
    }));
    const result = scorer.calculate(messages);
    expect(result.score).toBe(0);
    expect(result.rank).toBe("Not AI-Ready");
  });
});
