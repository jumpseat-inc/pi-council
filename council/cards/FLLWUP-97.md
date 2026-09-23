---
id: FLLWUP-97
title: Follow-up board cap: pin the headroom probe's no-trim tripwire and add the recency window when the cap binds
state: Backlog
owner: null
epic: EPIC-16
goal: The EV-80 real-board headroom probe asserts per-section `truncated === false` over the shipped board in addition to the cap arms, and when the follow-up board section's measured tokens exceed its cap the packer keeps a recency window of whole Done entries — dropping whole stale entries, never titles or any open entry — with the cut declared in the drop record, proven by a tamper test and a fattened-board test.
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

---

### Absorbed: FLLWUP-98 — Pin the follow-up headroom probe's tripwire on `truncated === false`

Skeptic step-9 non-blocking note on EV-80 (recorded for the probe's
maintainer): the probe's `measuredTokens ≤ cap` assertion is near-tautological
by construction — forward-greedy cap fill guarantees kept tokens never exceed
the cap, so that arm alone cannot distinguish a healthy board from a silently
cut one. The **genuine tripwire is `truncated === false`**: verified red in both
tamper directions during EV-80's verification (cap shrunk 22000→15000; board
fattened +40 entries), but as an observation, not a pinned assertion in the
shipped probe.

This card promotes the observation into the probe's own assertions so a future
edit that "simplifies" the probe cannot silently drop the strong arm.

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

---

### From FLLWUP-98 — Pin the follow-up headroom probe's tripwire on `truncated === false`

- The probe asserts per-section `truncated === false` over the shipped real
  board (PKG_ROOT fixture) in addition to the existing per-section cap arms.
- Tamper check shipped with the card: a fattened board copy (or shrunken cap)
  turns the probe red; the shipped board stays green.
- The repo's typecheck, the full test suite, `python3 council/validate.py`, and
  the repo's preflight pass.
