---
title: PO ruling — FLLWUP-48 test-suite-cost budget
type: source
summary: The ruling that created the suite-cost budget — the documented figure is the implementing pass's measurement with provenance, 180s is a drift threshold not a budget, document-only is ratified, and a gates timeout-minutes is deferred as a separate CI-policy question.
aliases: [po-fllwup48-test-suite-budget, fllwup48 budget ruling, 180s drift threshold]
tags: [pi-council/ruling, pi-council/epic9]
sources: ["[[2026-09-19-po-fllwup48-test-suite-budget]]"]
created: 2026-09-19
updated: 2026-09-19
---

# PO ruling — FLLWUP-48 test-suite-cost budget

Source: `vault/raw/2026-09-19-po-fllwup48-test-suite-budget.md`.

## Item 1 — the budget figure is a measurement, not a ceiling

The figure written into `README.md`, [[test-suite-budget]], and `AGENTS.md` is
the measurement taken on the implementing pass — a fresh head worktree, full
`bun install`, recorded with machine + date + SHA + command. It is
**descriptive of one machine, not a normative cross-machine ceiling**. The
proposed ≤180s is **not the budget**; it is the **drift threshold**: a
re-measurement above 180s means the budget has rotted and the card reopens.

The `AGENTS.md:17` fix removes the brittle test count rather than refreshing
it — the non-decaying form.

## Item 2 — `gates.yml` timeout-minutes deferred

**Do not ship a `timeout-minutes` on this card.** Whether the `gates` workflow
should have a default timeout is a separate question with its own rationale.
The arithmetic that settles it: the TUI arm's own enforced ceiling is `300_000`,
which exceeds any ~180s budget, so a step timeout tight enough to express the
budget masks attribution, and one loose enough not to fire cannot express it.
A loose runaway backstop is defensible CI policy but a separate card.

## Item 3 — document-only ratified

Both seats converged document-only. A default-skip gate would empty
criterion-2 evidence (suite green while the live mechanism is broken). The
measured envelope is inside the documented envelope, so the goal's "run within
it" branch is discharged by fact. Gating stays available as the branch that
reopens on any re-measurement above 180s.

## Scope confirmation

The three hygiene fixes ship as one delivery: (a) bytecode exclusion in the
shape scan (`__pycache__/`, `.pyc/.pyo/.pyd`), two-sided witness; (b) the
`ev41-retry-e2e.test.ts:325` stale comment; (c) the non-decaying `AGENTS.md:17`
wording. Zero new live arms.

## Takeaways

- **Budget ≠ ceiling.** A descriptive envelope plus a drift threshold is the
  maintained invariant; a per-arm ceiling is an emergency bound.
- **Remove a decaying number, never refresh it** — the count fix is the
  template reused by FLLWUP-56's header rule.

## Related

- [[test-suite-budget]] — the page this ruling created
- [[2026-09-18-po-fllwup56-step13-ruling]] — reuses the decay argument
- [[2026-09-20-po-fllwup58-gates-backstop]] — discharges item 2's deferral
- [[2026-09-18-epic9-residual-run-2-ledger]]

## Sources

- [[2026-09-19-po-fllwup48-test-suite-budget]]