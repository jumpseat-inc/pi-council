---
title: pi-council Overview
type: overview
summary: pi-council is an installable pi package pairing a multi-agent Council deliberation/implementation loop with an LLM-maintained wiki — the workflow's opinions are the product.
aliases: [pi-council, council, the Council]
tags: [pi-council/overview]
sources: ["[[2026-08-23-readme]]", "[[2026-08-23-pi-council-design-spec]]"]
created: 2026-08-23
updated: 2026-08-25
---

`pi-council` (v0.10.0) is an installable [pi](https://pi.dev) package, distributed
as `pi install git:github.com/tistaharahap/pi-council`. Installing it once and
running `/council-init` gives **any** repository the same opinionated workflow:
a facilitator-driven Council of specialized seats that deliberates, implements,
verifies, and judges work on a card board — backed by an LLM-maintained wiki
under `vault/` so every run's knowledge compounds.

The workflow's opinions are deliberate and are the product: the seats' domain
prose (PETA SPKLU examples, portfolio doctrine, gate discipline), the board/card
discipline, and the wiki schema ship as-is. Consumers tune via **repo-local
overrides** (a seat at `<repo>/.pi/agents/<name>.md` shadows the packaged one),
never by forking the package.

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
matured — roughly 75 commits, following **[Conventional Commits]** with the
`version` bumped in the same commit as each behavior change:

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

The wiki scaffold shipped in the same commit as the council scaffold — the
wiki is not an add-on. The full arc and commit-message discipline live in the
git log; this table is a secondary summary that can drift.

## Related

- [[council-config]] — the v0.7.0 per-seat model/thinking override file
- [[smoke-test]] — the v0.10.0 unattended end-to-end test
- [[seats]] — the 9 Council entities
- [[council-loop]] — the deliberation → implement → verify → judge procedure
- [[llm-wiki]] — the schema pattern the vault follows
- [[mcp-support]], [[hub-job-supervision]], [[headless-pi]] — the engine subsystems

## Sources

- `README.md`, [[2026-08-23-readme]]
- `docs/superpowers/specs/2026-08-23-pi-council-design.md` → [[2026-08-23-pi-council-design-spec]]