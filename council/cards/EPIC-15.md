---
id: EPIC-15
title: Usages tool creates its output directory before writing the cache
state: Done
owner: null
epic: null
goal: A non-offline run of council/skills/usages/scripts/usages.py creates its output directory before writing the cache, so a run whose output directory does not yet exist — the default .pi/council/usages/ or a fresh --out-dir — leaves .cache.json in it and emits no usages: could not write cache: line on stderr.
---

## Intent

`/council-init` copies `council/skills/usages/` into
`<repo>/$CONFIG_DIR_NAME/skills/usages/`, non-clobbering, and the copied
`usages.py` resolves its output directory at runtime. The reported warning is
not a copy defect: `copyUsagesSkill` recursively creates every directory it
writes. The defect is an ordering bug in the tool's `main` — the cache write
runs before `ensure_out_dir()`, so on a repo with no output directory the
temp-file write raises `FileNotFoundError`, is caught, and logs
`usages: could not write cache: …`, while the report still writes after the
directory is created. The tool must satisfy one invariant — its output
directory exists before anything is written into it — independent of whether
`/council-init` ever created it, and independent of whether `--out-dir` is the
default or a custom path. Because a package-only fix reaches only future
copies, the epic also carries the named remediation route for an
already-initialized install.

## Acceptance

- **Scope first:** the reporting repo is an already-initialized install, so
  `BUG-2` alone does not silence its warning — `copyUsagesSkill` is
  non-clobbering and the copied skill has no refresh path. The epic is not Done
  while `FLLWUP-105` is unpromoted, and merging `BUG-2` does not close the epic.
- **User-facing observable:** on a fresh temp repo with no
  `<repo>/.pi/council/usages/` directory, one default-argument run of the tool
  leaves `.pi/council/usages/.cache.json` on disk, prints no line containing
  `usages: could not write cache:`, and a second run reports `cache.hits > 0`.
- **Discriminator:** the same setup with `--out-dir <repo>/fresh-out` — a path
  `/council-init` never creates — also leaves `fresh-out/.cache.json` with no
  warning. An `EMPTY_DIRS`-style scaffold pre-seed must NOT be able to satisfy
  this bullet. The recorded closed-red probe (dir seeded, `usages.py`
  untouched → the previously drafted epic gate went green) is the reason this
  bullet exists.
- `bun test test/usages.test.ts` and `bun test test/scaffold.test.ts` pass on
  the merged SHA; the new default-path and `--out-dir` tests are red at the base
  commit and green after the fix; T-USK1's non-clobbering assertions are
  unchanged.
- `bunx tsc --noEmit` and `council/preflight.sh` pass on the merged SHA.
- `extensions/scaffold.ts`'s `EMPTY_DIRS` does not gain the usages output dir,
  and no test asserts that the output dir exists before the tool is run.
- The epic card records the steward escalation (whether `/council-update` should
  own copied-skill refresh) and its outcome.
## Phase 1 Rulings (recorded before dispatch — binding for this run)

- **R1 — merge authorization.** The human authorized, for this run only, the
  admin-bypass merge (`gh pr merge <PR> --squash --admin --match-head-commit
  <X>`) for every card in EPIC-15; the authorization is not extended to any
  later run. The first autonomous merge pauses so the human can watch it.
