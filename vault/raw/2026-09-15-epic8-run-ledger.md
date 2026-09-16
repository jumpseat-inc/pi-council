# EPIC-8 Run Ledger (2026-09-15)

Raw record of the `/features-new` decomposition and `/features-deliver EPIC-8`
autonomous run: **elegant tool-call and transcript rendering** in the
`/council-tree` inline progress view. Four children (EV-33, EV-34, EV-35,
EV-36) decomposed from a human intake, then delivered end to end — four PRs
(#47–#50), each squash-merged under the [[deterministic merge check]] with
`--match-head-commit` and `gates` re-verified green on the merged SHA. Epic
card itself closed `Done` (the third epic-card closure on the board). Version
stays **0.18.0** — no bump commit.

The run's defining shape: the human asked for *taste*, and the deliberation
proved the defect was one layer upstream of the surface (the transcript parser
dropped call identity and error state), so the first child is a data-fidelity
card, not a rendering card. Every child escalated at least once (five in-card
escalations — three [[product-owner]], two [[steward]] — plus one `steward`
closure dispatch), each resolved in a single facts-only round. No `HALT`, no
`RETIRED`, no stall recurrence.

## The human intake (verbatim, the epic's source of truth)

> when /council-tree is invoked and we navigate into the transcript of an
> agent's session, tool calls are not rendered elegantly. I want you to take
> inspiration from the `minimalist-ui` available as a skill in here in terms of
> the taste/UX of how we should render the transcript. This includes human
> interaction design, feel free to also take inspiration from other coding
> agents like Claude Code or Codex.

## Decomposition (the `/features-new` three-wave session)

Four seats deliberated ([[principal]] authored; [[skeptic]] + [[designer]]
attacked in parallel; [[product-owner]] ruled last). Epic `EPIC-8`; children:

- **EV-33** — transcript parser preserves `toolCallId`/`isError` + one shared
  primary-argument accessor (`transcript-block-fidelity`).
- **EV-34** — compose each tool call and its result into one rendered unit
  (`tool-call-unit-rendering`).
- **EV-35** — visible focus signifier, honest keymap, visible toggles
  (`transcript-interaction-model`).
- **EV-36** — legibility at the one-row progress floor
  (`transcript-one-row-floor-legibility`).

Decomposition rulings recorded on the cards (D1–D10): the parser-first order;
the `muted "✗"` failure token; the U+258C focus marker; `g`/`G` advertised;
the modal path out of scope (FLLWUP-4); EV-36's one-row line reuses EV-34's
composed head. Phase-1 rulings for the deliver run: **R-ORDER**
(EV-33→EV-34→EV-35→EV-36), **R-READY** (EV-33 promoted), **R-COPY**
(`→ <Tool>  <primary-arg>`, `muted "✗"` suffix, result body indented 2 spaces,
empty state `(waiting for output · idle)`), **R-KEYMAP**, **R-MARKER**,
**R-MODAL**, **R-FOLLOWUP**, **R-GATES**, **R-MERGE**, **R-ESCALATE**.

## Cards and merges (execution order)

- **EV-33** (PR #47, squash `186c04dc`, head `544bedbb`) — `extensions/transcript.ts`
  gains `toolCallId`/`isError` on the block shape and exports the single
  primary-argument accessor; the legacy ad-hoc `firstArgOf` is removed from
  `navigator.ts` and the tree row consumes the exported accessor
  (`test/ev7-council-tree-widget.test.ts`'s `/ran bash/` assertion unchanged).
  Escalation: the goal/Acceptance named a "transcript header" consumer while
  bullet 4 forbade render changes. `product-owner` (job-6) ruled the accessor
  is *exported* for EV-34; Acceptance bullet 3 amended; goal stood. Skeptic
  cycle-2 `passes`; judge `PASS`; `bun test` 672 pass / 2 skip / 0 fail.
- **EV-34** (PR #48, squash `72351780`, head `eb8ed129`) — the composed unit:
  `unitLines`/`bodyLines` render one head (`→ <Tool>  <primary-arg>`) with the
  result body indented beneath and `muted "✗"` suffixed on failure; the empty
  inline state is `(waiting for output · idle)`; legacy blocks (no identity
  fields) render without throwing; a second fixture proves it. The pre-EV-34
  `blockLines` is left unreferenced (→ FLLWUP-36). Step-13 escalation to
  `steward` (job-9): FLLWUP-36 confirmed; the out-of-order `toolResult`
  duplicate-render accepted as a **permanent residual**. One union merge
  (`89047ca`). `bun test` 676 pass / 2 skip / 0 fail.
- **EV-35** (PR #49, squash `85db7a68`, head `3b374382`) — the interaction
  model: header copy `<title> — ↑↓ move · e expand · t thinking · f follow(on) ·
  g/G jump · esc back`, follow-off as presence/absence (`f follow`), the U+258C
  marker derived from the same `vis[this.focused]` expression `e` reads, and
  the `classifyProgressKey` fix (raw `data === "e"|"t"|"f"|"g"` →
  `matchesKey`, so kitty/modifyOtherKeys CSI-u forms are honored). Q1–Q5 ruling
  by `product-owner` (job-12): `classifyProgressKey` is a fold-in (no goal
  change); no header pin (overflow deferred); presence/absence copy;
  `test/ev9-progress.test.ts` narrowing + a positive `▌` assertion; visible-index
  cursor scheme. Step-13 escalation to `steward` (job-14): FLLWUP-37/38/39
  confirmed; `t`-toggle cursor stability accepted as a **permanent residual**.
  `bun test` 694 pass / 2 skip / 0 fail.
- **EV-36** (PR #50, squash `6b858c92`, head `abe2712b`) — the one-row floor:
  at `viewportRows=1` under follow the line is the effective-indexed unit's
  composed head (`follow ? vis[vis.length−1] : vis[fv]`), read-only; the marker
  is absent at a fresh follow-on floor and returns on the next nav keypress
  (the card's shipped comprehension rule); the width clamp moves to the
  `unitLines` single-head site; the consolidator-scoped frozen-grant fix lands.
  Q1–Q4 ruled by `product-owner` (job-17): Q1 = R3; Q2 = EV-35's Q5 anti-goal
  reaches R2's writeback; Q3 divergence acceptable; Q4 clamp at `unitLines:723`.
  `bun test` 704 pass / 2 skip / 0 fail.

Suite progression: 672 → 676 → 694 → 704 pass (2 gated skips), 0 fail. Judge
`PASS` and Skeptic `does-not-block` on every card; step-9 cycles 1–2 of ≤3.

## The rulings (all appended verbatim to card faces, binding)

- **Phase-1 preflight (run start)** — R-ORDER, R-READY, R-COPY, R-KEYMAP,
  R-MARKER, R-MODAL, R-FOLLOWUP, R-GATES, R-MERGE, R-ESCALATE. The run's first
  autonomous merge (EV-33) was announced in-line and watched.
- **product-owner, EV-33 step 6 (job-6)** — bullet-3/bullet-4 reading: export
  the shared accessor; header consumption is EV-34's scope; Goal unchanged,
  Intent unchanged, Acceptance bullet 3 amended.
- **steward, EV-34 step 13 (job-9)** — FLLWUP-36 confirmed (`Backlog`, not
  promoted); Item B (out-of-order `toolResult`) dropped as a permanent
  residual on reachability.
- **product-owner, EV-35 step 6 (job-12)** — Q1 fold-in (`classifyProgressKey`,
  4 lines); Q2 no header pin (overflow deferred to EV-36 or a FLLWUP);
  Q3 follow-off presence/absence, no R-KEYMAP addendum; Q4 EV-35 may edit
  `test/ev9-progress.test.ts:262`, narrowed to the tree-row slice plus a
  positive with-session `▌` assertion; Q5 visible-index scheme, no
  `focusedAbsolute`.
- **steward, EV-35 step 13 (job-14)** — FLLWUP-37 (header persistence under
  overflow, one-row carve-out), FLLWUP-38 (header width clamp), FLLWUP-39
  (dispose the replaced `TranscriptView`); `t`-toggle cursor stability dropped
  as a permanent residual; EV-36's Acceptance untouched.
- **product-owner, EV-36 step 6 (job-17)** — Q1 = R3 (read-only effective
  index; no `focused` write; no marker at a fresh follow-on floor); Q2 the EV-35
  Q5 anti-goal *does* reach R2's render-time writeback; Q3 the markerless
  divergence is the card's shipped comprehension rule; Q4 width clamp at the
  `unitLines` single-head site.
- **steward, run close (job-19)** — EPIC-8 → `Done` on observed acceptance; run
  ends; FLLWUP-36..39 ride as `Backlog` residuals under the Done epic; both
  residuals confirmed permanent; no version bump made a closure condition.

## Follow-ups filed (all `Backlog`, epic EPIC-8)

- **FLLWUP-36** — Remove the unreachable pre-EV-34 transcript renderer left in
  `TranscriptView` (`blockLines`, zero call sites).
- **FLLWUP-37** — Keep the progress keymap header visible when follow-mode
  content overflows the viewport.
- **FLLWUP-38** — Clamp the inline progress transcript header to the granted
  render width.
- **FLLWUP-39** — Dispose the replaced transcript view when the inline progress
  surface switches sessions (1s interval + stale `onChange` leak).

## Accepted permanent residuals (no card)

- Out-of-order `toolResult` (a result ordered before its `toolCall` renders
  standalone and folded) — dropped on reachability, not doubt.
- `t`-toggle cursor stability (the visible-index scheme can move the focus
  target when `t` reveals thinking) — a UX gain, not a defect.

## Incidents

None verdict-invalidating. No `HALT`, no `RETIRED`, no stall-kill. Process
facts worth recording: one union merge (EV-34 `89047ca`) from the
"push records as they happen" pattern; the preflight branch-freshness artifact
(FLLWUP-27) surfaced on every card and was handled by the recorded practice
(the step-11 re-run set is `tsc`/`bun test`/`validate.py`), never by weakening
a criterion; the run's own session could not render its own usage block
(pre-merge code loaded in memory), same bootstrapping limit as EPIC-7.

## Run spend (catalogue-estimated, from the dispatched-seat usage blocks)

Seat roles aggregate their dispatches; `cost≈` is the catalogue estimate.
CacheWrite is 0 throughout. The orchestrator's own session is **not captured**
in this ledger (no `council_wait` report carries it).

| seat | dispatches | input | output | cacheRead | reasoning | total | cost |
|---|---:|---:|---:|---:|---:|---:|---:|
| council-runner | 9 | 3,120,334 | 322,081 | 20,542,976 | 124,883 | 23,985,391 | $0.7227 |
| product-owner | 3 | 182,688 | 37,748 | 945,542 | 28,937 | 1,165,978 | $0.1568 |
| steward | 3 | 289,350 | 37,573 | 1,107,968 | 27,365 | 1,434,891 | $0.0693 |
| **dispatched total** | **15** | **3,592,372** | **397,402** | **22,596,486** | **181,185** | **26,586,260** | **$0.9488** |

Per-card runner dispatches: EV-33 = 2 (job-5 esc + job-7 done), EV-34 = 2
(job-8 esc + job-10 done), EV-35 = 3 (job-11 esc + job-13 esc + job-15 done),
EV-36 = 2 (job-16 esc + job-18 done). Ruling dispatches: product-owner
job-6/12/17; steward job-9/14/19.

## Standing learnings

- **The surface complaint can be a data-seam defect.** `parseTranscript`
  discarded `toolCallId`/`isError`, so no renderer could pair a call with its
  result. The first child restored the data layer; only then could the
  rendering card compose a unit. A taste request resolved to a parser fix.
- **A card's goal can describe a post-epic endpoint.** EV-33's goal named an
  accessor consumed by the tree *and* the transcript header, while its
  Acceptance forbade render changes. The honest ruling is "export it now,
  consume it in the next card" — not a re-scope and not a breached bullet.
- **An earlier ruling's anti-goal reaches later cards.** EV-35's Q5 ("no
  render-time recompute / no cursor-stability work") was ruled to reach EV-36,
  forbidding R2's render-time `focused` writeback. Cross-card ruling reach is
  a check, not an assumption.
- **Follow vs focus is a reconciliation, and the floor forces a rule.** Under
  follow at `viewportRows=1` the line is the live tail; the marker is absent
  until a nav key flips follow off. The card shipped that as its comprehension
  rule, explicitly, rather than hiding it.
- **Honest keymap is a bug class.** Advertised keys must be honored.
  `classifyProgressKey` used raw byte equality while the rest of the tree used
  `matchesKey`; on kitty/modifyOtherKeys flag-1 CSI-u terminals the advertised
  keys silently forwarded to the editor draft. The repo's own search-smoke
  models the failing class.
- **A web taste skill transfers only its principles.** `minimalist-ui`'s
  palette, spacing scale, and motion have no legal vehicle under token-only
  drawing, an integer row floor, and a pure line slice. The transferable half
  is typographic/structural hierarchy + color scarcity.
- **Discovered mechanisms dominate under autonomy.** Phase-1 copy rulings
  settle literals; placement, subject, clamp site, and cross-card reach surface
  per card. Five in-card escalations, all resolved in one facts-only round.
- **The deterministic gate held across four merges**, the first announced
  in-line and watched; one union merge; version unchanged at 0.18.0; third
  epic-card closure.

## Board deltas

- EPIC-8 filed by `/features-new` with EV-33..36; all four children delivered
  in order and chain-sequenced; EPIC-8 → `Done` (third epic-card closure).
- FLLWUP-36..39 filed during the run (four cards), all riding as `Backlog`
  residuals under the Done epic.
- Version unchanged at 0.18.0.