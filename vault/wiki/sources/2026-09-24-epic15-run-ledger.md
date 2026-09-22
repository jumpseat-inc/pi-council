---
title: 2026-09-24 EPIC-15 Run Ledger
type: source
summary: The EPIC-15 run — the usages cache-write ordering bug fixed end to end (3 Deliberate merges, PRs #104–#106), the remediation route for already-copied installs, and the finding that an enabled-but-failing gate (noul drift in BOTH domains) is inert rather than blocking.
aliases: [epic15 run ledger, EPIC-15 ledger, 2026-09-24-epic15-run-ledger]
tags: [pi-council/source, pi-council/epic15, pi-council/usages]
sources: []
created: 2026-09-24
updated: 2026-09-24
---

# 2026-09-24 EPIC-15 Run Ledger

The autonomous `/features-deliver EPIC-15` run delivered the epic "Usages tool
creates its output directory before writing the cache" — 3 Deliberate merges
(PRs #104–#106), no `HALT`, no `Needs Human`, no [[steward]] escalation. The
epic closed `Done` while two children filed mid-run (`FLLWUP-107`,
`FLLWUP-108`) remain `Backlog`.

## What shipped

- **BUG-2 (PR #104, `59fad63`)** — moved `ensure_out_dir(out_dir)` above the
  first `save_cache` in `council/skills/usages/scripts/usages.py`. The tool had
  written its cache *before* creating its output directory, so on a fresh repo
  the `.cache.json.tmp` write raised, was caught, and logged to **stderr only**
  (`usages: could not write cache: …`) — never into `report["limitations"]`, so
  the failure was invisible in both report artifacts. T-U7 (default path,
  rerun `cache.hits === 1`) and T-U8 (fresh `--out-dir`) pin it.
- **FLLWUP-105 (PR #105, `a0b27ca`)** — the remediation sentence in
  `council/procedures/usages.md`'s `**Report.**` section plus the scoped
  three-literal pin in `test/usages-procedure.test.ts`. For an
  already-initialized consumer the fixed tool is reachable only via
  **package-update-first → delete `.pi/skills/usages/` → re-run
  `/council-init`** ([[usages-report]], [[non-clobbering-scaffold]]).
- **FLLWUP-106 (PR #106, `98a62a9`)** — the stderr-discipline paragraph
  forbidding invented framing around non-`!` stderr, plus the O-conformant pin.

## The load-bearing finding: an active-but-failing gate is inert

`.council.json` had `gate.mode: active`, but **both gate domains failed
mechanically** with the `noul` answer-shape drift (open `FLLWUP-104`):

- intake card gate — `gate: decide — answer reversible of type noul is missing
  a usable probability` on every drafted card;
- follow-up gate — `followup: decideFollowup — answer duplicate of type noul is
  missing a usable probability` on every candidate.

The run was unaffected: `council_route op:route` returned fallback
**Deliberate** ("no recorded decision for the current packed state") for all
three cards, and the [[deterministic-merge-check]] read mode `Deliberate` from
the run substrate. The card gate's failure direction — toward *more* scrutiny —
is why this is safe; a follow-up gate failing toward `File` is the same safe
direction. See [[inert-gate-fallback]].

## The follow-up tool gap

Step 13 inside the [[council-runner]] container could not record dispositions —
`council_followup_review` does not resolve there. BUG-2's four candidates were
held by draft title across `DONE`; the orchestrator's own `council_followup_gate`
then failed with the drift, so product-owner ruled File/Drop directly
(seat-ruled, not gate-recorded). The held-not-filed discipline held: no card
written, no candidate silently dropped. FLLWUP-105's step 13 fared better only
because a ruling was already in flight — its two candidates were filed as
`FLLWUP-107`/`FLLWUP-108`.

## Process learnings

- **Orchestrator-merges restored.** All three runners returned `DONE` with a PR
  + head SHA and did **not** merge; the orchestrator ran the five-criteria check
  and merged `--squash --admin --match-head-commit`. This reverses EPIC-10's
  "runner merged itself" variance back to the historical reading
  ([[deterministic-merge-check]]).
- **A leaked untracked worktree file blocked the fast-forward.** The owner's
  `test/usages-procedure.test.ts` was left untracked in the *main* checkout, so
  `git merge --ff-only origin/main` aborted; the orchestrator compared it
  byte-for-byte with the merged version, removed it, and re-ran the ff. A new
  reconcile hazard beside [[union-merge-reconcile]] and
  [[main-repo immutability]].
- **Pin design: the purpose clause selects the pin.** FLLWUP-106's Acceptance
  said "so the rule cannot be dropped silently"; only the pin asserting the
  glyph in a *prohibition context* reds on the gutted mutation (worked example
  kept, rule sentences dropped). Tested fact outranked the designer's predicted
  cold-read gain — [[skeptic]]'s rule applied to prose.
- **Epic closure with new Backlog children.** EPIC-15's acceptance named only
  FLLWUP-105 as the closure blocker; the mid-run follow-ups are out of the
  R2-scheduled scope ([[engineering-board]] fold-in test, [[steward]]).

## Follow-ups filed

- `FLLWUP-107` (`EPIC-15`) — renderer substitution-set pin for procedure copy.
- `FLLWUP-108` (`EPIC-15`) — usages remediation pin catching command-drop and
  update-step-drop.

Held (BUG-2 step 13, no card): foreign `--cache-file` parent surface; cache
hit/miss counts in the human summary; migrate `runTool` to the async spawn
pattern; a record-only pre-fix stderr marker.

## Orchestrator-level residual

A batched `chore(release)` bump covering the BUG-2 + FLLWUP-105 + FLLWUP-106
payload is owed; per the product-owner ruling it is not a per-card closure
condition.

## Related

- [[inert-gate-fallback]] — the run's central new concept
- [[usages-report]], [[non-clobbering-scaffold]] — the bug + the refresh route
- [[deterministic-merge-check]], [[council-runner]], [[followup-decision-gate]]
- [[metered-deliberation-routing]] — the twin gate domain and FLLWUP-104

## Sources

- `vault/raw/2026-09-24-epic15-run-ledger.md`
- `vault/raw/2026-09-23-po-epic15-decomposition-ruling.md`
- `vault/raw/2026-09-24-fllwup-105-stale-usages-skill-recopy.md`
