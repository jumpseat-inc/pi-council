---
title: Deterministic Merge Check
type: concept
summary: Under /features-deliver the human merge gate is replaced by five mechanical criteria — owner gates, gates-SUCCESS on the PR head SHA, no blocking skeptic objection, judge PASS, no open ruling — executed with no discretion, merged with --match-head-commit.
aliases: [merge gate, deterministic merge, five criteria merge]
tags: [pi-council/features-deliver, pi-council/process]
sources: ["[[2026-09-04-epic4-run-ledger]]", "[[2026-09-05-epic6-run-ledger]]", "[[2026-09-06-epic6-close-run-ledger]]", "[[2026-09-11-epic7-run-ledger]]", "[[2026-09-15-epic8-run-ledger]]", "[[2026-09-16-epic9-run-ledger]]"]
created: 2026-09-04
updated: 2026-09-16
---

# Deterministic Merge Check

The features-deliver authority map re-homes the `/council` human merge
gate to a **mechanical check** for the duration of an autonomous run. No
seat — product-owner or steward included — may substitute judgment for
any criterion, and none may be skipped because a change is small. All
five must hold:

1. Every owner gate green, in full (tsc, bun test, validate.py — size of
   change irrelevant: "a one-line change clears the same gates as a
   thousand-line one").
2. **GitHub Actions green on the PR head SHA** — read via
   `gh pr checks <PR> --json name,state,workflow`, keyed on the
   `workflow` field (`gates` must appear with `state: SUCCESS`). An
   absent check is not a passing check; "nothing is failing" is not
   "gates ran and passed".
3. No blocking Skeptic objection.
4. Judge verdict PASS.
5. No `Needs Human` state or outstanding ruling on the card.

## The SHA pinning discipline

The merge must land the exact SHA the five criteria were read against:
`gh pr merge <PR> --merge --match-head-commit <X>`. A push landing between
check and merge would otherwise let the merge carry an unchecked SHA
silently. A mismatch is a **HALT, not a retry**.

## Observed practice (EPIC-3 + EPIC-4 runs)

- Status is written from **observed artifacts, never seat reports** — the
  orchestrator re-runs the owner gates at the exact head itself and reads
  the checks API before declaring criteria met.
- `Done` is set only after the merge lands **and** `gates` is green on
  the *merged* SHA.
- Skeptic gate-integrity culture complements the check: every
  verification proves each gate *can* fail before trusting a green.
- Judge REJECTs based on confabulated premises are re-dispatched with the
  corrected factual record — factual correction, never verdict coaching.
- The first autonomous merge of a run should be watched by the human, not
  merely reported.

## Observed practice (EPIC-5 run)

- Four more merges (EV-22 `07317e1`, EV-24 `5fa22a1`, EV-23 `362fe96`,
  EV-25 `467b744`), squash method this time — `--match-head-commit` pins
  the SHA regardless of merge method; the re-read-`headRefOid` fallback
  was held ready but never needed (no push raced a check).
- The watch-the-first-merge rule was honored by announcing the first
  merge in-line before the runner dispatched, not gating on a reply
  (the authority map re-homed merge authority entirely).
- **Conditional merge evidence (EV-23 J-1)** — a card may ship against a
  tracked known defect only when its step-9 verification asserts the
  follow-up-card record exists (FLLWUP-10) *before* the merge; the
  green-light is a criterion-3 sub-assertion, not a judgment call.
- Copy rulings were enforced at merge time as literal-string tests with
  gate-integrity injections (a one-word copy change turned 3 tests red).

## Observed practice (EPIC-7 run)

- Five more merges (PRs #42–#46: EV-28 `6768d25`, EV-30 `f33cbdf`,
  EV-31 `f3bcd8a`, EV-32 `32a67a3`, EV-29 `ec33fc0`), squash method,
  `--match-head-commit` pinned on every one; every head-SHA `gates` check
  `SUCCESS`, every merged-SHA CI re-verified.
- **All five cards escalated** (five [[product-owner]], two [[steward]]
  round-trips) — the criterion that mattered was #5 (no outstanding
  ruling), which forced the two-seat chain before each merge.
- **The preflight branch-freshness artifact** (FLLWUP-27) recurred on
  every card: `preflight.sh` reports `FAIL: local history does not descend
  from origin/main` on a correctly-based branch once the runner pushes its
  record commits to `main` mid-card. Resolved by recorded practice
  (preflight is the run-start/owner-time gate; the step-11 re-run set is
  `tsc`/`bun test`/`validate.py`), never by weakening a criterion.
- One union merge (EV-30, `540aca6`); the first merge was announced
  in-line; no push raced a check.

## Observed practice (EPIC-8 run)

- Four more merges (PRs #47–#50: EV-33 `186c04dc`, EV-34 `72351780`,
  EV-35 `85db7a68`, EV-36 `6b858c92`), squash method, `--match-head-commit`
  pinned on every one; every head-SHA `gates` check `SUCCESS`, every
  merged-SHA CI re-verified. No push raced a check.
- The run's first autonomous merge (EV-33, PR #47) was announced in-line
  and watched; no go/no-go pause (same practice as EPIC-5).
