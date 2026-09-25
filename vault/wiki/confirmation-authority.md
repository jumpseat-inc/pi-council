---
title: Confirmation Authority
type: concept
summary: The EPIC-10 ruling — under `gate.mode: active` a recorded engine-minted disposition is the disposition SOURCE, never the human confirmation; a runner escalates each candidate for ratification by a ruling seat before any card is written, because the autonomous authority map is exhaustive and a model call is not a row in it.
aliases: [confirmation authority, recorded decision confirmation, ratification, pre-write confirmation]
tags: [pi-council/concept, pi-council/features-deliver, pi-council/epic10]
sources: ["[[2026-09-22-epic10-run-ledger]]", "[[2026-09-22-design-epic11-recut-surface]]", "[[2026-09-22-epic15-run-ledger]]", "[[2026-09-23-epic15-residual-run-ledger]]", "[[2026-09-24-epic23-run-ledger]]", "[[2026-09-24-epic24-run-ledger]]", "[[2026-09-25-epic25-run-ledger]]"]
created: 2026-09-22
updated: 2026-09-25
---

# Confirmation Authority

## The question

When an autonomous run reaches `/council` step 13 and a card's follow-up
decision has been **recorded** by the Jev gate under `gate.mode: active`, does
that engine-minted result count as the human confirmation the step requires — so
the runner may apply the disposition and write the card on `DONE`?

## The ruling

**No.** The recorded decision is the container's **disposition source**, never
its **confirmation**. In-container, the confirmation act belongs to a ruling
seat reached through the orchestrator's existing `ESCALATION` service
([[council-runner]], [[product-owner]]). A runner with a resolved `active`
decision still escalates: it carries each drafted candidate by title with the
recorded `Mode:` line verbatim as the disposition to be **ratified**, writes
nothing, and applies + writes only on the resumed dispatch whose input contains
the confirming ruling.

`active` still buys something: it converts the confirming seat's act from
**re-deciding** into **ratifying**. The three modes differ only in what the
escalation packet carries:

| `gate.mode` | The packet carries | The confirming seat |
|---|---|---|
| `off` | no line | decides from scratch |
| `advisory` | the line as information only | decides; the recorded line is not enforced |
| `active` | the recorded disposition | ratifies (or rejects) the recorded line |

`advisory` therefore routes to `ESCALATION` exactly like the `off` arm, carrying
the rendered advisory line as information, writing nothing. Attended `advisory`
runs are untouched — step 13 governs there.

## Why it is not inferable

The [[deterministic-merge-check|authority map]] declares itself **complete and
exhaustive** over the human's reserved powers and forbids inferring authority
from the autonomy mandate — "covered means routed to a human … not decided by
inference from this table's spirit." A model call is not a row in that table.
Ruling the other way would also make the gate **circular** (no party independent
of the decider between "a model returned `File`" and "a card exists") and would
contradict the shipped, prose-tested step 13 ("the confirmation precedes any
card write, in every mode"; `test/prose.test.ts`), rendering EV-83's own
"zero unconfirmed cards" adjective weightless.

## Reversibility and cost

The chosen direction is the cheap-to-reverse one: the cost of the ruling is
**one ruling-seat round-trip per follow-up-bearing card** (paid, and recorded,
on all seven EPIC-10 cards). The alternative — treating the recorded decision as
consent — would leave cards on the board that no party approved, written under a
disposition the human never read, and `FLLWUP-69` records that **no code enforces
the write path**. The guarantee is prose plus a judgment seat, which is exactly
why a seat stays in front of the write.

A run-scoped pre-authorization for a later run is a human Phase-1 act (the same
shape as [[record-push-discipline]]'s P1-PR grant), named by the ruling as the
route to cheaper — not mintable by a seat.

## Witness

[[2026-09-22-epic10-run-ledger]] — the ruling (`vault/raw/2026-09-22-po-ev83-confirmation-authority-ruling.md`)
governed every step-13 write of the run. The EPIC-15 residual run exercised the
held-then-ratified path again: a runner returned `DONE`-with-held, the
orchestrator routed the drafts to [[product-owner]], which overturned an
unsupported `Merge` to `File` — no card written before the confirming ruling
([[2026-09-23-epic15-residual-run-ledger]]).

## EPIC-23 witness (2026-09-24)

Both arms again in one run. EV-90's step-13 candidates correctly reached a ruling
seat by `ESCALATION` and were ratified `File` (three cards filed). EV-89's runner
instead returned `DONE`-with-held for its two candidates (like FLLWUP-107's runner
in EPIC-15), so no confirming dispatch ever carried them; nothing was written,
but the contract's escalation obligation was not honored
([[step-13-followup-surface]]). Witness: [[2026-09-24-epic23-run-ledger]].

## EPIC-24 witness (2026-09-24)

Five candidates across the three cards, all rendered by the `active` step-13 gate
and all ratified `File` by [[product-owner]] (jobs 5/8/13, plus the in-run
FLLWUP-116 scope ruling job-11); each was applied on a confirming runner
dispatch and written as its own card (FLLWUP-117–121). Unlike EPIC-23, **no
runner returned `DONE`-with-held** — every candidate reached a ruling seat and the
return-drift did not recur this run. Witness: [[2026-09-24-epic24-run-ledger]].

## EPIC-25 witness (2026-09-25)

Three candidates from the batch container's step-13 gate: two ratified `File`
(FLLWUP-122, 123) and one **dropped** — the watch-only "watch stub-child for
recurrence" placeholder, which [[product-owner]] ruled a stale-prone candidate
whose trigger is externally observable and would be better filed fresh, with
evidence, on recurrence. No `DONE`-with-held drift; every candidate reached a
ruling seat. Witness: [[2026-09-25-epic25-run-ledger]].

## Related

- [[followup-decision-gate]] — the decision whose application this governs
- [[step-13-followup-surface]] — the recorded line and the pre-write pin
- [[council-runner]] — the container that must escalate rather than apply
- [[product-owner]] — the ratifying seat; [[steward]] — not reached
- [[2026-09-24-epic24-run-ledger]] — five `File` ratifications, no return drift
- [[deterministic-merge-check]] — the sibling "mechanical replaces the human" gate
- [[inert-gate-fallback]] — what happens when no recorded decision exists at all
- [[record-push-discipline]] — the other run-scoped human authorization

## Sources

- [[2026-09-22-epic10-run-ledger]]
- `vault/raw/2026-09-22-po-ev83-confirmation-authority-ruling.md`
- `council/procedures/council.md` §13, `council/agents/council-runner.md`