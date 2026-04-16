import { describe, it, expect } from "vitest";
import { parse } from "../parser.js";
import { runRules } from "../runner.js";
import M1_001 from "../rules/M1-001.js";
import M1_002 from "../rules/M1-002.js";
import M1_003 from "../rules/M1-003.js";

function lintWith(rule: typeof M1_001, source: string) {
  const ast = parse(source);
  return runRules({
    source,
    ast,
    filePath: "test.md",
    rules: [rule],
    ruleSettings: { [rule.meta.id]: "error" },
  });
}

describe("M1-001: Conflicting token values", () => {
  it("flags same token name with different values", () => {
    const source = `# Tokens
| Name | Value |
| --- | --- |
| color-primary | #1a73e8 |

## Overrides
| Name | Value |
| --- | --- |
| color-primary | #ff0000 |`;
    const msgs = lintWith(M1_001, source);
    expect(msgs.length).toBeGreaterThan(0);
    expect(msgs[0].ruleId).toBe("M1-001");
  });

  it("does not flag same token with same value", () => {
    const source = `# Tokens
| Name | Value |
| --- | --- |
| color-primary | #1a73e8 |

## Aliases
| Name | Value |
| --- | --- |
| color-primary | #1a73e8 |`;
    const msgs = lintWith(M1_001, source);
    expect(msgs).toHaveLength(0);
  });

  it("ignores header rows", () => {
    const source = `| Name | Value |
| --- | --- |
| color-a | #111 |`;
    const msgs = lintWith(M1_001, source);
    expect(msgs).toHaveLength(0);
  });
});

describe("M1-002: Contradictory constraints", () => {
  it("flags always/never contradiction on same subject", () => {
    const source = `Always use TypeScript for components.
Never use TypeScript for components.`;
    const msgs = lintWith(M1_002, source);
    expect(msgs.length).toBeGreaterThan(0);
    expect(msgs[0].ruleId).toBe("M1-002");
  });

  it("does not flag unrelated instructions", () => {
    const source = `Always write tests before merging.
Never deploy on Friday afternoons.`;
    const msgs = lintWith(M1_002, source);
    expect(msgs).toHaveLength(0);
  });

  it("skips code blocks", () => {
    const source = `\`\`\`
Always use TypeScript.
Never use TypeScript.
\`\`\``;
    const msgs = lintWith(M1_002, source);
    expect(msgs).toHaveLength(0);
  });
});

describe("M1-003: File path references", () => {
  it("flags file paths in prose", () => {
    const source = `See the config at ./src/config.ts for details.`;
    const msgs = lintWith(M1_003, source);
    expect(msgs.length).toBeGreaterThan(0);
    expect(msgs[0].ruleId).toBe("M1-003");
  });

  it("does not flag paths inside code blocks", () => {
    const source = `\`\`\`
./src/config.ts
\`\`\``;
    const msgs = lintWith(M1_003, source);
    expect(msgs).toHaveLength(0);
  });

  it("flags CLI command references", () => {
    const source = `Run \`npm run build\` to compile.`;
    const msgs = lintWith(M1_003, source);
    expect(msgs.length).toBeGreaterThan(0);
  });

  it("does not flag Markdown blockquotes as commands", () => {
    const source = `> The linter for AI-readable context.
>
> Kedama — 2026`;
    const msgs = lintWith(M1_003, source);
    expect(msgs).toHaveLength(0);
  });

  it("does not flag table separator rows", () => {
    const source = `| Name | Value |
| --- | --- |
| color | #fff |`;
    const msgs = lintWith(M1_003, source);
    expect(msgs).toHaveLength(0);
  });

  it("flags $ shell prompt lines", () => {
    const source = `$ npx context-lint ./CLAUDE.md`;
    const msgs = lintWith(M1_003, source);
    expect(msgs.length).toBeGreaterThan(0);
  });
});
