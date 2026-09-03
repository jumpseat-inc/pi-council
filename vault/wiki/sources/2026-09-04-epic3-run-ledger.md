---
title: EPIC-3 Run Ledger — Council-Decomposed Features-New
type: source
summary: The autonomous /features-deliver run (2026-09-03/04, shipped v0.15.0) that rebuilt /features-new as a bounded three-wave seated deliberation — plus the operational lessons on id collisions, stall-kills, and multi-session reconciliation.
aliases: [epic3 run ledger, features-new epic run]
tags: [pi-council/source, pi-council/features-new, pi-council/epics]
sources: ["[[2026-09-04-epic3-run-ledger]]"]
created: 2026-09-04
updated: 2026-09-04
---

# EPIC-3 Run Ledger — Council-Decomposed Features-New (v0.15.0)

Raw source: [[2026-09-04-epic3-run-ledger]]. The first full `/features-deliver`
run on the council's own payload: an epic (EPIC-3) whose three children
rewrote the command that produced it, with the human draft-then-confirm gate
fenced as byte-identical throughout. Three PRs merged on the deterministic
five-criterion gate, each pinned with `--match-head-commit` and CI-verified
green on the merged SHA.

## What it established

- **[[three-wave-decomposition]]** — the new `/features-new` structure
  (EV-10 + EV-11): principal wave 1 authors, skeptic+designer wave 2 attack,
  product-owner wave 3 rules; 3 waves = 3 rounds; convergence at the fixed
  endpoint; fallback = mechanical verbatim aggregate. The facilitator
  "authors nothing at any step".
- **[[presented-never-written]]** — the two-part gate presentation
  (EV-10): Part 1 card drafts exactly as written and attribution-free;
  Part 2 a never-persisted ledger of contributors, disagreements, and
  unresolved calls.
- **Docs honesty** (EV-12): the README now states the actual contract; the
  old "it'll prompt you for more details" claim was skeptic-proven false
  (`grep -c prompt features-new.md` = 0).

## The rulings (six total, all verbatim on card faces, binding incl. steward)

Phase 1 by the human: SEATS-1 (participant seat set), SMOKE-1 (scratch-copy
smoke runs), CAP-1 (3-round cap), FALLBACK-1 (fallback drafts, no new gate).
Step 6 by [[product-owner]] mid-run: wave-1 authorship = [[principal]] alone
(rejecting the PO-self-review loop); status-line placement by measured
adjacency (≤200 chars from the guard — geometry foreclosed the seam block);
J1 scope = in (the false README claim is this card's to fix).

## The lesson

Three operational laws, all now on their concept pages:

1. **[[card-id-allocation]] is a HEAD operation** — a parallel agent on a
   stale clone allocated EPIC-3/EV-10..15 to itself; the renumbered
   EPIC-4/EV-16..21 landed on a remote that didn't contain our epic, and the
   mains diverged. Reconciled by union merge (`13af33e`), never rewrite;
   validate.py's duplicate detection caught both of the orchestrator's own
   botched board resolutions during that merge.
2. **Poll-slice long waits** — three containers were anti-stall-killed while
   blocked in single 30–45-minute `council_wait` calls; the hub's stall
   monitor sees no tool activity. Fix: ≤8-minute wait slices, re-waiting
   while progressing (see [[hub-job-supervision]], [[council-runner]]).
3. **Verify worktree == committed before trusting debris** — a dead
   skeptic's scratch files sat next to the shipped procedure; recovery
   diffed against the committed file before deleting anything.

Plus the smoke technique (rewrite at the [[override-resolution|override
path]] in a scratch copy; user-scope package supplies the rest; **never
project-pin pi-council in the scratch** — the dual-install tool conflict
broke the first attempt), and the judge-re-dispatch precedent
([[judge]]): a REJECT built on confabulated premises is re-dispatched once
with corrected facts, never argued with.

## Related

- [[three-wave-decomposition]], [[presented-never-written]], [[card-id-allocation]]
- [[council-runner]], [[council-loop]], [[product-owner]], [[engineering-board]]
- [[smoke-test]] — the heavyweight Docker smoke; SMOKE-1 is the lighter in-run scratch variant

## Sources

- [[2026-09-04-epic3-run-ledger]]
- `council/cards/EPIC-3.md`, `council/cards/EV-10.md`, `EV-11.md`, `EV-12.md`
- `docs/superpowers/specs/2026-09-03-EV-10-design.md`, `…EV-11-design.md`, `…EV-12-design.md`
