---
title: PO ruling — EPIC-12 decomposition (first-run identity)
type: source
summary: product-owner's wave-3 ruling on the EPIC-12 decomposition — "first time" means once per pi process (startup, stateless), the identity line is the literal `council: pi-council v0.20.0 (a1b2c3d)`, the vehicle is a one-shot `ctx.ui.notify` at `session_start` when `hasUI`, a "compare to latest released" child is rejected, and EV-57/58 get amended goals with three evidence gaps closed (core.abbrev, ancestor-.git, rpc arm).
aliases: [po-epic12-decomposition-ruling, epic12 decomposition ruling, first-run identity ruling]
tags: [pi-council/ruling, pi-council/epic12]
sources: ["[[2026-09-20-po-epic12-decomposition-ruling]]"]
created: 2026-09-20
updated: 2026-09-20
---

# PO ruling — EPIC-12 decomposition

Source: `vault/raw/2026-09-20-po-epic12-decomposition-ruling.md`. The wave-3
ruling on the "version and git hash on the first pi run" epic. The person is the
human who wants to know which bytes are running under them.

## Rulings

- **§1 Epic goal:** ratified. "The first time" = **once per `pi` process**
  (`session_start { reason: "startup" }`), stateless — no once-ever flag.
- **§2 States:** EV-57 `Ready`; EV-58 `Ready` with an amended goal (designer's
  `Backlog` dissent noted but the goal now pins the vehicle); EV-59 `Backlog`,
  chain-dependent.
- **§3 Copy form:** the literal `council: pi-council v0.20.0 (a1b2c3d)` —
  prefix, `v`, short hash in ASCII parens; `+commit.` semver metadata rejected.
  The `council: ` prefix matches every session_start notification.
- **§4 EV-60 (compare to latest released) rejected:** the intake says "the
  latest git hash from the repo" (the running clone's HEAD); a network query is
  a different question and belongs to the local drift surfaces
  ([[lock-drift-tripwire]], [[council-update]]).
- **§5 Vehicle:** a one-shot `ctx.ui.notify(<identity>, "info")` at
  `session_start` when `reason === "startup"` **and** `ctx.hasUI === true` — not
  `setWidget` (the hub-progress row owns that slot) or `setHeader`. RPC is
  covered by `hasUI`; print/json emit nothing. `git-unavailable` gets its own
  literal and injected-reader evidence.
- **§6 EV-57 evidence gaps:** pin `core.abbrev 8` so a `slice(0,7)`
  implementation fails; add an **ancestor-`.git`** fixture so the resolver never
  reports a substituted hash; injected-reader tests for both degraded states.
- **§7 EV-59:** add the rpc notify frame arm, the `/reload`/resume non-refire
  arm, the fd-1 ordering assertion, credential-free budget-respecting arms, and
  a seven-field red-at-base record per arm.
- **§8 Notify volatility is not a test obligation** — provisional acceptance; a
  discoverability remedy is a new card at the step-13 gate, not a persistent
  row.
- **§9 Gate notes:** two readings of the human's words flagged for the approval
  gate (this clone's HEAD vs latest released; once per process vs once ever).

Nothing escalated; no recorded human decision overturned.

## Related

- [[version-on-first-run]] — the epic's planned surface
- [[headless-pi]] — the `hasUI` mode table (RPC true, print/json false)
- [[council-theme]] — EPIC-1's "no status surface" ruling this follows
- [[lock-drift-tripwire]], [[council-update]] — the local drift surfaces
- [[red-base evidence]], [[test-suite-budget]] — the evidence discipline EV-59 carries
- [[smoke-test]] — the end-to-end-falsifier rule

## Sources

- [[2026-09-20-po-epic12-decomposition-ruling]]