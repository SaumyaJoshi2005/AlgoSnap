# AlgoSnap

Algorithm templates that fit your editor context. Works offline in VS Code.

![AlgoSnap icon](assets/icon.png)

Insert tested Python, C++17, and Java algorithm functions from a searchable picker.
AlgoSnap suggests parameter names from preceding code and lets you edit linked
names with Tab. No account, API key, backend, or network request is needed.

## Quick start

1. Open a Python, C++, or Java source file.
2. Put a single cursor on an empty or indented blank line.
3. Run **AlgoSnap: Insert Algorithm Template** from the Command Palette, or press
   `Ctrl+Shift+A` (`Cmd+Shift+A` on macOS).
4. Select a template; Tab through the parameter names. Escape exits snippet mode.
5. One Undo removes the insertion (later edits have their own undo entries).

Example: with `data = [1, 3, 5]` and `key = 3` above the cursor, the binary search
template suggests `def binary_search(data, key):` and updates all parameter
references when you rename a placeholder.

### Automatic suggestions

Type `binary search`, `two pointer`, `sliding window`, or `dfs` on its own line,
then pause. The picker replaces that keyword after you select a variant.
Keywords are case-insensitive; aliases such as `binary_search`, `bisect`, and
`flood fill` also work. Comments, common string literals, pasted multi-character
text, undo/redo, selections, and multi-cursor edits do not open the picker.
Moving the cursor, changing documents, or editing while the picker is open
cancels it so an outdated selection cannot overwrite new text.

## Included templates

All eight variants are implemented in **all three languages** (24 combinations).

| Family | Variants | Contract |
| --- | --- | --- |
| Binary search | Exact, lower bound, upper bound, rotated | Ascending input; rotated variant requires distinct values |
| Two pointers | Two sum, remove duplicates | Sorted input; deduplication mutates the prefix |
| Sliding window | Maximum sum of a fixed-size window | `1 <= k <= length`; invalid sizes throw |
| Grid DFS | Iterative island count | Rectangular 0/1 grid, four-way adjacency; input preserved |

Lower/upper bound return the first index with value `>=` / `>` the target,
or the array length. Exact/rotated search return `-1` when absent. Two sum
returns zero-based indices, or an empty result. Grid DFS supports empty grids
and uses an explicit stack to avoid recursive stack overflow.

### Placement and prerequisites

- Python: insert where a function definition belongs; indentation follows VS Code.
- C++: insert outside other functions, use C++17 or later, and add the headers
  named in the generated comment (`<vector>`, plus `<stdexcept>` / `<utility>`
  where needed). Standard library names are qualified with `std::`.
- Java: insert inside a class, outside other methods. Generated methods are static
  and use primitive `int[]` / `int[][]`; collection classes are fully qualified.
- C is **not supported**. Java inputs must be non-null (including grid rows).
  C++ collection dimensions must fit in `int`; sums use `long long` / Java `long`.

## Settings

| Setting | Default | Purpose |
| --- | --- | --- |
| `algosnap.triggerOnType` | `true` | Enable keyword suggestions |
| `algosnap.debounceMs` | `450` | Delay from 100 to 2000 ms |

Both settings may be overridden per workspace/language. Keyboard shortcuts are
customizable in VS Code's Keyboard Shortcuts editor. If another extension uses
the same shortcut, use the Command Palette or remap AlgoSnap.

## Context and privacy

The scanner masks comments and literals, then uses lightweight declaration
patterns to suggest names from preceding code. It is **not a compiler, AST, or
scope/type checker**. Review suggestions; a nearby variable name does not prove
that its type or scope matches the generated function. Grid DFS uses `grid` as
an editable default. Unsupported declarations fall back to `nums`, `target`, `k`.

To keep editor work bounded, automatic triggers only scan prefixes up to
200,000 characters. Past that position, the manual command still works with
default names. Unusual syntax (for example C++ line splicing or macros) may
require disabling auto-trigger. VS Code does not identify the origin of every
edit; single-character programmatic inserts/pastes can resemble typing.

The extension does not execute generated code, inspect other files, transmit
source, or collect telemetry. See [PRIVACY.md](PRIVACY.md).

## Local installation

In VS Code, choose **Extensions > ... > Install from VSIX...** and select the
provided `algosnap-0.2.0.vsix`. Or run:

```sh
code --install-extension algosnap-0.2.0.vsix
```

The local build uses publisher `algosnap-local`. Replace it with your registered
publisher before public release. This package has not been published on Marketplace.

## Development

Requires Node.js 22.13 or later. In Windows PowerShell, use `npm.cmd` if script
execution policy blocks `npm.ps1`; changing execution policy is unnecessary.

```sh
npm ci
npm test
code .
```

Press F5 to launch the configured Extension Development Host. The build runs
automatically. `npm run watch` recompiles edits during development.

```sh
npm run test:algorithms    # Python 3, g++ with C++17, javac/java on PATH
npm run test:integration   # Downloads an isolated VS Code test instance
npm run package           # Builds/tests, then creates a VSIX
```

For integration tests with an existing VS Code executable, set
`VSCODE_EXECUTABLE_PATH` to its full path. The runner uses isolated test user
data and extensions. CI tests the minimum supported VS Code (1.85.2) and stable.

The algorithm runner accepts `ALGOSNAP_PYTHON`, `ALGOSNAP_CXX`, `ALGOSNAP_JAVAC`,
and `ALGOSNAP_JAVA` as full executable paths if your preferred tools are not on PATH.

See [CONTRIBUTING.md](CONTRIBUTING.md), [architecture](docs/ARCHITECTURE.md), and
[publishing instructions](docs/PUBLISHING.md). Report bugs with reproduction
steps at [GitHub Issues](https://github.com/SaumyaJoshi2005/AlgoSnap/issues).

## Release notes

The 0.2.0 release replaces inconsistent prototype fallbacks with explicit
language support. It drops incomplete `is_valid`/`feasible` skeletons and the
mixed import-and-statement Java wrapper. See [CHANGELOG.md](CHANGELOG.md).
