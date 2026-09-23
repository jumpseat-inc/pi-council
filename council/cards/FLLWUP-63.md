---
id: FLLWUP-63
title: Test-determinism sweep: close the backoff-jitter top edge and the EV-68 textTree minute-boundary flake
state: Backlog
owner: null
epic: EPIC-22
goal: The EV-40 computeBackoffDelay jitter test asserts an envelope matching the shipped Math.round formula (closed at the top edge) with a seeded adversarial case at rand ≥ 0.9999, and the EV-68 test-4 textTree byte-equality assertion no longer depends on two calls sharing a minute boundary — the fixture injects or freezes the clock, and a repeated-run harness produces zero flakes.
---


## Intent

Filed by the FLLWUP-50 step-12/13 record (EPIC-9 residuals run 2). The
FLLWUP-50 merged SHA `6e35355` went red on its first `gates` CI run
(databaseId 35350665364) in `EV-40 — computeBackoffDelay (pure policy) >
jitter honors the maxDelayMs cap` — a file untouched by that branch; the
rerun of the same workflow on the same commit went green. Root cause,
verified by facilitator execution and arithmetic:

- `extensions/retry.ts:155` `computeBackoffDelay`: jitter is
  `Math.round(capped * (0.5 + rand()))`. With `{baseDelayMs: 2000,
  maxDelayMs: 5000}` at attempt 6, `capped = 5000` and any
  `rand ≥ 0.9999` yields exactly `7500`.
- The test asserts `expect(d).toBeLessThan(7500)` (strict), citing the
  spec envelope `[0.5, 1.5) × cap` — but `Math.round` maps the half-open
  multiplier interval to a **closed** result interval at the top edge.
  The impl docstring itself says "multiplier in [0.5, 1.5) … rounded",
  i.e. the shipped formula's output is in `[0.5×cap, 1.5×cap]`.
- Per-trial hit probability `P(rand ≥ 0.9999) = 1e-4`; 200 iterations per
  run → ~1.98% flake. Six local reruns green; the merged-SHA CI run hit
  it. The EV-40 lineage (merged earlier in run 2) has been carrying this
  latent flake since.

The fix card settles which side is authoritative (EV-40's spec §2.1 "the
formula" vs the test's strict reading), corrects the test to a
deterministic envelope encoding (e.g. `toBeLessThanOrEqual(7500)` plus a
seeded adversarial case pinning `rand = 0.9999` → `7500`), and keeps the
cap-binds-before-jitter property the test exists to pin. No behavior
change to `computeBackoffDelay` is implied unless the spec-side reading
wins — in which case the change is the rounding policy, not the cap.

---

### Absorbed: FLLWUP-80 — Bound the EV-68 textTree byte-equality flake window

Filed from EV-68's step-13 follow-up candidate. The test asserts byte-equality of
two `textTree` renders produced by two calls about a millisecond apart; when the
two calls straddle a `toFixed` minute boundary the byte comparison can differ,
giving a roughly 1-in-6000 flake window with no observed failure yet. This is the
same class as FLLWUP-63 (an unsatisfiable/flaky test edge) and should be closed
before it flakes CI on an unrelated PR.

## Acceptance

---

### From FLLWUP-80 — Bound the EV-68 textTree byte-equality flake window

- The assertion is deterministic across a forced minute rollover.
- The clock is injected or frozen by the fixture, not slept around.
- A harness runs the assertion at least 1000 times across the rollover with zero
  flakes.
- The EV-68 mechanism (optional `mode` on the root manifest, backward-compatible
  read/sum) is unchanged.
