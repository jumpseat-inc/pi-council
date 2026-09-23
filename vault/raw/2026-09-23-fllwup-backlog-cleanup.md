# FLLWUP backlog cleanup — merge and retirement map

Date: 2026-09-23
Scope: the open `FLLWUP-*` cards in the **Backlog** column of `council/board.md`.

The cleanup consolidated near-duplicate follow-ups and retired two cards whose
work was already delivered or whose design had already been ruled. Every
absorbed card's `## Intent` and `## Acceptance` survive **verbatim** inside its
survivor under `### Absorbed: FLLWUP-N` / `### From FLLWUP-N` sub-sections, so no
follow-up essence was lost. Deleted card files remain in git history.

Result: 65 open follow-ups → **42**. `python3 council/validate.py` passes.

## Merges (survivor ← absorbed)

| Survivor | Absorbed | Rationale | Result title |
|---|---|---|---|
| FLLWUP-83 | FLLWUP-84, FLLWUP-81 | One prototype-chain `in` class across the gate loaders; FLLWUP-84 names itself "one loader over"; FLLWUP-81 is the same loader hygiene | Close the prototype-chain `in` class across the gate loaders and pin or remove gate-state's duplicated policy read |
| FLLWUP-77 | FLLWUP-78, FLLWUP-79 | One legend row, one render function; FLLWUP-78 already depends on FLLWUP-77's count variant | Usage block gate legend: count + self-describing `deliberation` key + ledger signpost |
| FLLWUP-112 | FLLWUP-113 | Explicit siblings that must sequence (render token ↔ generalized scan) | Render a config-home token and derive the procedure scan's allowlist |
| FLLWUP-68 | FLLWUP-101 | FLLWUP-101 says to build the falsifier "in a shape FLLWUP-68 can reuse" | Reusable cold-read persona harness over council output surfaces |
| FLLWUP-37 | FLLWUP-38 | One header expression; FLLWUP-38 says both "should land under one writer" | Inline progress header: overflow pin + grant-width clamp |
| FLLWUP-89 | FLLWUP-90, FLLWUP-92 | All `runStartGatePreflight`: add to `/features-new`, e2e reach proof, empty-apiKey seam | Run-start credential preflight: cover /features-new, prove reach, normalize seam |
| FLLWUP-30 | FLLWUP-33 | FLLWUP-33 names itself "sibling in shape to FLLWUP-30" — two opt-in live arms | Opt-in live falsifiers for the usage path |
| FLLWUP-1 | FLLWUP-2, FLLWUP-3 | All council theme `/export`; share the export-pinning test; FLLWUP-3 is an observational note | Council theme export: no-crash + editable overrides + discoverability |
| FLLWUP-97 | FLLWUP-98 | Same board section and headroom probe | Follow-up board cap: tripwire pin + recency window |
| FLLWUP-82 | FLLWUP-96 | Overlapping cross-file questions↔weights mismatch refusals | Gate questions↔weights equality: loaders + composition |
| FLLWUP-85 | FLLWUP-87 | Both amend the `.council.json` writer (canonical order/seed + concurrency) | `.council.json` write-path hardening |
| FLLWUP-63 | FLLWUP-80 | FLLWUP-80: "same class as FLLWUP-63" — flaky-test-edge sweep | Test-determinism sweep |
| FLLWUP-86 | FLLWUP-88 | Both mid-run `.council.json` write side-effects | `.council.json` mid-run write side-effects |
| FLLWUP-36 | FLLWUP-64 | All no-behavior-change deferred cosmetics | Deferred no-behavior-change cleanups |
| FLLWUP-99 | FLLWUP-100 | The two halves of "make the card gate actually meter"; FLLWUP-100 sequences after FLLWUP-99 | Make the card gate actually meter |
| FLLWUP-102 | FLLWUP-103 | Both follow-up-surface amendments from EV-82/83/84 | Follow-up surface amendments |
| FLLWUP-7 | FLLWUP-32 | Same retention-policy class for two append-only stores | Retention policies for the append-only stores |

## Retired (deleted, no survivor)

| Card | Reason |
|---|---|
| FLLWUP-91 | Its acceptance is satisfied by recording the already-settled EV-76 ruling: the wrapped spawn-on-pass design was deliberately rejected; the card only re-litigated it. |
| FLLWUP-94 | Open copy decision on `gateStatusLine` naming `.council.json`; resolvable in one sitting and not worth a standing card. The EV-77 wiki page remains the documented pointer. |

## Verified-resolved (left as cards but narrowed by tree evidence)

| Card | Note |
|---|---|
| FLLWUP-63 | The jitter test was already corrected in the tree to `toBeLessThanOrEqual(7500)`; only the seeded `rand ≥ 0.9999` pin was open — now a sub-item of the merged determinism card. |
| FLLWUP-69 | `council.md` step 13 already carries the pre-write pin (`test/prose.test.ts:526`) and `features-deliver` states the rule; only a `features-deliver` prose pin remains. Kept (essence not yet fully captured elsewhere). |