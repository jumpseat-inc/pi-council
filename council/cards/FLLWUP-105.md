---
id: FLLWUP-105
title: Name the remediation route for a stale copied usages skill
state: Backlog
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
