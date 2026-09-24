---
title: Deterministic Merge Check
type: concept
summary: Under /features-deliver the human merge gate is replaced by five mechanical criteria — owner gates, gates-SUCCESS on the PR head SHA, no blocking skeptic objection, judge PASS, no open ruling — keyed since EPIC-13 by the card's recorded execution mode, merged with --match-head-commit.
aliases: [deterministic merge check, merge gate, deterministic merge, five criteria merge]
tags: [pi-council/features-deliver, pi-council/process]
sources: ["[[2026-09-04-epic4-run-ledger]]", "[[2026-09-05-epic6-run-ledger]]", "[[2026-09-06-epic6-close-run-ledger]]", "[[2026-09-11-epic7-run-ledger]]", "[[2026-09-15-epic8-run-ledger]]", "[[2026-09-16-epic9-run-ledger]]", "[[2026-09-17-epic9-residual-run-ledger]]", "[[2026-09-17-po-fllwup47-step6-ruling]]", "[[2026-09-18-epic9-residual-run-2-ledger]]", "[[2026-09-21-epic13-run-ledger]]", "[[2026-09-21-epic14-run-ledger]]", "[[2026-09-22-epic10-run-ledger]]", "[[2026-09-22-epic15-run-ledger]]", "[[2026-09-23-epic15-residual-run-ledger]]", "[[2026-09-24-epic23-run-ledger]]"]
created: 2026-09-04
updated: 2026-09-24
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

## Mode-aware (EPIC-13, v0.28.0) — supersedes "unconditional"