- **Criterion 5 again did the work** — five in-card escalations (three
  [[product-owner]], two [[steward]]) plus one `steward` closure dispatch,
  all resolved before the merge. This set the run's shape: a card's
  premise/acceptance wording, a cross-card ruling's reach, and a clamp
  site each surfaced as an outstanding ruling that had to close first.
- **The preflight branch-freshness artifact** (FLLWUP-27) recurred on
  every card, handled by recorded practice (the step-11 re-run set is
  `tsc`/`bun test`/`validate.py`).
- One union merge (EV-34, `89047ca`); no `HALT`, no stall-kill.

## Observed practice (EPIC-9 run)

- Seven more merges (PRs #51–#57: EV-37 `6a375c4`, EV-38 `3e39e66`, EV-43
  `8853712`, EV-40 `6ab0e48`, EV-39 `79c0573`, EV-42 `952d5c1`, EV-41
  `653ce01`), squash method, `--match-head-commit` pinned on every one; every
  head-SHA `gates` check `SUCCESS`, every merged-SHA CI re-verified.
- ⚠️ **The five criteria are artifact-level, not intake-level.** EV-37 met all
  five — owner gates, `gates` SUCCESS, no blocking objection, judge PASS — while
  its literal branch was **dead** ([[retry-classification]]). The orchestrator
  caught it by checking the shipped constant against pi's *installed bundle*,
  not against the card. Criterion green says nothing about the intake; the
  independent cross-check against the dependency's real bytes is load-bearing.
- ⚠️ **The human merge gate is not fully replaced.** A `main` ruleset created
  mid-run requires 1 approving review + linear history, so every merge from
  EV-40 on depended on a human-granted `--admin` bypass (authorised
  run-scoped, never extended). The authority map re-homes the human merge gate
  to the five criteria but says nothing about merge-time protection that itself
  requires a human act. Carded as FLLWUP-42.
- The run's **first autonomous merge was deferred for a human watch and then
  waived** — a third variation on the first-merge practice (EPIC-5 and EPIC-8
  announced in-line; EPIC-9 held the merge, then ran unattended on the human's
  word).
- The preflight branch-freshness artifact (FLLWUP-27) recurred on most cards and
  was cleared by an owner rebase on two; the step-11 re-run set stayed
  `tsc`/`bun test`/`validate.py`. Two union-merge reconciles (EV-37, EV-40) —
  see [[union-merge-reconcile]].
- Criterion 5 again did the work: four step-6 escalations (three
  [[product-owner]], one [[steward]] chain) all closed before their merges, plus
  one pre-merge defect ruling after the gate was halted.

## Related

- [[council loop]] — steps 9–12 this check overlays.
- [[card id allocation]] — the diverged-main discipline merges interact
  with.
- [[council models picker]] — the EPIC-5 surface merged under this gate.
- [[council config writer]] — the EPIC-6-era writer fixes merged under it.
- [[union-merge reconcile]] — what squash merges do to local main.
- [[2026-09-04-epic4-run-ledger]] — eight merges executed under this gate.
- [[2026-09-04-epic5-run-ledger]] — four more, squash-method, conditional
  green-light.
- [[2026-09-05-epic6-run-ledger]] — five more (EV-26 `b89a93b`, EV-27
  `3452abb`, FLLWUP-10 `948d111`, FLLWUP-9 `08438bd`, FLLWUP-11
  `73b3150`): **zero escalations across the whole epic**, the first
  fully-autonomous epic closure; SHA pins held on every merge (re-read
  fallback still never needed); the squash method's board-commit folding
  made [[union-merge reconcile]] a twice-per-run pattern.

## Sources

- [[2026-09-04-epic4-run-ledger]]
- [[2026-09-04-epic5-run-ledger]]
- [[2026-09-06-epic6-close-run-ledger]] — fourteen more (PRs #28–#41:
  BUG-1 `c1406138`, FLLWUP-13 `b66bc8f`, FLLWUP-16 `68e728d`,
  FLLWUP-17 `f35d082`, FLLWUP-18 `21a95a8`, FLLWUP-19 `e3d3c88`,
  FLLWUP-20 `48f60cc`, FLLWUP-15 `0be0a26`, FLLWUP-14 `ba84719`,
  FLLWUP-21 `48f8ada`, FLLWUP-22 `f5975c8`, FLLWUP-23 `2dd698f`,
  FLLWUP-24 `2c5ec3b`, FLLWUP-25 `cb36a15`): SHA pins held on every
  merge; the step-11 re-run caught a real defect the Skeptic had
  dismissed (FLLWUP-14's prune exit 123) — the re-run is load-bearing;
  one empty judge output was re-dispatched (an empty output is not a
  verdict); the run closed with the epic card itself marked Done.
- [[2026-09-11-epic7-run-ledger]] — five more (PRs #42–#46: EV-28
  `6768d25`, EV-30 `f33cbdf`, EV-31 `f3bcd8a`, EV-32 `32a67a3`,
  EV-29 `ec33fc0`): every card escalated, the branch-freshness artifact
  ruled around, one union merge, EPIC-7 closed Done.
- [[2026-09-15-epic8-run-ledger]] — four more (PRs #47–#50), the first
  merge announced in-line, five in-card escalations, one union merge,
  EPIC-8 closed Done.
