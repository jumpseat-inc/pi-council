# Product-owner ruling — EPIC-5 `/council-models` decomposition (wave 3)

Run: `/features-new` decomposition of the human's intake ("`/council-models`
provider/model picker for `.council.json`", modal themed like the rest of
council UI). Three-wave deliberation per [[three-wave-decomposition]]:
wave-1 principal (Reframe + child goals), wave-2 skeptic + designer in
parallel, wave-3 product-owner (this ruling, unconditional last).

Source: facilitator-assembled disagreement ledger D1–D9 + EPIC-5 / EV-22..25
card drafts as waved by principal. References to vault wiki and recorded
rulings cited inline.

## Surface

A TypeScript-registered `/council-models` slash command that opens a
token-only modal picker (TUI) or a console listing (headless) listing
pi's enabled providers and the models each serves, and on selection
writes a single seat's `council.<seat>.model` (+ optional `thinking`)
override into the repo's `.council.json` without disturbing the `theme`
sibling. Per [[procedures-vs-commands]] the surface's correctness depends
on LLM **obedience** (pre-validated model strings, atomic merge-write,
theme preservation, echo-then-run forcing function) — it is a
**command**, not a procedure. Per [[council-config]] the loader is
fail-fast and field-level; per [[council-theme]] the theme-watcher at
`extensions/theme-watcher.ts:45` fires on **any** `.council.json` change
and would misclassify a model-only edit that clobbered or reshaped the
file as a "theme removed" reload — the writer must merge, never rewrite,
so the watcher sees the same `theme` block after the write as before.

## D1 — EV-23 testability (skeptic, open)

**Objection**: goal's settling test ("output contains no ANSI escape")
contradicts real `theme.fg` runtime behavior — `theme.fg` is the
**source** of the modal's color (its `.bg`/`.fg`/`.bold` wraps every
emitted color, see `navigator.ts:88` documenting `\x1b[39m` resets as the
border / backdrop emitters in `withModalFrame`). The workable check is
the one already shipped in `test/theme-compliance.test.ts:122`:
**a source audit for foreign ANSI / literal hex outside the whitelisted
palette table** AND, separately, **an output test asserting every
color-bearing ANSI in render output is the theme's own palette**, not
zero-ANSI. Existing precedent: `theme-compliance.test.ts:50-92` does the
latter for `CouncilTree` and `TranscriptView`; a modal picker gets the
same shape.

**Ruling**: replace EV-23's goal with the foreign-ANSI check pattern;
record the exact replacement sentence in the packet below. The
zero-ANSI phrasing is impossible against a correctly-implemented modal
and would fail on the first green test.

**Grounding**: `theme-compliance.test.ts` (test code), `navigator.ts:88`
(ANSI reset documentation in `withModalFrame`), AGENTS.md 9.6
(token-only drawing rule). Reversibility: low — single sentence
replace, no card file yet exists for EV-23.

## D2 — EV-25 testability (skeptic, open)

**Objection**: a headless-only settling test leaves the primary TUI
surface (the modal) with zero coverage; the goal is stub-satisfiable by
an implementation that only does the console listing + write path.

**Ruling**: replace EV-25's goal to require **both** the headless
handler-write path AND a modal-picker-to-writer wiring test (with the
modal picker mocked — EV-23 owns the modal **itself**; EV-25 owns the
**wiring**). This is the same scope split used for `/council-eval` and
`/council-leaderboard` ([[procedures-vs-commands]], EV-20/21
precedent): the surface-gate test pins the wiring without depending on
pi's overlay compositor.

**Grounding**: `test/procedures-vs-commands` precedent; EV-21's
surface-gate test pinned `runMatrix` is never called from
`/council-leaderboard` (per EV-21 step-8 evidence). Reversibility: low —
single sentence replace.

## D3 — EPIC-5 settling test (skeptic, open; designer concurs on acceptance gap)

**Objection**: epic-level "automated test that performs a pick" has no
precedent in the test suite (`grep -rc 'ctx\.ui\.custom' test/*.ts`
returns zero across all files — there is no TUI-modal interaction
infrastructure to build on); the epic does not specify who builds it.

