---
title: PO ruling — FLLWUP-50 step-6 (refresh-path consent, command, record)
type: source
summary: The ruling that settled FLLWUP-50's mechanism — leg-B preserve-and-ask with a three-state scaffold.json record, /council-update with a two-phase --apply, a committed record, _template.md v1-refreshed, acceptable bootstrap friction, seats fenced out of v1.
aliases: [po-fllwup50-step6, fllwup50 step6 ruling, class-1 consent fork]
tags: [pi-council/ruling, pi-council/epic9]
sources: ["[[2026-09-19-po-fllwup50-step6-ruling]]"]
created: 2026-09-19
updated: 2026-09-19
---

# PO ruling — FLLWUP-50 step-6

Source: `vault/raw/2026-09-19-po-fllwup50-step6-ruling.md`. Settles the §2.1
blocking consent fork and the §2.2/§2.4/§2.5/§2.6/§2.8 non-blocking items;
§2.3 (detection scope/site) and §2.7 (lifecycle) escalated to [[steward]].

## R1 (blocking) — leg B: preserve-and-ask

The product's **first sanctioned write to consumer files**. Chosen: leg B over
overwrite-always. Mechanism: a three-state pristine-digest record at
`<repo>/$CONFIG_DIR_NAME/council/scaffold.json`, written by `scaffoldInto` on
**creation only**; states `behind` / `diverged` / current; ask-once bootstrap
("no record ⇒ treated as edited ⇒ ask"); **plan-granularity consent for
`behind`**, **per-file consent for `diverged`**; backup before any consented
write. AGENTS.md convention #5/#6 additions ride the same change.

Rejected: overwrite-always (content-compare leaves the consumer-edited state
undecidable), "always ask forever, no record" (non-adoption → back to unbounded
skew), engine-resolved validation (a false-green generator), a flag on
`/council-init` (makes "never overwrites" conditional).

## R2 — `/council-update`, two-phase

Dry-run/plan default; `--apply` writes all `↑ behind` and skips `~ diverged`
(per-file accept required for `diverged`). Pairs with the `↑` glyph.

## R3 — the record is committed

`<repo>/$CONFIG_DIR_NAME/council/scaffold.json` is committed by default;
consumer may gitignore. Committed-vs-local is conditional on R1 = leg B.

## R4 — `_template.md` v1-refreshed; reclassification carded

Reclassification as a package-resolved resource needs new engine work (the
`proceduresDir()` model substitutes one text variable, not a generalized
resolver) — carded as `FLLWUP-65`.

## R5 — bootstrap friction is acceptable

One confirmed two-file review with the diff shown, then mechanical.

## R6 — seat-triggered refresh fenced out of v1

No v1 consumer; lifting the fence is a follow-up.

## Record corrections (closed-red, applied before step 7)

16 `seed.treeDigest`s not 8; designer P4's "(unchanged)" stamp is false
(subsumed by P2-amended); the scaffold tree ships 8 files, not 7.

## Takeaways

- A **digest record written at creation time** is what makes "consumer-edited"
  decidable; without it, content-compare can only see two states.
- The **unit of consent tracks the unit of risk**: plan-level for unmodified
  files, per-file for diverged ones.

## Related

- [[non-clobbering-scaffold]], [[override-resolution]], [[council-config]]
- [[2026-09-18-design-fllwup50-refresh-path]]
- [[2026-09-18-epic9-residual-run-2-ledger]]

## Sources

- [[2026-09-19-po-fllwup50-step6-ruling]]