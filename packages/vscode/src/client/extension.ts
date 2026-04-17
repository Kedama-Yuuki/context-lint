import * as path from "node:path";
import {
  workspace,
  window,
  commands,
  ExtensionContext,
  StatusBarAlignment,
  StatusBarItem,
  TextEditor,
} from "vscode";
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from "vscode-languageclient/node";

let client: LanguageClient;
let statusBarItem: StatusBarItem;

// Score cache per URI
const scoreMap = new Map<string, { score: number; rank: string }>();

export function activate(context: ExtensionContext): void {
  // --- Language Server ---

  const serverModule = context.asAbsolutePath(
    path.join("dist", "server", "server.js"),
  );

  const serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: { execArgv: ["--nolazy", "--inspect=6009"] },
    },
  };

  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ scheme: "file", language: "markdown" }],
    synchronize: {
      fileEvents: workspace.createFileSystemWatcher(
        "**/.context-lint.config.{json,yaml,yml,js,cjs,mjs}",
      ),
    },
  };

  client = new LanguageClient(
    "contextLint",
    "context-lint",
    serverOptions,
    clientOptions,
  );

  // --- Status Bar ---

  statusBarItem = window.createStatusBarItem(StatusBarAlignment.Right, 100);
  statusBarItem.command = "contextLint.fixAll";
  context.subscriptions.push(statusBarItem);

  // Listen for score notifications from the server
  client.start().then(() => {
    client.onNotification(
      "contextLint/score",
      (params: { uri: string; score: number; rank: string }) => {
        scoreMap.set(params.uri, {
          score: params.score,
          rank: params.rank,
        });
        updateStatusBar(window.activeTextEditor);
      },
    );
  });

  // Update status bar when switching editors
  context.subscriptions.push(
    window.onDidChangeActiveTextEditor((editor) => {
      updateStatusBar(editor);
    }),
  );

  // --- Commands ---

  context.subscriptions.push(
    commands.registerCommand("contextLint.fixAll", async () => {
      const editor = window.activeTextEditor;
      if (!editor) return;

      const uri = editor.document.uri.toString();
      const result = await client.sendRequest<{ applied: number } | null>(
        "contextLint/fixAll",
        { uri },
      );

      if (result && result.applied > 0) {
        window.showInformationMessage(
          `context-lint: Applied ${result.applied} fix(es).`,
        );
      } else {
        window.showInformationMessage("context-lint: No auto-fixable issues.");
      }
    }),
  );

  context.subscriptions.push(
    commands.registerCommand("contextLint.aiFix", async () => {
      window.showInformationMessage(
        "context-lint: AI Fix requires the CLI. Run `npx context-lint --ai-fix` in your terminal.",
      );
    }),
  );

  // Initial status bar update
  updateStatusBar(window.activeTextEditor);
}

function updateStatusBar(editor: TextEditor | undefined): void {
  if (!editor) {
    statusBarItem.hide();
    return;
  }

  const uri = editor.document.uri.toString();
  const data = scoreMap.get(uri);

  if (!data) {
    statusBarItem.hide();
    return;
  }

  const icon =
    data.score >= 90
      ? "$(pass)"
      : data.score >= 70
        ? "$(warning)"
        : "$(error)";

  statusBarItem.text = `${icon} context-lint: ${data.score}/100`;
  statusBarItem.tooltip = `${data.rank} — Click to fix all`;
  statusBarItem.show();
}

export function deactivate(): Thenable<void> | undefined {
  if (!client) return undefined;
  return client.stop();
}
