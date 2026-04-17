import type { RuleModule } from "../types.js";

/**
 * M3-002: Negative constraints should not be overused.
 *
 * AI tends to overlook negation. Detects excessive use of negative patterns
 * (don't, never, must not, etc.) and suggests rewriting with positive
 * instructions.
 *
 * Migrated from L4-002.
 */

const NEGATIVE_PATTERNS_EN = [
  /\bdon'?t\b/i,
  /\bdo not\b/i,
  /\bnever\b/i,
  /\bmust not\b/i,
  /\bshould not\b/i,
  /\bcannot\b/i,
  /\bcan'?t\b/i,
  /\bprohibited\b/i,
  /\bforbidden\b/i,
  /\bavoid\b/i,
  /\bnot allowed\b/i,
];

const NEGATIVE_PATTERNS_JA = [
  /してはいけない/,
  /しないでください/,
  /しないこと/,
  /禁止/,
  /不可/,
  /使わない/,
  /使用しない/,
  /避ける/,
  /NG/,
];

const THRESHOLD = 5;

const rule: RuleModule = {
  meta: {
    id: "M3-002",
    severity: "medium",
    category: "clarity",
    description: "Negative constraints should not be overused",
    fixable: false,
  },
  create(context) {
    return {
      root() {
        const lines = context.source.split("\n");
        let count = 0;
        let inCodeBlock = false;

        for (const line of lines) {
          if (line.trimStart().startsWith("```")) {
            inCodeBlock = !inCodeBlock;
            continue;
          }
          if (inCodeBlock) continue;

          for (const pattern of NEGATIVE_PATTERNS_EN) {
            if (pattern.test(line)) { count++; break; }
          }
          for (const pattern of NEGATIVE_PATTERNS_JA) {
            if (pattern.test(line)) { count++; break; }
          }
        }

        if (count >= THRESHOLD) {
          context.report({
            loc: {
              start: { line: 1, column: 1 },
              end: { line: 1, column: 1 },
            },
            message: `Excessive use of negative patterns (${count} occurrences). Prefer positive instructions.`,
          });
        }
      },
    };
  },
};

export default rule;
