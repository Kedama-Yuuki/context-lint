import type { RuleModule } from "../types.js";

/**
 * M4-003: Important references should be consolidated in the opening section.
 *
 * File references (links to other documents, paths, URLs) scattered throughout
 * a long document risk being missed by AI. Important references should be
 * summarized near the top.
 */

const REFERENCE_PATTERNS = [
  // Markdown links
  /\[([^\]]+)\]\(([^)]+)\)/g,
  // File path references
  /(?:see|refer to|参照|参考)\s+[`"]?([a-zA-Z0-9_\-./]+\.[a-zA-Z]{1,10})[`"]?/gi,
  // @-prefixed file references (common in CLAUDE.md)
  /@([a-zA-Z0-9_\-./]+\.[a-zA-Z]{1,10})/g,
];

const TOP_RATIO = 0.2;
const REF_THRESHOLD = 3; // Only flag if there are enough references outside top section

const rule: RuleModule = {
  meta: {
    id: "M4-003",
    severity: "low",
    category: "lost-in-middle",
    description: "Important references should be consolidated in the opening section",
    fixable: false,
    presets: ["design-md", "claude-md"],
  },
  create(context) {
    return {
      root() {
        const lines = context.source.split("\n");
        const totalLines = lines.length;

        if (totalLines < 10) return;

        const topBoundary = Math.ceil(totalLines * TOP_RATIO);
        let inCodeBlock = false;
        let refsInTop = 0;
        let refsOutside = 0;
        const outsideRefs: Array<{ ref: string; line: number }> = [];

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line.trimStart().startsWith("```")) {
            inCodeBlock = !inCodeBlock;
            continue;
          }
          if (inCodeBlock) continue;

          for (const pattern of REFERENCE_PATTERNS) {
            // Reset lastIndex for global patterns
            pattern.lastIndex = 0;
            let match;
            while ((match = pattern.exec(line)) !== null) {
              if (i < topBoundary) {
                refsInTop++;
              } else {
                refsOutside++;
                outsideRefs.push({
                  ref: match[1] || match[2] || match[0],
                  line: i + 1,
                });
              }
            }
          }
        }

        // Only report if there are significant references outside the top section
        // and few or no references in the top section
        if (refsOutside >= REF_THRESHOLD && refsInTop === 0) {
          context.report({
            loc: {
              start: { line: 1, column: 1 },
              end: { line: 1, column: 1 },
            },
            message: `${refsOutside} file references found outside the top ${TOP_RATIO * 100}% of the file, but none in the opening section. Consider adding a reference summary at the top.`,
          });
        }
      },
    };
  },
};

export default rule;
