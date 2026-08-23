# AGENTS.md

Guidance for AI coding agents working in this repository.

## What this repo is

`pi-council` is a pi package: an engine (`extensions/*.ts`), an opinionated
payload (`council/agents/*.md`, `council/procedures/*.md`), and repo-scaffolding
templates (`council/scaffold/`). It was extracted from a working council
extension in a sibling repository; the workflow's opinions are deliberate —
they are the product.

## Commands

```bash
bun install          # set up deps
bun test             # full suite; 34 tests, 1 skipped unless COUNCIL_INTEGRATION=1
bun test test/hub.test.ts   # single file
bunx tsc --noEmit    # typecheck (strict)
```

The integration test performs a real model dispatch and needs network +
OpenRouter credentials: `COUNCIL_INTEGRATION=1 bun test test/integration.test.ts`.

## Layout

```
extensions/          engine, auto-discovered via package.json "pi" manifest
  index.ts           entry: parent/child mode split, command registration
  hub.ts             job supervisor — spawn/monitor/stall-kill/pid-sweep
  hub-tools.ts       council_dispatch / council_wait / council_cancel tools
  seats.ts           seat schema, override-aware resolution, prompt builder
  child.ts           child-mode tool sandboxing
  scaffold.ts        non-clobbering scaffold copy routine
council/
  agents/*.md        the 9 seats
  procedures/*.md    the 7 slash-command procedures
  scaffold/          templates copied by /council-init into consumer repos
test/                bun:test suite
docs/superpowers/    design spec + implementation plan (read before big changes)
```

## Hard conventions

1. **Seats are opinionated on purpose.** The domain prose in
   `council/agents/*.md` (PETA SPKLU examples, portfolio doctrine, gate
   discipline) is the product, not an accident. Do not generalize, soften, or
   "clean up" seat bodies. The only sanctioned mechanism edits are the
   wiki-grounding pointers already in place.
2. **Seat schema is fixed**: frontmatter fields are `name`, `description`,
   `model` (optional `:thinking` suffix), `tools`, `spawns`. There is no
   `autoloadSkills` — grounding comes from the `<repository_grounding>` block
   that `buildSystemPrompt` appends. Do not reintroduce a skill mechanism.
3. **No hardcoded `.pi`.** Repo-local paths must use `CONFIG_DIR_NAME` from
   `@earendil-works/pi-coding-agent`.
4. **No hardcoded clone paths.** The package resolves its own root via
   `import.meta.url` (`PKG_ROOT` in `seats.ts`). Never construct
   `~/.pi/agent/git/...` or `.pi/git/...` paths by hand.
5. **Override semantics**: repo-local resources shadow packaged ones by
   filename (`<repo>/$CONFIG_DIR_NAME/agents/`, `<repo>/$CONFIG_DIR_NAME/council/procedures/`).
   Any new resource type must follow this pattern.
6. **Scaffold writes are non-clobbering.** `scaffoldInto` never overwrites an
   existing file. Preserve this invariant — consumer repos hold user-modified
   data (ev-guide's board and wiki must survive reinstalls).
7. **`hub.ts` is stable.** Its stall/timeout/kill semantics are battle-tested.
   Change behavior only with a failing test first.
8. **Tool-grant vocabulary** in seat frontmatter uses the omp-style names
   (`Read`, `Grep`, `Glob`, `Edit`, `Write`, `Bash`, `task`, `hub`) mapped to
   pi built-ins by `BUILTIN_MAP` in `seats.ts`. Don't rename it casually —
   shipped seats and overrides both speak it.
9. **Model output floors are data**: `council/model-floors.json` maps model id
   → minimum output tokens, compensating for wrong catalogue metadata (today
   exactly one entry: `deepseek/deepseek-v4-pro-0813` → 131072). Add entries
   only when a model demonstrably dies with `stopReason=length` mid-thinking;
   repos may extend/override via `$CONFIG_DIR_NAME/council/model-floors.json`
   (merge semantics, repo keys win).
10. **MCP secrets never go in `mcp.json`** — header values entered via
    `/mcp login` and all OAuth tokens live in `getAgentDir()/council/mcp-auth.json`
    (0600, atomic writes). `$ENV_VAR` indirection in `mcp.json` resolves at
    connect time and is never persisted resolved.
11. **`--tools` is an exact-name allowlist** — seat children receive granted
    MCP tool names (`mcp__<server>__<tool>`) enumerated by the parent at
    dispatch time; seats register them eagerly at startup. Never reintroduce
    lazy MCP connect in seats.

## Commits

- Commit messages **MUST** follow the [Conventional Commits](https://www.conventionalcommits.org)
  format: `type(scope): short imperative summary` (e.g. `feat(mcp): ...`,
  `docs: ...`, `fix(hub): ...`). Scope is optional.
- Rewriting history is forbidden on `main`; the git history is the release
  record — wip/nonsense commits on `main` are a contract violation.
- Breaking changes must use `!` (e.g. `feat!: ...`) and be mirrored in the
  `version` bump (semver). Bump `version` in `package.json` in the same PR as
  the behavior change.

## Testing conventions

- Tests use `bun:test`, live in `test/`, and import engine modules via
  relative paths (`../extensions/seats.ts`).
- Anything touching the repo filesystem takes `repoRoot` as a parameter — tests
  pass a fresh `fs.mkdtempSync` dir, never the real repo. Packaged resources
  resolve through `PKG_ROOT`, so tests exercise the real seats/procedures.
- New behavior needs a failing test first (TDD); keep the suite green per task.
- The integration test is the only network-touching test and must stay gated.

## Adding a seat or procedure

1. Add `council/agents/<name>.md` (seat) or `council/procedures/<name>.md`
   (procedure). Procedures are picked up by directory scan — filename becomes
   the slash command; frontmatter `description` (and optional `argument-hint`)
   drive the command description; `$ARGUMENTS` and `$COUNCIL_PROCEDURES` are
   substituted at invocation.
2. Update `test/seats.test.ts`'s seat-count/name assertions if you added a seat.
3. Keep frontmatter minimal and consistent with the existing files.

## Release notes

- `pi install git:github.com/tistaharahap/pi-council[@ref]` pins git refs. Note
  `pi install` defaults to user scope (`~/.pi/agent/settings.json`, clone under
  `~/.pi/agent/git/...`); `-l` makes it project-local (`.pi/settings.json`,
  `.pi/git/...`). Same package in both scopes → project entry wins. Bump
  `version` in `package.json` when the payload or engine behavior changes.
- `keywords: ["pi-package"]` must stay for gallery discoverability.
