---
id: FLLWUP-112
title: Render a config-home token in procedure copy and derive the packaged-procedure scan's allowlist from renderProcedure's substitution set
state: Backlog
owner: null
epic: EPIC-15
goal: renderProcedure substitutes a config-home token ($CONFIG_DIR_NAME, and/or @CONFIG_DIR@) in a procedure body to the consuming repo's resolved config-dir name, and the packaged-procedure scan derives its allowed-token set from renderProcedure's substitution set and fails loud on any other unrendered `$…`/`@…` token, so no packaged procedure ships a literal `.pi/` path and the scan cannot go stale silently.
---


## Intent

`renderProcedure` (`extensions/index.ts:148–153`) today substitutes only
`$COUNCIL_PROCEDURES` and `$ARGUMENTS`; no `$CONFIG_DIR_NAME`/`@CONFIG_DIR@`
rendering exists for procedures. That is why FLLWUP-105's shipped `usages.md`
remediation sentence speaks a literal `.pi/` path — correct for this repo but
wrong for a consumer whose `$CONFIG_DIR_NAME` differs. Filed from FLLWUP-107's
step-13 candidate (draft title "Render $CONFIG_DIR_NAME / @CONFIG_DIR@ in
procedure copy so packaged procedures need not ship literal .pi/ paths"),
product-owner-confirmed 2026-09-23 after the recorded `Merge` basis was found
unsupported (no open card covers it). FLLWUP-107's pin proved the substitution
seam's current boundary; this card widens it deliberately.

Interaction: the FLLWUP-107 packaged-procedure scan fails on any **raw**
procedure file containing `$CONFIG_DIR_NAME`/`@CONFIG_DIR@`. If this card makes
a packaged procedure use the token, that scan must be reconciled — FLLWUP-113
(generalize the scan to an allowlist derived from the renderer's substitution
set) is its sibling. Sequence with FLLWUP-113 to avoid the scan reding on the
newly-rendered token.

---

### Absorbed: FLLWUP-113 — Generalize the FLLWUP-107 procedure-pack scan to an unresolved-token allowlist

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

- A test pins that a procedure body containing the config-home token renders
  through `renderProcedure` to the repo's resolved config-dir name.
- `bunx tsc --noEmit`, `bun test`, and `python3 council/validate.py` pass.

---

### From FLLWUP-113 — Generalize the FLLWUP-107 procedure-pack scan to an unresolved-token allowlist

- The scan derives its allowed-token set from `renderProcedure`'s substitution
  set (not a hardcoded two-token list) and fails loud on any other unrendered
  `$…`/`@…` token in a packaged procedure.
- `bunx tsc --noEmit`, `bun test`, and `python3 council/validate.py` pass.
