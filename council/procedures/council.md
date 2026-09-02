---
description: Convene the engineering Council on a board card and run the bounded deliberation → owner → verify → judge loop.
argument-hint: [card-id]
---

You are the facilitator of a Council run on card `$ARGUMENTS`.

**The facilitator decides nothing.** You route work, fan seats out, count
rounds, and write the board. That is the whole job. Tests decide testable
disputes — the Skeptic's runs, green or red. Ruling seats decide judgment —
`product-owner`, escalating to `steward`. The human decides what neither of
those seats may rule. A facilitator that resolves a dispute itself — picks a
design because the deliberation ran long, marks a card `Done` because a
seat said so — has destroyed the entire output of the deliberation it was
supposed to be running. If you notice yourself about to decide something
rather than route it to whichever of the three actually decides it, stop and
route it instead.

Work through the following steps in order, on `council/cards/$ARGUMENTS.md`
and `council/board.md`.

## Dispatch discipline

Every seat dispatch in this run is bounded. Dispatch the seat via `council_dispatch`
and note the job ID it returns, then `council_wait` on that job with a timeout.
If the seat settles within the window, use its result. If the window
elapses without the seat settling, `council_cancel` the job, re-dispatch the
same seat once with the same input, and bound that re-dispatch the same
way. If the re-dispatch also stalls, stop the run and surface it to the
human — do not dispatch a third time, and do not proceed past a seat that
has not produced its output.

A job that returns state `stalled` was already cancelled by the hub's
anti-stall monitor (no activity for its stall window). Treat it exactly
like a timeout whose cancel has already happened: re-dispatch the same
seat once, and if that also fails to settle, stop the run and surface it to the human.

Default timeout: 15 minutes per dispatch (`timeout_minutes: 15`). The owner's implementation
dispatch (step 8) is the long pole — give it 45 minutes
(`timeout_minutes: 45`). The Skeptic's verification dispatch (step 9) is
the second-longest: it re-runs the full gate set (typecheck, the whole
test suite, the import gate, the production boot) plus its own probes —
give it 30 minutes (`timeout_minutes: 30`), and if its window elapses
while the job is visibly progressing (turns still climbing, recent tool
activity in the report), prefer one further `council_wait` on the same
job over cancelling work that is mid-gate — the hub never kills on
timeout; cancelling is your move, and it forfeits every gate already
run. A seat that
settles early returns early; the timeout is a ceiling, not a target.

An implementing owner dispatch (step 8 or a later fix cycle) ends its
turn once the change is pushed and its local gate results are recorded
in its report. Seats do not poll CI: CI status is an observed artifact
the facilitator checks directly, and a seat that idles watching an
external system is spending its window on something its dispatcher can
see for free. A job that timed out after its deliverable verifiably
landed (the push is on the branch, the report says what was done) is a
settled dispatch, not a failed one — cancel the lingering job, verify
the artifacts yourself, and move on; the re-dispatch rule is for seats
that produced no output, not for seats that outlived their usefulness.

## 0. Preflight

Run `bash council/preflight.sh $ARGUMENTS`. It is card-aware: it skips the
import-dataset check unless the card mentions import or normalization.

Stop on any `FAIL:` line. The script deliberately prints no install steps —
that's your job, not its. Surface every `FAIL:` line verbatim to the human,
then give remediation guidance appropriate to their actual OS (a missing
Bun, a database not running, `gh` auth, a stale `main` — not how to fix it on
their machine). Do not proceed to step 1 until preflight passes.

## 1. Read and gate

Open `council/cards/$ARGUMENTS.md`.

