---
id: FLLWUP-10
title: Writer thinking preservation matches loader resolution for object-form model overrides
state: In Review
owner: owner
epic: EPIC-6
goal: existingThinking in extensions/council-config-writer.ts parses the object-form model :suffix via the same lastIndexOf(':') plus THINKING_LEVELS membership rule applySeatOverride already uses, so writer preservation matches loader resolution, proven by a test against an object-form override that today silently drops the level to frontmatter on any model change.
---

## Intent

Filed from EV-23's Skeptic verification (objection O-1, closed-red,
reproduced): `existingThinking` (`extensions/council-config-writer.ts:200-217`)
reads only a string-shorthand `:suffix` or an object's `.thinking` key —
never a `:suffix` on an object-form `model` — while `applySeatOverride`
(`extensions/seats.ts:414-419`) does parse it. For an override
`{"model":"a/b:low"}` with no `thinking` key, a level-less
`writeSeatOverride("c/d")` emits `{"model":"c/d"}` and the post-write
effective thinking falls back to frontmatter, silently dropping `low`.
Ruled during the EPIC-5 autonomous run (EV-23 escalation J-1): the
`/council-models` modal ships against this tracked fix, never as a
permanent residual.

## Acceptance

- A test drives a model change against an object-form override carrying a
  `:suffix` and no explicit `thinking` key, and asserts the written entry
  preserves that thinking level.
- The writer's parse rule matches `applySeatOverride`'s
  (`lastIndexOf(':')` + `THINKING_LEVELS.has(...)`).
- The EV-24 guarantees still hold — `theme` section, other seats, and
  unknown top-level keys byte-identical after the write.

## Deliberation

### Step 1 gate
Mechanical, not surface-touching. Narrowly-scoped, unambiguous, no design
tradeoff — the goal states the exact parse rule to match
(`lastIndexOf(':')` + `THINKING_LEVELS.has(...)`, matching
`applySeatOverride` at `extensions/seats.ts:414-419`), confined to one
function (`existingThinking`,
`extensions/council-config-writer.ts:200-217`) plus a test in
`test/council-config-writer.test.ts`; no visible surface or user copy
changes. Skips steps 2-6; proceeds directly to step 7 with the card
itself as the owner handoff (no spec file — mechanical path).

### Step 7 — In Progress, handed to owner
Card set In Progress on frontmatter and board; `validate.py` clean.
Owner dispatched at the card (mechanical-path handoff: the card's Intent
and goal) with repo gate and branch/PR conventions.


### Step 8 — In Review (owner implemented, PR #25 open)
Owner dispatched at the card (job-10.1), settled in 2.4m, report recorded:
plan `docs/superpowers/plans/2026-09-05-FLLWUP-10-thinking-preservation.md`
(committed `dfa1eac`); TDD sequence red→fix→green (failing test first, then
the `existingThinking` object-branch `model` `:suffix` fallback using `lastIndexOf(':')`
+ `THINKING_LEVELS.has`, `.thinking` key first to preserve loader precedence);
gates recorded: `bun install --frozen-lockfile` exit 0 (no lockfile diff),
`bunx tsc --noEmit` exit 0, `bun test` 528 pass / 2 skip / 0 fail (54 files)
after strengthening the W3 pin in `test/council-models.test.ts` (its stated
premise was "FLLWUP-10 seam (NOT fixed in this card)" and its old assertion
asserted the pre-fix drop — leaving it red would fail gate 3; the update
asserts the post-fix on-disk truth, a strengthening, not a narrowing),
`python3 council/validate.py` → "All council artifacts valid". PR #25
(`https://github.com/jumpseat-inc/pi-council/pull/25`) open against `main`,
branch `fllwup-10-thinking-preservation`, head `2175b73839606138c75d4a7d84a21ea11f71c8d1`.
Observed artifacts confirm: PR OPEN, headRefOid 2175b73…, diff touches
`extensions/council-config-writer.ts`, `test/council-config-writer.test.ts`,
`test/council-models.test.ts` (W3 track), the plan, plus the runner's own
board/card record commits riding through (established epic pattern). Set In
Review per step 8's observed-artifact rule (branch + open PR).

### Step 9 — verified (cycle 1 of ≤3)
Skeptic dispatched at PR #25 head `2175b73` (job-10.2), settled in 7.5m.
All four gates re-run green at the head: `bun install --frozen-lockfile`
exit 0; `bunx tsc --noEmit` exit 0; `bun test` 528 pass / 2 skip / 0 fail
(54 files; 2 skips = env-gated integration); `python3 council/validate.py`
clean. Gate integrity demonstrated: reverting the FLLWUP-10 object-form
`model` `:suffix` fallback (keeping only the `.thinking` key check) turned
both the FLLWUP-10 preservation test and the W3 notify test red — the test
gate can fail. 14 adversarial probes (AP-1..AP-14) all passed from a
temp-root probe harness (deleted after): object-form `:suffix` preserved,
explicit `.thinking` key wins, string shorthand preserved, suffix-less
writes leave no thinking key, invalid/unknown suffix dropped with file
loadable, trailing-colon and multi-colon `lastIndexOf` semantics, EV-24
byte-identity of theme section / other seats / unknown top-level keys,
multi-seat round-trip. 14 objections filed, **all `closed-green`** (O2
parse-rule match confirmed against `applySeatOverride`'s exact
`lastIndexOf(':')` + `THINKING_LEVELS.has(...)` rule; O12 W3 strengthening
matches post-fix on-disk truth with notify-wiring intent preserved; O13
both FLLWUP-10 tests + W3 run in the full suite). **Verdict: NO-BLOCK, no
open objection.**
