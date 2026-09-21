---
title: Product Owner
type: entity
summary: The Council's product-judgment seat — rules open-judgment disputes, fold-in rulings, and mid-flow product decisions; card-level rulings are final among agents; portfolio matters escalate.
aliases: [product-owner seat]
tags: [pi-council/seat]
sources: ["[[2026-09-11-epic7-run-ledger]]", "[[2026-09-15-epic8-run-ledger]]", "[[2026-09-16-epic9-run-ledger]]", "[[2026-09-17-po-fllwup47-step6-ruling]]", "[[2026-09-21-po-ev73-step6-ruling]]", "[[2026-09-21-po-ev77-j1-j2-ruling]]", "[[2026-09-21-epic14-run-ledger]]", "[[2026-09-22-epic10-run-ledger]]"]
created: 2026-08-23
updated: 2026-09-22
---

> ⚠️ Derived from `council/agents/product-owner.md` (captured 2026-08-23). Verify against the seat file.

**Model:** `openrouter/qwen/qwen3.8-flash:high`.
**Tools:** Read, Grep, Glob, Write (Write scoped to `vault/raw/` only).
**MCP:** none.
**Superpowers pointers:** none (judgment seat).

## Role

Decides what the product should be when no test can decide it. It does not
design, implement, or merge — it **settles the what**, the owner keeps the how.

Rejects the wrong instruments (engagement, retention, stickiness — this is a
free public product, not software-with-a-market). **Mechanism × user value** is the
operative pair; a ruling that satisfies the mechanism but not the value failed.

## Cases

1. **Open-judgment disputes** — rule; do not split scope to half-settle.
2. **Fold-in rulings** — work folds into the live card **iff** the work is
   needed to honestly meet the existing `goal` read as written. A new card is
   anything requiring an edit to the goal (immutable once In Progress).
3. **Mid-flow decisions** — rule promptly.
4. **Promotion ratification** for Backlog → Ready.
5. **Wave-3 decomposition ruler** (v0.15.0) — in `/features-new`'s
   [[three-wave-decomposition]], product-owner runs last, unconditionally,
   and **rules but never generates**: it ratifies/amends the epic goal and
   child states, rules disputes with dissent named. The EV-10 step-6 ruling
   rejected PO-as-wave-1-author precisely because authoring the epic goal
   and then ruling on it in wave 3 is a self-review loop the human at the
   gate cannot see — the structural expression of "decide the what, never
   design the how". Ruled EPIC-3's three mid-run escalations this way.

### EPIC-7 (v0.18.0) — the goal-as-defect precedent

EV-29's goal asked for "per-component cost figures reported by the provider";
the provider has **no per-component dollar source at all** (see
[[cost-provenance]]). Product-owner ruled the copy and record-shape items and
escalated the goal wording to [[steward]], which amended the card goal in
place. The general lesson: **a goal that must be reinterpreted against its own
words to be satisfiable is the defect**, and goal-wording authority is the
steward's. Product-owner also ruled EV-30's record shape (no `total`, per-half
basis) and EV-31's read-back semantics in the same run.

### EPIC-8 (v0.18.0) — acceptance amendment + cross-card ruling reach

EV-33's `goal` named "one accessor consumed by both the tree row copy and the
transcript header", while its Acceptance bullet 4 said "no render code
changes". Product-owner ruled (job-6) the accessor is **exported** for EV-34 to
consume — the goal describes a **post-epic endpoint**, so bullet 3 was amended
and the goal stood. An Acceptance section is an amendable surface; the goal is
not ([[engineering-board]]).

EV-35's five-item ruling (job-12) is the run's other defining call:
`classifyProgressKey` is a **fold-in** (its honesty claim was already false on
smoke-tested terminals), no header pin (overflow deferred), presence/absence
follow copy, an EV-9 test narrowing plus a positive `▌` assertion, and the
visible-index cursor scheme (Q5). EV-36 (job-17) then ruled Q1 = **R3**
(read-only effective index) and — the precedent — that **EV-35's Q5 anti-goal
reaches EV-36's R2 writeback**, clarifying its own prior ruling rather than
reversing a human decision. See [[one-row-floor]].

## Grounding and escalation

Rules from the vault wiki + board history; a ruling citing nothing is a "coin
flip." Escalates to [[steward]] whenever the ruling would change the **portfolio**
(declining a card, permanent residual, touching a recorded decision, a goal found
to be the real defect).

## Exercised in EPIC-9 (2026-09-16)

- **R5's surface was the dispute** (job-17). EV-40's Q1 asked whether the
  Phase-1 countdown belongs on the input bar (R5) or may re-pin to the status
  row; product-owner ruled R5 binding — implementing via `setEditorComponent`
  and naming [[designer]]'s dissent — because changing the recorded per-branch
  observable would reverse a human decision. It also ruled Enter re-arms with a
  fresh budget, headless Esc is SIGINT, headless Enter is exit 75 plus the final
  stdout line, and the input bar stays interactive during backoff. See
  [[parent-turn-continuation]].
