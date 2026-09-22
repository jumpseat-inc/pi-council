---
id: FLLWUP-104
title: Fix the live noul answer-shape drift — the decisions API returns `{"type":"noul","noul":<p>}`, the engine reads `probability`, in both gate domains
state: Done
owner: null
epic: EPIC-13
goal: A noul answer's probability is read from the key the decisions endpoint actually returns, so live card-gate and follow-up calls stop dying at `decide()`/`decideFollowup()` with `invalid-response` — proven by both gated live arms reaching green (`COUNCIL_INTEGRATION=1 bun test test/gate-run-live.test.ts` 3/3 with the pole-semantics arm asserting on the new key, and `COUNCIL_JEV_LIVE=1 bun test test/ev84-followup-falsifier.test.ts` reaching its recorded dispositions), with the fail-closed posture for genuinely malformed answers unchanged and pinned, an answer carrying both keys with disagreeing values failing loud rather than silently preferring one, and the ledger storing one canonical answer shape that the same reader which produced it can still re-derive.
---

## Intent

Confirmed by the EV-84 step-13 product-owner ruling
(`vault/raw/2026-09-22-po-ev84-step13-noul-shape-ruling.md`). Sequence: this card lands
**before** `FLLWUP-100` (whose remaining question is unanswerable while every live call
throws) and independently of `FLLWUP-99`.

**The defect, located.** `typesafe/jev-1.13-20260917` returns noul answers as
`{"type":"noul","noul":<p>}` (raw POST, verified during EV-84 steps 8–9 and reproduced
independently by the skeptic and the judge). The engine reads `answer.probability` — once
in `sideProbability` (shared by `decide()` and by `overrideFires`'s noul arm) and once
again in `followupFloor` — and `parseDecisionsResponse` passes per-question payloads
verbatim, so nothing anywhere maps the returned key. Consequence: **every** live gate and
follow-up call fails closed with `invalid-response` (`File` / `Deliberate`). The safe
direction is holding; the mechanism buys nothing at any price.

**One upstream cause, two domains.** The card gate and the follow-up read the same parsed
answers. A fix at the parse site satisfies both readers at once; a fix widened into each
reader leaves two contracts where one drifted. Which is the implementing owner's `how`;
both live arms are the proof either way, and neither domain may be proven by the other's
arm.

**The pole is proven, not assumed (load-bearing).** A `0.59` came back; that it is
P(`noulProbabilityOf`'s pole) is a separate claim, and it is the one that decides whether
this fix is a repair or a new hazard — a wrong-pole probability would arm the floors and
the composite with confidently inverted evidence against a committed, dogfooded ledger,
which is worse than today's honest fail-closed tax. `test/gate-run-live.test.ts`'s
pole-semantics arm (a trivially-true statement must return p > 0.9) is the existing witness
and must pass **on the new key**; it may not be relaxed, re-keyed to a shape-only
assertion, or replaced by "the call no longer throws".

**Ambiguity fails loud.** An answer carrying both `probability` and `noul` with disagreeing
values throws naming the question id, in the existing domain-neutral error grammar (it
rides verbatim into `gate call failed: <reason>`); it never silently prefers a key.
Absent, non-numeric, or out-of-range still behaves exactly as pinned today.

**The record stays re-derivable.** The ledger contract — "the mode is re-derivable from the
record alone with no network call" — must hold after the change: one canonical answer shape
on the committed line, read back by the same reader that wrote it. If the honest mechanism
cannot do that, the ledger-schema question is its own card (the `FLLWUP-100` Amendment C
boundary, applied here).

**Re-capture, do not trust this record.** The wire is an upstream dependency that has
already drifted once; EV-84's capture is the *discovery* evidence, not the implementation
evidence. The card records a fresh raw response body captured at implementation time.

## Acceptance

- Both gated live arms reach green: `COUNCIL_INTEGRATION=1 bun test test/gate-run-live.test.ts` (all three arms, the pole arm asserting on the accepted key) and `COUNCIL_JEV_LIVE=1 bun test test/ev84-followup-falsifier.test.ts` (reaching the recorded `Merge`/`File` dispositions). No new live arm enters the default suite.
- The fail-closed posture is unchanged and pinned by test for each malformed class: absent value, non-numeric, out of `[0, 1]`, unknown `type` — and the both-keys-disagree case, which is new and must be loud, not preferred.
- The committed ledger carries one canonical noul answer shape and the mode re-derives from the record alone.
- A fresh raw response body is recorded on the card; red-at-base evidence follows the seven-field convention with base = the defect-live `main` at `03925df015fb6d9b26931d8558cc11322a0782c2`, role `required`, and the comparison triple recorded — a behavioral red on a gated arm, not a mechanism-absent one, and the record says how the live arm was reached at base (credentials in a detached worktree) or names that it could not be.
- The owner gates green in full: `bunx tsc --noEmit`, the full `bun test`, `python3 council/validate.py`, and `bash council/preflight.sh`.

## Retirement ruling (recorded human decision, 2026-09-22)

The human retired this card: the defect it names is **resolved**, so the card is
withdrawn rather than driven through its full acceptance. Recorded here with the
residuals named, not silently dropped.

**What resolved it.** `e903b673131c14ed86161faf09940cc7fce12a05` —
`fix(gate): canonicalize the wire noul answer key to probability` — adds
`canonicalizeAnswer` inside `parseDecisionsResponse` (`extensions/gate-transport.ts`),
the single parse seam both domains share: `noul` → `probability`, both keys
disagreeing throws, neither key throws, non-noul answers verbatim. The ledger now
stores the canonical shape. The pole was proven live before the mapping was
trusted (trivially-true → `0.99`, trivially-false → `0.01`).

**Evidence at retirement.** Full offline suite **1473 pass / 6 skip / 0 fail**;
`COUNCIL_INTEGRATION=1 bun test test/gate-run-live.test.ts` → **3/3**, including
the pole-semantics arm asserting `probability > 0.9` on the new key;
`bunx tsc --noEmit` and `validate.py` clean. A fresh raw response body is recorded
in `vault/raw/2026-09-22-gate-noul-fix.md` (`{"type":"noul","noul":0.33}` plus the
pole probes). Ingest: [[2026-09-22-gate-noul-fix]], [[decisions-wire-canonicalization]].

**Residuals not covered by the retirement (named, not dropped).**
- `COUNCIL_JEV_LIVE=1 bun test test/ev84-followup-falsifier.test.ts` arm 4 now
  **reaches** real dispositions (`status: "ok"`, non-null callIds, zero `Drop`)
  but fails its pinned merge **direction** (model chose B→A, fixture pins A→B on
  near-identical candidates). That is model-direction ambiguity in the fixture,
  not the noul drift.
- The formal seven-field red-at-base record and the full `bash council/preflight.sh`
  run were not produced, because the fix was made and verified in an interactive
  session rather than through a `/council` card run.

**Precedent.** FLLWUP-52 was retired the same way (a binding ruling declining the
card; terminal state `Done`). See [[engineering-board]], [[steward]].