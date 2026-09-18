---
id: FLLWUP-68
title: Cold-read persona smoke on /council-update's output surface (designer P1/P6/P9)
state: Backlog
owner: null
epic: EPIC-9
goal: The designer's cold-read predictions P1(amended)/P6/P9 on the FLLWUP-50 refresh surface are settled by the falsifier shape the deliberation specified — a fixture consumer repo (stale tooling + consumer-edited data, captured verbatim /council-update output) with a downstream persona read asserting (P1) the five/six-state table alone answers what would change without consent, what needs consent, what is protected, and what overrides are doing; (P6) the registerCommand description alone names the protected file classes; (P9) the output alone answers what the command is allowed to touch — with any failed prediction grounding a copy fix, not a mechanism change.
---

## Intent

Filed by the FLLWUP-50 step-13 record (EPIC-9 residuals run 2). The
consolidator's synthesis §3 ruled designer predictions P1(amended), P6,
P9 "need a cold-read persona test on the future command's output" — the
designer's falsifier shape (fixture consumer repo + captured verbatim
output + downstream persona read) is "the spec's acceptance instrument for
the output surface." FLLWUP-50's implementation (merged `6e35355`) shipped
the surface and the skeptic verified the adjacent mechanical claims green
(T10 copy-truth: description names the protected class and never claims to
update `preflight.sh`; the table lists the protected class even when
unchanged), but no cold-read persona read ran — these three predictions
stand open-untested by the only test that can settle them.

Not a gate assertion: designer predictions are person-facing claims
(council.md step 2), never card gates. This card exists so the three do
not silently decay into "settled because nobody contradicted them"
(convergence-is-not-evidence discipline).

P7 is deliberately excluded: steward Q2 rejected the use-site design; its
falsifier is not owed.

## Origin

FLLWUP-50 step-5 consolidator §3 (O12 open-untested set, "follow-ups owed
at implementation"); step-4 skeptic O12 ("no in-repo smoke exists");
designer round-2 P1(amended)/P6/P9 with falsifiers.
