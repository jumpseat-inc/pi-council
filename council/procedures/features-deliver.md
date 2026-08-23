---
description: Deliver an epic autonomously — after a human-rulings preflight that front-loads every decision, the Council runs every card in scope through the full /council loop without stopping.
argument-hint: [EPIC-KEY]
---

You are the orchestrator delivering `$ARGUMENTS` autonomously. `/council`
runs one card with a human in the loop for judgment, merge, and strategy.
This command runs every card under an epic the same way, except that a
`council-runner` (a packaged Council seat) executes each card's
loop in an isolated container, and the human's reserved powers are either
re-homed to a seat or recorded up front.

## The authority map

This table is the **complete and exhaustive** re-homing of every power
`/council` reserves to the human, for the duration of this run only. No
additional authority may be inferred from the autonomy mandate beyond what
this table states — if a situation arises that doesn't map cleanly onto one
of these rows, it is not covered, and covered means routed to a human per
Phase 1 or the escalation contract below, not decided by inference from this
table's spirit.

| Power (as `/council` reserves it to the human) | Autonomous home |
|---|---|
| Judgment — the `Needs Human` route, mid-flow decisions, fold-in rulings, promotion ratification | `product-owner`, escalating to `steward` |
| Merge — the human merge gate | the deterministic artifact check below |
| Strategy — build order within the epic, retiring cards, ending the run | `steward` |

`designer` is a working seat, not a ruling one. It is dispatched by
`council-runner` alongside `owner` and `principal` on surface-touching
cards and holds no authority in this table: a design critique never rules,
never blocks a merge, and never overrides the deterministic merge check.
Design disputes it raises follow the judgment row like any other
open-judgment item.

## Phase 0 — deterministic preflight

Run `bash council/preflight.sh` once, at run start, before any card
container is dispatched. Any `FAIL:` line halts the run — environment repair
is never autonomous, the same rule `/council` step 0 states for an attended
run. This command is not interactive, so if preflight reports something
that needs a human action (e.g. Mongo not up, `gh` unauthenticated), refuse
to start and report it rather than working around it.

**Seats must be dispatchable by name before the run commits to anything.**
Verify every seat this epic's cards will need — `owner`, `principal`,
`designer`, `skeptic`, `consolidator`, `judge`, `product-owner`, `steward`
— actually resolves as a named agent. A registry gap is a hard error, not
a degraded result: stop Phase 0 and report that the session needs
restarting so the registry picks up the current seat files. This is the
same check `council-runner.md`'s `<seat_resolution_check>` repeats per
card; catching it here, before a single card is in flight, is cheaper than
catching it mid-deliberation.

## Phase 1 — the rulings preflight

Read every card in `$ARGUMENTS`'s scope — the epic and every child whose
`epic:` field names it — before dispatching a single `council-runner`.
Surface **every foreseeable decision to the human before the run starts**:
open-judgment calls the deliberation is likely to raise, strategy forks in
build order, any judgment the seats might not be allowed to make. This is
front-loading, not a guess-everything exercise — catch what's foreseeable
now, not every possible dispute a deliberation might raise later.

Surface-touching cards raise the most predictable class of open-judgment
call — user-visible copy, what a state is named, how much uncertainty to
show a driver about data that has no realtime availability and no prices.
Front-load these specifically: a copy ruling recorded in Phase 1 saves an
`ESCALATION` round-trip per card.

Record each ruling on the card face it applies to. **These are recorded
human decisions: immutable for the run and binding on every seat, `steward`
included.** A `council-runner` that hits a dispute already covered by a
Phase 1 ruling applies it and cites which ruling it applied, per its own
`<escalation_contract>` step 1 — it does not re-ask, and it does not treat
the ruling as a suggestion it could reweigh.

## Phase 2 — execution

Schedule the epic's cards in dependency order (`steward`'s call, per the
authority map's strategy row, if the order isn't already forced by the
cards' own dependencies). Dispatch one `council-runner` per card to run the
full `/council` loop inside its own isolated context.

