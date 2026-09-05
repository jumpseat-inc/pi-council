# EPIC-6 Run Ledger (2026-09-05)

Raw record of the `/features-deliver EPIC-6` autonomous run that added the
model-name search filter to the [[council models picker]] — the pure
`filterModelRows` unit and the `/`-triggered search input in the modal's
model level — plus the three EPIC-5 follow-ups reassigned to the epic by
the human. Five PRs, each merged on the [[deterministic merge check]] with
`--match-head-commit` and CI re-verified green on the merged SHA:

- EV-26 (PR #23, squash `b89a93b`, head `297a8d9`) —
  `extensions/model-picker.ts`, the pure `filterModelRows(rows, query)`
  over the J-2 cross-product: case-insensitive substring on
  `qualifiedId` only, suffix-safe (`:off` never matches), reference-
  preserving so `resolveSelection()` stays byte-verbatim.
- EV-27 (PR #24, squash `3452abb`, head `bacbbf85`) — the
  `/`-triggered focused search input below the top row; the two-bit
  focus machine (see below); ruled copy byte-pinned.
- FLLWUP-10 (PR #25, squash `948d111`, head `2175b73`) — writer
  `existingThinking` parses an object-form `model` `:suffix` via
  `lastIndexOf(':')` + `THINKING_LEVELS.has(...)`, matching
  `applySeatOverride`; the W3 track test strengthened to assert the
  post-fix truth.
- FLLWUP-9 (PR #26, squash `08438bd`, head `7d8d386`) —
  `clearSeatOverride`: explicit removal of a seat's `thinking` member or
  the whole `council.<seat>` object, `theme`/other-seats/unknown-keys
  byte-preserved, absence still means preserve.
- FLLWUP-11 (PR #27, squash `73b3150`, head `1b37acd`) —
  `SMOKE_PHASE=<n>` selector in `smoke/driver.sh` + `run.sh` so Phase 5
  (the `/council-models` falsifier) runs in isolation; Phase 5
  assertions source the R-2 usage line and R-3 notify copy from ruled
  literals, not in-repo constants (the self-referential `USAGE_LINE`
  test gap closed).

Suite progression across the run: 507 → 511 → 526 → 528 → 536 → 537
pass (2 pre-existing env-gated skips), 0 fail.

## Build order (steward, strategy ruling)

EV-26 → EV-27 → FLLWUP-10 → FLLWUP-9 → FLLWUP-11. EV-26 → EV-27 was
forced by the cards (EV-27 renders EV-26's rows). FLLWUP-10 before
FLLWUP-9 so the writer's preservation seam is fixed before the new
removal operation lands on the same file. FLLWUP-11 last so Phase 5
exercises the finished surface.

## Phase 1 rulings preflight (recorded human decisions, binding for the run)

Recorded on card faces before any runner dispatched; runners applied and
cited them rather than re-asking:

- **EPIC-6 R-1 (no-match copy)** — when the query matches zero models the
  modal renders `No models matching "<query>".` — byte-exact, interpolated
  with the live query, distinct from the two R-4 empty states.
- **EV-27 R-1 (affordance hint copy)** — while the search input is empty
  the search row renders `▌ / filter · esc clears`: the `▌` focus
  signifier at column 0, then the hint byte-exact (middot idiom matching
  the ruled footer).
- **FLLWUP-9 R-1 (scope)** — writer-level clear operation only; no modal
  UI change and no new user-visible copy (per the decomposition's S-2
  ruling that this is a writer-surface follow-up, not a modal fold-in).
- **FLLWUP-11 R-1 (fold-in in scope)** — the optional R-2/R-3
  byte-literal-authority fold-in is included.

**Zero `ESCALATION` reports across all five cards.** The two flagged
deliberation disputes on EV-27 (Esc-on-empty; `▌` focus conditionality)
were closed by applying the card's own rulings, each confirmed by a
Skeptic settling probe.

## Deliberation outcomes that shaped the code

- **Two-bit focus machine (EV-27)** — the model level is a two-bit state
  machine (`searchActive`, `inputFocused`). Esc routes on `inputFocused`:
  in-input → clear-and-stay (the intake's literal read); elsewhere → the
  existing level-2 ascend preserved. Down moves the list cursor AND
  clears `inputFocused` — the unstated key that makes "Esc elsewhere"
  reachable. `/` is captured by construction inside the input (the
  trigger key and the query character are the same character, handled by
  ordering — `qualifiedId` values contain `/`). The `▌` focus signifier
  reuses EV-8's U+258C precedent on a sibling surface. See
  [[two-bit focus machine]].
- **Filter interposed at `currentRows()` (EV-27)** — not at render tail:
  `currentRows()` at level 2 returns `searchActive ?
  filterModelRows(rowsForProvider(group), query) : rowsForProvider(group)`
  so windowing, the Up/Down cursor clamps, `pushRows`, and
  `resolveSelection()` all read one list. The render-cache `signature()`
  gains `:${searchActive}${inputFocused}:${query}` — a query-blind
  signature serves stale frames when two queries yield equal-shaped
  results (`claude` → `claud`, both 2 rows).
- **Mechanical path is the default (4 of 5 cards)** — EV-26, FLLWUP-9,
  FLLWUP-10, FLLWUP-11 all gated mechanical/not-surface-touching and
  skipped steps 2–6; only EV-27 ran the full council (3 rounds at the
  cap, designer seated; step-4 skeptic closed 8/8 objections green).
  Phase-1 rulings + landed module contracts settle most cards.
- **Gate integrity demonstrated per card** — a `query: string → number`
  injection turned tsc red (exit 2, 40 errors); a match-on-`name`-
  instead-of-`qualifiedId` injection turned the EV-26 suite red; a
  one-word hint change turned the EV-27 copy pin red; a stubbed clear
  turned 16 FLLWUP-9 tests red; the FLLWUP-11 drift tripwire ran red in
  both directions on the R-2/R-3 literals.

## Infrastructure incidents

- **Stall-window recurrence (2 containers lost, zero work lost)** — the
  orchestrator's first two runner dispatches (jobs 6, 7) used the
  default 4-minute no-activity stall window; both containers were
  anti-stall-killed while legitimately waiting on the runner contract's
  30/45-minute bounded sub-waits. The EPIC-5 fix (raise the
  orchestrator's stall window above the runner's longest child ceiling)
  was recorded on [[hub job supervision]] but not institutionalized in
  the dispatching procedure — EPIC-6 re-learned it from run memory.
  Fix applied: `stall_minutes: 50` on every subsequent runner dispatch
  (covers the 45-min owner ceiling). Lesson: encode the window in the
  dispatching procedure itself, not in per-run recollection.
- **Sub-dispatches die with their parent container** — job-7's in-flight
  skeptic verification (job-7.1) was unrecoverable after the container
  died; hub children are not addressable across containers. Recovery is
  always: fresh container, durable state from the board, re-run.
- **Shared-checkout contamination (FLLWUP-9)** — a foreign dispatch (the
  judge) left implementation files staged in the shared checkout; the
  runner's scoped record commit (`5abd03c`) swept them onto `main`.
  Remediated with a forward revert (`d4f7e2f`) — no history rewriting —
  so the feature landed only via PR #26's gated squash. Lesson: verify
  the staged set before every commit; check the tree after every
  foreign dispatch.
- **Union-merge reconcile, twice** — squash merges fold the runner's
  board commits, so a local `main` carrying later record commits
  diverges; reconciled by union merge (EV-27 `f8f70e4`, FLLWUP-10).
  FLLWUP-9 avoided the pattern entirely by pushing records as they
  happened. FLLWUP-10's reconcile left a lone `<<<<<<< HEAD` remnant on
  the card (cleaned post-run by the orchestrator) — verify after every
  reconcile. See [[union-merge reconcile]].

## Follow-ups filed (step 13, human-confirmed)

- **FLLWUP-12** — backspace deletes one character in the search input
  (owner + designer flag; Esc-clear was the sole deletion).
- **FLLWUP-13** — no-match hint naming the focus-out key (the Down→Esc
  exit is invisible at zero rows); copy is a Phase-1 ruling not yet made.
- **FLLWUP-14** — kitty-protocol terminal smoke for `/council-models`
  (the CSI-u delivery path is unit-tested only as decode; the live path
  needs a real terminal run).
- **FLLWUP-15** — `withModalFrame` +1 frame-line overrun in search mode
  at full window (search-mode window of `maxRows - 1`).
- **FLLWUP-16 candidate, not filed** — pre-press `/` discoverability
  hint line; explicitly not authorized by the surface ruling (footer
  stays the ceiling), recorded on EV-27's card so the idea is not lost.

Post-run housekeeping: the FLLWUP-10 conflict-marker remnant removed by
the orchestrator; wiki staleness flags left for ingest
([[council config writer]] known-seam; [[smoke test]] planned-fix note).

## Grounding

Card records: `council/cards/EPIC-6.md`, `EV-26.md`, `EV-27.md`,
`FLLWUP-9.md`, `FLLWUP-10.md`, `FLLWUP-11.md`. Decomposition ruling
packet: `vault/raw/2026-09-04-po-epic6-ruling.md`. Designer round-2:
`vault/raw/2026-09-05-design-ev27-round2.md`. Specs:
`docs/superpowers/specs/2026-09-05-EV-27-design.md`,
`docs/superpowers/specs/2026-09-05-FLLWUP-9-clear-thinking-override.md`.
Plans: `docs/superpowers/plans/2026-09-05-*`.
