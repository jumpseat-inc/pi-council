---
id: FLLWUP-57
title: Suite determinism under a catalogue-valid ambient COUNCIL_EVAL_MODEL
state: Backlog
owner: null
epic: EPIC-9
goal: A test run of test/ with a catalogue-valid ambient COUNCIL_EVAL_MODEL exported passes, and any test that resolves the ambient as its effective model is isolated or pinned, so bun test is shell-independent for every catalogue-valid value.
---

## Intent

FLLWUP-40's oracle and its step-9/step-11 probes exercised the ambient unset, a
plain unknown-model value, and an unknown-model `:thinking`-suffixed value — all
of which take the loud-refusal path. A *catalogue-valid* ambient value resolves
as the effective model instead and was not exercised across the whole suite.
Whether any remaining test in `test/` resolves an exported catalogue-valid
ambient as its effective model, and thus still makes `bun test`
shell-dependent, is the narrow but real residual `product-owner` (job-29)
approved from FLLWUP-40's step-13 candidate A.
