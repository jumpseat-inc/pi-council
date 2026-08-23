# pi-council — Generalized Council Extension for pi

**Date:** 2026-08-23
**Status:** Approved design, pending implementation plan
**Origin:** Extracted and generalized from the working council extension in `ev-guide/.pi/extensions/council/`

## Goal

Package the ev-guide Council — a multi-agent deliberation/delivery system with an
integrated LLM wiki — as an installable pi extension so any repository can adopt
the identical workflow with:

```bash
pi install git:github.com/tistaharahap/pi-council
```

followed by one in-repo command:

```
/council-init
```

The workflow's opinions (seats, procedures, wiki schema) are correct as-is and
ship with the package. Only per-project *data* stays repo-local.

## Background

The source system has two opinionated workflows and one data layer:

1. **The Council** — a facilitator-driven loop (deliberation → owner implements →
   skeptic verifies → judge rules), with autonomous epic delivery via
   `council-runner`. Implemented by ~600 lines of TypeScript (the engine) plus
   markdown seats and procedures.
2. **The LLM wiki** — a three-layer knowledge base (`vault/raw/` immutable
   sources → `vault/wiki/` generated pages → `vault/CLAUDE.md` schema). The three
   `/wiki-*` procedures are thin drivers; all operating logic lives in the schema
   file, which is already fully generic.
3. **Per-repo data** — `council/` (board.md, cards/) and `vault/` contents.

The council↔wiki flywheel is a feature: rulings land in `vault/raw/` as
`*-rulings.md`, `/wiki-ingest` files them into the wiki, and seats ground later
positions through the wiki. Both halves ship together so this works identically
in a fresh repo.

## Package layout

```
pi-council/
├── package.json               # "pi": { "extensions": ["./extensions"] }
│                              # keywords: ["pi-package"]
├── extensions/                # engine, auto-discovered .ts files
│   ├── index.ts               # entry: parent/child mode split, widget,
│   │                          #   command registration, max-tokens patch
│   ├── hub.ts                 # job table, spawn/monitor/stall-kill/pid-sweep,
│   │                          #   JSON stream parsing (unchanged from source)
│   ├── hub-tools.ts           # council_dispatch / council_wait / council_cancel
│   ├── seats.ts               # seat frontmatter parser, tool-grant map,
│   │                          #   system prompt builder
│   └── child.ts               # seat sandboxing via tool_call blocking,
│                              #   recursive dispatch grants
├── test/                      # ported suite + new coverage (see Testing)
└── council/                   # the opinionated payload, loaded from the package dir
    ├── agents/*.md            # 8 seats (consolidator, council-runner, designer,
    │                          #   judge, owner, principal, product-owner,
    │                          #   skeptic, steward) minus autoloadSkills lines
    ├── procedures/*.md        # 7 procedures: council, board-create-card,
    │                          #   features-new, features-deliver, wiki-ingest,
    │                          #   wiki-lint, wiki-query
    └── scaffold/
        ├── council/           # board.md, cards/_template.md, preflight.sh,
        │                      #   validate.py
        └── vault/             # CLAUDE.md (generic schema), wiki/index.md,
                               #   wiki/log.md
```

### package.json

- `name`: `pi-council`
- `keywords`: `["pi-package"]`
- `pi`: `{ "extensions": ["./extensions"] }`
- `peerDependencies` with `"*"` ranges for bundled pi modules:
  `@earendil-works/pi-coding-agent`, `typebox`. No runtime npm dependencies.

## Resource resolution

All payload lookups resolve in this order (first hit wins):

1. **Repo override**: `<repo>/$CONFIG_DIR_NAME/agents/<name>.md` for seats;
   `<repo>/$CONFIG_DIR_NAME/council/procedures/<file>.md` for procedures.
2. **Packaged default**: `<packageRoot>/council/agents|procedures/…`.

`<packageRoot>` is resolved at runtime from `import.meta.url` of the engine
modules — never from hardcoded clone paths (`~/.pi/agent/git/...` differs from
project-local `.pi/git/...` installs).

All repo-local paths are constructed with `CONFIG_DIR_NAME` (exported by pi),
never a literal `.pi`.

## Grounding model (replaces autoloadSkills)

The repo-local `ev-guide` skill dependency is removed entirely.

- The `autoloadSkills` field is dropped from the seat schema (`seats.ts`) and
  stripped from all shipped seat files.
