# EV-9 ruling — product-owner: tiny-regime viewport floor at termRows ≤ 6

This resolves the one open-judgment item the consolidator routed out of the
engineering loop on EV-9: **what the inline progress viewport does in the
band `5 ≤ termRows ≤ 6`, where the two-regime formula's invariants are
mathematically unsatisfiable** (`progress ≥ 1 ∧ progress ≤ avail = max(1, termRows − 5)`
is UNSAT — Skeptic O1 closed-red at `termRows=6`).

This ruling does NOT touch:
- The settled EPIC-2 Phase 1 ruling ("inline progress expansion, not modal").
- The settled R3 two-regime formula at `termRows ≥ 12` (normal regime).
- The settled union widening of `controller.surface` ("`editor` | `tree` | `progress`").
- The settled `backFromProgress` transition (new; never `exit()`).
- The settled render-cache, dual-clock, tree-as-anchor, token-only surface.
- The Skeptic's open objections (O1-fix, O4 activator wiring, O5 refresh path, new-code-green blanket) — those carry forward to step 9.

It also does NOT close the design's upper-bound invariant violation in the
tiny regime at `termRows ∈ {7, 8, 9, 10, 11}` (e.g. the pinned case
`(8,5)→(1,2)` overflows `avail=3`). That is an open objection the consolidator
did not surface and is **the owner's responsibility in the EV-9 spec write**,
not by this ruling.

## Ruling — minimum supported terminal height = 7; below it, Enter is a consumed no-op

**At `termRows ≤ 6`, Enter on a highlighted tree row is consumed as a no-op.**
The `controller.surface` stays on `"tree"`. No progress viewport is allocated.
No separator is rendered. The tree rows remain visible (`treeLines ≥ 1`).
Esc continues to work as the tree's own escape behavior (or, if a progress had
been opened in a prior Enter at sufficient height, the `backFromProgress`
transition).

**The minimum supported terminal height for opening inline progress is
**`7 rows`**.** At `termRows ≥ 7`, the existing two-regime formula runs as
designed.

This is **option (a), silent variant**, pinned to a precise `termRows` cutoff.

### Owner TDD contract (defeat-first)

1. **Add a test** that constructs the inline progress widget with
   `termRows ∈ {5, 6}` and a highlighted tree row, simulates Enter, and
   asserts:
   - `controller.surface === "tree"` (did not transition to `"progress"`).
   - The widget's rendered `lines.length ≤ avail` where `avail = max(1, termRows − 5)`.
   - `treeLines ≥ 1` (tree rows are visible above whatever else renders).
   - No `progress`-key consumption occurred (the progress-key classifier's
     side effects did not fire).
2. **Add a test** that with `termRows = 6` and the existing `ROW_MAX`-bounded
   tiny-regime formula, calling `computeWidgetLayout(6, treeContentLines)`
   for any `treeContentLines` returns a layout where the "open progress"
   branch is unreachable from Enter (e.g. a guard at the call site:
   `if (termRows < 7) return;`).
3. **Add a test** that with `termRows = 7`, the tiny-regime formula runs
   unchanged (regression coverage for the existing pinned case `(8,5)→(1,2)`
   and `(12,8)→(3,3)` — these stay green; this ruling does not change them).
4. The implementation site is **the controller's `enterProgress(sid)`** —
   a single guard `if (termRows < 7) return;` at the top, plus a test
   asserting the no-op semantics above. No new surface value, no new
   transition, no chrome/separator/floor compression.

### Why option (a) over option (b)

1. **The invariant is non-negotiable across all three seats.** R3 convergence
   settles `treeLines + 1 + progressViewport ≤ termRows − CHROME ∧ progress ≥ 1
   ∧ treeLines ≥ 1`. Compressing any of CHROME/SEPARATOR/TREE_FLOOR to make
   `progress ≥ 1` achievable at `termRows = 6` breaks another binding
   constraint: CHROME reduction clips the editor/footer; SEPARATOR reduction
   collapses panel readability; TREE_FLOOR reduction breaks the Phase 1
   ruling ("tree rows stay visible above the progress expansion") and the
   designer's `▌` row signifier.
2. **`progress ≥ 1` is integer; "sub-1 progress band" is incoherent.** A
   progress viewport that renders zero rows is not a viewport. A status-line
   row that names a seat is not a transcript view — it is the
   (a)-variant "single-line overflow indicator," which itself has no room at
   `termRows ≤ 6` (see option (a) variant analysis below).
