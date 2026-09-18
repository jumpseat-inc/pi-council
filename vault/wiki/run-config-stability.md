---
title: Run Config Stability
type: concept
summary: A committed .council.json seat-model change mid-run silently alters which models every later dispatch uses; a Phase-0 config-stability assertion (and scope-pure commits) prevents an unruled reassignment from entering a run's provenance.
aliases: [config stability, council.json drift, config drift]
tags: [pi-council/concept, pi-council/features-deliver]
sources: ["[[2026-09-17-epic9-residual-run-ledger]]"]
created: 2026-09-17
updated: 2026-09-17
---

# Run Config Stability

`.council.json` is the committed per-repo override surface for seat
model/thinking ([[council-config]]). It is read at dispatch time, so changing it
mid-run changes which models answer every subsequent dispatch.

## The incident

In the 2026-09-17 EPIC-9 residual run, commit `46c1c97` ("docs(council):
FLLWUP-48 step 2 …") bundled three seat reassignments — consolidator →
`qwen/qwen3.8-flash`, council-runner → `z-ai/glm-5.3-flash`, skeptic →
`deepseek/deepseek-v4-flash-0731` — into an unrelated card's record commit. It
was not ruled, not part of any card's goal, and took effect for the run's tail;
the `FLLWUP-48` runner then reported its consolidator model being upstream
rate-limited (429s).

## Discipline

- **Scope-pure record commits.** A record commit must contain only board/card
  state; a stray working-tree edit must not be swept in by `git add -A`. This is
  the EPIC-6 staged-set lesson ([[council-runner]]) applied to config.
- **Phase 0 should assert config stability.** Reading `.council.json` at run
  start and detecting a change before later dispatches makes an unruled
  reassignment visible instead of silent. As of this run it is a proposal, not
  yet implemented.
- **Provenance.** The hub records actual per-dispatch usage regardless of which
  model answered, so usage blocks stay accurate ([[usage-accounting]]); what is
  lost is the *uniform* model provenance across a run's cards.

## Related

- [[council-config]] — the override surface
- [[council-runner]] — the scope-pure record-commit discipline
- [[usage-accounting]] — actual usage is unaffected; provenance is
- [[2026-09-17-epic9-residual-run-ledger]]

## Sources

- [[2026-09-17-epic9-residual-run-ledger]]
- `.council.json`, commit `46c1c97`