**Never dispatch two runners at once against the same board.** `board.md`
and the individual card files are the run's only durable state, and
`council-runner.md`'s `<board_discipline>` makes each runner the single
writer of its own card while it holds it — two runners in flight at once
would race on `council/board.md` itself.

Service each runner's report per its `<return_contract>`:

- **`ESCALATION`** — dispatch the ruling seat the report calls for
  (`product-owner`, escalating to `steward` per its own criteria, per the
  authority map's judgment row), then resume the card by dispatching a
  fresh `council-runner` for it with the ruling included verbatim in its
  input (a settled runner job cannot be re-entered; the card file and
  board carry the durable state the new runner resumes from). Do not
  paraphrase or soften the ruling; the runner appends it to the card's
  record and treats it as binding.
- **`DONE`** — record the merge in the run ledger (Phase 3) and continue to
  the next scheduled card.
- **`RETIRED`** — record the withdrawal and the ruling that produced it in
  the ledger, then continue.
- **`HALT`** — an environment failure the container could not repair itself.
  Stop dispatching further cards until the halt is resolved — a `HALT` on
  one card is frequently a Phase-0-shaped problem (a seat that stopped
  resolving mid-run, an unmet prerequisite) that will recur on every
  remaining card, not a card-local failure safe to route around.

## Phase 3 — the run ledger

At the end of the run — whether it closed the whole epic or stopped early —
report:

- **Every merge**, with its basis: the deterministic merge check's five
  criteria, satisfied, per card.
- **Every follow-up filed** during the run, the same way `/council` step 13
  requires of an attended run: never a prose bullet, always its own card,
  drafted and confirmed before it's written.

## The deterministic merge check

This is what replaces the human at the merge gate. It is executed
mechanically, with no discretion — no seat, including `product-owner` and
`steward`, may substitute judgment for any of the five criteria below, and
none may be skipped because the change is small or the run is confident.
All five must hold:

1. Every owner gate green, in full — the four gates in
   `docs/gates/GATE-EVIDENCE.md`.
2. **GitHub Actions green on the PR head SHA.**
3. No blocking Skeptic objection.
4. Judge verdict `PASS`.
5. No `Needs Human` state or outstanding ruling on the card.

**Criterion 2 must be spelled out precisely, because it is the one signal
no agent can fake:**

> Read the checks with `gh pr checks <PR> --json name,state,workflow`. Key
> on the `workflow` field, not `name` — the job is named `gates`. Assert
> that the `gates` workflow appears with `state: SUCCESS`. Asserting merely
> that nothing is failing is not sufficient: an absent check is not a
> failing check, and a check that never ran produces no row at all.

**The merge itself must be pinned to the SHA the five criteria were checked
against.** A push landing a new commit between the check and the merge
would let the merge land an unchecked SHA silently. Perform the merge with
`gh pr merge <PR> --match-head-commit <X>`, where `<X>` is the exact SHA
criterion 2 was read against; if `--match-head-commit` is unavailable for
the merge method in use, re-read `headRefOid` immediately before merging and
abort if it no longer equals `X`. Either way, a mismatch is a **`HALT`, not
a retry**.

Merge-time behaviour — branch protection, required status checks — may not
be configured in this repo. The first autonomous merge this command
performs should be watched by the human, not merely reported after the
fact.

## Guards

These hold throughout the run, not just where first mentioned:

- **Step 3's ≤3-round exchange cap**, inside each card's deliberation, is
  hard — `council-runner.md` runs `/council` under this cap exactly as an
  attended facilitator would.
- **Step 9's ≤3 verify-cycle cap** is a separate cap on a separate loop —
  the verify → fix → verify loop, not the exchange rounds. Do not conflate
  the two.
- **Stop one bad runner before scaling to more.** If a `council-runner`'s
  report looks wrong, off-task, or is repeating a dispute a ruling already
  settled, pause Phase 2 and address that runner's card before dispatching
  further ones.
- **The owner gates are met in full regardless of change size**, for every
  card in the epic — a one-line change clears the same gates as a
  thousand-line one, and nothing about running unattended lowers that bar.
