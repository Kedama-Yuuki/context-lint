import { describe, it, expect } from "vitest";
import { parse } from "../parser.js";
import { runRules } from "../runner.js";
import M2_001 from "../rules/M2-001.js";
import M2_002 from "../rules/M2-002.js";

function lintWith(rule: typeof M2_001, source: string) {
  const ast = parse(source);
  return runRules({
    source,
    ast,
    filePath: "test.md",
    rules: [rule],
    ruleSettings: { [rule.meta.id]: "error" },
  });
}

describe("M2-001: Duplicate content across sections", () => {
  it("flags highly similar sections", () => {
    const source = `# Color Tokens

The primary color is #1a73e8 and it is used for buttons and links throughout the application.

## Alternate Color Tokens

The primary color is #1a73e8 and it is used for buttons and links throughout the application.`;
    const msgs = lintWith(M2_001, source);
    expect(msgs.length).toBeGreaterThan(0);
    expect(msgs[0].ruleId).toBe("M2-001");
  });

  it("does not flag distinct sections", () => {
    const source = `# Colors

The primary color is blue, used for actions.

## Typography

Font sizes range from 12px to 48px for headings.`;
    const msgs = lintWith(M2_001, source);
    expect(msgs).toHaveLength(0);
  });
});

describe("M2-002: Synonym detection", () => {
  it("flags synonym token names (primary/main)", () => {
    const source = `| Name | Value |
| --- | --- |
| primary-color | #1a73e8 |
| main-color | #1a73e8 |`;
    const msgs = lintWith(M2_002, source);
    expect(msgs.length).toBeGreaterThan(0);
    expect(msgs[0].ruleId).toBe("M2-002");
  });

  it("does not flag unrelated token names", () => {
    const source = `| Name | Value |
| --- | --- |
| primary-color | #1a73e8 |
| font-size-large | 24px |`;
    const msgs = lintWith(M2_002, source);
    expect(msgs).toHaveLength(0);
  });

  it("flags button/btn synonyms", () => {
    const source = `| Name | Value |
| --- | --- |
| button-height | 40px |
| btn-height | 40px |`;
    const msgs = lintWith(M2_002, source);
    expect(msgs.length).toBeGreaterThan(0);
  });
});
