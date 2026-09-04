---
title: Council Config Writer
type: entity
summary: The first .council.json write path (EV-24) — a byte-region patcher with three regimes (replace/insert/greenfield) that field-level merges one seat's council.<seat> object, validating model-presence and thinking grammar and preserving every other byte, theme included.
aliases: [council config writer, council-config-writer, writeSeatOverride, config writer, .council.json writer]
tags: [pi-council/entity, pi-council/epic5]
sources: ["[[2026-09-04-epic5-run-ledger]]"]
created: 2026-09-04
updated: 2026-09-04
---

# Council Config Writer

`extensions/council-config-writer.ts` (EV-24, PR #20 `5fa22a1`) — the
first code anywhere in the repo that writes `.council.json`. Before it,
the file was loaders-only (`loadCouncilConfig`/`loadThemeConfig`) and
edits were hand-only.

## Contract

`writeSeatOverride({repoRoot, seat, model, thinking?, catalogue}) →
{ok:true} | {ok:false; error}` —

- **Validates before writing**: model must parse as qualified
  `provider/id` AND be present in the flat catalogue array (dispatch's
  own predicate, over the same one-snapshot array the resolver consumed);
  `thinking` must be in `THINKING_LEVELS` (exported from `seats.ts`).
  **No capability gate** — see [[gate parity]].
- **Validation failures return an error message and write nothing**;
  filesystem failures (atomic-rename EROFS/ENOSPC) throw; a malformed
  pre-existing file returns an error without writing (never clobber
  mid-edit state).
- **Field-level merge**: absent `thinking` preserves the existing value
  (the inverse of `applySeatOverride`'s independent model/thinking
  guards); clearing an override is a distinct affordance (FLLWUP-9),
  never silent absence. No "clear" input exists — delete is unreachable.

## Byte-region patcher, not a re-serializer

The naive `JSON.stringify(merged, null, 2)` writer would reformat a
consumer's committed file on the first model-only edit — and both the
scaffold seed and the real repo file are **tab-indented** (verified
`cat -A`), which fails the card's own theme-SHA acceptance. The writer
instead **splices**: parse for validity, string-aware scan to locate the
`council.<seat>` value's byte span, replace/insert only that span. Three
regimes:

- **replace** — seat exists: re-emit just that value span in the block's
  own indent unit (model before thinking; thinking omitted when absent);
- **insert** — seat or `council` absent: emit the new region in the
  detected indent style (strict-majority unit → target block's unit →
  tabs; mixed indent never throws);
- **greenfield** — file absent: canonical create, default mode.

Everything outside the spliced span — the `theme` section, other seats,
unknown top-level keys, indentation, trailing newline — is byte-identical
**by construction**, so the theme watcher at `theme-watcher.ts:45` can
never misclassify a model-only edit. The write is atomic (tmp + rename,
mode preserved via stat+chmod on the tmp; `.council.json` is a committed
shared file — never the 0600 secrets pattern).

## Known seam

`existingThinking` (the preservation lookup) misses a `:suffix` on an
object-form `model` — Skeptic closed-red, reproduced; tracked as
**FLLWUP-10** (`lastIndexOf(':')` + `THINKING_LEVELS.has(...)`, matching
`applySeatOverride`).

## Related

- [[council config]] — the file, its shape and read path
- [[gate parity]] — why validation stops at model-presence + grammar
- [[council models picker]] — the surface that calls it
- [[non-clobbering-scaffold]] — the file's seeding discipline
- [[2026-09-04-epic5-run-ledger]]

## Sources

- [[2026-09-04-epic5-run-ledger]]
- `extensions/council-config-writer.ts`, `council/cards/EV-24.md`
