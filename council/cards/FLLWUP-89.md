---
id: FLLWUP-89
title: Give /features-new a run-start preflight step — its seat dispatches share the gate-credential hole
state: Backlog
owner: null
epic: EPIC-14
goal: /features-new gains a run-start preflight invocation (the same council_preflight-then-preflight.sh sequence /council step 0 and /features-deliver Phase 0 run) or a recorded ruling that it deliberately has none, so its seat dispatches are not exposed to a gate-on-no-credential start that EV-76's check does not cover.
---

## Intent

Surfaced by the owner in EV-76 round 1: `council/procedures/features-new.md`
contains no preflight step today (verified: no preflight invocation in the
file). EV-76's run-start check covers `/council` step 0 and `/features-deliver`
Phase 0 only. A `/features-new` session in a repo with the gate enabled and no
OpenRouter credential reaches seat dispatches before any credential check.
Converged "not owed for EV-76" (out of that card's scope) — this is the
follow-up.

## Acceptance

- The three run-start surfaces (`/council` step 0, `/features-deliver` Phase 0,
  `/features-new` step 0) either all run the same credential-conditional check
  or the exclusion is a recorded product-owner ruling, not an omission.
- If added, the off-mode behavior for `/features-new` adds nothing (same
  add-nothing property EV-76 pinned).
