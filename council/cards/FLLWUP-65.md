---
id: FLLWUP-65
title: Reclassify council/cards/_template.md as a package-resolved resource
state: Backlog
owner: null
epic: EPIC-20
goal: council/cards/_template.md is resolved from the installed package at point of use (the procedures model), shadowed by an intentional consumer override if one exists, and drops out of the FLLWUP-50 refresh path's writable tooling set entirely (tooling class shrinks to exactly council/validate.py, the set-equality guard and the scaffold.json record follow, and the packaged-byte-parity pin for _template.md moves to the resolution mechanism) — eliminating one file from the refresh path's bootstrap ask and one whole skew class.
---

## Intent

Ordered by FLLWUP-50's step-6 ruling **PO R4**: "`_template.md`:
V1-refresh as a Class-1 file. Reclassification (package-resolved resource)
gets its own card — it requires new engine work." This is that card.

The end-state is strictly additive to FLLWUP-50's delivered refresh path:
it shrinks the refresh set from two files to one and removes one file from
the bootstrap ask. Why it needs its own engine work (PO R4's reasoning):
`proceduresDir()` substitutes `$COUNCIL_PROCEDURES` — a single variable in
a single text. A general "resolve this file from the package" mechanism
needs a new substitution variable and a per-procedure integration point;
that is precedent-less mechanism work, and the consumer-side procedure copy
is a sanctioned override path, not a packaged-only resource — the model is
different for `_template.md` (consumed by `council/validate.py` and
procedure copy instructions, not by seat system prompts).

Delivered context (FLLWUP-50, merged 6e35355): tooling/data classification
in `extensions/scaffold.ts` (`TOOLING_FILES` constant + set-equality
guard), the `scaffold.json` provenance record, `/council-update` with the
five/six-state report, `session_start` drift detection. This card amends:
`TOOLING_FILES` → `{council/validate.py}`; `_template.md` becomes
package-resolved at its use sites (`board-create-card.md:12`,
`features-new.md:27` reference it; `validate.py`'s `main()` skips it);
override semantics per [[override-resolution]]; the 10-copy
`_template.md` byte-parity pin (`test/fllwup43-goal-oracle.test.ts:144`)
moves to the resolution mechanism; `session_start` drift detection follows
the shrunken tooling class.

## Origin

FLLWUP-50 step-6 ruling PO R4 (verbatim: "gets its own card"); step-2
principal round-1 ("reclassify `_template.md` as package-resolved …
shrinking the refreshable set to one — trades away consumer template
customization for zero skew"); step-3 owner round-2 recommendation.
