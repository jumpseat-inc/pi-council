---
id: FLLWUP-60
title: Non-admin record-push path for autonomous runs
state: In Review
owner: null
epic: EPIC-9
goal: Under the active main ruleset (approving review + linear history + changes must be made through a pull request), an autonomous features-deliver run completes every step-12 record write without an unrecorded privileged bypass — either an explicit, run-scoped, human-recorded authorization for the direct record push exists on the run's Phase-1 record before the run's first record push, the procedure names that authorization explicitly, and an unauthorized push is a HALT surfaced to the human; or the record-push path no longer requires any bypass.
---

## Orchestrator rulings (Phase 1, binding)

Recorded human decisions for this run. Immutable and binding on every seat,
`steward` included; a runner that hits one applies it and cites the ruling
rather than re-asking.

- **R3 (run-scoped record-push authorization).** For this run only, the human
  authorized the step-12 record commit to be pushed directly to `main` with
  the pusher's admin identity, satisfying this card's goal requirement that an
  explicit, run-scoped, human-recorded authorization exists on the run's
  Phase-1 record before the run's first record push. The card's deliverable is
  to make this explicit in the procedure text: `council.md` step 12 must name
  the run-scoped record-push authorization, and an unauthorized direct push
  must be a `HALT` surfaced to the human. Recorded run-level as R3 on
  `EPIC-9`; the authorization is not extended to any later run.
- **R2 (run-scoped merge authorization).** `gh pr merge <PR> --squash --admin
  --match-head-commit <X>` is sanctioned for this run only; all five
  deterministic criteria still hold.
- **Non-goals apply as written.** No change to the five deterministic criteria,
  to `--match-head-commit` pinning, to FLLWUP-42's merged merge paragraph, or
  any reopening of FLLWUP-42.

## Intent

`council.md` step 12 instructs committing the reconciliation directly to `main`
and pushing. The active `main` ruleset blocks direct updates, so every record
push in the 2026-09-17 EPIC-9 residual run bypassed the protection via the
pusher's admin identity — a mechanism outside the run's Phase-1 ruling R2,
which scoped itself to `gh pr merge --admin`, and outside the authority map's
coverage entirely. `steward` (job-30) ruled the past pushes an accepted
permanent residual (disclosed in the run-close record, no undo), but ruled the
standing posture *not* acceptable unchanged: the next autonomous run hits this
deterministically on every card's step 12.

**Falsifier (red-first):** a test pinning `council.md` step 12's record-push
paragraph, in the same idiom FLLWUP-42's `test/prose.test.ts` pin used.

## Run record (features-deliver / FLLWUP-60 — EPIC-9 residuals run 2)

### Step 1 — promotion + classification (facilitator)

