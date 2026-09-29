# Contributing

Use Node.js 22.13+, `npm ci`, and `npm test`. Source lives in `src/`; generated
`out/`, `node_modules/`, `.test-work/`, and VSIX files are ignored by Git.

Add algorithms to the `ALGORITHMS` registry in `src/templates.ts`. Each variant
must implement Python, C++, and Java, declare preconditions, and have runtime
oracle/edge-case checks in `scripts/test-algorithms.cjs`. Do not silently emit
another language. Keep scanner/trigger logic free of VS Code dependencies.

Run `npm run check` and `npm run test:integration` before submitting changes.
Use F5 to test manually, including cancellation, indentation, settings, undo,
and language changes. Update the README support table and changelog with features.
Never put tokens or private source in fixtures or bug reports.

The icon is generated deterministically with `node scripts/build-icon.cjs`.
