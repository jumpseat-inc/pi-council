---
id: FLLWUP-105
title: Name the remediation route for a stale copied usages skill
state: Deliberating
owner: null
epic: EPIC-15
goal: council/procedures/usages.md instructs the agent that when the tool's stderr contains usages: could not write cache:, it must surface that line verbatim and give the consumer the two refresh commands — delete <repo>/$CONFIG_DIR_NAME/skills/usages/, then re-run /council-init.
---

## Intent

The reported warning was emitted by the *copied* tool at
`.pi/skills/usages/scripts/usages.py`, not by the package. The package fix
(BUG-2) reaches only future `/council-init` copies: `copyUsagesSkill` is
non-clobbering, and the skill is outside the scaffold tree with "no provenance,
no refresh path" (`TOOLING_FILES` covers only `council/validate.py` and
`council/cards/_template.md`). So an existing install keeps warning until its
copy is replaced. This card settles the delivery mechanism: it takes the
manual-route option and names the exact remediation, rather than building the
consent-gated refresh path — that widening touches a binding human decision
(the skill sits outside the scaffold tree by design) and a settled fence on
copied-payload refresh, and is escalated to the human instead. Re-running
`/council-init` is not a mechanism (T-USK1 pins that it skips).

## Acceptance

- A conditional sentence added to `council/procedures/usages.md`'s `**Report.**`
  section carries all four elements: the literal `usages: could not write
  cache:`, an instruction to surface it verbatim, the statement that the fix
  ships in a newer package version, and the two commands (delete
  `<repo>/$CONFIG_DIR_NAME/skills/usages/`; re-run `/council-init`).
- A mechanical pin in `test/` — never in `council/validate.py`, per the
  docs-card rule — asserts the procedure text contains the literal
  `usages: could not write cache:`, the path fragment `skills/usages/`, and the
  literal `/council-init`, so a later edit that drops the remediation goes red.
- `test/scaffold.test.ts`'s T-USK1 stays green and unedited: re-running
  `/council-init` alone remains a no-op, and this card does NOT add the copied
  skill to `/council-update`'s `TOOLING_FILES` or weaken non-clobbering — that
  widening is escalated to the human and is not this card's to take.
- A `vault/raw/` note records that an already-initialized consumer reaches the
  fixed tool only via delete-and-recopy, so ingest corrects the wiki's refresh
  sentence.
## Phase 1 Rulings (recorded before dispatch — binding for this run)

- **R1 — merge authorization, this card.** The human authorized, for this run
  only, the admin-bypass merge `gh pr merge <PR> --squash --admin
  --match-head-commit <X>`, where `<X>` is the exact head SHA merge-check
  criterion 2 (`gates` workflow `SUCCESS`) was read against. Not extended to any
  later run; a SHA mismatch is a HALT, not a retry.
- **R2 — build order.** EPIC-15 runs serially: BUG-2, then FLLWUP-105, then
  FLLWUP-106. One runner at a time; never two against the board.
- **R3 — copied-skill refresh route (the escalation resolved).** The human ruled
  the manual route: `/council-update` does not take on refresh of
  `/council-init`-copied payloads outside `council/scaffold/`. This card ships
  the named delete-and-recopy remediation only; widening the refresh path is a
  separate scope change, not this card's.

## Run record (features-deliver / FLLWUP-105 — EPIC-15)

### Step 1 — gate, mode, surface bit (facilitator)

- **Card state promoted `Backlog` → `Ready` at container start.** Basis: the
  orchestrator's dispatch names this card explicitly with its Phase-1 rulings
  and binding acceptance (chain-promotion cadence, `vault/wiki/chain-promotion.md`
  — promotion trigger observed, not decided: predecessor BUG-2 merged `59fad63`
  (PR #104) is on local `main`, `python3 council/validate.py` clean after the
  edit). This container is the only runner in flight (R2); single-writer
  discipline holds. EPIC-15's own first bullet makes this promotion the
  load-bearing event ("the epic is not Done while `FLLWUP-105` is unpromoted").
- **Execution mode: `Deliberate`**, recorded on this dispatch's ROOT manifest
  (EV-68). Full path, steps 2–14. The full-vs-mechanical judgment is not made —
  a recorded mode is authoritative (council.md step 1). Roster: `owner`,
  `principal`, `designer`, `skeptic`, `consolidator`, `judge`; ruling seats are
  never dispatched by this container.
- **Surface-touching: yes.** The deliverable is user-facing copy on the `/usages`
  person surface: the remediation sentence in `council/procedures/usages.md`'s
  `**Report.**` section changes what a person is told when the tool's stderr
  carries `usages: could not write cache:` (same surface as the PO ruling's
  P2 finding — the `**Report.**` section currently routes only `!` limitation
  lines). On a full-council card this seats `designer` as a third generator in
  steps 2–3.
- **Seat resolution (`<seat_resolution_check>`):** `owner`, `principal`,
  `designer`, `skeptic`, `consolidator`, `judge` all resolve — the nine packaged
  seat files are present in the installed package clone (`council/agents/`), and
  no repo-local `.pi/agents/` override directory exists, so nothing shadows them.
- **Environment:** step-0 preflight skipped per the autonomous-run substitution
  (Phase 0 cleared it). `python3 council/validate.py` → `All council artifacts
  valid`. Local `main` == `origin/main` at `6c83758` before this card's first
  record push.
- **Gate set for this repo** (authoritative: `.github/workflows/gates.yml`):
  `bunx tsc --noEmit`, `bun test`, `python3 council/validate.py` (run on PR via
  the `gates` workflow). Card-specific acceptance adds the mechanical pin in
  `test/` asserting the procedure text carries the three literals, T-USK1
  green and unedited, and the `vault/raw/` note. Owner gates met in full
  regardless of change size.
- **Rulings applied here (cited, not re-asked):** R1 — merge authorization is
  run-scoped, but the merge is the orchestrator's act; this container opens the
  PR, gets `gates` green on the PR head, and reports `DONE` with the PR number
  and head SHA. R2 — serial build order (BUG-2 done). R3 — the copied-skill
  refresh route is the manual delete-and-recopy remediation only;
  `/council-update` does not take on refresh of `/council-init`-copied payloads
  outside `council/scaffold/`; no `TOOLING_FILES` widening on this card. The PO
  decomposition ruling (O3, `vault/raw/2026-09-23-po-epic15-decomposition-ruling.md`)
  already fixed the deliverable shape: one sentence in the packaged procedure
  plus the exact commands.
- **Decisions gate:** `active` per `.council.json` `gate.mode`, with the known
  `noul` answer-shape drift (FLLWUP-104) making gate calls fail mechanically.
  Expected; a failed gate call is not re-run, and step-13 candidates are held
  by draft title.
