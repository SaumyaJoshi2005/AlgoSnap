# Validation report — 2026-09-29

## Passed locally

- TypeScript strict compilation with no unused locals/parameters and no emit on errors.
- Eight unit-test groups covering lexical masking, variable naming, exact aliases,
  all template/language renderers, trigger context, input bounds, and debounce cancellation.
- All 24 generated template/language combinations compiled/executed with Python 3.13,
  g++ (C++17 with warnings treated as errors), and Java (assertions enabled).
- Python additionally ran 500 seeded randomized cases against independent search,
  bounds, two-sum, deduplication, and sliding-window oracles. Rotated search was
  checked over every rotation of small distinct arrays.
- Empty inputs, duplicates, missing targets, negative sums, invalid window sizes,
  integer-sum overflow cases, empty/ragged grids, and a 100x100 connected grid.
- Real VS Code 1.139.1 integration run: language activation without a manual command,
  linked parameter editing, undo, Java indentation, unsupported-language rejection,
  stale snapshot rejection, automatic triggers, edit cancellation, and paste suppression.
- npm dependency audit: zero known vulnerabilities at the time of the check.
- VSCE packaging with runtime JavaScript, documentation, license, and icon only.
- The final VSIX installed successfully through the VS Code CLI using isolated
  user-data and extensions directories; the user's normal profile was not changed.
- Release identity guard correctly rejects the temporary `algosnap-local` publisher.

## Limits and outstanding release work

- VS Code 1.85.2 downloaded, but its older Electron/Node runtime failed to start
  in this Windows sandbox (`EPERM` while resolving the user-directory path).
  The minimum-version integration run is therefore **not locally verified**.
  CI includes both 1.85.2 and stable integration jobs; those GitHub jobs have not
  been run or observed here because no repository push was performed.
- Public Marketplace publishing/install/update behavior is not yet verified.
  Create a publisher, update the manifest, rebuild, and follow PUBLISHING.md.
- Local context is heuristic, not scope/type checked. Template placement and C++
  headers remain the user's responsibility, as documented in the README.
- No load-test or real-user adoption claims are made. The extension has no backend.

## Repository handoff

The provided source was rebuilt from the supplied archive. A read-only inspection
of the GitHub repository at `070ca0f3ae2f19680e7c52c77ccf838911cc312f` confirmed the
prototype manifest and tracked build output. No GitHub files, commits, branches,
issues, releases, or Marketplace listings were changed.
