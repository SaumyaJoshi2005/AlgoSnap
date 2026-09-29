import * as vscode from 'vscode';
import { chooseNames, isLanguage, scanSource, ScannedContext } from './scanner';
import { ALGORITHMS, Template } from './templates';
import { Debouncer, matchTrigger, MAX_CONTEXT_CHARS } from './trigger';

interface Snapshot {
  editor: vscode.TextEditor;
  document: vscode.TextDocument;
  version: number;
  selection: vscode.Selection;
  range: vscode.Range;
  context: ScannedContext;
}
function capture(editor: vscode.TextEditor, range: vscode.Range): Snapshot | undefined {
  const document = editor.document;
  if (!isLanguage(document.languageId)) return;
  const end = document.offsetAt(range.start);
  const source = end <= MAX_CONTEXT_CHARS
    ? document.getText(new vscode.Range(new vscode.Position(0, 0), range.start)) : '';
  return { editor, document, version: document.version, selection: editor.selection, range,
    context: scanSource(source, document.languageId) };
}
function isCurrent(snapshot: Snapshot): boolean {
  return !snapshot.document.isClosed && vscode.window.activeTextEditor === snapshot.editor &&
    snapshot.document.version === snapshot.version && snapshot.editor.selections.length === 1 &&
    snapshot.editor.selection.isEqual(snapshot.selection);
}

/** Escape literal content and link parameter names with editable snippet tab stops. */
export function createSnippet(code: string, context: ScannedContext): vscode.SnippetString {
  const names = chooseNames(context);
  const editable = new Set([names.array, names.target, names.window, 'grid']);
  const indices = new Map<string, number>();
  const snippet = new vscode.SnippetString();
  let previous = 0;
  for (const match of code.matchAll(/\b[A-Za-z_]\w*\b/g)) {
    const name = match[0];
    if (!editable.has(name)) continue;
    snippet.appendText(code.slice(previous, match.index));
    let index = indices.get(name);
    if (index === undefined) {
      index = indices.size + 1;
      indices.set(name, index);
      snippet.appendPlaceholder(name, index);
    } else {
      snippet.value += `$${index}`;
    }
    previous = match.index + name.length;
  }
  snippet.appendText(code.slice(previous));
  snippet.appendTabstop(0);
  return snippet;
}

export async function insertTemplate(snapshot: Snapshot, template: Template): Promise<boolean> {
  if (!isCurrent(snapshot)) return false;
  return snapshot.editor.insertSnippet(createSnippet(template.render(snapshot.context), snapshot.context),
    snapshot.range, { undoStopBefore: true, undoStopAfter: true });
}

