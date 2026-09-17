---
id: FLLWUP-40
title: Isolate COUNCIL_EVAL_MODEL from the eval-runner dispatch-primitive test
state: Ready
owner: null
epic: EPIC-9
goal: A test run of test/eval-runner.test.ts inside a council seat shell with COUNCIL_EVAL_MODEL set, and outside it, both pass without the ambient model variable changing the dispatch-primitive expectation.
---

## Intent

`test/eval-runner.test.ts:210-213` asserts the ambient
`process.env.COUNCIL_EVAL_MODEL` instead of clearing it, so the suite's
green/red depends on the shell it runs in. This run's own owner and Skeptic
reported different red counts because of it, and while it holds, criterion 1
of the deterministic merge check — local gate evidence — is
environment-dependent. Named by the steward closure ruling as owed before the
next autonomous run.
