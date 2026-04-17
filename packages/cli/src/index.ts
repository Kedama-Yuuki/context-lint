import { parseArgs } from "node:util";
import fs from "node:fs";
import path from "node:path";
import { globby } from "globby";
import pc from "picocolors";
import { cosmiconfig } from "cosmiconfig";
import { lint, formatText, formatJson, initI18n, applyFixes } from "@context-lint/core";
import type { LintResult, RuleSetting } from "@context-lint/core";
import { generateAiFix, resolveApiKey } from "./ai-fix.js";

const VERSION = "0.1.0";

const HELP = `
${pc.bold("context-lint")} — The linter for AI-readable context files.

${pc.bold("Usage")}
  context-lint <files...>           Lint files
  context-lint init [--type <t>]    Generate template files
  context-lint --help               Show this help
  context-lint --version            Show version

${pc.bold("Options")}
  --format <text|json>    Output format (default: text)
  --locale <en|ja>        Override language
  --fix                   Apply rule-based auto-fixes
  --dry-run               Show fixes without applying (requires --fix)
  --ai-fix                Generate AI-powered fix suggestions (BYOK)
  --threshold <n>         Minimum score to pass (default: 0)
  --no-color              Disable colored output

${pc.bold("Examples")}
  context-lint CLAUDE.md
  context-lint CLAUDE.md DESIGN.md --format json
  context-lint init --type claude-md
`;

// ─── Argument parsing ───────────────────────────────────────────

interface CliOptions {
  files: string[];
  command: "lint" | "init";
  format: "text" | "json";
  locale?: string;
  fix: boolean;
  dryRun: boolean;
  aiFix: boolean;
  threshold: number;
  initType?: string;
}

function parseCliArgs(argv: string[]): CliOptions {
  const { values, positionals } = parseArgs({
    args: argv.slice(2),
    options: {
      help:      { type: "boolean", short: "h" },
      version:   { type: "boolean", short: "v" },
      format:    { type: "string",  short: "f" },
      locale:    { type: "string" },
      fix:       { type: "boolean" },
      "dry-run": { type: "boolean" },
      "ai-fix":  { type: "boolean" },
      threshold: { type: "string",  short: "t" },
      type:      { type: "string" },
    },
    allowPositionals: true,
    strict: false,
  });

  if (values.help) {
    console.log(HELP);
    process.exit(0);
  }
  if (values.version) {
    console.log(`context-lint v${VERSION}`);
    process.exit(0);
  }

  const command = positionals[0] === "init" ? "init" as const : "lint" as const;
  const files = command === "init" ? [] : positionals as string[];

  return {
    files,
    command,
    format: (values.format === "json" ? "json" : "text") as "text" | "json",
    locale: values.locale as string | undefined,
    fix: !!values.fix,
    dryRun: !!values["dry-run"],
    aiFix: !!values["ai-fix"],
    threshold: values.threshold ? parseInt(values.threshold as string, 10) : 0,
    initType: values.type as string | undefined,
  };
}

// ─── Config loading (cosmiconfig) ───────────────────────────────

interface FileConfig {
  rules?: Record<string, RuleSetting>;
  ignorePatterns?: string[];
}

async function loadConfig(cwd: string): Promise<FileConfig> {
  const explorer = cosmiconfig("context-lint", {
    searchPlaces: [
      ".context-lint.config.json",
      ".context-lint.config.yaml",
      ".context-lint.config.yml",
      ".context-lint.config.js",
      ".context-lint.config.cjs",
      ".context-lint.config.mjs",
    ],
  });
  try {
    const result = await explorer.search(cwd);
    if (result && !result.isEmpty) {
      return result.config as FileConfig;
    }
  } catch {
    // Config file not found or invalid — use defaults
  }
  return {};
}

// ─── Init command ───────────────────────────────────────────────

const CLAUDE_MD_TEMPLATE = `# Project Instructions

## Overview

<!-- Describe the project's purpose and tech stack -->

## Build & Test

<!-- Commands to build and test the project -->

## Code Style

<!-- Coding conventions and patterns to follow -->

## Architecture

<!-- Key architectural decisions and file structure -->
`;

const DESIGN_MD_TEMPLATE = `# Design System

## Color Tokens

| Name | Value | Usage |
| --- | --- | --- |
| color-primary | #1a73e8 | Primary action buttons and links |
| color-secondary | #5f6368 | Secondary text and icons |

## Typography

| Name | Value | Usage |
| --- | --- | --- |
| font-size-body | 16px | Default body text |
| font-size-heading | 24px | Section headings |

## Spacing

| Name | Value | Usage |
| --- | --- | --- |
| spacing-small | 8px | Compact spacing between elements |
| spacing-medium | 16px | Default spacing |
| spacing-large | 32px | Section spacing |
`;

function runInit(initType?: string) {
  const types = initType
    ? [initType]
    : ["claude-md", "design-md"];

  for (const t of types) {
    let fileName: string;
    let content: string;

    if (t === "claude-md") {
      fileName = "CLAUDE.md";
      content = CLAUDE_MD_TEMPLATE;
    } else if (t === "design-md") {
      fileName = "DESIGN.md";
      content = DESIGN_MD_TEMPLATE;
    } else {
      console.error(pc.red(`Unknown type: ${t}. Use "claude-md" or "design-md".`));
      process.exit(1);
    }

    const filePath = path.resolve(fileName);
    if (fs.existsSync(filePath)) {
      console.log(pc.yellow(`  ⚠ ${fileName} already exists, skipping.`));
      continue;
    }

    fs.writeFileSync(filePath, content, "utf-8");
    console.log(pc.green(`  ✓ Created ${fileName}`));
  }
}

