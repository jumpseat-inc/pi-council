---
id: FLLWUP-80
title: Bound the EV-68 textTree byte-equality flake window
state: Backlog
owner: null
epic: EPIC-13
goal: The EV-68 test-4 textTree byte-equality assertion no longer depends on two calls sharing a minute boundary — the fixture injects or freezes the clock so the comparison is deterministic across the boundary — and a repeated-run harness of at least 1000 iterations across a forced minute rollover produces zero flakes.
---

## Intent

Filed from EV-68's step-13 follow-up candidate. The test asserts byte-equality of
two `textTree` renders produced by two calls about a millisecond apart; when the
two calls straddle a `toFixed` minute boundary the byte comparison can differ,
giving a roughly 1-in-6000 flake window with no observed failure yet. This is the
same class as FLLWUP-63 (an unsatisfiable/flaky test edge) and should be closed
before it flakes CI on an unrelated PR.

## Acceptance

- The assertion is deterministic across a forced minute rollover.
- The clock is injected or frozen by the fixture, not slept around.
- A harness runs the assertion at least 1000 times across the rollover with zero
  flakes.
- The EV-68 mechanism (optional `mode` on the root manifest, backward-compatible
  read/sum) is unchanged.