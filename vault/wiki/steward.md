---
title: Steward
type: entity
summary: The portfolio-authority seat and product-owner's escalation target — rules what the portfolio is for, build order, the order of card retirement, and permanent residuals. Never implements.
aliases: [steward seat]
tags: [pi-council/seat]
sources: ["[[2026-09-11-epic7-run-ledger]]", "[[2026-09-15-epic8-run-ledger]]"]
created: 2026-08-23
updated: 2026-09-15
---

> ⚠️ Derived from `council/agents/steward.md` (captured 2026-08-23). Verify against the seat file.

**Model:** `openrouter/deepseek/deepseek-v4-pro:high`.
**Tools:** Read, Grep, Glob.
**MCP:** `[context7]`.
**Superpowers pointers:** none.

## Role

Holds **portfolio-level authority**: which cards exist, in what build order,
retiring work, and accepting a residual permanently. It **stands in** for the
human during unattended runs — a stand-in, not a replacement; the human remains
final authority, and a recorded decision outranks it.

**Portfolio** is the jobs the product does for its one purpose:
1. A trustworthy core — the data or domain logic at the center is correct and
   honestly represented,
2. a usable surface,
3. a trusted data pipeline,
4. a sustained free/open model.

A **portfolio decision** changes what the product is *for* (adding/dropping/shaping
one) or its build order. A card-level design choice stays with product-owner.
Test: "does this move what the product is for, or just how one part of it works?"

## Rules

- It never styles/designs/implements/merges.
- Rules from evidence (wiki + board); a ruling that cites nothing is a coin
  flip. Prefers the cheapest-to-reverse option, naming reversibility.
- Stand-in only from `product-owner` escalation or a genuine strategy fork.

## Exercised in EPIC-7 (2026-09-11)

- **Goal-wording authority** — [[product-owner]] escalated EV-29's goal
  because it named a provider data granularity that does not exist; steward
  amended the sentence in place (legal while the card is `Deliberating`, see
  [[engineering-board]]) rather than declining or re-decomposing the card. The
  cheapest-to-reverse fix (one frontmatter line) beat the expensive one (a new
  card, reopening R-SCOPE/R-ORDER).
- **Eval-boundary mechanism** — ruled the opt-in `boundaryMode: "marker"`
  extension and the third R-5 state ([[usage-block]]) when product-owner
  escalated the EV-32 items that touched EV-30's settled zero-both surface.
- **Run closure** — ruled EPIC-7 `Done` on observed acceptance, ending the
  run; FLLWUP-26..35 ride as `Backlog` residuals under the Done epic.

## Exercised in EPIC-8 (2026-09-15)

- **Follow-up confirmation** — the R-FOLLOWUP home for genuinely new cards:
  confirmed `FLLWUP-36` (dead `blockLines`, job-9) and, after EV-35's step 13,
  `FLLWUP-37`/`FLLWUP-38`/`FLLWUP-39` (job-14), including a goal amendment on
  FLLWUP-37 to carry the one-row carve-out. None promoted: "promotion is a
  later, human-reachable call."
- **Permanent residuals accepted** — the out-of-order `toolResult`
  duplicate-render (job-9, dropped on reachability) and `t`-toggle cursor
  stability under the visible-index scheme (job-14, a UX gain not a defect).
- **Run closure #3** — ruled EPIC-8 `Done` on observed acceptance (job-19),
  ending the run; the four follow-ups ride as `Backlog` residuals under the
  Done epic. It declined to make a **version bump a closure condition** (the
  EPIC-7 precedent is closure at an unchanged version), leaving the release
  decision to the human.

## Related

- [[seats]], [[council-loop]], [[product-owner]], [[engineering-board]]
- [[council-config]] — model/thinking override

## Sources

- `council/agents/steward.md`, `council/procedures/council.md`
- [[2026-09-11-epic7-run-ledger]] — goal amendment, eval-boundary mechanism, epic closure