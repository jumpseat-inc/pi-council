---
id: EPIC-5
title: /council-models provider and model picker for per-seat .council.json overrides
state: Backlog
owner: null
epic: null
goal: A `/council-models` slash command opens a token-only, council-themed modal picker listing pi's enabled providers and the models each serves, and selecting a provider and model for a seat writes that seat's `model` and `thinking` override into `.council.json` without disturbing the `theme` section, verified by an integration test that feeds a selection through the resolver, the modal picker's selection-encoding contract, and the merge-writer, and asserts the resulting `council.<seat>` entry plus a SHA-identical `theme` block after the write.
---

## Intent

Seat models are overridable per repo via the committed `.council.json`
(`council.<seat>` model/thinking entries), but editing that file by hand is
the only way to change them. The human wants a `/council-models` command
that opens an easy picker — one seat at a time, choose the provider, choose
the model — with the picker showing up as a modal window that adheres to the
council theme used for colors and styles.

Two facts shape the feature. First, the catalogue comes from pi, not from
provider HTTP calls — pi's model registry already enumerates the enabled
providers, applies auth filtering, and lists the models each serves, and
dispatch validates picks against that same set. Second, `.council.json` has
no writer anywhere in the codebase today and carries a sibling `theme`
section the theme watcher fires on — so the write path this epic introduces
must merge rather than rewrite.

Children: EV-22 (catalogue resolver from pi's registry), EV-23 (token-only
modal picker), EV-24 (non-destructive merge-write), EV-25 (command
registration and wiring).

## Acceptance

- The integration test feeds a programmatic selection through the resolver,
  the modal picker's selection-encoding contract, and the merge-writer, and
  asserts the resulting `council.<seat>` entry plus a SHA-identical `theme`
  block after the write.
- The end-to-end smoke exercising `/council-models` in a real overlay rides
  with EV-25.
- All children land with tests; `bun test`, `bunx tsc --noEmit`, and
  `python3 council/validate.py` stay green.

## Phase 1 rulings (features-deliver, binding for this run)

- **R-1 (build order)**: writer-first — the cards run EV-22 → EV-24 →
  EV-23 → EV-25. The first `.council.json` write path lands and is proven
  before the modal builds on it; EV-25 is last (it depends on the other
  three).

Recorded human decision — immutable for the run and binding on every seat,
`steward` included.
