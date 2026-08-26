# EV-8 ruling — product-owner (binding)

This resolves the three open-judgment items the consolidator routed out of
the engineering loop on EV-8: the **delivery model** (editor-driven vs
setFocus-derived), the **swallow-vs-forward policy** for tree-internal
non-nav keys (O7), and the **designer's taste set** (label wording,
keymap mechanism, j/k aliasing, ▌ glyph).

EV-8's observable contract (per `council/cards/EV-8.md` goal) is identical
regardless of model choice. The ruling selects the robustness + simplicity
winner on facts the deliberation and Phase 1 rulings already produced.

This ruling does NOT touch EPIC-2 Phase 1 rulings (EV-7 last-activity copy,
OV-1 coexist, OV-2 RPC scope) and does NOT reopen any item the
consolidator's synthesis marked as settled.

## Ruling 1 — Delivery model: editor-driven

**The editor stays the sole always-focused TUI component permanently.**
"Tree focus" is `controller.surface` state. **No `setFocus(widget)`.**

Concretely: a `CustomEditor` subclass via `setEditorComponent` (composing
over `getEditorComponent()` per Skeptic O4) overrides `handleInput`. On
Down from the editor, when the cursor is on the last logical line (O5
predicate `getCursor().line >= getLines().length - 1`) and tree is open,
the override sets `controller.surface = "tree"`, consumes that Down (no
`super.handleInput`), and requests a render. While
`controller.surface === "tree"`, the override routes the handled set
(Up/Down/Enter/Escape) internally and calls `super.handleInput(data)` for
everything else (Ruling 2). Up-on-row0 + Escape reset
`controller.surface = "editor"`. No `onTerminalInput`. Below-editor widget
stays render-only/passive (settled).

### Why editor-driven over setFocus-derived

1. **EV-9's Phase 1 ruling dissolves principal's strongest argument.**
   `council/cards/EV-9.md` §"Phase 1 rulings" (binding for the run, applied
   before EV-8 entered deliberation) has settled that progress renders
   **inline as an expansion of the tree panel's region**, not as the
   current modal overlay. The "overlay preFocus" /
   `overlayFocusRestore` path that principal's R2 framed as the
   discriminator is moot: there is no modal for the tree to "return to"
   from — the tree stays visible above the inline progress; collapse
   returns to the same highlighted row by local state preservation.

2. **Skeptic O3 (closed-red) cuts against setFocus-derived on a hard
   fact axis.** Non-overlay extension dialogs
   (`extensionSelector`/`extensionInput`/`extensionEditor` at
   `interactive-mode.js:1988/2040/2070`) close via
   `dismissDialog → setFocus(this.editor)` ignoring `preFocus`, stealing
   focus from a `setFocus(widget)`'d tree widget. Editor-driven is
   structurally immune (the editor never leaves focus). SetFocus-derived
   must defensively re-grab focus on every dialog-close event — narrow per
   Skeptic ("rare extension-dialog interactions"), but real.

3. **Single source of truth.** In editor-driven, `controller.surface` is
   the SOLE arbiter of routing because the TUI's focused pointer is
   always `editor` and never enters the tree-focus question. There is no
   second owner to desync from. The "parallel flag is the failure mode"
   argument (principal R2) cuts against setFocus-derived: when the TUI's
   `setFocus(this.editor)` writes to `focusedComponent` during an O3
   dialog close, `widget.focused` becomes false without any
   controller-side update — exactly the desync the principal warned of.

4. **Simpler implementation.** One `handleInput` override. No `Focusable`
   interface on the widget. No `widget.handleInput` dispatch path. No
   re-grab-on-dialog-close. No `preFocus` machinery for the EV-9 inline
   expansion.

### Options rejected