- **Promotion (`Backlog` → `Ready`) applied, not asked.** Phase-1 scope
  ruling (284ced2, `EPIC-9.md` run-2 block): all eleven `Backlog` residuals
  FLLWUP-50–60 "are this run's delivery scope", and the human's dispatch
  input orders this card **first** (steward build-order ruling, job-1,
  c4428ae). Run-1 precedent: the same autonomous promotion moved each
  residual card to its working state at its runner's start (5608ed1), and
  every run-1 card's record states its step-1 gate without a separate
  promotion round-trip. Chain-promotion legitimacy rides single-writer
  discipline; `validate.py` clean after the edit. Cited ruling: Phase-1
  **scope** (this run's own recorded human decision).
- **Path: mechanical.** The deliverable is confined to one seam —
  `council/procedures/council.md` step 12's record-push paragraph — plus its
  red-first prose pin in `test/prose.test.ts`. The `goal`'s design space is
  fully settled by the binding card-specific R3 ruling: the delivery is to
  name the run-scoped record-push authorization explicitly (its
  precondition is already satisfied on the run's Phase-1 record) and make
  an unauthorized direct push a `HALT` surfaced to the human. A
  deliberation would have nothing open to deliberate, and
  `<escalation_contract>` step 1 forbids re-asking an answered question.
  Steps 2–6 skipped per council.md step 1.
- **Surface-touching: yes.** The deliverable changes procedure prose a
  person (the operator) reads — the copy that names the sanctioned
  record-push authorization. On a mechanical card this seats no `designer`
  (council.md step 1); any design concern is a step-13 follow-up candidate,
  never a reason to reopen.
- **Seat resolution (`<seat_resolution_check>`):** `owner`, `skeptic`,
  `judge` — the only seats this path dispatches — all resolve; the nine
  packaged seat files are present in the installed package clone
  (`council/agents/`), and no repo-local `.pi/agents/` override directory
  exists, so nothing shadows them. Ruling seats (`product-owner`,
  `steward`) are never dispatched by this container.
- **Environment:** step 0 preflight skipped per the autonomous-run
  substitution (Phase 0 cleared it); run for information only → `PASS:
  preflight clean`, exit 0. `python3 council/validate.py` → `All council
  artifacts valid`. Local `main` == `origin/main` at `c4428ae` before the
  promotion push; promotion commit `08fdb83` pushed under R3 (disclosed:
  the ruleset emitted its standard bypassed-rule notice on this and every
  subsequent direct record push — the exact mechanism this card's
  deliverable names and fences). No `Needs Human` state and no outstanding
  ruling on this card — criterion 5 holds at card start.
- **Gate set for this repo** (authoritative: `.github/workflows/gates.yml`
  + [[deterministic-merge-check]]; `docs/gates/GATE-EVIDENCE.md` does not
  exist here): `bash council/preflight.sh FLLWUP-60`, `bunx tsc --noEmit`,
  `bun test`, `python3 council/validate.py`. Owner gates met in full
  regardless of change size.
- **Blast radius checked (no digest re-pin owed):** no fixture seed carries
  `council/procedures/council.md` (`council/fixtures/*/seed/` holds
  board/cards/validate/preflight trees, not procedures — same finding as
  FLLWUP-42's record), so AGENTS.md #5's `seed.treeDigest` machinery is
  untouched; the only existing step-12 pin is FLLWUP-41's union-merge test
  (`test/prose.test.ts`), whose assertions this card's edit must keep green;
  `prose.test.ts` forbids a pinned tech stack in procedure prose, so the
  new text must stay free of `bun`/`bunx`/`tsc`/`typescript`.
- **Rulings applied here (cited, not re-asked):** R3 governs the delivery
  (record-push authorization is run-scoped, on the Phase-1 record before
  the first record push — this container's own pushes execute under it,
  disclosed per record-push-discipline). R2 governs the later merge.
  Non-goals stand as written; FLLWUP-42 is not reopened.

### Step 7 — hand to one owner (mechanical path)

No deliberation ran, so the card itself is the owner's handoff: its `goal`,
`Intent`, the falsifier, the non-goals, and the binding R3 ruling. Card set
`In Progress`; `validate.py` clean; `owner` dispatched (45-minute window).

### Step 8 — owner delivered (job-2.1), PR #67 open

Owner implemented in worktree `.worktrees/fllwup-60` (branch
`feat/fllwup-60-record-push-authorization`, base `origin/main` `8e6fe4b`),
pushed, PR #67 open at head
`c30f7b7a79c4b89ed13424dd50f7ef9cb7244ad0`. Observed directly (not from the
seat's report): `gh pr view 67` → state OPEN, base `main`, headRefOid
`c30f7b7…`, `mergeable: MERGEABLE` (mergeStateStatus `BLOCKED` — the
ruleset's approving-review / PR-only requirement, the condition this card's
copy fences a second privileged write against). Diff scope:
`council/procedures/council.md` +9/−1 (step 12's final paragraph expanded
into the record-push paragraph), `test/prose.test.ts` +38 (one red-first
literal-substring pin in the FLLWUP-41/42 idiom), plan doc +73. No engine
change; `features-deliver.md` untouched; FLLWUP-41's pinned assertions
preserved.

Owner gates green at head, real output: `bash council/preflight.sh
FLLWUP-60` → `PASS: preflight clean` (exit 0); `bunx tsc --noEmit` exit 0;
`bun test` **894 pass / 2 skip / 0 fail** (896 tests, 78 files, 95.82s);
`python3 council/validate.py` → `All council artifacts valid`. Red-first
recorded: the new pin FAILs pre-edit (`Expected to contain: "pushed
directly to \`main\`"`), GREEN after the prose edit (17/17 in that file).

**Owner process deviation, disclosed and verified clean:** the owner's
first two file writes (plan doc, test edit) briefly resolved against the
main checkout (session-cwd vs worktree-cwd mismatch) before being
reverted/relocated within the same turn. Verified by this facilitator:
main checkout working tree clean, `main` still at `8e6fe4b`, no board/card
file touched, all work in the worktree commit `c30f7b7`. No harm; noted as
a candidate for the seat's own guidance at step 13.

Card set `In Review` (sole precondition: open PR, observed).

**Non-goals:** no change to the five deterministic criteria, to
`--match-head-commit` pinning, to FLLWUP-42's merged merge paragraph, or any
reopening of FLLWUP-42.

**Build order (`steward`):** this card sits in the EPIC-9 closure's "standing
machinery owed before the next autonomous run" class (FLLWUP-40/41/42/43 now
all `Done`) and sequences **before the next autonomous run's first dispatch**,
ahead of the pending non-blocking Backlog (`FLLWUP-50`–`54`). Independently of
whether it lands first, the next run's Phase 1 must either record the
run-scoped record-push authorization explicitly before the first record push,
or the run does not proceed unattended.

Ruled owed by `steward` (job-30), acceptance shape verbatim.
