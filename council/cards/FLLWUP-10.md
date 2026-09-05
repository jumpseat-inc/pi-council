---
id: FLLWUP-10
title: Writer thinking preservation matches loader resolution for object-form model overrides
state: In Progress
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

