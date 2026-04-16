import type { LintResult, LintMessage, Severity } from "./types.js";

const SEVERITY_SYMBOLS: Record<Severity, string> = {
  critical: "\u2716",
  high: "\u2716",
  medium: "\u26A0",
  low: "\u2139",
};

const SEVERITY_LABELS: Record<Severity, string> = {
  critical: "CRITICAL",
  high: "HIGH",
  medium: "MEDIUM",
  low: "LOW",
};

export function formatText(result: LintResult): string {
  const lines: string[] = [];

  if (result.filePath) {
    lines.push(result.filePath);
  }

  if (result.messages.length === 0) {
    lines.push("  No issues found. Your file is AI-Ready!");
    lines.push("");
    lines.push(`  Score: ${result.score}/100 (${result.rank})`);
    return lines.join("\n");
  }

  for (const msg of result.messages) {
    lines.push(formatMessage(msg));
  }

  lines.push("");
  lines.push(
    `  ${result.messages.length} problem(s) found`,
  );
  lines.push(`  Score: ${result.score}/100 (${result.rank})`);

  return lines.join("\n");
}

function formatMessage(msg: LintMessage): string {
  const symbol = SEVERITY_SYMBOLS[msg.severity];
  const label = SEVERITY_LABELS[msg.severity];
  const location = `${msg.line}:${msg.column}`;
  return `  ${location}  ${symbol} [${label}] ${msg.message}  (${msg.ruleId})`;
}

export function formatJson(result: LintResult): string {
  return JSON.stringify(result, null, 2);
}
