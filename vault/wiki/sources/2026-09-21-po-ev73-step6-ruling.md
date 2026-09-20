---
title: 2026-09-21 PO EV-73 Step-6 Ruling
type: source
summary: product-owner (job-2) rules the enriched legacy-`mode` migration FAIL ships on EV-75 not EV-73 (the fold-in test, and keeping EV-75's falsifier non-vacuous), and scopes refusal class 4 to the three `decision.json` `decide()`-interpolated strings, dropping `weights` keys.
aliases: [po-ev73-step6-ruling, EV-73 ruling, fold-in test source]
tags: [pi-council/source, pi-council/epic14, pi-council/product-owner]
sources: []
created: 2026-09-21
updated: 2026-09-21
---

# 2026-09-21 PO EV-73 Step-6 Ruling

The EPIC-14 card EV-73's step-6 escalation (items (a) and (b)) ruled by `product-owner`
(job-2) during the [[2026-09-21-epic14-run-ledger]].

## Item (a) — the migration `FAIL:` ships on EV-75, not EV-73

EV-73 removes `mode` from `policy.json`'s accepted keys and lets the **generic** unknown-key
`FAIL:` fire; the one-key specialization is EV-75's deliverable, exactly as its goal reads.
The owner's proposed bytes are adopted as EV-75's candidate copy (file + key +
`.council.json` `gate.mode`, under EPIC-14 R5).

The decisive reasoning is the **fold-in test**: *a work item folds into a live card iff it is
needed to honestly meet that card's goal as written.* EV-73's goal names the mechanism and
the loudness, never the copy; EV-75's goal names the copy itself. Shipping it early would
make EV-75's loud-migration falsifier **pass vacuously on code it did not write**. Precedent
chain: EV-71's "P4 and P7 are follow-up cards, not fold-ins — the card's literal is fixed by
the goal; the judge reads the goal", and EV-7's OV-2 split.

The ruling also separates run-exit conditions (R5) from per-card mechanisms (job-33): both bind
at their own scope, and neither demands the first card carry the last card's prose.

## Item (b) — class 4 scopes to `decision.json`'s three override strings

Refusal class 4 is a `loadGateDecision` refusal on `overrides[i].question`, `overrides[i].option`,
`overrides[i].basis` — the only `decision.json` strings `decide()` interpolates into a basis
line. It does **not** reach `questions.json`/`loadGateQuestions` (a fifth class in a second
loader, named by no card — it becomes a follow-up instead). `weights` keys are **dropped**:
`decide()` uses them as numeric multipliers only, so a newline key there cannot render a basis;
keeping the check would make the refusal copy assert a mechanism that does not exist. The goal
line is amended (narrowed) so the judge is not left with the ambiguity.

## Related

- [[2026-09-21-epic14-run-ledger]] — the run
- [[engineering-board]] — the fold-in test and goal-amendment discipline
- [[product-owner]] — the ruling seat and its precedents
- [[metered-deliberation-routing]] — the loader surface the class-4 refusal lives on
- [[2026-09-21-epic13-run-ledger]] — the gate this ruling tunes

## Sources

- `vault/raw/2026-09-21-po-ev73-step6-ruling.md`
- `council/cards/EV-73.md`, `council/cards/EV-75.md`