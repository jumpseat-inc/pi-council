---
id: FLLWUP-82
title: Every gate question id is single-line and cross-referenced across questions.json and decision.json
state: Backlog
owner: null
epic: EPIC-13
goal: Every gate question id is single-line and cross-referenced: loadGateQuestions refuses a question id containing a line break, loadGateDecision refuses any overrides[].question or weights/mechanical id absent from questions.json and a noul override option that names no criterion key, each with a single-line FAIL: naming both file and id, and a rule that can never fire is refused.
---

## Intent

Filed from EV-73's step-13 follow-up feed, item 2: the step-6 product-owner
ruling (job-2) merges EV-73's synthesis item (2) (the cross-file override
invariant) with item (4) (`questions.json` newline-bearing ids) into ONE card.
**Pairing: this card and FLLWUP-71 are siblings under EPIC-13's gate-data
hardening** — FLLWUP-71 adds the userVisibility question to the set's data;
this card hardens the loaders that read that data. Both touch
`council/gate/questions.json`/`decision.json`'s validated surface and should
land with awareness of each other's version bumps.

Evidence carried: EV-73's skeptic O1 (closed-red) found the actually-renderable
multi-line basis surface is newline-bearing `questions.json` ids —
`loadGateQuestions` accepts `"q\n1"` as a key today and `runGate`'s knownIds
filter passes it to `decide()`'s renderers (probe A4b/A5: the basis line
contains a newline). The principal's round-2 finding: an override id present
in `weights` but absent from `questions.json` can never fire (gate-run.ts
filters answers to knownIds), so a rule that can never fire is silently dead.
Both classes need the cross-file view; neither file's loader can refuse them
alone, hence one card.

## Acceptance

- A question id containing `\r` or `\n` is refused at the questions.json
  loader, single-line `FAIL:` naming the file and id.
- An `overrides[].question`, `weights`, or `mechanical` id absent from
  `questions.json` is refused at the decision.json loader (or the joint load
  point), single-line `FAIL:` naming both file and id.
- A `noul` override option naming no criterion key is refused.
- A rule that can never fire is refused.
- The packaged `questions.json`/`decision.json` validate clean under the new
  refusals.