export function activate(context: vscode.ExtensionContext): void {
  const debounce = new Debouncer();
  const output = vscode.window.createOutputChannel('AlgoSnap');
  let busy = false;
  let pickerCancellation: vscode.CancellationTokenSource | undefined;
  const invalidate = () => { debounce.cancel(); pickerCancellation?.cancel(); };
  const report = (error: unknown) => {
    // Do not log source code or document paths.
    output.appendLine(`Operation failed: ${error instanceof Error ? error.name : 'unknown error'}`);
    void vscode.window.showErrorMessage('AlgoSnap could not insert the template. Try again in an editable source file.');
  };
  async function pick(snapshot: Snapshot, templates: readonly Template[]): Promise<void> {
    if (busy || !isCurrent(snapshot)) return;
    busy = true;
    const cancellation = new vscode.CancellationTokenSource();
    pickerCancellation = cancellation;
    try {
      const names = chooseNames(snapshot.context);
      const chosen = await vscode.window.showQuickPick(templates.map(template => ({
        label: template.label, detail: template.detail, template,
        description: `${snapshot.context.language} | names: ${names.array}, ${names.target}, ${names.window}`
      })), { title: 'AlgoSnap: Insert Algorithm Template', matchOnDetail: true,
        placeHolder: 'Select a template. Tab through parameter names after insertion.' }, cancellation.token);
      if (chosen && !cancellation.token.isCancellationRequested) {
        if (!await insertTemplate(snapshot, chosen.template)) {
          void vscode.window.showInformationMessage('AlgoSnap: the editor changed or is read-only. Run the command again.');
        }
      }
    } catch (error) { report(error); }
    finally {
      if (pickerCancellation === cancellation) pickerCancellation = undefined;
      cancellation.dispose();
      busy = false;
    }
  }

  const manual = vscode.commands.registerCommand('algosnap.insertTemplate', async (templateId?: unknown) => {
    debounce.cancel();
    const editor = vscode.window.activeTextEditor;
    if (!editor || busy) return;
    if (!isLanguage(editor.document.languageId)) {
      void vscode.window.showInformationMessage('AlgoSnap supports Python, C++, and Java. C is not supported.'); return;
    }
    if (editor.selections.length !== 1 || !editor.selection.isEmpty) {
      void vscode.window.showInformationMessage('AlgoSnap: use a single cursor on a blank line.'); return;
    }
    const line = editor.document.lineAt(editor.selection.active.line);
    if (line.text.trim()) {
      void vscode.window.showInformationMessage('AlgoSnap: place the cursor on a blank line before inserting a function.'); return;
    }
    const snapshot = capture(editor, new vscode.Range(line.range.end, line.range.end));
    if (!snapshot) return;
    const templates = ALGORITHMS.flatMap(algorithm => [...algorithm.templates]);
    // Optional stable template ID supports keybindings and integration tests.
    if (typeof templateId === 'string') {
      const template = templates.find(item => item.id === templateId);
      if (!template) { void vscode.window.showInformationMessage('AlgoSnap: unknown template ID.'); return; }
      busy = true;
      try { await insertTemplate(snapshot, template); } catch (error) { report(error); }
      finally { busy = false; }
      return;
    }
    await pick(snapshot, templates);
  });

  const typing = vscode.workspace.onDidChangeTextDocument(event => {
    const editor = vscode.window.activeTextEditor;
    if (!editor || event.document !== editor.document) return;
    invalidate();
    if (busy || event.reason !== undefined || event.contentChanges.length !== 1 ||
        editor.selections.length !== 1 || !isLanguage(event.document.languageId)) return;
    const change = event.contentChanges[0];
    // Suppress normal paste, deletion, multi-cursor changes, and replacement edits.
    // VS Code does not expose provenance; a single-character programmatic edit is indistinguishable.
    if (change.rangeLength !== 0 || change.text.length !== 1 || /[\r\n]/.test(change.text)) return;
    const config = vscode.workspace.getConfiguration('algosnap', event.document.uri);
    if (!config.get<boolean>('triggerOnType', true)) return;
    const version = event.document.version;
    const expected = event.document.positionAt(change.rangeOffset + change.text.length);
    const delay = Math.max(100, Math.min(2000, config.get<number>('debounceMs', 450)));
    debounce.schedule(() => {
      if (busy || event.document.isClosed || event.document.version !== version ||
          vscode.window.activeTextEditor !== editor || !editor.selection.isEmpty ||
          !editor.selection.active.isEqual(expected) || !isLanguage(event.document.languageId)) return;
      const line = event.document.lineAt(expected.line);
      if (expected.character !== line.text.length || event.document.offsetAt(expected) > MAX_CONTEXT_CHARS) return;
      const prefix = event.document.getText(new vscode.Range(new vscode.Position(0, 0), expected));
      const match = matchTrigger(prefix, event.document.languageId);
      if (!match) return;
      const range = new vscode.Range(event.document.positionAt(match.start), event.document.positionAt(match.end));
      const snapshot = capture(editor, range);
      const algorithm = ALGORITHMS.find(item => item.id === match.algorithmId);
      if (snapshot && algorithm) void pick(snapshot, algorithm.templates);
    }, delay);
  });
  context.subscriptions.push(manual, typing, debounce, output,
    vscode.window.onDidChangeActiveTextEditor(invalidate),
    vscode.window.onDidChangeTextEditorSelection(event => {
      // Typing moves the selection too: cancel the open picker but leave the pending
      // debounce to check its expected position after VS Code updates the cursor.
      if (event.textEditor === vscode.window.activeTextEditor) pickerCancellation?.cancel();
    }),
    vscode.workspace.onDidChangeConfiguration(event => { if (event.affectsConfiguration('algosnap')) invalidate(); }),
    vscode.workspace.onDidCloseTextDocument(invalidate),
    { dispose: () => { invalidate(); pickerCancellation?.dispose(); } });
}
export function deactivate(): void { /* Resources are owned by ExtensionContext. */ }
