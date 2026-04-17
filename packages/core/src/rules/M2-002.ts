import type { RuleModule } from "../types.js";

/**
 * M2-002: Same concept must not be referred to by multiple different names.
 *
 * Detects when the same concept appears under different names within the
 * document (e.g., "primary-color" and "main-color", "spacing" and "gap").
 * Uses a built-in synonym dictionary for common design/engineering terms
 * in both English and Japanese.
 */

type SynonymGroup = string[];

const SYNONYM_GROUPS_EN: SynonymGroup[] = [
  ["primary", "main", "base"],
  ["secondary", "sub", "accent"],
  ["color", "colour"],
  ["spacing", "gap", "gutter"],
  ["padding", "inner-spacing"],
  ["margin", "outer-spacing"],
  ["font-size", "text-size", "type-size"],
  ["border-radius", "corner-radius", "radius"],
  ["background", "bg"],
  ["foreground", "fg"],
  ["disabled", "inactive"],
  ["error", "danger", "destructive"],
  ["warning", "caution", "alert"],
  ["success", "positive", "confirm"],
  ["info", "information", "notice"],
  ["button", "btn"],
  ["container", "wrapper"],
  ["component", "widget"],
  ["header", "masthead", "top-bar"],
  ["footer", "bottom-bar"],
  ["sidebar", "side-panel", "drawer"],
  ["modal", "dialog", "popup"],
  ["tooltip", "popover"],
  ["input", "text-field", "text-input"],
  ["dropdown", "select", "combobox"],
  ["checkbox", "check-box"],
  ["toggle", "switch"],
  ["label", "caption"],
  ["small", "sm", "xs"],
  ["medium", "md"],
  ["large", "lg", "xl"],
];

const SYNONYM_GROUPS_JA: SynonymGroup[] = [
  ["メイン", "主要", "プライマリ"],
  ["サブ", "副", "セカンダリ"],
  ["余白", "スペーシング", "間隔"],
  ["角丸", "ボーダーラディウス"],
  ["ボタン", "ボタン"],
  ["ヘッダー", "ヘッダ"],
  ["フッター", "フッタ"],
  ["モーダル", "ダイアログ"],
  ["エラー", "危険"],
  ["警告", "注意"],
  ["成功", "完了"],
];

interface TokenDef {
  name: string;
  normalizedName: string;
  line: number;
}

const rule: RuleModule = {
  meta: {
    id: "M2-002",
    severity: "medium",
    category: "duplication",
    description: "Same concept must not be referred to by multiple different names",
    fixable: false,
  },
  create(context) {
    return {
      root() {
        const tokens = extractTokenNames(context.source);

        // Check each pair of tokens against synonym groups
        const allGroups = [...SYNONYM_GROUPS_EN, ...SYNONYM_GROUPS_JA];
        const reported = new Set<string>();

        for (let i = 0; i < tokens.length; i++) {
          for (let j = i + 1; j < tokens.length; j++) {
            const a = tokens[i];
            const b = tokens[j];
            if (a.normalizedName === b.normalizedName) continue;

            const key = [a.normalizedName, b.normalizedName].sort().join("|");
            if (reported.has(key)) continue;

            if (areSynonyms(a.normalizedName, b.normalizedName, allGroups)) {
              reported.add(key);
              context.report({
                loc: {
                  start: { line: b.line, column: 1 },
                  end: { line: b.line, column: 1 },
                },
                message: `"${b.name}" (line ${b.line}) may refer to the same concept as "${a.name}" (line ${a.line}). Use a consistent name.`,
              });
            }
          }
        }
      },
    };
  },
};

function extractTokenNames(source: string): TokenDef[] {
  const lines = source.split("\n");
  const tokens: TokenDef[] = [];
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trimStart().startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    // Extract from table rows
    if (line.includes("|")) {
      const cells = line.split("|").map((c) => c.trim()).filter(Boolean);
      if (cells.length >= 2 && !cells[0].startsWith("-") && !isHeaderRow(cells[0])) {
        tokens.push({
          name: cells[0],
          normalizedName: normalizeName(cells[0]),
          line: i + 1,
        });
      }
    }

    // Extract from key-value patterns
    const kvMatch = line.match(/^[\s-]*([a-zA-Z0-9_\-.]+)\s*:/);
    if (kvMatch && !line.trimStart().startsWith("#")) {
      tokens.push({
        name: kvMatch[1],
        normalizedName: normalizeName(kvMatch[1]),
        line: i + 1,
      });
    }
  }

  return tokens;
}

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[-_.\s]+/g, "-").trim();
}

function areSynonyms(a: string, b: string, groups: SynonymGroup[]): boolean {
  const partsA = a.split("-").filter(Boolean);
  const partsB = b.split("-").filter(Boolean);

  for (const group of groups) {
    const lowerGroup = group.map((s) => s.toLowerCase());
    for (const partA of partsA) {
      for (const partB of partsB) {
        if (partA === partB) continue;
        if (lowerGroup.includes(partA) && lowerGroup.includes(partB)) {
          return true;
        }
      }
    }
  }

  return false;
}

function isHeaderRow(name: string): boolean {
  const lower = name.toLowerCase();
  return ["name", "token", "variable", "key", "property", "名前", "トークン", "変数"].includes(lower);
}

export default rule;
