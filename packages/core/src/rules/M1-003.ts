import type { RuleModule } from "../types.js";

/**
 * M1-003: Referenced file paths must actually exist.
 *
 * Extracts file paths and command examples from the document and flags
 * unverifiable references. Since the core is browser-compatible and cannot
 * check the filesystem, this flags them as "unverifiable" rather than
 * "nonexistent".
 *
 * Migrated from C1-002, now applies to all presets.
 */

const PATH_PATTERNS = [
  // Unix-style paths
  /(?:^|\s|`)((?:\.{1,2}\/|~\/|\/)[a-zA-Z0-9_\-./]+\.[a-zA-Z]{1,10})/,
  // Backtick-wrapped paths
  /`((?:\.{1,2}\/|~\/|\/)[a-zA-Z0-9_\-./]+)`/,
  // Windows paths
  /`?([A-Z]:\\[a-zA-Z0-9_\-\\./]+)`?/,
];

const COMMAND_PATTERNS = [
  // Shell commands after $ prompt (not > which is Markdown blockquote)
  /^\s*\$\s+(.+)/,
  // Common CLI commands in backticks
  /(?:^|\s)`((?:npm|npx|pnpm|yarn|pip|cargo|go|git|curl|wget|docker|kubectl)\s+[^`]+)`/,
  // Run/exec patterns
  /(?:run|execute|実行)\s+`([^`]+)`/i,
];

const rule: RuleModule = {
  meta: {
    id: "M1-003",
    severity: "high",
    category: "contradiction",
    description: "Referenced file paths must actually exist",
    fixable: false,
    presets: ["design-md", "claude-md"],
  },
  create(context) {
    return {
      root() {
        const lines = context.source.split("\n");
        let inCodeBlock = false;

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line.trimStart().startsWith("```")) {
            inCodeBlock = !inCodeBlock;
            continue;
          }
          if (inCodeBlock) continue;
          // Skip Markdown blockquotes, HTML comments, and table separator rows
          const trimmed = line.trimStart();
          if (trimmed.startsWith(">")) continue;
          if (trimmed.startsWith("<!--")) continue;
          if (/^\|?\s*[-:]+\s*\|/.test(line)) continue;

          // Check for file paths
          for (const pattern of PATH_PATTERNS) {
            const match = line.match(pattern);
            if (match && match[1]) {
              const path = match[1];
              if (path.includes("://")) continue;
              if (path.length < 5) continue;

              context.report({
                loc: {
                  start: { line: i + 1, column: (match.index ?? 0) + 1 },
                  end: { line: i + 1, column: (match.index ?? 0) + match[0].length + 1 },
                },
                message: `File path "${path}" may not exist. Ensure referenced paths are valid.`,
              });
            }
          }

          // Check for command examples
          for (const pattern of COMMAND_PATTERNS) {
            const match = line.match(pattern);
            if (match && match[1]) {
              const cmd = match[1].trim();
              if (cmd.length < 3) continue;

              context.report({
                loc: {
                  start: { line: i + 1, column: (match.index ?? 0) + 1 },
                  end: { line: i + 1, column: (match.index ?? 0) + match[0].length + 1 },
                },
                message: `Command "${cmd.slice(0, 60)}" referenced. Ensure this command is valid.`,
              });
            }
          }
        }
      },
    };
  },
};

export default rule;
