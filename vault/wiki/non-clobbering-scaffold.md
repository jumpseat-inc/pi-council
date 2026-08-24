---
title: Non-Clobbering Scaffold
type: concept
summary: `/council-init` copies the council/ and vault/ data trees and default mcp.json into a consumer repo, never overwriting — re-runs are no-ops and user edits always win.
aliases: [scaffold, council-init]
tags: [pi-council/concept]
sources: ["[[2026-08-23-council-json-override]]"]
created: 2026-08-23
updated: 2026-08-23
---

> ⚠️ Derived from `extensions/index.ts` (`council-init`), `extensions/scaffold.ts`, and the scaffold assets @ (captured 2026-08-23). Verify against `scaffold.ts`.

`/council-init` is how a fresh repository adopts the workflow. It does two things:

1. **Ensures the superpowers skills package is pinned project-locally** (see
   [[superpowers-dependency]]) — installs `pi install -l git:...superpowers` if
   not present, then tells you to `/reload`.
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
the consumer's data (e.g. ev-guide's board and wiki) across reinstalls.

## Related

- [[superpowers-dependency]], [[engineering-board]], [[pi-council-overview]]
- [[council-config]] — the scaffolded .council.json (v0.7.0)
- [[2026-08-23-council-json-override]], [[2026-08-23-pi-council-design-spec]] (council-init section)

## Sources

- `extensions/scaffold.ts`, `extensions/index.ts`
- `council/scaffold/**`