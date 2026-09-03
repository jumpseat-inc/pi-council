---
title: Presented Never Written
type: concept
summary: The /features-new gate presentation is two-part — Part 1 card drafts exactly as they would be written and strictly attribution-free, Part 2 a ledger of contributors, disagreements, and unresolved calls that is presented to the human but never persisted to any card file.
aliases: [ledger surface, two-part gate presentation, disagreement ledger, attribution-free]
tags: [pi-council/concept, pi-council/features-new]
sources: ["[[2026-09-04-epic3-run-ledger]]"]
created: 2026-09-04
updated: 2026-09-04
---

# Presented Never Written

The `/features-new` step-3 gate presents the decomposition to the human in
**two parts that must never blur** (EV-10, v0.15.0):

- **Part 1 — card drafts, exactly as they would be written to disk.**
  Complete frontmatter + `Intent` per card, and **attribution-free**: no
  seat names, wave numbers, or deliberation narrative in any card's
  frontmatter or Intent ("Part 1 card drafts must be attribution-free" —
  an explicit mandate in the procedure text, pinned by `test/prose.test.ts`
  with non-vacuity proven by one-byte mutation).
- **Part 2 — the ledger surface: presented, never written.** Per-card
  `Contributors:` lines naming the seats that shaped it, a
  `Disagreements:` block, and row-level `Decision: unresolved — your call`
  markers. On a non-converged session it also carries the session status
  line ("Session status: Non-converged after 3 rounds — this is a fallback
  draft. … Ledger only — presented, never written."). The ledger does not
  survive onto any on-disk card; attribution lives only here and in the
  `runs/` transcript.

## Why the blur is the failure mode

Card files are the payload that `/features-deliver` later executes
unattended — deliberation narrative inside them is (a) a lie about authorship
(the [[facilitator]] authors nothing, and unattributed sentences would have
no author), and (b) context bleed into every future seat that reads the
card. The [[skeptic]] caught exactly this in the EPIC-3 smoke run: the draft
cards embedded `(Designer, wave 2)`, "principal argued Ready; overruled",
and similar narrative destined for disk. The bug produced the mandate, the
pin, and this page.

## Why two parts at all

The human at the gate needs both the artifact and its provenance: what each
seat contributed, which disputes the seats could not settle, and which calls
are the human's ("your call"). Collapsing provenance into the artifact
destroys the first property the draft-then-confirm gate protects — the human
sees the exact bytes that will land. The EV-11 step-6 ruling extended the
pattern: even the session-status signifier is placed **adjacent to** the
ledger's guard sentence (within ~200 chars), not in the bound-structure
block — placement follows the presentation/procedure boundary, measured, not
guessed.

## Related

- [[three-wave-decomposition]] — the waves whose output this presents
- [[engineering-board]] — the on-disk format Part 1 must match exactly
- [[facilitator]] — aggregates verbatim; authors nothing
- [[2026-09-04-epic3-run-ledger]] — origin, including the caught blur

## Sources

- `council/procedures/features-new.md` step 2 (two-part gate presentation, as of v0.15.0)
- `docs/superpowers/specs/2026-09-03-EV-10-design.md`, `…EV-11-design.md`
- [[2026-09-04-epic3-run-ledger]]
