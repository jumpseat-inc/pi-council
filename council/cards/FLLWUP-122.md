---
id: FLLWUP-122
title: Build the FLLWUP-120 stale-ctx pin on the real pi runner harness
state: Backlog
owner: null
epic: EPIC-26
goal: The stale-ctx coverage is extended to drive the real pi extension runner (ev40-live-gates-style harness) so the `renderWidget` guard is pinned against pi's actual ctx lifecycle, not only the modeled ctx that FLLWUP-120's test uses, and `bun test` stays green on the merged tree.
---

## Intent

FLLWUP-120 (Done, merged in EPIC-25's batch PR #117 at `02d73f2`) covered
the print-mode stale-ctx parent crash with a test that reproduces the crash
class and pins the engine's settled behavior. Its owner recorded a tradeoff:
the test drives a **modeled** ctx, not the real pi extension ctx lifecycle.
The deliberation and the step-13 gate surfaced extending that coverage to
the real runner harness as the next increment — pin the `renderWidget`
guard against pi's actual ctx lifecycle, ev40-live-gates-style.

Implementation note carried from the confirming ruling: the harness must
stay within the [[test-suite-budget]] live-arm envelope.

Filed from the EPIC-25 batch step-13 gate (candidate 1, draft title "Build
the FLLWUP-120 stale-ctx pin on the real pi runner harness"),
product-owner-ratified `File` 2026-09-24 (confirming ruling, job-17 of the
EPIC-25 batch container, job-16; recorded gate basis: composite 0.55 <
merge threshold 1.00 — active mode).

## Acceptance

1. A test drives the real pi extension runner (ev40-live-gates-style
   harness) through a dispatched job settling after its parent turn's
   teardown, exercising the actual ctx lifecycle pi provides.
2. The test pins the `renderWidget` guard's settled behavior against that
   real lifecycle — no unhandled stale-ctx crash escapes on the path, and
   the harness stays within the [[test-suite-budget]] live-arm envelope.
3. `bun test`, `bunx tsc --noEmit`, and `python3 council/validate.py` stay
   green on the merged tree.
