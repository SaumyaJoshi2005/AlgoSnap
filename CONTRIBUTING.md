# Contributing

Use Node.js 22.13+, `npm ci`, and `npm test`. Source lives in `src/`; generated
`out/`, `node_modules/`, `.test-work/`, and VSIX files are ignored by Git.

Add algorithms to the registry in `src/templates.ts` or `src/catalog/index.ts`.
Every variant must declare its supported languages, preconditions, and explicit
parameters where applicable. Add runtime oracle/edge-case checks in
`scripts/test-algorithms.cjs` (core) or `scripts/test-catalog.cjs` and
`test/catalog-python.py` (restored catalog). Unsupported languages must return no
picker entries, never code in another language. Keep pure logic free of VS Code.

Run `npm run check` and `npm run test:integration` before submitting changes.
Use F5 to test manually, including cancellation, indentation, settings, undo,
and language changes. Update the README support table and changelog with features.
Never put tokens or private source in fixtures or bug reports.

The icon is generated deterministically with `node scripts/build-icon.cjs`.
