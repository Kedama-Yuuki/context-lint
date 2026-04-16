import { describe, it, expect } from "vitest";
import { formatText, formatJson } from "../reporter.js";
import type { LintResult } from "../types.js";

describe("formatText", () => {
  it("formats a clean result", () => {
    const result: LintResult = {
      filePath: "DESIGN.md",
      messages: [],
      score: 100,
      rank: "AI-Ready",
    };
    const text = formatText(result);
    expect(text).toContain("No issues found");
    expect(text).toContain("100/100");
    expect(text).toContain("AI-Ready");
  });

  it("formats messages with location and severity", () => {
    const result: LintResult = {
      filePath: "DESIGN.md",
      messages: [
        {
          ruleId: "L2-003",
          severity: "critical",
          message: 'Value "8" has no unit',
          line: 5,
          column: 10,
        },
      ],
      score: 80,
      rank: "Mostly Ready",
    };
    const text = formatText(result);
    expect(text).toContain("5:10");
    expect(text).toContain("CRITICAL");
    expect(text).toContain("L2-003");
    expect(text).toContain("1 problem(s)");
    expect(text).toContain("80/100");
  });
});

describe("formatJson", () => {
  it("returns valid JSON", () => {
    const result: LintResult = {
      filePath: "test.md",
      messages: [],
      score: 100,
      rank: "AI-Ready",
    };
    const json = formatJson(result);
    const parsed = JSON.parse(json);
    expect(parsed.score).toBe(100);
    expect(parsed.rank).toBe("AI-Ready");
  });
});