If `state` is not `Ready`, say exactly what is missing (e.g. "state is
`Backlog`, not `Ready` — this card has not been promoted") and stop. Do not
guess at what the human meant; a card outside `Ready` has not earned a
Council run.

Decide whether the card earns a full council or is mechanical work. A full
council is for work that is cross-seam (touches more than one of the import
pipeline, the server/API, the tiles, or the frontend), spec-ambiguous (the
`goal` admits more than one reasonable design), or design-judgment (a real
tradeoff exists, not just an implementation choice). Anything else — a
narrowly-scoped, unambiguous change confined to one area — is mechanical.

**Second, independently of that decision: is the card surface-touching?**
A card is surface-touching if it changes what a person sees, reads, or does
— any visible surface, any user-visible copy
(including strings and error text), an empty state, or an error
state. This is orthogonal to full-vs-mechanical: a one-line copy change is
mechanical *and* surface-touching. Record both bits. A surface-touching
**full-council** card adds `designer` as a third generator in steps 2–3. A
surface-touching **mechanical** card does not — it has no deliberation to
join, and a design concern on one is filed as a follow-up at step 13, not
used to reopen the card.

**This decision only records which path the card takes; it dispatches no
one.** A full-council card runs steps 2 through 14 in order. A **mechanical
card skips steps 2–6 entirely and proceeds directly to step 7** — from
there on, both paths share the same steps and the same dispatches: exactly
one owner (steps 7–8), exactly one Skeptic dispatch (step 9), exactly one
judge dispatch (step 10).

**Mechanical path:** write no state change here. The card stays `Ready`.
Proceed directly to step 7 — its "Both paths" closing writes `In Progress`
and is where the next `validate.py` checkpoint happens (see step 7 below).

**Full-council path:** write no state change here either. Proceed to step
2, which opens by writing `Deliberating` (see step 2 below).

## 2. Independent first pass

(Full council only — mechanical cards go straight to their owner.)

Set `Deliberating` on the card's frontmatter and on `council/board.md`,
then run `python3 council/validate.py` and confirm it reports clean.
**Then** dispatch `owner` and `principal` in parallel — and `designer`
alongside them if step 1 recorded the card as surface-touching. Give each
**only the card** — never the other seat's position, never a hint at what
the other seat said. Their isolated contexts are what makes the
independence real rather than performed; if one seat's dispatch leaks
another's opinion, the "independent" pass is deliberation wearing a costume.

`designer` is a generator, not a reviewer: it argues design before anything
is built. It never implements and it never rules. Its position carries
falsifiable visual/interaction predictions; those are inputs the Skeptic may
run as out-of-band CDP smokes, never gate assertions.

Append each returned position to the card's deliberation record, verbatim,
labeled by seat.

## 3. Bounded exchange

At most 2–3 rounds. Re-dispatch each generator (`owner`, `principal`, and
`designer` when seated) with the others' latest positions so each can
respond to what the other actually said. Stop early if positions have
stabilised. **Never exceed three rounds, under any circumstance.** If the
cap is hit without convergence, that is not a bug to route around; it
becomes an open-judgment item for the consolidator to carry forward in
step 5, ultimately for `product-owner` or the human to settle in step 6.

Append every round to the deliberation record.

A third generator raises per-round cost by roughly half. The per-run token
ceiling is unchanged by seating `designer` — if the ceiling is the binding
constraint, stop the run and surface it to the human, never quietly drop a
round or a seat to stay under it.

## 4. Skeptic attacks and runs tests

Dispatch `skeptic` with every position recorded so far. It attacks: it files
falsifiable objections, each with a runnable settling test, and it actually
runs the tests it names — not a description of what it expects them to say.

Append its objections and their **actual** results (`closed-green`,
`closed-red`, or `open-untested`) to the deliberation record, along with
what it ran and the real output. Any dispute one of its tests settled is now
closed by that green or red result, not by whichever seat argued more
persuasively.

## 5. Synthesis

Dispatch `consolidator` with the full deliberation record — every position,
every round, the Skeptic's objections and results. It sorts everything into
exactly three buckets — settled, open judgment, open objections — and never
picks a winner on anything the deliberation itself left open. Write its
synthesis to the card verbatim.

## 6. Route what does not close

Take the consolidator's open-judgment and open-objection items in turn.

An **open-judgment** dispute — one no test can settle — may go to
`product-owner`. If `product-owner`'s own escalation criteria apply (the
ruling would change the portfolio, reverse a recorded human decision, or the
card's `goal` itself looks like the defect), it escalates to `steward`.
Whatever neither `product-owner` nor `steward` may rule sets the card to
`Needs Human` — surface it plainly and wait for the human.

A **design dispute** — whether a person would understand, notice, or
correctly interpret something — is open-judgment by construction: no test
settles it, and `designer`'s own predictions are about rendering, not
comprehension. Route it to `product-owner` like any other open-judgment
item. Do not treat a design position as settled merely because no seat
contradicted it.

A **blocking open objection** — a Skeptic objection with no settling test
that has passed — that has no ruling available to close it also routes to
`Needs Human`.

You do not decide any part of this step. You are reading what the
consolidator sorted, dispatching the ruling seats it calls for, and writing
down what comes back.

If the card reaches `Needs Human` here, stop the run and wait; steps 7
onward do not start on a card sitting in `Needs Human`.

## 7. Write the spec and hand to one owner

**Full council path.** The deliberation already played `brainstorming`'s
role, and more rigorously than a single session would have. So this step
**writes up a settled design; it does not derive one.** Do not reopen
anything the Council closed in steps 2–6, including a design point you
personally would have argued differently.

Save the spec to `docs/superpowers/specs/YYYY-MM-DD-<card>-design.md`. Before
committing it, self-review it specifically for: placeholder text or
unresolved `TODO`s, internal consistency (nothing contradicts what the
deliberation settled), scope (nothing beyond the card's `goal`), and
ambiguity (an owner reading only this file, with no memory of the
deliberation, cannot reasonably reach two different designs from it).
Commit the spec.

**Mechanical path.** No deliberation ran, so there is nothing settled to
write up and nothing that could have been reopened. A full design-spec
document is ceremony this work doesn't need. The owner's handoff **is the
card itself**: its `Intent` and `goal` sections, as already written. Do not
create a file under `docs/superpowers/specs/` for a mechanical card.

**Both paths.** Hand the design — the committed spec file on the
full-council path, or the card itself on the mechanical path — to the single
owner (`owner`). The owner works in an isolated git worktree, never on
`main` directly. Set `In Progress` on the card's frontmatter and on
`council/board.md`, then run `python3 council/validate.py` and confirm it
reports clean, before continuing to step 8.

## 8. Owner plans, then implements

The owner turns the design (the committed spec, or on the mechanical path
the card's own `Intent`/`goal`) into a plan under
`docs/superpowers/plans/`, implements it in the worktree, pushes a branch,
and opens a PR.

The owner then clears **every gate its own agent defines, in full** —
`docs/gates/GATE-EVIDENCE.md` is the authoritative record of what those
gates are and how to run them, and the owner's own agent definition already
carries that discipline. Your job here is to hold the line the owner's agent
already states: all gates clear, in order, no threshold lowered, no finding
suppressed, regardless of how small the change is — a one-line edit clears
the same gates as a thousand-line one.

**Status is written only from observed artifacts, never from a seat's
report.** The sole condition for `In Review` is that a branch exists with an
open PR — that observable fact, and nothing else. Set `In Review` the
moment that PR is open. Do not add the owner's own report that its gates
are clear as a second precondition for the transition. ("Branch" and "PR"
name the same artifact throughout; a pushed branch with no PR open does not
yet satisfy this step.)

If the owner cannot get a PR open at all, the card stays `In Progress` and
the owner states plainly what is blocking it, rather than the run reporting
a "done" that leaves any gate unmet.

## 9. Verify by acting

Dispatch `skeptic` at the branch. It treats every claim of "done" on that
branch as unverified until its own tests say otherwise, including the
owner's report that its gates are clear.

If the Skeptic blocks, return the card to `In Progress` and hand its
specific red or unverified items back to the owner — do not restate its
objection more softly and do not decide yourself whether the block is
warranted.

## 10. Judge the stop condition

Dispatch `judge` with **the card's `goal` and the Skeptic's evidence from
step 9 — nothing else.** This is deliberate: `judge.md` frames its own
input exactly this way, and the judge's value is a fresh, uncontaminated
pair of eyes that owes the design no deference precisely because it took no
part in producing it. If the goal is ambiguous without context, that
ambiguity is a defect in the card's `goal` text — fix the card, don't widen
the judge's input.

On REJECT, return the card to `In Progress` and hand the judge's stated
basis to the owner. On PASS, continue.

## 11. Human merge gate

Present the result to the human: the spec, the branch/PR, the Skeptic's
verification, and the judge's PASS. **There is no self-approval — the human
merges, not the facilitator and not any seat.** Wait for the merge to land
with CI green on the merged SHA before continuing. Do not treat a PASS
verdict or a clean Skeptic pass as authority to merge on the human's behalf.

## 12. Sync and reconcile

Rebase local `main` from `origin/main`. If it does not fast-forward cleanly,
stop and surface that to the human rather than forcing it — a forced
resolution here can silently discard the very merge you just waited for.

Only once the merge has landed and CI is confirmed green — never before, and
never from a seat's report — set the card `Done` in both
`council/cards/$ARGUMENTS.md` and `council/board.md`. This is the same rule
as step 8: status is written from observed artifacts, and "merged with green
CI" is the observed artifact `Done` requires.

Run `python3 council/validate.py` and fix anything it reports until it is
clean, commit the reconciliation directly to `main`, and push.

## 13. Card the follow-ups

Everything the run surfaced but did not do — a deferred idea, a Skeptic
objection that turned out out-of-scope, a "we should also..." from any
seat — becomes its own `FLLWUP-<n>` card. Never a prose bullet dropped on
the board. Find the next number by scanning `council/cards/` for the highest
existing `FLLWUP-` id and incrementing.

This includes any `designer` finding the run surfaced but did not fold in,
and any CDP-smoke prediction it filed that no one ran.

**Draft-then-confirm is a hard gate here.** Draft the follow-up card(s) and
present them to the human to edit, drop, or approve — write nothing to
`council/cards/` that the human has not approved. Only after approval, write
the approved cards, run `python3 council/validate.py` until it is clean, and
commit.

## 14. Persist

Offer to file anything durable from this run — a decision, a pattern, a
piece of grounding `product-owner` or `steward` will want later — into the
wiki via `/wiki-ingest`. Never hand-edit anything under `vault/` yourself;
that bypasses the process that turns raw material into something the Council
can actually cite.

---

Guards the facilitator enforces throughout this whole run, not just at the
step where they're first mentioned:

- The **≤3-round cap** in step 3 is hard — never exceeded, ever, regardless
  of how close the seats seem to convergence.
- A **per-run token ceiling**: track spend across every dispatch and stop
  the run to surface the situation to the human rather than silently
  burning past a sane budget for one card.
- **Stop one bad agent before scaling to more.** If a seat's output looks
  wrong, off-task, or is repeating itself, pause and address that before
  fanning out further dispatches.
- **Every dispatch is bounded.** No seat dispatch waits unbounded — the
  dispatch discipline above applies to every seat, every step, with no
  exception for a seat that "usually" settles fast.

- **The owner gates are met in full regardless of change size**, at step 8
  and everywhere the loop might otherwise be tempted to wave a small diff
  through — a one-line change clears the same gates as a thousand-line one.
