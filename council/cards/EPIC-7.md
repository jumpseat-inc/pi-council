---
id: EPIC-7
title: Token and cost usage accounting for autonomous council invocations
state: Backlog
owner: null
epic: null
goal: Every autonomous council invocation reports and durably records what it spent in input, output and cached tokens plus a provenance-labelled dollar value, at a granularity traceable back to the session JSONL that produced it.
---

## Intent

The human's intake: council work spends tokens across many dispatched seats,
and the dollar figure pi reports is an estimate whose basis is not labelled —
in the human's own use it ran 2-3x, sometimes 5x, above what was billed, while
cache hits read optimistic. Providers such as OpenRouter front many upstream
inference providers with differing prices, so the catalogue's per-model rate is
a guess, not a charge. The council's ruling placed the durable store at
`getAgentDir()/council/usage/` rather than the `~/.pi-council` the human
proposed, following the existing durable, 0600-atomic council-state precedent;
a second top-level home dir was rejected as unnecessary surface area. The epic
records the full token and cost tuple, labels what is estimated versus
reported, and reports it explicitly at every autonomous exit point.

Children: EV-28 (capture the full tuple), EV-30 (invocation-scoped
accounting), EV-31 (durable store with session provenance), EV-32 (report at
every autonomous exit), EV-29 (provider-reported actual cost). FLLWUP-26
(the unimplemented per-run token-ceiling guard) is filed as a follow-up.

## Acceptance

- Every child's own acceptance holds, and the epic is met when the chain
  EV-28 → EV-30 → EV-31 → EV-32 is green and EV-29's provider-reported path
  is in place.
- `python3 council/validate.py` prints `All council artifacts valid`.

## Phase 1 rulings (features-deliver, binding for this run)

Recorded human decisions — immutable for the run and binding on every seat,
`steward` included. A runner that hits a dispute covered here applies the
ruling and cites which one.

- **R-SCOPE** — this run delivers EV-28, EV-30, EV-31, EV-32 and EV-29 in
  dependency order; FLLWUP-26 stays `Backlog`.
- **R-ORDER** — build order is EV-28 → EV-30 → EV-31 → EV-32 → EV-29; a
  card starts only after its predecessor's merge SHA is on local `main`.
- **R-PROMOTE** — chain promotion is bound once: the orchestrator promotes
  each `Backlog` child (EV-31, EV-32, EV-29) the moment its predecessor's
  merge SHA is on local `main` and `python3 council/validate.py` is clean,
  without re-asking.
- **R-GATES** — owner gates are `bash council/preflight.sh`,
  `bunx tsc --noEmit`, `bun test`, `python3 council/validate.py`; the
  network integration test stays gated behind `COUNCIL_INTEGRATION=1`.
- **R-MERGE** — the deterministic five-criteria check replaces the human
  merge gate; merge with `gh pr merge <PR> --squash --match-head-commit
  <SHA>`; the first merge is announced in-line and watched.
