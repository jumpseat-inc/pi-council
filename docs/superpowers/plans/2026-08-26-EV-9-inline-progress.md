# EV-9 Inline Progress Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans /
> test-driven-development. Steps use checkbox (`- [ ]`) syntax. Fail-first per
> objection, then green. Work in the isolated worktree only.

**Goal:** Pressing Enter on the selected row of the EV-7 inline below-editor job
tree opens that subagent's live progress view (same TranscriptView streaming
content the modal shows), rendered **inline** as a below-editor expansion of the
tree panel; closing it returns focus to the tree with the selection preserved.

**Architecture:** `controller.surface` widens from `"editor"|"tree"` to
`"editor"|"tree"|"progress"` (discriminated union, additive). `enterProgress(sid)`
(grand `if (termRowsCap < 7) return;`) transitions to progress; `backFromProgress()`
returns to tree preserving `selectedSessionId` (never `exit()`). A pure
`classifyProgressKey(data)` + `computeProgressLayout(termRows, treeContentLines)`
(clean vs tiny regimes, upper-bound-fixed) drive the widget. `CouncilTreeWidget`
renders `[...treeLines, separator, ...viewLines]` inline; owns the live
`TranscriptView` (installed on the controller as `viewHost`); two independent
clocks (1s transcript via TranscriptView, 2s tree) both cleared in dispose;
`view.onChange → widget.refresh()` (not just invalidate) so a new job during
progress repaints the row list. Render cache sig already includes `surface`.

**Tech Stack:** Bun, TS (strict), pi extension API (`setEditorComponent`,
`ui.setWidget`), pi-tui (`Key`, `matchesKey`, `CustomEditor`), existing
`TranscriptView`, `CouncilTreeWidget`, `TreeFocusState`, `runs.ts`/`transcript.ts`.

**Spec:** `docs/superpowers/specs/2026-08-26-EV-9-design.md` (settled, binding
rulings R1 + viewport-floor + upper-bound flag).

## Global Constraints (from spec — binding)

- Surface union is `"editor" | "tree" | "progress"`; no parallel progress flag.
- Progress renders **inline** (same below-editor widget, stacked lines). No second
  setWidget, no ctx.ui.custom overlay, no withModalFrame for this surface.
- Enter on any selected row → `controller.enterProgress(sid)`; running OR settled.
- Escape from progress → `backFromProgress()` keeps `selectedSessionId`; NEVER
  call `exit()`. Enter inside progress = consumed no-op (never submits a draft).
- `classifyTreeKey` + tree/editor branches stay **byte-identical**; EV-8 test file
  passes **unmodified**; progress tests are additive.
- Each of the three `surface === "tree"` sites (routeEditorFocus,
  CustomTreeEditor.render, CouncilTreeWidget.render) gains a `progress` branch
  with a `never` default (tsc exhaustiveness).
- Render cache sig folds the third surface value (it already interpolates
  `surface`). `view.onChange → widget.refresh()` (not invalidate only).
- Two clocks: 1s transcript tail (TranscriptView) + 2s tree; BOTH cleared in `dispose()`.
- Token-only drawing (AGENTS.md 9.6 + EV-4): fg/bg/bold via theme tokens only; no
  inline ANSI/hex; no new theme tokens.
- **Display floor = 7 rows**: `if (termRows < 7) return;` at top of
  `enterProgress`; at termRows<=6 Enter is a consumed no-op (surface stays "tree").
- **Upper-bound fix (owner obligation, spec section below)**: for termRows∈{7..11},
  `treeLines + sep + progressLines <= avail`, `treeLines >= 1`, `progressLines >= 1`;
  `(8,5)→(1,1)`; normal pins `(12,8)→(3,3)`, `(40,11)→(11,23)` unchanged.
