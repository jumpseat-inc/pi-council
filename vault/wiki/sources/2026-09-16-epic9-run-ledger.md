---
title: EPIC-9 Run Ledger
type: source
summary: The features-new + features-deliver run that made council survive provider errors — retry with exponential backoff configured in .council.json (EV-37/38/39/40/41/42/43) — where all five merge criteria passed on a dead literal branch, four cards escalated, and EPIC-9 closed Done at v0.18.0.
aliases: [epic9 run, 2026-09-16-epic9-run-ledger, epic9 ledger, provider-error retry run]
tags: [pi-council/run-ledger, pi-council/epic9]
sources: ["[[2026-09-16-epic9-run-ledger]]"]
created: 2026-09-16
updated: 2026-09-16
provenance: run-ledger
source_path: vault/raw/2026-09-16-epic9-run-ledger.md
source_commit: ab403eb
captured: 2026-09-16
---

# EPIC-9 Run Ledger (2026-09-16)

The `/features-new` decomposition and `/features-deliver EPIC-9` autonomous run
that shipped **provider-error retry with exponential backoff**, configured in
`.council.json`. Seven children, seven gated merges (PRs #51–#57), 713 → 847
tests, the epic card closed `Done` (fourth epic-card closure). The run's
headline is not the feature — it is that **every one of the five merge criteria
passed on a deliverable that could not work**, and only an independent
cross-check against pi's installed bundle caught it.

## What the run delivered

- **The classifier** (EV-37, `6a375c4`): a pure `classifyRetry` over a settled
  job report, keyed on `stopReason`/`errorMessage` and never on `state`. See
  [[retry-classification]].
- **The policy surface** (EV-38, `3e39e66`): a top-level `retry` sibling in the
  committed `.council.json`, concrete defaults in the scaffold,
  fail-loud validation. See [[retry-policy]].
- **The reachability gate** (EV-43, `8853712`): an `agent_settled` handler +
  `sendUserMessage` **does** produce a second turn in both TUI and `-p`, with a
  control arm closing attribution to the handler.
- **The intake's actual fix** (EV-40, `6ab0e48`): parent-turn continuation —
  input-bar countdown, `Esc` abort, `Enter` re-arm, headless SIGINT and exit 75.
  See [[parent-turn-continuation]].
- **Hub retry** (EV-39, `79c0573`): a settled seat dispatch classified retry is
  re-spawned with exponential backoff; the job tree keeps **one row per
  dispatch**, labeled `attempt N/M`.
- **Per-attempt provenance** (EV-42, `952d5c1`): every attempt recoverable from
  the manifest alone; the reported figure sums every attempt. See
  [[per-attempt-provenance]].
- **The end-to-end falsifier** (EV-41, `653ce01`): red at base `3a3773f`, green
  at head, through both paths.

## The defining shape

The intake described a symptom — the session stops at `Continue`. Two
counter-intuitive facts framed the whole epic:

1. **pi already retries, just not this class.** `isRetryableAssistantError`
   gates pi's own backoff, and its shipped token list does not match
   `Provider finish_reason: error`. The council loop therefore had to be
   council-owned, and its predicate had to be a **superset** of pi's (R1).
2. **The failure is on the parent turn, not a seat child.** The cheap fix — a
   hub-side backoff loop for seat children — is real work but does not fix the
   reported session; the epic's centre is the parent-turn continuation, and the
   hub loop is the second, easier half.

Then the meta-lesson: **the merge gate's five criteria are artifact-level, not
intake-level.** EV-37 passed owner gates, `gates` SUCCESS, a no-block Skeptic
verdict, and judge `PASS` — while its literal branch was dead. The goal could
not spell pi's emitted string (frontmatter forbids `: ` in `goal`), the owner
implemented the goal's spelling, and the judge — whose only input *is* the goal
— passed it. See [[retry-classification]] and [[deterministic-merge-check]].

## The escalation pattern

Four of seven cards escalated at step 6, every one a **discovered mechanism**
rather than a copy literal — the EPIC-7/EPIC-8 pattern continuing. Two are
worth naming because they broke new ground:

- **A Phase-1 ruling can be the dispute.** [[designer]] argued the R5 countdown
  belonged on the status row; [[product-owner]] ruled R5's input bar *binding*
  (implemented via `setEditorComponent`, the `focus-nav` `CustomTreeEditor`
  precedent) and named the dissent. The escalation was *whether the recorded
  surface was binding*, not what the copy said.
- **An acceptance can name a non-existent observable.** EV-43's goal required
  the per-branch observable be "named in the acceptance"; the acceptance named
  an input-bar text delta that provably cannot exist for a bare reachability
  probe. Ruled (B): naming is a naming requirement, not an existence
  requirement. The Acceptance was amended as documentation; the goal stood.

[[steward]] also **re-scoped a `Ready` sibling in place** — EV-42's premise
("each attempt mints a fresh job id") was made false by EV-39's settled
cardinality, and steward ruled the orchestrator executes the card edit between
cards, same id and slot, dropping `attemptGroupId`.

## Human interventions

Two, both consequences of the authority map being incomplete rather than of a
seat failing:

1. **The first autonomous merge was deferred for a watch and then waived**
   ("No human watch required… run unattended").
2. **A mid-run `main` ruleset required a human-granted bypass.** A ruleset
   created during the EV-40 card requires 1 approving review + linear history;
   the authority map re-homes the human merge gate to the five criteria, but a
   review-requiring ruleset makes every autonomous merge depend on a human act.
   The human authorised `--admin`, **run-scoped**, and the procedure text does
   not yet name it. See [[deterministic-merge-check]].

## Follow-ups and residuals

Nine filed (`Backlog`, `epic: EPIC-9`, unpromoted): **FLLWUP-40** (isolate
`COUNCIL_EVAL_MODEL`), **41** (step-12 wording vs the union-merge repair),
**42** (merge check vs a human-granted bypass), **43** (goal as a lossless
oracle), **44** (name the provider failure before the countdown), **45**
(navigator attempt-awareness), **47** (red-base convention), **48** (suite-cost
budget), **49** (shared faux-provider helper). Two were declined by the human
at the step-13 gate: a wiki page and a `0.19.0` release bump. Three items were
dropped with reasons — most notably the claim that `retry.enabled` is
unconsumed, which is **false at HEAD** (consumed by both loops and pinned by
four tests).

## Spend

≈ **$9.79** catalogue-estimate for the seven merged runner containers, ≈
**$14–15** all-in including the four escalation containers and the ruling
dispatches. Version stayed **v0.18.0** through closure — the third
behavior-changing epic behind one stamp — and the release landed after
closure as **v0.19.0** (`package.json` bumped, `v0.19.0` tagged, `latest`
moved).

## Related

- [[retry-classification]], [[retry-policy]], [[parent-turn-continuation]],
  [[per-attempt-provenance]], [[figure-scoped-disclosure]] — the concepts this
  run shipped
- [[headless-pi]], [[hub-job-supervision]], [[council-config]] — the substrates
  it changed
- [[deterministic-merge-check]], [[union-merge-reconcile]],
  [[engineering-board]], [[council-runner]], [[product-owner]], [[steward]] —
  the process pages it sharpened
- [[2026-09-15-epic8-run-ledger]] — the preceding autonomous run

## Sources

- `vault/raw/2026-09-16-epic9-run-ledger.md` (raw)
- `vault/raw/2026-09-16-po-epic9-retry-ruling.md` (the decomposition ruling)
- `vault/raw/2026-09-16-po-ev37-merge-gate-defect.md` (the colon-defect ruling)
- `vault/raw/2026-09-17-po-ev40-ruling.md` (Q1–Q6)
- `vault/raw/2026-09-16-po-ev39-step6-ruling.md` (Q1–Q4)
- `vault/raw/2026-09-17-po-ev42-step6-ruling.md` (J1/J3)
- `vault/raw/2026-09-16-design-ev42-partial-legend.md`
- `council/cards/EPIC-9.md` (`## Run closure fact`) and `council/cards/EV-37.md` … `EV-43.md`
