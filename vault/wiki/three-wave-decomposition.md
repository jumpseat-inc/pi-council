---
title: Three-Wave Decomposition
type: concept
summary: The /features-new structure (v0.15.0) — a feature is deliberated into an epic + child cards by seats in three bounded waves (principal authors, skeptic+designer attack, product-owner rules), with the facilitator authoring nothing and the human gate untouched.
aliases: [seated decomposition, features-new decomposition, wave structure, bounded decomposition session]
tags: [pi-council/concept, pi-council/features-new]
sources: ["[[2026-09-04-epic3-run-ledger]]"]
created: 2026-09-04
updated: 2026-09-04
---

# Three-Wave Decomposition

As of v0.15.0 (EPIC-3), `/features-new` no longer decomposes solo: the
facilitator "authors nothing at any step" and instead dispatches the
decomposition as **three waves in `council/procedures/features-new.md` step
2** — each wave is one round, so the session is bounded at three rounds, the
same numeric cap as [[council-loop]]'s step-3 exchange (Ruling CAP-1).

## The waves

1. **Wave 1 — [[principal]] authors the first artifact, dispatched once.**
   The child decomposition (slicing, per-child `goal`, `state`, surface
   flag) in principal's native Reframe format, plus the epic goal as a
   **one-line transcription of the human's intake** — the human is the
   author of what the product is for; principal only transcribes (Ruling
   SEATS-1 + EV-10 step-6 ruling).
2. **Wave 2 — [[skeptic]] + [[designer]] attack in parallel**, identical
   input, native output formats. The skeptic's completeness charter is
   **scoped to falsifiable form** (stub-satisfiability, unfalsifiable
   formats, Ready-vs-Backlog bar); observational missing-child arguments
   belong to principal/designer.
3. **Wave 3 — [[product-owner]] last, unconditional, ruling-only.**
   Ratifies/amends the epic goal and each child's `state`, rules disputes
   with dissent named, escalates to the human via the orchestrator. PO
   **rules but never generates** — a wave-1 PO authorship would create a
   self-review loop the human at the gate cannot see (the EV-10 step-6
   ruling's ground).

No seat is re-dispatched to respond to another seat's position — the three
waves ARE the three rounds; a stall re-dispatch is a retry, not a round.

## Convergence and fallback

Convergence is recorded only at the **fixed endpoint** (after wave 3):
zero open in-scope judgments remain, where open = unruled by product-owner
AND not settled by a runnable check. A named ruled dissent is **not**
non-convergence. An escalated-unruled item **is** non-converged — and is the
fallback's canonical content. On non-convergence the facilitator drafts the
decomposition anyway as the **mechanical verbatim aggregate** of all
recorded contributions, with open disagreements labeled unresolved at the
existing step-3 gate (Ruling FALLBACK-1 — no new gate;
[[presented-never-written|Part 2]] carries a session status line when this
fires). `/council`'s "stop early if positions have stabilised" is
deliberately **not** imported — wave 3 can never be skipped (a scoped
divergence from [[council-loop]], not a contradiction).

## Why the participants are who they are

Ruling SEATS-1: product-owner, designer, principal, skeptic — no other seats
deliberate by default. The set maps to the decomposition's needs: one
cross-seam author ([[principal]]), two adversarial lenses ([[skeptic]],
[[designer]]), one ruler ([[product-owner]]). [[owner]] is absent because
implementation doesn't exist yet at decomposition time; [[steward]] because
portfolio-level strategy is not a per-feature question.

## Related

- [[presented-never-written]] — the gate presentation the waves feed
- [[council-loop]] — the sibling loop whose cap this borrows; early-stop divergence flagged there
- [[facilitator]] — dispatches and aggregates verbatim; authors nothing
- [[procedure-commands]] — where `/features-new` sits among the procedures
- [[three-wave-decomposition]]'s source: [[2026-09-04-epic3-run-ledger]]

## Sources

- `council/procedures/features-new.md` (as of v0.15.0)
- `docs/superpowers/specs/2026-09-03-EV-10-design.md`, `…EV-11-design.md`
- [[2026-09-04-epic3-run-ledger]]
