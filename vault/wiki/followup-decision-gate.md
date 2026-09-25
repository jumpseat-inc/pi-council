---
title: Follow-Up Decision Gate
type: concept
summary: EPIC-10 (shipped v0.33.0) — the follow-up review's typed Jev decision in its own File/Merge/Drop domain, a sibling of the card gate sharing one `.council.json` `gate.mode`; a failed or unresolved decision falls back to the human pre-write confirm and may never Drop or auto-Merge.
aliases: [follow-up decision, followup gate, File Merge Drop, dispose followup, follow-up review]
tags: [pi-council/concept, pi-council/epic10]
sources: ["[[2026-09-22-epic10-run-ledger]]", "[[2026-09-22-design-epic11-recut-surface]]", "[[2026-09-22-epic15-run-ledger]]", "[[2026-09-22-gate-noul-fix]]", "[[2026-09-23-epic15-residual-run-ledger]]", "[[2026-09-23-fllwup-backlog-cleanup]]"]
created: 2026-09-22
updated: 2026-09-25
---

# Follow-Up Decision Gate

> ✅ **Shipped — EPIC-10 (2026-09-22), v0.33.0.** The one part of a council run
> that still ended in a human reading prose and deciding now has the same typed
> System One decision the card gate gives dispatch. It is **not** the card gate
> pointed at candidates: same mechanism, different domain — its own packed
> state, question set, decision policy, and output vocabulary.

## The disposition vocabulary

Exactly three values (intake R2), produced by
`decideFollowup(answers, policy)`:

- **`File`** — a new card.
- **`Merge`** — fold the candidate into an existing board card or a same-run
  sibling.
- **`Drop`** — discard the candidate.

The safe side is the **human**, deliberately inverted from the card gate: a card
gate that fails resolves to the full Deliberate panel (more scrutiny is safe);
a follow-up decision that fails, times out, refuses, or cannot resolve a
credential returns to the existing pre-write review and **may never `Drop` or
auto-`Merge`**. The merge-before-draft requirement of the old plan is subsumed —
`Merge` is now the decision's own outcome — and the board/open-card/sibling dedup
pass is **unconditional prose in every mode** (R9): `gate.mode` switches *whose
decision is applied*, never *whether the reader is asked to look at the board*.

## Enablement — one switch, two domains

The follow-up gate reuses `.council.json`'s reserved top-level `gate` section and
its single `mode` key ([[council-config]], [[metered-deliberation-routing]]).
There is no second operator surface and no per-domain mode. `off` leaves step 13
as an unqualified human review that still carries the dedup pass; `advisory`
renders the decision as information without enforcing; `active` applies the
disposition — but only after confirmation ([[confirmation-authority]]).

## The mechanism

- **Data** (EV-78): packaged `council/gate/followup/questions.json` and
  `decision.json`, resolved whole-file first-hit by [[override-resolution]],
  failing loud on any unknown key or invalid value. `thresholds` is the
  named-key object `{merge, drop}` with strict `merge < drop`
  (`vault/raw/2026-09-21-po-ev78-thresholds-schema-ruling.md`); an override
  rule's `disposition` is restricted to `{Merge, Drop}` — `File` has its own
  mechanisms (the floors and the composite else-arm), so overrides force only
  the destructive dispositions.
- **Decision** (EV-79): `decideFollowup` is pure (no fs/network/model) and
  evaluates **confidence floors → hard overrides → the weighted composite**, so
  `Merge`/`Drop` are unreachable on an unanswered or below-floor answer
  (precedence pinned by R4; a firing override below its floor returns `File`).
  It returns one disposition plus a single-line, byte-stable basis.
- **State packing** (EV-80): `buildFollowupState(candidate, repoRoot, siblings,
  boardPath)` packs fixed declared sections — candidate, board/open-card targets,
  same-run siblings — under per-section caps (2000/22000/6000) against the
  policy's `gateStateBudgetTokens`; over-budget state is tail-cut and recorded as
  a `DropRecord`. The cards dir resolves from `dirname(boardPath)`; it never
  reads `.pi/council/runs/`.
- **Transport** (EV-81): `runFollowupGate` reuses the card gate's pinned model
  and decisions endpoint (`GATE_PINNED_MODEL`, `GATE_ENDPOINT`) with the same
  fail-closed posture — any refusal/timeout/non-2xx/unparseable/unresolved
  credential records `gate call failed: <reason>` and falls back to the human.
