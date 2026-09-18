---
id: EPIC-11
title: Grounded, interview-driven council setup via /council-setup
state: Backlog
owner: null
epic: null
goal: Add a model-run procedure /council-setup that (1) grounds itself in the consuming repository before asking anything, (2) interviews the human through the rpiv-ask-user-question extension, with a recommendation attached to every question, and (3) writes a fitted configuration through a consent-gated, non-clobbering, code-validated path — without ever forking the packaged seat convictions or relaxing the council's core opinions.
---

## Intent

/council-init scaffolds a consumer repository mechanically and blind: it installs the council's dependencies and copies the scaffold tree, seeding .council.json with the council's own packaged defaults, so a consumer receives the council's opinions with no fit to their codebase, stack, or surfaces. This epic adds /council-setup, a model-run procedure that grounds itself in the consuming repository before asking anything, interviews the human with a recommendation on every question, and writes a fitted configuration through a code-validated, consent-gated path — while the council's core opinions stay frozen: seat convictions modeled on a real person, the <repository_grounding> block in every seat, a per-seat intelligence tier, and model diversity across the roster. /council-init keeps its engine duties (deps + non-clobbering scaffold) and hands off to /council-setup in the same turn; /council-setup is independently re-runnable and shows the current effective configuration as the default answer.

## Acceptance

The epic is complete when an invariant-violating proposed profile is refused by the validator with the specific violation literal named, no packaged seat conviction body is modified or forked, <repository_grounding> is present in every seat, every write is preceded by explicit consent and a timestamped backup, and re-running /council-setup changes nothing that already matches.
