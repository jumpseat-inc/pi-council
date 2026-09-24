---
title: Smoke Test
type: concept
summary: The definitive, unattended end-to-end test — Phases 0–5 drive a real /council loop, a /features-deliver epic, the /council-eval matrix, /council-leaderboard, and /council-models in an isolated container, re-running gates itself; the search-smoke driver now shares the test suite's stdlib-only pty kit; standing discipline: the first Council command without an end-to-end falsifier is a defect.
aliases: [smoke, unattended smoke test, smoke test]
tags: [pi-council/smoke-test]
sources: ["[[2026-08-24-unattended-smoke-test-design]]", "[[2026-08-24-unattended-smoke-test-plan]]", "[[2026-08-25-smoke-test-bugfixes]]", "[[2026-09-04-epic4-run-ledger]]", "[[2026-09-04-epic5-run-ledger]]", "[[2026-09-05-epic6-run-ledger]]", "[[2026-09-06-epic6-close-run-ledger]]", "[[2026-09-18-epic9-residual-run-2-ledger]]"]
created: 2026-08-25
updated: 2026-09-20
---

# Smoke Test

`bun run smoke` (host script `smoke/run.sh`) — the package's release-readiness
check, replacing a human manually installing and driving a council run. It is
**definitive by construction**: green only if the product works.

## Architecture

- **Container** — `node:24-bookworm` + git + python3 + bun + pi pinned at
  `0.84.3` (bump is a deliberate Dockerfile line); ephemeral git identity;
  `defaultProjectTrust: "always"`; one-shot `docker run --rm` with the repo
  bind-mounted at `/pkg`.
- **Fixture** — `smoke/fixture/`: a small real bun+TS CLI (markdown link
  extractor) with pre-authored cards (`EV-1 --count`, `EV-2 --json`,
  `EV-3 --images`, `EPIC-1`), all 9 seats overridden to
  `openrouter/deepseek/deepseek-v4-flash-0731` via `.council.json`, a repo-local
  `preflight.sh` (no MCP/OAuth or origin gates), and an empty `.pi/council/mcp.json`.
  Pre-authored **standing rulings** on the epic/child cards make the autonomous
  flow deterministic.
- **Driver** — `smoke/driver.sh` runs phases; `smoke/assert.sh` holds the
  structural assertions; every phase is `timeout`-ceiled (30 / 90 min,
  Phase 3 has its own ceiling).

## The phases

1. **Phase 0** — seed worktree, `pi install -l /pkg`, `pi -p "/council-init"`;
   assert pins, non-clobber (`.council.json`, `preflight.sh`, `board.md`
   survive), `validate.py`, preflight exit 0.
2. **Phase 1** — `pi -p "/council EV-1"`; assert card `Done`, board column, ≥3
   seat sessions; **kill-shot probes**: typecheck, `bun test`, functional
   `--count` probe against a hardcoded expected value. The **harness plays the
   human** at the merge gate (merges the feature branch, sets `Done`, commits)
   and resumes one known `In Progress` pause state (flash-model variance).
3. **Phase 2** — `pi -p "/features-deliver EPIC-1"`; assert both children
   `Done`, board consistent, exact `--json`/`--images` probes, flag-conflict
   exit 2, council-runner dispatch evidence in `runs/`.
4. **Phase 3** (EV-20 Q3 ruling) — `pi -p "/council-eval eval-smoke <model>
   --repeat 2"` headlessly against a seeded gate-only fixture override;
   assert per-repeat snapshot dirs under `council/eval-results/`, durable
   `[council-eval]` transcript lines, live-vs-re-derivation byte-identity
   through *different code paths* (writer path vs reader path — not
   tautological), `validate.py` green after. "If Phase 3 cannot run, the
   card does not merge."
5. **Phase 4** (EV-21 ruling J-2) — `pi -p "/council-leaderboard"` against
   the Phase-3 records; assert the gate-only empty-state line, both
   By-command and By-seat slices, and leaderboard-reader vs
   `summarizeStore` byte-identity on n/mean/σ. Same standing rule: no
   merge without Phase 4 green.
