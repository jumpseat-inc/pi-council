---
title: Judge
type: entity
summary: The fresh-context stop-condition evaluator — returns PASS/REJECT against a card's stated goal, deliberately sharing no context with the seats that produced the work.
aliases: [judge seat]
tags: [pi-council/seat]
sources: []
created: 2026-08-23
updated: 2026-08-23
---

> ⚠️ Derived from `council/agents/judge.md` @ (captured 2026-08-23). Verify against the seat file.

**Model:** `openrouter/qwen/qwen3.6-35b-a3b:medium`.
**Tools:** Read, Bash (Write is deliberately absent — the judge never edits).
**Superpowers pointers:** verification-before-completion only.
**Deliberately NOT a Council seat** — it shares no context with the grabbers or
the owner (fresh positive).

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

## Related

- [[seats]], [[council-loop]], [[skeptic]]
- [[owner]] — the implementer it evaluates
- [[council-config]] — default model/thinking override

## Sources

- `council/agents/judge.md`
- `council/procedures/council.md`