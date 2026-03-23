import * as vscode from 'vscode';
import { scanContext } from './scanner';
import { getTemplatesForKeyword, TRIGGER_KEYWORDS, Template, ScannedContext } from './templates';

// Single debounce timer shared across all keystrokes
let debounceTimer: NodeJS.Timeout | undefined;

export function activate(context: vscode.ExtensionContext) {

  // 1. Manual command — Ctrl+Shift+A
  const manualCommand = vscode.commands.registerCommand(
    'algosnap.insertTemplate',
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      const keyword = await vscode.window.showInputBox({
        prompt: 'Which algorithm? (e.g. binary search, sliding window, dfs)',
        placeHolder: 'binary search',
      });
      if (!keyword) return;
      await showTemplatePicker(editor, keyword.trim(), false);
    }
  );

  // 2. Auto-trigger — fires when keyword is typed at end of a line
  const typingListener = vscode.workspace.onDidChangeTextDocument((event) => {
    const cfg = vscode.workspace.getConfiguration('algosnap');
    if (!cfg.get<boolean>('triggerOnType', true)) return;

    const editor = vscode.window.activeTextEditor;
    if (!editor || event.document !== editor.document) return;

    // Capture state NOW before the async wait
    const capturedLine    = editor.selection.active.line;
    const capturedVersion = event.document.version;
    const lineText        = event.document.lineAt(capturedLine).text;

    // Trim both ends so indentation and trailing spaces don't break matching
    const trimmed = lineText.trim().toLowerCase();

    const matched = TRIGGER_KEYWORDS.find(kw => trimmed.endsWith(kw.toLowerCase()));
    if (!matched) return;

    // Proper debounce — cancel pending trigger and restart timer
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {

      // Guard 1: document changed during wait → abort
      if (editor.document.version !== capturedVersion) return;

      // Guard 2: line content changed during wait → abort
      const currentText = editor.document.lineAt(capturedLine).text.trim().toLowerCase();
      if (!currentText.endsWith(matched.toLowerCase())) return;

      // Guard 3: editor lost focus → abort
      if (vscode.window.activeTextEditor !== editor) return;

      await showTemplatePicker(editor, matched, true);

    }, 400);
  });

  context.subscriptions.push(manualCommand, typingListener);
}

async function showTemplatePicker(
  editor: vscode.TextEditor,
  keyword: string,
  replaceKeyword: boolean
) {
  const ctx = scanContext(editor);
  const templates = getTemplatesForKeyword(keyword, ctx);

  if (templates.length === 0) {
    vscode.window.showInformationMessage(
      `AlgoSnap: no templates for "${keyword}" in ${ctx.language}. Supported: Python, C++, Java.`
    );
    return;
  }

  const varPreview = buildVarPreview(ctx);

  const items: (vscode.QuickPickItem & { template: Template })[] = templates.map(t => ({
    label:       `$(code) ${t.label}`,
    description: t.description,
    detail:      `${t.detail}   ${varPreview}`,
    template:    t,
  }));

  const picked = await vscode.window.showQuickPick(items, {
    title:              `AlgoSnap — ${keyword}  [${ctx.language}]`,
    placeHolder:        'Pick a variant — arrow keys to browse, Enter to insert',
    matchOnDescription: true,
    matchOnDetail:      false,
  });
  if (!picked) return;

  const code = picked.template.generate(ctx);
  const snippet = new vscode.SnippetString(code);

  if (replaceKeyword) {
    const line      = editor.selection.active.line;
    const lineText  = editor.document.lineAt(line).text;
    const kwStart   = lineText.toLowerCase().lastIndexOf(keyword.toLowerCase());
    if (kwStart >= 0) {
      const replaceRange = new vscode.Range(
        new vscode.Position(line, kwStart),
        editor.document.lineAt(line).range.end
      );
      await editor.edit(eb => eb.delete(replaceRange));
    }
  }

  await editor.insertSnippet(snippet);
}

function buildVarPreview(ctx: ScannedContext): string {
  const parts: string[] = [];
  if (ctx.arrays.length)   parts.push(`arrays: ${ctx.arrays.slice(0, 3).join(', ')}`);
  if (ctx.integers.length) parts.push(`ints: ${ctx.integers.slice(0, 4).join(', ')}`);
  if (ctx.strings.length)  parts.push(`strings: ${ctx.strings.slice(0, 2).join(', ')}`);
  return parts.length ? `· detected ${parts.join(' | ')}` : '· using default names';
}

export function deactivate() {
  clearTimeout(debounceTimer);
}