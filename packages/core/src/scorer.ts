import type { LintMessage, LintResult } from "./types.js";

const SEVERITY_PENALTY = {
  critical: 20,
  high: 10,
  medium: 5,
  low: 2,
} as const;

export function createScorer() {
  return {
    calculate(messages: LintMessage[]): Pick<LintResult, "score" | "rank"> {
      const totalPenalty = messages.reduce(
        (sum, msg) => sum + SEVERITY_PENALTY[msg.severity],
        0,
      );
      const score = Math.max(0, 100 - totalPenalty);
      return { score, rank: getRank(score) };
    },
  };
}

function getRank(score: number): LintResult["rank"] {
  if (score >= 90) return "AI-Ready";
  if (score >= 70) return "Mostly Ready";
  if (score >= 50) return "Needs Work";
  return "Not AI-Ready";
}
