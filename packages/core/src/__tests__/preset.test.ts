import { describe, it, expect } from "vitest";
import { detectPreset } from "../preset.js";

describe("detectPreset", () => {
  it("detects DESIGN.md by filename", () => {
    expect(detectPreset("DESIGN.md", "")).toBe("design-md");
    expect(detectPreset("/path/to/DESIGN.md", "")).toBe("design-md");
    expect(detectPreset("my-project.design.md", "")).toBe("design-md");
  });

  it("detects CLAUDE.md by filename", () => {
    expect(detectPreset("CLAUDE.md", "")).toBe("claude-md");
    expect(detectPreset("/repo/CLAUDE.md", "")).toBe("claude-md");
    expect(detectPreset("agents.md", "")).toBe("claude-md");
  });

  it("detects tokens.json by filename", () => {
    expect(detectPreset("tokens.json", "")).toBe("tokens-json");
    expect(detectPreset("core.tokens.json", "")).toBe("tokens-json");
  });

  it("falls back to content heuristics for design content", () => {
    const content = "# Design System\n\n## Color tokens\n\n| Token | Value |\n| primary | #333 |";
    expect(detectPreset("context.md", content)).toBe("design-md");
  });

  it("falls back to content heuristics for agent instructions", () => {
    const content = "# Rules\n\nYou should always use TypeScript.\nNever skip tests.\nWhen you encounter an error, do not ignore it.";
    expect(detectPreset("context.md", content)).toBe("claude-md");
  });
});
