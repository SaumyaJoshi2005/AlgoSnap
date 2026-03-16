"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const scanner_1 = require("./scanner");
const templates_1 = require("./templates");
// ──────────────────────────────────────────
// Extension activate
// ──────────────────────────────────────────
function activate(context) {
    // 1. Manual command: Ctrl+Shift+A — prompts for algorithm name then shows picker
    const manualCommand = vscode.commands.registerCommand('algosnap.insertTemplate', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor)
            return;
        const keyword = await vscode.window.showInputBox({
            prompt: 'Which algorithm? (e.g. binary search, sliding window, dfs)',
            placeHolder: 'binary search'
        });
        if (!keyword)
            return;
        await showTemplatePicker(editor, keyword);
    });
    // 2. Auto-trigger: watch for keyword typed at end of a line
    const typingListener = vscode.workspace.onDidChangeTextDocument(async (event) => {
        const cfg = vscode.workspace.getConfiguration('algosnap');
        if (!cfg.get('triggerOnType', true))
            return;
        const editor = vscode.window.activeTextEditor;
        if (!editor || event.document !== editor.document)
            return;
        const cursor = editor.selection.active;
        const lineText = editor.document.lineAt(cursor.line).text.trimEnd();
        // Check if the line now ends with a known trigger keyword
        const matched = templates_1.TRIGGER_KEYWORDS.find(kw => lineText.toLowerCase().endsWith(kw));
        if (!matched)
            return;
        // Small debounce — only fire if user paused typing
        await new Promise(r => setTimeout(r, 300));
        // Re-check the line is still there after debounce
        const currentLine = editor.document.lineAt(cursor.line).text.trimEnd();
        if (!currentLine.toLowerCase().endsWith(matched))
            return;
        await showTemplatePicker(editor, matched, /* replaceKeyword */ true);
    });
    context.subscriptions.push(manualCommand, typingListener);
    console.log('AlgoSnap activated');
}
// ──────────────────────────────────────────
// Core: show the Quick Pick and insert code
// ──────────────────────────────────────────
async function showTemplatePicker(editor, keyword, replaceKeyword = false) {
    const ctx = (0, scanner_1.scanContext)(editor);
    const templates = (0, templates_1.getTemplatesForKeyword)(keyword, ctx);
    if (templates.length === 0) {
        vscode.window.showInformationMessage(`AlgoSnap: No templates found for "${keyword}" in ${ctx.language}.`);
        return;
    }
    // Build Quick Pick items showing what variables will be used
    const varPreview = buildVarPreview(ctx);
    const items = templates.map(t => ({
        label: t.label,
        description: t.description,
        detail: `${t.detail}  ${varPreview}`,
        template: t
    }));
    const picked = await vscode.window.showQuickPick(items, {
        title: `AlgoSnap — ${keyword}  [${ctx.language}]`,
        placeHolder: 'Choose a template variant',
        matchOnDescription: true
    });
    if (!picked)
        return;
    const code = picked.template.generate(ctx);
    await editor.edit(editBuilder => {
        if (replaceKeyword) {
            // Replace the typed keyword on the current line with the template
            const line = editor.selection.active.line;
            const lineRange = editor.document.lineAt(line).range;
            const lineText = editor.document.lineAt(line).text;
            const kwStart = lineText.toLowerCase().lastIndexOf(keyword.toLowerCase());
            if (kwStart >= 0) {
                const replaceRange = new vscode.Range(new vscode.Position(line, kwStart), lineRange.end);
                editBuilder.replace(replaceRange, code);
                return;
            }
        }
        // Default: insert at cursor
        editBuilder.insert(editor.selection.active, code);
    });
    // Move cursor to the end of inserted code
    const newPos = editor.selection.active;
    editor.selection = new vscode.Selection(newPos, newPos);
}
// Show which variables were detected from context
function buildVarPreview(ctx) {
    const parts = [];
    if (ctx.arrays.length > 0)
        parts.push(`arrays: ${ctx.arrays.slice(0, 3).join(', ')}`);
    if (ctx.integers.length > 0)
        parts.push(`ints: ${ctx.integers.slice(0, 4).join(', ')}`);
    if (parts.length === 0)
        return '(using default names)';
    return `· detected ${parts.join(' | ')}`;
}
function deactivate() { }
