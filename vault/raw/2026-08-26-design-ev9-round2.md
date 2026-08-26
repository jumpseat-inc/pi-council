# EV-9 — Round-2 designer position

> Card: `council/cards/EV-9.md`. Supersedes the first-pass
> `vault/raw/2026-08-26-design-ev9.md` only on the four seams owner +
> principal raised in round 1 (the height-budget split, the Enter
> no-op reaffirm, the SHARED-VStack bound, and the union-vs-rods
> indifference). Phase 1 ruling (binding, immutable): progress renders
> inline as an expansion of the tree panel's region. The first-pass
> design position is preserved verbatim where the seams do not touch
> rendering — Container { tree + divider + TranscriptView }, no second
> widget slot, no modal, editor stays focused, mode label `-- PROGRESS --`,
> `controller.surface` is the union type's third value, content parity
> with `TranscriptView` is byte-for-byte. This document refines the
> 12 falsifiable predictions against the engineering constraints and
> adds 5 new ones (P13-P17) for the principal-flagged seams.

## Wiki grounding (unchanged)

- `vault/wiki/index.md`, `vault/wiki/run-transcripts.md`,
  `vault/wiki/designer.md`.
- `council/cards/EV-9.md` — Phase 1 binding.
- `council/cards/EV-8.md` — Step 6 product-owner ruling (binding):
  editor-driven delivery, forward-unhandled, `-- TREE --` style
  mode label, ▌ U+258C marker.
- `vault/raw/2026-08-26-design-ev9.md` — my round-1 first pass.

## What changed and why

### (a) The 50/50 height split is dropped.

