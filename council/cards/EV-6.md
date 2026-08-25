---
id: EV-6
title: Add the gates GitHub Actions workflow
state: Done
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

## Run Record (features-deliver, autonomous)

- **Step 1 gate:** mechanical (narrow, single-area CI infra; the exact YAML
  was approved in Phase 1 ruling CI-1, zero design ambiguity). Not
  surface-touching (no TUI/user-visible surface). Mechanical path — steps
  2–6 skipped; owner handoff is the card itself (no spec file per
  council.md step 7).
- **Rulings applied:** CI-1 (workflow name `gates`, job `gates`, the six
  steps, triggers on pull_request + push to main — file must match the
  quoted draft), MERGE-1 (first autonomous merge runs the deterministic
  five-criteria check, pinned with `--match-head-commit`, no human
  go/no-go).
- **Step 7:** handed to `owner`; card set `In Progress` on card + board;
  `validate.py` clean.
- **Step 8:** owner implements in an isolated worktree, pushes branch,
  opens PR. Local `main` is 3 commits ahead of `origin/main` (EPIC-1
  decomposition + Phase 1 rulings docs commits); the PR branch carries
  them to origin via the sanctioned PR merge path.
- **Step 8 result (observed):** PR #1 open (`feat/ev-6-gates-workflow` →
  `main`, head `c98709979ffc6bce86ce341e84e50a07f5d56722`). Owner's
  additions beyond the workflow file: `.gitignore` (`.worktrees/` entry,
  worktree hygiene) and the plan under `docs/superpowers/plans/`. Owner's
  local gates: install 0, tsc 0, bun test 138 pass / 2 skip (integration
  self-skip, documented) / 0 fail, validate.py clean. Card + board set
  `In Review` from the observed open-PR artifact.
- **Step 9 (Skeptic, 30m window, settled 2.6m):** all five objections
  `closed-green`, none open. (1) Local gate set re-run on a fresh checkout
  of the head SHA: install 0, tsc 0, bun test 138/2/0, validate.py clean.
  (2) Workflow file byte-exact vs approved draft; job `gates`;
  triggers pull_request + push→main. (3) `gh pr checks 1 --json
  name,state,workflow` → `[{"name":"gates","state":"SUCCESS","workflow":"gates"}]`.
  (4) Ancillary files harmless. (5) Gate integrity proven: injected
  typecheck error → tsc exit 2; injected failing test → bun test 1 fail;
  orphan board entry → validate.py exit 1; all restored green.
  Verify→fix cycles used: 0 of 3 cap.
- **Step 10 (Judge, 15m window, settled 0.2m):** PASS against the goal
  alone, on the Skeptic's evidence.
- **Deterministic merge check (MERGE-1, all five criteria):** (1) owner
  gates green in full (Skeptic-verified); (2) GitHub Actions `gates`
  workflow SUCCESS on PR head `c9870997`; (3) no blocking Skeptic
  objection; (4) judge PASS; (5) no Needs Human / outstanding ruling.
  Re-read checks at merge time: head unchanged, mergeStateStatus CLEAN.
  Merged `gh pr merge 1 --merge --match-head-commit c98709979...` →
  MERGED, merge commit `631eea763174ad087311ab4417dc953810c86bab`.
  Push-event workflow run `32869590611` on the merged SHA: SUCCESS.
- **Step 12:** local main fast-forwarded cleanly to origin/main
  (`6647ef6..631eea7`), run-record reapplied, `Done` set from the
  observed artifact (merged + CI green on the merged SHA),
  validate.py clean, reconciliation committed and pushed.