- **Composition + render** (EV-82): `runFollowupReview` (`extensions/followup-tool.ts`)
  is the one engine-side site that loads both followup files; step 13 records the
  decision and renders it ([[step-13-followup-surface]]).
- **Routing** (EV-83): `/features-deliver` Phase 3 and [[council-runner]] route
  each surfaced candidate through the decision; a failed/unresolved call returns
  the candidate as `ESCALATION` before any write. The outcome rides `DONE` and
  `ESCALATION` only; `RETIRED` keeps its card-withdrawal meaning verbatim.

## The failure arm in practice (EPIC-15)

The fail-safe is not theoretical. In the EPIC-15 run `gate.mode` was `active`
but **every** follow-up call failed with the `noul` answer-shape drift (the same
open `FLLWUP-104` that breaks the card gate), and the runner container is not
granted the review tool at all — so step 13 could not record a disposition
in-container. Candidates were **held by draft title** across the runner's `DONE`;
⚠️ EPIC-15-scoped: the `followup` grant is present in-container since EPIC-23
([[confirmation-authority]], [[council-runner]]).
the orchestrator's own `council_followup_gate` then failed with the drift, and
[[product-owner]] ruled the dispositions directly (seat-ruled, not
gate-recorded). The held-not-filed discipline held: no card written, no
candidate silently dropped. A resolved decision would still have been
**ratified**, never applied as the human confirmation
([[confirmation-authority]]). See [[inert-gate-fallback]].

**Resolved 2026-09-22** (`e903b67`): the `noul` wire-shape drift was fixed at
the shared parse seam ([[decisions-wire-canonicalization]]). The gate now
records real dispositions — the four held BUG-2 candidates returned `status:
"ok"` and were ratified by [[product-owner]] (three `File` →
`FLLWUP-109/110/111`, one amended to `Drop` with dissent). The failure arm
above remains the documented fallback. See [[2026-09-22-gate-noul-fix]].

## Held candidates routed by the orchestrator (EPIC-15 residual run, 2026-09-23)

With the gate fixed, the EPIC-15 residual run's FLLWUP-107 surfaced two step-13
candidates, but the runner returned `DONE`-with-held rather than the contract's
`ESCALATION`. The orchestrator routed the drafts by title to [[product-owner]]
(job-10) under the run's re-homed confirm gate: candidate 1's recorded `Merge`
had **no target** and was overturned to **`File`** (→ `FLLWUP-112`); candidate
2's `File` was confirmed (→ `FLLWUP-113`). The held-not-filed discipline held —
no card written before the confirming ruling. Witness:
[[2026-09-23-epic15-residual-run-ledger]].

## Witness

[[2026-09-22-epic10-run-ledger]] — the run that shipped EV-78…EV-84; and the
end-to-end falsifier (EV-84) that exercised the active/off/unreachable arms.
Its live arm also surfaced the shipped card gate's noul wire-shape drift
([[metered-deliberation-routing]] Residuals, FLLWUP-104).

## Not the same as board curation

This gate decides **one candidate's** disposition at step 13, per run. The
periodic consolidation of the accumulated `FLLWUP` backlog — merging
near-duplicates and retiring dead cards across many runs — is a separate,
human-directed operation ([[follow-up-backlog-curation]]), never driven by Jev
and never re-opening the runs that filed the cards.

## Related

- [[follow-up-backlog-curation]] — board-level merge/retire maintenance of the
accumulated follow-up backlog
- [[metered-deliberation-routing]] — the twin decision domain and its shared switch
- [[confirmation-authority]] — whether a recorded decision may be applied autonomously
- [[step-13-followup-surface]] — the rendered line + unavailable states
- [[council-config]] — the `gate` section both domains read
- [[override-resolution]] — the whole-file first-hit resolution
- [[product-owner]] — the seat that ratifies a candidate
- [[followup-merge-and-auto-ingest]] — the superseded pre-cut plan

## Sources

- [[2026-09-23-fllwup-backlog-cleanup]] — board curation is distinct from this gate
- [[2026-09-22-epic10-run-ledger]]
- `council/cards/EV-78.md`…`EV-84.md`
- `vault/raw/2026-09-21-po-epic10-recut-ruling.md`, `vault/raw/2026-09-2*-po-ev8*.md`