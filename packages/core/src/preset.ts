import type { Preset } from "./types.js";

/**
 * Auto-detect the appropriate preset based on file name and content.
 *
 * Detection order:
 * 1. File name heuristics (highest priority)
 * 2. Content heuristics (fallback)
 */
export function detectPreset(filePath: string, source: string): Preset {
  const fileName = filePath.split("/").pop()?.toLowerCase() ?? "";

  // File name heuristics
  if (fileName === "design.md" || fileName.endsWith(".design.md")) {
    return "design-md";
  }
  if (
    fileName === "claude.md" ||
    fileName === ".claude" ||
    fileName === "agents.md" ||
    fileName.endsWith(".claude.md")
  ) {
    return "claude-md";
  }
  if (fileName.endsWith(".tokens.json") || fileName === "tokens.json") {
    return "tokens-json";
  }

  // Content heuristics
  return detectPresetFromContent(source);
}

function detectPresetFromContent(source: string): Preset {
  const lower = source.toLowerCase();

  // Design token signals
  const designSignals = [
    "color",
    "spacing",
    "font-size",
    "border-radius",
    "token",
    "component",
    "variant",
    "design system",
    "palette",
  ];
  const designScore = designSignals.filter((s) => lower.includes(s)).length;

  // Claude/agent instruction signals
  const agentSignals = [
    "you should",
    "you must",
    "always ",
    "never ",
    "when you",
    "do not",
    "prefer ",
    "avoid ",
    "instructions",
    "rules",
  ];
  const agentScore = agentSignals.filter((s) => lower.includes(s)).length;

  if (agentScore > designScore) return "claude-md";
  return "design-md";
}