6. **Phase 5** (EV-25, EPIC-5) — `/council-models` end-to-end in a real
   session: the headless handler-write path and the modal wiring path
   (picker mocked at its `SeatModelSelection` contract), plus a scoped
   real-session run. ⚠️ **Supersedes the earlier "Phase 5 not yet
   built" note** — that referred to FLLWUP-6's judge-bearing phase,
   which is **still open**; EPIC-5's Phase 5 is the council-models
   falsifier, a different phase. Known gap
   ([[2026-09-04-epic5-run-ledger]]): Phase 5 only executes inside the
   full multi-phase harness whose real-model ceilings cannot fit a
   bounded runner window — **fixed in the EPIC-6 run** (FLLWUP-11,
   PR #27 `73b3150`): the `SMOKE_PHASE=<n>` selector in
   `smoke/driver.sh` + `run.sh` runs Phase 5 (council-models) or Phase 6 (kitty
   search-smoke, FLLWUP-14) in isolation (phases 1–4 real-model work skipped;
   an unsupported phase hard-fails exit 1; no selector →
   byte-identical full-harness behavior). The isolation path re-runs
   phase 0's deterministic `/council-init` scaffold because the fixture
   ships no `validate.py`. Phase 5 assertions also source the R-2 usage
   line and R-3 notify copy from the ruled literals rather than in-repo
   constants — the self-referential `USAGE_LINE` test gap closed.
   ⚠️ Supersedes the "planned fix" wording this page carried since
   EPIC-5.
7. **Phase 7** (FLLWUP-114, 2026-09-24) — the runner startup surface in
   isolation (`SMOKE_PHASE=7`; the third supported isolated phase — the
   selector hard-fails anything but 5, 6, and 7). A real parent `pi -p`
   turn dispatches a real `council-runner` against a **dispatchable**
   fixture card — EV-2 (`epic: EPIC-1`, both liveness markers;
   skeptic-verified). NEVER EPIC-1: its face carries `epic: null` and
   `cardEpicKey` fail-loud refuses it at dispatch time (the EV-90 D1
   ruling) — a phase dispatching it measures nothing. Scoped to the
   runner's STARTUP transcript: the waiter (`smoke/phase7-dispatch.ts`)
   ends the window at the runner's first `council_dispatch` toolCall
   block (or settle/ceiling), never full card delivery — that is Phase
   2's existing job. The pure reader (`smoke/read-runner-startup.ts`,
   `readRunnerStartup`) then asserts, in pi's lowercase tool vocabulary:
   liveness anchors first (≥1 toolCall, ≥1 `council_dispatch`, exactly
   one non-empty `<council-procedure>` user block also carrying
   `<features-deliver-overlay>`) — a transcript missing any anchor reds
   rather than passing vacuously — then AC2 (before the first dispatch,
   no `read`-labeled toolCall's first argument ends in
   `council/procedures/council.md` or `features-deliver.md`;
   case-insensitive) and AC3 (the first toolCall's first argument is not
   under `council/procedures/`). The same reader is wired into the
   full-path Phase 2 after the runner-evidence probe at zero added model
   time. Selection is `readManifests` → `findSessionFile` ONLY — never
   the `RUNNER_SESSIONS` grep, which matches `.json` manifests, not
   sessions. Cleanup is mandatory on every exit path: the parent kill +
   a `COUNCIL_RUN_ID`-keyed sweep (`smoke/phase7-sweep.sh`) because the
   runner's sub-dispatches are detached into new process groups.
   Companion (same card): the deterministic two-attempt retry replay
   lives in the offline faux-provider harness (the EV-56 treatment arm,
   `test/ev41-seat-child-live.test.ts`) — a green run never retries
   (`classifyRetry` needs `stopReason:"error"` with the with-colon
   literal), so the cross-attempt byte-equality assertion
   (`{kind, text}` projection; raw `at` asserted to differ) rides the
   real tool seam there, not in this phase.

## The philosophy: never trust a claim, re-run reality

The judge's PASS is not the proof — the harness re-runs typecheck, the test
suite, and the exact CLI outputs itself. A seat's prose is never taken on
faith. This is what makes it deterministic despite the LLM underneath.

## Hard-fail semantics

Zero retries; red is red. Every run ships forensics to
`smoke/.artifacts/<ts>/` (pruned to 5; dot-dir so `bun test` never discovers
the council-written test files inside — see [[2026-08-25-smoke-test-bugfixes]]),
and on red the last seat transcript tail prints for immediate triage. Re-run is
the same one command; the container is fresh each time.

## Track record

In its first implementation round it caught **three real production bugs**
(headless procedure dispatch, MCP startup crashes, hub tools never reaching
seat children — which meant `/features-deliver` was broken end-to-end). See
[[2026-08-25-smoke-test-bugfixes]].

