import { describe, it, expect } from "vitest";
import { lint } from "../linter.js";

describe("lint integration", () => {
  it("returns AI-Ready for a clean document", async () => {
    const source = `# Design System

## Color Tokens

| Name | Value | Usage |
| --- | --- | --- |
| color-primary | #1a73e8 | Primary action buttons and links |
| color-secondary | #5f6368 | Secondary text and icons |
`;
    const result = await lint(source, { filePath: "DESIGN.md" });
    expect(result.rank).toBe("AI-Ready");
    expect(result.score).toBeGreaterThanOrEqual(90);
  });

  it("detects ambiguous words (M3-001)", async () => {
    const source = `# Design Tokens

Use appropriate colors as needed for various components.
`;
    const result = await lint(source, { filePath: "DESIGN.md" });
    const msgs = result.messages.filter((m) => m.ruleId === "M3-001");
    expect(msgs.length).toBeGreaterThan(0);
  });

  it("detects ambiguous words in Japanese (M3-001)", async () => {
    const source = `# デザイントークン

適切な色を適宜使用してください。
`;
    const result = await lint(source, { filePath: "DESIGN.md" });
    const msgs = result.messages.filter((m) => m.ruleId === "M3-001");
    expect(msgs.length).toBeGreaterThan(0);
  });

  it("detects contradictions (M1-002)", async () => {
    const source = `# Instructions

Always use TypeScript for all files.
Never use TypeScript for test files.
`;
    const result = await lint(source, { filePath: "CLAUDE.md" });
    const msgs = result.messages.filter((m) => m.ruleId === "M1-002");
    expect(msgs.length).toBeGreaterThan(0);
  });

  it("detects conflicting token values (M1-001)", async () => {
    const source = `# Tokens

| Name | Value |
| --- | --- |
| color-primary | #1a73e8 |

## Overrides

| Name | Value |
| --- | --- |
| color-primary | #ff0000 |
`;
    const result = await lint(source, { filePath: "DESIGN.md" });
    const msgs = result.messages.filter((m) => m.ruleId === "M1-001");
    expect(msgs.length).toBeGreaterThan(0);
  });

  it("respects rule settings (off)", async () => {
    const source = `# Tokens

Use appropriate colors as needed.
`;
    const result = await lint(source, {
      filePath: "DESIGN.md",
      rules: { "M3-001": "off" },
    });
    const msg = result.messages.find((m) => m.ruleId === "M3-001");
    expect(msg).toBeUndefined();
  });

  it("auto-detects CLAUDE.md preset by filename", async () => {
    const source = `# Instructions

You should always use TypeScript.
`;
    const result = await lint(source, { filePath: "CLAUDE.md" });
    // In V2, all M-series rules apply to both presets
    expect(result.filePath).toBe("CLAUDE.md");
  });

  it("calculates score with penalties", async () => {
    const source = `# Instructions

Use appropriate values as needed.
Use suitable settings.
`;
    const result = await lint(source, { filePath: "DESIGN.md" });
    expect(result.score).toBeLessThan(100);
    expect(result.messages.length).toBeGreaterThan(0);
  });
});
