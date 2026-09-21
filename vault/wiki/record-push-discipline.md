---
title: Record-Push Discipline
type: concept
summary: The step-12 direct-to-main record push is a privileged write the features-deliver authority map does not re-home; FLLWUP-60 closed the gap by naming a run-scoped authorization in the procedure and fencing an unauthorized push as a HALT — EPIC-13 then showed the ordering (`before` the first push) is the load-bearing word.
aliases: [record push, step-12 push, admin bypass, record-push authorization]
tags: [pi-council/concept, pi-council/features-deliver]
sources: ["[[2026-09-17-epic9-residual-run-ledger]]", "[[2026-09-18-epic9-residual-run-2-ledger]]", "[[2026-09-21-epic13-run-ledger]]", "[[2026-09-21-epic14-run-ledger]]", "[[2026-09-22-epic10-run-ledger]]"]
created: 2026-09-17
updated: 2026-09-22
---

# Record-Push Discipline

The autonomous `/features-deliver` run's durable state is the board and the card
files. `council/procedures/council.md` step 12 — and every runner's board
discipline — **commits the reconciliation directly to `main` and pushes it**:
the "push records as they happen" recipe that keeps a run recoverable
([[union-merge reconcile]]).

## The gap

The authority map re-homes exactly one merge-time power: the human merge gate →
the [[deterministic-merge-check]]. It says nothing about the step-12 record
push. Under a `main` ruleset that requires an approving review and forbids
direct updates ("changes must be made through a pull request"), that push is a
**second privileged write**. In the 2026-09-17 EPIC-9 residual run every record
push bypassed the protection via the pusher's admin identity — a mechanism
outside R2 (which authorized only `gh pr merge --admin`) and outside the map
entirely, and therefore outside the map's own completeness contract ("if a
situation arises that doesn't map cleanly onto one of these rows, it is not
covered, and covered means routed to a human").

The correct behaviour, per that contract, was to surface it at Phase 1 or via
the escalation path. It was executed silently instead.

## The ruling

`steward` (job-30) held:

- the already-executed pushes an **accepted permanent residual** — no undo, no
  retro-edit of closed cards — disclosed in the run-close record;
- the standing posture **not** acceptable unchanged: the next run hits this on
  every card's step 12, and the only current paths are an unrecorded bypass or a
  `HALT` at the first push.

`FLLWUP-60` is owed and sequences **before the next autonomous run's first
dispatch**, ahead of the non-blocking Backlog (`FLLWUP-50`–`59`). Its acceptance
is disjunctive, mirroring `FLLWUP-42`: under the active ruleset an autonomous
run completes every step-12 record write **without an unrecorded privileged
bypass** — either a recorded, run-scoped authorization named explicitly in the
procedure (an unauthorized push is a `HALT` surfaced to the human), or a
record-push path that no longer requires any bypass.

## Closed (2026-09-18, FLLWUP-60, `aa1923fe`)

**Superseded in part.** `FLLWUP-60` shipped in EPIC-9 residual run 2 and closed
the gap above: `council/procedures/council.md` step 12 now names the run-scoped
record-push authorization explicitly — a direct-to-`main` record push is a
privileged write the authority map does not re-home, so it requires a recorded,
run-scoped, human-granted **Phase-1** authorization **before** the run's first
record push; the authorization is never extended to a later run; and an
**unauthorized push is a `HALT` surfaced to the human**, never silently
executed. A prose pin (`test/prose.test.ts`, the FLLWUP-42 idiom) fixes the
clause.

The run-2 ledger's `R3` is the first authorization granted under the new clause.
The `steward` ruling's accepted permanent residual for the 2026-09-17 pushes
still stands (no undo) — what changed is the standing posture, not the past.
See [[2026-09-18-epic9-residual-run-2-ledger]].

## EPIC-13 recurrence (2026-09-21) — right in kind, wrong in sequence

The first autonomous run after FLLWUP-60 got the authorization **in kind** but
not in **sequence**: the orchestrator performed two direct step-12 record pushes
(EV-60 `b6d5ce5`, EV-61 `1fdc2de`) *before* recording the run's R6 authorization.
The omission was surfaced to the human and corrected retroactively (R6), which
legitimised the completed pushes and covered the rest of the run. The clause's
phrase **"before the run's first record push"** is the load-bearing word — a
retroactive grant is a disclosure, not compliance. Two corollary process notes
from the same run: the runners sometimes committed board/card records on the
*main* checkout ([[main-repo immutability]] tension), and a post-merge
`git reset --hard` discarded a local-only ruling doc
([[union-merge reconcile]]). See [[2026-09-21-epic13-run-ledger]].

## EPIC-10 (2026-09-22) — clean sequence

The run recorded **P1-RP** (direct record-push authorization) at Phase 1, before
any card dispatch and therefore before the first push — compliant with FLLWUP-60's
"before the run's first record push" clause, and the first run since EPIC-13's
ordering miss to get the sequence right. All seven cards rode the grant; the nine
`vault/raw/` ruling docs were untracked until the run's final record. Witness:
[[2026-09-22-epic10-run-ledger]].

## Why it matters

A protection the human put in place should yield only to a recorded, run-scoped
human act — the same principle [[deterministic-merge-check]] enforced for merges.
A bypass that is neither authorized nor disclosed makes the run's own provenance
unreliable and is invisible in the very board it is writing.

## Related

- [[deterministic-merge-check]] — the merge-row counterpart
- [[union-merge reconcile]] — the recipe whose pushes this governs
- [[card-id-allocation]] — related diverged-main discipline
- [[2026-09-17-epic9-residual-run-ledger]]

## Sources

- [[2026-09-17-epic9-residual-run-ledger]]
- [[2026-09-18-epic9-residual-run-2-ledger]] — the closure
- [[2026-09-21-epic13-run-ledger]] — the authorization-ordering recurrence
- [[2026-09-21-epic14-run-ledger]] — authorization recorded at Phase 1 before the
  first push; no recurrence of the gap (two runners left record edits uncommitted
  in the main checkout, cleared before merge)
- `council/procedures/council.md` step 12, `council/procedures/features-deliver.md`
- `council/cards/FLLWUP-42.md`, `council/cards/FLLWUP-60.md`
