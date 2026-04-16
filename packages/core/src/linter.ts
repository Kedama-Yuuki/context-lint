import { parse } from "./parser.js";
import { runRules } from "./runner.js";
import { createScorer } from "./scorer.js";
import { getAllRules, getRulesForPreset } from "./registry.js";
import { detectPreset } from "./preset.js";
import { registerAllRules } from "./rules/index.js";
import type { LintResult, LintConfig, Preset, RuleSetting } from "./types.js";

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

  // 1. Determine preset
  const preset = resolvePreset(options.preset, filePath, source);

  // 2. Parse Markdown → AST
  const ast = parse(source);

  // 3. Get rules for this preset
  const rules = getRulesForPreset(preset);

  // 4. Merge rule settings: defaults (all "error") + user overrides
  const ruleSettings: Record<string, RuleSetting> = {};
  for (const rule of rules) {
    ruleSettings[rule.meta.id] = "error";
  }
  if (options.rules) {
    Object.assign(ruleSettings, options.rules);
  }

  // 5. Run rules
  const messages = runRules({
    source,
    ast,
    filePath,
    rules,
    ruleSettings,
  });

  // 6. Score
  const scorer = createScorer();
  const { score, rank } = scorer.calculate(messages);

  return {
    filePath,
    messages,
    score,
    rank,
  };
}

function resolvePreset(
  configPreset: LintConfig["preset"] | undefined,
  filePath: string,
  source: string,
): Preset {
  if (configPreset && configPreset !== "auto") {
    return configPreset;
  }
  return detectPreset(filePath, source);
}
