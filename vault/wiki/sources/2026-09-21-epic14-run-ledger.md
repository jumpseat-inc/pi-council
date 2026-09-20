---
title: 2026-09-21 EPIC-14 Run Ledger
type: source
summary: The EPIC-14 run — gate enablement moved from `policy.json` to `.council.json`'s top-level `gate` section, `/council-gate` shipped, and the run-start preflight credential check landed on a packaged path; five Deliberate merges (PRs #92–#96), two product-owner escalations, one steward closure, 15 follow-ups, and a release left pending.
aliases: [epic14 run ledger, EPIC-14 ledger, 2026-09-21-epic14-run-ledger]
tags: [pi-council/source, pi-council/epic14]
sources: ["[[2026-09-21-po-ev73-step6-ruling]]", "[[2026-09-21-po-ev77-j1-j2-ruling]]"]
created: 2026-09-21
updated: 2026-09-21
---

# 2026-09-21 EPIC-14 Run Ledger

The autonomous `/features-deliver EPIC-14` run (`2026-09-20T08-59-16-719Z-259999-vjf6un`)
delivered five child cards to `main` and closed the epic `Done` on a steward ruling.

## What shipped

- **EV-73** (`3386faff`, PR #92) — `loadGateConfig` resolves the decisions gate's
  enablement from `.council.json`'s **reserved top-level `gate` section**
  (`{"mode": "off"|"advisory"|"active"}`), the single resolver all three runtime mode
  readers use; `mode` left `policy.json`'s accepted keys, and the packaged `policy.json`
  dropped it. The [[metered-deliberation-routing]] model pin and decisions endpoint stayed
  code constants.
- **EV-75** (`64bf6ccf`, PR #93) — the legacy migration `FAIL:` for a `mode`-bearing
  `policy.json`, naming the file, the key, and the `.council.json` `gate.mode` replacement.
- **EV-74** (`201abbe0`, PR #94) — **`/council-gate`**, the operator command: zero tokens is
  a status read through `loadGateConfig`; one token is a write spliced into `.council.json`'s
  `gate` section and echoed through the same resolver (see [[echo-then-run]]).
- **EV-76** (`d53db842`, PR #95) — `runStartGatePreflight` + the `council_preflight` tool,
  invoked by both packaged run-start procedures; fails loud when the gate is on and no
  OpenRouter credential resolves, on a **packaged path that reaches existing consumers**.
- **EV-77** (`4fd75cbe`, PR #96) — the reader-facing `vault/wiki/metered-deliberation-routing`
  documentation (the run's docs card ingested itself into the wiki).

All five ran **Deliberate** (the packaged gate is `off`, so `resolveRoute` falls back to the
full panel on every card) and passed all five [[deterministic-merge-check]] criteria; every
merge used the run-scoped admin bypass pinned with `--match-head-commit`, and every record
push rode the [[record-push-discipline]] run-scoped authorization.

## The two rulings

- **[[2026-09-21-po-ev73-step6-ruling]]** — the enriched migration copy belongs to EV-75, not
  EV-73 (the **fold-in test**: a work item folds into a live card iff needed to meet that
  card's goal as written; shipping it early would make EV-75's falsifier pass vacuously); and
  refusal class 4 scopes to the three `decision.json` override strings `decide()` interpolates,
  with `weights` keys dropped.
- **[[2026-09-21-po-ev77-j1-j2-ruling]]** — the docs page carries the gateFail-tail asymmetry
  sentence; and docs cards MAY ship mechanical pins, all in `test/`, never in
  `council/validate.py` (packaged tooling would hardcode this repo's layout into consumers).

## Process learnings

- **Packaged reach vs scaffold reach.** A run-start check that must reach repos already
  `/council-init`-ed cannot live in the data-class `council/preflight.sh` (never refreshed);
  it belongs on a packaged, override-resolved procedure/tool path (see [[preflight]]).
- **Runner record hygiene.** The EV-73 and EV-75 runners left their board/card record edits
  uncommitted in the main checkout (identical to the branch); the orchestrator cleared them
  before each fast-forward. EV-76 and EV-77 did not.
- **Follow-up state normalization.** The EV-77 runner filed its follow-ups `Ready` (licit under
  [[engineering-board]] step 4); the orchestrator normalized them to `Backlog`, consistent with
  every other follow-up card.
- **A docs card is a second wiki writer.** EV-77 edited `vault/wiki/` directly, while
  `council.md` step 14 says the facilitator must "never hand-edit anything under vault/" — a
  sanctioned-looking exception for a card whose deliverable *is* wiki documentation, and a
  tension with the ingest process (flagged, not silently resolved).
- **Release left pending.** `package.json` stayed at `0.28.0`; the steward ruled the version
  bump **not** a closure condition (the EPIC-7 precedent) and carded it as `FLLWUP-95`; the
  moving `latest` tag is a full epic behind `main`.

## Related

- [[metered-deliberation-routing]] — the subsystem this run re-homed enablement for
- [[council-config]] — the `gate` sibling this run added
- [[preflight]] — the run-start check's new packaged home
- [[deterministic-merge-check]] — applied five times, all Deliberate
- [[steward]] — the closure ruling
- [[2026-09-21-epic13-run-ledger]] — the run that shipped the gate

## Sources

- `vault/raw/2026-09-21-epic14-run-ledger.md`
- `docs/superpowers/run-ledger-EPIC-14.md`