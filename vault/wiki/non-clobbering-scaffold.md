---
title: Non-Clobbering Scaffold
type: concept
summary: `/council-init` copies the council/ and vault/ data trees and default mcp.json into a consumer repo, never overwriting — re-runs are no-ops and user edits always win.
aliases: [scaffold, council-init]
tags: [pi-council/concept]
sources: ["[[2026-08-23-council-json-override]]", "[[2026-08-24-ask-user-question]]", "[[2026-09-21-epic14-run-ledger]]"]
created: 2026-08-23
updated: 2026-09-21
---

> ⚠️ Derived from `extensions/index.ts` (`council-init`), `extensions/scaffold.ts`, and the scaffold assets (captured 2026-08-23). Verify against `scaffold.ts`.

`/council-init` is how a fresh repository adopts the workflow. It does two things:

1. **Ensures the council dependencies are pinned project-locally** (see
   [[council-dependencies]]) — installs `pi install -l <source>` for each
   missing one, then tells you to `/reload`.
2. **Scaffolds the council/ + vault/ data trees** via `scaffoldInto` (see below).

## scaffoldInto — the non-clobbering rule

```ts
scaffoldInto(repoRoot, path.join(PKG_ROOT, "council", "scaffold"))
```

Copies `<package>/council/scaffold/…` → `<repo>/`, recursing directories and
copying files **only when the destination does not exist**. Existing files are
reported in `skipped` and left byte-for-byte untouched.

- **`preflight.sh`** is special-cased: its `@CONFIG_DIR@` placeholders are
  rendered in at copy time.
- **`.council.json`** — seeded at the repo root with every seat's default
  model + thinking (split out of frontmatter), so a fresh repo gets a
  discoverable tuning file (see [[council-config]]). Also non-clobbering.
- **Empty dirs** created: `vault/raw`, `vault/wiki/sources`.
- **Default MCP config** — writes `.pi/council/mcp.json` registering context7 +
  tavily (OAuth), also non-clobbering (a consumer's file wins).

Re-running on an already-initialized repo is a **no-op** — this is what protects
the consumer's data (e.g. a consumer's board and wiki) across reinstalls.

## The consequence: scaffold reach vs packaged reach (EPIC-14)

Because `scaffoldInto` never overwrites, a repo already `/council-init`-ed keeps
its **frozen copy** of every data-class file — including `council/preflight.sh`.
A check added to the scaffold `preflight.sh` therefore reaches only **fresh**
consumers and silently misses every existing one. The rule this produced (EV-76,
[[2026-09-21-epic14-run-ledger]]): **a check that must reach existing consumers
belongs on a packaged, override-resolved path** — a packaged procedure or tool
(for the run-start gate-credential check, the `council_preflight` tool invoked by
`council/procedures/council.md` step 0 and `features-deliver.md` Phase 0), not in
a scaffold-copied script. Tooling-class files (`validate.py`, `cards/_template.md`)
are the consent-gated exception, refreshed only by [[council-update]].

## Related

- [[council-dependencies]], [[engineering-board]], [[pi-council-overview]]
- [[council-config]] — the scaffolded .council.json (v0.7.0)
- [[council-update]] — the consent-gated refresh path for tooling-class files
- [[preflight]] — the scaffold-vs-packaged reach distinction (EPIC-14)
- [[2026-08-23-council-json-override]], [[2026-08-23-pi-council-design-spec]] (council-init section)

## Sources

- `extensions/scaffold.ts`, `extensions/index.ts`
- `council/scaffold/**`