My R1 P11 said: "cap `viewportRows` at
`max(3, Math.floor((termRows - editorMinRows - treeLines) / 2))` so
tree and progress share the remaining rows roughly evenly." Owner
argued for `termRows - 4` (the modal's value, lifted); principal
argued for a bounded inline viewport without naming the formula.
Both reject the even split. They are right.

The tree is the operator's spatial anchor. They opened it with
ctrl+shift+t; they navigate it with arrows; the progress expansion
is a temporary read-only excursion into the seat below it. Chopping
the tree in half to share height with progress breaks the
"returning to the same place" comprehension; letting the progress
viewport shrink on small terminals preserves it. The right budget
is asymmetric: tree gets its existing EV-7 cap (≤11 rows counting
the hint line and overflow line, often ≤6 once running-first sort
settles), progress gets the remainder bounded above by
`availableRows = max(1, termRows - 5)` (where `-5` is `editorMin(3)
+ chrome(2)` — header + footer in pi's VStack).

Concretely, the factory's total output must be ≤
`availableRows`. The TranscriptView's `viewportRows` is
`max(3, availableRows - treeLinesCount - 1)` where `treeLinesCount`
is the actual count from the tree component on this render pass,
not the static cap. On a 14-row terminal with the tree taking
6 lines (typical running-first selection), progress gets
`max(3, 9 - 6 - 1) = 2` clamped to the `minViewportRows = 3`
floor; the belowEditor region claims 9 rows (6 tree + 1 divider +
2 transcript body + 1 transcript title); the conversation absorbs
the remaining 5 rows of overflow. On a 24-row terminal with the
same tree, progress gets `max(3, 19 - 6 - 1) = 12` lines — plenty
of room. The owner computes this bound once at factory
construction and threads it through.

This de-escalates the "50/50 vs termRows-4" dispute from R1 to a
single product-owner escalation that only fires if the smoke flags
a terminal where `minViewportRows = 3` is unreadable (e.g., a
short transcript with a long tool-call detail that gets truncated
to a one-line tail — recoverable with `e` to expand, so the
recovery is in the handled set).

### (b) Enter as consumed no-op — reaffirmed, rationale tightened.

My R1 said Enter is consumed with no observable action inside
progress. Owner implicitly concurred (their routing-table accepts
Enter as consumed in the routed set). Principal flagged a
cleanly-bounded edge: TranscriptView's `handleInput` does not
process Enter (`extensions/navigator.ts:597-622` lists only
Up/Down/e/t/f/g/G/Esc). So the question collapses to where Enter
goes:

- **To `view.handleInput`:** silently dropped by the view (no
  handler). Opaque surprise — user presses Enter, sees nothing,
  cannot tell whether the interface is hung or whether the key
  was eaten.
- **To `super.handleInput`:** editor's normal Enter behavior. If
  the operator has a draft, it submits. If empty, the editor's
  empty-input behavior runs. Consistent across surfaces — "Enter
  submits, always" — but a destructive surprise if the operator
  forgot they had a draft (read the transcript, hit Enter, sent
  a half-written message).
- **Consumed in the routing kernel:** explicit no-op. The mode
  label `-- PROGRESS --` and the TranscriptView's title line
  (`↑↓ move · e expand · t thinking · f follow · esc back`) both
  list exactly the handled set, excluding Enter. A user who reads
  either knows Enter has no semantic. A user who doesn't read
  either and presses Enter sees nothing — but the recovery is
  one key (Esc back to tree), and the no-op is consistent with
  the visible handled set, not an unannounced drop.

The third option wins on discoverability grounds: the discoverable
handled set is the cure for silent consumption, and both
signifiers (mode label + TranscriptView title) deliver that cure.
The owner's accepted tradeoff list — "typing while progress open
lands in editor buffer (non-view keys forward, consistent with
EV-8 T4)" — applies to other keys; Enter is in the routed set
alongside the TranscriptView's keys, not in the forward set. The
analogy breaks, and that's fine: the handled set is the handled
set; its composition is per-surface, not per-Enter.

The forcing function argument stands: the slip "press Enter to
see what happens" is recoverable (Esc), bounded (one keystroke),
and consistent with the visible contract. I escalate nothing to
PO on this one; the rationale is grounded in the existing
TranscriptView title line at `extensions/navigator.ts:628`.

### (c) The SHARED-VStack constraint is a hard bound.

Principal flagged: "belowEdge region is SHARED either with
conversation in one VStack — unbounded expansion would push the
conversation off-screen." My R1 P11 named the bound informally but
not as a hard predicate; this round pins it.

The factory's total `render(width)` output line count must be
≤ `availableRows = max(1, tui.terminal.rows - 5)` at all times.
This is a property of the factory, not of the TranscriptView
alone. The TranscriptView already slices its output to
`viewportRows` (`extensions/navigator.ts:642`); what the factory
must additionally guarantee is that `treeLinesCount + 1 (divider)
+ viewportRows ≤ availableRows`. If the tree wants more rows than
the budget allows, the EV-7 existing `rowBudget` logic at
`extensions/navigator.ts:391-393` truncates with `... N more`.
The owner MUST NOT raise `rowBudget` above the budget-derived
cap; if the tree has more rows than the budget, it windows. This
is the precedence: tree windowing wins over progress expansion at
small budgets.

The 50/50 split was wrong because it ignored this precedence.
The right shape: tree gets whatever the budget allows (capped at
the EV-7 11-line ceiling), progress gets the rest (clamped at 3
minimum). On a terminal too small to honor the 3-line minimum,
the factory opens progress anyway and the conversation absorbs
the overflow — recoverable by the operator scrolling up in the
conversation (which is a ConversationContainer affordance, not an
EV-9 concern).

### (d) Rendering predictions are indifferent to union-vs-rods.

Owner + principal both proposed the three-valued union
`"editor" | "tree" | "progress"` for `TreeFocusState.surface`.
My R1 escalation offered the rods alternative (`Surface =
"editor" | "tree"` + parallel `progressSessionId: string | null`)
as a fallback if PO rules the union change is too invasive for
EV-8's test surface. Both shapes satisfy the card's observable
contract; my predictions P1-P12 + the new P13-P17 are stated in
terms of the rendered output, not the type shape. The renderer's
predicate is "is progress open?" — a boolean, computed from
either `controller.surface === "progress"` or
`controller.progressSessionId !== null`. The factory's cache
signature must include that boolean (P13); the rest is unchanged.

I argue for the union because the routing kernel's exhaustive
switch reads more honestly with three named cases than with two
cases plus a nullable field; PO may rule rods for test-surface
reasons. Either way, my predictions hold.

## Principle and evidence (refinements on R1)

- **The tree is the spatial anchor.** The progress expansion is a
  temporary excursion from the tree; returning is "back to the
  same place," not "open a fresh tree." Chopping the tree to
  share height with progress makes the return feel different.
  Let the tree keep its size; let the progress shrink. Apply at
  the factory's height-budget computation
  (`extensions/navigator.ts:497-503`, the factory's render call
  site).
- **Discoverability cures silent-consume.** TranscriptView already
  publishes its keymap on the title line
  (`extensions/navigator.ts:628`); the divider row carries the
  close key (`▾ <seat> progress · esc back`); the editor's mode
  label (`-- PROGRESS --`) carries the surface identity. Three
  signifiers, all reading from `controller.surface`. Enter is
  consumed no-op because none of the three signifiers claim it
  does anything — the contract is consistent, not silent.
  Apply at the routing kernel's progress arm and at the
  divider row's wording.
- **Cache-signature must include progress state.** Per
  principal's EV-4 bug class flag. The current signature
  `${surface}:${selectedSessionId}`
  (`extensions/navigator.ts:373`) MUST fold in the progress
  predicate. Without it, opening progress on a tree the user is
  already viewing returns the cached tree render and the
  divider/progress lines are invisible until an unrelated
  invalidation. The factory must invalidate or include in the
  signature; including is cheaper. Apply at
  `CouncilTreeWidget.render` cache key.
- **Polling cadence is independent.** TranscriptView's 1s poll
  and the tree widget's 2s refresh are two separate
  `setInterval` calls — the second owned by the factory's outer
  scope (`extensions/navigator.ts:498-503`), the first by
  TranscriptView's constructor (`extensions/navigator.ts:550`).
  They tick on independent clocks. EV-9 must not couple them;
  either timer disposed in factory dispose must not affect the
  other. Apply at factory dispose.

## Falsifiable predictions (refined and extended)

R-numbering preserved from R1; P-replaced with refined versions
where the seam changed. P13-P17 are new, codifying principal's
flags.

### Rendering (testable by pure-seam test)

- **P1.** When the progress-open predicate is true, the factory
  returns N+M+1 lines: tree lines + divider + TranscriptView
  lines. When false, N lines only. Pure-seam test: instantiate
  factory with a populated jsonl, render at width 100, toggle
  progress open, assert output contains the divider AND at
  least one `assistant` / `→ toolCall` / `⎿ toolResult` label;
  toggle closed, assert both absent. Indifferent to union/rods.

- **P2.** Divider reads `▾ <seat> progress · esc back` (or
  equivalent wording — wording is taste; the constraint is dim +
  seat name + close key), styled with `theme.fg("dim", ...)`.
  No literal ANSI. Indifferent to union/rods.

- **P3.** TranscriptView content byte-identical to the modal
  version at width=96 with the same jsonl. Block-renderer
  parity test at the TranscriptView class level: instantiate
  TranscriptView directly (not via the modal wrapper), assert
  byte-equality of `render(96)` between the modal TranscriptView
  (constructed at `extensions/navigator.ts:655`) and the inline
  one (constructed in the factory). The modal TranscriptView
  and the inline TranscriptView are the SAME class instance
  shape; the test pins this. Indifferent to union/rods.

- **P4.** Esc-from-progress calls a new method
  `controller.exitProgress()` (or equivalent) that sets
  `surface = "tree"` and disposes the view but DOES NOT call
  `controller.exit()` (which would null `selectedSessionId`).
  Assert by spy on the controller: after Esc,
  `controller.surface === "tree"` AND
  `controller.selectedSessionId === "sess-A"` AND the widget's
  `▌` row in the render output is on `sess-A`. Per principal's
  "must NOT call exit()" flag.

- **P5.** Tree's 2s refresh fires while progress is open; assert
  by spying on the factory's setInterval — its callback runs at
  least once during a 3s progress-open window. Indifferent to
  union/rods.

- **P6.** Editor bottom border ends with `-- PROGRESS --` when
  progress open, `-- TREE --` when tree-focus, default when
  editor. The label is computed from the progress-open predicate
  (union or rods, indifferent). Falsifier: instantiate
  CustomTreeEditor with a stub controller; flip the predicate
  through all three states; render at width 80; assert the last
  visible line ends with the expected 12-column mode label.

- **P7.** No `setFocus(view)`. Widget never receives
  `handleInput`. Editor remains the TUI focused component
  throughout. Assert by spying on `tui.setFocus` — no call from
  the EV-9 path. Per owner's R1 commitment to
  editor-driven delivery.

- **P8.** The EV-9 enter action does NOT call `ctx.ui.custom`
  or `withModalFrame`. The modal `openTranscript` at
  `extensions/navigator.ts:647-680` remains legacy code
  reachable via the non-EV-9 modal path (the `/council-tree`
  command's pre-EV-8 modal opener at line 322). Grep test:
  `grep -E "ctx\\.ui\\.custom|withModalFrame"
  extensions/navigator.ts` after the change shows no new calls
  from the EV-9 path.

- **P9.** No new theme tokens; divider uses `dim`; TranscriptView
  uses its existing palette (`accent`, `success`, `dim`,
  `warning`, `muted`, `bold` per `vault/raw/2026-08-25-design-ev4-round1.md`).
  Grep test on `theme.fg("...")` and `theme.bold` call sites.

- **P10.** Token-only emission per AGENTS.md 9.6. Pure-seam test:
  theme with recording `fg` spy; render; assert each emitted
  ANSI byte sequence matches `getFgAnsi(token)` for the tokens
  above.

- **P11. REVISED.** Height budget is BOUNDED, NOT split evenly.
  Factory's total `render(width).length ≤ availableRows =
  max(1, tui.terminal.rows - 5)` at all times. Compute once at
  factory construction from `tui.terminal.rows`; pass to
  TranscriptView as `viewportRows = max(3, availableRows -
  treeLinesCount - 1)` where `treeLinesCount` is the actual
  tree lines on this render pass (typically ≤ 11 with EV-7 cap,
  often ≤ 6 with running-first sort). On `terminal.rows < 12`,
  `viewportRows` clamps at `minViewportRows = 3`; the
  belowEditor region claims its computed size and the
  conversation absorbs the overflow. Falsifier: render the
  factory at `terminal.rows ∈ {14, 20, 24, 40}` with a
  500-block jsonl; assert `factory.render(100).length ≤
  terminal.rows - 5` AND the TranscriptView output is sliced
  to `viewportRows` AND the tree lines are windowed to fit.

- **P12.** Factory dispose clears tree's 2s timer AND
  TranscriptView's 1s timer (via `view.dispose()` at
  `extensions/navigator.ts:550`); re-invoking `/council-tree`
  constructs a fresh TranscriptTail on next Enter, not a stale
  one. Per owner's accepted tradeoff.

- **P13. NEW — cache signature folds progress state.** Per
  principal's EV-4 bug class flag. `CouncilTreeWidget.render`'s
  cached sig at `extensions/navigator.ts:373` must include the
  progress-open predicate. Concrete:
  `${surface}:${selectedSessionId}:${progressSessionId ?? ""}`
  (union) or `${surface}:${selectedSessionId}:${hasProgress ? "1" : "0"}`
  (rods) — observable form is identical. Falsifier:
  instantiate widget, render to populate cache, flip
  `controller.progressSessionId` (or surface) WITHOUT changing
  `surface:selectedSessionId`, render again; assert the cache
  was invalidated and the new output contains the divider.

- **P14. NEW — polling cadence is independent.** TranscriptView's
  1s timer and the tree widget's 2s timer tick on independent
  clocks. Falsifier: spy on both `setInterval` returns; advance
  fake clock by 3s while progress is open; assert TranscriptView's
  poll ran 3 times and the tree refresh ran 1-2 times
  (depending on phase alignment); neither timer calls the
  other's callback.

- **P15. NEW — EV-8 routing kernel becomes surface-parameterized.**
  Per principal's flag. The `routeEditorFocus` kernel's tests
  in `test/ev8-focus-navigation.test.ts` are EXTENDED (not
  broken) to cover the `surface === "progress"` branch.
  Concrete: existing tests pass unchanged; a new test file
  `test/ev9-progress-routing.test.ts` adds progress-surface
  cases — Enter consumed no-op, e/t/f/g/G forwarded to
  `view.handleInput`, Up/Down forwarded to `view.handleInput`
  (NOT `controller.move` — the tree's selection is frozen while
  progress is open), Esc calls `exitProgress()`, other keys
  forward to `super.handleInput`. The existing
  `classifyTreeKey` 5-way split (`up|down|enter|escape|other`)
  is preserved verbatim; a parallel `classifyProgressKey` is
  added for the progress surface's expanded handled set. The
  static type assertion on `surface` in the kernel's switch
  becomes a TypeScript exhaustiveness check that includes the
  new arm — no `// @ts-ignore` or `as never` escape.

- **P16. NEW — widget factory is bounded by available terminal
  rows.** The render output's line count never exceeds
  `terminal.rows - 5`. This is the operational form of P11.
  Falsifier: instantiate a fake TUI with `terminal.rows=14`
  and a 500-block jsonl; open progress; assert
  `factory.render(100).length ≤ 9`. With the tree taking up
  to 11 rows, the EV-7 existing `rowBudget` logic at
  `extensions/navigator.ts:391-393` windows the tree when the
  available budget is small. The owner MUST document the
  precedence: tree windowing wins over progress expansion at
  small budgets.

- **P17. NEW — selection survives re-sort during progress.** While
  progress is open, the tree's 2s refresh re-sorts running-first.
  The `▌` row above the progress must remain on the seat whose
  progress is open. Falsifier: open progress for `sess-A`,
  advance 5s, fire the factory's 2s callback (simulating a
  re-sort); assert `controller.selectedSessionId === "sess-A"`
  AND the widget's `▌` row in the render output is on
  `sess-A`. This pins P5 + P4 together: ticking +
  selection-preservation.

### Comprehension (judgment — only a human read settles)

- **C1-C4.** UNCHANGED from R1. The seat-above-glyph-flip
  comprehension check (C2) is the load-bearing one — when
  another seat settles while the operator is watching progress
  for one, the row above flips from `●` to `✓` / `✗`. This is
  the comprehension gulf the card actually closes, and it's
  free because the tree widget's 2s refresh does not depend on
  which surface is "active" in the controller. Comprehension
  C2 closes on a human read because it requires the operator's
  eye to be on the row above while reading progress — a
  perceptual layout the smoke can render but cannot read.

## Preferences, ranked last

- **Divider wording.** I retain `▾ <seat> progress · esc back`
  from R1. Equally defensible: `↓ <seat> progress · esc back`
  (more "below" semantic); `— <seat> progress (esc to close)`
  (em-dash, no glyph). Constraint: dim + seat name + close key.
- **Progress viewport floor.** At small terminals where
  `availableRows < treeLinesCount + 4`, my P11 forces
  `viewportRows = 3` (the transcript body shows only 2 lines
  below the title). Equally defensible: suppress the tree
  rows entirely (only the divider + transcript) and let the
  transcript take the full budget. I prefer the former — it
  preserves the spatial anchor; the latter is a fallback if the
  smoke catches an unreadable terminal.
- **Mode label style.** I retain `-- PROGRESS --` mirroring
  `-- TREE --`. The style (vim `-- INSERT --` precedent) is
  EV-8 ruling 3 hard rule; the word is taste.
- **Whether to show the seat glyph in the divider.** I prefer
  NO glyph (the row above already shows it; duplication is
  noise). Equally defensible: prepend `●` / `✓` / `✗` for
  parity with the row above.

## What I escalate to product-owner

- **Surface type expansion.** Same as R1: union
  (`"editor" | "tree" | "progress"`) preferred; rods
  (`"editor" | "tree"` + parallel `progressSessionId: string |
  null`) is the fallback if the union change breaks the EV-8
  test surface. Either way my P1-P17 hold. PO rule binds.
- **Tree windowing precedence at small budgets.** My P11 + P16
  say tree windowing wins over progress expansion. If the
  smoke flags a terminal where windowing the tree to 2 rows
  is worse than shrinking progress below the 3-line floor,
  this is a re-routable concern; otherwise the rule is
  implicit in the budget formula and no PO ruling needed.

## What I de-escalate from R1

- **Height budget split.** Settled (a) above: bounded, not
  split. PO no longer rules unless smoke flags unreadable
  small terminal.
- **Mode label wording.** Settled by EV-8 ruling 3 (`-- TREE --`
  style is a hard rule; `-- PROGRESS --` mirrors it). No PO
  needed.

## Files read for this position

- All files from R1 plus:
- `extensions/focus-nav.ts` — `routeEditorFocus` kernel and
  `CustomTreeEditor` (unchanged structure; my P15 says the
  kernel becomes surface-parameterized, not replaced)
- `test/ev8-focus-navigation.test.ts` — existing test surface
  for the routing kernel; my P15 says new tests are added in
  a sibling file `test/ev9-progress-routing.test.ts`, not
  modifications to the existing file
- `council/cards/EV-8.md` Step 6 — confirmed binding for
  editor-driven delivery + forward-unhandled + `-- TREE --`
  style

## Yield

Refined round-2 position on EV-9. Dropped 50/50 (a).
Reaffirmed Enter consumed no-op with tighter rationale (b).
Pinned the SHARED-VStack bound as a hard predicate (c).
Rendering predictions are indifferent to union-vs-rods (d).
New predictions P13-P17 codify principal's flags. Comprehension
checks C1-C4 unchanged. One PO escalation retained (surface
type); one de-escalated (height budget split). I have not
edited application code.
