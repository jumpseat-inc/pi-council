---
title: EV-8 Product-Owner Ruling — editor-driven focus
type: source
summary: PO's binding EV-8 ruling: focus stays editor-driven (a CustomEditor composing over getEditorComponent acts as the sole delivery point, controller.surface the single arbiter — no setFocus), keys forward-unhandled (ctrl+c survives), and the designer taste set is endorsed with constraints.
aliases: [po-ev8-ruling]
tags: [pi-council/source]
sources: ["[[2026-08-26-po-ev8-ruling]]"]
created: 2026-08-26
updated: 2026-08-26
---

The binding product-owner ruling that resolves EV-8's three open-judgment
items (delivery model, swallow-vs-forward, designer taste set). It is a
card-level ruling — no portfolio change, no steward escalation — and is
binding on all seats including steward for the run.

## Ruling 1 — Delivery model: editor-driven

The editor stays the sole always-focused TUI component permanently. "Tree
focus" is `controller.surface` state; **there is no `setFocus(widget)`**. A
`CustomEditor` subclass registered via `setEditorComponent` (composing over
`getEditorComponent()` per Skeptic O4) overrides `handleInput` and enforces
the `surface` state; the below-editor widget stays render-only/passive.

Why over the `setFocus`-derived alternative:
1. **EV-9's Phase-1 ruling dissolves the counter.** Progress renders
   *inline* as an expansion of the tree region (not a modal overlay), so
   the overlay-`preFocus`/`overlayFocusRestore` argument for `setFocus` is
   moot — there is no modal to "return to".
2. **Skeptic O3 (closed-red) cuts against `setFocus` on a hard fact axis.**
   Non-overlay extension dialogs close via `dismissDialog → setFocus(this.editor)`
   ignoring `preFocus`, stealing focus from a focused widget; editor-driven
   is structurally immune (the editor never leaves focus).
3. **Single source of truth** — `controller.surface` is the sole arbiter; no
   second owner to desync (the "parallel flag is the failure mode" concern).
4. **Simpler** — one `handleInput` override, no `Focusable`, no re-grab.

## Ruling 2 — Swallow vs forward: forward-unhandled

While `surface === "tree"`, the override **consumes only Up/Down/Enter/Escape**
and calls `super.handleInput(data)` for **every other key** (printables,
ctrl+c, ctrl+d, PageUp/PageDown/Home/End, Backspace, Tab). This satisfies the
card's own "safe, defined behavior" criterion, keeps **ctrl+c non-negotiable**
(runaway-job interrupt regardless of focus), and is discoverable via EV-7's
hint line + EV-8's `-- TREE --` mode label. It is the vim NORMAL/INSERT
analog — letters don't silently vanish; they land in the editor.

## Ruling 3 — Taste set (endorsed with constraints)

| Item | Ruling |
|---|---|
| Mode-label wording | **Hard rule `-- TREE --`** (vim `-- INSERT --` precedent); reads from `controller.surface` |
| Keymap mechanism | **None** — moot under forward-unhandled (EV-7 hint line + mode label disclose the handled set) |
| j/k aliasing | **Delegated to designer, defaults to no** |
| ▌ glyph | **Hard rule U+258C** |

## Reversibility

Medium (delivery model), low (swallow/forward — one switch statement), trivial
(taste set). Open objections carried to step 9: O3 close-green by demonstrating
the editor-driven harness never exhibits the extension-dialog focus steal;
O4 compose-over-`getEditorComponent()` (a second editor extension must not
break EV-8); O6 sessionId-keyed selection stability once selection exists.

## Related

- [[2026-08-26-design-ev8]] — the designer position this ruling adjudicated
- [[council-job-tree-inline]], [[run-transcripts]]
- [[product-owner]], [[skeptic]], [[designer]]

## Sources

- `vault/raw/2026-08-26-po-ev8-ruling.md`
