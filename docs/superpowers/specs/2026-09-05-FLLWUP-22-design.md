# FLLWUP-22 — Scrollbar theme token drift vs pi 0.85.x: regime-aware characterization, routing-only deletion, evidence-grounded upper bound

Card: FLLWUP-22 · Epic: EPIC-6 · Date: 2026-09-05 · State at spec: Deliberating (steps 2–6 closed; the recorded decision mechanism is the evidence the step-8/9 runs produce, per the card contract: "the decision be made, evidenced, and recorded, with tests green on whichever side holds").

## 1. What the deliberation settled (context, not an open design space)

- **The drift is real, narrow, and fully characterized.** pi 0.85.0 ≡ 0.85.1 (byte-identical theme dirs). Against 0.84.3, the only bundled-default changes are the two scrollbar lines: `dark.json`/`light.json` add `scrollbarTrack` (`darkGray`/`lightGray`) and remap `scrollbarThumb: selectedBg` → `text` (Skeptic obj 3, CLOSED-GREEN — delta-completeness). 0.85.x's `theme.js` moves `scrollbarThumb` from the **bg** map (`?? selectedBg`) to the **fg** map (`?? text`) and adds `scrollbarTrack ?? muted`; `bgColorKeys` shrinks 8→7; a new `theme-json.js` validation module + schema updates ship. Resolved-map count goes 55→56 (pi-owned, version-parameterized, independent of any council change).
- **The council never draws the scrollbar.** `grep scrollbar extensions/` → only `seats.ts:53` (`OPTIONAL_TOKENS` constant), `theme-activation.ts:138,146` (fallback table + bg-key set). `navigator.ts` draws only `border`/`accent`/`dim`/etc. The scrollbar is pi's own chrome; EV-4's token-only drawing contract is untouched on both bands.
- **The shipped council themes are version-agnostic and 0.85.x-clean as shipped** (51 live tokens, zero `scrollbar*` keys; the 4 optional tokens are omitted and filled by fallback). The breakage is **test-contract over-pinning**: the four committed tests (`theme.test.ts` T5/T6/T7 + `theme-activation.test.ts` construction-identity) assert pi's *private* fallback table (thumb→selectedBg, 55-key resolved map), not council behavior.
- **There is also a type-level break FLLWUP-21 missed** (principal; Skeptic obj 2 CLOSED-GREEN): on 0.85.x, `ThemeBg` drops `scrollbarThumb` (to 7 keys), so gate 2 (`bunx tsc --noEmit`) fails too — 3×TS2345 at `theme-activation.test.ts:100,144,144` (`getBgAnsi("scrollbarThumb")` not assignable to `ThemeBg`); `extensions/` itself compiles clean on both bands.
- **The extension's construction helpers are version-coupled but inert-harmful:** `withThemeColorFallbacks` (`theme-activation.ts:138`) hardcodes `scrollbarThumb ?? selectedBg` and `BG_TOKEN_KEYS` (`:145-148`) routes `scrollbarThumb` to bg. On 0.85.x the constructor reads scrollbarThumb from fg, so the bg-injection is ignored/inert — but it *mirrors pi's private fallback*, is redundant with the constructor's own regime-correct `??` (verified in both dist files: 0.84.3 `theme.js:266` vs 0.85.1 `theme.js:184`), and is actively wrong on 0.85.x (routes an fg token to bg). Deletion is the delegation fix: stop hand-copying pi's fallback chain; let the installed constructor fill per regime.
- **The allowlist is the consumer recolor contract, and it must be kept.** `VALID_COLOR_KEYS` (`seats.ts:102`) throws on any unlisted key; `activateTheme` swallows the throw into a warning notify and never calls `setTheme` — deleting a token from the allowlist silently deactivates the theme for any consumer who declared it in `.council.json` (Skeptic obj 5 CLOSED-GREEN, real run). "Keep" is settled across all three seats.
- **`resolvedPalette` has zero production consumers** (Skeptic obj 6 CLOSED-GREEN: `grep -rn resolvedPalette extensions/` → definition only; sole caller is its unit test). Not removed by this card unless the test rewrite makes it dead; if kept, its oracle test must be rebuilt to the trim-only shape.
- **Three optional-token equalities are band-stable** on both bands, both variants (Skeptic obj 4 probe table): `searchMatchBg===selectedBg`, `searchMatchText===text`, `thinkingMax===thinkingXhigh`. Only `scrollbarThumb`'s source is regime-dependent (selectedBg on 0.84.3, text on 0.85.1), and only `scrollbarTrack` is new.
- **The lock question.** FLLWUP-21's R-2 framed the pin as verified-interval housekeeping; this card exists to give the upper bound *meaning* (the card's own Intent). The majority final (owner 18.11 + principal 18.12): the lock position is a demonstration decision — once the tests are regime-aware, a lock at the top of the declared range (0.85.1 — what a fresh `">=0.84.3 <0.86.0"` install resolves, recorded by FLLWUP-21 plan doc line 93) makes the **gate set** the ongoing falsifier of the compatibility claim, rather than a stale one-off run. Designer's final (18.10) holds the lock at 0.84.3 and the label "incompatible as shipped; verified-to-0.84.3-only" **conditionally**: it will sign the optimistic label on Skeptic-verified evidence that the regime-aware rewrite is green on a 0.85.1 lock with the deletion. The card contract makes the decision the deliberation's to make on evidence; the evidence is the step-8/9 run.

