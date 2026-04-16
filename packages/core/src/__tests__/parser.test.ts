import { describe, it, expect } from "vitest";
import { parse } from "../parser.js";

describe("parse", () => {
  it("parses headings", () => {
    const ast = parse("# Hello\n\n## World");
    const headings = ast.children.filter((n) => n.type === "heading");
    expect(headings).toHaveLength(2);
  });

  it("parses code blocks with lang", () => {
    const ast = parse("```typescript\nconst x = 1;\n```");
    const code = ast.children.find((n) => n.type === "code");
    expect(code).toBeDefined();
    expect((code as { lang: string }).lang).toBe("typescript");
  });

  it("parses GFM tables", () => {
    const md = `| Name | Value |\n| --- | --- |\n| primary | #000 |`;
    const ast = parse(md);
    const table = ast.children.find((n) => n.type === "table");
    expect(table).toBeDefined();
  });

  it("preserves position information", () => {
    const ast = parse("# Title\n\nParagraph");
    const heading = ast.children[0];
    expect(heading.position?.start.line).toBe(1);
    expect(heading.position?.start.column).toBe(1);
  });
});
