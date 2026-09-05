---
id: FLLWUP-9
title: Explicit clear-thinking-override affordance for a seat
state: In Review
owner: owner
epic: EPIC-6
goal: A follow-up affordance removes a seat's thinking override or its whole council.<seat> entry from .council.json explicitly rather than treating absence as preserve, proven by a round-trip test that clears an existing override and byte-asserts the resulting config.
---

## Intent

Filed from EV-24's deliberation (round 3, owner and principal) and the
EV-24 design spec §5.4. v1 provides no way to delete a seat's `thinking`
override — absence means "preserve", so dropping an override is
hand-edit-only today, and the loader has no reset affordance
(`thinking: null` throws). The safe surface is a distinct explicit clear
(a writer option that removes the `thinking` member, or the whole
`council.<seat>` object when asked). This is a scope expansion EV-24
correctly excluded (spec §8).

## Acceptance

- A clear operation removes the `thinking` member (or the whole
  `council.<seat>` object when asked) from `.council.json` while
  preserving the `theme` section, every other seat, and unknown top-level
  keys, byte-asserted by a round-trip test.
- Absence continues to mean preserve everywhere else; no loader change.

## Phase 1 rulings (features-deliver, binding for this run)

- **R-1 (scope)**: delivered as a writer-level clear operation only — a
  writer option on `extensions/council-config-writer.ts` plus the
  round-trip test. No modal UI change and no new user-visible copy in
  this run, consistent with the EPIC-6 decomposition ruling (S-2) that
  this is a writer-surface follow-up, not a modal fold-in.

Recorded human decision — immutable for the run and binding on every seat,
`steward` included.

## Deliberation

### Step 1 gate
Mechanical, not surface-touching. Narrowly-scoped and unambiguous — the
behavior is fully specified (clear removes the `thinking` member; whole
`council.<seat>` object when asked; byte-preserve the `theme` section, every
other seat, and unknown top-level keys; no loader change) and pinned by
Phase-1 R-1 (writer-level clear operation on
`extensions/council-config-writer.ts` + round-trip test; no modal UI, no new
user-visible copy). Confined to one seam (the writer + its test file in
`test/council-config-writer.test.ts`); remaining freedom is API spelling —
an implementation choice, not a design tradeoff. Same seam and shape as
FLLWUP-10 (gated mechanical this epic). Applied R-1 and did not re-ask.
Not surface-touching → `designer` not seated. Skips steps 2-6; proceeds
directly to step 7 with the card itself as the owner handoff (no spec file
— mechanical path). (Features-deliver substitution: card selected by
orchestrator per steward's ruled build order replaces the attended-flow
Ready promotion, per the epic's established pattern, cf. FLLWUP-10.)

### Step 7 — In Progress, handed to owner
Card set In Progress on frontmatter and board, `owner: owner`; `validate.py`
clean. Owner dispatched at the card (mechanical-path handoff: the card's
Intent, goal, and Acceptance, with R-1 binding) with repo gate and
branch/PR conventions.

### Step 8 — In Review (owner implemented, PR #26 open)
Owner dispatched at the card (job-11.1), settled in 3.5m, report recorded:
plan `docs/superpowers/plans/2026-09-05-FLLWUP-9-clear-thinking-override.md`
(committed `846dbff`); TDD sequence red→fix→green; implementation
`7d8d386` (`feat(council-config-writer): explicit clearSeatOverride — remove
a seat's thinking override or whole council entry (FLLWUP-9)`); gates
recorded: `bun install --frozen-lockfile` exit 0 (no lockfile diff),
`bunx tsc --noEmit` exit 0, `bun test` 536 pass / 2 skip / 0 fail (54
files; +8 new clear tests vs the FLLWUP-10 baseline of 528), `python3
council/validate.py` → "All council artifacts valid". New writer entry
`clearSeatOverride({repoRoot, seat, what: "thinking" | "seat"})` — a
byte-region removal splice reusing the writer's span-scan/atomic-write
infrastructure; loader untouched; `writeSeatOverride` preservation
semantics (incl. FLLWUP-10) byte-for-byte unchanged, their tests stayed
green. Splice decisions (each pinned by a named test in
`test/council-config-writer.test.ts` `describe("clearSeatOverride")`):
object-form `what:"thinking"` removes the thinking member's byte span
(trailing-comma aware) AND strips a known THINKING_LEVELS `:suffix` off the
model (loader resolves thinking as key > :suffix, so both are "the
override"); `what:"seat"` removes the whole member; string shorthand
clear-thinking strips the `:suffix` keeping the shorthand form and model;
seat/council/file absent → idempotent no-op `{ok:true}` no write; only
malformed JSON / non-object root-or-council refuse `{ok:false, error}`;
last-seat clear re-emits `"council": {}` (loadable). PR #26
(https://github.com/jumpseat-inc/pi-council/pull/26) open against `main`,
branch `fllwup-9-clear-thinking-override`, head
`7d8d3864f487315d3aca6d0f538ad40e01158d72` (2 linear commits, no
rewriting). Observed artifacts confirm: PR OPEN, headRefOid 7d8d386…,
branch head on origin matches. Set In Review per step 8's
observed-artifact rule (branch + open PR).

### Step 9 — verified (cycle 1 of ≤3)
Skeptic dispatched at PR #26 head `7d8d386` (job-11.2), settled in 9.3m.
All four gates re-run green at the head: `bun install --frozen-lockfile`
exit 0; `bunx tsc --noEmit` exit 0; `bun test` 551 pass / 2 skip / 0 fail
(branch-committed suite 536 pass (+8 vs main's 528) + 15 adversarial
probes; 2 skips = env-gated integration); `python3 council/validate.py`
clean. Gate integrity demonstrated: stubbing `clearSeatOverride` to a
`{ok:true}` no-op turns 16 tests red — the test gate can fail. 17
objections filed (P1..P12, P1b, P4b, P4c, GATE, CONTRACT×2), **all
closed-green** — duplicate-key last-wins semantics, unknown `:suffix` no-op,
thinking-only object → loadable `{}`, double-clear idempotence,
clear-then-write does not resurrect, what:"thinking" on last council member,
what:"seat" drops unknown member fields wholesale, model `:suffix`-only
clear preserves theme SHA + unknown key, empty-seat/empty-council no-op,
last-member trailing-comma validity, clear-then-write-with-thinking
re-sets, thinking-first member order, stub→16-red gate integrity, zero
diff on `extensions/seats.ts` (no loader change), 0 skipped new tests.
**Verdict: NO-BLOCK, no open objection.** Tree hygiene verified after
(no probe files left in test/, no strays; committed diff confined to
test/council-config-writer.test.ts +194).
