import { parse } from "./parser.js";
import { runRules } from "./runner.js";
import { createScorer } from "./scorer.js";
import { getAllRules } from "./registry.js";
import { registerAllRules } from "./rules/index.js";
import type { LintResult, LintConfig, RuleSetting } from "./types.js";

// Auto-register built-in rules on first import
let rulesRegistered = false;
function ensureRulesRegistered(): void {
  if (rulesRegistered) return;
  if (getAllRules().length === 0) {
    registerAllRules();
  }
  rulesRegistered = true;
}

export interface LintOptions extends Partial<LintConfig> {
  filePath?: string;
}

export async function lint(
  source: string,
  options: LintOptions = {},
): Promise<LintResult> {
  ensureRulesRegistered();

  const filePath = options.filePath ?? "";

  // 1. Parse Markdown → AST
  const ast = parse(source);

  // 2. Get all rules
  const rules = getAllRules();

  // 3. Merge rule settings: defaults (all "error") + user overrides
  const ruleSettings: Record<string, RuleSetting> = {};
  for (const rule of rules) {
    ruleSettings[rule.meta.id] = "error";
  }
  if (options.rules) {
    Object.assign(ruleSettings, options.rules);
  }

  // 4. Run rules
  const messages = runRules({
    source,
    ast,
    filePath,
    rules,
    ruleSettings,
  });

  // 5. Score
  const scorer = createScorer();
  const { score, rank } = scorer.calculate(messages);

  return {
    filePath,
    messages,
    score,
    rank,
  };
}
