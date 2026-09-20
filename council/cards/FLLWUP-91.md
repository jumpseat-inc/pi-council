---
id: FLLWUP-91
title: Wrapped-tool council_preflight — own the preflight spawn on pass to make run-start single-FAIL mechanical
state: Backlog
owner: null
epic: EPIC-14
goal: a follow-up design evaluates promoting the rejected spawn-on-pass half of the EV-76 principal's round-1 proposal — council_preflight spawns bash council/preflight.sh itself when its gate check passes, returning the script's streamed output — so the run-start single-FAIL property loses its stop-on-FAIL obedience point, deciding by product-owner ruling whether the off-mode transcript-framing change and the larger tool surface (streaming, exit codes, card args) are worth the mechanical gain.
---

## Intent

EV-76's merged design deliberately rejected the spawn-on-pass half as card
creep: single-FAIL is ordering-conditional on invocation obedience (the same
trust class as the existing preflight.sh invocation), and the acceptance never
named spawning from the tool. The designer (round 2) and principal both
recorded that the wrapped-tool design is "mechanically stronger but a
postmortem nicety, not an operator-experience improvement". Recorded as a card
so the tradeoff is adjudicated on its own merits, never silently re-decided.

## Acceptance

- A product-owner ruling (escalating to steward per its criteria) either
  adopts the wrapped tool with the framing change recorded, or records the
  ordering-conditional design as final.
- If adopted: hub.ts untouched (AGENTS.md convention 7); off-mode output lines
  byte-identical; the transcript-framing deviation documented at the surface.
