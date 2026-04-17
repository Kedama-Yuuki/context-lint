import type { RuleModule } from "../types.js";

/**
 * M4-002: File token count must be within the recommended limit (8,000 tokens).
 *
 * AI models suffer from "Lost in the Middle" — they tend to miss information
 * in the middle of long documents. Keeping context files concise helps ensure
 * all content is processed effectively.
 *
 * Token estimation: ~4 characters per token for English, ~2 characters per
 * token for CJK (conservative approximation without a full tokenizer).
 */

const TOKEN_LIMIT = 8000;

const rule: RuleModule = {
  meta: {
    id: "M4-002",
    severity: "medium",
    category: "lost-in-middle",
    description: "File token count must be within the recommended limit (8,000 tokens)",
    fixable: false,
  },
  create(context) {
    return {
      root() {
        const estimatedTokens = estimateTokenCount(context.source);

        if (estimatedTokens > TOKEN_LIMIT) {
          context.report({
            loc: {
              start: { line: 1, column: 1 },
              end: { line: 1, column: 1 },
            },
            message: `File has ~${estimatedTokens.toLocaleString()} estimated tokens, exceeding the recommended limit of ${TOKEN_LIMIT.toLocaleString()}. Consider splitting into multiple files.`,
          });
        }
      },
    };
  },
};

/**
 * Estimate token count without a full tokenizer.
 * English text: ~4 chars/token. CJK text: ~1.5 chars/token (each character
 * is often its own token). Mixed content uses a weighted average.
 */
function estimateTokenCount(text: string): number {
  // Count CJK characters
  const cjkPattern = /[\u3000-\u9FFF\uF900-\uFAFF\uFF00-\uFFEF]/g;
  const cjkChars = (text.match(cjkPattern) || []).length;
  const nonCjkChars = text.length - cjkChars;

  // CJK: ~1.5 chars per token, Non-CJK: ~4 chars per token
  const cjkTokens = cjkChars / 1.5;
  const nonCjkTokens = nonCjkChars / 4;

  return Math.round(cjkTokens + nonCjkTokens);
}

export default rule;
