# Unattended Smoke Test — Design

**Date:** 2026-08-24
**Status:** Approved design, pending implementation plan
**Origin:** Brainstormed 2026-08-24 — today the package's release-readiness
check is a human manually installing pi-council into a fresh repo and driving
a council run by hand. This design replaces that with a definitive,
unattended smoke test inside an isolated Docker container.

## Goal

One command — `bash smoke/run.sh` — that builds a throwaway container,
installs pi-council into a fresh consumer repo exactly as a consumer would,
and drives two full product paths unattended:

1. `pi -p "/council EV-1"` — the attended-shape loop: facilitator →
   deliberation → owner implements → skeptic verifies → judge rules →
   board updated.
2. `pi -p "/features-deliver EPIC-1"` — autonomous epic delivery via
   `council-runner`, two child cards through the full loop.

Green means the product works. Red means it doesn't. No retries, no flake
forgiveness, full forensic artifacts on every run.

## Non-goals

- **No retries or flake classification.** A failed run is red; re-running is
  one command with a fresh container and fresh repo state.
- **No MCP/OAuth coverage.** OAuth browser flows are impossible unattended.
  The fixture runs with an empty MCP registry; unregistered servers degrade
  to dispatch warnings (existing designed behavior, `hub-tools.ts`).
- **No `/wiki-*` commands.** Scope is the deliberation/delivery loop.
- **No CI.** Local-only, manual trigger.
- **No engine changes.** The smoke consumes the product as a consumer would.
  If the smoke needs an engine hook to pass, that is a product bug.

## Key decisions

| Decision | Choice | Rationale |
| --- | --- | --- |
| Scope | Full `/council` loop + `/features-deliver` epic | "Definitive": covers the smallest surface where "the product works" is true |
| Trigger | Local, manual (`smoke/run.sh`) | Per brainstorm |
| Seat models | All 9 seats → `openrouter/deepseek/deepseek-v4-flash-0731` via the fixture's `.council.json` | Cost/time containment; the override mechanism gets a real end-to-end workout; dated ID pinned for reproducibility |
| Failure semantics | Hard fail, zero retries, artifacts always | A smoke that retries hides its failures |
| Driver surface | `pi -p "<slash command>"` headless (approach A) | Tests the real product surface; SDK driver (approach B) only as fallback if `-p` does not route slash commands |
| Base image | `node:24-bookworm` + git + bun, pi installed at build time, version pinned | Reproducible; a pi bump is a deliberate Dockerfile line change |
| Credentials | `OPENROUTER_API_KEY` only, passed via env at run time | Only key the gates require; fresh `HOME` in the container, no host `~/.pi` leakage |

## Architecture

```
smoke/
  Dockerfile      # node:24-bookworm + git + bun + pinned pi; git identity configured
  run.sh          # host entrypoint: key check, docker build, one-shot docker run,
                  # artifact extraction (pass or fail), artifact pruning
  driver.sh       # container-side orchestrator: phases 0–2, assertion gates,
                  # timeout ceilings, red on first failure
  assert.sh       # shared assertion helpers: frontmatter state, board column
                  # membership, functional CLI probes, manifest inspection
  fixture/        # committed consumer repo (below)
  .artifacts/    # gitignored (dot-dir: bun test skips it); per-run output, pruned to last 5
```

`package.json` gains a `"smoke": "bash smoke/run.sh"` script.

### Container

- `FROM node:24-bookworm`. Build-time installs: `git`, `bun` (official
  installer), `npm i -g @earendil-works/pi-coding-agent@<pinned>`. A
  Dockerfile comment documents the bump policy.
- Git identity configured in the image (ephemeral smoke identity).
- Run-time mounts: the pi-council repo at `/pkg` (source for
  `pi install -l /pkg`), the fixture at a read-only seed path, plus a
  writable workdir where the fixture copy lives.
- Fresh `HOME` inside the container: no host `~/.pi`, no ambient
  credentials besides the explicitly passed `OPENROUTER_API_KEY`.
- One-shot `docker run --rm`; `run.sh` propagates the driver's exit code.

### Fixture consumer repo (`smoke/fixture/`)

A small real bun + TypeScript project — not a mock.

- **Product:** `src/links.ts`, a markdown link-extractor CLI;
  `test/links.test.ts` with existing tests; strict `tsconfig`.
  `package.json` scripts: `test` (bun test), `typecheck`
  (`tsc --noEmit`) — the skeptic's gates map onto them directly.