- `buildSystemPrompt` appends an engine-owned `<repository_grounding>` block to
  **every** seat prompt when `<repo>/vault/wiki/index.md` exists:
  > "This repository maintains an LLM wiki at `vault/`. Before taking positions
  > on how this codebase works, read `vault/wiki/index.md` and drill into the
  > relevant pages. Cite pages you used. If the wiki doesn't cover something you
  > would otherwise assume, say so."
- When no vault exists, the block degrades to a single line:
  > "No repository wiki found; ground claims in the actual code before asserting
  > them."
- Seats keep their existing Read/Grep grants; consulting the wiki requires no new
  permissions.

## Runtime-path substitution in procedures

`council-runner`'s prompt instructs reading other procedure files by path. That
path must survive both install scopes. Fix:

- `buildSystemPrompt` appends a `<council_runtime>` block containing the resolved
  absolute procedures directory.
- Shipped procedure texts reference `$COUNCIL_PROCEDURES` where a concrete path
  is needed; the engine substitutes the resolved directory at command-load /
  dispatch time (same mechanism as `$ARGUMENTS`).

## Commands

Registered from a **directory scan**, not a hardcoded list:

- Packaged + overridden procedures register as slash commands using filename as
  command name; frontmatter `description` becomes the command description;
  `$ARGUMENTS` and `$COUNCIL_PROCEDURES` are substituted before
  `pi.sendUserMessage`.
- Engine commands: `/council-jobs` (job table, unchanged behavior).
- New `/council-init`: scaffolds both data trees into the current repo.
  - Copies `scaffold/council/*` → `<repo>/council/` and `scaffold/vault/*` →
    `<repo>/vault/`.
  - **Non-clobbering**: creates missing files only; existing files are never
    touched (re-running on ev-guide or an initialized repo is a no-op).
  - Creates empty dirs: `council/cards/`, `vault/raw/`, `vault/wiki/sources/`.
  - Reports created vs skipped paths.

## Engine changes from source

1. `PID_FILE_REL` moves out of the extension source dir →
   `<repo>/$CONFIG_DIR_NAME/council/.pids.json`.
2. Tool descriptions neutralized: remove repo-specific dispatch-time advice
   ("use 45 for the owner's implementation dispatch"); replace with generic
   guidance ("increase for long implementation tasks").
3. DeepSeek/OpenRouter output-token floor patch (`MAX_TOKENS_FLOOR`) stays — it
   travels with the seats' pinned models — as a small table near the top of the
   entry file with a comment explaining why.
4. Seat grant vocabulary stays as-is (`Read/Grep/Glob/Edit/Write/Bash/task/hub`
   omp-style names); the `BUILTIN_MAP` compat shim remains in `seats.ts`.
5. Child mode (`COUNCIL_SEAT` env var) unchanged except seat resolution now uses
   the override-aware loader.

## Out of scope

- No changes to hub semantics (stall/timeout/kill behavior, pid sweep).
- No new seats, no edits to seat bodies beyond removing `autoloadSkills:` lines.
- No changes to procedure logic beyond path-substitution wording and removal of
  references to repo-local skill files.
- No npm publishing (git installs only, per the target install command).

## Testing

Port the existing suite (`hub.test.ts`, `seats.test.ts`, `child.test.ts`,
`integration.test.ts`, `stub-child.ts`) with paths parameterized, and add:

1. **Override resolution** — repo-local seat/procedure shadows packaged one;
   packaged one used when no override exists.
2. **Scaffold idempotency** — first run creates everything; second run creates
   nothing and reports skips; pre-existing user-modified file survives untouched.
3. **Grounding injection** — block appended with vault present (full text), absent
   (degraded line); prompt contains no `autoloadSkills` remnants.
4. **Substitution** — `$ARGUMENTS` and `$COUNCIL_PROCEDURES` replaced correctly
   in registered commands and dispatched prompts.
5. **Child mode under overrides** — child resolves an overridden seat.

## Success criteria

- `pi install git:github.com/tistaharahap/pi-council` into a clean global config,
  then `/council-init` in any repo, yields a working `/board-create-card` →
  `/council` run and working `/wiki-*` commands.
- Reinstalling over ev-guide breaks nothing: its existing `council/` and
  `vault/` data is preserved verbatim, and repo behavior matches today's.