- **R2 — build order (steward's row, front-loaded).** Serial:
  BUG-2 → FLLWUP-105 → FLLWUP-106.
- **R3 — copied-skill refresh escalation, outcome.** Resolved: keep the manual
  delete-and-recopy remediation; `/council-update` does not own refresh of
  copied payloads outside `council/scaffold/`.
- **R4 — cache-health report row.** Product-owner's decline stands, with the
  re-card trigger recorded: any post-fix cache-write failure whose parent
  directory exists opens a new card.

## Delivery record (autonomous run — orchestrator)

Closed under `/features-deliver` on the recorded Phase-1 rulings R1–R4.

- **BUG-2** — PR #104, mode `Deliberate`, criteria 1–5 satisfied at pinned head
  `8a4b2a9`; merged `59fad63`. `bun test` 1466 pass / 0 fail, tsc 0, validate
  clean on the merged SHA.
- **FLLWUP-105** — PR #105, mode `Deliberate`, criteria 1–5 satisfied at pinned
  head `2ebed9a`; merged `a0b27ca`. One `ESCALATION` ruled by `product-owner`
  (V1 sentence, pin-boundary residual routed to a follow-up, two File
  dispositions). 15 pass / 0 fail on the merged SHA.
- **FLLWUP-106** — PR #106, mode `Deliberate`, criteria 1–5 satisfied at pinned
  head `8cede8b`; merged `98a62a9`. One `ESCALATION` ruled by `product-owner`
  (prose + the O-conformant pin confirmed). 6 pass / 0 fail on the merged SHA.
- **Steward escalation outcome (R3):** the copied-skill refresh route stays
  manual (delete-and-recopy); `/council-update` is not widened. Recorded.
- **Filed follow-ups (out of the R2-scheduled scope, Backlog):** FLLWUP-107
  (renderer substitution-set pin), FLLWUP-108 (remediation pin drop-class).
  BUG-2's four step-13 candidates remain held (follow-up gate `noul` drift,
  open FLLWUP-104).
- **Orchestrator-level residual, no card:** a batched `chore(release)` bump
  covering the BUG-2 + FLLWUP-105 + FLLWUP-106 payload is owed; per the
  `product-owner` ruling it is not a per-card closure condition.

## Residual run — Phase 1 rulings (features-deliver, FLLWUP-107–111 run)

Human decisions recorded before the first `council-runner` was dispatched and
before this run's first record push. Immutable for this run and binding on
every seat, `steward` included; a runner that hits one applies it and cites the
ruling rather than re-asking.

- **Scope/promotion.** `FLLWUP-107`–`FLLWUP-111` (five `Backlog` residuals under
  this `Done` epic) are promoted to `Ready` and are this run's delivery scope.
  `EPIC-15` itself stays `Done`; these are residual cards, not an epic re-open.
- **Sequencing (strategy row).** Build order is re-homed to `steward`; the
  orchestrator dispatches one `council-runner` per card in `steward`'s ruled
  order, never two at once. Steward (job-1) ruled
  `FLLWUP-111 → FLLWUP-109 → FLLWUP-110 → FLLWUP-107 → FLLWUP-108` with no
  retirements.
- **R-A — record push (merge row, adjacent).** The human authorized, for this
  run only, the step-12 record commit to be pushed directly to `main` with the
  pusher's admin identity, satisfying `council.md` step 12's precondition that
  an explicit, run-scoped, human-recorded authorization exists on the run's
  Phase-1 record before the run's first record push. Disclosed in the run
  ledger (Phase 3). Not extended to any later run.
- **R-B — merge (merge row).** The human authorized, for this run only,
  `gh pr merge <PR> --squash --admin --match-head-commit <X>`, `<X>` the exact
  head SHA merge-check criterion 2 (`gates` workflow `SUCCESS`) was read
  against; a SHA mismatch is a HALT, not a retry. All five deterministic
  criteria still hold; `--admin` only clears the ruleset's approving-review
  requirement. Not extended to any later run.
- **First-merge watching.** The human declared the run unattended, waiving the
  "first autonomous merge should be watched" expectation; R-B stands as the
  recorded authorization for every merge in this scope.
- **Design ratifications (already recorded — consumed, not re-asked).**
  FLLWUP-109's "create the parent" design and rejection of a usage error;
  FLLWUP-110 and FLLWUP-111 as separate cards, not folded into BUG-2; FLLWUP-107
  (Q3a, File) and FLLWUP-108 (Q2/Q3b) routed to their own cards by the
  2026-09-24 product-owner rulings.
- **Follow-ups (judgment row).** `council.md` step 13's draft-then-confirm gate
  is re-homed to `product-owner`, which confirms, edits, or drops each follow-up
  draft before the card is written.
