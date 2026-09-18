---
id: FLLWUP-54
title: Wiki page for the red-base evidence convention
state: In Progress
owner: null
epic: EPIC-9
goal: vault/wiki carries a red-base-evidence page, produced through /wiki-ingest from the FLLWUP-47 seat-prose convention, that a seat or engineer can cite.
---

## Intent

FLLWUP-47 R6 ruled the wiki-ingest out of that card's scope as a standing
step-14 offer, not a fold-in, while noting a wiki page "may be filed as a
separate follow-up if wanted". The convention now lives only as normative
packaged seat prose (`council/agents/owner.md`, `council/agents/skeptic.md`);
`vault/` is grounding prose and is written only through `/wiki-ingest`, never
hand-edited. This card is that optional follow-up: ingest a red-base-evidence
page (the seven fields, the comparison triple and gating rule, the
Skeptic-derived boundary, the true EV-41 causal story) so later cards can cite
it. Filing it is optional — if not wanted, the card is simply not promoted.

## Run record (features-deliver, run 2)

### Step 1 — classification (facilitator)

- **Promotion: `Backlog` → `Ready`, applied per the run-2 Phase-1 scope ruling.** The ruling
  (recorded human decision, immutable and binding) made this card in scope and wanted; the
  orchestrator's dispatch of this runner carries that ratification. Applied and cited, not
  re-asked and not re-decided.
- **Path: mechanical.** The `goal` fixes the deliverable precisely: one red-base-evidence page
  ingested through the fully-defined `/wiki-ingest` operation (`vault/CLAUDE.md` Ingest steps
  1–8), from a fixed source (`vault/raw/2026-09-17-po-fllwup47-step6-ruling.md`), documenting an
  already-landed, already-ruled convention (FLLWUP-47 R1–R6, merged via PR #64 at `a1d805a`).
  No cross-seam surface and no spec ambiguity — the card names the source, the operation, and
  the content boundary. Mechanical cards skip steps 2–6 and proceed to step 7.
- **Surface-touching: no (recorded).** The deliverable is grounding prose under `vault/wiki/`
  read by seats and engineers — the same deliverable class FLLWUP-47's step-1 record classified
  as not surface-touching. It changes no person's visible product surface and adds no
  user-visible copy, empty state, or error state. No `designer` is seated on this card.
- **Seat resolution (`<seat_resolution_check>`):** this card dispatches `owner` (steps 7–8),
  `skeptic` (step 9), and `judge` (step 10) — the mechanical-path set. All three resolve from
  the packaged seat set
  (`/home/tista/.pi/agent/git/github.com/jumpseat-inc/pi-council/council/agents/{owner,skeptic,judge}.md`,
  each file's `name:` matching its filename, verified first-hand this turn). This checkout has
  **no `.pi/agents/` directory** (verified: `ls -d .pi/agents` → `No such file or directory`),
  so nothing shadows the packaged seats. `product-owner` / `steward` are escalation-only and
  are never dispatched by this container.
- **Environment (facilitator-read, first-hand):** main checkout clean (`git status --short`
  empty); `HEAD == origin/main == d6264c6209f9e07f7539db6704ed2e9c26e6e02f`. The landed
  convention block is present in both seat files (`<!-- red-base-shared-start/end -->` at
  `owner.md:123–189` and `skeptic.md:87–153`); `vault/wiki` carries no red-base page today (the
  only `red-base` hits under `vault/wiki/` are mentions inside two run-ledger source pages).
  `vault/raw/2026-09-17-po-fllwup47-step6-ruling.md` exists and is the ingest source.
- **Rulings applied (run-2 Phase 1, binding):** scope ruling (above); **R2** merge =
  `gh pr merge <PR> --squash --admin --match-head-commit <X>` (run-scoped authorization; all
  five deterministic criteria still hold in full); **R3** step-12 record push direct to `main`
  (use disclosed in the runner's report); step-13 follow-up confirmation re-homed to
  `product-owner`, **pre-write** — this container drafts, never writes an unapproved follow-up,
  and never dispatches `product-owner` or `steward`.
- **Known open point, routed not decided:** the Ingest operation's step 2 ("Discuss key
  takeaways with me BEFORE writing — wait for my steer") is a human steer gate. No run-2
  Phase-1 ruling names it. Per the authority map, judgment re-homes to `product-owner` via the
  orchestrator: this container escalates with the takeaways when the gate is reached, and never
  self-steers or hand-edits under `vault/` outside the `/wiki-ingest` operation.
- **Gate set for this repo:** `bunx tsc --noEmit`, `bun test`, `python3 council/validate.py`
  (the `gates` CI workflow runs exactly these). Criterion 2 is
  `gh pr checks <PR> --json name,state,workflow` keyed on `workflow`; the `gates` workflow must
  appear `SUCCESS` on the PR head SHA. The FLLWUP-27 branch-freshness `FAIL` is a known
  by-construction artifact once a facilitator record commit advances `origin/main` past a
  branch cut; recorded verbatim, never reclassified, never used to weaken a criterion; the
  step-11 re-run set is `tsc` / `bun test` / `validate.py`.