3. **Platform precedent.** `extensions/navigator.ts:416,651` already enforces
   `termRows = Math.max(10, (tui?.terminal?.rows ?? 24))` for the modal
   transcript viewer — an explicit refusal-to-render at degenerate heights.
   The inline widget with `CHROME = 5` (vs the modal's `4`) is even more
   constrained at small heights. Adopting the same refusal-to-render
   posture is consistent with the existing platform's handling of small
   terminals, not a new doctrine.
4. **User value.** At `termRows ≤ 6` the editor itself is squeezed to 1–2
   rows; the message reserve is gone; the footer is gone. The operator is
   already in a degenerate state. Silent no-op preserves the tree (which
   at least surfaces last-activity rows) and avoids corrupting the layout
   with a half-rendered progress viewport that clips into the editor.
   The "always open something" alternative yields a view that shows one
   fragment of one block of transcript behind a tree that no longer makes
   sense — value-less output that costs the user cognitive load.

### Why the silent variant of (a), not the indicator variant

The (a) indicator variant would replace the tree's existing footer line
("`up/down move · enter view · /council-tree to close`") with a dim
overflow line ("`progress unavailable · resize terminal to ≥7 rows · esc back`")
for the duration of the Enter-press state. **At `termRows = 6` even this
variant violates the upper bound**: `treeLines (≥1) + footer (1) = 2 >
avail = max(1, 6−5) = 1`. The footer slot is part of the tree's render,
not a separate progress row — replacing it with an indicator still requires
a row the widget doesn't have.

Two ways out of this: (i) at `termRows ≤ 6`, allow `treeLines = 0` and
dedicate the entire widget slot to the indicator (violates the tree's
existential minimum); (ii) extend the floor to `termRows = 7` so the
indicator variant becomes feasible at `termRows ∈ {7, 8, 9, 10, 11}`.
Neither is the silent variant at `termRows ≤ 6`. The silent variant is
the only behavior that honors both `treeLines ≥ 1` and the upper-bound
invariant at `termRows ≤ 6`.

### Reversibility

Low. The owner-facing change is one guard in `enterProgress(sid)` plus
three tests. To undo (i.e. adopt option (b) later):
- Add a fifth `"degenerate-progress"` surface value (or piggy-back on
  the existing `progress` value with a separate `degenerate: true` flag).
- Implement the indicator rendering for the degenerate state.
- Revisit the chrome/separator/tree-floor compression decision.

Cost: ~4 hours of work plus Skeptic re-verification. Cheaper than
uninstalling option (b) chrome compression (which requires re-deriving
the settled CHROME/SEPARATOR/TREE_FLOOR constants and re-running the
Phase 1 "tree rows stay visible" verification).

### Out of scope but flagged

- **Upper-bound invariant violation at `termRows ∈ {7..11}`**: the formula's
  pinned case `(8,5)→(1,2)` yields `treeLines + sep + progress = 1 + 1 + 2 = 4 >
  avail = max(1, 8−5) = 3`. This violates the settled
  `treeLines + 1 + progress ≤ termRows − CHROME` invariant for any
  `termRows` where the tiny-regime formula yields `progress > avail − tree − 1`.
  The consolidator's synthesis only flagged the lower-bound violation
  (`progress = 0` at `termRows ≤ 6`); the upper-bound violation at
  `termRows ∈ {7..11}` was not surfaced. **The owner must address this
  in the EV-9 spec write** — either by tightening the tiny-regime formula
  (e.g. `progress = max(1, avail − tree − 1)` so the upper bound holds
  by construction) or by formally relaxing the invariant for the tiny
  regime with an explicit clip behavior (one progress row dropped from
  the bottom when the widget overflows). Either way it is **not** this
  ruling's question, and it is **not** the basis for refusing-to-open
  below `termRows = 7` — the lower-bound violation at `termRows ≤ 6`
  stands on its own.
- **No new surface value, no new transition.** This ruling adds zero
  state-machine surface area. The `controller.surface` union stays
  `"editor" | "tree" | "progress"`; `backFromProgress` stays the
  single transition out of `"progress"` (unused at degenerate heights
  because `"progress"` is never entered there).

## Grounding summary

| Source | Used for |
|---|---|
| `council/cards/EV-9.md` (Phase 1 rulings, binding) | "Inline progress expansion, not modal"; "tree rows stay visible above the progress expansion" — forbids TREE_FLOOR compression. |
| `council/cards/EV-9.md` (R3 convergence) | The settled invariant `treeLines + 1 + progress ≤ termRows − CHROME ∧ progress ≥ 1 ∧ treeLines ≥ 1` is the basis for option (a). |
| `council/cards/EV-9.md` (Skeptic O1 closed-red) | The empirical fact that the formula's lower bound is unsatisfiable at `termRows ≤ 6` (progress = 0). |
| `extensions/navigator.ts:416,651` (`Math.max(10, tui.terminal?.rows ?? 24)`) | Platform precedent for refusal-to-render at degenerate terminal heights. The inline widget (chrome 5) is more constrained than the modal (chrome 4), so its platform floor is necessarily ≤ 10. |
| `vault/wiki/product-owner.md` | Role: card-level judgment, not portfolio; reversibility standard. |
| `vault/wiki/skeptic.md` | `closed-red` evidence term for O1 (the unsatisfiable-band fact is not opinion). |

Neither the wiki nor the board history speaks to the **specific choice
of `termRows = 7` as the floor**. That number is the natural breakpoint
because (i) at `termRows = 7` `avail = 2`, the smallest non-trivial tiny
regime value, and (ii) it matches the designer's tiny-regime entry
condition (`avail < 7`). A later ruling could move the floor lower (if
the upper-bound violation in the tiny regime is fixed) or higher (if a
tighter floor is empirically desired). This ruling picks the cheapest
defensible floor: where the formula's design intent begins.

## Summary

| Question | Ruling |
|---|---|
| Behavior at `termRows ≤ 6` | **Enter consumed no-op; surface stays `tree`; tree rows remain visible.** |
| Minimum supported terminal height for inline progress | **`7` rows.** Below 7, Enter degrades silently; at and above 7, the existing formula runs. |
| New surface value / transition added | **None.** Pure guard in `enterProgress(sid)` plus tests. |
| Surface-union widening | **Unchanged.** Stays `"editor" \| "tree" \| "progress"` as settled. |
| Token-only drawing constraint (AGENTS.md 9.6) | **Unchanged.** No new strings emitted; if a later iteration adds an indicator, it must draw from theme tokens. |
| Upper-bound violation at `termRows ∈ {7..11}` | **Not in scope.** Owner addresses in EV-9 spec write. |
