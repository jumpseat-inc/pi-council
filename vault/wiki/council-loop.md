---
title: Council Loop
type: concept
summary: The facilitator-run deliberation → implement → verify → judge loop over a board card, bounded by round caps, token ceilings, gate discipline, and a human merge gate.
aliases: [council run, deliberation loop]
tags: [pi-council/concept]
sources: ["[[2026-08-24-bugfix-seat-prose]]", "[[2026-09-04-epic4-run-ledger]]", "[[2026-09-04-epic5-run-ledger]]"]
created: 2026-08-23
updated: 2026-09-04
---

> ⚠️ Derived from `council/procedures/council.md` + `council-runner.md` (captured 2026-08-23). Verify against the procedure files.

`/council` is the core procedure. The **facilitator decides nothing** (see
[[facilitator]]) — it routes
work, fans seats out, counts rounds, and writes the board. Tests decide testable
disputes; ruling seats decide judgment; the human decides the rest.

## The 15 steps (compressed, steps 0–14)

0. **Preflight** — run `council/preflight.sh` first; any `FAIL:` line halts the run (see [[preflight]]).
1. **Read and gate** — card must be `state: Ready`; decide full-vs-mechanical and surface-touching.
2. **Independent first pass** — dispatch `owner` + (`designer` if surface).
3. **Bounded exchange** — 2-3 rounds max; each generator responds to others.
4. **Skeptic attacks/runs tests** — files falsifiable objections + runs them.
5. **Synthesis** — `consolidator` sorts into settled / open-judgment / open-objections.
6. **Route what doesn't close** — open-judgment → product-owner/steward; else `Needs Human`.
7. **Write spec & hand to one owner** (full-council cards write a design spec; mechanical cards hand the card itself).
8. **Owner plans + implements** in a worktree, then clears gates; `In Review` set only from the observed PR.
9. **Verify by acting** — Skeptic at the branch, actual tests.
10. **Judge the stop condition** — PASS/REJECT from goal + Skeptic evidence only.
11. **Human merge gate** — human merges, never a seat or the facilitator.
    Under `/features-deliver` this gate is re-homed to the
    [[deterministic merge check]] — five mechanical criteria, observed
    directly, merged `--match-head-commit`.
12. **Sync + reconcile** — rebase `main`; only merged-with-green-CI sets `Done`.
13. **Card the follow-ups** — every surfaced idea becomes its own `FLLWUP-n` card.
14. **Persist** — offer to file durable decisions into the wiki.

## Autonomous-run refinements (EPIC-5)

- **Phase 1 rulings preflight** — /features-deliver front-loads copy and
  strategy rulings onto card faces before any runner dispatches; they are
  recorded human decisions, immutable for the run, and a runner that hits
  a covered dispute applies and cites them rather than re-asking. This
  converted the most predictable escalation class (surface copy) into
  zero round-trips.
- **The mechanical path** — a card whose design is fully settled by
  rulings + landed contracts skips steps 2–6 entirely (EV-25); the card
  itself is the step-7 handoff. Deliberation is skipped when nothing is
  open, never when something is.
- **Green-light conditional shipping** — a ruling may let a card ship
  against a tracked known defect (follow-up filed, asserted before
  merge); a temporary residual is shippable, a permanent one never is.
- **Follow-up cadence** — step 13 follow-ups are carded and confirmed;
  the EPIC-5 human waived per-card confirmation mid-run ("just file
  them"), which the orchestrator applied to the remaining follow-ups —
  the human may narrow their own gates, explicitly, for the run.

## Guards

- ≤3-round cap in step 3 (hard).
- Per-run token ceiling (stop, don't burn silently).
- **Every dispatch bounded** (timeout windows per dispatch type).
- **Stop one bad agent before scaling to more.**
- **Owner gates met in full regardless of change size.**

## Early stop — a scoped divergence from /features-new (flagged)

 council.md's step-3 exchange may **stop early if positions have
stabilised**. As of v0.15.0, `/features-new` deliberately does **not**
import that clause ([[three-wave-decomposition]]): its session always runs
all three waves — wave 3 ([[product-owner]] ruling) can never be skipped,
and convergence is recorded only at that fixed endpoint. This is a
**deliberate divergence between sibling procedures, not a contradiction** —
the early-stop clause remains correct for `/council` (where a full exchange
loop exists to truncate), and CAP-1's no-early-stop is what keeps
`/features-new` from importing it. The EV-12 step-6 ruling declined a
follow-up that would have "reconciled" the two framings — they govern
different procedures.

## Ruling seats & recursion

`product-owner` rules card-level open-judgment; escalates to `steward` for
**portfolio-level** changes. `council-runner` (the autonomous epic container)
never dispatches ruling seats; it escalates and resumes. See
[[council-runner]] + `council/procedures/features-deliver.md`. Its deterministic
merge check requires every owner gate green in full, without naming a
repo-specific gate file (see [[2026-08-24-bugfix-seat-prose]]).

## Related

- [[engineering-board]], [[seats]], [[preflight]], [[council-dependencies]]
- [[facilitator]] — the routing role this procedure instantiates
- [[2026-08-23-pi-council-design-spec]]

## Sources

- `council/procedures/council.md` @ `8913c6b`
- `council/procedures/features-deliver.md`
- [[2026-08-24-bugfix-seat-prose]]
- [[2026-09-04-epic3-run-ledger]] — the early-stop divergence record