---
title: Council Loop
type: concept
summary: The facilitator-run deliberation → implement → verify → judge loop over a board card, bounded by round caps, token ceilings, gate discipline, and a human merge gate.
aliases: [council run, deliberation loop]
tags: [pi-council/concept]
sources: ["[[2026-08-24-bugfix-seat-prose]]"]
created: 2026-08-23
updated: 2026-08-24
---

> ⚠️ Derived from `council/procedures/council.md` + `council-runner.md` (captured 2026-08-23). Verify against the procedure files.

`/council` is the core procedure. The **facilitator decides nothing** — it routes
work, fans seats out, counts rounds, and writes the board. Tests decide testable
disputes; ruling seats decide judgment; the human decides the rest.

## The 15 steps (compressed)

1. **Read and gate** — card must be `state: Ready`; decide full-vs-mechanical and surface-touching.
2. **Independent first pass** — dispatch `owner` + (`designer` if surface).
3. **Bounded exchange** — 2-3 rounds max; each generator responds to others.
4. **Skeptic attacks/runs tests** — files falsifiable objections + runs them.
5. **Synthesis** — `consolidator` sorts into settled / open-judgment / open-objections.
6. **Route what doesn't close** — open-judgment → product-owner/steward; else `Needs Human`.
7. **Write spec & hand to one owner** (full-council cards write a design spec; mechanical cards hand the card itself).
8. **Owner plans + implements** in a worktree, then clears gates; `In Review` set only from the observed PR.
9. **Verify by acting** — Skeptic at the branch, actual tests.
10. **Judge the stop condition** — PASS/REJECT from goal + Skeptic evidence only.
11. **Human merge gate** — human merges, never a seat or the facilitator.
12. **Sync + reconcile** — rebase `main`; only merged-with-green-CI sets `Done`.
13. **Card the follow-ups** — every surfaced idea becomes its own `FLLWUP-n` card.
14. **Persist** — offer to file durable decisions into the wiki.

## Guards

- ≤3-round cap in step 3 (hard).
- Per-run token ceiling (stop, don't burn silently).
- **Every dispatch bounded** (timeout windows per dispatch type).
- **Stop one bad agent before scaling to more.**
- **Owner gates met in full regardless of change size.**

## Ruling seats & recursion

`product-owner` rules card-level open-judgment; escalates to `steward` for
**portfolio-level** changes. `council-runner` (the autonomous epic container)
never dispatches ruling seats; it escalates and resumes. See
[[council-runner]] + `council/procedures/features-deliver.md`. Its deterministic
merge check requires every owner gate green in full, without naming a
repo-specific gate file (see [[2026-08-24-bugfix-seat-prose]]).

## Related

- [[engineering-board]], [[seats]], [[preflight]], [[superpowers-dependency]]
- [[2026-08-23-pi-council-design-spec]]

## Sources

- `council/procedures/council.md` @ `8913c6b`
- `council/procedures/features-deliver.md`
- [[2026-08-24-bugfix-seat-prose]]