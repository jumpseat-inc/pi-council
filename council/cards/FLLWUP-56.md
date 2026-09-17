---
id: FLLWUP-56
title: Saturate the seat-dispatch provider-error arm onto a config-injected faux provider
state: Backlog
owner: null
epic: EPIC-9
goal: A falsifier exists for the seat child's own provider-error path — the parent-turn offline faux-provider harness reaching a real seat child — and its live-arm budget is accounted for in the suite-cost measurement.
---

## Intent

FLLWUP-49's step-4 O7 live half stayed `open-untested` (non-blocking): the faux
provider is structurally reachable in a real seat child via a scratch repo's
`.pi/extensions` + `.council.json` and `command: "pi"` with `-a`
(`seats.ts:600-621` has no `-e`/`--provider`), but running it would
re-architect the seat arm — changing what that falsifier proves — and add a
live arm to FLLWUP-48's budget. Filed as a residual, not a defect: if pursued,
it is a different card whose design owns the arm-cost accounting.

Approved by `product-owner` (job-29) as-is from FLLWUP-49's step-13 draft.
