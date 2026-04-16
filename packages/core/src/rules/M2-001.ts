import type { RuleModule } from "../types.js";

/**
 * M2-001: Same content must not be duplicated across multiple sections.
 *
 * Uses text similarity analysis to detect when the same definition or
 * instruction appears in multiple sections, which wastes token budget
 * and increases contradiction risk.
 */

const SIMILARITY_THRESHOLD = 0.8;
const MIN_SECTION_LENGTH = 30; // Minimum chars to consider a section for comparison

interface Section {
  heading: string;
  content: string;
  startLine: number;
  endLine: number;
}

const rule: RuleModule = {
  meta: {
    id: "M2-001",
    severity: "medium",
    category: "duplication",
    description: "Same content must not be duplicated across multiple sections",
    fixable: false,
    presets: ["design-md", "claude-md"],
  },
  create(context) {
    return {
      root() {
        const sections = extractSections(context.source);

        // Compare each pair of sections for similarity
        for (let i = 0; i < sections.length; i++) {
          for (let j = i + 1; j < sections.length; j++) {
            const a = sections[i];
            const b = sections[j];

            if (a.content.length < MIN_SECTION_LENGTH || b.content.length < MIN_SECTION_LENGTH) {
              continue;
            }

            const similarity = computeSimilarity(a.content, b.content);
            if (similarity >= SIMILARITY_THRESHOLD) {
              context.report({
                loc: {
                  start: { line: b.startLine, column: 1 },
                  end: { line: b.startLine, column: 1 },
                },
                message: `Section "${b.heading}" is ${Math.round(similarity * 100)}% similar to "${a.heading}" (line ${a.startLine}). Consider consolidating.`,
              });
            }
          }
        }
      },
    };
  },
};

function extractSections(source: string): Section[] {
  const lines = source.split("\n");
  const sections: Section[] = [];
  let currentHeading = "(top)";
  let currentStart = 1;
  let contentLines: string[] = [];
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trimStart().startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      contentLines.push(line);
      continue;
    }

    const headingMatch = !inCodeBlock && line.match(/^#{1,3}\s+(.+)/);
    if (headingMatch) {
      // Save previous section
      if (contentLines.length > 0) {
        sections.push({
          heading: currentHeading,
          content: contentLines.join("\n").trim(),
          startLine: currentStart,
          endLine: i,
        });
      }
      currentHeading = headingMatch[1].trim();
      currentStart = i + 1;
      contentLines = [];
    } else {
      contentLines.push(line);
    }
  }

  // Save last section
  if (contentLines.length > 0) {
    sections.push({
      heading: currentHeading,
      content: contentLines.join("\n").trim(),
      startLine: currentStart,
      endLine: lines.length,
    });
  }

  return sections;
}

/**
 * Compute bigram-based similarity (Dice coefficient).
 * Lightweight and browser-compatible — no external dependencies.
 */
function computeSimilarity(a: string, b: string): number {
  const bigramsA = getBigrams(normalize(a));
  const bigramsB = getBigrams(normalize(b));

  if (bigramsA.size === 0 && bigramsB.size === 0) return 1;
  if (bigramsA.size === 0 || bigramsB.size === 0) return 0;

  let intersection = 0;
  for (const [bigram, countA] of bigramsA) {
    const countB = bigramsB.get(bigram) ?? 0;
    intersection += Math.min(countA, countB);
  }

  const totalA = [...bigramsA.values()].reduce((s, v) => s + v, 0);
  const totalB = [...bigramsB.values()].reduce((s, v) => s + v, 0);

  return (2 * intersection) / (totalA + totalB);
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function getBigrams(text: string): Map<string, number> {
  const bigrams = new Map<string, number>();
  for (let i = 0; i < text.length - 1; i++) {
    const bigram = text.substring(i, i + 2);
    bigrams.set(bigram, (bigrams.get(bigram) ?? 0) + 1);
  }
  return bigrams;
}

export default rule;
