---
title: 2026-09-22 Gate Noul Fix
type: source
summary: The fix for FLLWUP-104 — the live decisions wire keys a noul answer `noul` while the engine read `probability`, so both gate domains were inert; canonicalization at the shared parse seam (`e903b67`) restored them, and the episode exposed that pi loads the globally-installed clone, not the working tree.
aliases: [gate noul fix, noul wire-shape fix, FLLWUP-104 fix, 2026-09-22-gate-noul-fix]
tags: [pi-council/source, pi-council/gate]
sources: []
created: 2026-09-22
updated: 2026-09-22
---

# 2026-09-22 Gate Noul Fix

The fix for **FLLWUP-104** (EPIC-13): the live OpenRouter decisions endpoint
returns a noul answer as `{"type":"noul","noul":<p>}`, while the engine read
`answer.probability` — so every live card-gate and follow-up call died at
`decide()`/`decideFollowup()` and both domains were inert
([[inert-gate-fallback]]).

## What shipped

`e903b67` (`fix(gate): canonicalize the wire noul answer key to probability`)
adds `canonicalizeAnswer` inside `parseDecisionsResponse`
(`extensions/gate-transport.ts`) — the **single parse site** shared by `runGate`
and `runFollowupGate` ([[decisions-wire-canonicalization]]). It maps
`noul`→`probability`, throws on both-keys-disagree or neither-key, and passes
non-noul answers verbatim. Five red-first tests in `test/gate-transport.test.ts`.

The pole was **proven, not assumed** (the card's load-bearing requirement):
live, a trivially-true statement returns `noul: 0.99` and a trivially-false one
`noul: 0.01`; the pole-semantics arm now asserts `probability > 0.9` on the new
key.

## Verification

- tsc + `validate.py` clean; full offline suite **1473 pass / 0 fail**.
- `COUNCIL_INTEGRATION=1 test/gate-run-live.test.ts` → **3/3**.
- `COUNCIL_JEV_LIVE=1 test/ev84-followup-falsifier.test.ts` → 7 pass / 1 fail:
  arm 4 now reaches real dispositions but fails its pinned merge **direction**
  (model B→A vs fixture A→B on near-identical candidates). Not the drift; the
  card is therefore not formally green by its own acceptance.

## The loading-scope lesson

The fix was committed but the in-session gate **still** failed. pi loads
pi-council from the **globally-installed clone**
(`~/.pi/agent/git/github.com/jumpseat-inc/pi-council`), not the working tree, so
`/reload` reloaded a stale clone. Engine changes need push → update install →
`/reload`; repo-local `council/` payload is read from the working tree
regardless. See [[extension-load-scope]].

## Aftermath

With the gate live, the four held BUG-2 follow-ups were recorded and ruled:
`product-owner` ratified three as `File` ([[decisions-wire-canonicalization]] →
`FLLWUP-109` create-an-absent-parent, `FLLWUP-110` cache hit/miss counts,
`FLLWUP-111` async `runTool`) and amended the record-only fourth to `Drop`
(named dissent — its gate `File` was a below-floor artifact). Filed `7779b04`.

## Related

- [[decisions-wire-canonicalization]] — the fix's design
- [[extension-load-scope]] — why the fix wasn't live until pushed
- [[inert-gate-fallback]] — the property the drift exercised
- [[metered-deliberation-routing]], [[followup-decision-gate]] — the two domains
- [[2026-09-22-po-ev84-step13-noul-shape-ruling]] — the ruling that scoped the fix

## Sources

- `vault/raw/2026-09-22-gate-noul-fix.md`
- `extensions/gate-transport.ts`, `test/gate-transport.test.ts`,
  `test/gate-run-live.test.ts`, `test/ev84-followup-falsifier.test.ts`
- Commit `e903b67`; `FLLWUP-104`, `FLLWUP-109`/`110`/`111`
