---
title: Council Models Picker
type: entity
summary: The /council-models surface — command wiring, resolver, token-only modal with the EV-27 `/`-triggered model-name search input (two-bit focus machine, ruled search copy), and .council.json writer so a person picks a provider/model per seat in a themed modal.
aliases: [council models picker, council-models, model picker, /council-models, model-picker, catalogue resolver, model search]
tags: [pi-council/entity, pi-council/epic5, pi-council/epic6]
sources: ["[[2026-09-04-epic5-run-ledger]]", "[[2026-09-05-epic6-run-ledger]]"]
created: 2026-09-04
updated: 2026-09-05
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

**EPIC-6 additions** (recorded human decisions on the EPIC-6 and EV-27
card faces): the empty search-input row renders `▌ / filter · esc clears`
(the `▌` signifier at column 0, then the hint byte-exact, middot idiom
matching the ruled footer); the zero-match state renders
`No models matching "<query>".` interpolated with the live query,
byte-distinct from both R-4 empty states.

## Model search input (EV-27, PR #24 `3452abb`)

EPIC-6's addition to the model level: pressing `/` opens a focused search
input **below the top row** (the R-1 header stays byte-exact) that
filters the visible rows through `filterModelRows` (EV-26, PR #23
`b89a93b`) — case-insensitive substring on `qualifiedId` only,
suffix-safe, reference-preserving so `resolveSelection()` stays
byte-verbatim. Key handling is the [[two-bit-focus-machine]]
(`searchActive` × `inputFocused`): Esc in the input clears the text and
stays focused; Esc elsewhere ascends unchanged; Down transitions focus
out; `/` is typeable inside the input by capture-by-construction. The
filter is interposed at `currentRows()` — one row source for windowing,
cursor clamps, and selection — and the render-cache signature includes
the query. The four-footer rule is intact — the search row carries its
own hint, never a fifth footer. Open follow-ups: FLLWUP-12 (backspace
deletion), FLLWUP-13 (no-match focus-out hint), FLLWUP-14 (kitty
live-path smoke), FLLWUP-15 (search-mode frame height).

## Known seam — CLOSED (was FLLWUP-10)

⚠️ **Superseded 2026-09-05:** the seam below is **fixed** — FLLWUP-10
(PR #25 `948d111`, EPIC-6 run) made `existingThinking` parse an
object-form `model` `:suffix` via `lastIndexOf(':')` +
`THINKING_LEVELS.has(...)`, matching `applySeatOverride`. Preserved
because the EPIC-5 conditional-shipping ruling (EV-23 J-1) referenced it
as the green-light condition; the condition is now discharged. The same
run also added `clearSeatOverride` to the writer (FLLWUP-9, PR #26
`08438bd`) — see [[council config writer]].

Historical text: the writer's `existingThinking` missed a `:suffix` on
an object-form `model` (Skeptic closed-red) — tracked as **FLLWUP-10**,
the condition under which EV-23 was ruled shippable; not a permanent
residual.

## Related

- [[council config writer]] — the write path this surface owns
- [[gate parity]] — why the writer has no capability gate
- [[echo-then-run]] — the confirm pattern
- [[council config]] — the file being edited
- [[council theme]], [[council job tree inline]] — sibling surfaces
- [[two-bit-focus-machine]] — the search input's key-handling pattern
- [[2026-09-04-epic5-run-ledger]] — the run that built this surface
- [[2026-09-05-epic6-run-ledger]] — the run that added the search filter

## Sources

- [[2026-09-04-epic5-run-ledger]]
- [[2026-09-05-epic6-run-ledger]]
- `extensions/catalogue.ts`, `extensions/council-config-writer.ts`,
  `extensions/model-picker.ts`, `extensions/index.ts`
