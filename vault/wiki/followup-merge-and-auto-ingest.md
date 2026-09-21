---
title: Follow-Up Merge and Auto-Ingest
type: concept
summary: SUPERSEDED (2026-09-22) — the pre-cut EPIC-10 plan (merge-before-draft plus autonomous wiki ingest). The shipped epic re-cut murdered merge-before-draft (Merge is now the follow-up decision's own outcome) and re-homed ingest out (EV-45/46/47 carried to `epic: null`). Kept as the historical record.
aliases: [follow-up merge, auto ingest, unattended wiki ingest]
tags: [pi-council/concept, pi-council/plan, pi-council/superseded]
sources: ["[[2026-09-22-epic10-run-ledger]]"]
created: 2026-09-20
updated: 2026-09-22
---

> ⚠️ **SUPERSEDED — 2026-09-22.** This page described the pre-re-cut EPIC-10
> plan and is kept only as history. The shipped epic is [[followup-decision-gate]].
> See [[2026-09-22-epic10-run-ledger]] for the run.

The old plan had two halves:

1. **Merge-before-draft** — a mandatory consolidation pass that merged
   technically-close follow-up cards before drafting. **This framing is
   subsumed, not deleted**: the re-cut made `Merge` the follow-up decision's own
   outcome, decided by the typed Jev gate from the board, every open card, and
   the run's other surfaced candidates. The board/open-card/sibling dedup pass
   survives as **unconditional prose in every mode** (intake R9) — the mode
   switches *whose decision is applied*, never whether the reader looks at the
   board. Vocabulary is now exactly `File | Merge | Drop` (R2).
2. **Autonomous wiki ingest** at every run completion. **Re-homed out of
   EPIC-10** (intake R3): the intake names follow-up *cards*; ingest has its own
   write owner and authority map, so EV-45/46/47 were carried to `epic: null`
   (live, unparented, `Backlog`) rather than riding EPIC-10. `/wiki-ingest`
   remains the write path ([[llm-wiki]]).

What also did *not* survive: a dedicated `followupGate` section or a
`gate.followupMode` key. One shared `.council.json` `gate.mode` governs both
decision domains ([[council-config]], [[metered-deliberation-routing]]).

## Related

- [[followup-decision-gate]] — the shipped replacement
- [[confirmation-authority]] — how a decided candidate is applied
- [[step-13-followup-surface]] — the rendered surface
- [[llm-wiki]] — the ingest process the second half re-homed to
- [[2026-09-22-epic10-run-ledger]] — the run that closed the question

## Sources

- `vault/raw/2026-09-21-po-epic10-recut-ruling.md` (R2, R3, R9)
- [[2026-09-22-epic10-run-ledger]]
- `council/cards/EPIC-10.md`, `council/cards/EV-45.md`…`EV-47.md`