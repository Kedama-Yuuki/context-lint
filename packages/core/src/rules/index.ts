import { registerRules } from "../registry.js";
import type { RuleModule } from "../types.js";

// M1: Contradiction checks
import M1_001 from "./M1-001.js";
import M1_002 from "./M1-002.js";
import M1_003 from "./M1-003.js";

// M2: Duplication checks
import M2_001 from "./M2-001.js";
import M2_002 from "./M2-002.js";

// M3: Clarity checks
import M3_001 from "./M3-001.js";
import M3_002 from "./M3-002.js";
import M3_003 from "./M3-003.js";

// M4: Lost in the Middle checks
import M4_001 from "./M4-001.js";
import M4_002 from "./M4-002.js";
import M4_003 from "./M4-003.js";

/**
 * All built-in rules (M1-M4).
 * In V2, all rules apply to both design-md and claude-md presets.
 */
export const allBuiltinRules: RuleModule[] = [
  // M1: Contradiction
  M1_001, M1_002, M1_003,
  // M2: Duplication
  M2_001, M2_002,
  // M3: Clarity
  M3_001, M3_002, M3_003,
  // M4: Lost in the Middle
  M4_001, M4_002, M4_003,
];

export function registerAllRules(): void {
  registerRules(allBuiltinRules);
}