- **Gate on the mechanism's existence first** — it ratified the EV-40 plan only
  after gating it on P1 (does a timer-deferred send survive print-mode
  teardown) and D1 (is the post-error message list actually malformed), the
  must-settle-before-implementation class.
- **Naming vs existence** (job-13) — EV-43's goal required the observable be
  "named in the acceptance"; the acceptance named an input-bar delta that
  cannot exist for a reachability probe. Ruled (B), the naming requirement,
  with the Acceptance amended and the goal standing.
- **A dead literal branch is an owner-routable fix, not a goal defect** (job-8)
  — EV-37's `Intent` binds "the literal" to pi's emitted message, so the
  colon-free goal spelling is structurally forced and the fix is code + test.
  See [[retry-classification]].
- **Figure-scoped disclosure** (job-24) — `partial` applies only when a figure
  exists; an all-unaccounted retried record renders `n/a` only. See
  [[figure-scoped-disclosure]].
- **The denominator-carrier call** (job-20) — inject the init-time
  [[retry-policy]] snapshot into the renderers rather than persist
  `maxAttempts` on the manifest (cheaper to reverse; does not widen the
  substrate EV-42 owns).

### FLLWUP-47 step 6 (2026-09-17) — the red-base evidence ruling

Ruled the six open-judgment items on the [[red-base evidence]] convention
(job-17): skeptic-derives-only for the mechanism-absent boundary (R1),
head-half replaces the landing statement (R2), craft delegations with
constraints for the shared block and pins (R3–R5), and — the fold-in test
exercised on documentation — the wiki-ingest is a standing offer, not a
fold-in (R6): the seat prose alone meets the card's goal; a wiki page
documents rather than fixes. See [[2026-09-17-po-fllwup47-step6-ruling]].
Also the seat that confirmed and steered the FLLWUP-54 wiki-ingest that
executed the offer — the lineage is recorded on [[red-base evidence]].

## Exercised in EPIC-14 (2026-09-21)

- **The fold-in test.** EV-73's step-6 ruling refused to fold EV-75's enriched
  migration `FAIL:` into EV-73: *a work item folds into a live card iff it is
  needed to honestly meet that card's goal as written.* Shipping the copy early
  would make EV-75's loud-migration falsifier pass vacuously on code it did not
  write. Same shape as EV-71's "P4 and P7 are follow-up cards, not fold-ins — the
  literal is fixed by the goal; the judge reads the goal" and EV-7's OV-2. See
  [[2026-09-21-po-ev73-step6-ruling]], [[engineering-board]].
- **Docs cards and mechanical pins (J2).** The seat ruled a docs card MAY ship
  test files, but the pins belong in `test/`, never `council/validate.py` —
  packaged tooling would hardcode this repo's layout into consumer repos. See
  [[2026-09-21-po-ev77-j1-j2-ruling]], [[test-suite-budget]].

## EPIC-10 (2026-09-22) — ratification as a distinct act

This seat ruled eight times in the EPIC-10 run and was never escalated past — no
[[steward]] dispatch. The run added a distinct mode of invocation:
**ratification**. Under `gate.mode: active` a recorded follow-up disposition is the
*source*, not the confirmation, so a runner escalates each candidate for this seat
to ratify rather than re-decide ([[confirmation-authority]]). The seat also ran the
fold-in and re-card-trigger discipline (`FLLWUP-96`/`99`/`100`/`104`) and rewrote
one of its own prior rulings' referents (`FLLWUP-96`'s blocker). Witness:
[[2026-09-22-epic10-run-ledger]].

## Related

- [[seats]], [[council-loop]], [[designer]]/[[consolidator]] — consumers
- [[steward]] — its escalation target
- [[council-config]] — model/thinking override
- [[engineering-board]] — the fold-in test and goal-amendment discipline

## Sources

- `council/agents/product-owner.md`
- [[2026-08-23-pi-council-design-spec]]
- [[2026-09-04-epic3-run-ledger]] — the wave-3 ruling-only precedent + three rulings
- [[2026-09-11-epic7-run-ledger]] — the goal-as-defect escalation (EV-29) + seven ruling dispatches
- [[2026-09-17-po-fllwup47-step6-ruling]] — the red-base evidence ruling (R1–R6, incl. the R6 fold-in call)
- [[2026-09-21-po-ev73-step6-ruling]] — the fold-in test (EPIC-14)
- [[2026-09-21-po-ev77-j1-j2-ruling]] — docs-card pins in `test/` (EPIC-14)