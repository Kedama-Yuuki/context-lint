// Main API
export { lint } from "./linter.js";
export type { LintOptions } from "./linter.js";

// Scoring
export { createScorer } from "./scorer.js";

// Fixer
export { applyFixes } from "./fixer.js";
export type { FixResult } from "./fixer.js";

// Reporting
export { formatText, formatJson } from "./reporter.js";

// Parser
export { parse } from "./parser.js";

// Rule system
export { registerRule, registerRules, getAllRules } from "./registry.js";

// i18n
export { initI18n, t } from "./i18n/index.js";

// Types
export type {
  RuleModule,
  RuleContext,
  RuleVisitors,
  ReportDescriptor,
  RuleMeta,
  FixSuggestion,
  LintResult,
  LintMessage,
  LintConfig,
  Severity,
  RuleSetting,
  Rank,
} from "./types.js";
