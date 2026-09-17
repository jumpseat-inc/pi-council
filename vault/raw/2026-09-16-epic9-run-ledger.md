# EPIC-9 Run Ledger (2026-09-16)

Raw record of the `/features-new` decomposition and `/features-deliver EPIC-9`
autonomous run: **provider-error retry with exponential backoff, configured in
`.council.json`**. Seven children (EV-37, EV-38, EV-43, EV-40, EV-39, EV-42,
EV-41) were decomposed from a human intake and delivered end to end — seven PRs
(#51–#57), each squash-merged under the [[deterministic merge check]] with
`--match-head-commit` and `gates` re-verified green on the merged SHA. The epic
card itself closed `Done` (the fourth epic-card closure on the board). Version
stays **0.18.0** — no bump commit (the EPIC-7/EPIC-8 precedent; three
behavior-changing epics now sit behind one stamp).

The run's defining shape: **the merge gate's five criteria all passed on a
deliverable that could not work.** EV-37's literal branch was dead — the goal's
frontmatter could not spell the string pi actually emits — and owner, Skeptic,
and judge all cleared it. What caught the defect was the orchestrator reading
pi's *installed bundle* rather than the card. Four of seven cards escalated at
step 6; no `HALT`, no `RETIRED`, one human-authorised merge bypass.

## The human intake (verbatim, the epic's source of truth)

The intake arrived as a herdr clipboard image plus text:

> `/tmp/herdr-clipboard-images-1001/client-60-clipboard-1789558473706576151-0.png`
> — This is an example screenshot that if a provider errors, pi just stops. I
> wanna build a feature for `pi-council` to be able to retry with exponential
> backoff, the settings for this to be written into `.council.json` with
> default values of course.

The screenshot shows a `/features-new` run where `council_dispatch` returned
`Provider finish_reason: error` and the session dead-ended at the visible
affordance `Continue`, with no recovery.

## Decomposition (the `/features-new` three-wave session)

Four seats deliberated ([[principal]] authored wave 1; [[skeptic]] and
[[designer]] attacked in parallel in wave 2; [[product-owner]] ruled last in
wave 3, unconditionally). Epic `EPIC-9`, children EV-37 … EV-43 — all
`Backlog` at decomposition, because the wave-3 ruling named content no seat had
authored (the classifier's widened predicate, the policy defaults table and
invalid-value set, the budget source and delay formula, the retry surface copy,
the forcing-path fixtures, the manifest field, and the reachability observable).

| child | scope |
|---|---|
| EV-37 | pure `classifyRetry` predicate for a settled job report |
| EV-38 | `.council.json` `retry` section, loader, shipped defaults, scaffold seed |
| EV-43 | reachability falsifier — does an `agent_settled` handler + `sendUserMessage` produce a second turn? |
| EV-40 | parent-turn continuation (the intake's actual failure surface) |
| EV-39 | hub-level retry of a seat dispatch |
| EV-42 | per-attempt identity in the run substrate |
| EV-41 | end-to-end falsifier through both paths |

The wave-3 ruling also **added EV-43** as a new child (a reachability gate that
gates EV-40) rather than a fold-in, on the ground that a yes/no deliverable with
portfolio consequences on "no" is a card. `FLLWUP-34` (a bounded retry policy
for a failed usage-store write) was named as a *different* retry and left
untouched.

## Phase 0 / Phase 1 (the run's preflight)

Phase 0 passed clean: `council/preflight.sh` → `PASS: preflight clean`; all
nine needed seats resolved from disk by name (`owner`, `principal`, `designer`,
`skeptic`, `consolidator`, `judge`, `product-owner`, `steward`,
`council-runner`); `gh` authenticated with `repo` scope.

Phase 1 recorded **five human rulings** on the card faces (immutable for the
run, binding on every seat):

- **R1** — the retry predicate is the literal `Provider finish_reason error` OR a
  match of pi's shipped `RETRYABLE_PROVIDER_ERROR_PATTERN`; council's classifier
  is a superset of pi's, never narrower.
- **R2** — the shipped `retry` block: `enabled: true`, `maxAttempts: 3`,
  `baseDelayMs: 2000`, `maxDelayMs: 30000`, `jitter: true`, surfaced as concrete
  JSON in `council/scaffold/.council.json`.
- **R3** — validation set: throws naming file and key; `maxAttempts` integer
  ≥ 1, `baseDelayMs` integer ≥ 100, `maxDelayMs` integer ≥ `baseDelayMs`,
  `enabled`/`jitter` booleans.
- **R4** — hub intermediate-attempt visibility: **one job-tree row per
  dispatch, labeled `attempt 2/3` while retrying**; no extra rows, no separate
  status line; the final report names the attempt count.
- **R5** — retry surface copy: during backoff the input bar reads
  `Retrying in 2s (attempt 2 of 3) — Esc to abort`; `Esc` aborts; exhaustion
  stops with `Retries exhausted after 3 attempts. The provider kept failing.
  Press Enter to try again.`

[[product-owner]] then ratified all eight cards `Backlog → Ready` (job-5) and
[[steward]] ruled the build order (job-6): **EV-37, EV-38, EV-43, EV-40, EV-39,
EV-42, EV-41** — parent-turn before hub retry, because the parent path is the
intake's surface; EV-41 last.

## Delivery (seven gated merges)

| card | PR | merged SHA | note |
|---|---|---|---|
| EV-37 | #51 | `6a375c4` | classifier; **the merge gate caught a dead literal branch first** |
| EV-38 | #52 | `3e39e66` | `loadRetryConfig` + R2 defaults in the scaffold |
| EV-43 | #53 | `8853712` | reachability: **yes in both branches**; control arm closed attribution |
| EV-40 | #54 | `6ab0e48` | `extensions/parent-retry.ts` + `index.ts`; 3 verify cycles, final green |
| EV-39 | #55 | `79c0573` | hub retry; `attempt N/M` row label; interim disclosure |
| EV-42 | #56 | `952d5c1` | per-attempt provenance; provider-reported figure sums every attempt |
| EV-41 | #57 | `653ce01` | end-to-end falsifier; red at base `3a3773f`, green at head |

Test count moved from **713 pass / 2 skip** at EV-37's head to **847 pass /
2 skip** (75 files) at EV-41's head. `gates` ran `SUCCESS` on every head SHA
and was re-verified `success` on every merged SHA.

### The EV-37 defect (the run's headline)

`extensions/retry.ts` shipped `PROVIDER_FINISH_REASON_ERROR = "Provider
finish_reason error"` — **without the colon**. pi's `mapStopReason` default
branch emits `` `Provider finish_reason: ${reason}` ``, so for
`finish_reason === "error"` the real message is `Provider finish_reason: error`.
The shipped constant did not equal it, and the real message matched none of
pi's retryable tokens either, so `classifyRetry` returned `undefined` for
exactly the error the epic exists to retry.

Root cause: `council/validate.py` forbids a colon-space sequence in a card's
`goal` (frontmatter is parsed as plain `key: value` lines), so EV-37's goal
spelled the literal without its colon — and the owner implemented the goal's
spelling byte-for-byte. The Skeptic's drift test re-extracted pi's *token list*
from the bundle but never asserted the *literal* against the bundle's error
template. Owner, Skeptic, and judge all passed.

The orchestrator found it by grepping the installed bundle and proving
`classifyRetry(real) === undefined` with a three-line regex probe. `steward`'s
merge gate was halted; [[product-owner]] (job-8) ruled it **not** a goal defect
— the `Intent` binds "the literal" to pi's emitted message, and the goal's
colon-free spelling is structurally forced — so it was an owner-routable
code-and-test fold-in. The fix landed at the new head `5f5176a` with a
regression test that derives its expectation from the installed bundle
(`mapStopReason`'s template evaluated at `reason === "error"`) and fails on the
old spelling. Merged at `6a375c4`. Carded afterwards as `FLLWUP-43`.

## Escalation profile (four step-6 escalations, all discovered mechanisms)

| card | ruling seat(s) | the dispute |
|---|---|---|
| EV-43 | product-owner job-13 | is the acceptance's named TUI observable a *naming* or an *existence* requirement? Ruled (B): naming. |
| EV-40 | product-owner job-17 | Q1–Q6: is R5's input-bar surface binding or may the countdown re-pin to the status row? Enter semantics; headless Esc/Enter; input editability during backoff |
| EV-39 | product-owner job-20 → steward job-21 | Q1 denominator carrier (inject the init-time policy snapshot); Q2 EV-42's premise is now false; Q3 tick interval; Q4 partial reported figure disclose-vs-fix |
| EV-42 | product-owner job-24 | J1 is `partial` figure-scoped (no `partial` on an all-unaccounted record); J3 the new legend copy |

Two rulings deserve their own line:

- **R5 was strong enough to decline an alternative.** [[designer]] proposed
  re-pinning the countdown to `setStatus("council.retry", …)`; product-owner
  ruled R5's input bar binding (implement via `setEditorComponent`, the
  `focus-nav` `CustomTreeEditor` precedent) and named the dissent. The
  escalation was *whether the named surface was binding* — a different question
  from copy.
- **Steward re-scoped a `Ready` sibling in place.** EV-42's `Intent` premise
  ("each attempt mints a fresh job id, a fresh manifest, and a fresh session
  file") was made false by EV-39's settled cardinality (one job id / one
  manifest / one row, with an `attempt` field and carried cumulative usage).
  Steward ruled: EV-39 records the shipped mechanism in its own card and
  **does not touch EV-42**; the orchestrator executes the card edit
  between cards, same id, same slot; `attemptGroupId` dropped; goal replaced.
  Gate **G5** closed on that ruling.

## Human interventions (two, plus the Phase-1 and step-13 gates)

1. **The first autonomous merge was deferred for a human watch, then waived.**
   The EV-37 merge was held at the gate with the full five-criteria evidence;
   the human replied "No human watch required for first merge, run unattended",
   and a fresh runner executed the pinned merge.
2. **A mid-run `main` ruleset required a human-granted bypass.** A ruleset
   (`main`, created `2026-09-16T18:05:56Z`, during the EV-40 card) requires
   1 approving review plus linear history, with the authenticated account a
   `bypass_mode: always` actor. The authority map re-homes the human merge gate
   to the five criteria, but a review-requiring ruleset makes every autonomous
   merge depend on a human act. The human authorised `--admin` for the
   remaining merges, **run-scoped only**. Every merge from EV-40 on used
   `gh pr merge <PR> --squash --admin --match-head-commit <X>`.
3. **Phase 1** recorded R1–R5; **step 13** approved 9 of 11 drafted follow-ups.

## Step-12 reconciliations (the divergence pair)

Local `main` diverged twice, both repaired non-destructively, never by force:

- **EV-37**: the branch was rebased by the owner onto the runner's record
  commits (force-with-lease) after the colon fix; then local `main` carried a
  record commit made after the branch cut and the reconcile used a **union
  merge** (`6573fe0`, parents `953dafd` + `6a375c4`), verified with
  `git merge-base --is-ancestor 6a375c4 HEAD`.
- **EV-40**: local `main` ended `ahead 10, behind 2` after the squash folded
  the runner's records; reconciled in a worktree branched from `origin/main`
  and pushed fast-forward. The orchestrator later reconciled the main checkout
  itself (local `main` lacked EV-40's code).

`council.md` step 12 says to stop and surface a non-fast-forward; the wiki's
[[union-merge reconcile]] documents the union merge as routine. Both repairs
were resolved by inference from the wiki, not from the procedure text —
carded as `FLLWUP-41`.

## Follow-ups and residuals

Filed (`Backlog`, `epic: EPIC-9`, all unpromoted): **FLLWUP-40** (isolate
`COUNCIL_EVAL_MODEL` from `test/eval-runner.test.ts`), **FLLWUP-41**
(reconcile step 12's wording with the union-merge repair), **FLLWUP-42** (make
the merge check independent of a human-granted admin bypass), **FLLWUP-43**
(make the goal field a lossless oracle for the judge), **FLLWUP-44** (name the
provider failure before the backoff countdown), **FLLWUP-45** (navigator
attempt-awareness), **FLLWUP-47** (documented red-base convention),
**FLLWUP-48** (suite-cost budget for the live pty/`-p` arms), **FLLWUP-49**
(promote the offline faux-provider harness into a shared smoke helper).

Drafted and **declined by the human** at the step-13 gate, not carded:
`FLLWUP-46` (a wiki page for hub retry / retry policy / per-attempt identity)
and `FLLWUP-50` (a `0.19.0` release bump, tag, and `latest` move).

Dropped by the steward closure ruling, recorded so the next sweep does not
re-litigate them:

- The claim that `retry.enabled` is unconsumed — **false at HEAD**: consumed at
  `extensions/job-retry.ts:77` and `extensions/parent-retry.ts:142`, pinned by
  four tests including EV-41's `enabled: false` control arm.
- The `loadCouncilConfig` reserved-key comment (`extensions/seats.ts:495-499`)
  guards a seat literally named `theme`, not the top-level key — zero
  behavioral reach.
- The O10 measurement (absent vs header-only session JSONL on a real failed
  attempt) — no real failed-attempt run directory was observed (all harnesses
  use injected stubs); recorded `open-untested` on EV-42's card.

Two permanent residuals ride with the epic without cards: the `theme`-comment
wording nit, and O10. The version bump is **not** a closure condition
(`package.json` stays `0.18.0`), and no `## Acceptance` section was
retro-fitted to the epic card — the `goal` alone governed, with the card's
`## Run closure fact` recording the observed acceptance.

## Spend

Runner containers for the seven merged cards (top-level lines): ≈ **$9.79**
catalogue-estimate, ≈ 146M tokens incl. cache reads. The escalation containers
(EV-43 first pass, EV-40's failed first pass, EV-39 first pass, EV-42 first
pass) plus the ruling dispatches add roughly **$4–5**, for a run total of
roughly **$14–15** catalogue-estimate. The orchestrator's own session is not
captured.

Per-container lines:

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

## Raw artifacts this ledger summarizes

- `council/cards/EPIC-9.md` (`## Run closure fact`) and
  `council/cards/EV-37.md` … `EV-43.md` (the per-card deliberation records).
- `vault/raw/2026-09-16-po-epic9-retry-ruling.md` (the wave-3 decomposition
  ruling that created EPIC-9 and EV-37…EV-43).
- `vault/raw/2026-09-16-po-ev37-merge-gate-defect.md` (the colon-defect ruling).
- `vault/raw/2026-09-17-po-ev40-ruling.md` (Q1–Q6).
- `vault/raw/2026-09-16-po-ev39-step6-ruling.md` (Q1–Q4).
- `vault/raw/2026-09-17-po-ev42-step6-ruling.md` (J1/J3).
- `vault/raw/2026-09-16-design-ev42-partial-legend.md` (the designer's
  first-pass position on the partial legend).
