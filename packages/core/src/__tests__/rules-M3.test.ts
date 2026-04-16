import { describe, it, expect } from "vitest";
import { parse } from "../parser.js";
import { runRules } from "../runner.js";
import M3_001 from "../rules/M3-001.js";
import M3_002 from "../rules/M3-002.js";
import M3_003 from "../rules/M3-003.js";

function lintWith(rule: typeof M3_001, source: string) {
  const ast = parse(source);
  return runRules({
    source,
    ast,
    filePath: "test.md",
    rules: [rule],
    ruleSettings: { [rule.meta.id]: "error" },
  });
}

describe("M3-001: Ambiguous words", () => {
  it("flags English ambiguous words", () => {
    const source = `Use appropriate colors as needed.`;
    const msgs = lintWith(M3_001, source);
    expect(msgs.length).toBeGreaterThan(0);
    expect(msgs[0].ruleId).toBe("M3-001");
  });

  it("flags Japanese ambiguous words", () => {
    const source = `適切な色を適宜使用してください。`;
    const msgs = lintWith(M3_001, source);
    expect(msgs.length).toBeGreaterThan(0);
  });

  it("does not flag clear language", () => {
    const source = `Use #1a73e8 for primary buttons.`;
    const msgs = lintWith(M3_001, source);
    expect(msgs).toHaveLength(0);
  });

  it("skips code blocks", () => {
    const source = `\`\`\`
Use appropriate values.
\`\`\``;
    const msgs = lintWith(M3_001, source);
    expect(msgs).toHaveLength(0);
  });
});

describe("M3-002: Negative constraint overuse", () => {
  it("flags excessive negative patterns", () => {
    const source = `Don't use inline styles.
Never modify global state.
Do not skip tests.
Avoid using var.
Must not use eval.
Should not ignore errors.`;
    const msgs = lintWith(M3_002, source);
    expect(msgs.length).toBeGreaterThan(0);
    expect(msgs[0].ruleId).toBe("M3-002");
  });

  it("does not flag few negatives", () => {
    const source = `Don't use inline styles.
Prefer const over let.`;
    const msgs = lintWith(M3_002, source);
    expect(msgs).toHaveLength(0);
  });
});

describe("M3-003: Bare numeric values", () => {
  it("flags bare numbers in tables", () => {
    const source = `| Name | Value |
| --- | --- |
| spacing-small | 4 |`;
    const msgs = lintWith(M3_003, source);
    expect(msgs.length).toBeGreaterThan(0);
    expect(msgs[0].ruleId).toBe("M3-003");
  });

  it("does not flag values with units", () => {
    const source = `| Name | Value |
| --- | --- |
| spacing-small | 4px |`;
    const msgs = lintWith(M3_003, source);
    expect(msgs).toHaveLength(0);
  });

  it("does not flag zero", () => {
    const source = `| Name | Value |
| --- | --- |
| spacing-none | 0 |`;
    const msgs = lintWith(M3_003, source);
    expect(msgs).toHaveLength(0);
  });
});
