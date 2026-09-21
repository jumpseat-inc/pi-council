---
id: FLLWUP-97
title: Recency window for the follow-up board section when the cap binds
state: Backlog
owner: null
epic: EPIC-10
goal: When the follow-up board section's measured tokens exceed its cap, the packer keeps a recency window of whole Done entries — dropping whole stale entries, never their titles or any open entry — with the cut declared in the drop record (`truncated: "cap"` plus the kept count) and the per-candidate board cost recorded alongside, proven by a test that fattens the board past the cap and asserts kept entries are whole, no open entry is dropped before any Done entry, and the cut is visible in both the drop record and the sources record.
---

## Intent

Named, not carded, by the 2026-09-21 product-owner ruling on EV-80
(`vault/raw/2026-09-21-po-ev80-state-packing-ruling.md`, §Named-not-carded items
1–2): today's board measures ~16,400 tokens against the 22,000 board cap
(EV-80's real-board headroom probe), so the cap **will** bind eventually, and
the remedy on the far side is packing a recency window of Done entries.

Boundary fixed by the ruling: dropping whole stale Done entries is acceptable;
dropping their titles (the `{id, state}` lever) is not — `alreadyDone` answers
from title evidence, and a section that can only answer "no" removes a counted
question from the decision. Justification language stays fixed too: the kept
entries carry real evidence; the cut never gets described as "only drops stale
work" (`board-create-card.md` §6 pins no positional rule inside a column).

EV-80's existing machinery already makes a bind visible (drop record with
`truncated: "cap"`, `sources` record, PKG_ROOT headroom probe as tripwire) —
this card is the deliberate window, not a silent thin pack. Also record the
per-candidate board cost trade here: every follow-up decision carries the whole
board section, so run cost scales with candidate count (the same card's home per
the ruling).

Expressly **not** an EV-80 fold-in — the ruling pinned that boundary; EV-80's
goal is packing what the board and its open cards hold, and a recency window is
a different claim about that board.

## Acceptance

- On a board fattened past the board cap, the packed board section keeps whole
  `{id, title, state}` Done entries and never a partial entry; every open entry
  survives before any Done entry is dropped.
- The cut is declared: a `FollowupDropRecord` with `truncated: "cap"` and the
  kept count, plus the existing `sources` visibility.
- The real-board PKG_ROOT headroom probe stays the growth tripwire and remains
  green until the cap actually binds.
- The repo's typecheck, the full test suite, `python3 council/validate.py`, and
  the repo's preflight pass.
