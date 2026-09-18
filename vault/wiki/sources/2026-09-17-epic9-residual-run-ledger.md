---
title: 2026-09-17 EPIC-9 Residual Run Ledger
type: source
summary: The /features-deliver run that delivered EPIC-9's nine promoted Backlog residuals (FLLWUP-40–45, 47–49) — nine gated merges, two steward goal amendments, the record-push admin-bypass gap, and a mid-run .council.json drift.
aliases: [epic9 residual run, residual run ledger, 2026-09-17-epic9-residual-run-ledger]
tags: [pi-council/run-ledger, pi-council/epic9]
sources: ["[[2026-09-17-epic9-residual-run-ledger]]"]
created: 2026-09-17
updated: 2026-09-17
---

# EPIC-9 Residual Run Ledger (2026-09-17)

The `/features-deliver` run that promoted EPIC-9's nine `Backlog` residuals
(`FLLWUP-40`–`45`, `47`–`49`) into scope and delivered them after the epic
itself had closed `Done`. Source: [[2026-09-17-epic9-residual-run-ledger]].

## Outcome

Nine merges (PRs #58–#66), all five [[deterministic-merge-check]] criteria held
on each, `gates` `SUCCESS` on every PR head SHA and every merged SHA. Serial
order ruled by [[steward]]: `40 → 43 → 42 → 41 → 44 → 45 → 47 → 49 → 48`. No
`HALT`, no `RETIRED`; one union merge ([[union-merge reconcile]]).

## What is new

- **The authority map's merge row is not the run's only privileged write.** The
  step-12 record push went direct to `main` on the admin identity — outside the
  run-scoped R2 and outside the authority map entirely. See
  [[record-push-discipline]].
- **Goal-as-defect recurred twice** (`FLLWUP-43`'s opaque conjunct B,
  `FLLWUP-49`'s undecidable clause), both healed by a [[steward]] pen ruling
  executed by the orchestrator while `Deliberating` ([[engineering-board]]).
- **The colon-space goal rule was retracted as false** (`FLLWUP-43`):
  `parse_frontmatter` was always lossless; the FAIL *was* the lossiness. The
  remaining silent-loss path is a wrapped goal line (`FLLWUP-51`).
- **The four standing-machinery cards are `Done`**: criterion 1 shell-independent
  (`FLLWUP-40`), validator/collector lossless (`FLLWUP-43`), merge step names the
  sanctioned bypass (`FLLWUP-42`), step 12 names the union-merge repair
  (`FLLWUP-41`).
- **Merged-SHA CI verification**: `gh run list --commit <squashSha>` returns
  empty for squash merges; use `gh pr checks` (head) or the commit check-runs
  API (merged) instead.
- **Mid-run `.council.json` drift**: three seat-model reassignments were swept
  into an unrelated record commit (`46c1c97`) and changed the run's tail. See
  [[run-config-stability]].
- **Single-writer discipline re-confirmed**: a ruling seat wrote directly to a
  card and introduced corruptions the runner fixed — ruling seats return text,
  the runner holds the pen.

## Escalation load

13 ruling-seat round-trips across nine cards (`product-owner` jobs 4/10/13/15/
18/20/23/27/29; `steward` 1/5/24/30). Escalation, not the criteria, paced the
run — the EPIC-7/8/9 pattern continuing.

## Follow-ups

`FLLWUP-50`–`60`, all `epic: EPIC-9`: the refresh path, the wrapped-goal gate,
the EV-39 R4 label evolution, the gate-file reference, the red-base wiki page,
the smoke-driver screen model, the seat-dispatch faux-provider arm, the
catalogue-valid ambient, the CI runaway backstop, the shape-witness allowlist
policing, and the non-admin record-push path (`FLLWUP-60`, owed before the next
autonomous run).

## Related

- [[deterministic-merge-check]] — four of its nine cards were the machinery
- [[record-push-discipline]] — the run's headline gap
- [[run-config-stability]] — the mid-run drift
- [[engineering-board]], [[union-merge reconcile]], [[council-runner]]
- [[2026-09-16-epic9-run-ledger]] — the epic's original run

## Sources

- [[2026-09-17-epic9-residual-run-ledger]]
