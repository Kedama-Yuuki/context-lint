# context-lint

> Better context. Better output.

The linter for AI-readable context files. Validate your `CLAUDE.md`, `DESIGN.md`, and other AI context files to ensure they are clear, consistent, and free of contradictions.

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen.svg)](https://nodejs.org)
[![Built with Claude Code](https://img.shields.io/badge/Built%20with-Claude%20Code-blueviolet)](https://claude.ai/code)

## Why context-lint?

AI agents are only as good as the context you give them. A `CLAUDE.md` with contradictory instructions or a `DESIGN.md` with ambiguous token definitions leads to unpredictable AI output.

context-lint catches these problems before they reach the AI:

- **Contradictions** &mdash; "Always use TypeScript" + "Never use TypeScript"
- **Ambiguous language** &mdash; "Use appropriate colors as needed"
- **Duplicate definitions** &mdash; Same token defined with conflicting values
- **Lost in the Middle** &mdash; Critical constraints buried where AI won't see them

## Quick Start

```bash
# Lint a file
npx context-lint CLAUDE.md

# Generate template files
npx context-lint init

# JSON output (for CI/CD)
npx context-lint CLAUDE.md --format json
```

## Example Output

```
CLAUDE.md
  5:1   ✖ [CRITICAL] Conflicting values for "color-primary": line 5: "#1a73e8", line 12: "#ff0000".  (M1-001)
  8:1   ✖ [HIGH]     Potential contradiction detected: line 3 vs line 8.  (M1-002)
  15:5  ✖ [HIGH]     Ambiguous word "appropriate" found. Be specific instead.  (M3-001)
  42:1  ✖ [HIGH]     Critical constraint "MUST" found at line 42 (below top 20%).  (M4-001)

  Score: 50/100 (Needs Work)
  4 problem(s) found
```

## Rules

### M1: Contradiction

| Rule | Severity | Description |
|------|----------|-------------|
| M1-001 | CRITICAL | Same token/variable name must not have different values |
| M1-002 | HIGH | Contradictory positive/negative constraints must not coexist |
| M1-003 | HIGH | Referenced file paths must actually exist |

### M2: Duplication

| Rule | Severity | Description |
|------|----------|-------------|
| M2-001 | MEDIUM | Same content must not be duplicated across sections |
| M2-002 | MEDIUM | Same concept must not use multiple different names |

### M3: Clarity

| Rule | Severity | Description |
|------|----------|-------------|
| M3-001 | HIGH | Ambiguous words must not be used (EN + JP) |
| M3-002 | MEDIUM | Negative constraints should not be overused |
| M3-003 | LOW | Values must have explicit units or types |

### M4: Lost in the Middle

| Rule | Severity | Description |
|------|----------|-------------|
| M4-001 | HIGH | CRITICAL constraints must appear in the top 20% of the file |
| M4-002 | MEDIUM | File token count must be within 8,000 tokens |
| M4-003 | LOW | Important references should be in the opening section |

## Scoring

| Score | Rank | Meaning |
|-------|------|---------|
| 90-100 | AI-Ready | Ready to pass to AI agents as-is |
| 70-89 | Mostly Ready | Minor fixes recommended |
| 50-69 | Needs Work | AI may rely on assumptions |
| 0-49 | Not AI-Ready | Risk of AI misinterpretation |

Penalties: CRITICAL -20, HIGH -10, MEDIUM -5, LOW -2

## CLI Options

```
context-lint <files...>           Lint files
context-lint init [--type <t>]    Generate CLAUDE.md / DESIGN.md templates
context-lint --help               Show help

Options:
  --format <text|json>    Output format (default: text)
  --locale <en|ja>        Language for messages
  --fix                   Apply rule-based auto-fixes
  --dry-run               Preview fixes without applying
  --ai-fix                AI-powered suggestions (BYOK, requires ANTHROPIC_API_KEY)
  --threshold <n>         Minimum passing score (default: 0)
```

## Configuration

Create a `.context-lint.config.json` in your project root:

```json
{
  "rules": {
    "M1-001": "error",
    "M3-001": "warn",
    "M4-002": "off"
  }
}
```

Also supports `.context-lint.config.js`, `.yaml`, and other formats via [cosmiconfig](https://github.com/cosmiconfig/cosmiconfig).

## GitHub Actions

```yaml
name: context-lint
on: [pull_request]
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npx context-lint CLAUDE.md DESIGN.md --threshold 70
```

## Architecture

```
packages/
  core/          # Detection engine (browser-compatible, no Node.js dependencies)
  cli/           # CLI entry point (npx context-lint)
  figma-plugin/  # Figma plugin (Phase 1)
```

The core package is designed to run in both Node.js and browser environments (Figma plugin), with zero filesystem dependencies.

## Roadmap

- [x] **Phase 1** &mdash; CLAUDE.md + DESIGN.md linting, CLI, scoring
- [ ] **Phase 2** &mdash; Plugin API for community rules
- [ ] **Phase 3** &mdash; Cross-file graph analysis
- [ ] **Phase 4** &mdash; API reference context validation

## i18n

context-lint supports English and Japanese out of the box. Ambiguous word detection (M3-001) includes dictionaries for both languages.

```bash
context-lint CLAUDE.md --locale ja
```

## Contributing

Issues and PRs are welcome on [GitHub](https://github.com/anthropics/context-lint).

## License

[MIT](LICENSE) &copy; Kedama Design

---

Built with [Claude Code](https://claude.ai/code)
