---
title: Non-Clobbering Scaffold
type: concept
summary: `/council-init` copies the council/ and vault/ data trees and default mcp.json into a consumer repo, never overwriting — re-runs are no-ops and user edits always win.
aliases: [scaffold, council-init]
tags: [pi-council/concept]
sources: ["[[2026-08-23-council-json-override]]", "[[2026-08-24-ask-user-question]]", "[[2026-09-21-epic14-run-ledger]]", "[[2026-09-21-usages-design]]", "[[2026-09-22-fix-shape-witness-segment-liveness]]", "[[2026-09-22-epic15-run-ledger]]"]
created: 2026-08-23
updated: 2026-09-22
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

## Engine-synthesized copies: the usages skill (2026-09-21)

Not every consumer file comes from the `council/scaffold/` tree. The default
`mcp.json` was already synthesized in code; [[usages-report]] added a second
such path. Its procedure is **packaged** (reaching every consumer through the
procedure scan), but its skill + Python tool live in the package payload at
`council/skills/usages/` and `/council-init` copies them to
`<repo>/$CONFIG_DIR_NAME/skills/usages/` via `copyUsagesSkill`.

Properties that make this the right shape:

- **`CONFIG_DIR_NAME`-built destination** — no hardcoded `.pi` in a filesystem
  path (AGENTS convention #3); `@CONFIG_DIR@` is rendered at copy time with the
  same renderer `preflight.sh` uses.
- **Non-clobbering** — an existing consumer file is skipped, so a consumer can
  edit the skill without losing it.
- **Outside the scaffold tree** — deliberately not a `council/scaffold/` entry,
  so `TOOLING_FILES`/`DATA_FILES`, the T4 set-equality guard, and the
  `scaffold.json` provenance record are untouched. Like `mcp.json`, it carries
  no provenance and no [[council-update]] refresh path; refreshing means
  **update the pi-council package first, then delete
  `<repo>/$CONFIG_DIR_NAME/skills/usages/`, then re-run `/council-init`** —
  re-running alone is a no-op (T-USK1), and a recopy from a stale installed
  package loops the old tool back ([[usages-report]], EPIC-15).
- **A live-path segment the shape witness must not red** — this destination is
  why [[retired-path-tokens|the shape witness's]] dir-token liveness became
  segment-aware: retiring `.agents/skills/**` emitted the suffix token
  `skills/`, which would have red the legitimate `skills/usages/SKILL.md`
  destination. See [[2026-09-22-fix-shape-witness-segment-liveness]].

This sharpens the EPIC-14 reach rule rather than contradicting it: **logic that
must reach existing consumers belongs on a packaged path** (here, the
procedure); a consumer-editable *copy* is for logic the consumer may own, and
`/council-init` is the only writer.

## Related

- [[council-dependencies]], [[engineering-board]], [[pi-council-overview]]
- [[council-config]] — the scaffolded .council.json (v0.7.0)
- [[council-update]] — the consent-gated refresh path for tooling-class files
- [[preflight]] — the scaffold-vs-packaged reach distinction (EPIC-14)
- [[2026-08-23-council-json-override]], [[2026-08-23-pi-council-design-spec]] (council-init section)

## Sources

- `extensions/scaffold.ts`, `extensions/index.ts`
- `council/scaffold/**`