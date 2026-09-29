# Architecture

## High-level design

AlgoSnap is an offline VS Code extension. Each installation has its own runtime;
there is no shared server, database, queue, or traffic-serving tier.

```text
Command / editor event
        |
Trigger controller (debounce, edit filtering, cancellation)
        |
Immutable editor snapshot (document, version, selection, range)
        |
Lexical scanner -> name suggestions
        |
Algorithm registry -> picker -> language renderer
        |
Snapshot validation -> linked snippet -> one editor transaction
```

## Components and boundaries

- `scanner.ts`: pure lexical masking, declaration heuristics, collision avoidance.
- `templates.ts`: typed algorithm/variant definitions and all language bodies.
- `trigger.ts`: exact alias matching and a disposable debounce timer.
- `extension.ts`: VS Code events, settings, picker lifecycle, document snapshots,
  snippet encoding, and insertion. Only this production module imports `vscode`.

The registry is the source of truth for both automatic triggers and the manual
picker. Renderers only receive plain context data; they never access the editor.
Templates have stable IDs usable as command arguments in custom keybindings.
Literal snippet content is escaped, and parameter names share tab stops.

## Correctness and concurrency

Only one picker is active. Every source change invalidates its token; a saved
document version and selection are rechecked immediately before insertion.
Automatic triggers require a one-character insertion and a full keyword-only
line. Manual insertion requires a single cursor on a blank line. This avoids
replacing existing selections or partial expressions. Imports are documented
instead of inserted at an unknown syntactic position.

## Performance and security

The hot event path checks metadata before scheduling work. Scanning occurs only
after a pause, on a candidate keyword; prefixes above 200,000 characters are
declined. No recursive traversal, workspace search, arbitrary execution, or
runtime network calls occur. The scanner uses linear lexical traversal plus a
small set of declaration patterns. Candidate names are suggestions, not resolved
symbols. No source contents are logged or persisted by the extension.

## Validation

Pure tests cover masking, names, alias matching, limits, and debounce cancellation.
Generated code is compiled/executed in all three languages, with edge cases and
independent reference checks. Integration tests run inside VS Code and cover
activation, actual snippets, undo, indentation, automatic triggers, and stale edits.

## Future work

Add scope-aware parsing only after measuring heuristic failures. For more
algorithms, split template families into modules behind the same registry.
Optional team sync would justify an authenticated API and database; it would be
a separate feature with an explicit privacy model. Current insertion needs no
server scaling or backend rate limiter.