**Ruling**: replace the epic settling condition with an **integration
test that feeds a programmatic selection through the resolver, the
modal picker's selection-encoding contract, and the merge-writer**, and
asserts the resulting `council.<seat>` entry plus a SHA-identical
`theme` block after the write. This test is **unit-runnable** because
the modal picker is mocked at its contract boundary (the selection
encoding) — the same shape as EV-25's modal-picker-to-writer wiring
test. The **end-to-end smoke** mandate lives on EV-25 by analogy with
EV-20's Q3 ruling (a fresh container running `/council-models <seat>
<model>` headlessly, asserting records/transcript/notify — the pattern
that has caught three real production bugs in its first round per
[[smoke-test]]).

**Grounding**: `smoke-test.md` wiki ("first Council command without an
end-to-end falsifier is a defect"); EV-20's Q3 ruling
(`vault/raw/2026-09-04-epic4-run-ledger.md` Q3); the new EPIC-5
settling test is unit-level (no infrastructure required), the smoke is
EV-25's. Reversibility: low — single sentence replace.

## D4 — EV-22 data contract (designer, unopposed)

**Amendment**: the resolver must expose per-seat `(name, hasOverride,
currentModel, currentThinking)` and per-model supported thinking
levels from `Model.thinkingLevelMap` (per [[seats]] wiki: frontmatter is
the default, the override is the per-seat tunable; the picker must
show both so a person can see frontmatter still owns the value
underneath). Without this, EV-23 leaks the data seam into the modal.

**Ruling**: accept. Reflected in the exact replacement sentence below.
Grounding: [[council-config]] "precedence" — model and thinking resolve
independently so the picker must reflect that. `seats.ts` types
(principle transcribed). Reversibility: low.

## D5 — EV-23 affordances (designer, unopposed)

**Amendment**: commit header/footer copy, three named empty states
with copy ("no providers configured", "provider with no models",
"seat has no override"), per-row current-state markers with the
effective `(model, thinking)` rendered dim-token, and a
confirm-before-overwrite forcing function.

**Sub-question** (designer, ruled): two-Enter confirm vs the
`/council-eval` echo-then-run precedent.

**Ruling (sub-question)**: **echo-then-run**. The pattern from
`2026-09-04-design-ev20-round2.md` §4.2 quotes the resolved selection
back as plain text (e.g. "Set `council["owner"].model =
openrouter/<model>[:<thinking>]`, change takes effect at next
dispatch — [Y/n]"), and Y runs, n backs up one cascade level. This is
cheaper-to-reverse than two-Enter (one keystroke vs two), matches
existing precedent, and is the same forcing function shape EV-20
adopted. Two-Enter is rejected — extra keystroke with no extra
guarantee the echo doesn't already provide.

**Ruling (amendment)**: accept the four items; substitute echo-then-run
for two-Enter. Reflected in the exact replacement sentence below.
Grounding: EV-20 echo-then-run precedent; `procedures-vs-commands.md`
"LLM obedience = forcing function lives in code". Reversibility: low.

## D6 — EV-24 acceptance contract (designer, unopposed)

**Amendment**: byte-assert the exact emitted `council.<seat>` shape
(proves the writer emits `provider/id` qualified + optional `thinking`
in the object form the loader and scaffold seed already speak); SHA-assert
the `theme` block byte-identical before and after the write (proves the
merge did not touch it); name the partial-write failure surface.

**Ruling (failure surface)**: **validate-before-write → returns an error
message; filesystem-level failure (atomic-rename ENOSPC, etc.) →
throws**. The pre-write validation matches `loadCouncilConfig`'s own
fail-fast discipline ([[council-config]] "validation is fail-fast") and
keeps the picker UI from crashing on a typo. The atomic-rename throws
on unrecoverable filesystem conditions (the existing `mcp/auth-store`
pattern).

**Ruling (amendment)**: accept. Reflected in the exact replacement
sentence below. Grounding: `seats.ts` fail-fast pattern; `mcp/auth-store`
atomic write pattern; AGENTS.md convention #10. Reversibility: low.

## D7 — EV-25 surface (designer, unopposed)

**Amendment**: commit the headless usage-block format (per
`index.ts:333-341` `[council-eval]` precedent), the per-seat "current:"
listing, and verbatim post-write notify copy naming file, seat, new
model, and when the change takes effect.

**Ruling**: accept. Reflected in the exact replacement sentence below.
Grounding: `headless-pi.md` (no trust prompt, single-shot teardown); EV-20
notify copy precedent. Reversibility: low.

## D8 — Reload semantics (designer, explicit escalation to product-owner)

**Question**: in v1, does `/council-models` own a mid-session reload of
the picked seat, or just notify that the change takes effect at the
next dispatch?

**Ruling**: **v1 ships notify-only**. Per [[council-config]] "loadSeat
applies the override before returning" — overrides take effect at the
next seat load (next dispatch), not mid-session. A mid-session reload
of a loaded seat is a new feature (it would require killing/restarting
the seat's session) and changes this card's surface meaningfully. The
cheapest-to-reverse call is notify-only with copy "change takes effect
at the next dispatch"; a follow-up card can add the reload later if a
user need surfaces it. Recorded for the post-write notify copy in
EV-25.

This stays with product-owner; it is **not a steward escalation**. The
ruling scopes this card down to notify-only — the portfolio is not
changing. A follow-up card adding the reload is a future decision, not
a current one. Reversibility: high — adding a reload later is additive
and does not require touching shipped code.

## D9 — State ratification (facilitator-noted, pending)

**Ruling** (unchanged from wave-1):

- EPIC-5: **Backlog** (no implementation until children land)
- EV-22: **Ready** (the clarified data contract is testable in isolation)
- EV-23: **Ready** (the foreign-ANSI settling test is testable against the
  existing `theme-compliance.test.ts` pattern)
- EV-24: **Ready** (the byte/SHA/validate-before-write settling test is
  testable against existing `.council.json` loader fixtures)
- EV-25: **Backlog** (depends on EV-22/23/24's exported signatures, per
  wave-1 Intent; chain-promotion per [[chain-promotion]] applies when each
  predecessor merges)

## Final card states and goals

(Each line below is the **exact text the facilitator writes into the
card file's `goal` frontmatter** — no colon-space, one falsifiable
sentence, ready for `validate.py`.)

- **EPIC-5**: state Backlog; goal = "A `/council-models` slash command
  opens a token-only, council-themed modal picker listing pi's enabled
  providers and the models each serves, and selecting a provider and
  model for a seat writes that seat's `model` and `thinking` override
  into `.council.json` without disturbing the `theme` section, verified
  by an integration test that feeds a selection through the resolver,
  the modal picker's selection-encoding contract, and the merge-writer,
  and asserts the resulting `council.<seat>` entry plus a SHA-identical
  `theme` block after the write."
- **EV-22**: state Ready; goal replaced with designer's D4 amendment;
  exact text "A pure function returns a picker-ready structure of every
  seat's name, current override state, effective model and thinking,
  grouped by provider with each model's display name and supported
  thinking levels from pi's model registry, proven by a unit test that
  stubs the registry and asserts grouping, ordering, thinking-level
  extraction, and the per-seat current-state fields."
- **EV-23**: state Ready; goal replaced with skeptic's D1 amendment
  and designer's D5 amendment; exact text "A token-only modal component
  renders the seat, provider, and model picker using only pi theme
  fg/bg/bold tokens, supports keyboard navigation from seat to provider
  to model with an echo-then-run confirmation step that quotes the
  resolved selection before writing, and is proven by source-audit
  tests asserting no literal hex or foreign ANSI outside theme tokens
  in extensions/<modal>.ts and by output tests asserting that every
  color-bearing ANSI in render output matches the theme's own palette."
- **EV-24**: state Ready; goal replaced with designer's D6 amendment
  with the validate-before-write vs throw failure-surface ruling;
  exact text "A non-destructive writer validates a chosen model and
  thinking level against the catalogue and thinking-level set, then
  atomically merges the chosen seat's `council.<seat>` object into
  `.council.json` while preserving the `theme` section, every other
  seat, and unknown top-level keys, returning an error message on
  validation failure rather than writing, proven by tests that
  byte-assert the emitted seat shape and SHA-assert the `theme` block
  byte-identical before and after the write."
- **EV-25**: state Backlog; goal replaced with skeptic's D2 amendment
  and designer's D7 amendment, with D8 reload question ruled to
  notify-only; exact text "A registered `/council-models` command wires
  the catalogue resolver, the modal picker, and the merge-writer,
  routes TUI sessions to the modal and headless sessions to a console
  listing with a per-seat current listing and a verbatim post-write
  notify copy naming the file, seat, new model, and that the change
  takes effect at the next dispatch, and is proven by tests that
  exercise both the headless handler-write path and the
  modal-picker-to-writer wiring path with the modal picker mocked."

## Out of scope (recorded, not ruling)

- **Reload v1 (D8)** — deferred to a follow-up card if needed; current
  ruling is notify-only and binding for v1's copy.
- **A backfill-restore prompt in the modal** ("you had X, you picked Y,
  revert?") — designer's preference list mentions this; **not a goal**
  for v1; the echo-then-run step already quotes the resulting
  `council.<seat>` block pre-write, which is the recovery affordance.

## Sources cited

- `vault/wiki/procedures-vs-commands.md`
- `vault/wiki/council-config.md`
- `vault/wiki/council-theme.md` (theme-watcher firing on any
  `.council.json` change; merge, never rewrite)
- `vault/wiki/seats.md` (frontmatter default + per-seat override
  precedence; seat-schema independent of theme)
- `vault/wiki/smoke-test.md` (Phase 3/4 smoke pattern; "first Council
  command without an end-to-end falsifier is a defect")
- `vault/wiki/headless-pi.md` (no trust prompt, single-shot teardown;
  console-listing precedent for non-TUI flows)
- `vault/wiki/three-wave-decomposition.md` (wave-3 ruling-only
  precedent; PO never generates)
- `vault/wiki/engineering-board.md` (goal immutability once In
  Progress; draft-then-confirm gate)
- `vault/wiki/chain-promotion.md` (Backlog→Ready cadence for
  dependent chains)
- `vault/raw/2026-09-04-epic4-run-ledger.md` (EV-20 Q3 smoke-phase
  ruling; the precedent EV-25 follows)
- `vault/raw/2026-09-04-design-ev20-round2.md` §4.2 (echo-then-run
  forcing function precedent for D5 sub-question)
- `extensions/theme-watcher.ts:45` (watcher fires on any
  `.council.json` change; merge required so the watcher does not
  misclassify a model-only edit)
- `extensions/seats.ts:17,265,340` (THINKING_LEVELS, qualifiedOrThrow,
  fail-fast validation)
- `extensions/navigator.ts:88,91,522-538` (withModalFrame; ANSI reset
  documentation; overlay options precedent)
- `extensions/index.ts:355` (dispatch pre-validation against
  `getAvailable()`; the listing source must be the same set dispatch
  enforces)
- `extensions/hub-tools.ts:111` (same `getAvailable()` pre-validation
  pattern in the eval path)
- `test/theme-compliance.test.ts:50-92,122` (foreign-ANSI output check
  + source-audit pattern; the template EV-23's settling tests follow)
- `AGENTS.md` conventions #1, #5, #9, #9.6, #10, #12 (seat domain-neutral,
  override resolution, model-floors data, token-only drawing rule, MCP
  secrets not in mcp.json, runs/ ephemeral)

## Documentary (closed-green)

- `qualifiedOrThrow` is not exported (`seats.ts:265`, no `export`
  keyword in the wave-1 transcript). The wave-1 artifact's footnote is
  inaccurate but no card text relied on the export — EV-24's goal uses
  the catalogue + `THINKING_LEVELS` validation language, which is
  correct. No card amendment required.