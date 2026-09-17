---
id: FLLWUP-41
title: Reconcile council.md step 12's non-fast-forward wording with the union-merge repair
state: In Review
owner: null
epic: EPIC-9
goal: council.md step 12 names the documented union-merge reconcile as the sanctioned non-fast-forward repair, retains the never-force guard, and a literal reading no longer HALTs a run that the documented repair resolves.
---

## Intent

`council.md` step 12 says to stop and surface a non-fast-forward, while
`vault/wiki/union-merge-reconcile.md` documents the non-destructive union
merge as the routine repair. Two EPIC-9 reconciliations (EV-37, EV-40)
resolved it by inference, which the authority map forbids, and a literal
reading HALTs a run with no human watching. Named by the steward closure
ruling as owed before the next autonomous run.

## Orchestrator rulings (Phase 1, binding)

Recorded human decisions for this run. Immutable and binding on every seat,
`steward` included; a runner that hits one applies it and cites the ruling
rather than re-asking.

- **R1 (non-fast-forward repair).** The documented union-merge reconcile
  (`vault/wiki/union-merge-reconcile.md`) is the sanctioned non-destructive
  repair for a non-fast-forward on local `main` during this run. A runner
  that hits a diverged `main` which a union merge resolves applies this
  ruling rather than `HALT`-ing on the literal step-12 wording. The
  never-force guard stands: force-pushing, rewinding, or discarding a side
  remains forbidden. This run's delivery of FLLWUP-41 is what reconciles the
  procedure text with this ruling; until it lands, R1 governs.

## Run record (features-deliver / FLLWUP-41)

### Step 1 — classification (facilitator)

- **Path: mechanical.** The deliverable is confined to one seam —
  `council/procedures/council.md` step 12's non-fast-forward wording. The
  design the card's `goal` leaves open (how the union-merge reconcile is
  named, and how the never-force guard is retained) is an implementation
  choice on settled text, not a real tradeoff; binding Phase-1 ruling **R1**
  already supplies the substance (the documented union-merge reconcile is
  the sanctioned repair; force-pushing, rewinding, and discarding a side
  stay forbidden). A deliberation would have nothing open to deliberate,
  and `<escalation_contract>` step 1 forbids re-asking an answered question.
- **Surface-touching: yes.** The deliverable changes procedure prose a
  person (the operator) reads and the runner follows — the copy that names
  the sanctioned repair. On a mechanical card this seats no `designer`
  (council.md step 1); any design concern is a step-13 follow-up candidate,
  never a reason to reopen.
- **Seat resolution (`<seat_resolution_check>`):** `owner`, `skeptic`,
  `judge` — the only seats this path dispatches — all resolve; the nine
  packaged seat files are present in `council/agents/`, and no repo-local
  `.pi/agents/` override directory exists, so nothing shadows them. Ruling
  seats (`product-owner`, `steward`) are never dispatched by this container.
- **Environment:** step 0 preflight skipped per the autonomous-run
  substitution (Phase 0 cleared it); `python3 council/validate.py` →
  `All council artifacts valid`. Local `main` == `origin/main` at
  `d5a24053d1c59fc1be69a43a45292f5b869054d1` (FLLWUP-40 `8dbe038`,
  FLLWUP-43 `e25b813`, FLLWUP-42 `aff1101` all merged). No `Needs Human`
  state and no outstanding ruling on this card — criterion 5 holds at card
  start.
- **Gate set for this repo** (authoritative: `.github/workflows/gates.yml`;
  `docs/gates/GATE-EVIDENCE.md` does not exist here): `bash council/preflight.sh
  FLLWUP-41`, `bunx tsc --noEmit`, `bun test`, `python3 council/validate.py`.
  Owner gates met in full regardless of change size.
- **Blast radius checked (no digest re-pin owed):** no fixture seed carries
  a copy of `council/procedures/council.md` (`council/fixtures/*/seed/` holds
  board/cards/validate/preflight, not procedures), so AGENTS.md #5's
  `seed.treeDigest` machinery is untouched; no shipped test pins step 12's
  non-fast-forward paragraph (grep: no `fast-forward`/`union` assertion in
  `test/`); `prose.test.ts` forbids a pinned tech stack, a removed product
  domain, `registry`, and `named agent` in procedure prose, so the new text
  must stay free of `bun`/`bunx`/`tsc`/`typescript` and those tokens.
- **Phase-1 rulings applicable here:** R1 governs the delivery (applied, not
  re-asked). The scope / sequencing / follow-up-re-homing rulings govern
  process only; the merge ruling governs step 11.

### Step 7 — hand to one owner (mechanical path)

No deliberation ran, so the card itself is the owner's handoff: its `goal`,
`Intent`, and the binding R1. Card set `In Progress`; `validate.py` clean;
`owner` dispatched.

### Step 8 — owner delivered (job-8.1), PR #61 open

Owner implemented in worktree `.worktrees/fllwup-41` (branch
`feat/fllwup-41-step12-union-merge-reconcile`, base `origin/main`
`d5a24053d1c59fc1be69a43a45292f5b869054d1`; main checkout branch state
untouched), pushed, PR #61 open at head
`1d25f7d37d5ce4e09bca012549e25da0411317e9`. Observed directly (not from the
seat's report): `gh pr view 61` → state OPEN, base `main`, headRefOid
`1d25f7d…`, `mergeable: MERGEABLE` (mergeStateStatus `BLOCKED` — the
ruleset's approving-review requirement). Diff scope, 3 files +91/−2:
`council/procedures/council.md` (step-12 first paragraph only — names the
union-merge reconcile as "the sanctioned non-destructive repair", instructs
union-keeping both record sides, requires `validate.py` clean plus a
conflict-marker sweep, and retains the never-force guard), `test/prose.test.ts`
(one red-first literal-substring pin), and the plan doc
`docs/superpowers/plans/2026-09-17-FLLWUP-41-step12-union-merge-reconcile.md`.
No engine, criteria, or other procedure changed.

Owner gates green at head, real output from its report: `bash
council/preflight.sh FLLWUP-41` → `PASS: preflight clean` (exit 0;
branch-freshness line passed, the known FLLWUP-27 mid-card artifact did not
fire this time); `bunx tsc --noEmit` exit 0; `bun test` **860 pass / 2 skip /
0 fail**; `python3 council/validate.py` → `All council artifacts valid`.
Red-first recorded: `bun test test/prose.test.ts` FAILs pre-edit (`Expected
to contain: "union-merge reconcile"`, 13 pass / 1 fail), GREEN after the
copy edit (14 pass / 0 fail, 147 expect). Owner gates are re-run by the
facilitator at step 11 regardless.

Card set `In Review` (sole precondition: open PR, observed).

Owner usage (verbatim, job-8.1):

```
job-8.1 seat=owner state=done stopReason=stop elapsed=4.5m turns=20 tokens=in 51196/out 6990/cR 459328/cW 0/reason 2978/total 517514 cost≈$0.0150
```
