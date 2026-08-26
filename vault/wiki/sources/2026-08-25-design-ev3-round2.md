---
title: EV-3 Round 2 — Designer Position (Activation Disputes)
type: source
summary: The designer's round-2 bounded-exchange response on EV-3 — all five disputes land a row each (custom pair blocks via principal; ui.theme variant continuity; hold on notify; tempfile construction; corrected acceptance line), each closing a named Gulf and carrying falsifiable predictions P22–P36.
aliases: [design-ev3-round2, ev3-round2, activation disputes]
tags: [pi-council/theme, pi-council/source]
sources: ["[[2026-08-25-design-ev3-round2]]"]
created: 2026-08-25
updated: 2026-08-25
---

# EV-3 Round 2 — Designer Position

The round-2 delta on EV-3 after the bounded exchange. Engages the five open
disputes and predicts the visible failure if each side landed wrong. **This is
the designer's position — the settled EV-3 spec overrides several rows.**

## The five-dispute table (round-2 landing)

| # | Dispute | Designer R2 | Gulf closed |
|---|---|---|---|
| 1 | Custom pair `A/B` | **block** (principal's): all custom pairs block; only literal `"light/dark"` activates | Evaluation — user who wrote `nord-light/nord-dark` expects Nord, not silent omp |
| 2 | Auto-variant source | **read `ui.theme` variant once pre-activate** (principal's): continuity wins over re-detecting COLORFGBG | Evaluation — no palette flip at session_start |
| 3 | Notify | **hold** activate(info)+block(warning), silent noop | Evaluation — notify is load-bearing for the in-memory route |
| 4 | Construction | **tempfile + `loadThemeFromPath`** (own R1) — smaller surface; ground-truth ANSI seam as NET if reimplementation wins | — |
| 5 | Acceptance line | **nominate corrected text**: instance reached via `ui.theme`, compared by `getResolvedThemeColors(instance)`; the `getThemeByName` line is unsatisfiable | — |

## Contradiction vs settled spec (flagged)

Dispute 2 lands on `ui.theme` variant continuity (P24/P25/P32 predict a light
COLORFGBG with a dark resolved palette must NOT flip). The **settled EV-3
spec + `extensions/theme-activation.ts`** instead use the sync
`detectTerminalBackgroundFromEnv()` (COLORFGBG) via a `terminalTheme` input,
matching the round-1/owner position. The raw doc reflects an intermediate
deliberation state; the final call was the env heuristic. See
[[council-theme]] for the shipped semantics.

Similarly dispute 4 keeps tempfile construction, but the settled spec §4
mandates **in-memory, no third on-disk copy** (a `try/finally` tempfile is a
disk write; `loadThemeFromPath` is not publicly reachable). The settled path
reimplements `withThemeColorFallbacks` + `resolveThemeColors` + `new
Theme(fg,bg,mode)`.

## Falsifiable predictions P22–P36

Custom-pair and malformed-pair block (P22/P23); continuity not-flip (P24/P25)
and explicit-pin-wins (P32); row-c notify truthfulness (P26); silent noop
(P33); reimplementation ground-truth ANSI + tempfile cleanup + try/finally
(P30/P31/P34); headless mode defensive noop (P28); child-seat no re-activation
(P29); notify-copy ↔ predicate coupling (P18); variant-pin notify explanation
(P19); theme-watcher re-engagement is EV-4's job (P35); instance lifetime
across session_shutdown (P36).

## Escalated to product-owner (bound)

- Notify existence (if PO wants zero output, defer).
- Acceptance-line correction (one-line card-text fix, EV-2 one-word precedent).

## Related

- [[council-theme]] — the shipped activation semantics (differs on 2/4)
- [[2026-08-25-design-ev3]] — the round-1 position this updates
- [[council-config]] — the theme section shape

## Sources

- `vault/raw/2026-08-25-design-ev3-round2.md`
- `docs/superpowers/specs/2026-08-25-EV-3-design.md` (settled authority)
- `extensions/theme-activation.ts`
