---
title: 2026-09-20 PO EV-67 Step-6 Ruling
type: source
summary: product-owner (job-19) rules the approval-gate locator by its heading ("the draft-then-confirm approval gate") not an ordinal, pins fallback cells B (`gate call failed before recording a verdict`) and C (`recorded gate call not found in ledger`) into one composite, scopes the goal to gate-enabled runs, and corrects a stale Intent sentence.
aliases: [po-ev67-step6-ruling, EV-67 approval-gate ruling]
tags: [pi-council/source, pi-council/epic13, pi-council/product-owner]
sources: []
created: 2026-09-20
updated: 2026-09-21
---

# 2026-09-20 PO EV-67 Step-6 Ruling

product-owner ruling (job-19) on EPIC-13 card EV-67 (the verdict rendered at the approval gate),
over items J1–J4.

## J1 — the locator is the heading, not the ordinal

Title and goal amended to name **"the draft-then-confirm approval gate"** (the literal heading
text), not "step 4"/"step 3". An ordinal in the immutable goal can be made false by a later card
in the same run; the heading is stable and already byte-identity-protected. The section number
goes into the amendable `## Acceptance`. The board title row edits in the same commit.

## J2 — the fallback-literal bytes

Cell B's wording changes to `gate call failed before recording a verdict` (avoids the
cause-slot inversion and stays distinguishable from the recorded-failure `gate call failed: `
form); cell C's `recorded gate call not found in ledger` ships as proposed; cell A′ (a found
record with no stored `basis`) renders the **mode token alone**, no fourth literal. All share
one composite and separator byte in `gate-ledger.ts`; none carries its own `Mode: ` prefix.

## J3 — the goal is scoped to gate-enabled runs

The goal is amended to "every card of a gate-enabled run renders exactly one additional line",
and the Acceptance pins "off renders no lines at all". A goal that must be reinterpreted against
its own words to be satisfiable is the defect (the EV-29 class); the packaged default is `off`
(EPIC-13 R3), so the literal unconditional reading would demand an invented line on every
consumer repo. PO, not steward: the amendment removes a demand and adds nothing to build.

## J4 — the stale Intent sentence

The Intent's "rendering is a pure function of the recorded decision and the card" is replaced
with the decision alone — the card is **not** a render input, which is what makes byte-identity
by construction. Intent prose is binding in this repo (EV-37), so a stale binding sentence is a
second instruction to the owner; the ruling seat flags the edit rather than absorbing it.

## Related

- [[metered-deliberation-routing]] — the `Mode: <mode> — <basis>` line
- [[judge]] — why the goal must be literal (no partial credit)
- [[product-owner]] — the ruling seat and its goal-amendment precedents
- [[engineering-board]] — goal immutability and Acceptance as an amendable surface

## Sources

- `vault/raw/2026-09-20-po-ev67-step6-ruling.md`
- `council/cards/EV-67.md`