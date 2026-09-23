---
id: FLLWUP-112
title: Render $CONFIG_DIR_NAME / @CONFIG_DIR@ in procedure copy
state: Backlog
owner: null
epic: EPIC-15
goal: renderProcedure substitutes a config-home token ($CONFIG_DIR_NAME, and/or @CONFIG_DIR@) in a procedure body to the consuming repo's resolved config-dir name, so a packaged procedure can name the config home without shipping a literal `.pi/` path.
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

## Acceptance

- A test pins that a procedure body containing the config-home token renders
  through `renderProcedure` to the repo's resolved config-dir name.
- `bunx tsc --noEmit`, `bun test`, and `python3 council/validate.py` pass.