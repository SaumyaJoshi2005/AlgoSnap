const assert = require('node:assert/strict');
const vscode = require('vscode');
const { insertTemplate } = require('../out/extension');
const { ALGORITHMS } = require('../out/templates');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function document(language, content) {
  const doc = await vscode.workspace.openTextDocument({language, content});
  const editor = await vscode.window.showTextDocument(doc);
  const position = doc.positionAt(content.length);
  editor.selection = new vscode.Selection(position, position);
  await delay(80);
  return editor;
}
exports.run = async function run() {
  const manifest = require('../package.json');
  const extension = vscode.extensions.getExtension(`${manifest.publisher}.${manifest.name}`);
  assert.ok(extension, 'extension must be discovered');
  const python = await document('python', 'data = [1,2,3]\nkey = 2\n\n');
  for (let i=0;i<30 && !extension.isActive;i++) await delay(100);
  assert.ok(extension.isActive, 'opening a supported file must activate without a manual command');
  const original = python.document.getText();
  await vscode.commands.executeCommand('algosnap.insertTemplate','binary-exact');
  assert.match(python.document.getText(), /def binary_search\(data, key\)/);
  assert.equal(python.document.getText(python.selection), 'data', 'first parameter must be an editable snippet placeholder');
  await vscode.commands.executeCommand('type', {text:'numbers'});
  assert.match(python.document.getText(), /len\(numbers\)/, 'linked placeholders must update references');
  await vscode.commands.executeCommand('leaveSnippet');
  await vscode.commands.executeCommand('undo'); // name edit
  await vscode.commands.executeCommand('undo'); // template insertion
  assert.equal(python.document.getText(), original, 'insertion must undo cleanly');

  const java = await document('java', 'class Demo {\n    \n}');
  java.selection = new vscode.Selection(1,4,1,4);
  await vscode.commands.executeCommand('algosnap.insertTemplate','window-sum');
  assert.match(java.document.getText(), /    public static long maxSumWindow/);
  assert.match(java.document.getText(), /\n        if \(k < 1/);
  assert.doesNotMatch(java.document.getText(), /def /);
  await vscode.commands.executeCommand('leaveSnippet');

  const unsupported = await document('c', '\n');
  await vscode.commands.executeCommand('algosnap.insertTemplate','binary-exact');
  assert.equal(unsupported.document.getText(), '\n');
  const occupied = await document('python', 'do_not_replace = 1');
  await vscode.commands.executeCommand('algosnap.insertTemplate','binary-exact');
  assert.equal(occupied.document.getText(), 'do_not_replace = 1');

  const stale = await document('python', '\n');
  const pos = stale.selection.active;
  const snapshot = {editor:stale,document:stale.document,version:stale.document.version,
    selection:stale.selection,range:new vscode.Range(pos,pos),context:{language:'python',arrays:[],integers:[]}};
  await stale.edit(builder => builder.insert(pos, '# preserve me'));
  assert.equal(await insertTemplate(snapshot, ALGORITHMS[0].templates[0]), false);
  assert.equal(stale.document.getText(), '\n# preserve me');

  const auto = await document('python', '\n');
  for (const char of 'binary search') await vscode.commands.executeCommand('type', {text:char});
  await delay(850);
  await vscode.commands.executeCommand('workbench.action.acceptSelectedQuickOpenItem');
  await delay(250);
  assert.match(auto.document.getText(), /def binary_search/);
  assert.doesNotMatch(auto.document.getText(), /\nbinary search/);
  await vscode.commands.executeCommand('leaveSnippet');

  const cancel = await document('python','\n');
  for (const char of 'binary search') await vscode.commands.executeCommand('type',{text:char});
  await delay(850);
  await cancel.edit(builder => builder.insert(new vscode.Position(0,0),'# edited\n'));
  await vscode.commands.executeCommand('workbench.action.acceptSelectedQuickOpenItem');
  await delay(200);
  assert.doesNotMatch(cancel.document.getText(), /def binary_search/);
  assert.match(cancel.document.getText(), /# edited/);

  const pasted = await document('python','\n');
  await vscode.commands.executeCommand('type',{text:'binary search'});
  await delay(850);
  await vscode.commands.executeCommand('workbench.action.acceptSelectedQuickOpenItem');
  assert.equal(pasted.document.getText(), '\nbinary search');
  const restoredJava = await document('java','class Restored {\n    \n}');
  restoredJava.selection = new vscode.Selection(1,4,1,4);
  const unchanged = restoredJava.document.getText();
  await vscode.commands.executeCommand('algosnap.insertTemplate','python-tree-inorder');
  assert.equal(restoredJava.document.getText(), unchanged, 'unsupported native template must be rejected');
  await vscode.commands.executeCommand('algosnap.insertTemplate','java-coin-change');
  assert.match(restoredJava.document.getText(), /    public static int coinChange/);
  assert.match(restoredJava.document.getText(), /java.util.Arrays.fill/);
  assert.doesNotMatch(restoredJava.document.getText(), /^\s*import /m);
  await vscode.commands.executeCommand('leaveSnippet');

  const restoredPython = await document('python','\n');
  for(const char of 'bfs') await vscode.commands.executeCommand('type',{text:char});
  await delay(850);
  await vscode.commands.executeCommand('workbench.action.acceptSelectedQuickOpenItem');
  await delay(250);
  assert.match(restoredPython.document.getText(), /def bfs\(graph, start\)/);
  assert.equal(restoredPython.document.getText(restoredPython.selection), 'graph');
  await vscode.commands.executeCommand('type',{text:'adjacency'});
  assert.match(restoredPython.document.getText(), /adjacency.get\(node/);
  await vscode.commands.executeCommand('leaveSnippet');
  console.log('PASS: activation, snippets, undo, indentation, language guard, stale rejection, triggers/cancellation/paste, restored Java DP and Python BFS, and linked extended parameters.');
  await vscode.commands.executeCommand('workbench.action.closeAllEditors');
};
