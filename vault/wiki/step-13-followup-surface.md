---
title: Step-13 Follow-Up Surface
type: concept
summary: The /council step-13 pre-write confirm-gate surface shipped by EV-82 — one rendered disposition line carrying candidate, disposition, target-or-cost, live mode and basis; four unavailable-state literals in the FLLWUP-75 shape; an unconditional dedup pass; and a hard pre-write confirmation pin.
aliases: [step 13 surface, followup render, disposition line, unavailable state literals]
tags: [pi-council/concept, pi-council/procedures, pi-council/epic10]
sources: ["[[2026-09-22-epic10-run-ledger]]", "[[2026-09-24-epic23-run-ledger]]", "[[2026-09-24-epic24-run-ledger]]", "[[2026-09-25-epic25-run-ledger]]"]
created: 2026-09-22
updated: 2026-09-25
---

# Step-13 Follow-Up Surface

Step 13 of `council/procedures/council.md` drafts the run's follow-up cards and
presents them to the human to edit, drop, or approve — writing nothing before
approval. EV-82 gave that moment a typed disposition render ([[followup-decision-gate]]).

## The rendered line

One line, byte order settled by the seated [[designer]] (intake R8 left it
there), continuous with the shipped `Mode: <disposition> — <basis>` grammar:

```
Mode: <disposition> — <basis> — <title>[ → <target>] (<advisory|active>)
```

The mandatory constituents (pinned by test) are: the **candidate identity**
(the title), the **disposition** (`File`/`Merge`/`Drop`), the **target-or-cost**
consequence (`→ <target>` for a `Merge`; the candidate's own title for a
`Drop`), the **live mode qualifier** (`<advisory|active>`), and the
**basis**. A `Merge` also writes a `## Merged from:` section on the merged-into
card naming both source candidates (R7), plus the chat line naming the target.

## The unavailable-state render (FLLWUP-75 shape)

One literal line per unavailable state, **replaced not appended**, and **zero
lines when the gate resolves** — no deliberation, failure, or verdict wording
beyond the exact literals:

- `off`
- `gate call failed: <reason>`
- credential unresolved
- model-card coming-soon

`FLLWUP-102` (EPIC-10) later flags that the last literal asserts a cause the
transport cannot establish from a bare `http-404` and is being corrected.

## Unconditional dedup and the pre-write pin

- The board/open-card/sibling dedup pass is **unconditional prose in every
  mode** including `off` and every fallback arm (R9): the mode switches *whose
  decision is applied*, never *whether the reader is told to look at the board*.
- The **pre-write pin** (EV-82): step 13 states that confirmation precedes any
  card write; a prose test asserts the literal `confirmed at ledger level`
  appears only inside a negating sentence. The pin is authored by EV-82;
  `FLLWUP-69`'s halves stay its own.
- The rendered decision is **presented, never written**: a test asserts the full
  `Mode: <disposition> — <basis>` render appears in no card file
  ([[presented-never-written]]).

## Witness

[[2026-09-22-epic10-run-ledger]]; EV-82 (`277036b`, PR #101). The
comprehension follow-ups are FLLWUP-101 (cold-read persona smokes) and
FLLWUP-102 (the 404 literal).

## EPIC-23 witness (2026-09-24)

Three `active` candidates rendered as `Mode: File — … (<active>)`, were ratified
`File` by [[product-owner]], and were applied on the confirming dispatch as three
board lines keyed by draft title (FLLWUP-114/115/116 →
[[follow-up-backlog-curation]]). A second runner returned `DONE`-with-held for its
two candidates, so they were never ratified and nothing was written — the
recurring [[confirmation-authority]] return drift. Witness:
[[2026-09-24-epic23-run-ledger]].

## EPIC-24 witness (2026-09-24)

Five `active` candidates across three cards rendered as
`Mode: File — composite <n> < merge threshold 1.00 — <title> (active)`, all
ratified `File` and applied as five board lines keyed by draft title
(FLLWUP-117–121 → [[follow-up-backlog-curation]]). The review tool was present
in-container and all five reached a ruling seat — the EPIC-23 `DONE`-with-held
drift did not recur. Witness: [[2026-09-24-epic24-run-ledger]].

## EPIC-25 witness (2026-09-25)

Three `active` candidates rendered in the batch container; all three carried a
recorded `File` line (the third a fail-safe `File` from a `duplicate` basis:
`Mode: File — duplicate: certainty 0.58 < noul threshold 0.60 — Watch
stub-child.test.ts for recurrence…`). The ruling seat ratified two
(FLLWUP-122/123) and **dropped** the third. This is the surface's first worked
`Drop`: no card written, the recorded `File` overridden by the ratifying seat,
and recurrence re-files fresh with evidence. Witness:
[[2026-09-25-epic25-run-ledger]].

## Related

- [[followup-decision-gate]] — the decision this renders
- [[confirmation-authority]] — why the line is ratified, not auto-applied
- [[presented-never-written]] — the presented/written boundary
- [[2026-09-24-epic24-run-ledger]] — five `active` renderings, all applied
- [[designer]] — settled the byte order
- [[engineering-board]] — the cards a `Merge`/`Drop` affects

## Sources

- [[2026-09-22-epic10-run-ledger]]
- `council/procedures/council.md` §13, `extensions/followup-render.ts`
- `vault/raw/2026-09-21-po-epic10-recut-ruling.md`