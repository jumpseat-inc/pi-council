---
title: Env-Split Contract
type: concept
summary: pi-council's parent/child mode split is keyed on the COUNCIL_SEAT env var and is version-independent — clean env registers all parent-mode commands, COUNCIL_SEAT set registers zero — proven by a two-pole verification after a "0.85.0 regression" proved to be probe contamination.
aliases: [env-split contract, env split, mode split, COUNCIL_SEAT, parent child mode split, env-keyed mode split]
tags: [pi-council/concept, pi-council/testing]
sources: ["[[2026-09-06-epic6-close-run-ledger]]"]
created: 2026-09-06
updated: 2026-09-20
---

# Env-Split Contract

The contract governing pi-council's parent/child engine split
(`extensions/index.ts`): which half of the package loads is keyed on the
**`COUNCIL_SEAT` environment variable**, not on pi's version.

- **`COUNCIL_SEAT` absent (parent mode)** — the extension loads fully and
  registers all parent-mode slash commands (14 as of v0.18.0).
- **`COUNCIL_SEAT` present (child mode)** — the extension deliberately
  downgrades to the seat sandbox: hub tools + seat MCP only, **zero slash
  commands**.

## The false regression it explains

The kitty search-smoke surfaced an apparent "extension-load failure on
stock pi 0.85.0" (zero commands, `/council-models` misrouting to a real
model dispatch). FLLWUP-21's deliberation disproved the version story:
`pi-manifest.js` and `package-manager.js` are byte-identical across
0.84.3 and 0.85.0, `loader.js` differs only in an `isBundledNode`
refactor, and a clean scratch-HOME install of stock 0.85.0 registers all
14 commands. The symptom reproduced **only when `COUNCIL_SEAT` was in the
process env** — the discovery probe had run inside a council-runner seat
session that inherited it. ⚠️ **No version regression exists**; any future
claim that a pi version broke extension loading must first exclude this
variable.

## The documented hazard (deliberately unfixed)

In child mode, an unregistered slash command falls through to **a real
model dispatch** — reproduced live (a run hung on a model call). From
inside a seat session, an accidental or misdirected `/council-*` command
therefore costs a real API call instead of failing fast. FLLWUP-21
documented this and pinned the contract; redesigning the fallthrough is
future work, not done.

## The two-pole verification

`test/env-split-contract.test.ts` + `test/fixtures/env-split-driver.ts`
(FLLWUP-21, PR #37 `48f8ada`): the installed pi binary is driven headlessly
in a fresh scratch HOME with explicit per-spawn env (seat-session
contamination immune by construction) — clean env asserts all parent-mode
commands register; `COUNCIL_SEAT` set asserts zero register. Both poles run
in the ordinary gate set on every version the repo declares supported, so
the contract cannot silently drift again.

## The probe discipline it implies

Any test, script, or smoke that observes the package's extension behavior
must **control `COUNCIL_SEAT` explicitly** — never inherit it. The kitty
harness is contamination-proof by construction (forwards only
`OPENROUTER_API_KEY`/`SMOKE_PHASE`, unsets council vars); the one probe
that wasn't cost a card's worth of misdiagnosis.

## Related

- [[council-runner]] — the seat whose dispatch inputs must state the constraint
- [[seats]] — what child mode is for (sandboxing)
- [[smoke test]] — the harness family and its contamination discipline
- [[hub job supervision]] — dispatch/discipline layers
- [[2026-09-06-epic6-close-run-ledger]] — the run that proved it

## Sources

- [[2026-09-06-epic6-close-run-ledger]]
- `extensions/index.ts`, `test/env-split-contract.test.ts`
