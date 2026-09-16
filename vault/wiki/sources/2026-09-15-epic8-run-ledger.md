---
title: EPIC-8 Run Ledger
type: source
summary: The features-new + features-deliver run that made tool calls and the seat transcript render elegantly in the inline progress view (EV-33/34/35/36) — the taste request resolved to a parser-fidelity fix first, every child escalated, four gated merges, and EPIC-8 closed Done at v0.18.0.
aliases: [epic8 run, 2026-09-15-epic8-run-ledger, epic8 ledger, transcript rendering run]
tags: [pi-council/run-ledger, pi-council/epic8]
sources: ["[[2026-09-15-epic8-run-ledger]]"]
created: 2026-09-15
updated: 2026-09-15
provenance: run-ledger
source_path: vault/raw/2026-09-15-epic8-run-ledger.md
source_commit: 7e693bf
captured: 2026-09-15
---

# EPIC-8 Run Ledger (2026-09-15)

The `/features-new` decomposition and `/features-deliver EPIC-8` autonomous run
that shipped **elegant tool-call and transcript rendering** in the
`/council-tree` inline progress view. Four children, four gated merges (PRs
#47–#50), 672 → 704 tests, the epic card closed `Done` (third epic-card
closure). Every child escalated at least once (five in-card escalations plus
one closure dispatch), because the intake asked for *taste* while the actual
defect sat one layer upstream of the surface.

## What the run delivered

- **Parser fidelity** (EV-33, commit `186c04dc`): `TranscriptBlock` gains
  `toolCallId`/`isError`, and the single primary-argument accessor is exported
  from `extensions/transcript.ts`; the ad-hoc `firstArgOf` in `navigator.ts` is
  removed. See [[transcript-unit-rendering]].
- **The composed tool-call unit** (EV-34, `72351780`): one head
  `→ <Tool>  <primary-arg>` with the result body indented beneath and
  `muted "✗"` suffixed on failure; the empty state is
  `(waiting for output · idle)`; legacy blocks render without throwing. This is
  the **R-COPY** vocabulary.
- **The interaction model** (EV-35, `85db7a68`): the ruled keymap header, the
  U+258C focus signifier derived from the same expression `e` reads, and the
  `classifyProgressKey` fix — advertised keys are now honored on
  kitty/modifyOtherKeys CSI-u terminals. See [[honest-keymap]].
- **The one-row floor** (EV-36, `6b858c92`): at a one-row grant under follow
  the line is the effective-indexed unit's composed head, read-only; the marker
  is absent until a nav key flips follow off; the width clamp moves to the
  `unitLines` single-head site. See [[one-row-floor]].

## The defining shape

The human asked to take transcript taste from the `minimalist-ui` skill. The
deliberation proved the tool-call half was **blocked upstream**: the parser
discarded call identity and the error bit, so no renderer could pair a call
with its own result. EV-33 therefore came first, and only its merge unblocked
the rendering card. The intake's taste skill contributed principles
(typographic hierarchy, color scarcity) but not palette, spacing, or motion —
all illegal under the token-only draw rule, the integer row floor, and the pure
line slice — see [[designer]] and [[council-theme]].

## The escalation pattern

- **A card's goal can describe a post-epic endpoint.** EV-33's goal named an
  accessor consumed by the tree *and* the transcript header, while its
  Acceptance forbade render changes; [[product-owner]] ruled the accessor
  *exported* for EV-34 (goal stood, Acceptance bullet 3 amended).
- **An earlier ruling's anti-goal reaches later cards.** EV-35's Q5 ("no
  render-time recompute / no cursor-stability work") was ruled to reach EV-36,
  foreclosing R2's render-time `focused` writeback. [[product-owner]] clarified
  its own prior ruling rather than reversing a human decision.
- **Discovered mechanisms dominate.** Phase-1 copy rulings settled literals;
  the fold-in/new-card split, the header-pin scope, the clamp site, and the
  cross-card reach all surfaced per card. Five in-card escalations (three
  [[product-owner]], two [[steward]]) plus one closure, all resolved in single
  facts-only rounds.

## Follow-ups and residuals

Four follow-ups filed (all `Backlog`, epic EPIC-8): **FLLWUP-36** (dead
`blockLines`), **FLLWUP-37** (header persistence under follow-mode overflow),
**FLLWUP-38** (header width clamp), **FLLWUP-39** (dispose the replaced
`TranscriptView`). Two **permanent residuals**: out-of-order `toolResult`
duplicate-render, and `t`-toggle cursor stability. [[steward]] ruled closure
without promoting any follow-up ("promotion is a later, human-reachable call")
and without making a version bump a closure condition — v0.18.0 unchanged.

## Spend

Dispatched-seat total ≈ **$0.9488** catalogue-estimate over 15 dispatches
(9 runner containers, 3 product-owner, 3 steward), ≈26.6M tokens, cacheWrite 0.
The orchestrator's own session is not captured in the ledger.

## Related

- [[transcript-unit-rendering]], [[honest-keymap]], [[one-row-floor]] — the
  concepts this run shipped
- [[council-job-tree-inline]], [[run-transcripts]], [[council-theme]],
  [[designer]] — the surface, substrate, and seat this run changed
- [[council-runner]], [[deterministic-merge-check]], [[engineering-board]],
  [[product-owner]], [[steward]] — the process pages it sharpened
- [[2026-09-11-epic7-run-ledger]] — the preceding autonomous run

## Sources

- `vault/raw/2026-09-15-epic8-run-ledger.md` (raw)
- `vault/raw/2026-09-15-po-epic8-ruling.md` (the decomposition product-owner ruling, not yet a wiki source page)
- `council/cards/EPIC-8.md` and `council/cards/EV-33.md` … `EV-36.md`