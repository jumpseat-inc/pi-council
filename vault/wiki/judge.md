---
title: Judge
type: entity
summary: The fresh-context stop-condition evaluator — returns PASS/REJECT against a card's stated goal, deliberately sharing no context with the seats that produced the work.
aliases: [judge seat]
tags: [pi-council/seat]
sources: []
created: 2026-08-23
updated: 2026-09-04
---

> ⚠️ Derived from `council/agents/judge.md` (captured 2026-08-23). Verify against the seat file.

**Model:** `openrouter/qwen/qwen3.6-35b-a3b:medium`.
**Tools:** Read, Bash (Write is deliberately absent — the judge never edits).
**Superpowers pointers:** verification-before-completion only.
**Deliberately not a deliberation seat** — it shares no context with the generators or
the owner (fresh pair of eyes).

## Role

Decides one thing: **does the implementation meet the card's stated `goal`?**
Nothing else is in scope:

- Judges the goal against the evidence and **nothing more** — it is not a
  reviewer and proposes no improvements.
- **Confirms rather than trusts** the Skeptic's report (re-runs the decisive test).
- Returns `PASS` only when the goal is met and the evidence shows it; a required
  test that is red/missing/unverifiable is a `REJECT` — no partial credit.

It is deliberately handed **the card's goal + the Skeptic's evidence, nothing
else** — its value is that it owes no deference to the design.

## In the loop

- `/council` step 10 dispatches the judge. On `REJECT`, the card returns to
  `In Progress`. On `PASS`, the human merge gate proceeds.
- **A REJECT built on confabulated premises is re-dispatched, not argued**
  (EPIC-3 precedent, v0.15.0): one judge REJECT cited a nonexistent deleted
  paragraph and a misread acceptance clause; the runner verified both
  premises false against `git show`, re-dispatched the judge **once** with
  the corrected factual record (neutral — no verdict coaching), and the
  re-dispatched judge verified the branch independently and PASSed. The
  judge's fresh-context value survives only if the correction supplies
  **facts**, never the desired verdict. See [[council-runner]],
  [[2026-09-04-epic3-run-ledger]].

## Related

- [[seats]], [[council-loop]], [[skeptic]]
- [[owner]] — the implementer it evaluates
- [[council-config]] — default model/thinking override
- [[2026-09-04-epic3-run-ledger]] — the confabulated-REJECT re-dispatch precedent

## Sources

- `council/agents/judge.md`
- `council/procedures/council.md`