---
id: EV-8
title: Bidirectional arrow-key focus navigation between the input bar and the inline tree
state: Deliberating
owner: null
epic: EPIC-2
goal: While the inline tree is visible, pressing down from the focused input bar moves keyboard focus into the tree, up and down move the highlighted selection across rows, and pressing up on the topmost row returns focus to the input bar
---

## Intent

The inline panel from EV-7 must be navigable without leaving the
keyboard's home row, and focus must move cleanly between pi's input
editor and the tree. Contract: with the input bar focused, down moves
focus into the tree; up/down then move a visible highlight across the
tree rows (the tree already keeps the selection on screen when the
panel is shorter than the tree); pressing up on the topmost row
returns focus to the input bar.

User-visible surfaces: the highlighted row state in the panel, and a
clear indication of which surface owns the keyboard (input bar versus
tree) so a driver is never typing into the wrong place — the designer
seat decides the affordance. Text being typed while the input bar is
focused must stay in the editor; while the tree holds focus, arrow
keys must not corrupt editor content, and keys the tree does not
handle must have safe, defined behavior.

Open deliberation points, deliberately left to the council and
designer rather than blocking this card: how keys are routed out of
the editor (pi's CustomEditor/setEditorComponent pattern versus
whatever input channel a below-editor widget can receive — the
council investigates what pi's TUI actually delivers), and the
multi-line rule (for example, down enters the tree only when the
cursor cannot move further down inside a multi-line draft). The
observable contract above is what the judge verifies.

Depends on EV-7 landing first.

## Acceptance

- Interactive walkthrough: focus on the input bar, down enters the tree,
  up/down cycle rows, up on the top row puts the caret back in the input
  bar, and typing after the return lands in the editor.
- The selected row is visually distinct while the tree holds focus, and
  focus ownership is unambiguous.
- Automated tests cover the focus/state machine (down/up transitions and
  selection movement) at the component level; `bun test` passes.

## Deliberation record

Step 1 gate: full council, surface-touching (designer seated).

### Round 1 (independent first pass)

**owner:** Verified in installed pi source: below-editor widgets are **render-only**
— `setWidget` stores to `extensionWidgetsBelow`, `renderWidgetContainer` only addChilds
; they are never added to the focus chain and a widget's `handleInput` is never
invoked. A below-editor widget cannot own the keyboard. The only channels that see
keystrokes are (a) the focused component's `handleInput` (editor, or a
`ctx.ui.custom` overlay) and (b) `onTerminalInput`, a TUI-level pre-consumer
(`handleTerminalInput`: listeners run first, may return `{consume:true}` to abort
or `{data:X}` to remap; only unconsumed reaches `focusedComponent.handleInput`).
Multi-line constraint: `cursorDown` is never a no-op — on last visual line it moves
to line-end, in history it history-forwards; `getCursor()`→`{line,col}` and
`getLines()` (0-based logical) are public, `isOnLastVisualLine`/`historyIndex` are
private. **Recommended (hybrid, no overlay):** 1) CustomEditor wrapper via
`setEditorComponent` for the exit-from-editor gate — override `handleInput` for
`Key.down` only; if tree open && surface!=tree && multi-line rule → set
surface=tree, consume that Down (no `super.handleInput`), requestRender; else
`super.handleInput(data)` always; compose over any existing custom editor via
`getEditorComponent()`. 2) `onTerminalInput` pre-consumer owns tree→editor and
tree-internal directions, registered once for the session; policy is one pure fn
`(data, surface, rowCount)`: surface==tree → consume all keys (up/down move
selected, up-on-row0 → editor consuming that up, escape → editor, **every other key
`{consume:true}`** — safe no-op, never lands in editor); surface==editor → undefined.
3) Shared controller `{surface, selected, open}` read/written by editor wrapper +
input handler + widget.render (EV-7 widget has no selected/highlight — EV-8 adds it).
4) close/teardown resets surface=editor. Why not `custom` overlay: it receives input
but is the modal EV-7 removed; reserve for EV-9 transcript — but opening any custom
overlay must release tree focus or the pre-consumer hijacks its keys. Focus
ownership: editor is and stays the real focused component; tree focus is a privilege
enforced by the pre-consumer consuming. Return to editor is zero-cost. Multi-line:
`shouldEnterTreeOnDown` true when `getCursor().line >= getLines().length - 1`
(logical; single-line → always true; matches card's "cannot move further down").
Accepted: while tree open Down is reserved (down-to-line-end / down-forward-history
lost; End/Up work); logical not wrapped-visual lines (minor wrap-edge accepted).
Testable claims: (1) shouldEnterTreeOnDown single-line→true / 3-line
line-0→false / last-line→true; (2) TreeFocus state machine — surface starts editor,
enter()→tree selected=0, down 0→1, down-at-last stays (no wrap), up-on-row0 →editor
+ reset selected; (3) routeTreeKey surface==tree consumes up/down/enter/escape AND
printable "x"; surface==editor returns undefined; (4) close-with-focus resets
surface=editor, pre-consumer returns undefined; (5) overlay-release sets
surface=editor; (6) editor getCursor()/getLines() are the wrapped pins.

**principal (independent):** **Reframe: the seam is focus-pointer ownership and
derivation, not key delivery.** Verified: `setWidget` belowEditor is render-only —
`renderWidgetContainer` only addChild(component), no setFocus anywhere in that path;
handleTerminalInput routes only to `focusedComponent.handleInput` — widget handleInput
is dead code today. The editor is re-set focused on ~a dozen paths. **The only way to
get the inline widget keys is to make it the TUI's focused pointer** — `setFocus` is
public, factory receives `tui`, Editor stores `tui` protected — both hold the handle.
**`Focusable` is the authoritative focus signal for free**: setFocusInternal sets
focused true/false on any Focusable. editor→tree = CustomEditor subclass instaed via
setEditorComponent from session_start; `setCustomEditorComponent` is a **global
last-writes-wins single slot** — EV-8 claims it for the whole session; any other
editor-wrapping extension clobbers or is clobbered. **`onTerminalInput` is
focus-blind and editor-blind** — fires before overlay-focus resolution and before the
focused component, on every key including while modals are open; can consume but has
no tui handle and can't see editor cursor state without reaching in. Card's
parenthetical "tree stays on screen" is **wrong for the surface**: true of the modal
`CouncilTree` (selection+windowing) — the inline `CouncilTreeWidget` has no
selection/windowing, caps at 9+1 hint with `...more`, and **sorts running-first** —
selection lives in the sorted/capped view which the 2s refresh re-sorts under the
user. Blind spots named: (navigator can't see setFocus is public + Focusable delivers
focus-notification → will add handleInput to widget and expect pi to call it — never
will; fix is point pi's focused pointer at the widget); (editor-wrapper can't see pi's
focus-reset paths → keeps a parallel flag that desyncs on dialog close; can't see the
editor slot is a global singleton); (runs/tree can't see running-first sort reorders
mid-session → **selection should keyed by sessionId, not index**); (modal slice's
overlay-only focus machinery doesn't compose with belowEditor). **Vehicle:**
editor→widget = CustomEditor subclass (fires while editor-focused only);
widget→editor + widget-internal = direct `setFocus(...)` coordinated through a shared
controller holding the two refs. **Reject onTerminalInput.** Ownership must be
**derived not stored**: tree widget implements **Focusable**; highlight only when
focused===true; single source of truth = TUI's focused pointer; a parallel boolean is
the failure mode. Lifetime: editor per-session, widget per-toggle; resetExtensionUI
disposes widget with telling the navigator; controller clears stale treeWidget ref in
dispose() + forces focus back to editor. **Multi-line rule:** (a) single-only
(violates card); (b) logical-line approx (`getCursor().line === getLines().length - 1`)
matches card, only graft word-wrap edge; **(recommend b)**, document wrap-edge,
record exact `isOnLastVisualLine` (private) as follow-up; (c) exact = upstream
pi-tui change out of scope. **Testable claims:** (1) pin current contract: fake tui
focusedComponent=editor → widget handleInput never called; after setFocus(widget) →
called. (2) Down-at-bottom enters only when cursor == last logical line. (3)
Up-at-top returns focus. (4) selection keyed by sessionId survives refresh reorder.
(5) ownership derived through Focusable — setFocus(widget) → focused true + highlight
; setFocus(editor) → false. (6) editor slot not clobbered; typing after return lands
in editor.

**designer:** Design position written to `vault/raw/2026-08-26-design-ev8.md`. The
cleanest shape borrows pi's vim modal-editor pattern (CustomEditor subclass, Pattern
7 in tui.md): expose new state on the **editor's own bottom border** — ` INSERT `/` TREE `
mode label in the same place vim puts NORMAL/INSERT (simple: new sklearn) — and a
single-cell **`▌` indicator** prefixed to the highlighted row in the panel below.
The widget stays passive/display-only, with its selection driven by the editor
forwarding arrows through a single pipe. Gulf closed: a driver scanning the panel has
no way to know whether keys land in the editor or the tree (info lives off-screen in
focus machinery); this exposes it on the editor border (where vim puts NORMAL/INSERT)
and the highlighted row. Knowledge in the world: `NORMAL`/`INSERT` is a learned
convention; put the rule on the screen. Signifier not affordance: pi's TUI does not
give `setFocus` for belowEditor widgets (VStraat only ever setFocus(editor)); whatever
focus is displayed is therefore **symbolic**, applied at render. Both border label and▌
mapper to the same boolean state. Mapping: editor border ↔ panel highlight. Multi-line
rule — **derive, do not redefine**: the editor owns `isOnFirstVisualLine()`/`isLastVisualLine()`
(`tui.editor.cursorUp`/cursorDown branch); Down steals only on the last visual line,
Up only on the first; a single-line draft sits on both at once, so the rule covers
single- and multi-line with zero heuristic — "there is only one rule." Safe default:
**any unhandled key while tree holds focus releases focus and replays the key into
the editor** — a stray letter lands in the editor buffer to drop, converting most
mistakes into recoverable slips. Forcing function: Enter opens the heavy transcript
modal (existing onOpen) and does NOT return focus to the editor — the one case where
the tree intentionally keeps focus. **Falsifiable predictions — rendering (testable
by CDP smoke / pure-seam test under test/ev8-*.test.ts):** R1 `▌` appears iff
focus-owned===true on the highlighted row only; visible-width diff exactly +1 column.
R2 editor's last visual border line ends with ` INSERT ` or ` TREE ` (8 trailing
cells), where vim puts its mode. R3 no new theme tokens — only existing accent/dim
etc from documented palette. R4 MAX_WIDGET_LINES=10 unchanged; marker never pushes a
row over budget. R5 the widget is NOT a Focusable and never receives input directly
from the TUI runtime — driven by the editor; verified by asserting setFocus(widget)
does not deliver keys. **Comprehension (judgment — routed to a human read):** C1 first
visitor can land, press Down, see▌+` TREE ` together, infer the row is their target
(the 2s refresh of the resort under a settled seat). C2 when not tree-focused, no row
decoration changes across the 2s refresh tick. C3 Esc releases focus (vim normal Esc
mirror). C4 multi-law rule: cursor-down wins until cursor on last visual line — read
from absence of any Key.down call site outside isOnLastVisualLine. **Preferences,
ranked last (taste, not grounded):** prefer `▌` (U+258C) over ▶/→/◆; prefer
` INSERT ` / ` TREE ` on the bottom border in-frame, vim-style, over a separate status
row.
### Round 2 (bounded exchange)

