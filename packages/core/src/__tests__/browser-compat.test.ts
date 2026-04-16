import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

/**
 * Browser compatibility test.
 *
 * Ensures packages/core does not import Node.js built-in modules,
 * keeping it usable in browser/Figma plugin environments.
 */
describe("browser compatibility", () => {
  const NODE_BUILTINS = [
    "fs", "path", "os", "child_process", "crypto", "http", "https",
    "net", "stream", "url", "util", "assert", "buffer", "events",
    "process", "querystring", "readline", "tls", "zlib",
    "node:fs", "node:path", "node:os", "node:child_process",
    "node:crypto", "node:http", "node:https",
  ];

  it("core source files do not import Node.js builtins", () => {
    const coreDir = path.resolve(__dirname, "..");
    const violations: string[] = [];

    function scanDir(dir: string) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name === "__tests__" || entry.name === "node_modules") continue;
          scanDir(fullPath);
        } else if (entry.name.endsWith(".ts") && !entry.name.endsWith(".test.ts")) {
          const content = fs.readFileSync(fullPath, "utf-8");
          for (const builtin of NODE_BUILTINS) {
            // Check for import statements
            const importPattern = new RegExp(
              `(?:from\\s+["']${builtin.replace("/", "\\/")}["']|require\\(["']${builtin.replace("/", "\\/")}["']\\))`,
            );
            if (importPattern.test(content)) {
              violations.push(`${path.relative(coreDir, fullPath)}: imports "${builtin}"`);
            }
          }
        }
      }
    }

    scanDir(coreDir);

    if (violations.length > 0) {
      throw new Error(
        `Node.js built-in imports found in core package:\n${violations.join("\n")}`,
      );
    }
  });
});
