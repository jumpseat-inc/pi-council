---
title: Phase 1 Rulings Record
type: concept
summary: EV-89 (EPIC-23) — /features-deliver's Phase 1 gains a durable, class-enumerated rulings record at council/phase1-rulings.json (schema `ruling` | `n/a: <reason>`), a `Phase 1 unresolved: <class>` refusal fence against dispatching a runner while a class is unresolved, and an authorization clause for committing the record to main.
aliases: [phase 1 rulings, phase1-rulings.json, class-enumerated record, phase 1 front-loading]
tags: [pi-council/concept, pi-council/features-deliver, pi-council/epic23]
sources: ["[[2026-09-24-epic23-run-ledger]]"]
created: 2026-09-24
updated: 2026-09-24
---

# Phase 1 Rulings Record

`/features-deliver` Phase 1 front-loads the foreseeable open-judgment rulings
before any `council-runner` is dispatched, so a card that hits a front-loaded
question applies the ruling instead of paying an `ESCALATION` round-trip. Before
EV-89 that was **prose only**: Phase 1 named the predictable classes in passing
and wrote rulings onto card faces, enumerating nothing — a reader could rephrase
it into nothing and proceed.

## What EV-89 ships (EPIC-23, merged `593f6ed`)

- A **closed, ordered class list** in `features-deliver.md` Phase 1 — surface
  copy; state/field naming; uncertainty display; error/empty-state text; the gate
  user-visibility question — as the single source the run reads.
- A **durable, named record** at `council/phase1-rulings.json`, covered by a
  grammar-only `council/validate.py` fence. Durable and run-level because a
  settled runner job cannot be re-entered, fresh runners rewrite card faces on
  resume, and some classes have no single owning card.
- Schema: each class entry carries either a `ruling` (non-empty string) or a
  `reason` (`n/a: <reason>` prefix). No version field — the same Phase 1 that
  writes the record reads the current procedure, so there is no drift consumer.
- A **refusal fence**: `Phase 1 unresolved: <class>` — a distinct literal, not
  the run's generic `HALT:` environment-failure line — halts dispatch while a
  named class is unresolved.
- The classes render in **three stakes tiers** (per-card reversible →
  run-committing → portfolio-level), not a flat checklist.
- A recorded class ruling **binds every seat for that class only**: it does not
  remove [[designer]] from deliberation on surface-touching cards
  ([[council-loop]] step 6).

## The authorization clause

Committing `council/phase1-rulings.json` to `main` is a privileged direct write
([[record-push-discipline]]). EV-89 ships the FLLWUP-60-shaped clause:
**unconditional about the requirement** (any run that commits the record needs a
recorded, run-scoped, human-granted Phase-1 authorization *before* its first
record push; unauthorized ⇒ `HALT`) and **silent on when population happens**.
The product-owner D-ruling in EPIC-23 held **mechanism only** for that run — the
card's goal names the mechanism, not this run's data, so population failed the
fold-in test.

## Why it matters

Front-loading is only as good as its enforcement. The record turns Phase 1 from a
paragraph a reader can skip into a fenced artifact a runner cannot bypass — and it
moves the predictable surface-copy rulings out of the escalation path
([[run-time-profile]]: each escalation re-pays the full runner cold start).

## Related

- [[council-runner]] — the container that reads the record at `<escalation_contract>` step 1
- [[engineering-board]] — the card faces the record is distinct from
- [[record-push-discipline]] — the authorization clause the record push requires
- [[followup-decision-gate]] — a different, per-run confirmation surface
- [[run-time-profile]] — the escalation cost the record reduces
- [[designer]] — the seat a class ruling must not displace

## Sources

- [[2026-09-24-epic23-run-ledger]]
- `council/cards/EV-89.md`, `council/phase1-rulings.json`