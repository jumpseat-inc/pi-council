---
title: Theme Module Resolution Fix (v0.12.1)
type: source
summary: The council theme silently never activated in an installed package — loadPiThemeModule located pi's module via import.meta.resolve, a bare-specifier filesystem walk that bypasses pi's extension remap and finds no @earendil-works/pi-coding-agent in an installed plugin's node_modules. Fixed by walking pi's install root via the public getPackageDir() API.
aliases: [theme module resolution bug, cannot find module pi-coding-agent, theme activation warning, v0.12.1 theme fix]
tags: [pi-council/bugfix, pi-council/council-theme, pi-council/pi-package]
sources: ["[[council-theme]]", "[[pi-council-overview]]"]
created: 2026-08-26
updated: 2026-08-26
---

# Theme Module Resolution Fix — v0.12.1

A bugfix source: with the `theme` section enabled in `.council.json`, the
council theme **never actually activated** in an installed pi package. The
only symptom was a warning notify — `council theme: Cannot find module
'@earendil-works/pi-coding-agent'` — because activation wraps everything in
try/catch. The bug, its root cause, and the fix are documented here.

## The bug

`extensions/theme-activation.ts` — `loadPiThemeModule()` — located pi's real
theme module (the internal `Theme` class plus helpers pi does **not** export
publicly from its entry) via:

```ts
const resolved = import.meta.resolve("@earendil-works/pi-coding-agent");
const dist = path.dirname(fileURLToPath(resolved));
// … walk into dist/modes/interactive/theme/theme.js
```

`import.meta.resolve` is a raw **filesystem** module-resolution walk that
looks in `node_modules` **up from the calling file's on-disk path**. That
fails in an installed package.

## Root cause

The plugin clone lives at `~/.pi/agent/git/<owner>/pi-council/`, whose
`node_modules` does **not** contain `@earendil-works/pi-coding-agent` — it is
a `peerDependency`, never materialized on disk. So the bare-specifier walk
threw `Cannot find module`.

Crucially, the **top-level** `import … from "@earendil-works/pi-coding-agent"`
works fine — pi's extension loader (jiti) **remaps** that specifier to pi's
**bundled** copy via `virtualModules`/`alias`. `import.meta.resolve()` is a
plain filesystem walker that **bypasses that remap**. The two different
mechanisms are why tests pass (the devDependency is in the repo's own
`node_modules`) but the shipped package failed. The theme module import sits
inside an async function (not the module top level), so the failure surfaced
as a notify at run time instead of a load error, and the in-memory Theme was
simply never built/applied.

## The fix

Locate pi's own install root with pi's **public** `getPackageDir()` API —
stable across npm/tsx/bun-binary installs — and walk into
`dist/modes/interactive/theme/theme.js`:

- New pure `resolveThemeJsPath(packageDir)` returns the on-disk `theme.js`
  path under pi's install root (`dist` build) or `theme.ts` (`src`/tsx), or
  `null` for a bun-binary install.
- `loadPiThemeModule()` imports that path with `pathToFileURL`. On a bun
  binary the module is bundled (not on disk), so it falls back to the
  public `Theme` identity and marks the internal-only helpers optional.
- The same broken pattern in the test-only `test/theme-loader.ts` was fixed
  identically.
- A regression test pins resolution through `getPackageDir()` rather than
  bare-specifier `import.meta.resolve`.

This is a reusable **pi-package invariant**: resolve pi's own internals via
the public `getPackageDir()` and walk into `dist/…` — never via a bare
specifier, which pi's extension remap does not cover at runtime.

## Related

- [[council-theme]] — the activation flash
- [[pi-council-overview]] — the v0.12.1 row in the release arc
- [[headless-pi]], [[council-config]] — contexts where activation runs

## Sources

- `extensions/theme-activation.ts`, `extensions/theme-loader.ts`,
  `test/*.ts` (the diff), `package.json`
- Commit `392dce7` (`fix(theme): resolve council theme module via stable
  getPackageDir`), v0.12.1 on `main` (tag pending at ingest time)