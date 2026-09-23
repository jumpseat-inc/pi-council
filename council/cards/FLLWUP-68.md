---
id: FLLWUP-68
title: Reusable cold-read persona harness over council output surfaces
state: Backlog
owner: null
epic: EPIC-22
goal: A cold-read persona falsifier — fixture/repo + captured verbatim output + downstream persona read, thresholds fixed before the read, answers recorded verbatim — settles the un-run person-comprehension predictions on the FLLWUP-50 refresh surface (P1 amended/P6/P9) and the step-13 follow-up surface (P1/P2/P3/P5/P7/P9), with any failed prediction grounding a copy fix whose byte tests are re-expressed rather than deleted.
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

---

### Absorbed: FLLWUP-101 — Cold-read persona smokes on the step-13 follow-up surface (designer P1/P2/P3/P5/P7/P9)

Confirmed and narrowed by the EV-82 step-13 product-owner ruling
(`vault/raw/2026-09-22-po-ev82-step13-confirmation.md`, Item 1). The implementing
owner authors the prose and owns the `how`.

The step-9 skeptic verified per-cell *bytes* (each line names title, disposition,
consequence, qualifier, basis) — a claim about the presence of constituents, which
cannot answer whether a reader can tell which noun is the candidate and which is the
merge target. council.md step 13 names un-run CDP-smoke predictions as step-13
material; FLLWUP-68 names the decay mode this card prevents.

**The genuinely un-settled subset (P1, P2, P3, P5, P7, P9):** P1 (on the shipped line,
can a reader say which noun the merge goes *to*), P2 (does `(advisory)` vs `(active)`
tell the reader whether their own edit still governs), P3 (does a bare `off` above the
drafts read as "nothing was decided" rather than "this is broken"), P5 (does the title
after the basis still carry Drop's cost), P7 (does a `Merge` line with no arrow read as
"name the target" rather than "nothing to merge"), P9 (does a 200-char verbatim title,
no longer leading, still let a reader find their own candidate). Mechanical predictions
(P4, P6, P8, P10–P14) are excluded — the skeptic already closed them green.

**Honesty conditions (structural coldness):**
1. The reader gets the captured literals and a question — not `council/cards/EV-82.md`,
   not the deliberation record, not the design spec, not the wiki page naming the
   literals, and not the designer.
2. The capture is taken from the renderer at the card's own promotion head, not copied
   out of EV-82's record.
3. The predictions and their pass thresholds are fixed before the read.
4. The answers are recorded verbatim as an artifact.
5. Any new live arm states its expected wall clock and ceiling in its header and stays
   gated off the default suite.
6. A failed prediction lands a **copy** fix, and the byte tests pinning the failed
   literal are re-expressed, never deleted.

**FLLWUP-68 obligation:** build the falsifier in a shape FLLWUP-68 can consume; if
FLLWUP-68 lands first, its harness is the host.

**Sequencing (obligation, not a gate):** promote after EV-83 lands if manageable, so one
read covers the whole literal family. The card must not be written so it cannot run
before EPIC-10 closes.

## Acceptance

---

### From FLLWUP-101 — Cold-read persona smokes on the step-13 follow-up surface (designer P1/P2/P3/P5/P7/P9)

- The six predictions (P1, P2, P3, P5, P7, P9) are each run through an instrument meeting all six honesty conditions.
- Answers are recorded verbatim as a committed artifact; thresholds appear fixed before the read.
- The instrument is reusable by FLLWUP-68.
- Any failed prediction lands a copy fix; the byte tests pinning the failed literal are re-expressed, never deleted.
- The repo's typecheck, the full test suite, `python3 council/validate.py`, and the repo's preflight pass.
