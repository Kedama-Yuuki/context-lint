import type { RuleModule } from "../types.js";

/**
 * M3-001: Ambiguous words must not be used.
 *
 * Checks for vague/ambiguous terms in both English and Japanese
 * that AI agents cannot interpret deterministically.
 *
 * Migrated from L4-001.
 */

const AMBIGUOUS_WORDS_EN = [
  "appropriate", "as needed", "as necessary", "if necessary",
  "suitable", "proper", "reasonable", "adequate",
  "etc", "and so on", "and more", "and others",
  "various", "several", "some", "many",
  "usually", "normally", "generally", "typically",
  "might", "perhaps", "possibly", "probably",
  "should be fine", "looks good", "seems right",
  "simple", "easy", "obvious", "straightforward",
  "similar", "like that", "something like",
];

const AMBIGUOUS_WORDS_JA = [
  "適切", "適宜", "必要に応じて", "場合によって",
  "など", "等", "〜等",
  "いくつか", "いろいろ", "さまざま", "様々",
  "通常", "一般的に", "基本的に", "普通は",
  "かもしれない", "おそらく", "たぶん",
  "よしなに", "いい感じ", "うまく",
  "簡単", "シンプル", "わかりやすい",
];

const rule: RuleModule = {
  meta: {
    id: "M3-001",
    severity: "high",
    category: "clarity",
    description: "Ambiguous words must not be used",
    fixable: false,
  },
  create(context) {
    return {
      root() {
        const lines = context.source.split("\n");
        let inCodeBlock = false;

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line.trimStart().startsWith("```")) {
            inCodeBlock = !inCodeBlock;
            continue;
          }
          if (inCodeBlock) continue;
          if (line.trimStart().startsWith("<!--")) continue;

          const lower = line.toLowerCase();

          for (const word of AMBIGUOUS_WORDS_EN) {
            const idx = lower.indexOf(word);
            if (idx !== -1) {
              context.report({
                loc: {
                  start: { line: i + 1, column: idx + 1 },
                  end: { line: i + 1, column: idx + word.length + 1 },
                },
                message: `Ambiguous word "${word}" found. Be specific instead.`,
              });
            }
          }

          for (const word of AMBIGUOUS_WORDS_JA) {
            const idx = line.indexOf(word);
            if (idx !== -1) {
              context.report({
                loc: {
                  start: { line: i + 1, column: idx + 1 },
                  end: { line: i + 1, column: idx + word.length + 1 },
                },
                message: `曖昧語「${word}」が使用されています。具体的に記述してください。`,
              });
            }
          }
        }
      },
    };
  },
};

export default rule;
