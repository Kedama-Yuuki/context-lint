import type { RuleModule } from "../types.js";

/**
 * M4-001: CRITICAL constraints must appear in the top 20% of the file.
 *
 * AI models suffer from "Lost in the Middle" — they tend to miss information
 * buried in the middle of long documents. Important constraints (marked as
 * CRITICAL, IMPORTANT, MUST, etc.) should be placed near the top.
 */

const CRITICAL_MARKERS_EN = [
  /\bCRITICAL\b/,
  /\bIMPORTANT\b/,
  /\bMUST\b/,
  /\bREQUIRED\b/,
  /\bMANDATORY\b/,
];

const CRITICAL_MARKERS_JA = [
  /必須/,
  /重要/,
  /絶対/,
  /厳守/,
];

const TOP_RATIO = 0.2;

const rule: RuleModule = {
  meta: {
    id: "M4-001",
    severity: "high",
    category: "lost-in-middle",
    description: "CRITICAL constraints must appear in the top 20% of the file",
    fixable: false,
  },
  create(context) {
    return {
      root() {
        const lines = context.source.split("\n");
        const totalLines = lines.length;

        // For very short files, skip this check
        if (totalLines < 10) return;

        const topBoundary = Math.ceil(totalLines * TOP_RATIO);
        let inCodeBlock = false;

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line.trimStart().startsWith("```")) {
            inCodeBlock = !inCodeBlock;
            continue;
          }
          if (inCodeBlock) continue;

          // Only flag constraints found BELOW the top 20%
          if (i < topBoundary) continue;

          const allMarkers = [...CRITICAL_MARKERS_EN, ...CRITICAL_MARKERS_JA];
          for (const marker of allMarkers) {
            const match = line.match(marker);
            if (match) {
              context.report({
                loc: {
                  start: { line: i + 1, column: (match.index ?? 0) + 1 },
                  end: { line: i + 1, column: (match.index ?? 0) + match[0].length + 1 },
                },
                message: `Critical constraint "${match[0]}" found at line ${i + 1} (below top ${TOP_RATIO * 100}%). Move important constraints to the beginning of the file.`,
              });
              break; // One report per line
            }
          }
        }
      },
    };
  },
};

export default rule;
