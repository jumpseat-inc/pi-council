---
id: FLLWUP-2
title: Make the .council.json theme export section editable
state: Backlog
owner: null
epic: null
goal: The .council.json theme section accepts export overrides that reach the HTML export output
---

## Intent

Surfaced during EV-2: the theme `export` section (pageBg / cardBg /
infoBg) is currently "preserved, not editable" — EV-2's design explicitly
deferred it. A consumer configuring the council theme cannot currently
tune the HTML export page background, card background, or info background;
they fall back to defaults derived from `userMessageBg`.

This is the missing leg of the per-repo `.council.json` customization
story: every part of the theme except the HTML export block is
repo-overridable. A consumer who wants their exported transcripts/
deliverables in the omp palette or their own palette needs these three
values overridable the same way (:top-level-vars, per-variant).

The theme family name is `pi-council` and nothing else; variants
`pi-council-dark` / `pi-council-light`. The `.council.json` theme section
shape is the Council's (top-level `theme` key, sibling of `council`).

## Acceptance

- `.council.json` `theme.<variant>.export` values (pageBg, cardBg, infoBg)
  override the shipped defaults in `/export` output.
- Absent `export` block → current default behavior unchanged (back-compat).
- The EV-4 export-pinning test still passes (or is extended) and no crash
  appears under an active in-memory theme for the export overrides path.
- All owner gates green (`bunx tsc --noEmit`, `bun test`, `python3 council/validate.py`).