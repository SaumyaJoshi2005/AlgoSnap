# Publishing AlgoSnap

The manifest uses the owner-provided publisher ID `SaumyaJoshi2005`.
The package is not yet published. Never paste access tokens into chat or Git.
Before merging or publishing, reconcile the additional BFS, DP, tree, graph,
and data-structure templates on `main` with this ZIP-based release candidate.
See draft PR #1: https://github.com/SaumyaJoshi2005/AlgoSnap/pull/1.

1. Sign in to [Marketplace publisher management](https://marketplace.visualstudio.com/manage)
   with the Microsoft account that owns publisher `SaumyaJoshi2005`.
2. Verify the publisher ID exactly matches `package.json` and that the repository
   URL is public and correct. The local release check validates configuration;
   it does not authenticate publisher ownership.
3. Review the MIT license and release notes. Commit the clean source and lockfile
   to `https://github.com/SaumyaJoshi2005/AlgoSnap`. The repository inspected at
   commit `070ca0f3ae2f19680e7c52c77ccf838911cc312f` already has `src/`, but tracks
   generated `out/*.js` despite ignoring `out`. In your checkout, after reviewing
   the changes, use `git rm --cached -r out` to stop tracking generated files while
   keeping them locally. The updated `.gitignore` also allows `.vscode/` launch
   and task configurations to be committed. Preserve unrelated/newer work.
4. Run `npm ci`, `npm run check`, `npm run test:integration`, and
   `npm run release:check`.
5. Run `npm run package`. Install the resulting VSIX in a clean VS Code profile
   and perform the manual checks below.
6. Upload that VSIX in the publisher management page, or use authenticated
   `npm run publish:marketplace`. The script refuses the placeholder identity.
7. Confirm Marketplace listing/installation, then tag the tested commit and
   attach the VSIX to a GitHub release if desired.

Use Microsoft's [current publishing guide](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
for authentication. Credentials stay in local tooling/secret storage, never in
the repository. CI builds a VSIX artifact but does not automatically publish.

## Manual release checks

- F5 starts the Extension Development Host without a setup prompt.
- Open Python/C++/Java and type a keyword without first invoking the command.
- Verify Tab-renaming, indentation, a single undo for insertion, and Escape.
- Move the cursor or edit while the picker is open: no stale insertion occurs.
- Comments, pasted keywords, unsupported files, and selections stay untouched.
- Turn off auto-trigger in settings; the manual command still works.
- Read the support/precondition table and verify the listing uses the real publisher.

Changing publisher changes the extension ID. Uninstall `algosnap-local.algosnap`
before installing the public version so both copies do not register commands.
The Marketplace can require a different package name if `algosnap` is unavailable;
update `name`, references, and release documentation together if so.