## 2. The recorded decision mechanism (from the card contract + consolidation routing)

Not a pre-decided label: a decided **mechanism**. The spec implements the settled adaptation; the run record states the decision the evidence sustains:

- **If** the regime-aware rewrite is green on BOTH the lock-resolved 0.85.1 (gates) and the recorded 0.84.3 verification (smoke floor + scratch run), the recorded decision is **"0.85.x-compatible as shipped (deltas named)"** — the majority position and designer's conditional satisfied. The devDependency upper bound `">=0.84.3 <0.86.0"` then means: **both extremes of the declared range are gate-verified (0.85.1 by the CI gate set; 0.84.3 by the smoke pin + recorded run); any future theme-machinery shift fails the suite loudly because the tests read the installed machinery.** FLLWUP-21 R-2(b)(i) (the 0.84.3 lock as theme-test-break workaround) is superseded.
- **If** the rewrite cannot be made green at 0.85.1 (owner's gate-3 red at the locked version with the deletion applied), that is a gate failure the owner records honestly; the run does not close with a false claim. The card then reverts to Side B by default: lock stays 0.84.3, recorded label "incompatible as shipped; verified-to-0.84.3-only" with the byte deltas named.

The owner does not pick the label; it produces the evidence (the locked gate run + the 0.84.3 verification) and records which side the evidence sustains, with the delta names and gate outputs.

## 3. Deliverables

1. Routing-only deletion at the scrollbarThumb seam (`extensions/theme-activation.ts`): drop `scrollbarThumb` from `BG_TOKEN_KEYS` (8→7) and drop the `scrollbarThumb` line from `withThemeColorFallbacks` (trim-only; keep the three band-stable lines `thinkingMax`/`searchMatchBg`/`searchMatchText` — settled 2v1, principal's final withdrew "delete helper entirely" as over-broad, consolidator ratified trim-only).
2. Regime-aware/construction-identity rewrite of the four failing test surfaces (T5/T6/T7 + the two construction-identity blocks), green on the lock-resolved version and on the recorded 0.84.3 verification.
3. `bun.lock` regenerated to the in-range top **0.85.1** (the range's default-newest resolution) when the tests sustain the optimistic side; devDependency string byte-exact `">=0.84.3 <0.86.0"` unchanged; smoke stays pinned 0.84.3 (orchestrator binding, untouched).
4. The empirical record: plan doc under `docs/superpowers/plans/` + card run-record mirror naming the decision, the token deltas with byte-level evidence, what the upper bound means, and superseding FLLWUP-21 R-2(b)(i) on the optimistic side.

## 4. Deliverable 1 — the routing-only deletion

**Files:** `extensions/theme-activation.ts` only.

- `withThemeColorFallbacks` (`:134-142`): delete exactly the `scrollbarThumb: colors.scrollbarThumb ?? colors.selectedBg,` line. Keep `thinkingMax ?? thinkingXhigh`, `searchMatchBg ?? selectedBg`, `searchMatchText ?? text` (band-stable, idempotent with the constructor on both bands — the 0.85.1 constructor's bg block no longer re-fills scrollbarThumb, so the function must not either). Update the function's doc comment: it mirrors pi's band-stable fallback sources only; the scrollbar thumb is delegated to the installed `Theme` constructor's regime-correct fallback.
- `BG_TOKEN_KEYS` (`:145-148`): remove `scrollbarThumb` from the set. The remaining 7 bg keys (`selectedBg`, `searchMatchBg`, `userMessageBg`, `customMessageBg`, `toolPendingBg`, `toolSuccessBg`, `toolErrorBg`) are exactly 0.85.x's `ThemeBg`.
- `splitThemeColors` picks up the 7-key set automatically (it iterates `BG_TOKEN_KEYS`); no other production change.

**Do NOT touch:** `extensions/seats.ts` (`OPTIONAL_TOKENS`/`VALID_COLOR_KEYS` stay exactly as-is — allowlist deletion is silent consumer deactivation, Skeptic obj 5; whether `scrollbarTrack` should be *added* to `OPTIONAL_TOKENS` is the owner's recorded discretion per the consolidator, decided consistently with the keep-allowlist rationale: a consumer may declare the new 0.85.x token and must not hit a swallowed throw; record whichever way, both are defensible, but if added, the 0.84.3-band behavior of a declared track token is inert-by-construction). The shipped themes `themes/pi-council-{dark,light}.json` are **unchanged** (no explicit scrollbar keys — placement identity depends on the constructor).

**Verified feasibility:** Skeptic obj 4's probe table shows exactly this design yields `materializeTheme` ≡ pi's `loadThemeFromPath` behavior on both bands with zero version detection; obj 1's red run is red only because the *current* (old) test corpus still asserts the old contract. `extensions/` typechecks clean on both bands (obj 2).

## 5. Deliverable 2 — the regime-aware test rewrite

**Files:** `test/theme.test.ts`, `test/theme-activation.test.ts` (and `test/theme-resolved-palette.test.ts` if its oracle needs rebuilding to the trim-only shape; `test/theme-compliance.test.ts` has no scrollbar dependency and is untouched).

**Governing principle (settled):** assert council behavior and pi's installed machinery, never pi's private fallback constants. No hardcoded band string in production code; `as never` at the two regime-dependent probe sites (repo precedent: `theme-compliance.test.ts:80,97`), never a naive typed ternary (tsc typechecks both branches against the single installed `.d.ts` — principal's trap, obj 2).

**Required assertions (the owner's 8-item corpus, principal's construction-identity committed, mutually consistent):**

1. **T5** — resolved-key count is pi-owned: assert `Object.keys(resolved)` has the shipped-51 ∪ band-stable-3 keys present (membership, not a literal count), or the count equals the pi-resolved reference's key count. If a literal is kept, it is version-parameterized (56 ≥ 0.85.0, 55 ≤ 0.84.3) — do not hardcode `55`.
2. **T6** — full-map equality `shippedMap === refMap` stays (band-stable: both sides run the same installed resolver, objects 7d/4 GREEN); drop only the inner `toHaveLength(55)` literal.
3. **T7** — keep the three band-stable equalities verbatim (`searchMatchBg===selectedBg`, `searchMatchText===text`, `thinkingMax===thinkingXhigh` — probe-verified on both bands, both variants). Replace `resolved.scrollbarThumb === resolved.selectedBg` with the regime-conditional: `resolved.scrollbarThumb === (P ≥ 0.85.0 ? resolved.text : resolved.selectedBg)` where `P` is the installed pi version resolved like the env-split tests resolve theirs, or — stronger, prefer this — assert `resolved.scrollbarThumb === <pi-resolved reference>.scrollbarThumb` so no version literal is needed.
4. **`withThemeColorFallbacks` unit test** (`theme-activation.test.ts:77-82`) — rewritten to the trim-only shape: assert the three kept `??` sources and that the returned map does **not** contain `scrollbarThumb` (or that an input `scrollbarThumb` passes through unchanged). Under trim-only this test survives; it dies only under the rejected delete-helper-entirely variant.
5. **`splitThemeColors` test** — assert exactly the **7** bg keys (scrollbarThumb no longer among them) and that an input `scrollbarThumb` routes to fg.
6. **Construction identity, truecolor** (`:96-107`) — keep accent/selectedBg/searchMatchBg/searchMatchText/thinkingMax band-stable; the thumb probe is regime-conditional through `as never`: `(P ≥ 0.85.0 ? getFgAnsi("scrollbarThumb" as never) : getBgAnsi("scrollbarThumb" as never))` against the band-correct source — or drop the thumb from this test and let the 256-mode identity cover it.
7. **256-mode construction identity** (`:137-150`) — the recorded throw site. Remove `scrollbarThumb` from the `getBgAnsi` comparison loop; on ≥0.85 assert `getFgAnsi("scrollbarThumb") === ref.getFgAnsi("scrollbarThumb")` (council-materialized ≡ pi-original via `loadThemeFromPath` — the strongest oracle, regime-blind by construction). Remaining loop keys band-stable.
8. **Drift characterization test (new or folded)** — asserts the per-band behavior table on the *installed* machinery: on 0.85.x, `scrollbarThumb` is fg with `text` fallback; `scrollbarTrack` is fg with `muted` fallback; on 0.84.3, `scrollbarThumb` is bg with `selectedBg` fallback; `scrollbarTrack` absent. Green on whichever band is installed (this is the "characterize the drift with driven tests" acceptance clause, single-install offline).

**Env-split contract tests** (`test/env-split-contract.test.ts` + fixture): untouched, must stay green on the locked version (version-independent by design per FLLWUP-21; FLLWUP-21's record shows the underlying mechanisms verified on 0.85.0 — re-confirm green at 0.85.1 in the owner's gate run).

## 6. Deliverable 3 — lock, bound, smoke

- `package.json`: devDependencies line stays **byte-exact** `">=0.84.3 <0.86.0"`. Nothing else in `package.json` changes (peerDependencies `"*"`, dependencies untouched).
- `bun.lock`: regenerated so the lock resolves the in-range top **0.85.1** (plain `bun install`; verify the single lock entry is `@earendil-works/pi-coding-agent@0.85.1`). This is the evidence-generating deliverable per the majority design; it is *inside* the declared range, not ceiling-widening. **If and only if** the recorded evidence lands the pessimistic side (rewrite cannot go green at 0.85.1), the lock stays at 0.84.3 and the record says so — the owner does not leave the lock ambiguous either way.
- `smoke/`: **untouched** (pins 0.84.3; orchestrator binding). The smoke remains the floor falsifier.

## 7. The empirical record (Deliverable 4)

Owner writes `docs/superpowers/plans/2026-09-05-FLLWUP-22-plan.md` (carried in the PR — branch-verifiable): the implementation plan plus the empirical record, covering:

- (a) the constraint string `">=0.84.3 <0.86.0"` byte-exact;
- (b) versions empirically verified against: the lock-resolved pi the gates run (**0.85.1** on the optimistic side) with the full gate set output green; the recorded **0.84.3** verification (scratch or smoke-bound) with the same suite green; node_modules-synced via `bun install` first (Skeptic obj 7b: the repo's installed node_modules is stale at 0.84.2 vs the lock's 0.84.3 — always `bun install` in the worktree before local gates);
- (c) versions verified to fail / rejected: the recorded 0.85.0/0.85.1 theme-test failures on the OLD corpus (FLLWUP-21 record + this run's obj 1/7c) as the drift evidence — now resolved by the rewrite; no out-of-interval version in scope;
- the named decision the evidence sustains (0.85.x-compatible as shipped / or pessimistic default), the token deltas with byte-level diffs (`scrollbarThumb` bg`??selectedBg` → fg`??text`; `scrollbarTrack` added; `bgColorKeys` 8→7; resolved count 55→56; `theme-json.js` + schema), and what the devDependency upper bound therefore means (Section 2's two branches);
- supersession of FLLWUP-21 R-2(b)(i) on the optimistic side;
- the `scrollbarTrack`-in-allowlist discretionary call and its rationale.

The runner mirrors the decision, deltas, and bound meaning onto the card face (`council/cards/FLLWUP-22.md` run record) in the step-8 recording commit.

## 8. What this card does NOT do (binding)

- No change to packaged seats/procedures (`council/agents/*.md`, `council/procedures/*.md`).
- No change under `smoke/` (0.84.3 pin and harness contract).
- No change to the FLLWUP-21 env-split contract tests or fixture (stay green).
- No bound widening: the declared range `">=0.84.3 <0.86.0"` is not edited; `<0.86.0` remains the untested boundary.
- No version probe in production code (`extensions/` stays a pure delegation fix; `as never` is test-side only, at the two probe sites).
- No token adaptation in the shipped theme files.

Diff scope: `extensions/theme-activation.ts`, `test/theme.test.ts`, `test/theme-activation.test.ts`, (`test/theme-resolved-palette.test.ts` only if its oracle requires it), `bun.lock`, `docs/superpowers/plans/2026-09-05-FLLWUP-22-plan.md`, plus this spec.

## 9. Gates (authoritative record: `.github/workflows/gates.yml`; this repo has no `docs/gates/GATE-EVIDENCE.md`)

All four, in order, in the worktree, against the lock-resolved pi (0.85.1 on the optimistic side); no threshold lowered, no finding suppressed, regardless of change size:

1. `bun install --frozen-lockfile` succeeds (validates the regenerated lock).
2. `bunx tsc --noEmit` exits 0 (the `as never`/256-mode rewrite clears the 3 TS2345 sites).
3. `bun test` — the full suite green, including the rewritten theme tests and the untouched env-split tests, on the locked version.
4. `python3 council/validate.py` clean.

Plus the recorded 0.84.3 verification (scratch tree or smoke floor) with the same suite green — the two-extreme evidence that makes the upper bound mean something (Skeptic obj 4's probe table is the design's feasibility proof; the owner's gate run is its existence proof).

There is no import/normalization gate and no production-boot gate for this repo; the four above are the complete set. The pinned 0.84.3 smoke is untouched and not re-run by this card (except as the owner's own recorded 0.84.3 verification if done through it).

## 10. Branch/PR conventions (run binding)

- Work in an isolated worktree under the repo's `.worktrees/`, created from `origin/main` — never `git checkout`/`switch`/`reset` against the main repository path (the local `main` carries the runner's council-record commits that must not appear in the PR diff).
- Branch name `feat/fllwup-22-scrollbar-token-drift` (or similar); PR base `origin/main`; conventional commit(s).
- The runner verifies at the exact PR head SHA and head worktree path (subject pins per FLLWUP-18/19), then runs step 9 (Skeptic at the branch: full gate set on the locked pi + the regime probes), step 10 (judge with the card's `goal` + the Skeptic's evidence only), and the step-11 deterministic merge check (five criteria, pinned to the checked SHA).