---
title: PO ruling — FLLWUP-59 step-13 follow-up drafts
type: source
summary: product-owner drops both FLLWUP-59 drafts — routing an imprecise retired-path caveat to the run-2 ingest with a fixed replacement sentence (and a warning that the spec, not the page, is the source of the error), and dropping the truncated-history guard classes with a named re-card trigger.
aliases: [po-fllwup59-step13, fllwup59 step13 ruling, retired-path caveat]
tags: [pi-council/ruling, pi-council/epic9]
sources: ["[[2026-09-19-po-fllwup59-step13-ruling]]"]
created: 2026-09-19
updated: 2026-09-19
---

# PO ruling — FLLWUP-59 step-13 follow-up drafts

Source: `vault/raw/2026-09-19-po-fllwup59-step13-ruling.md`.

## R1 — the retired-path caveat (DRAFT A dropped, ingest item confirmed)

[[retired-path-tokens]] §"Red-base falsifier", field 6, caveat (a) says that at
`323abdc` the FLLWUP-55 `smoke/` driver "does not exist". It **exists**, with
pre-kit content (it does not yet `from pty_kit import`). The transplanted
witness's tests 9–11 fail as **content assertions against a file that is
there**, not as missing-file errors — either way copy-set-dependent, not
mechanism-absent.

Not cosmetic: field 6 of [[red-base evidence]] exists to let a later reader
classify a base red, and a reader told "the file does not exist" reasons from a
wrong premise.

The **replacement sentence** binds the ingest:

> (a) at `323abdc` the `test/faux-provider/` station exists **and**
> `smoke/search-smoke/driver.py` exists with pre-kit content (it does not yet
> import `pty_kit`; FLLWUP-55 collapsed it later) — so the transplanted
> witness's tests 9–11 fail as content assertions on a file that is present,
> not as missing-file errors; either way copy-set-dependent, not
> mechanism-absent;

**Load-bearing warning**: the imprecision originated in the card's design
**spec** (`docs/superpowers/specs/2026-09-18-FLLWUP-59-design.md`), and the page
faithfully carried it forward. An ingest that re-derives from the spec
**re-imports the defect** — the owed entry takes this raw file as its source, and
the spec is not retro-edited.

## R2 — truncated-history guard classes (DRAFT B dropped, residual named)

The `git replace` / grafted / archive-export classes stay `open-untested` as
live reproductions. They are dropped as over-engineering for this repo's threat
model, because the classes are not untested **branches**: all three converge on
one assertion over one input, the truncation recipe is not an input, the
derived set is, and `git filter-branch` truncation with `is-shallow` false was
`closed-green`. Archive-export has no silent path (no `.git` → a named throw).
What remains is label changes plus a scratch-repo arm billed against the ≈94s
envelope.

The residual stays named, **not** silently accepted. Re-card trigger: a
non-zero/non-full fetch depth anywhere in a workflow, or any report of a
silently-partial derived set. `FLLWUP-70`/`71` ids stay unconsumed.

## Takeaways

- A spec can be the **origin of a wiki imprecision**; ingest from the ruling
  file, never re-derive from the spec, or the defect re-imports.
- A dropped card is not a dropped residual: name the trigger, keep the
  limitation on the page ("loud, not silent"), and leave the id free.

## Related

- [[retired-path-tokens]], [[red-base evidence]], [[test-suite-budget]]
- [[2026-09-18-epic9-residual-run-2-ledger]], [[2026-09-18-po-fllwup56-step13-ruling]]

## Sources

- [[2026-09-19-po-fllwup59-step13-ruling]]