- `hub.ts` NOT touched (AGENTS.md #7). Above-editor ambient widget contract (OV-1)
  untouched. RPC guard at navigator.ts:57 out of scope.
- Gates, in order (spec + `.github/workflows/gates.yml`): `bunx tsc --noEmit`,
  `bun test`, `python3 council/validate.py`. (No import smoke applies to
  pi-council; the card's "import smoke relevant" = validate.py, which is the
  board-discipline gate per gates.yml.) No threshold lowered, no finding
  minimised.

## Viewport formula (from spec — implemented as pure `computeProgressLayout`)

Constants: `CHROME = 5`, `SEPARATOR = 1`, `TREE_FLOOR = 3`, `PROGRESS_FLOOR = 3`,
`ROWS_MAX = 11`. `avail = max(1, termRows - CHROME)`.

**Normal (avail >= 7, termRows >= 12):**
```
sep = 1
treeLines   = max(TREE_FLOOR, min(ROWS_MAX, treeContent, avail - sep - PROGRESS_FLOOR))
progressLines = max(PROGRESS_FLOOR, avail - sep - treeLines)
```
Pins: (12,8)→(3,1,3); (24,8)→(8,1,10); (40,11)→(11,1,23).

**Tiny (termRows ∈ {7..11}, 2 <= avail < 7) — upper-bound fix:**
```
sep = (avail >= 3) ? 1 : 0
treeLines   = max(1, min(ROWS_MAX, treeLines, avail - sep - 1))
progressLines = max(1, avail - sep - treeLines)
```
Pins (verified this is the clean fix): (7,.)→(1,0,1)=avail2'; (8,5)→(1,1,1)=avail3 ✓; (9,11)→(2,1,1)=avail4 ✓; (10,.)→(3,1,1)=avail5 ✓; (11,.)→(4,1,1)=avail6 ✓.

## File structure

- Create `extensions/focus-nav.ts` additions — widen `Surface`, add
  `classifyProgressKey`, `enterProgress`/`backFromProgress` + `viewHost`/`termRowsCap`
  on `TreeFocusState`, `computeProgressLayout`.
- Modify `extensions/navigator.ts` — `CouncilTreeWidget` progress branch
  (`[...treeLines, sep, ...viewLines]`), lazy `TranscriptView` (viewHost,
  onChange→`widget.refresh()`), capture `termRows`, dispose both clocks; a
  `Progress` branch in the surface switch with `never`.
- Create `coverage/ev-... test/ev9-progress.test.ts`.

## Task 1: surface union + controller methods + classifiers (focus-nav.ts)

- [ ] **Step 1 (RED)** create `test/ev9-progress.test.ts` (controller+layout batch):
  Surface-union compile; `classifyProgressKey` (enter/escape/up/down/e/t/f/g/G/other);
  floor T1 (term 5,6 no-op); T7 (`backFromProgress` preserves selection, `exit` nulls);
  enterProgress considered at 7; not-open no-op; `computeProgressLayout` T4 pins +
  upper-bound table.
- [ ] **Step 2 (RED)** run `bun test test/ev9-progress.test.ts` — all FAIL (exports missing).
- [ ] **Step 3 (GREEN)** in `focus-nav.ts`:
  - `export type Surface = "editor" | "tree" | "progress"`
  - `export type ProgressKey = "enter"|"escape"|"up"|"down"|"e"|"t"|"f"|"g"|"G"|...` and
    `classifyProgressKey(data)` mirroring the view's key set.
  - `export const PROGRESS_MODE_LABEL = "-- PROGRESS --"`.
  - `TreeFocusState` gains the public field `viewHost: { handleInput(d: string): void } | null`,
    `termRowsCap: number = 24`, methods:
    ```
    enterProgress(sessionId) {
      if (this.termRowsCap < 7) return false;      // floor guard (spec)
      if (!this._open) return false;
      this.selectedSessionId = sessionId;
      this.surface = "progress";
      return true;
    }
    backFromProgress() { if (this.surface !== "progress") return; this.surface = "tree"; }
    ```
    (never `exit()` ⇒ selection preserved — O3 closed designs.)
  - `export type ProgressLayout = { avail; sep; treeLines; progressLines }` and pure
    `computeProgressLayout(termRows: number, treeContentLines: number): Progress` with
    the exact two-regime formula above.
- [ ] `Step 4 (GREEN)` run the test; all pass.
- [ ] `Step 5 commit` `test: EV-9 surface union + progress controller + layout (TDD red)`

## Task 2 — routeEditorFocus progress branch + CustomTreeEditor delivery

- [ ] `Step 1 (tests)` — extend and run (RED) the batch for `routeEditorFocus` in `progress`:
  enter consumed no-op; escape → backFromProgress tree-preserved; `e/t/f/g/up/down` consumed;
  `'other'` forward. Plus a `CustomTreeEditor.handleInput` delivery proof: while progress,
  `e` reaches the live view (via `viewHost.handleInput`), while `'x'` is forwarded to prior;
  Enter not delivered to view and not submitted to the editor buffer.
- [ ] `Step 2 (RED)` run — fail (progress branch absent).
- [ ] `Step 3 (GREEN)` in `focus-nav.ts` `routeEditorFocus` add the progress branch with
  `never` default; in `CustomTreeEditor.handleInput`, classify `data` by surface
  (`classifyProgressKey` when progress), call `routeEditorFocus`, consume as designed and
  deliver consumed view-keys via `this.controller.viewHost... `. When the controller is
  in progress, Enter is consumed and never reaches `super/prior` (no draft submit).
- [ ] `Step 4` run — green.
- [ ] `Step 5 commit` `feat(ev9): progress routing + view delivery`

## Task 3 — CouncilTreeWidget inline progress render + dual-clock dispose

- [ ] `Step 1 (tests)` widget batch: T2 true (term 7 progress; tree>=1, total<=avail);
  O1-1 negative (term 5,6 stays tree, rows<=avail, no separator, treeRows visible);
  O5: one job, render, second job lands, `view.show` fires, `refresh()` → row appears on
  pusha re-render; T9 cache: `surface` folds (tree↔progress repaints); T12 negative:
  ▌ marker hidden when surface !== "tree"; T11 parity: same JSONL+width+viewportRows →
  inline view lines == modal `TranscriptView` rows (chrome-excluded).
- [ ] `Step 2 (RED)` run — fail (widget lacks progress input).
- [ ] `Step 3 (GREEN)` in `navigator.ts`:
  - `CouncilTreeWidget` constructor accepts `termRowsCap`; mirror captured terminal height
    (computeAvail default 24).
  - `render(width)`: when `controller.surface === "progress"` build `[...treeLines, sep, ...viewLines]`
    using `computeProgressLayout`; keep the existing budget/backward tree rendering path for
    surface "editor"/tree. Distinct hidden-(selection) mode.
  - ensure a live `TranscriptView` for `selectedSessionId`: create on entry into progress,
    `this.view.setOnChange(() => { this.refresh(); /* requestRender from the harness via
    view.onChange hook already wired */ })`; install the viewHost (`handleInput`) onto the
    controller; `dispose()` clears the view timer AND the 2s tree timer.
  - factory (`setWidget`) captures `tui.terminal.rows`, passes it in, wires
    `onChange→refresh()` + both clears.
- [ ] `Step 4` run — green.
- [ ] `Step 5 commit` `feat(progress): inline below-editor progress expansion with inline view + dual-clock dispose`

## Task 4 — harness wiring in `registerNavigator` (capture term)

- [ ] `Step 1` in `registerNavigator`'s `setWidget` branch: read `tui.terminal.rows`
  and pass to the widget; the twin-REfresh transition is unchanged (2s) plus the widget
  owns the 1s TranscriptView timer.
- [ ] `Step 2` full suite green + tsc + validate.
- [ ] `Step 3 commit` `feat(progress): wire term clock capture + widget factory`

## Gates (run in order in the worktree, per gates.yml)

1. `bunx tsc --noEmit` (strict).
2. `bun test` (full suite; EV-8 file unmodified + green).
3. `python3 council/validate.py` → `All council artifacts valid`.
4. Confirm the real-data import smoke relevant to this card (validate.py is the
   board-discipline gate; pi-council has no PLN import).

Open a PR against main (branch `feat/ev9-inline-progress`); document gate output
in the report. Never touch the board/card files unless already correct.