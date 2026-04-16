import { describe, it, expect } from "vitest";
import { parse } from "../parser.js";
import { runRules } from "../runner.js";
import type { RuleModule } from "../types.js";

const mockRule: RuleModule = {
  meta: {
    id: "test-001",
    severity: "high",
    category: "clarity",
    description: "Test rule",
    fixable: false,
    presets: ["design-md"],
  },
  create(context) {
    return {
      heading(node) {
        context.report({ node, message: "Found a heading" });
      },
    };
  },
};

const wholeDocRule: RuleModule = {
  meta: {
    id: "test-002",
    severity: "medium",
    category: "clarity",
    description: "Whole-doc rule",
    fixable: false,
    presets: ["design-md"],
  },
  create(context) {
    return {
      root() {
        if (!context.source.includes("# ")) {
          context.report({ message: "No headings in document" });
        }
      },
    };
  },
};

describe("runRules", () => {
  it("calls node-type visitors and collects messages", () => {
    const source = "# Hello\n\n## World";
    const ast = parse(source);
    const messages = runRules({
      source,
      ast,
      filePath: "test.md",
      rules: [mockRule],
      ruleSettings: { "test-001": "error" },
    });
    expect(messages).toHaveLength(2);
    expect(messages[0].ruleId).toBe("test-001");
    expect(messages[0].line).toBe(1);
    expect(messages[1].line).toBe(3);
  });

  it("skips rules set to off", () => {
    const source = "# Hello";
    const ast = parse(source);
    const messages = runRules({
      source,
      ast,
      filePath: "test.md",
      rules: [mockRule],
      ruleSettings: { "test-001": "off" },
    });
    expect(messages).toHaveLength(0);
  });

  it("supports root visitor for whole-document analysis", () => {
    const source = "No headings here";
    const ast = parse(source);
    const messages = runRules({
      source,
      ast,
      filePath: "test.md",
      rules: [wholeDocRule],
      ruleSettings: { "test-002": "error" },
    });
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toBe("No headings in document");
  });

  it("returns no messages for root visitor when condition passes", () => {
    const source = "# Has heading";
    const ast = parse(source);
    const messages = runRules({
      source,
      ast,
      filePath: "test.md",
      rules: [wholeDocRule],
      ruleSettings: { "test-002": "error" },
    });
    expect(messages).toHaveLength(0);
  });
});