- **Pre-authored inputs (deterministic; no LLM-authored decomposition):**
  - `EV-1` — single card for the Phase 1 `/council` run: add a `--count`
    flag printing the number of links in the input.
  - `EPIC-1` + children `EV-2`, `EV-3` for `/features-deliver`: a `--json`
    flag emitting links as a JSON array; an `--images` flag extracting image
    references. All cards: single testable goal, `state: Ready` (children
    `epic: EPIC-1`), listed on the pre-committed `council/board.md` exactly
    as `validate.py` requires.
- **Pre-committed overrides — all legitimate, all exercised via the
  never-clobber invariant:**
  - `.council.json` — all 9 seats → bare string
    `"openrouter/deepseek/deepseek-v4-flash-0731"`; the bare-string form
    keeps each seat's frontmatter thinking level, exercising the override
    merge semantics for real.
  - `council/preflight.sh` — repo-local adapter (README blesses adapting):
    keeps the superpowers, ask-user-question, bun, and OpenRouter gates;
    drops the context7/tavily loop (no OAuth unattended) and the
    `origin/main` ancestry gate (ephemeral repo has no remote).
  - No `vault/` — `/council-init` creates it; seats run on the degraded
    "no wiki" grounding path, which is therefore also under test.
- `.gitignore` per the README table (ignore `.pi/git/`, `.pi/npm/`,
  `.pi/council/.pids.json`, and `smoke/` equivalents).

### Driver phases

**Phase 0 — install & init.** Copy fixture → `git init` + initial commit →
`pi install -l /pkg` → `pi -p "/council-init"`. Assert:
`.pi/settings.json` pins pi-council, superpowers, and ask-user-question;
`council/` + `vault/` trees exist; the fixture's `.council.json` and
`preflight.sh` survived unclobbered; `bash council/preflight.sh` exits 0;
`python3 council/validate.py` passes on the pre-authored board/cards.

**Phase 1 — `/council EV-1`** (`pi -p "/council EV-1"`, ceiling 30 min).
Assert:

- process exit code 0;
- `council/cards/EV-1.md` frontmatter `state == Done`;
- `council/board.md` lists `EV-1` under `## Done`;
- `.pi/council/runs/` holds the run's manifests with ≥3 seat dispatches
  (deliberation, owner, skeptic, judge);
- **the kill shot — the harness re-verifies reality itself:** `bun run
  typecheck` and `bun test` green, plus a functional probe feeding fixture
  markdown through the CLI with `--count` and comparing against a
  hardcoded expected count. No seat's prose is taken on faith.

**Phase 2 — `/features-deliver EPIC-1`** (`pi -p "/features-deliver
EPIC-1"`, ceiling 90 min). Assert:

- process exit code 0;
- `EV-2` and `EV-3` both `state == Done`; board consistent (validate.py);
- functional probes: `--json` produces the exact expected JSON array;
  `--images` extracts the expected image references;
- final-tree `typecheck` + `bun test` green;
- `runs/` shows council-runner dispatches nested under the epic run.

Guardrails: `timeout` on every `pi -p` invocation; first failing phase ends
the run red. Wall-clock ceilings (30 / 90 min) are much wider than expected
on flash models (~5–15 min Phase 1, ~15–45 min Phase 2; total expected
cost single-digit dollars).

### Artifacts and re-run semantics

Every run, pass or fail, copies the worktree out of the container (minus
`node_modules`): board, card files, `git log`/diff, `.pi/council/runs/`
manifests and seat session JSONL. Landing dir `smoke/.artifacts/<timestamp>/`,
gitignored, pruned to the last 5. On red, `run.sh` additionally prints the
failed phase, exit code, and the tail of the last seat transcript.

Re-run is the same one command; the fixture is re-seeded fresh each run, so
no state survives between runs.

## Fallback: approach B

Decision point early in the implementation plan: a spike verifies `pi -p
"/council …"` routes slash commands headlessly. If it does not, swap the
`pi -p` invocations for a small bun script using the pi SDK to create a
session and feed the same prompt. All assertions, phases, and fixture stay
identical; only the dispatch surface changes.

## Known risks

- **Flash-model variance** is the main flake source (stalls, mis-routes,
  over-cautious judge). Accepted by design: red is red, artifacts make the
  postmortem cheap, re-run is one command.
- **Headless `/council` assumes a human in the loop.** If the facilitator
  routes to `Needs Human` or a seat calls ask-user-question, the phase ends
  red via timeout or assertion — correct behavior for cards designed to be
  clean.
- **`pi install` from a local path** is documented (`pi install ./path`) but
  exercised here for the first time; the Phase 0 assertions catch any gap.
