import Anthropic from "@anthropic-ai/sdk";
import type { LintResult } from "@context-lint/core";

const SYSTEM_PROMPT = `You are an expert technical writer specializing in AI-readable context files (CLAUDE.md, DESIGN.md).
You receive a context file along with lint violations detected by context-lint.
Your job is to rewrite the file to fix the violations while preserving the author's intent and formatting style.

Rules:
- Fix only the issues listed in the violations. Do not add or remove content beyond what's needed.
- Preserve the original Markdown formatting (headings, tables, lists, code blocks).
- For ambiguous words: replace with specific, deterministic language.
- For contradictions: resolve by keeping the more specific/recent instruction.
- For duplications: consolidate into a single authoritative section.
- For Lost in the Middle issues: move critical constraints toward the top.
- Output ONLY the fixed file content, no explanations or markdown fences.`;

export interface AiFixOptions {
  apiKey: string;
  model?: string;
}

export async function generateAiFix(
  source: string,
  result: LintResult,
  options: AiFixOptions,
): Promise<string> {
  const client = new Anthropic({ apiKey: options.apiKey });

  const violationSummary = result.messages
    .map((m) => `- [${m.ruleId}] Line ${m.line}: ${m.message}`)
    .join("\n");

  const response = await client.messages.create({
    model: options.model ?? "claude-sonnet-4-20250514",
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `## File: ${result.filePath || "context.md"}

## Violations (${result.messages.length} issues, score: ${result.score}/100)

${violationSummary}

## File Content

${source}`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("AI did not return a text response");
  }

  return textBlock.text;
}

/**
 * Resolve the Anthropic API key from:
 * 1. ANTHROPIC_API_KEY environment variable
 * 2. CONTEXT_LINT_AI_KEY environment variable
 */
export function resolveApiKey(): string | null {
  return process.env.ANTHROPIC_API_KEY ?? process.env.CONTEXT_LINT_AI_KEY ?? null;
}