- **SetFocus-derived (principal's position):** principal's overlay-
  preFocus argument is moot under EV-9's Phase 1 settlement (no modal).
  O3 closed-red is structural; the implementation must defensively
  re-grab focus on every non-overlay dialog close. Adds `Focusable` +
  `widget.handleInput` + re-grab machinery. Rejected.
- **A compromised design that splits scope (editor for entry, setFocus
  for widget-internal):** per the open-judgment discipline, splitting a
  genuine disagreement into two pieces is "picking a winner and calling
  it a compromise," not a ruling. Both surfaces need a single delivery
  point.

### Reversibility

Medium. Swapping to setFocus-derived requires re-implementing the
dispatch path (`Focusable` on the widget, `widget.handleInput`,
defensive re-grab on dialog close, `controller.surface` becomes derived
from `widget.focused`). Observable contract preserved. Cost: a few
hundred lines plus re-running Skeptic verification.

## Ruling 2 — Swallow vs forward: forward-unhandled (O7)

**While `controller.surface === "tree"`, the CustomEditor subclass
override consumes ONLY the handled set (Up/Down/Enter/Escape) and calls
`super.handleInput(data)` for every other key** — printables, ctrl+c,
ctrl+d, PageUp, PageDown, Home, End, Backspace, Tab. The handled set is
explicit and discoverable via EV-7's hint line + EV-8's mode label;
everything else has a safe, defined destination — the editor — instead
of silent failure.

This is the editor-driven analog of "forward unhandled." It is NOT the
same as the designer's R1 "replay" (which was tied to setFocus-derived's
release-focus-then-forward mechanic, since rejected by the designer in
R2 per consolidator §"SETTLED"). In editor-driven, forward-unhandled is
structurally trivial: the override calls `super.handleInput(data)` for
everything outside the handled set; there is no focus to release
because the editor never left focus. The mode label stays `TREE`
throughout (the signifier does not flip mid-flow).

### Why forward-unhandled over swallow-all

1. **The card's intent explicitly requires it.** `council/cards/EV-8.md`
   Intent: "while the tree holds focus, arrow keys must not corrupt
   editor content, **and keys the tree does not handle must have safe,
   defined behavior**." Silent swallow makes unhandled keys vanish —
   undefined behavior per the card's own criterion. Forward-unhandled
   makes them land in the editor — defined behavior with a recoverable
   destination.

2. **ctrl+c is non-negotiable.** The operator must be able to interrupt
   a runaway job regardless of focus state. Swallow-all strands the
   operator (must first exit the tree via Escape / Up on row 0 before
   sending the kill signal). Forward-unhandled delivers ctrl+c to the
   editor immediately.

3. **Discoverability is satisfied by EV-7's hint line + EV-8's mode
   label.** EV-7's settled hint line
   (`up/down move · enter view · /council-tree to close`, from
   `council/cards/EV-7.md` Round 2 consolidator) plus EV-8's mode label
   (`-- TREE --`) discloses the handled set. No new keymap surface is
   needed.

