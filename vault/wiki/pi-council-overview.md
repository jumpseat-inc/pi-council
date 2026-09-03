---
title: pi-council Overview
type: overview
summary: pi-council is an installable pi package pairing a multi-agent Council deliberation/implementation loop with an LLM-maintained wiki — the workflow's opinions are the product.
aliases: [pi-council, council, the Council]
tags: [pi-council/overview]
sources: ["[[2026-08-23-readme]]", "[[2026-08-23-pi-council-design-spec]]", "[[2026-08-26-po-ev8-ruling]]", "[[2026-08-26-po-ev9-tiny-regime-floor]]", "[[2026-09-03-v0.14.0-domain-neutral-stack-agnostic]]"]
created: 2026-08-23
updated: 2026-09-04
---

`pi-council` (v0.15.0) is an installable [pi](https://pi.dev) package, distributed
as `pi install git:github.com/tistaharahap/pi-council`. Installing it once and
running `/council-init` gives **any** repository the same opinionated workflow:
a facilitator-driven Council of specialized seats that deliberates, implements,
verifies, and judges work on a card board — backed by an LLM-maintained wiki
under `vault/` so every run's knowledge compounds.

The workflow's opinions are deliberate and are the product: the seats'
procedural doctrine (portfolio authority, gate discipline, adversary
verification — as of v0.14.0, **domain-neutral and stack-agnostic**; product
grounding flows only through the `<repository_grounding>` block), the
board/card discipline, and the wiki schema ship as-is. Consumers tune via
**repo-local overrides** (a seat at `<repo>/.pi/agents/<name>.md` shadows the
packaged one), never by forking the package.

## The two engine halves

- **Parent mode** — the session that runs a repo. Registers commands
  (`/council`, `/council-init`, `/council-jobs`, `/mcp …`, the 7 procedure
  commands), the hub tools, the shared widget, and the output-token floor patch.
- **Child mode** — a seat dispatched by `council_dispatch` runs as an isolated
  headless `pi` process (`--mode json -p`), sandboxed to its granted tools,
  supervised by the hub. `COUNCIL_SOURCE` selects the seat.

## The loop

Work enters a board (`council/board.md`) as cards. `/council` runs a
facilitator-driven loop: bounded deliberation → single owner implements → the
sole Skeptic attacks and verifies → a fresh-context judge rules PASS/REJECT →
human merge gate → durable state written to the board and the wiki. Rulings
land in `vault/raw/` and get ingested, so decisions compound across cards.

See [[council-loop]], [[engineering-board]], and the nine [[seats]]+s.

## Versions

The release arc (from the git log on `main`) shows how quickly the engine
matured — the current count is 200+ commits, following
**[Conventional Commits]** with the `version` bumped in the same commit as each
behavior change:

| Version | What landed | See |
|---|---|---|
| v0.1.0 | Engine port, `/council-init`, scanned commands, 9 seats + 7 procedures | [[pi-council-overview]] |
| v0.2.0 | **MCP** support (registry, transports, auth, tool bridging) | [[mcp-support]] |
| v0.3.0 | **Context7 default** + structural preflight | [[preflight]] |
| v0.4.0 | **Tavily default**, preflight covers both servers | [[preflight]] |
| v0.5.0 | Preflight asserts OpenRouter provider auth | [[preflight]] |
| v0.6.0 | **Superpowers required** (project-local pin) | [[council-dependencies]] |
| v0.6.1 | Seats point at relevant skills | [[seats]] |
| v0.7.0 | **Per-repo seat model/thinking overrides** — committed `.council.json`, scaffold-seeded and non-clobbering | [[council-config]] |
| v0.7.1 | Bugfix: stale `deliver.md`/`GATE-EVIDENCE.md` references, hardcoded `.pi`, and "agent registry" framing | [[2026-08-24-bugfix-seat-prose]] |
| v0.8.0 | **ask-user-question dependency** — second project-local pin, generalized `COUNCIL_DEPENDENCIES` list + preflight gate | [[council-dependencies]] |
| v0.9.0 | **Council transcript navigator** — job forest from run manifests, live transcript viewer overlay | [[hub-job-supervision]] |
| v0.10.0 | **Unattended smoke test** + 3 engine bugfixes: headless-safe procedure dispatch, MCP startup hardening, hub tools exposed to seat children | [[smoke-test]], [[2026-08-25-smoke-test-bugfixes]] |
| v0.11.0 | **Remote MCP OAuth login** — two-phase copy-paste flow (`/mcp login --remote` + `/mcp auth`), persisted PKCE verifier, headless auto-detection; no tunnels | [[remote-oauth-login]], [[2026-08-25-remote-mcp-oauth]] |
| v0.11.1 | **Fix reused-client redirect-URI mismatch** — advertised URI derives from the client's registered `redirect_uris`, stale loopback clients re-register instead of failing with `invalid_request` | [[remote-oauth-login]], [[2026-08-25-remote-mcp-oauth-fix]] |
| v0.11.2 | **Live runtime refresh after login/auth** — `/mcp list` reflects credentials instead of stale `unauthenticated tools=0` until /reload | [[mcp-support]], [[2026-08-25-mcp-login-refresh]] |
| v0.11.3 | **Fix `/council-init` dep install on headless** — passes `--approve` to `pi install -l` when the project isn't trusted, so ask-user-question (etc.) pinning no longer fails with "Project is not trusted" | [[council-dependencies]], [[2026-08-25-council-init-approve]] |
| v0.11.4 | **Fix `/council-tree` readability** — full-screen modal (opaque backdrop + bordered panel) blocks the underlying session UI; long trees window to fit | [[run-transcripts]], [[2026-08-25-council-tree-modal]] |
| EPIC-1 (main) | **Council theme subsystem** — omp-palette dark/light pair, `.council.json` recolor surface, session-start activation, token-only drawing + live repaint. Landed on `main`; tagged as **v0.12.0** | [[council-theme]] |
| v0.12.0 | **Council theme + wiki ingest release** — the EPIC-1 theme epic now version-tagged; clean-green smoke run of the full loop + epic in a fresh container (`bun run smoke`, `EXIT=0`) | [[council-theme]], [[2026-08-26-smoke-v0.12.0]] |
| v0.12.1 | **Fix theme module resolution** — in an installed package the council theme silently never activated because `loadPiThemeModule` located pi's internal module via a bare-specifier `import.meta.resolve` that pi's extension remap does not cover; now walks pi's **own install root** via the public `getPackageDir()` API. Committed on `main` (commit `392dce7`); tagged v0.12.1 | [[council-theme]], [[2026-08-26-theme-module-resolution-fix]] |
| v0.13.0 | **Inline council job tree** — `/council-tree` now renders inline beneath the input bar (EV-7 per-row last activity), with editor-driven arrow-key focus (EV-8) and Enter opening the selected subagent's live inline progress (EV-9). Supersedes the v0.11.4 modal. Landed on `main` via PRs #7/#8/#9; released as v0.13.0 (commit `fae42f3`) | [[council-job-tree-inline]], [[2026-08-26-po-ev8-ruling]], [[2026-08-26-po-ev9-tiny-regime-floor]] |
| v0.14.0 | **Domain-neutral + stack-agnostic** — seats/procedures lose all hardcoded product domain (AGENTS.md convention #1 inverted) and Bun/TS stack assumptions (scaffold preflight invites the repo's own gates); 28 superseded specs/plans archived to wiki-pointing stubs; prose regression guards added (commits `d3a6f38`, `7d5bfa3`, `033f450`) | [[2026-09-03-v0.14.0-domain-neutral-stack-agnostic]] |

The wiki scaffold shipped in the same commit as the council scaffold — the
wiki is not an add-on. The full arc and commit-message discipline live in the
git log; this table is a secondary summary that can drift.

## Related

- [[council-config]] — the `.council.json` per-seat override file (now also hosts the theme section)
- [[council-theme]] — the EPIC-1 omp-palette theme subsystem
- [[council-job-tree-inline]] — the EPIC-2 inline job-tree surface (EV-7/8/9)
- [[three-wave-decomposition]] — the EPIC-3 seated-decomposition rewrite of /features-new
- [[presented-never-written]] — the two-part gate presentation (attribution-free Part 1, ledger Part 2)
- [[card-id-allocation]] — the id-collision/union-merge discipline from the EPIC-3 run
- [[2026-09-04-epic3-run-ledger]] — the EPIC-3 run record (v0.15.0)
- [[smoke-test]] — the unattended end-to-end test (the v0.12.0 run was a clean green)
- [[2026-08-26-smoke-v0.12.0]] — the v0.12.0 smoke-test record
- [[seats]] — the 9 Council entities
- [[council-loop]] — the deliberation → implement → verify → judge procedure
- [[llm-wiki]] — the schema pattern the vault follows
- [[mcp-support]], [[hub-job-supervision]], [[headless-pi]] — the engine subsystems
- [[remote-oauth-login]] — the v0.11.0 copy-paste OAuth pattern for headless agents
- [[2026-08-25-remote-mcp-oauth-fix]] — the v0.11.1 redirect-URI fix
- [[2026-08-25-mcp-login-refresh]] — the v0.11.2 live-runtime-refresh fix
- [[2026-08-25-council-init-approve]] — the v0.11.3 /council-init --approve fix
- [[2026-08-25-council-tree-modal]] — the v0.11.4 /council-tree modal fix

## Sources

- `README.md`, [[2026-08-23-readme]]
- `docs/superpowers/specs/2026-08-23-pi-council-design.md` → [[2026-08-23-pi-council-design-spec]]