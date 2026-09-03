---
title: Procedure Commands
type: concept
summary: The scanned, override-aware slash-command set — preamble customization, seven packaged procedures (council, board, features, wiki), and the hub/mcp engine commands.
aliases: [procedures, slash commands, commands]
tags: [pi-council/concept]
sources: ["[[2026-08-24-bugfix-seat-prose]]"]
created: 2026-08-23
updated: 2026-09-04
---

# Procedure Commands

> ⚠️ Derived from `extensions/index.ts` (the directory-scan registration loop) and
> the seven `council/procedures/*.md` files (captured 2026-08-23). Verify against
> `extensions/index.ts`.

Procedures are **markdown files**, registered as slash commands by **directory
scan**, not a hardcoded list. A file's base filename becomes the command name;
its `description` frontmatter (plus optional `argument-hint`) drives the command
description.

## Registration mechanics (`extensions/index.ts`)

- Walks `[repoOverride, packaged]`, dedupe by filename → an override shadows the
  packaged file of the same name (see [[override-resolution]]).
- The override path is built with `CONFIG_DIR_NAME` (not a literal `.pi`), per
  AGENTS.md convention #3.
- Strips the frontmatter; substitutes `$ARGUMENTS` and `$COUNCIL_PROCEDURES`
  before `pi.sendUserMessage`.
- The engine commands (`/council-init`, `/council-jobs`, `/mcp …`) are registered
  alongside; the wiki commands (`/wiki-ingest/-:query/-lint`) are procedures too.

## Headless dispatch (v0.10.0)

A procedure command's handler sends the rendered procedure via
`pi.sendUserMessage` — and in non-interactive modes (**print/json/rpc**) the
handler must **block until the dispatched turn completes**, or the runtime is
torn down before the turn runs. Before v0.10.0 the handler was fire-and-forget,
so `/council` was a **silent no-op** headlessly (TUI worked by luck of the
session staying alive). The extension `sendUserMessage` API resolves before the
turn runs, so the handler fires it, polls `ctx.isIdle()`, then awaits
`ctx.waitForIdle()` — see [[headless-pi]] and
[[2026-08-25-smoke-test-bugfixes]] bug 1.

## The seven packaged procedures

| Command | Purpose |
|---|---|
| `/council [card]` | The full deliberation → implement → verify → judge loop ([[council-loop]]) |
| `/board-create-card <desc>` | Draft + confirm + file a board card ([[engineering-board]]) |
| `/features-new <feature>` | Decompose a feature into an epic + child cards **by seated deliberation** (three waves — see [[three-wave-decomposition]], v0.15.0) |
| `/features-deliver <EPIC-KEY>` | Deliver an epic autonomously via council-runners |
| `/wiki-ingest <path>` | Ingest a source into the wiki (drives the Ingest op) |
| `/wiki-query <question>` | Query the wiki with citations |
| `/wiki-lint` | Health-check the wiki (orphans, contradictions, stale claims) |

## The `$COUNCIL_PROCEDURES` path

`buildSystemPrompt` injects a `<council_runtime>` block naming the absolute
procedures dir, so a seat prompt (like council-runner's) can read procedure
files relative to it. The `renderProcedure` substitution is the same mechanism
as `$ARGUMENTS`.

## Related

- [[override-resolution]], [[seats]], [[council-loop]]
- [[three-wave-decomposition]] — the v0.15.0 seated-decomposition rewrite of `/features-new`
- [[2026-08-23-pi-council-design-spec]]

## Sources

- `extensions/index.ts`
- `council/procedures/*.md`
- [[2026-08-24-bugfix-seat-prose]]