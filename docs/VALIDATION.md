# Validation report — 2026-09-30 (0.3.0 reconciliation)

## Passed locally

- TypeScript strict compilation with no unused locals/parameters and no emit on errors.
- Nine unit-test groups covering lexical masking, variable naming, exact aliases,
  template/language routing, duplicate suppression, trigger context, input bounds,
  and debounce cancellation. Catalog totals: 34 Python, 20 C++, 14 Java.
- All 68 generated implementations compiled/executed with Python 3.13,
  g++ (C++17 with warnings treated as errors), and Java (assertions enabled).
- Python additionally ran 500 seeded randomized cases against independent search,
  bounds, two-sum, deduplication, and sliding-window oracles. Rotated search was
  checked over every rotation of small distinct arrays.
- All 44 restored variants have runtime checks. Added 100 seeded randomized
  rounds for knapsack/subset/LIS, Dijkstra against Bellman-Ford, sliding maxima,
  and segment-tree ranges. Iterative tree algorithms handle a 3,000-node chain.
- Every restored C++ variant compiles independently with its documented headers
  and warnings treated as errors. Java examples compile inside a class without imports.
- Empty inputs, duplicates, missing targets, negative sums, invalid window sizes,
  integer-sum overflow cases, empty/ragged grids, and a 100x100 connected grid.
- Real VS Code 1.139.1 integration run: language activation without a manual command,
  linked parameter editing, undo, Java indentation, unsupported-language rejection,
  stale snapshot rejection, automatic triggers, edit cancellation, and paste suppression.
- Extended editor checks: native Java coin change, automatic Python BFS, linked
  graph parameter editing, and rejection of Python tree templates in Java.
- npm dependency audit: zero known vulnerabilities at the time of the check.
- VSCE packaging with runtime JavaScript, documentation, license, and icon only.
- The final VSIX installed successfully through the VS Code CLI using isolated
  user-data and extensions directories; the user's normal profile was not changed.
- Release identity guard correctly rejected the temporary `algosnap-local` publisher
  in the initial build. The manifest now uses the owner-provided ID `SaumyaJoshi2005`.

## Limits and outstanding release work

- VS Code 1.85.2 downloaded, but its older Electron/Node runtime failed to start
  in this Windows sandbox (`EPERM` while resolving the user-directory path).
  The minimum-version integration run is therefore **not locally verified**.
  CI includes both 1.85.2 and stable integration jobs. See the draft PR's checks
  for their current status; this report records the local validation run.
- Public Marketplace publishing/install/update behavior is not yet verified.
  Follow PUBLISHING.md after reviewing the PR and its latest checks.
- Local context is heuristic, not scope/type checked. Template placement and C++
  headers remain the user's responsibility, as documented in the README.
- No load-test or real-user adoption claims are made. The extension has no backend.

## Repository handoff

The provided source was rebuilt from the supplied archive. A read-only inspection
of the GitHub repository at `070ca0f3ae2f19680e7c52c77ccf838911cc312f` confirmed the
prototype manifest and tracked build output. The candidate was subsequently
pushed to `marketplace-ready-v0.2.0` and draft PR #1. Main and the Marketplace
listing remain unchanged. The 44 native implementations absent from the ZIP are
now restored; CATALOG-MIGRATION.md records their mapping and contract corrections.
The intentionally omitted incomplete core skeletons remain documented.
