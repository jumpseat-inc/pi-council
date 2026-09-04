---
title: Council Models Picker
type: entity
summary: The EPIC-5 surface — the /council-models command wiring resolver, token-only modal, and .council.json writer so a person picks a provider/model per seat in a themed modal and the override lands as a field-level merge.
aliases: [council models picker, council-models, model picker, /council-models, model-picker, catalogue resolver]
tags: [pi-council/entity, pi-council/epic5]
sources: ["[[2026-09-04-epic5-run-ledger]]"]
created: 2026-09-04
updated: 2026-09-04
---

# Council Models Picker

EPIC-5's deliverable: an easy per-seat provider/model picker for
`.council.json`, invoked as `/council-models`, rendered as a modal window
in the council theme. Four landed modules:

- **`extensions/catalogue.ts`** (EV-22, PR #19 `07317e1`) — the pure
  resolver `resolveCatalogue(models, providerDisplayName, rawSeats,
  overrideMap)`. Reads `ctx.modelRegistry.getAvailable()` data (never raw
  provider HTTP — dispatch validates against the same set, so a listed
  model is a dispatchable model). Emits provider groups with
  `qualifiedId` (`${provider}/${id}`, the selection/write key) and
  per-model `supportedThinkingLevels` (via pi's
  `getSupportedThinkingLevels`, imported from
  `@earendil-works/pi-ai/compat`), plus per-seat
  `{name, hasOverride, currentModel, currentThinking}`.
  `hasOverride` is **key-presence** in `loadCouncilConfig` (an `{}` entry
  counts — effective-diff is unobservable because `applySeatOverride`
  returns the identical object when values coincide). Ordering is
  id-ascending for providers and models (ruled J-1: consistency with
  pi's own `/models` picker; labels are rename-volatile). One snapshot:
  `refresh()` + `getAvailable()` once per invocation, the same flat array
  to resolver and writer.
- **`extensions/council-config-writer.ts`** (EV-24, PR #20 `5fa22a1`) —
  the first `.council.json` write path. See [[council config writer]].
- **`extensions/model-picker.ts`** (EV-23, PR #21 `362fe96`) — the
  token-only modal `ModelPicker` component: four-level cascade
  (seat → provider → model → confirm), clamped cursor (no wrap),
  `withModalFrame` + `ctx.ui.custom` overlay per the council-tree
  precedent, tokens limited to `accent`/`dim`/`bold` (+ frame chrome),
  source-audit + palette-match tests. The thinking affordance is folded
  into the model level: `N` rows for an `N`-level model (each
  `:level`-suffixed), a single `:off` row for `["off"]` models, and a
  single level-less row only for `[]` models (ruled J-2 — no bare
  level-less row on a model that has levels). Emits a
  `SeatModelSelection {seat, model, thinking?}` through `done()` — the
  type EV-25 mocks and EV-24 consumes.
- **Command wiring** (EV-25, PR #22 `467b744`) — `/council-models`
  registered as a TS command ([[procedures-vs-commands]]: a deterministic
  file write is LLM-obedience). TUI → modal; headless → usage block +
  per-seat current listing; writes go through the writer; post-write
  notify names file, seat, new model, and that the change takes effect
  at the next dispatch (overrides apply at seat load; mid-session reload
  deliberately out of scope for v1).

## Ruled copy (Phase 1 human decisions, binding)

Header `council models — pick a model per seat` (bold); footers
`↑/↓ move · enter open · esc back` (seat/provider),
`↑/↓ move · enter select · esc back` (model), `enter confirm · esc back`
(confirm); markers `— using <provider>/<id>[:thinking] (override)` /
`— frontmatter default`; empty states `No providers configured —
authenticate a provider in pi, then reopen /council-models.` and
`No models available for <provider>.`; notify
`council-models: wrote <seat> → <provider>/<model>[:thinking] in
.council.json — takes effect at the next dispatch.`

## Known seam

The writer's `existingThinking` misses a `:suffix` on an object-form
`model` (Skeptic closed-red) — tracked as **FLLWUP-10**, the condition
under which EV-23 was ruled shippable; not a permanent residual.

## Related

- [[council config writer]] — the write path this surface owns
- [[gate parity]] — why the writer has no capability gate
- [[echo-then-run]] — the confirm pattern
- [[council config]] — the file being edited
- [[council theme]], [[council job tree inline]] — sibling surfaces
- [[2026-09-04-epic5-run-ledger]] — the run record

## Sources

- [[2026-09-04-epic5-run-ledger]]
- `extensions/catalogue.ts`, `extensions/council-config-writer.ts`,
  `extensions/model-picker.ts`, `extensions/index.ts`
