import type { RuleModule } from "./types.js";

const allRules: RuleModule[] = [];

export function registerRule(rule: RuleModule): void {
  allRules.push(rule);
}

export function registerRules(rules: RuleModule[]): void {
  allRules.push(...rules);
}

export function getAllRules(): readonly RuleModule[] {
  return allRules;
}