## The lighter sibling: the SMOKE-1 scratch run (v0.15.0)
The EPIC-3 run added a second, lighter smoke pattern for **in-run procedure
verification** (the SMOKE-1 ruling): a scratch copy of `council/` in a temp
dir with the rewrite at the [[override-resolution|override path]], headless
`pi -p "/features-new <toy>"`, dispatched-job-ids as evidence, real board
untouched. It complements — does not replace — the Docker smoke: it can run
mid-epic on a single procedure change. Its record: it caught the
[[presented-never-written|Part-1 attribution blur]] (the run's one real
design bug). And its cap lesson: a 20-minute ceiling killed a healthy run
mid-aggregation — the ceiling was the bug, not the run.

## The live-path sibling: the kitty search-smoke (v0.18.0, FLLWUP-14)

A third pattern — `smoke/search-smoke/` — a **pty-driven CSI-u live-path
falsifier** for the model search input: it drives `/council-models` in a
real pi session inside the container, delivering `/` and printable
keystrokes as kitty-protocol sequences (`\x1b[47u` etc.) that the unit
suite's byte-level decode tests cannot exercise end-to-end, and compares
9 observed frames against the ruled copy set byte-exact. Runs **in the
gate set** (the unit decode tests remain the CI gate; the smoke is the
live-path falsifier). PO-ruled contract: the harness exports
`OPENROUTER_API_KEY="${OPENROUTER_API_KEY:-sk-dummy}"` (presence-only
auth, zero network — the modal never dispatches; the headless preflight
is the misroute tripwire; the README states that the scratch HOME is not
credential-less), and a `node -e` decode-parity preflight against the
pinned 0.84.3 dist reds "0.84.3 decode parity failed" before any TUI
session. Its record: the step-11 merge-gate re-run caught a real defect
the Skeptic had dismissed (host prune exiting 123 on root-owned
container artifacts), fixed by decoupling the prune's exit from the
verdict. Its discovery (a zero-command state on 0.85.0) seeded the
[[env-split contract]] — the harness itself forwards only
`OPENROUTER_API_KEY`/`SMOKE_PHASE` and unsets council vars, so it is
contamination-proof by construction; the probe that ran outside it was
not.

**The screen model is shared, not private (EPIC-9, FLLWUP-55).**
`smoke/search-smoke/driver.py` no longer carries its own `class Screen`/
`class Session`: it imports the shared stdlib-only pty substrate
`test/faux-provider/pty_kit.py` (`Screen`, `Session`, the ANSI regexes). The
second private copy had **already drifted** a second time, which is the
argument that settled the share. What stays **driver-authored**: the byte table,
the frame matchers, and the session policy (28×80 winsize, checkpoint-byte
`mark()`, `SIGTERM` teardown, `wait_stable` timing, `OPENROUTER_API_KEY`
pass-through). A two-sided stdlib-only guard in the shape test keeps the release
gate's pinned-pi isolation honest. The README and the driver docstring were
amended to match (greppable: `grep -nE '^(import|from)'` on both files).
⚠️ This is a **`smoke/ → test/` path dependency** — a layering inversion held
open by that guard, not a pi coupling. See
[[2026-09-18-epic9-residual-run-2-ledger]].

## Related

- [[headless-pi]] — the operating-mode rules the driver depends on
- [[procedure-commands]], [[seats]], [[hub-job-supervision]], [[preflight]]
- [[council models picker]] — the Phase 5 subject since EPIC-5
- [[env-split contract]] — the contamination discipline the harnesses follow
- [[2026-09-05-epic6-run-ledger]] — the SMOKE_PHASE selector
- [[2026-09-06-epic6-close-run-ledger]] — the kitty search-smoke sibling
- [[2026-09-18-epic9-residual-run-2-ledger]] — the shared pty kit (FLLWUP-55)
- [[2026-08-24-unattended-smoke-test-design]], [[2026-08-24-unattended-smoke-test-plan]]

## Sources

- `smoke/run.sh`, `smoke/driver.sh`, `smoke/assert.sh`, `smoke/fixture/`
- [[2026-08-24-unattended-smoke-test-design]], [[2026-08-24-unattended-smoke-test-plan]]
- [[2026-08-24-unattended-smoke-test-design]], [[2026-08-24-unattended-smoke-test-plan]]
- [[2026-08-26-smoke-v0.12.0]] — clean-green v0.12.0 run, [[2026-08-25-smoke-test-bugfixes]]
- [[2026-09-04-epic3-run-ledger]] — the SMOKE-1 scratch-run variant
