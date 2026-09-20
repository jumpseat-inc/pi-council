---
id: FLLWUP-92
title: Align runStartGatePreflight's injected apiKey semantics with the resolver's empty-means-absent rule
state: Backlog
owner: null
epic: EPIC-14
goal: runStartGatePreflight(repoRoot, { apiKey: "" }) returns pass today while the runtime resolver treats an empty OPENROUTER_API_KEY env as absent — the injected-key seam should apply the same empty-string-is-absent normalization (or the seam should be narrowed so only null/undefined vs a resolved key can be injected), pinned by test, so the test double cannot diverge from the production predicate it doubles for.
---

## Intent

Skeptic note (c) from EV-76 step-9 verification: the `{apiKey?}` injection seam
exists for tests, and `""` currently means "credential present" at the seam
while meaning "absent" at the resolver. Unfirable in production (no caller
injects apiKey) — recorded as a semantic-trap nit, not a defect of the shipped
check.

## Acceptance

- Injecting `""` behaves identically to injecting `null`/`undefined`-then-
  resolving-to-null, or the seam's type narrows to make `""` unrepresentable.
- A test pins the chosen semantics; no production behavior change.
