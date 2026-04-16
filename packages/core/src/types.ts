import type { Node, Position } from "unist";
import type { Root } from "mdast";

// --- Severity & Configuration ---

export type Severity = "critical" | "high" | "medium" | "low";
export type RuleCategory =
  | "contradiction"
  | "duplication"
  | "clarity"
  | "lost-in-middle";
export type RuleSetting = "off" | "warn" | "error";
export type Preset = "design-md" | "claude-md" | "tokens-json";

export interface LintConfig {
  preset: Preset | "auto";
  rules: Record<string, RuleSetting>;
  ignorePatterns: string[];
}

// --- Rule System ---

export interface RuleMeta {
  id: string;
  severity: Severity;
  category: RuleCategory;
  description: string;
  fixable: boolean;
  presets: Preset[];
}

export interface FixSuggestion {
  /** Range to replace (1-based line/column) */
  range: {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  };
  /** Replacement text */
  text: string;
}

export interface ReportDescriptor {
  node?: Node;
  loc?: Position;
  message: string;
  /** Optional fix suggestion for --fix */
  fix?: FixSuggestion;
}

export interface RuleContext {
  /** The full source text of the file */
  readonly source: string;
  /** The parsed AST root */
  readonly ast: Root;
  /** The file path (if available) */
  readonly filePath: string;
  /** Report a lint violation */
  report(descriptor: ReportDescriptor): void;
}

export interface RuleVisitors {
  [nodeType: string]: (node: Node) => void;
}

export interface RuleModule {
  meta: RuleMeta;
  create(context: RuleContext): RuleVisitors;
}

// --- Lint Results ---

export interface LintMessage {
  ruleId: string;
  severity: Severity;
  message: string;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
  fix?: FixSuggestion;
}

export type Rank = "AI-Ready" | "Mostly Ready" | "Needs Work" | "Not AI-Ready";

export interface LintResult {
  filePath: string;
  messages: LintMessage[];
  score: number;
  rank: Rank;
}
