---
id: EPIC-19
title: Close the council output-surface residuals — transcript header/lifecycle, the RPC tree path, and theme export
state: Backlog
owner: null
epic: null
goal: The council's output-surface residuals are delivered — theme export works under an in-memory theme with editable export overrides, `/council-tree` in RPC mode never silently no-ops, the dead `TranscriptView` renderer and refresh cosmetics are removed, the inline progress header is pinned under overflow and clamped to the granted width, and a replaced transcript view is disposed on session switch — with render output unchanged where required and the gates green.
---

## Intent

Residuals of the EPIC-8 transcript-rendering subsystem, the EPIC-2 inline tree, and the EPIC-1 theme's HTML-export surface. Grouped as the human-facing rendering surfaces (transcript, inline tree, exported HTML).

Children:

- FLLWUP-1
- FLLWUP-4
- FLLWUP-36
- FLLWUP-37
- FLLWUP-39

## Acceptance

Every child card is `Done` with its own goal satisfied, and the repo's gates (`bunx tsc --noEmit`, the full `bun test`, `python3 council/validate.py`, and `bash council/preflight.sh`) are green on each merged SHA. No child is silently dropped: each is delivered, folded, or recorded out of scope with a reason. The epic closes only when its named acceptance outcome is observed on the tree, not merely reported.
