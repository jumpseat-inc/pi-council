---
id: FLLWUP-35
title: Usage/accounting wiki page for the EPIC-7 lineage
state: Backlog
owner: null
epic: EPIC-17
goal: `vault/wiki/usage-accounting.md` documents the EV-28 through EV-32 usage chain — the token and cost tuple with provenance, the invocation-scoped two-half SpendRecord, the durable store at `getAgentDir()/council/usage/`, and the five-exit usage block — and `vault/wiki/index.md` links it.
---

## Intent

Every EV-28/30/31/32 deliberation recorded the same gap: the vault has no
usage/accounting page, so seats grounded on cards and specs. EV-32's spec §5
names a usage/accounting wiki page as a natural step-14 candidate. This card
captures that durable knowledge work, including the two halves' distinct
bases, the three boundary forms (user-message, marker, unresolved), the three
whole-block states, and the store home.

## Acceptance

- `vault/wiki/usage-accounting.md` exists and is linked from
  `vault/wiki/index.md`.
- It names the two halves' distinct bases, the three boundary forms, the three
  whole-block states, and the store home.
- No code change; `python3 council/validate.py` stays clean.
