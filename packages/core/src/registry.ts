import type { RuleModule, Preset } from "./types.js";

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

export function getRulesForPreset(preset: Preset): RuleModule[] {
  return allRules.filter((rule) => rule.meta.presets.includes(preset));
}
