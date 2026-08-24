---
title: 2026-08-24 ask-user-question dependency
type: source
summary: The addition of the rpiv-ask-user-question extension as a second project-local dependency — superpowers.ts generalized into a COUNCIL_DEPENDENCIES list, /council-init installs both, and preflight asserts both.
aliases: [ask-user-question addition, rpiv-ask-user-question]
tags: [pi-council/source]
sources: []
created: 2026-08-24
updated: 2026-08-24
---

> ⚠️ Derived from the uncommitted working-tree change over `extensions/dependencies.ts`
> (formerly `superpowers.ts`), `extensions/index.ts` (`council-init`),
> `council/scaffold/council/preflight.sh`, `council/procedures/features-new.md`, and
> `README.md` (captured 2026-08-24). Verify against those files.

The council gained a second scaffold-pinned, project-local dependency: the
`rpiv-ask-user-question` extension (`npm:@juicesharp/rpiv-ask-user-question`).
The engine generalized from one hard-coded superpowers dependency to a list.

## What changed

1. **`COUNCIL_DEPENDENCIES`** in `extensions/dependencies.ts` (renamed from
   `superpowers.ts`) lists both packages — superpowers (git) and
   ask-user-question (npm) — each with a `source`, `label`, and `kind`.
2. **Generalized resolver** — `resolveSuperpowers` became
   `resolveDependency`/`resolveCouncilDependencies`, still project-entry-wins
   with `portable` meaning the project-local pin is present.
3. **`/council-init`** iterates the list, installing each missing dependency
   via `pi install -l <source>` (see [[non-clobbering-scaffold]]).
4. **Preflight gate** — a new ask-user-question assertion: clone under
   `$CONFIG_DIR_NAME/npm/node_modules/@juicesharp/rpiv-ask-user-question` or a
   pin in `$CONFIG_DIR_NAME/settings.json` (see [[preflight]]).
5. **`/features-new` step 0** — "Superpowers gate" → "Dependencies gate",
   checking both pins.
6. **README** — Installing + Commands updated; `.pi/npm/` added to the
   git-ignore guidance (pi-managed).

## Takeaway

A "scaffold-pinned project-local dependency" is now a first-class list, not a
special case. Adding a third dependency is a `COUNCIL_DEPENDENCIES` entry plus
a preflight gate.

## Related

- [[council-dependencies]], [[ask-user-question]]
- [[preflight]], [[non-clobbering-scaffold]]

## Sources

- `extensions/dependencies.ts`, `extensions/index.ts`
- `council/scaffold/council/preflight.sh`, `council/procedures/features-new.md`, `README.md`
