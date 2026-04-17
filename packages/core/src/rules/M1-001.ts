import type { RuleModule } from "../types.js";

/**
 * M1-001: Same token/variable name must not have different values across definitions.
 *
 * Extracts all name-value definitions (from tables, key-value pairs) and flags
 * when the same name appears with conflicting values.
 */
const rule: RuleModule = {
  meta: {
    id: "M1-001",
    severity: "critical",
    category: "contradiction",
    description: "Same token/variable name must not have different values across definitions",
    fixable: false,
  },
  create(context) {
    return {
      root() {
        const lines = context.source.split("\n");
        const definitions = new Map<string, Array<{ value: string; line: number }>>();
        let inCodeBlock = false;

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line.trimStart().startsWith("```")) {
            inCodeBlock = !inCodeBlock;
            continue;
          }
          if (inCodeBlock) continue;

          // Parse table rows
          if (line.includes("|")) {
            const cells = line.split("|").map((c) => c.trim()).filter(Boolean);
            if (cells.length >= 2) {
              const name = cells[0];
              const value = cells[1];

              if (name.startsWith("-") || !value || value.startsWith("-")) continue;
              if (isHeaderRow(name)) continue;

              const normalizedName = name.trim().toLowerCase();
              if (!definitions.has(normalizedName)) {
                definitions.set(normalizedName, []);
              }
              definitions.get(normalizedName)!.push({ value: value.trim(), line: i + 1 });
            }
          }

          // Parse key-value patterns (e.g. "token-name: value")
          const kvMatch = line.match(/^[\s-]*([a-zA-Z0-9_\-.]+)\s*:\s*(.+)/);
          if (kvMatch) {
            const name = kvMatch[1].trim().toLowerCase();
            const value = kvMatch[2].trim();
            if (value && !isMarkdownHeader(line)) {
              if (!definitions.has(name)) {
                definitions.set(name, []);
              }
              definitions.get(name)!.push({ value, line: i + 1 });
            }
          }
        }

        // Flag names with conflicting values
        for (const [name, entries] of definitions) {
          if (entries.length < 2) continue;

          const uniqueValues = new Set(entries.map((e) => e.value.toLowerCase()));
          if (uniqueValues.size > 1) {
            const locations = entries
              .map((e) => `line ${e.line}: "${e.value}"`)
              .join(", ");
            context.report({
              loc: {
                start: { line: entries[0].line, column: 1 },
                end: { line: entries[0].line, column: 1 },
              },
              message: `Conflicting values for "${name}": ${locations}.`,
            });
          }
        }
      },
    };
  },
};

function isHeaderRow(name: string): boolean {
  const lower = name.toLowerCase();
  return ["name", "token", "variable", "key", "property", "名前", "トークン", "変数"].includes(lower);
}

function isMarkdownHeader(line: string): boolean {
  return line.trimStart().startsWith("#");
}

export default rule;
