import {
  createConnection,
  TextDocuments,
  Diagnostic,
  DiagnosticSeverity,
  ProposedFeatures,
  InitializeParams,
  InitializeResult,
  TextDocumentSyncKind,
  CodeAction,
  CodeActionKind,
  CodeActionParams,
  Hover,
  HoverParams,
  MarkupKind,
  TextEdit,
  Range,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { lint, initI18n, applyFixes } from "@context-lint/core";
import type { LintMessage, LintResult } from "@context-lint/core";

// --- Connection & Document Manager ---

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);

// Cache lint results per URI for hover/code-action lookups
const resultCache = new Map<string, LintResult>();

// Custom notification for score updates (client renders status bar)
const ScoreNotification = "contextLint/score";

// --- Helpers ---

function isContextFile(uri: string): boolean {
  const lower = uri.toLowerCase();
  return (
    lower.endsWith("/claude.md") ||
    lower.endsWith("/design.md") ||
    lower.endsWith(".claude.md") ||
    lower.endsWith(".design.md") ||
    lower.endsWith("/.claude")
  );
}

function severityToDiagnostic(
  severity: LintMessage["severity"],
): DiagnosticSeverity {
  switch (severity) {
    case "critical":
    case "high":
      return DiagnosticSeverity.Error;
    case "medium":
      return DiagnosticSeverity.Warning;
    case "low":
      return DiagnosticSeverity.Information;
  }
}

function messageToDiagnostic(
  msg: LintMessage,
  doc: TextDocument,
): Diagnostic {
  const startLine = Math.max(0, msg.line - 1);
  const endLine = msg.endLine ? Math.max(0, msg.endLine - 1) : startLine;
  const startChar = Math.max(0, msg.column - 1);
  const endChar = msg.endColumn
    ? Math.max(0, msg.endColumn - 1)
    : doc.getText(Range.create(startLine, 0, startLine + 1, 0)).trimEnd()
        .length;

  return {
    range: Range.create(startLine, startChar, endLine, endChar),
    severity: severityToDiagnostic(msg.severity),
    code: msg.ruleId,
    source: "context-lint",
    message: msg.message,
    data: msg, // attach full LintMessage for code actions
  };
}

// --- Lint & Publish ---

async function validateDocument(doc: TextDocument): Promise<void> {
  const uri = doc.uri;

  if (!isContextFile(uri)) {
    connection.sendDiagnostics({ uri, diagnostics: [] });
    return;
  }

  const source = doc.getText();
  // Extract a pseudo file path from the URI
  const filePath = uri.replace(/^file:\/\//, "");

  try {
    const result = await lint(source, { filePath });
    resultCache.set(uri, result);

    const diagnostics = result.messages.map((msg) =>
      messageToDiagnostic(msg, doc),
    );
    connection.sendDiagnostics({ uri, diagnostics });

    // Send score to client for status bar
    connection.sendNotification(ScoreNotification, {
      uri,
      score: result.score,
      rank: result.rank,
    });
  } catch (err) {
    connection.console.error(
      `context-lint error: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

// --- Initialize ---

connection.onInitialize((_params: InitializeParams): InitializeResult => {
  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      codeActionProvider: {
        codeActionKinds: [CodeActionKind.QuickFix],
      },
      hoverProvider: true,
    },
  };
});

connection.onInitialized(async () => {
  await initI18n();
  // Validate all already-open documents
  for (const doc of documents.all()) {
    await validateDocument(doc);
  }
});

// --- Document Events ---

documents.onDidChangeContent(async (change) => {
  await validateDocument(change.document);
});

documents.onDidClose((event) => {
  resultCache.delete(event.document.uri);
  connection.sendDiagnostics({ uri: event.document.uri, diagnostics: [] });
});

// --- Code Actions (Quick Fix) ---

connection.onCodeAction((params: CodeActionParams): CodeAction[] => {
  const uri = params.textDocument.uri;
  const result = resultCache.get(uri);
  if (!result) return [];

  const actions: CodeAction[] = [];
  const doc = documents.get(uri);
  if (!doc) return [];

  for (const diagnostic of params.context.diagnostics) {
    if (diagnostic.source !== "context-lint") continue;

    const msg = diagnostic.data as LintMessage | undefined;
    if (!msg?.fix) continue;

    const fix = msg.fix;
    const range = Range.create(
      Math.max(0, fix.range.startLine - 1),
      Math.max(0, fix.range.startColumn - 1),
      Math.max(0, fix.range.endLine - 1),
      Math.max(0, fix.range.endColumn - 1),
    );

    actions.push({
      title: `Fix: ${msg.ruleId}`,
      kind: CodeActionKind.QuickFix,
      diagnostics: [diagnostic],
      edit: {
        changes: {
          [uri]: [TextEdit.replace(range, fix.text)],
        },
      },
    });
  }

  return actions;
});

// --- Hover ---

connection.onHover((params: HoverParams): Hover | null => {
  const uri = params.textDocument.uri;
  const result = resultCache.get(uri);
  if (!result) return null;

  const pos = params.position;

  // Find a message whose range covers the hover position
  for (const msg of result.messages) {
    const msgLine = msg.line - 1;
    const msgEndLine = (msg.endLine ?? msg.line) - 1;

    if (pos.line >= msgLine && pos.line <= msgEndLine) {
      const severity = msg.severity.toUpperCase();
      const lines = [
        `**[${msg.ruleId}]** ${severity}`,
        "",
        msg.message,
      ];

      if (msg.fix) {
        lines.push("", "---", "", "Quick Fix available (Ctrl+.)");
      }

      return {
        contents: {
          kind: MarkupKind.Markdown,
          value: lines.join("\n"),
        },
      };
    }
  }

  return null;
});

// --- Fix All Command (server-side handler) ---

connection.onRequest(
  "contextLint/fixAll",
  async (params: { uri: string }): Promise<{ applied: number } | null> => {
    const doc = documents.get(params.uri);
    const result = resultCache.get(params.uri);
    if (!doc || !result) return null;

    const source = doc.getText();
    const fixResult = applyFixes(source, result.messages);

    if (fixResult.fixCount === 0) return { applied: 0 };

    // Apply the full document replacement
    const fullRange = Range.create(
      0,
      0,
      doc.lineCount,
      0,
    );
    connection.workspace.applyEdit({
      changes: {
        [params.uri]: [TextEdit.replace(fullRange, fixResult.output)],
      },
    });

    return { applied: fixResult.fixCount };
  },
);

// --- Start ---

documents.listen(connection);
connection.listen();
