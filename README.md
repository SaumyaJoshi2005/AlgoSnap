# AlgoSnap — Smart Algorithm Templates for VS Code

Type an algorithm keyword → get a quick pick of ready-to-use templates with **your actual variable names** already filled in.

---

## Supported languages
- Python
- C / C++
- Java

## Supported algorithms

| Keyword you type | Templates available |
|---|---|
| `binary search` | Classic, Left bound, Right bound, Rotated array |
| `two pointer` | Two sum, Remove duplicates |
| `sliding window` | Fixed window max sum, Variable window longest |
| `dfs` | Grid DFS / island counting |

---

## How to use

### Auto-trigger (recommended)
Just type the algorithm name at the end of a line:
```python
nums = [1, 3, 5, 7, 9]
target = 5
binary search          ← type this, pause briefly
```
AlgoSnap detects it, pops the Quick Pick, and replaces the keyword with your chosen template — with `nums` and `target` already filled in.

### Manual trigger
Press `Ctrl+Shift+A` (Windows/Linux) or `Cmd+Shift+A` (Mac), type the algorithm name, pick a variant.

---

## Setup (development)

```bash
# 1. Install dependencies
npm install

# 2. Compile TypeScript
npm run compile

# 3. Open in VS Code
code .

# 4. Press F5 to launch Extension Development Host
```

---

## Project structure

```
algosnap/
├── src/
│   ├── extension.ts    # Entry point, auto-trigger, quick pick
│   ├── scanner.ts      # Variable context scanner (Python / C++ / Java)
│   └── templates.ts    # All algorithm templates + registry
├── package.json
└── tsconfig.json
```

---

## Adding a new algorithm

1. Open `src/templates.ts`
2. Add a new `Template[]` array with `label`, `description`, `detail`, and `generate(ctx)` function
3. Add your keywords to `TRIGGER_KEYWORDS`
4. Add a branch in `getTemplatesForKeyword()`

Example:
```typescript
const pythonMergeSort: Template[] = [
  {
    label: 'Top-down recursive',
    description: 'Classic merge sort',
    detail: 'O(n log n), O(n) space.',
    generate: (ctx) => {
      const a = arr(ctx);
      return `def merge_sort(${a}): ...`;
    }
  }
];
```

---

## Settings

| Setting | Default | Description |
|---|---|---|
| `algosnap.triggerOnType` | `true` | Auto-show picker when keyword is typed |
