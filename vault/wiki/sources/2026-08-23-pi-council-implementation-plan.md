---
title: 2026-08-23 Pi-council Implementation Plan
type: source
summary: The task-by-array of steps to turn the pi-council design spec into the package — the authoritative engineering runbook (9 seats, 7 procedures, ported tests, override/scaffold/grounding/substitution coverage).
tags: [pi-council/source]
sources: []
created: 2026-08-23
updated: 2026-08-23
---

> ⚠️ Derived from `docs/superpowers/plans/2026-08-23-pi-council-implementation.md` @ `d411a12` (captured 2026-08-23).

The execution plan behind v0.1.0. Where the design spec says *what*, this says
*how, task by task*, with checkbox progress and per-task failing-tests-first.

## What it covers

- **Global constraints** — vendor from `$SRC` (read-only); seats ship verbatim
  **except** deleting `autoloadSkills:` + replacing the five mechanism-
  loading sentences; `CONFIG_DIR_NAME`; `PKG_ROOT` from `import.meta.url`;
  `hub.ts`/`stub-child.ts`/`child.ts` verbatim; every task ends green + commit.
- **Target layout** — the full `extensions/` + `council/` + `test/` tree.
- **Tasks** — scaffold assets + non-clobbering `scaffoldInto`; the council test
  set (hub, seats, overrides, scaffold idempotency, grounding injection,
  substitution, child-mode-with-overrides); the two scopes of the extension
  entry (parent/child), scanned commands, widget, jobs table.
- **Repository docs** — implementation plans were themselves accompanied by
  docs twin commits.

## How it works

- Tool grant vocabulary and `BUILTIN_MAP` stay exactly as source.
- `package.json` `keywords: ["pi-package"]` remains for gallery discoverability.
- Assumes superpowers-ecosystem but the *requirement* of superpowers arrives
  later (v0.6.0).

## Related

- [[2026-08-23-pi-council-design-spec]] — the design this implements
- [[pi-council-overview]], [[seats]], [[non-clobbering-scaffold]]
- [[pi-council-overview]] — the v0.1.0 result of this plan

## Sources

- `docs/superpowers/plans/2026-08-23-pi-council-implementation.md` @ `d411a12`