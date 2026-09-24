---
id: FLLWUP-117
title: Close the cardEpicKey throw-site JSDoc drift
state: Ready
owner: null
epic: EPIC-24
goal: The three documents that still name `cardEpicKey` as the throw site for the epic-field D1 refusal — the design spec `docs/superpowers/specs/2026-09-24-fllwup-115-design.md`, the implementation plan `docs/superpowers/plans/2026-09-24-fllwup-115-plan.md`, and `epicKeyFromFace`'s JSDoc in `extensions/seats.ts` — state the throw-site truthfully: the epic-field refusal (`epic: null` or absent) throws, as delivered, inside the extracted pure core `epicKeyFromFace` (the nonexistent-face read refusal alone remains in `cardEpicKey`), with message bytes and observable behavior unchanged.
---

## Intent

FLLWUP-115 delivered the frontmatter-scoped epic parse: `cardEpicKey`
(`extensions/seats.ts:624`) keeps the nonexistent-face read refusal, and the
epic-field D1 refusal (`epic: null` or absent) throws inside the extracted
pure core `epicKeyFromFace` (`extensions/seats.ts:605-621`). Message bytes
and observable behavior are identical to the pre-refactor shape — the step-9
skeptic (job-4.4, O2) verified the refusal bytes base-vs-head — but the
delivered throw site differs from what the spec's prose said, and the
documentation never caught up. Three documents still tell the old story:

- the design spec's "Refusals (AC2)" section
  (`docs/superpowers/specs/2026-09-24-fllwup-115-design.md:56-58`): "The
  throw sites stay in `cardEpicKey`; `epicKeyFromFace` either returns a key
  or returns absent/null (which `cardEpicKey` turns into the throw)" —
  the delivered code does the opposite of the second clause;
- the implementation plan (`docs/superpowers/plans/2026-09-24-fllwup-115-plan.md:33`):
  "throws stay in `cardEpicKey`, export both";
- `epicKeyFromFace`'s own JSDoc (`extensions/seats.ts:600-604`): "null/absent
  ⇒ the caller turns the named-card D1 refusal (kept in cardEpicKey,
  byte-for-byte)" — the function itself throws it.

This card binds to the **docs-side reconciliation** path, per the confirming
product-owner ruling (recorded below): the delivered code shape stands — the
throws live in `epicKeyFromFace` — and the spec prose, plan prose, and JSDoc
are conformed to it. The draft's alternative branch ("re-home the throws into
`cardEpicKey` if the recorded posture prefers it") is **removed by the
ruling**: nothing in the record prefers it, and re-homing would churn
verified, judge-PASSed code for zero behavior change purely to match stale
prose. No `extensions/seats.ts` executable line changes; the only TS edit is
JSDoc comment text.

Filed from FLLWUP-115's step-13 candidate (draft title "Close the
cardEpicKey throw-site JSDoc drift"), recorded gate disposition `Mode: File —
composite 0.43 < merge threshold 1.00 (active)`, held unfiled by the
FLLWUP-115 container (job-4) pending confirmation, confirmed by the
product-owner ruling (job-5) with the docs-reconcile binding above.

## Acceptance

1. `docs/superpowers/specs/2026-09-24-fllwup-115-design.md`'s "Refusals
   (AC2)" section states the delivered throw-site: the epic-field refusal
   throws inside `epicKeyFromFace`; the nonexistent-face read refusal
   remains in `cardEpicKey`; message bytes unchanged. The spec's line-number
   references (`seats.ts:605`, `:610-611`) are updated to the delivered
   locations.
2. `docs/superpowers/plans/2026-09-24-fllwup-115-plan.md`'s step-3 prose
   ("throws stay in `cardEpicKey`") states the same delivered truth.
3. `epicKeyFromFace`'s JSDoc in `extensions/seats.ts` states that the
   function itself throws the named-card epic-field D1 refusal byte-for-byte,
   and that `cardEpicKey` retains only the nonexistent-face read refusal. No
   executable line, message string, or control-flow line in
   `extensions/seats.ts` changes.
4. `grep` over `docs/superpowers/specs/2026-09-24-fllwup-115-design.md`,
   `docs/superpowers/plans/2026-09-24-fllwup-115-plan.md`, and
   `extensions/seats.ts` finds no remaining claim that the epic-field
   refusal throws in (or is turned into a throw by) `cardEpicKey`; the
   `epicKeyFromFace` match-scope description (frontmatter block only) is
   unchanged and still accurate.
5. Gates, in order: `council/preflight.sh FLLWUP-117`; `bunx tsc --noEmit`
   clean; full `bun test` green with the FLLWUP-115 pins
   (`test/card-epic-key.test.ts`, `test/ev90-runner-input.test.ts`)
   untouched and green. Docs-only, zero behavior change → **no
   `package.json` version bump** (the bump convention tracks behavior
   changes; a JSDoc/prose edit is not one).
