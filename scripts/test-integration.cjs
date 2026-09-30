const path = require('node:path');
const { runTests } = require('@vscode/test-electron');
const options = {
  extensionDevelopmentPath: path.resolve('.'),
  extensionTestsPath: path.resolve('test/integration.cjs'),
  launchArgs: [
    '--disable-extensions', '--disable-workspace-trust', '--skip-welcome', '--skip-release-notes',
    '--user-data-dir=' + path.resolve('.test-work/vscode-user'),
    '--extensions-dir=' + path.resolve('.test-work/vscode-extensions')
  ]
};
if (process.env.VSCODE_EXECUTABLE_PATH) options.vscodeExecutablePath = process.env.VSCODE_EXECUTABLE_PATH;
else options.version = process.env.VSCODE_TEST_VERSION || 'stable';
runTests(options).catch(error => { console.error(error); process.exitCode = 1; });
