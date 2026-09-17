---
id: FLLWUP-51
title: Loud gate for a goal wrapped onto a second line
state: Backlog
owner: null
epic: EPIC-9
goal: A goal wrapped onto a second line is detected loudly rather than silently truncated to its first line, so a wrapped goal is refused with a diagnostic naming the wrap instead of validating green, proven by a test that fails on today's silent-exit-0 behavior.
---

## Intent

Skeptic objection 3 (FLLWUP-43 step 4, `closed-green`) settled that a goal
wrapped onto a second line parses to its first line and `council/validate.py`
exits 0 — a silent loss path in the field FLLWUP-43's deliverable governs.
Product-owner R1 ruled the wrap out of scope for FLLWUP-43 and owed as a
step-13 follow-up: `gate-parity` forbids shipping a writer-side wrap-FAIL as a
sibling of the colon ban FLLWUP-43 deletes, so this card must ship a loud gate
that is gate-parity-consistent (matched by the loader/dispatch, or an
equivalent documented surface fix) rather than a writer-only check.
FLLWUP-43's shipped copy documents the hazard ("a line break ends the value");
this card makes it loud instead of silent.