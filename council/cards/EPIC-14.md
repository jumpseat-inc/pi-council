---
id: EPIC-14
title: Reuse `.council.json` to enable the decisions gate; add a `/council-gate` toggle; check the OpenRouter credential when the gate is on
state: Backlog
owner: null
epic: null
goal: Reuse the committed `.council.json` as the decisions gate's enable surface instead of a separate gate policy file, add a `/council-gate` command to enable/disable jev for decisions, make preflight fail loud when the gate is on and no OpenRouter credential resolves, and fold or retire the overlapping EPIC-13 follow-up cards.
---

## Intent

The decisions gate (EPIC-13) is enabled today by a separate
`council/gate/policy.json`, while the repo already has a committed per-seat
`.council.json`. This epic moves only *enablement* into `.council.json` as a
reserved top-level `gate` section (the `theme`/`retry` sibling pattern), keeps
the `typesafe/jev-1.13` model pin and the decisions endpoint as code constants
enforced in `gate-run.ts`, and keeps `questions.json`/`decision.json` as tuning
data under EV-72 pre-registration. It adds a `/council-gate` command to toggle
the mode and makes preflight name the credential remediation when the gate is
on.

## Acceptance

The gate can be enabled/disabled by a single committed `.council.json` edit and
by `/council-gate`, both round-trippable with no other top-level key mutated;
`loadGateConfig` is the one resolver all three runtime mode readers
(`gate-tool.ts`, `gate-route-tool.ts`, `gate-route.ts`) use; the run-start
preflight (`/features-deliver` Phase 0, `/council` step 0) fails loud with both
remediations for **every** consumer — not only fresh scaffolds — when the gate is
on and no credential resolves; every EPIC-13 follow-up in `FLLWUP-71…80` is
folded, retired, or recorded out of scope — none silently dropped.

## Phase 1 Rulings (recorded before dispatch — binding for this run)

- **R1 — merge authorization, every card in this run.** The human authorized the
  run-scoped admin bypass: the merge is `gh pr merge <PR> --squash --admin
  --match-head-commit <X>`, where `<X>` is the exact head SHA the `gates`
  workflow `SUCCESS` (merge-check criterion 2) was read against. This
  authorization is for this run only and is not extended to any later run; a
  SHA mismatch is a HALT, not a retry.
- **R2 — run-scoped record push.** The human authorized this run's direct
  card+board state commits and the step-12 record commit to `main` on the admin
  identity, per `council.md` step 12 and EPIC-13's R6. Run-scoped, not extended
  to any later run. Force-push, rewind, and discarding a side remain forbidden.
  This also covers the two unpushed EPIC-14 decomposition commits already on
  local `main`.
- **R3 — run scope and order.** Deliver the full epic, five children, in
  dependency order: EV-73 → EV-75 → EV-74 → EV-76 → EV-77. Chain-promotion, not
  bulk (the EPIC-14 wave-3 product-owner ruling, job-33): each `Backlog` child
  promotes to `Ready` the moment its predecessor's merge SHA is on `main` and
  `python3 council/validate.py` is clean. No card is retired or descoped without
  a steward ruling via the escalation contract.
- **R4 — EPIC-13 follow-up disposition.** `FLLWUP-74` → `EV-73` and
  `FLLWUP-76` → `EV-77` are folded (`Done`, recorded on their faces).
  `FLLWUP-71`, `72`, `73`, `75`, `77`, `78`, `79`, `80` are recorded out of
  scope for this epic with a per-card reason below — none silently dropped. They
  stay `Backlog` under `epic: EPIC-13` for a future epic.
- **R5 — operator-facing copy.** Operator copy says "gate" (never "jev").
  `/council-gate <mode>`'s echo names the resolved mode and states it applies to
  dispatches after the echo; the legacy-policy `FAIL:` names the file, the key,
  and the `.council.json` `gate.mode` replacement; the run-start preflight
  `FAIL:` names the decisions gate as the consumer and both remediations
  (`OPENROUTER_API_KEY` or the stored `openrouter` `api_key`). Exact literal
  wording is the seat's within these constraints. Ratifies the EPIC-14 wave-3
  product-owner ruling (job-33) vocabulary.

## Follow-up dispositions (EPIC-13 `FLLWUP-71…80`)

- **Folded.** `FLLWUP-74` → `EV-73`: the `loadGateDecision`/`loadGatePolicy`
  surface is rewritten by the enablement relocation, so all four refusal classes
  ride EV-73's goal and Acceptance. `FLLWUP-76` → `EV-77`: both document the
  same reader-facing `metered-deliberation-routing` page, which EV-77 edits
  anyway.
- **Out of scope (recorded, none silently dropped).** Each stays `Backlog` under
  `epic: EPIC-13`:
  - `FLLWUP-71` — gate question-set tuning (a `userVisibility` question + its
    override). EPIC-14 keeps `questions.json`/`decision.json` as EV-72 tuning
    data and changes no question content.
  - `FLLWUP-72` — execute the merge-check table in step 11 rather than the prose
    mirror. EPIC-14 does not change `features-deliver.md`'s merge-check
    execution.
  - `FLLWUP-73` — refresh the `deterministic-merge-check` wiki page. A different
    page from EV-77's gate-config/basis-vocabulary documentation.
  - `FLLWUP-75` — a slow advisory gate-call signifier; a `/features-new` UI
    surface outside enablement.
  - `FLLWUP-77` — name the excluded gate-call count in the usage legend.
  - `FLLWUP-78` — make the gate legend key self-describing (`deliberation`).
  - `FLLWUP-79` — signpost the gate ledger from the usage-block exclusion
    surface.
  - `FLLWUP-80` — bound the EV-68 `textTree` byte-equality flake window.