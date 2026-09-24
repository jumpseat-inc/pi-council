# FLLWUP-119 — phase-7 live falsifier evidence (committed, per the FLLWUP-114 red-base convention)

## What this records

The SMOKE_PHASE=7 live falsifier (`bash smoke/run.sh` → `bash smoke/driver.sh`
in the container, `SMOKE_PHASE=7`) dispatched a REAL `council-runner` through
the epic flow against the REPAIRED fixture face `EPIC-1` — no EV-2 workaround
card — and reached the runner's first seat dispatch with the pure reader's
anchors + AC2/AC3 green.

The closed-red record (FLLWUP-114's skeptic O1) — `cardEpicKey(EPIC-1)`
throwing on `epic: null` — was observed at the pre-mechanism base and is
evidenced there; this file records the live half: the mechanism repaired and
the phase passing through it.

## The repair

- `council/fixtures/features-deliver/seed/council/cards/EPIC-1.md`:
  `epic: null` → `epic: EPIC-1` (the eval-seed face the flow resolves the
  epic key from).
- `smoke/fixture/council/cards/EPIC-1.md`: same one-line repair (the phase-0
  seed face the live container flow reads).
- `council/fixtures/features-deliver/fixture.json`: `seed.treeDigest` re-pinned
  for the repaired tree (the loader refuses a stale pin;
  `test/fixtures.test.ts` green, 26 pass).

## The two red runs that shaped the harness (not work failures)

Two live runs against the repaired faces red at the reader's anchors —
`transcript has no council_dispatch-labeled toolCall` — after the runner was
created and ran a real flash-model turn:

- `smoke/.artifacts/20260924-183638` — runner job-1 `state: timeout`, 28
  toolCalls, zero dispatches.
- `smoke/.artifacts/20260924-184623` — runner job-1 `state: timeout`, 53
  toolCalls, zero dispatches (the transcript's thinking text names the
  confusion: "the whole-epic runner or a single card closer? Let me look at
  the spawn script that may have launched me").

Root cause: the runner's dispatch task text ("Deliver card EPIC-1 by
following your council procedure and its features-deliver overlay") is
role-ambiguous for a flash model — EPIC-1 is both the epic card and the epic
key, and the overlay is addressed to the orchestrator — so the runner read
its mandate as "run the whole epic," skipped its seat body's startup
contract, and spent its window exploring `/pkg` (its own spawn scripts
included).

Fix (harness-side only, `smoke/phase7-runner-spawn.sh`): the dispatch input
bounds the runner to its seat body's startup contract and names the role
("one runner, one card; NOT the epic orchestrator; seat_resolution_check,
then the first seat dispatch; do not read /pkg; no Phase 0/1 preflight").
Nothing is scripted and no assertion is weakened: the transcript is fully
model-generated and `smoke/read-runner-startup.ts`'s liveness anchors +
AC2 + AC3 remain the verdict.

## The green run (final state of the branch)

- Artifacts: `smoke/.artifacts/20260924-191246` (gitignored; counts recorded
  here survive the prune).
- Reader verdict, verbatim:
  `fllwup114-runner-startup OK run=2026-09-24T19-12-54-467Z-115-3fym9w session=job-1 file=.pi/council/runs/2026-09-24T19-12-54-467Z-115-3fym9w/2026-09-24T19-13-17-994Z_job-1.jsonl — anchors + AC2/AC3 green`
- Runner transcript shape (read from the artifact before the prune):
  11 toolCalls total — reads of the board, the EPIC-1 card, sibling EV cards,
  the wiki index, and repo state checks (`/work` only, never `/pkg`), then
  `council_dispatch {seat: "owner", card_id: "EPIC-1"}` as the first (and
  only) dispatch. No read of anything under `council/procedures/` (AC2), and
  the first visible action is not under `council/procedures/` (AC3). The
  first user block carries `<council-procedure>` +
  `<features-deliver-overlay>` and the card id EPIC-1.
- Command (host, in the repo root): `SMOKE_PHASE=7 bash smoke/run.sh`
  (30-minute bound; real OpenRouter dispatch
  `openrouter/deepseek/deepseek-v4-flash-0731`).
