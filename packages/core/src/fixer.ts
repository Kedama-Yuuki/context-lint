import type { LintMessage, FixSuggestion } from "./types.js";

export interface FixResult {
  /** The fixed source text */
  output: string;
  /** Number of fixes applied */
  fixCount: number;
}

/**
 * Apply fix suggestions to source text.
 * Fixes are applied in reverse order (bottom-to-top) to preserve line/column
 * positions of earlier fixes.
 */
export function applyFixes(source: string, messages: LintMessage[]): FixResult {
  const fixable = messages.filter((m) => m.fix != null);
  if (fixable.length === 0) {
    return { output: source, fixCount: 0 };
  }

  // Sort fixes bottom-to-top, right-to-left so earlier positions remain valid
  const sorted = [...fixable].sort((a, b) => {
    const fa = a.fix!;
    const fb = b.fix!;
    if (fb.range.startLine !== fa.range.startLine) {
      return fb.range.startLine - fa.range.startLine;
    }
    return fb.range.startColumn - fa.range.startColumn;
  });

  const lines = source.split("\n");
  let fixCount = 0;

  for (const msg of sorted) {
    const fix = msg.fix!;
    if (!applyOneFix(lines, fix)) continue;
    fixCount++;
  }

  return { output: lines.join("\n"), fixCount };
}

/**
 * Apply a single fix to the lines array (mutates in place).
 * Returns true if applied, false if range is invalid.
 */
function applyOneFix(lines: string[], fix: FixSuggestion): boolean {
  const { startLine, startColumn, endLine, endColumn } = fix.range;

  // Convert to 0-based
  const sl = startLine - 1;
  const el = endLine - 1;
  if (sl < 0 || el >= lines.length) return false;

  const sc = startColumn - 1;
  const ec = endColumn - 1;

  if (sl === el) {
    // Single-line fix
    const line = lines[sl];
    lines[sl] = line.slice(0, sc) + fix.text + line.slice(ec);
  } else {
    // Multi-line fix
    const before = lines[sl].slice(0, sc);
    const after = lines[el].slice(ec);
    const replacement = before + fix.text + after;
    lines.splice(sl, el - sl + 1, replacement);
  }

  return true;
}
