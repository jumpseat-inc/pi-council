---
id: FLLWUP-113
title: Generalize the FLLWUP-107 procedure-pack scan to an unresolved-token allowlist
state: Backlog
owner: null
epic: EPIC-15
goal: The packaged-procedure scan derives its allowed-token set from renderProcedure's substitution set and fails loud on any other unrendered `$…`/`@…` token in a packaged procedure.
---

## Intent

FLLWUP-107's `test/render.test.ts` scan fails if any packaged procedure under
`council/procedures/` contains an unrendered `$CONFIG_DIR_NAME` or
`@CONFIG_DIR@` token. That is a closed set: a future renderer token added to
`renderProcedure` would not be covered, and the scan goes stale silently. Swap
the two-literal check for an allowlist derived from `renderProcedure`'s
substitution set, so the guard tracks the seam. Filed from FLLWUP-107's step-13
candidate ("Generalize the FLLWUP-107 procedure-pack scan from the two pinned
tokens to an unresolved-token allowlist"); the recorded `File` disposition was
confirmed by product-owner 2026-09-23 (its `noul` merge certainty 0.59 fell
below the 0.60 threshold, so the fail-safe `File` applied).

Interaction: FLLWUP-112 widens the substitution set by rendering the
config-home token, at which point this generalized scan is the guard that lets
a packaged procedure use it without reding on a raw-file token check. Sequence
with FLLWUP-112.

## Acceptance

- The scan derives its allowed-token set from `renderProcedure`'s substitution
  set (not a hardcoded two-token list) and fails loud on any other unrendered
  `$…`/`@…` token in a packaged procedure.
- `bunx tsc --noEmit`, `bun test`, and `python3 council/validate.py` pass.