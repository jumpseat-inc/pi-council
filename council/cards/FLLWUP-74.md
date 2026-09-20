---
id: FLLWUP-74
title: Enforce loadGateDecision's invariants — verify > 0 and the hostile-string cross-checks
state: Done
owner: null
epic: EPIC-13
goal: extensions/gate.ts's loadGateDecision requires thresholds.verify to be greater than 0 (the existing verify <= direct rule then makes direct greater than 0 follow), and refuses floors/thresholds sub-keys that are not declared keys, override.question ids that are not declared in weights, and any basis-affecting string whose content can render a multi-line basis, each failure a single-line FAIL naming the offending file and key; and a test proves a verify:0 policy, an unknown floors sub-key, an unknown override.question id, and a newline-bearing override id each throw naming the file and key, while the packaged council/gate/policy.json validates clean.
---

## Intent

Filed from two residues this run left on `loadGateDecision`, and merged into one
card per the EV-65 product-owner ruling (job-12, Q2), which held that all three
items are the same defect class — `loadGateDecision` accepting a policy that
contradicts EV-63's own invariants — and that the fix belongs at the root in
`gate.ts`, not as a per-consumer guard.

- **EV-65 Q2:** `loadGateDecision` accepts `thresholds.verify: 0` / `direct: 0`;
  `decide({})` then returns `Direct` while the failure path hard-codes
  `Deliberate`, so offline re-derivation of a failure record under such a policy
  contradicts the recorded mode (data-reachable, skeptic O9/PROBE2). The ruling:
  require `thresholds.verify > 0`; the existing `verify <= direct` rule makes
  `direct > 0` follow.
- **EV-63 residual (skeptic O5):** a repo-local `decision.json` with a
  newline-bearing override id can yield a multi-line `basis`, breaking the
  one-line contract for hostile repo data; and unknown `floors`/`thresholds`
  sub-keys and `override.question` ids pass validation silently.

EV-65 implemented no verify guard and edited no `gate.ts`, per the ruling; its
spec states the recomputability precondition instead of advertising it
unconditionally. This card closes the precondition.

## Acceptance

- A `verify: 0` policy is refused with a single-line `FAIL:` naming the file and
  key; the packaged policy still validates clean.
- An unknown `floors` or `thresholds` sub-key, and an `override.question` id not
  present in `weights`, are each refused naming the file and key.
- A newline-bearing override id is refused rather than producing a multi-line
  `basis`.
- `decide()`/`loadGateDecision` behavior on every valid policy is unchanged
  (byte-identical `basis` and mode for the packaged fixture set).
- No consumer carries a second copy of the predicate.
## Folded into EPIC-14

Folded into `EV-73` (`EPIC-14`) by the EPIC-14 wave-3 product-owner ruling
(job-33): the same `loadGateDecision`/`loadGatePolicy` surface is rewritten by
the enablement relocation, so shipping this separately would re-open the
`verify > 0` / hostile-string loader defect under a new source. All four refusal
classes (including the multi-line-`basis` class and its newline-override-id
test) ride `EV-73`'s goal and Acceptance — not three, as the wave-1 fold first
proposed.