**owner (R2):** Settled mechanics against installed pi source: renderWidgetContainer is render-only (addChild, no setFocus in widget path — confirms principal 1); handleTerminalInput routes only to focusedComponent.handleInput (widget handleInput fires iff it is the TUI's focused pointer); **setFocus(component) is public and setFocusInternal sets .focused on any Focusable — it DOES deliver keys to a belowEditor widget** (falsifies designer R5); **isOnLastVisualLine/isOnFirstVisualLine are private** on pi-tui Editor — a CustomEditor subclass can't read them — log-book calc (owner accepts vs principal). Focus churn is real (~12 setFocus(editor) paths on dialog/modal/reload — event-driven, not per-key). **CONCEDES principal's rejection of onTerminalInput as a primary channel** (right: fires pre-overlay every key, focus-blind, global). Accepts selection keyed by sessionId. **Parts from principal on making the tree the TUI's focused pointer**: in the tree-owned model, the ~12 setFocus(editor) paths (or modal preFocus) can steal focus mid-nav, and controller.surface (still "tree") desyncs from focusedComponent (editor) — the "parallel flag is the failure mode" cuts the other way: it's only a desync risk when TUI focus is a second arbiter. In the editor-driven model the editor is ALWAYS focused → controller surface is the SOLE arbiter of state TUI deliberately doesn't manage; no second owner, no race. Observable contract identical either way; editor-driven wins on robustness: single delivery point (one handleInput override), immune to the 12 focus-reset paths for free, return-to-editor zero-cost (editor never left). Architectures: editor-driven model collapses designer's "replay unhandled" into just don't-consume→super.handleInput (no replay machinery, editor already the destination). With the editor always focused, the tree-internal non-nav key gate must SWALLOW (not forward) while surface==tree so arrows never corrupt a multi-line draft, stray letters are safe super-drops. Hazard both seats should note: **setEditorComponent is a global last-writer-wins single slot — EV-8 must compose over getEditorComponent() rather than replace it**, or any other editor-wrapping extension is clobbered (coupling risk of the EV-7-then-EV-8 pairing). Approach: below-editor widget stays passive; input delivery = CustomEditor subclass via setEditorComponent composing over getEditorComponent(); editor stays the TUI focused component permanently; Down on last logical line → surface=tree, consume; while surface==tree override routes up/down/enter/escape to tree, swallows or super-drops unhandled; up-on-row0/escape → surface=editor. No onTerminalInput, no setFocus(widget). Selection keyed by sessionId. Multi-line = logical-line approx, wrap-edge documented, exact isOnLastVisualLine recorded as follow-up. Green-lights designer's affordance once it reads controller.surface. **Testable claims:** (1) fake TUI focusedComponent=editor → widget.handleInput never called; after tui.setFocus(widget) it IS called (settles focus-delivery viability; falsifies designer R5). (2) Churn: injected tui.setFocus(editor) after tree has focus → next Down reaches editor not tree (fails editor-driven, passes tree-owned-without-regrab). (3) Multi-line shouldEnterTreeOnDown. (4) State machine. (5) sessionId identity survives re-sort/refresh. (6) Composition over getEditorComponent preserves inner handleInput.

**principal (R2):** Settled by evidence: input pipeline is terminal → inputListeners → overlay-focus resolution → focusedComponent.handleInput (tui.js:553-631). (1) setFocus(component) is on the PUBLIC TUI interface; TuiBase.setFocusInternal assigns focusedComponent and flips .focused on anything passing isFocusable — **no internal-component guard**; the tui handed to the widget factory is this same object. (2) The "editor re-focused on a dozen paths" claim is true but **event-driven, never per-key** — every setFocus(this.editor) site is a dialog open/close/custom-editor swap/reload/invalidation; none is in the keystroke loop; in steady state setFocus(widget) delivers keys to widget.handleInput and keeps them until something calls setFocus. (3) onTerminalInput is ui.addInputListener — pre-consumer before focus resolution, focus-blind by construction. Owner's blind spot: because the editor stays the real focused component, TUI's overlayFocusRestore never learns the tree held focus → designer's enter→transcript→esc→back-to-tree intent: preFocus is the editor, closing the transcript drops to editor — **owner's vehicle silently breaks designer's C4 flow**. Designer's blind spot: correct that pi never invokes setFocus on a belowEditor widget; wrong that focus is therefore symbolic — setFocus is a public primitive the extension can call; R5 "setFocus(widget) does not deliver keys" fails on the first line of handleTerminalInput routing. Principal admits its own R1 blind spot (framed re-focus as per-key fragility; corrected: all re-focuses event-driven, steady-state setFocus(widget) robust, fragility only at lifecycle boundary). **Reframe: stop litigating the key channel — setFocus(widget)+Focusable is the delivery vehicle; ownership DERIVED (widget.focused is the single source of truth set by the TUI), not a parallel surface boolean.** Remaining seams: (1) global editor slot — compose-over-getEditorComponent only protects against PRIOR editors. (2) selection keyed by sessionId. (3) dispose/reset handoff — resetExtensionUI → clearExtensionWidgets → widget.dispose() + setCustomEditorComponent(undefined) with no re-focus; navigator's dispose() hook IS reliably called on close/reopen, so controller clears stale ref + setFocus(editor) there. **Design shape**: CustomEditor subclass for entry only (Key.down when tree open && cursor==last logical line → consume, setFocus(widget), requestRender); widget implements Component+Focusable with handleInput for up/down/up-on-row0/escape/enter; **any unhandled key releases focus and forwards that key to editor.handleInput(data)** — makes designer's safe-default real, gives widget a finite forward-list (ctrl+c/ctrl+d work while tree-focused); designer's enter→transcript→back works for free (overlay preFocus is the widget, hideOverlay restores tree focus). **Verdicts:** delivery vehicle = setFocus(widget) (settled, tui.js:623-631); onTerminalInput is a pre-consumer, not the delivery. Ownership derived via Focusable, not symbolic. setFocus(widget) feasible/public, robust in steady state. isOnLastVisualLine/isOnFirstVisualLine are **private** in editor.d.ts — designer's "usable" claim wrong; reachable predicate = getCursor().line === getLines().length-1 (logical-line approx); record exact visual predicate as upstream request. **Testable claims:** (1) delivery pin — fake tui focusedComponent=editor, widget handleInput spied, setFocus(widget), feed "\x1b[B" → widget.handleInput called, editor.handleInput NOT called, widget.focused===true. (2) no per-key re-focus — N consecutive keys all to widget.handleInput, zero setFocus to editor inside handleTerminalInput. (3) focus-derived not stored. (4) enter→transcript→back — open overlay while widget focused, close, focusedComponent restored to widget. (5) selection survives re-sort. (6) multi-line gate. (7) dispose handoff — close/reopen via setWidget(undefined) → dispose fired, controller widgetRef cleared, focus forced editor. Amendment: treat surface as DERIVABLE from widget.focused not stored; answer the global-editor-slot collision explicitly before the judge.

**designer (R2):** Concedes consume-vs-replay to owner — replay contradicts the mode signifier (border reads TREE while letters flow to editor = self-undermining promise; contradiction is what feedback principles punish). Consume-all is the right contract ONLY IF the tree publishes a discoverable keymap — silent consume strands the operator. Concedes the state-source question to principal (and owner): the border label + ▌ must read from a single ground-truth pointer (tui.getFocus() in principal's model / the consumption-guard in owner's), so the signifier cannot drift from the action. **Corrects its R1 exit set: Down-only-exits fails on any tree taller than one row; minimum set = Down-on-lastRow + Up-on-row0 + Esc.** Gulf closed: evaluation, for the operator, at every keystroke while tree holds focus — the signifier still says TREE and no letter appears in editor (handled/consumed), or the signifier flips to INSERT and the letter is in the editor. Principle: signifier-action coherence (the border label is a promise about where input lands; must read from the same source that decides handling); forcing function over recovery (the card criterion is "never typing in the wrong place" — consume structurally prevents it; replay is a recovery path for a failure the contract says must not occur); knowledge-in-the-world (silent consume without a discoverable keymap moves vocabulary into the user's head — must publish bindings); error-tolerance for exits (Up-on-row0 + Esc are what any user tries first; none may fail silently); multi-line rule sides with owner against principal — getCursor().line >= getLines().length-1 is a public predicate that survives refactors; isOnLastVisualLine is private API; the wrap-edge is one row of dead keys, recoverable with Esc. **Falsifiable predictions (pure-seam tests, TUI not CDP):** (1) unmapped printable letter while TREE mode → editor buffer unchanged, label still TREE, keymap visible without further action (falsified if letter appears in editor / label flips to INSERT / no keymap shown). (2) row-0 Up → focus to editor, caret at pre-tree state. (3) any-where Esc → focus to editor immediately, caret unchanged. (4) last-row Down → focus to editor, caret unchanged. (5) label/marker/handler single-source-of-truth — no observable frame where any two disagree (label TREE while ▌ on editor, or vice versa, or flicker). (6) multi-line false-positive floor — single-line wrapped last visual line Down-on-lastRow returns to editor rather than re-entering tree at row 0. Preferences (taste): label wording (TREE vs -- TREE -- vs [TREE]) — vim's -- INSERT -- is the only convention worth borrowing; keymap mechanism (persistent footer vs first-idle overlay vs ?-help) — first-idle least intrusive but adds state, footer costs a row; whether j/k alias Down/Up in tree — taste, defaults to no; ▌ glyph — U+258C correct (half-block sits on baseline), U+25AE/U+2588 louder, read as selected-row.

### Step 4 — Skeptic attacks and runs tests

Verified against installed source (tui.d.ts/tui.js, interactive-mode.js, editor.d.ts/js, custom-editor.d.ts/js, navigator.ts, ev7 test).

- **O1 closed-green:** `setFocus(component)` is public; `handleTerminalInput` dispatches unconditionally to `this.focusedComponent.handleInput`; a belowEditor widget (in extensionWidgetsBelow) is mounted and reachable via `isComponentMounted` walking Container trees. setFocus(widget) DOES deliver keys. Designer R5 ("setFocus(widget) does not deliver keys") is falsified by source.
- **O2 closed-green:** enumerated all 11 `setFocus(this.editor)` sites in interactive-mode.js — all event-driven (session_start, dialog/selector closes, extension-editor close, reload); `handleTerminalInput` never calls setFocus. Widget keeps focus in steady state.
- **O3 closed-red:** non-overlay extension dialogs (`extensionSelector`/`extensionInput`/`extensionEditor` at 1988/2040/2070) close via `dismissDialog` → `setFocus(this.editor)` directly, ignoring `preFocus`. If one fires while a setFocus'd tree widget is focused, focus is stolen to editor. Real but narrow (rare extension-dialog interactions). — This bites the setFocus-derived model specifically; the editor-driven model (editor stays focused) is immune.
- **O4 closed-red:** `setCustomEditorComponent` stores a single factory slot (last-writer-wins, no chain); `getEditorComponent()` returns it; a CustomEditor subclass is the editor itself, not a decorator. Two extensions both registering via setEditorComponent clobber each other; composing is not naturally supported. Applies to BOTH models (both use setEditorComponent). Both seats flagged in R2.
- **O5 closed-green:** `getCursor()`/`getLines()` public; `isOnLastVisualLine` private. Logical gate `line >= lines.length-1`: single-line→true, 3-line line-0→false, last-line→true. Wrap-edge documented trade-off.
- **O6 open-untested:** sessionId-keyed selection stability — cannot test until selection is implemented (EV-8 adds it; current widget has none). Sound design guidance.
- **O7 open-untested:** swallow-all vs forward-unhandled — pure design judgment, no test discriminates "better."

**Verdict: no open objections block the card.** O3 and O4 are real engineering concerns the implementation must address (manageable, not blockers). O6/O7 are design decisions for step 6.

### Step 5 — Synthesis (consolidator)

**SETTLED (spec may assume):** below-editor widget stays render-only/passive (never
in focus chain); setFocus(widget) DOES deliver keys (O1 closed-green, designer
R1/R5 falsified); onTerminalInput rejected as the delivery channel (owner
conceded in R2); entry seam = CustomEditor subclass via setEditorComponent;
multi-line rule = logical-line predicate getCursor().line >= getLines().length-1
(isOnLastVisualLine private); selection keyed by sessionId not index; entry
gate = Down-from-input on last logical line; exit set = Down-on-last-row +
Up-on-row0 + Esc; affordance = editor bottom-border mode label ( INSERT / TREE )
+ single-cell ▌ marker, both reading one ground-truth source (designer authored,
owner green-lit). Consume-vs-replay settled within the signifier argument
(designer conceded replay to owner — replay contradicts the mode label); residual
swallow-vs-forward remains open.

**OPEN JUDGMENT (route at step 6 — product-owner, escalating to steward):** (1)
The delivery model itself — editor-driven (owner: editor stays sole always-focused
component, 'tree focus' is controller.surface state, NO setFocus, immune to
focus-steal, return-to-editor zero-cost) vs setFocus-derived (principal:
widget implements Focusable, ownership derived from widget.focused, no parallel
boolean, unhandled key releases+forwards to editor, enter→transcript→back flow
works because overlay preFocus is the widget). No test settles which robustness
model wins; the record gives each side one fact axis and neither closes the other
(O3 favors editor-driven on the focus-steal axis; 'owner's vehicle breaks
transcript-return flow (designer C4)' favors setFocus-derived on the
return axis); both survived scrutiny — the genuine fissure, no winner. (2)
Swallow-all vs forward-unhandled for tree-internal non-nav keys (O7) — pure
design judgment (owner+designer swallow with the discoverable-keymap caveat;
principal forwards via finite list so ctrl+c/ctrl+d work); entangled with the
delivery model. (3) Taste set (designer, ranked last, not grounded): label
wording, keymap mechanism (footer vs first-idle overlay vs ?-help), j/k aliasing
Down/Up, ▮ glyph choice.

**OPEN OBJECTIONS (must close green at step 9):** O3 closed-red — non-overlay
extension dialogs (extensionSelector/Input/Editor) close via dismissDialog→
setFocus(this.editor) ignoring preFocus, stealing focus from a setFocus'd tree
widget; editor-driven model immune, setFocus-derived vulnerable; narrow per
Skeptic but the implementation must demonstrably handle it. O4 closed-red —
setEditorComponent is a global last-writer-wins single slot; a CustomEditor
subclass is the editor itself not a decorator; two editor-wrapping extensions
clobber each other; composing-over-getEditorComponent only protects against prior
editors — applies to BOTH models, implementation must address composability. O6
open-untested — sessionId-keyed selection stability (test once selection exists).

**Verdict:** not ready to hand to implementation — route the open judgment at step 6
before step 9 can green.

### Step 6 — Route open judgment → product-owner ruling (binding)

The consolidator routed the three open-judgment items (OJ-1 delivery model,
OJ-2 swallow-vs-forward, OJ-3 designer taste set) to `product-owner` at step
6. The product-owner ruling is appended below **verbatim** and is binding on
all seats, `steward` included. The card proceeds to step 7; deliberation is
NOT reopened.

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
### Step 6 verdict

Product-owner ruled on all three open-judgment items (OJ-1 editor-driven
delivery model; OJ-2 forward-unhandled; OJ-3 taste set endorsed with
constraints: `-- TREE --` label, no keymap mechanism, j/k defaults to no,
U+258C). Per the escalation contract, the ruling is applied and the card
proceeds to step 7 — the settled design is written and one owner is
dispatched. No steward escalation was required.
