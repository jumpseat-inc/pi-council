---
title: PO ruling — FLLWUP-56 step-13 follow-up drafts
type: source
summary: product-owner drops both FLLWUP-56 follow-up drafts as cards — settling the live-arm header rule (header = design-time expected + ceiling; the measured figure's only home is the per-file budget row) and routing two pi-runtime mechanism findings to named wiki homes.
aliases: [po-fllwup56-step13, fllwup56 step13 ruling, live-arm header rule]
tags: [pi-council/ruling, pi-council/epic9]
sources: ["[[2026-09-18-po-fllwup56-step13-ruling]]"]
created: 2026-09-18
updated: 2026-09-18
---

# PO ruling — FLLWUP-56 step-13 follow-up drafts

Source: `vault/raw/2026-09-18-po-fllwup56-step13-ruling.md`.

## R1 — the live-arm header rule (DRAFT A dropped)

FLLWUP-48 ruling item 1 plus [[test-suite-budget]] rule 1, read together,
mean three things:

1. A live arm's header carries the **design-time expected wall clock plus its
   ceiling** — both are what the design knew when the header was written. The
   header is not a measurement record and is not rewritten by the implementing
   pass.
2. The **measured cost figure has exactly one authoritative home**: the
   per-file row in [[test-suite-budget]] (mirrored to `README.md` and
   `AGENTS.md`). A per-arm number stated anywhere else is a restatement, not a
   source.
3. **A header estimate beaten by measurement is not a defect** — it is an
   estimate wrong in the safe direction. `test/ev41-seat-child-live.test.ts`
   stated ≈18–30s and measured 5.96s; the risk is the suite looking more
   expensive than it is, never under-budgeting.

Dropping the card was the point: the draft's goal was a disjunction ("rewrite
the header **or** amend the standing rule"), and deciding what an existing rule
means is a ruling, not a card. Rewriting the header would have created a second
authoritative home for a decaying number — the class FLLWUP-48 fixed
non-decaying at `AGENTS.md:17`.

## R2 — two mechanism findings routed (DRAFT B dropped)

Both are real user value; the **card** is dropped because the home already
exists and the step-14 ingest offer already exists. Routes bind content, not
placement:

- **Route 1 → [[headless-pi]]**: pi's project-extension auto-discovery is
  **not `-a`-gated**. `-a`/`--approve` answers the trust question for one run;
  it is not the switch for project-local extension loading. A print-mode parent
  loads its cwd's `.pi/extensions`, so a scratch-repo shim placed there to reach
  a seat child is **also** loaded by the parent — it must gate on the child
  discriminator (`--session-id` in `process.argv`) and no-op otherwise.
- **Route 2 → [[council-theme]]** §"Locating pi's theme module (v0.12.1 fix)":
  a nested `require()` inside a jiti-transformed extension re-resolves through
  jiti's synchronous pipeline, where a file-valued alias prefix-matches a
  subpath and mis-resolves; **`await import()` bypasses that pipeline**. Prefer
  dynamic import over a nested `require()` of an aliased subpath, and prefer an
  env write **before** the dynamic import over a static re-export (ESM
  evaluates dependencies before the module body).

## Takeaways

- A ruling can **empty a card**: deciding what a standing rule means is a
  ruling, and a card whose goal is a disjunction has decided nothing.
- Wiki documentation is a **standing offer** ([[llm-wiki]]), not a card, unless
  a human records the page as wanted scope (the FLLWUP-54 precedent).
- Estimation error in the safe direction is not a defect; only a **second
  authoritative home** for a decaying figure is.

## Related

- [[test-suite-budget]], [[headless-pi]], [[council-theme]], [[llm-wiki]]
- [[2026-09-18-epic9-residual-run-2-ledger]], [[2026-09-19-po-fllwup48-test-suite-budget]]

## Sources

- [[2026-09-18-po-fllwup56-step13-ruling]]