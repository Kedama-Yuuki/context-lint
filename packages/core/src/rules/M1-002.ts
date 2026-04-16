import type { RuleModule } from "../types.js";

/**
 * M1-002: Contradictory positive/negative constraints must not coexist.
 *
 * Detects contradictory instruction pairs by scanning for antonym/negation
 * patterns. For example:
 *   - "Always use X" + "Never use X"
 *   - "You must do X" + "Do not do X"
 *
 * Migrated from C1-001, now applies to all presets.
 */

interface Instruction {
  text: string;
  line: number;
  polarity: "positive" | "negative";
  subject: string;
}

const POSITIVE_PREFIXES = [
  /\balways\s+/i,
  /\byou\s+(?:should|must)\s+/i,
  /\bprefer\s+/i,
  /\buse\s+/i,
  /\bensure\s+/i,
  /\b必ず/,
  /\b常に/,
  /\b使用する/,
  /\b推奨/,
];

const NEGATIVE_PREFIXES = [
  /\bnever\s+/i,
  /\bdo\s+not\s+/i,
  /\bdon'?t\s+/i,
  /\bavoid\s+/i,
  /\byou\s+(?:should|must)\s+not\s+/i,
  /\bshould\s+not\s+/i,
  /\bmust\s+not\s+/i,
  /\b使用しない/,
  /\b禁止/,
  /\b避ける/,
  /\bしてはいけない/,
  /\bしないでください/,
];

const rule: RuleModule = {
  meta: {
    id: "M1-002",
    severity: "high",
    category: "contradiction",
    description: "Contradictory positive/negative constraints must not coexist",
    fixable: false,
    presets: ["design-md", "claude-md"],
  },
  create(context) {
    return {
      root() {
        const lines = context.source.split("\n");
        const instructions: Instruction[] = [];
        let inCodeBlock = false;

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line.trimStart().startsWith("```")) {
            inCodeBlock = !inCodeBlock;
            continue;
          }
          if (inCodeBlock) continue;

          const parsed = parseInstruction(line, i + 1);
          if (parsed) instructions.push(parsed);
        }

        // Find contradictions: same subject, opposite polarity
        for (let i = 0; i < instructions.length; i++) {
          for (let j = i + 1; j < instructions.length; j++) {
            const a = instructions[i];
            const b = instructions[j];
            if (a.polarity === b.polarity) continue;

            if (subjectsOverlap(a.subject, b.subject)) {
              context.report({
                loc: {
                  start: { line: b.line, column: 1 },
                  end: { line: b.line, column: 1 },
                },
                message: `Potential contradiction detected: line ${a.line} ("${a.text.trim().slice(0, 50)}...") vs line ${b.line}.`,
              });
            }
          }
        }
      },
    };
  },
};

function parseInstruction(line: string, lineNum: number): Instruction | null {
  // Check negative patterns FIRST — "never use" should be negative, not positive via "use"
  for (const pattern of NEGATIVE_PREFIXES) {
    const match = line.match(pattern);
    if (match) {
      const after = line.slice(match.index! + match[0].length);
      const subject = extractSubject(after);
      if (subject) {
        return { text: line, line: lineNum, polarity: "negative", subject };
      }
    }
  }

  for (const pattern of POSITIVE_PREFIXES) {
    const match = line.match(pattern);
    if (match) {
      const after = line.slice(match.index! + match[0].length);
      const subject = extractSubject(after);
      if (subject) {
        return { text: line, line: lineNum, polarity: "positive", subject };
      }
    }
  }

  return null;
}

function extractSubject(text: string): string {
  return text
    .replace(/[^a-zA-Z0-9\u3000-\u9FFF\s]/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 4)
    .join(" ")
    .toLowerCase();
}

function subjectsOverlap(a: string, b: string): boolean {
  if (!a || !b) return false;
  const wordsA = new Set(a.split(/\s+/));
  const wordsB = new Set(b.split(/\s+/));

  let overlap = 0;
  for (const w of wordsA) {
    if (w.length >= 3 && wordsB.has(w)) overlap++;
  }

  return overlap >= 2;
}

export default rule;