4. **The designer's R2 "replay contradicts the signifier" argument is too
   strict and does not apply here.** The signifier (mode label `TREE`)
   names the handled set, not a promise that nothing else works. The
   contract is layered: "tree owns X; unhandled keys go to the editor
   safely." This is the vim NORMAL/INSERT analog — letters don't insert
   in NORMAL mode, but they don't silently vanish either; they have a
   defined response (in vim, beep; in pi, forward to the editor where
   they're either inserted or consumed by editor commands).
   Critically, the editor-driven "don't consume → super.handleInput" is
   structurally different from the setFocus-derived "release focus →
   forward key" mechanic the designer actually rejected in R2 — in
   editor-driven, `controller.surface` stays `tree` throughout, so the
   mode label does not flip and there is no contradiction to observe.

### Options rejected

- **Swallow-all (owner + designer R2 position):** undefined behavior for
  unhandled keys (silent vanish); ctrl+c stranded until the operator
  exits the tree first; discoverability burden is real but moot under
  the hint-line + forward-unhandled combination.
- **Hybrid (swallow handled set + release-and-regrab on unrecognized
  ctrl-sequences):** reinvents release-and-forward logic in a less clean
  form; forward-unhandled achieves the same end state with simpler
  semantics and no focus-management surface.

### Reversibility

Low. The override is one switch statement; flipping to swallow-all is a
one-line change (omit the `else super.handleInput(data)` branch). No
interface changes.

## Ruling 3 — Taste set: endorsed with constraints

| Item | Ruling | Basis |
|---|---|---|
| Mode-label wording | **Hard rule: `-- TREE --` style** (vim `-- INSERT --` precedent) | Designer's R2 (the converged taste position; `vault/raw/2026-08-26-design-ev8.md` first-pass `INSERT`/`TREE` is superseded). Label reads from `controller.surface` (single source of truth per Ruling 1). |
| Keymap mechanism | **No new mechanism** | Question mooted under Ruling 2 (forward-unhandled makes discoverability trivial). EV-7 hint line + EV-8 mode label disclose the handled set; unhandled keys have a defined destination (the editor). The "persistent footer vs first-idle overlay vs ?-help" taste item does not apply. |
| j/k aliasing | **Delegated to designer: defaults to no** | No grounded case for the addition; explicit aliases would add state + surface area without clear value. Per `vault/wiki/designer.md` "Preferences, ranked last" convention, taste that no constraint binds stays with the designer; the designer's R2 preference is no. |
| ▌ glyph | **Hard rule: U+258C** | Designer's preference (`vault/raw/2026-08-26-design-ev8.md`); no other seat objected. Renders as one column even at narrow widths; no direction connotation; selected-row signifier per design. |

### Reversibility

Trivial. Copy and glyph changes are one-liners.

## Open objections to carry forward to step 9

These are NOT new rulings — the consolidator's synthesis already carried
them. The implementation must close them at step 9.

- **O3 closed-red** (extension dialog focus steal): editor-driven is
  structurally immune. Step 9 must close as `closed-green` by
  demonstrating the editor-driven test harness never exhibits the bug
  under simulated extension-dialog close.
- **O4 closed-red** (setEditorComponent global slot): applies to BOTH
  models. Implementation must compose over `getEditorComponent()` (not
  clobber); a second editor-wrapping extension must not break EV-8. New
  test: prior getEditorComponent composition survives.
- **O6 open-untested** (sessionId-keyed selection stability): tested
  once selection is implemented in EV-8.

## Grounding summary

| Source | Used for |
|---|---|
| `council/cards/EV-8.md` (goal, intent, acceptance) | Card's observable contract; "safe, defined behavior" criterion for OJ-2. |
| `council/cards/EV-9.md` §"Phase 1 rulings" (binding) | EV-9's inline progress expansion dissolves principal's overlay-preFocus argument (Ruling 1). |
| `council/cards/EV-7.md` (Round 2 consolidator / done) | EV-7's hint line is the discoverability surface (Ruling 2); EV-7's below-editor widget stays render-only/passive (Ruling 1). |
| `vault/raw/2026-08-26-design-ev8.md` | Designer's first-pass preferences (▌ glyph, R2 vim convention for label); R2 consume-vs-replay concession cited to distinguish the editor-driven "don't consume → super.handleInput" from the setFocus-derived "release+forward" mechanic the designer rejected. |
| `vault/wiki/product-owner.md` | Role, scope (card-level, not portfolio), reversibility standard. |
| `vault/wiki/designer.md` | "Preferences, ranked last" taste convention; not over-ruling taste where no constraint binds (Ruling 3). |
| `vault/wiki/skeptic.md` | `closed-red` / `closed-green` / `open-untested` evidence terms (O3 fact axis, Ruling 1). |
| EPIC-2 Phase 1 rulings (binding, immutable) | Last-activity copy delegates to designer; OV-1/OV-2 do not cover delivery-model concerns; this ruling does NOT touch them. |

Neither the wiki nor the board history speaks to the **specific** choice
of editor-driven over setFocus-derived — the delivery-model question is
genuinely open, settled only by this ruling. The reversibility standard
applied: editor-driven wins on simplicity + O3 immunity; setFocus-derived
is the more invasive fallback if editor-driven proves to have a hidden
cost.

## Summary

| Question | Ruling |
|---|---|
| OJ-1 delivery model | **editor-driven** (CustomEditor subclass via setEditorComponent composing over getEditorComponent; controller.surface sole arbiter; no setFocus(widget)) |
| OJ-2 swallow vs forward | **forward-unhandled** (consume handled set only; super.handleInput(data) for everything else, including ctrl+c) |
| OJ-3 taste set | **endorsed with constraints** — `-- TREE --` label (hard rule), no keymap mechanism (mooted), j/k defaults to no (delegated), ▌ U+258C (hard rule) |

The card's observable contract is identical regardless of model choice;
this ruling selects the robustness + simplicity winner. EV-9's Phase 1
ruling (inline progress expansion, not modal) makes principal's
overlay-focus argument moot; O3's focus-steal fact makes editor-driven
the robust delivery choice; the card's intent ("safe, defined behavior")
makes forward-unhandled the correct swallow-vs-forward policy. The
designer's taste items are honored where no constraint binds and
superseded only where forward-unhandled makes the question moot or
where a vim-precedent argument carries the day.