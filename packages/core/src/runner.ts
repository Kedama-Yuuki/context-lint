import { visit } from "unist-util-visit";
import type { Node } from "unist";
import type { Root } from "mdast";
import type {
  RuleModule,
  RuleContext,
  RuleVisitors,
  LintMessage,
  ReportDescriptor,
  RuleSetting,
} from "./types.js";

export interface RunOptions {
  source: string;
  ast: Root;
  filePath: string;
  rules: RuleModule[];
  ruleSettings: Record<string, RuleSetting>;
}

export function runRules(options: RunOptions): LintMessage[] {
  const { source, ast, filePath, rules, ruleSettings } = options;
  const messages: LintMessage[] = [];

  for (const rule of rules) {
    const setting = ruleSettings[rule.meta.id] ?? "error";
    if (setting === "off") continue;

    const ruleMessages: LintMessage[] = [];

    const context: RuleContext = {
      source,
      ast,
      filePath,
      report(descriptor: ReportDescriptor) {
        const pos = descriptor.node?.position ?? descriptor.loc;
        ruleMessages.push({
          ruleId: rule.meta.id,
          severity: rule.meta.severity,
          message: descriptor.message,
          line: pos?.start?.line ?? 0,
          column: pos?.start?.column ?? 0,
          endLine: pos?.end?.line,
          endColumn: pos?.end?.column,
          fix: descriptor.fix,
        });
      },
    };

    const visitors = rule.create(context);

    // Two kinds of visitors:
    // 1. Node-type visitors (e.g. "heading", "code", "table") — called via AST walk
    // 2. Special "root" visitor — called once with the root node for whole-document analysis
    for (const [nodeType, visitorFn] of Object.entries(visitors)) {
      if (nodeType === "root") {
        visitorFn(ast as unknown as Node);
      } else {
        visit(ast, nodeType, (node: Node) => {
          visitorFn(node);
        });
      }
    }

    messages.push(...ruleMessages);
  }

  // Sort by line number
  messages.sort((a, b) => a.line - b.line || a.column - b.column);
  return messages;
}
