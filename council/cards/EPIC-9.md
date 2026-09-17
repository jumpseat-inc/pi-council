---
id: EPIC-9
title: Provider-error retry with exponential backoff under a .council.json policy
state: Done
owner: null
epic: null
goal: Council invocations survive transient provider errors by retrying with exponential backoff under a policy set in .council.json, instead of the session stopping.
---

## Intent

A provider error ends the run today. The cheapest fix — a hub-side backoff
loop for seat children — does not fix the reported failure, because that
failure is a parent-turn error that pi classifies as non-retryable and that
no hook can re-issue. The epic therefore front-loads the mechanism falsifier
(is an automatic resume even reachable from an extension?) and treats the hub
retry as the second, easier half.

The work crosses four seams. The retry decision — what counts as retryable,
given that pi's shipped pattern list does not match the error class in the
intake. The policy surface — a new top-level `retry` sibling in the committed
`.council.json`. The two execution paths — a seat child subprocess the hub
owns, and the parent turn's own provider call, which council does not. And the
run substrate — manifests, the inline job tree, and usage accounting, which
must distinguish attempts from dispatches and still sum honest spend.

`transient` is load-bearing. The classification predicate is where the
boundary against permanent errors is drawn, and it cannot be inherited from
pi's default list.

## Run closure fact (features-deliver)

All seven children are merged to `main` with the `gates` workflow `SUCCESS` on
each **merged** SHA: EV-37 `6a375c4` (#51), EV-38 `3e39e66` (#52), EV-43
`8853712` (#53), EV-40 `6ab0e48` (#54), EV-39 `79c0573` (#55), EV-42
`952d5c1` (#56), EV-41 `653ce01` (#57). No `HALT`, no `RETIRED`.

Two human interventions were required. The run's first autonomous merge was
deferred for a human watch, then waived by the human and executed unattended.
A `main` ruleset created mid-run (1 approving review plus linear history) made
every remaining merge depend on the human's run-scoped authorization of the
`--admin` bypass; that authorization is run-scoped and is not extended to the
next run (carded as `FLLWUP-42`).

The merge gate caught one real defect before it landed: EV-37's literal branch
was dead, because the goal's frontmatter colon-space rule forced the literal to
be spelled without its colon, so the classifier never matched pi's emitted
`Provider finish_reason: error`. The fix landed at a new head (`5f5176a`) and
merged at `6a375c4`; `product-owner` (job-8) ruled it an owner-routable
code-and-test defect rather than a goal defect (carded as `FLLWUP-43`).

**Closure ruled.** `steward` (job-27) ruled EPIC-9 closed on observed
acceptance, ending the run; this record applies that ruling. Nine follow-ups
ride as `Backlog` residuals under the `Done` epic, unpromoted: `FLLWUP-40`
through `FLLWUP-45`, and `FLLWUP-47` through `FLLWUP-49`. Two drafted
follow-ups were declined by the human at the step-13 gate and are **not**
carded: `FLLWUP-46` (a wiki page for hub retry, the retry policy, and
per-attempt identity) and `FLLWUP-50` (a `0.19.0` release bump, tag, and
`latest` move).

Four carded items are owed to the human before the next autonomous run, being
the standing machinery every run depends on: `FLLWUP-40` (COUNCIL_EVAL_MODEL
leaks into `test/eval-runner.test.ts`, so local gate evidence is
environment-dependent), `FLLWUP-41` (`council.md` step 12's non-fast-forward
wording contradicts the documented union-merge repair), `FLLWUP-42` (the
deterministic merge check depends on a human-granted admin bypass), and
`FLLWUP-43` (`validate.py`'s colon-space goal rule can make the goal a lossy
oracle for the judge).

Two permanent residuals ride with the epic, recorded so the next board sweep
does not re-litigate them. The `loadCouncilConfig` reserved-key comment
(`extensions/seats.ts:495-499`) guards a seat literally named `theme`, not the
top-level key, with zero behavioral reach and no shipped seat so named. The
O10 file-state measurement (whether a real failed attempt leaves an absent or a
header-only session JSONL) is recorded `open-untested` on EV-42's card because
no real failed-attempt run directory was observed; it would not change the
shipped, tested disclosure contract.

No version bump was made a condition of closure, so `package.json` stays
`0.18.0` (the EPIC-7 and EPIC-8 precedent). No `## Acceptance` section was
retro-fitted to this epic; the `goal` alone governed, and this closure record
is the observed acceptance.

Runner usage blocks (verbatim top-level container lines; per-dispatch lines are
recorded on the respective card records):

```
EV-37  job-7   turns=88  in 650082/out 69383/cR 3779269/cW 0/reason 35647/total  4498734 cost≈$0.5087
       job-9   turns=67  in 431420/out 37148/cR 1895551/cW 0/reason 10833/total  2364119 cost≈$0.3728
       job-10  turns=29  in 210596/out 22856/cR 1192576/cW 0/reason 15016/total  1426028 cost≈$0.0978
EV-38  job-11  turns=144 in 1100864/out 91186/cR 7243367/cW 0/reason 39176/total 8435417 cost≈$0.6975
EV-43  job-14  turns=70  in 398023/out 40610/cR 2983040/cW 0/reason 23112/total  3421673 cost≈$0.1951
EV-40  job-18  turns=655 in 7579900/out 494400/cR 57554889/cW 0/reason 287742/total 65629189 cost≈$4.5192
EV-39  job-22  turns=369 in 2085567/out 198673/cR 38136533/cW 0/reason 81882/total 40420773 cost≈$1.5600
EV-42  job-25  turns=203 in 1293713/out 136444/cR 15762460/cW 0/reason 72934/total 17192617 cost≈$1.0633
EV-41  job-26  turns=149 in 833381/out 92394/cR 11034994/cW 0/reason 40143/total 11960769 cost≈$0.7756
```

## Residual run — Phase 1 rulings (features-deliver, promote-residuals run)

Human decisions recorded before the first `council-runner` was dispatched.
Immutable and binding on every seat, `steward` included.

- **Scope promotion.** The nine `Backlog` residuals (`FLLWUP-40`–`45`,
  `FLLWUP-47`–`49`) are promoted to `Ready` and are this run's delivery
  scope. `EPIC-9` itself stays `Done`; these are residual cards, not an epic
  re-open.
- **Sequencing (strategy row).** Build order is re-homed to `steward`; the
  orchestrator dispatches one `council-runner` per card in `steward`'s
  ruled order, never two at once.
- **Merge (merge row).** R2 on `FLLWUP-42` — the human authorized squash
  merges with `--admin --match-head-commit <X>` for this run. All five
  deterministic criteria still hold; `--admin` only clears the ruleset's
  approving-review requirement, and the authorization is run-scoped.
- **Non-fast-forward repair.** R1 on `FLLWUP-41` — the documented union-merge
  reconcile is the sanctioned repair; force-push/rewind stays forbidden.
- **Copy.** R3 on `FLLWUP-44` — R5 re-opened for a transient provider-failure
  line; exact wording designer-drafted and product-owner-ruled before merge.
- **Follow-ups (judgment row).** `council.md` step 13's draft-then-confirm
  gate is re-homed to `product-owner`, which confirms, edits, or drops each
  follow-up draft before the card is written.
