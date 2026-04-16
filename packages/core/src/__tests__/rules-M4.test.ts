import { describe, it, expect } from "vitest";
import { parse } from "../parser.js";
import { runRules } from "../runner.js";
import M4_001 from "../rules/M4-001.js";
import M4_002 from "../rules/M4-002.js";
import M4_003 from "../rules/M4-003.js";

function lintWith(rule: typeof M4_001, source: string) {
  const ast = parse(source);
  return runRules({
    source,
    ast,
    filePath: "test.md",
    rules: [rule],
    ruleSettings: { [rule.meta.id]: "error" },
  });
}

describe("M4-001: CRITICAL constraints in top 20%", () => {
  it("flags CRITICAL keyword below top 20%", () => {
    // 20 lines, top 20% = first 4 lines. Place CRITICAL at line 15.
    const lines = Array.from({ length: 20 }, (_, i) =>
      i === 14 ? "CRITICAL: Always validate input." : `Line ${i + 1} content.`
    );
    const source = lines.join("\n");
    const msgs = lintWith(M4_001, source);
    expect(msgs.length).toBeGreaterThan(0);
    expect(msgs[0].ruleId).toBe("M4-001");
  });

  it("does not flag CRITICAL keyword in top 20%", () => {
    const lines = Array.from({ length: 20 }, (_, i) =>
      i === 1 ? "CRITICAL: Always validate input." : `Line ${i + 1} content.`
    );
    const source = lines.join("\n");
    const msgs = lintWith(M4_001, source);
    expect(msgs).toHaveLength(0);
  });

  it("skips short files", () => {
    const source = `CRITICAL: important
Line 2
CRITICAL: also important`;
    const msgs = lintWith(M4_001, source);
    expect(msgs).toHaveLength(0);
  });
});

describe("M4-002: Token count limit", () => {
  it("flags files exceeding 8000 tokens", () => {
    // ~8000 tokens ≈ 32000 English chars
    const source = "a ".repeat(20000);
    const msgs = lintWith(M4_002, source);
    expect(msgs.length).toBeGreaterThan(0);
    expect(msgs[0].ruleId).toBe("M4-002");
  });

  it("does not flag short files", () => {
    const source = "Hello world. This is a short file.";
    const msgs = lintWith(M4_002, source);
    expect(msgs).toHaveLength(0);
  });
});

describe("M4-003: References in opening section", () => {
  it("flags references only outside top section", () => {
    // 20 lines, refs only at bottom
    const lines = Array.from({ length: 20 }, (_, i) => {
      if (i >= 15) return `See [doc](./doc${i}.md) for details.`;
      return `Line ${i + 1} content.`;
    });
    const source = lines.join("\n");
    const msgs = lintWith(M4_003, source);
    expect(msgs.length).toBeGreaterThan(0);
    expect(msgs[0].ruleId).toBe("M4-003");
  });

  it("does not flag when refs exist in top section", () => {
    const lines = Array.from({ length: 20 }, (_, i) => {
      if (i === 1) return `See [overview](./overview.md) for context.`;
      if (i >= 15) return `See [doc](./doc${i}.md) for details.`;
      return `Line ${i + 1} content.`;
    });
    const source = lines.join("\n");
    const msgs = lintWith(M4_003, source);
    expect(msgs).toHaveLength(0);
  });
});
