# Changelog

## 0.3.0

- Reconciled all 44 additional native-language implementations from GitHub main:
  BFS, dynamic programming, trees, graph algorithms, and data structures.
- Added language-filtered, deduplicated picker entries and explicit parameter tab stops.
- Added native-language routing for aliases; unsupported combinations no longer fall back to Python.
- Added grid, DP, graph, DSU, and segment-tree validation; iterative Python tree traversal.
- Fixed C++ topological-sort syntax, shortest-path integer overflow, and trie ownership.
- Made C++/Java data-structure examples independently compilable with declared dependencies.
- Replaced Python sortedcontainers dependency with a documented standard-library sorted multiset.
- Added behavior tests for all restored implementations, including randomized oracles,
  per-template C++ header compilation, and extended editor integration coverage.
- Total: 68 implementations (34 Python, 20 C++, 14 Java).

## 0.2.0

- Fixed source layout and strict TypeScript build; pinned VS Code API baseline.
- Added activation when Python, C++, or Java is opened.
- Centralized algorithm routing and aliases in one typed registry.
- Added 24 implementations across three languages, with consistent contracts.
- Fixed bounds semantics, invalid windows, sum overflow for int inputs, and empty grids.
- Replaced recursive grid DFS with iterative traversal and rectangular-grid validation.
- Added lexical masking, bounded scanning, editable parameter snippets, and undo boundaries.
- Added cancellable debounce and document/version/selection guards for insertions.
- Added unit, generated-code runtime, and VS Code integration suites; CI and packaging.
- Added documentation, privacy policy, MIT license, icon, and publishing guard.
- Removed unsupported C and cross-language fallbacks; omitted incomplete prototype skeletons.

## 0.1.0

- Initial prototype: keyword detection, regex name scanning, and algorithm templates.
