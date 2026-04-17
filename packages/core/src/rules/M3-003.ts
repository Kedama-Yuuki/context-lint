import type { RuleModule } from "../types.js";

/**
 * M3-003: Values must have explicit units or types (e.g., 8px not 8).
 *
 * Scans table cells and inline code for bare numeric values
 * that should have a unit (px, rem, em, %, pt, vw, vh, ms, s, etc.)
 * or type indicator.
 *
 * Migrated from L2-003. Severity changed from CRITICAL to LOW per V2 spec.
 */
const rule: RuleModule = {
  meta: {
    id: "M3-003",
    severity: "low",
    category: "clarity",
    description: "Values must have explicit units or types (e.g., 8px not 8)",
    fixable: true,
  },
  create(context) {
    return {
      root() {
        const lines = context.source.split("\n");

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line.trimStart().startsWith("#") || line.trimStart().startsWith("<!--")) {
            continue;
          }

          const bareNumberPattern = /(?:^|\||\:)\s*(\d+(?:\.\d+)?)\s*(?:\||$)/g;
          let match;
          while ((match = bareNumberPattern.exec(line)) !== null) {
            const value = match[1];
            if (isLikelyUnitlessValid(value)) continue;

            if (isInTokenValueContext(line)) {
              context.report({
                loc: {
                  start: { line: i + 1, column: match.index + 1 },
                  end: { line: i + 1, column: match.index + match[0].length + 1 },
                },
                message: `Value "${value}" has no unit or type. Consider adding a unit (e.g., ${value}px).`,
              });
            }
          }
        }
      },
    };
  },
};

function isLikelyUnitlessValid(value: string): boolean {
  const num = parseFloat(value);
  if (num === 0 || num > 9999) return true;
  if (num === 1) return true;
  return false;
}

function isInTokenValueContext(line: string): boolean {
  const lower = line.toLowerCase();
  if (line.includes("|")) return true;
  if (/\w+\s*:\s*\d/.test(line)) return true;
  const sizeKeywords = [
    "size", "spacing", "padding", "margin", "width", "height",
    "radius", "border", "gap", "font", "line-height",
    "サイズ", "余白", "幅", "高さ",
  ];
  return sizeKeywords.some((k) => lower.includes(k));
}

export default rule;