// ─── Lint command ───────────────────────────────────────────────

async function resolveFiles(patterns: string[]): Promise<string[]> {
  if (patterns.length === 0) {
    // Default: look for common context files in cwd
    const defaults = [
      "CLAUDE.md", "claude.md", ".claude",
      "DESIGN.md", "design.md",
      "*.claude.md", "*.design.md",
    ];
    const found = await globby(defaults, { absolute: true });
    if (found.length === 0) {
      console.error(pc.red("No context files found. Specify files or run `context-lint init`."));
      process.exit(1);
    }
    return found;
  }

  const resolved = await globby(patterns, { absolute: true });
  if (resolved.length === 0) {
    console.error(pc.red(`No files matched: ${patterns.join(", ")}`));
    process.exit(1);
  }
  return resolved;
}

function printTextResult(result: LintResult) {
  const scoreColor =
    result.score >= 90 ? pc.green :
    result.score >= 70 ? pc.yellow :
    result.score >= 50 ? pc.magenta :
    pc.red;

  if (result.filePath) {
    console.log(pc.bold(pc.underline(result.filePath)));
  }

  if (result.messages.length === 0) {
    console.log(pc.green("  No issues found. Your file is AI-Ready!"));
  } else {
    for (const msg of result.messages) {
      const symbol =
        msg.severity === "critical" || msg.severity === "high"
          ? pc.red("✖")
          : msg.severity === "medium"
            ? pc.yellow("⚠")
            : pc.blue("ℹ");
      const label = msg.severity.toUpperCase();
      console.log(`  ${msg.line}:${msg.column}  ${symbol} [${label}] ${msg.message}  ${pc.dim(`(${msg.ruleId})`)}`);
    }
  }

  console.log("");
  console.log(`  ${scoreColor(`Score: ${result.score}/100`)} (${result.rank})`);
  if (result.messages.length > 0) {
    console.log(pc.dim(`  ${result.messages.length} problem(s) found`));
  }
  console.log("");
}

// ─── Main ───────────────────────────────────────────────────────

async function main() {
  const opts = parseCliArgs(process.argv);

  // Init command
  if (opts.command === "init") {
    runInit(opts.initType);
    return;
  }

  // Initialize i18n
  await initI18n(opts.locale);

  // Load config file
  const config = await loadConfig(process.cwd());

  // Resolve files
  const files = await resolveFiles(opts.files);

  // Lint each file
  const results: LintResult[] = [];
  let hasFailure = false;

  for (const filePath of files) {
    const source = fs.readFileSync(filePath, "utf-8");
    const result = await lint(source, {
      filePath,
      rules: config.rules,
    });

    // --fix: apply rule-based fixes
    if (opts.fix) {
      const fixResult = applyFixes(source, result.messages);
      if (fixResult.fixCount > 0) {
        if (opts.dryRun) {
          console.log(pc.bold(`${filePath}: ${fixResult.fixCount} fix(es) available (dry-run)`));
          console.log(pc.dim("--- original"));
          console.log(pc.dim("+++ fixed"));
          // Show a simple diff
          const origLines = source.split("\n");
          const fixedLines = fixResult.output.split("\n");
          const maxLen = Math.max(origLines.length, fixedLines.length);
          for (let i = 0; i < maxLen; i++) {
            if (origLines[i] !== fixedLines[i]) {
              if (origLines[i] != null) console.log(pc.red(`- ${origLines[i]}`));
              if (fixedLines[i] != null) console.log(pc.green(`+ ${fixedLines[i]}`));
            }
          }
          console.log("");
        } else {
          fs.writeFileSync(filePath, fixResult.output, "utf-8");
          console.log(pc.green(`  ✓ Applied ${fixResult.fixCount} fix(es) to ${path.basename(filePath)}`));
        }
      }
    }

    // --ai-fix: generate AI-powered suggestions
    if (opts.aiFix && result.messages.length > 0) {
      const apiKey = resolveApiKey();
      if (!apiKey) {
        console.error(pc.red("--ai-fix requires an API key. Set ANTHROPIC_API_KEY or CONTEXT_LINT_AI_KEY."));
        process.exit(1);
      }

      try {
        console.log(pc.dim(`  Generating AI fix suggestions for ${path.basename(filePath)}...`));
        const suggested = await generateAiFix(source, result, { apiKey });
        const suggestedPath = filePath.replace(/\.md$/, ".suggested.md");
        fs.writeFileSync(suggestedPath, suggested, "utf-8");
        console.log(pc.green(`  ✓ AI suggestions written to ${path.basename(suggestedPath)}`));
      } catch (err) {
        console.error(pc.yellow(`  ⚠ AI fix failed: ${err instanceof Error ? err.message : String(err)}`));
        console.log(pc.dim("  Falling back to rule-based results."));
      }
    }

    results.push(result);

    if (result.score < opts.threshold) {
      hasFailure = true;
    }
  }

  // Output
  if (opts.format === "json") {
    console.log(JSON.stringify(results.length === 1 ? results[0] : results, null, 2));
  } else {
    for (const result of results) {
      printTextResult(result);
    }

    // Summary for multiple files
    if (results.length > 1) {
      const totalProblems = results.reduce((s, r) => s + r.messages.length, 0);
      const avgScore = Math.round(
        results.reduce((s, r) => s + r.score, 0) / results.length,
      );
      console.log(pc.bold("Summary"));
      console.log(`  ${results.length} file(s) checked, ${totalProblems} problem(s) found`);
      console.log(`  Average score: ${avgScore}/100`);
      console.log("");
    }
  }

  // Exit code
  if (hasFailure) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(pc.red(err instanceof Error ? err.message : String(err)));
  process.exit(1);
});
