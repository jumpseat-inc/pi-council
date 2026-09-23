---
id: EPIC-20
title: Close the packaged-resource residuals — `_template.md` reclassification, per-file refresh, refresh-path wiki, consumer-repo path protection, and the config-home procedure token
state: Backlog
owner: null
epic: null
goal: The packaged-resource residuals are delivered — `council/cards/_template.md` resolves from the installed package, `/council-update` gains a consent-gated `--refresh-file <path>` for data-class files, the refresh path's wiki pages are written, the T1-class wiki-cited-path protection is designed for consumer repos, and `renderProcedure` substitutes a config-home token with a scan derived from its substitution set — with the gates green.
---

## Intent

Residuals of the EPIC-9 FLLWUP-50 packaged-tooling refresh path and the EPIC-15 procedure-copy surface. Grouped because every child concerns which bytes a consumer executes versus which the installed package supplies, and the override/refresh rules around them.

Children:

- FLLWUP-65
- FLLWUP-66
- FLLWUP-67
- FLLWUP-93
- FLLWUP-112

## Acceptance

Every child card is `Done` with its own goal satisfied, and the repo's gates (`bunx tsc --noEmit`, the full `bun test`, `python3 council/validate.py`, and `bash council/preflight.sh`) are green on each merged SHA. No child is silently dropped: each is delivered, folded, or recorded out of scope with a reason. The epic closes only when its named acceptance outcome is observed on the tree, not merely reported.