Until EPIC-13 the five criteria were stated as one unconditional ruleset. They
are now **keyed by the card's recorded execution mode**
([[metered-deliberation-routing]], written to the root dispatch manifest by
`EV-68`, read from the **run substrate**, never from a seat's report):

| Mode | Criteria that apply |
|---|---|
| **Direct** | 1, 2, 5 only — no judge verdict (the test suite is the gate) |
| **Verify** | all five; criterion 3 scopes to the single Verify skeptic |
| **Deliberate** | all five, verbatim |

A card with **no recorded mode HALTs** rather than defaulting, with the pinned
lines `HALT: EV-<n> has no recorded execution mode — the merge check cannot
infer one; route the card at the approval gate`, and — for a mode needing a goal
evaluation with none recorded — `HALT: EV-<n> — mode <mode> requires a goal
evaluation and none is recorded`. The SHA pin and the `workflow: gates` reading
are unchanged. The table is a pure function in `extensions/merge-check.ts`; as of
v0.28.0 it is fixture-consumed only — `FLLWUP-72` makes step 11 *execute* the
table instead of a prose mirror.

## Observed practice (EPIC-10 run)

- Seven more merges (PRs #97–#103: EV-78 `9285538`, EV-79 `ddf9077`, EV-80
  `e0fd6f5`, EV-81 `690127b`, EV-82 `277036b`, EV-83 `6a5d70c`, EV-84 `03925df`),
  all routed Deliberate (no recorded decision → fallback), all five criteria each,
  `--squash --admin --match-head-commit` pinned, `gates` `SUCCESS` on every head and
  re-verified on every merged SHA.
- ️ **Process variance — the runner merged itself.** The human's Phase-1 ruling put
  the deterministic check *and* the merge inside each [[council-runner]] (which then
  wrote the step-12 `Done` record); the orchestrator independently re-verified every
  merged SHA and the `gates` check afterward. The historical reading of step 11 places
  execution with the orchestrator/facilitator — recorded as run variance, not a ruleset
  change.
- No push raced a check; no `HALT`; no `Needs Human`. Witness:
  [[2026-09-22-epic10-run-ledger]].

## Observed practice (EPIC-15 run)

- Three merges (PRs #104–#106: BUG-2 `59fad63`, FLLWUP-105 `a0b27ca`,
  FLLWUP-106 `98a62a9`), all routed **Deliberate** — the gate was `active` but
  inert (both domains failed on the `noul` drift, so `council_route op:route`
  returned the fallback; see [[inert-gate-fallback]]) — all five criteria each,
  `--squash --admin --match-head-commit` pinned, `gates` `SUCCESS` on every head
  and re-verified on every merged SHA.
- **The orchestrator-merges reading was restored** (reversing the EPIC-10
  variance): every runner returned `DONE` with a PR + head SHA and did not
  merge; the orchestrator executed the check and the merge.
- The first autonomous merge paused for the human (the R1 option chosen); the
  remaining merges ran unattended at the human's explicit direction.
- No `HALT`, no `Needs Human`; `Done` written only after `gates` green on the
  merged SHA.

## Observed practice (EPIC-15 residual run, 2026-09-23)

- Five merges (PRs #107–#111: FLLWUP-111 `927fdaa`, FLLWUP-109 `3d62b3a`,
  FLLWUP-110 `9da7ff1`, FLLWUP-107 `41e9676`, FLLWUP-108 `077ebc1`), squash
  method, every `--match-head-commit` pin held under the run-scoped R-B
  authorization; every head-SHA `gates` check `SUCCESS` keyed on the `workflow`
  field, re-verified on every merged SHA. The run's first merge was unwatched at
  the human's explicit "unattended" direction (R-B stood as the authorization).
- ⚠️ **The recorded mode can disagree with the executed mode.** FLLWUP-111's
  ROOT manifest recorded `Verify` while the runner judged and executed `Direct`
  (owner-only — no judge), and the check — correctly keyed to the *run
  substrate*, not the runner's report — issued
  `HALT: FLLWUP-111 — mode Verify requires a goal evaluation and none is
  recorded`. The repair was to produce the missing `Verify` evidence at the
  recorded mode (dispatch the `skeptic` and `judge`), not to merge on the
  `Direct` report. See [[execution-mode-recording]].
- Criterion 5 did not pace this run: no `Needs Human`, no outstanding ruling
  after the gate fix; the only HALT was the mode mismatch above.

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
  requires a human act. **Delivered (FLLWUP-42, 2026-09-17):** the procedure now
  names `gh pr merge <PR> --squash --admin --match-head-commit <X>` as the
  sanctioned merge step under a recorded, run-scoped authorization, and an
  unauthorized ruleset block is a `HALT`. ⚠️ The map's completeness gap extends
  past the merge row: the step-12 **record push** is a second privileged write it
  does not re-home — see [[record-push-discipline]]. **Closed (FLLWUP-60,
  `aa1923fe`, 2026-09-18):** `council.md` step 12 now names the run-scoped
  record-push authorization explicitly, requires it **before** a run's first
  record push, and fences an unauthorized push as a `HALT` — no silent bypass.
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

## Observed practice (EPIC-9 residual run)

- Nine more merges (PRs #58–#66), squash method, every `--match-head-commit` pin
  held, under an explicit run-scoped `--admin` authorization
  ([[record-push-discipline]]); every head-SHA `gates` check `SUCCESS`, every
  merged-SHA run re-verified. One union merge (FLLWUP-43); no push raced a check.
- ⚠️ **Merged-SHA CI read.** `gh run list --commit <squashSha>` returns **empty**
  for a squash-merge commit — the run is associated with the head SHA's
  `pull_request` event, and the `--commit` filter does not match the push run.
  "No rows" is not "no run." Reliable reads: `gh pr checks <PR> --json
  name,state,workflow` (head), `gh api
  repos/:owner/:repo/commits/<sha>/check-runs` (merged), or `gh run list
  --workflow gates.yml --branch main`.
- The run's first merge was announced in-line for a human watch; **criterion 5
  again paced the run** (13 ruling-seat round-trips across nine cards).
- ⚠️ **Record-push disclosure.** Every step-12 record commit used an
  admin-identity bypass **not** covered by the run-scoped merge authorization;
  steward ruled the past an accepted permanent residual and FLLWUP-60 owed
  before the next autonomous run ([[record-push-discipline]]).

## Observed practice (EPIC-9 residual run 2, 2026-09-18)

- Ten more merges (PRs #67–#77), squash method, every `--match-head-commit` pin
  re-read and held, under the run-scoped R2 `--admin` authorization; every
  head-SHA `gates` check `SUCCESS` keyed on the `workflow` field, every
  merged-SHA run re-verified. One card retired (`FLLWUP-52`, R4) — no PR. No
  `HALT`, no denied merge.
- ️ **Merged-SHA CI can flake on an untouched file.** The pre-existing `EV-40
  computeBackoffDelay` jitter test reddened the merged-SHA CI on `FLLWUP-50`
  and `FLLWUP-55` while both PR-head checks were green; each was healed by one
  **disclosed same-commit rerun** — never a rerun of the PR-head check. The
  flake is carded as `FLLWUP-63`; the recurrence is evidence for the fix, not a
  gate relaxation.
- ⚠️ **Criterion 2's reading is `workflow: gates` on the PR head SHA.**
  `gh pr checks` returns other check-runs too (e.g. a skipped `[code]smith` with
  an empty `workflow`); asserting only "nothing failing" is not enough — the
  `gates` workflow must **appear** with `state: SUCCESS`.
- **Concurrent runs share the board.** EPIC-10/11/12 wrote `council/board.md`
  mid-run; two sanctioned [[union-merge reconcile|union merges]] (FLLWUP-57,
  FLLWUP-58), every other push a fast-forward, no history rewrite.
- **Escalation paced the run again** — six escalations across eleven cards
  (`product-owner` 3/7/12/15/18/21/24/25/27/29/31; [[steward]] 1/8/13/16), two
  of them goal/scope rulings (`FLLWUP-51` goal amendment; `FLLWUP-50` detection
  scope) and two copy/mechanism items (`FLLWUP-55`, `FLLWUP-58`).

## Observed practice (EPIC-13 run, 2026-09-21)

- Thirteen more merges (PRs #79–#91), squash method, every `--match-head-commit`
  pin re-read and held under the run-scoped R1 `--admin` authorization; every
  head-SHA `gates` check `SUCCESS` keyed on the `workflow` field, and every head
  **independently re-verified by the orchestrator** (preflight + `tsc` + full
  `bun test` + `validate.py`) before the merge. No `HALT`, no denied merge. The
  run's first merge (EV-60) was announced in-line and watched.
- **The ruleset is now mode-aware** (section above) — the first run to merge
  under it.
- Criterion 5 again paced the run: seven [[product-owner]] rulings and one
  [[steward]] closure, every one card-level (none reached a steward chain before
  closure).
- ⚠️ **The orchestrator reconciled by `git reset --hard` instead of the
  [[union-merge reconcile]] union merge**, discarding a local-only ruling doc
  (recovered from a dangling object). Reset is a rewind and contradicts this
  repository's never-force rule. See [[2026-09-21-epic13-run-ledger]].

## Red-base falsifiers and the merge gate

The merge gate is what makes "cannot land red" true: a falsifier that must
start red cannot merge red, so its evidence is the base run plus a green head
half ([[red-base evidence]], field 7). FLLWUP-47's step-6 ruling (R2) put the
"no red test lands" obligation here, in the merge gate, and removed the
landing statement from the convention's record — the record carries the
observable head half (head sha + same command verbatim + `0 fail`), not an
attestation about the merge window. One enforcement, not two.

## EPIC-23 witness (2026-09-24)

Both cards (EV-89 `593f6ed`, EV-90 `14f244f`) merged under the five **Deliberate**
criteria — owner gates green, `gates` workflow `SUCCESS` keyed on `workflow`,
no blocking skeptic objection, judge `PASS`, no open ruling — each `--admin`
pinned with `--match-head-commit <X>`. Note the two mode sources: the *ledger
route* returned `fallback` for both (read-back drift,
[[inert-gate-fallback]]) while the *ROOT dispatch manifest* recorded
`Deliberate`, so the no-recorded-mode `HALT` did not apply
([[execution-mode-recording]]). Witness: [[2026-09-24-epic23-run-ledger]].

## Related

- [[council loop]] — steps 9–12 this check overlays.
- [[card id allocation]] — the diverged-main discipline merges interact
  with.
- [[council models picker]] — the EPIC-5 surface merged under this gate.
- [[council config writer]] — the EPIC-6-era writer fixes merged under it.
- [[union-merge reconcile]] — what squash merges do to local main.
- [[red-base evidence]] — the head-half field and why the merge gate, not the
  record, carries "no red test lands".
- [[execution-mode-recording]] — how the mode this check reads is recorded, and
  its mismatch failure shape.
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
- [[2026-09-18-epic9-residual-run-2-ledger]] — ten more (PRs #67–#77), one
  R4 retirement, the R2/SHA-pin discipline held, the merged-SHA flake
  disclosure, and the record-push closure (`FLLWUP-60`).
- [[2026-09-21-epic13-run-ledger]] — thirteen more (PRs #79–#91); the mode-aware
  ruleset first merged under, and the reset-vs-union reconcile contradiction.
- [[2026-09-21-epic14-run-ledger]] — five more (PRs #92–#96), every card recorded
  **Deliberate** (the gate off routes to the full panel), all five criteria
  satisfied each time; no HALT, no denied merge, the admin bypass pinned with
  `--match-head-commit` every time.
