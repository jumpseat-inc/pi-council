---
id: EV-6
title: Add the gates GitHub Actions workflow
state: Ready
owner: null
epic: EPIC-1
goal: A gates GitHub Actions workflow in the repo reports SUCCESS on every pull request and main push when typecheck, tests, and board validation pass
---

## Intent

The deterministic merge check's criterion 2 requires a GitHub Actions
`gates` workflow showing `state: SUCCESS` on the PR head SHA. This repo has
no `.github/workflows/` at all — an absent check is not a passing check —
so this card adds the substrate every other card's merge depends on. It is
scheduled first in the epic for that reason.

The exact workflow was drafted in the Phase 1 rulings preflight and
approved by the human (recorded as ruling CI-1 on EPIC-1). The file must
match that draft:

```yaml
name: gates
on:
  pull_request:
  push:
    branches: [main]

jobs:
  gates:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      - run: bunx tsc --noEmit
      - run: bun test
      - run: python3 council/validate.py
```

Notes for the owner:

- The job is named `gates` — `gh pr checks` keys on the `workflow` field
  and the merge check asserts the `gates` workflow row with
  `state: SUCCESS`. Do not rename the workflow or job.
- The gates are exactly the repo's AGENTS.md command set (typecheck, full
  test suite, board validation) — no threshold lowered, none skipped.
  `bun test` runs the whole suite; the integration test self-skips without
  `COUNCIL_INTEGRATION=1`, which is the documented repo behavior.
- This card's own PR adds the workflow file; GitHub Actions runs it against
  the PR's head SHA (same-repo branch), so criterion 2 is satisfiable on
  this card's own PR.
- A workflow that is syntactically valid but never triggers, or that is
  named differently, fails this card's goal even if the YAML parses.

## Acceptance

- `.github/workflows/gates.yml` is committed and pushed to main, matching
  the approved draft (workflow `name: gates`, job `gates`, the six steps).
- On a PR, `gh pr checks <PR> --json name,state,workflow` shows the `gates`
  workflow with `state: SUCCESS`.
- The workflow triggers on `pull_request` and on `push` to `main`.
- The local gate set still passes (`bunx tsc --noEmit`, `bun test`,
  `python3 council/validate.py`) on the merged SHA.
