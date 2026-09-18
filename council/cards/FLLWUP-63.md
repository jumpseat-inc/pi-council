---
id: FLLWUP-63
title: Fix the EV-40 backoff jitter test's unsatisfiable top edge (merged-SHA CI flake)
state: Backlog
owner: null
epic: EPIC-9
goal: The EV-40 `computeBackoffDelay` jitter test is corrected to assert an envelope matching the shipped `Math.round`-over-`[0.5, 1.5) × cap` formula (closed at the top edge) rather than a strict half-open `toBeLessThan(7500)`, with the flake class pinned by a seeded adversarial case at `rand ≥ 0.9999`.
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

## Origin

- FLLWUP-50 step 12 (facilitator): merged-SHA CI failure analysis,
  run 35350665364 fail → rerun success, local reproduction absent (6/6
  green), arithmetic proof above.
- Judge/skeptic unaffected: PR-head CI (criterion 2) was green; the flake
  is post-merge, unrelated to the FLLWUP-50 diff.
