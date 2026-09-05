---
id: FLLWUP-22
title: Theme token drift vs pi 0.85.x grounds the devDependency upper bound
state: In Review
owner: null
epic: EPIC-6
goal: The scrollbar theme token drift between pi 0.84.x and 0.85.x is characterized by driven tests that are green on the version range the repo declares supported, and the run record states whether council themes are 0.85.x-compatible with the specific token deltas named, grounding the devDependency upper bound in evidence rather than an untested bound.
---

## Intent

Filed from FLLWUP-21's delivery (council-runner report, Skeptic-verified):
the env-split card's step 8 discovered that pi 0.85.0 and 0.85.1 —
bundle-identical to each other — changed the theme machinery's
`scrollbarThumb`/`scrollbarTrack` tokens (`selectedBg` → `text`), breaking
4 committed theme tests. The FLLWUP-21 ruling (R-2) set the devDependency
to `">=0.84.3 <0.86.0"` as verified-interval housekeeping, and the Skeptic
confirmed the lock resolution at 0.84.3 because the 0.85.x band breaks the
theme tests (byte-diff substantiated). Today the upper bound's *meaning* is
only "untested beyond it" — this card makes it mean something: characterize
the drift with evidence, decide whether council themes are reconcilable
with 0.85.x or genuinely incompatible, and record that decision as the
named reason for the bound (or the basis for widening it).

The reconciliation decision itself — adapt the theme tests/tokens to 0.85.x
vs document incompatibility — is the deliberation's to rule with evidence;
this card requires only that the decision be made, evidenced, and recorded,
with tests green on whichever side holds. Filed under EPIC-6 per the run's
standing orchestrator directive; surface is the theme contract, adjacent to
EPIC-1's shipped themes.

## Acceptance

- Driven tests characterizing the scrollbar token behavior across the
  supported version range, green in the repo's gate set on the declared
  side.
- The run record names the decision (0.85.x-compatible after adaptation, or
  incompatible as shipped) with the specific token deltas and byte-level
  evidence, and states what the devDependency upper bound therefore means.
- If the decision is to adapt, the adaptation keeps the ruled theme
  contract intact (EPIC-1/EV-4 precedents — council-drawn UI draws only
  from pi theme tokens); if the decision is to document incompatibility,
  the record names the upstream delta precisely enough for a future bump
  to act on.
- Full gate set stays green (`bun test`, `bunx tsc --noEmit`,
  `python3 council/validate.py`).

## Execution (run record)

### Step 1 gate (2026-09-05, runner container)

**Full council, surface-touching — designer seated.** The card is
cross-seam (theme machinery `extensions/theme-activation.ts`, the theme
tests `test/theme.test.ts` + `test/theme-activation.test.ts`, and the
devDependency `package.json`/`bun.lock`), and the reconciliation decision
(adapt the theme tests/tokens to 0.85.x vs document incompatibility) is
explicitly design-judgment per the card's own Intent — a real tradeoff,
not an implementation choice. Surface-touching per the card's own
framing ("surface is the theme contract"): the decision governs which pi
token the scrollbar thumb draws from and therefore what a person sees on
the 0.85.x band; the deliverable keeps the EV-4 token-only contract only
as a constraint on the drawing mechanism, not on the color decision.
So `designer` joins `owner`/`principal` as a third generator in steps 2–3.

Evidence base (reproduced on this container, `/tmp/fllwup22-ev/theme-*`):
pi 0.85.0 ≡ 0.85.1 byte-identical theme dirs; against 0.84.3 both
`dark.json`/`light.json` add `scrollbarTrack` and remap `scrollbarThumb`
`selectedBg` → `text`; 0.85.x `theme.js` resolves `scrollbarThumb` in the
**fg** map with `?? text` fallback (and `scrollbarTrack ?? muted`) where
0.84.3 resolved it in the **bg** map with `?? selectedBg` fallback — the
mechanism behind the 4 failing tests (FLLWUP-21 record).

### Steps 2–3 — independent first pass + bounded exchange (3 rounds, cap reached)

Seats: owner, principal, designer (surface-touching → designer seated). All three
positions appended below, labeled by seat, in order of round. Exchange ran the
full 3-round cap; positions converged as noted in the round-3 summary.

#### Round 1

**Owner (job-18.1).** Verdict: reconciliable via test-side contract-scoping, not
token adaptation and not engine version-gating. Evidence personally gathered:
(1) `diff -r /tmp/fllwup22-ev/theme-0.85.0 /tmp/fllwup22-ev/theme-0.85.1` empty —
band is one mechanism (reproduced); (2) against 0.84.3 the ONLY bundled-default
changes are the two scrollbar lines — dark.json adds `scrollbarTrack: darkGray`
and remaps `scrollbarThumb: selectedBg` → `text`; nothing else in either file;
(3) 0.84.3 registers `scrollbarThumb` in the bg map `?? selectedBg`;
0.85.x moved it to the fg map `?? text` + added `scrollbarTrack ?? muted`;
(4) root cause of the 4 failures: the shipped council themes OMIT
`scrollbarThumb` (one of OPTIONAL_4 filled by fallbacks — zero `scrollbar` in
`themes/pi-council-*.json`), so the band's fallback decides the color
(0.84.3 → selectedBg #31363f; 0.85.x → text #e5e5e7). T5/T6 counts break
(55→56, scrollbarTrack injected); T7 equality breaks; the 256-mode
construction-identity test throws at theme.js:236 because the REFERENCE
(loadThemeFromPath of raw merged colors) registers scrollbarThumb in fg on
0.85.x. Approach: (1) declare the two scrollbar chrome tokens OUTSIDE council
ownership — no council-drawn surface touches them, EV-4 token-only contract
untouched on both bands; (2) do NOT declare the tokens in shipped files (cannot
fix T5/T6 — injection unconditional; breaks T7 provenance); (3) adaptation =
the four tests stop codifying pi 0.84.x fallback internals and become
version-aware characterization; keep the three band-stable equalities
(searchMatchBg===selectedBg, searchMatchText===text, thinkingMax===thinkingXhigh);
bound unchanged, lock stays 0.84.3, meaning re-recorded. Testable claims: failure-
set isolation; delta-completeness; extension no-crash + inertness under 0.85.x;
token-declaration-is-not-a-reconciliation-path; band-invariance of the 51+3
resolved map; per-band fallback table (0.84.3 selectedBg / 0.85.1 text+muted).

**Principal (job-18.2).** Cross-seam reading: four surfaces, four version-coupling
statuses — the shipped assets are version-agnostic and 0.85.x-clean (no
scrollbar keys at all); council drawing code never touches the drifted token
(`grep scrollbar extensions/` → only `seats.ts:53` constant,
`theme-activation.ts:138,146`; navigator draws only border/accent/dim/etc.);
the council construction helpers ARE version-coupled but silently inert (0.85.x
reads scrollbarThumb from fg, council pre-injects bg-side → ignored, no crash);
the tests are version-coupled AND over-pinned — that is where the 4 failures
live. KEY FINDING (missed by FLLWUP-21): a TYPE-LEVEL break — on 0.85.x
`Theme.getBgAnsi(color: ThemeBg)` with `ThemeBg` no longer containing
`scrollbarThumb` means gate 2 (`bunx tsc --noEmit`) fails too, not just gate 3.
Reframe: the drift is a test-contract over-pinning, not a theme incompatibility;
council themes are 0.85.x-compatible as shipped for every council-owned
surface. Third horn the card's binary omits: version-parameterized regime probe
(detect pi's scrollbar regime from the installed theme.js). THE SEAM: recorded
label and lock position are the same decision — "compatible" without a recorded
0.85.1 full-gate execution reverts to R-2 housekeeping. Testable claims: gate-2
tsc fail on 0.85.x; failure count ≥5 theme test blocks (not 4); only
scrollbarThumb/scrollbarTrack assertions fail (three equalities band-stable);
no council-drawn surface references a scrollbar token; a regime-parameterized
test green on both bands without network.

**Designer (job-18.3).** Design position: stop having an opinion about the
scrollbar — council draws zero scrollbars. Remove scrollbarThumb from
BG_TOKEN_KEYS and withThemeColorFallbacks, remove from OPTIONAL_4 (→OPTIONAL_2),
let the key fall to pi's defaults; T5 count updates (55→54/53). Delete the
parallel-implementation duplication rather than update it twice — fallback
semantics belong to pi's Theme constructor, not council's
withThemeColorFallbacks. Tradeoff: gives up deliberate scrollbar recoloring via
.council.json. Contrast analysis: thumb-on-track on dark (0.84.3 both selectedBg
→ ~1.05:1) and upstream 0.85.x defaults (~2.4:1) both fail WCAG 1.4.11 — not
council's problem unless council takes an opinion. Falsifiable predictions:
no council-drawn surface changes appearance on either version; the 4 failing
tests go green without lowering assertion strength (re-targeted); devDependency
upper bound widens.

#### Round 2

**Owner (job-18.4).** MOVES on the lock: fresh consumer install of
`">=0.84.3 <0.86.0"` already resolves 0.85.1 (FLLWUP-21 recorded, plan doc
line 93) — once tests are band-independent, the lock position stops being a
correctness decision and becomes a demonstration decision, and "gate the version
consumers actually run" wins → lock regenerates to 0.85.1, smoke stays 0.84.3
floor cover, bound string byte-exact. Concedes principal's gate-2 finding
(reproduced TS2345 against 0.85.1 theme.d.ts — the repo tsconfig does not shield
the two `getBgAnsi("scrollbarThumb")` call sites in theme-activation.test.ts:100,143).
Adopts the regime probe as a BEHAVIORAL probe (minimal Theme +
getFgAnsi definedness), not a version-string parse (machinery-identical versions
can never flip it). Adopts the deletion with one CORRECTION: delete
scrollbarThumb from withThemeColorFallbacks + BG_TOKEN_KEYS (routing), but KEEP
it in OPTIONAL_TOKENS/VALID_COLOR_KEYS (seats.ts) — deleting from the allowlist
converts a consumer's working .council.json recolor into SILENT TOTAL THEME
DEACTIVATION (throw at seats.ts:102 swallowed into a warning notify). Test
shape: keep 3 band-stable equalities; regime-conditional scrollbarThumb; T5/T6
subset + regime count (54 + (fg ? 2 : 1)); 256-identity drops scrollbarThumb
from compared bg list. Claims verified experimentally: 0.84.3 constructor
re-fills the absent key (deletion byte-identical); 0.85.1 runtime repro
(fg-fill, getBgAnsi throws on the reference path only).

**Principal (job-18.5).** Gate-2 is test-only, exactly two call sites
(theme-activation.test.ts:100,143-144); a naive regime ternary FAILS tsc on
BOTH installs — tsc typechecks both branches against the single installed .d.ts,
so the regime-dependent token must route through the untyped surface (`as never`,
repo precedent theme-compliance.test.ts:80,97). Resolved-map count is PI-OWNED
and version-parameterized (55 on 0.84.3, 56 on 0.85.x) regardless of any
council change — designer's 54/53 falsified by the constructor's ?? spread
re-adding every fallback token. Extension: sides with the DROP of the drawing
path (BG_TOKEN_KEYS 8→7, withThemeColorFallbacks loses the scrollbarThumb line)
to remove the untyped-key reliance on a deleted ThemeBg member — but NOT
required for green; keep acceptable on condition the record names the
untyped-key reliance as a deliberately-tolerated seam. LOCK: **lock stays
0.84.3**, bound stays, decision "0.85.x-compatible as shipped", NON-NEGOTIABLE:
run record must contain a one-off 0.85.1 FULL-GATE execution (bun install @0.85.1,
bun test, tsc, validate) cited green. No widening to <0.99.0/*.

**Designer (job-18.6).** CONCEDES the round-1 lock widen entirely:
keep-with-meaning at 0.84.3, R-2 framing re-instantiated ("verified up to
0.84.3; not verified beyond"), on design-contract grounds (council deep-imports
pi's theme.js; bound to pi's resolver, not a layer on top). Concedes "canon of
absence" is insufficient — run record must name the upstream delta
(scrollbarThumb bg??selectedBg → fg??text; scrollbarTrack added darkGray/lightGray;
bgColorKeys 8→7). CONCEDES the pure unit test dies with the helper. RETAINS the
deletion (parallel-implementation elimination; framing matters — "designer
stopped reimplementing a fallback chain"). On VALID_COLOR_KEYS: removal = "the
boundary made explicit rather than a new break".

#### Round 3 (exchange round 2 of 3 — superseded in the finals below where they conflict)

**Owner (job-18.7).** Moves on the seam — at this point holds: lock regenerates
to 0.85.1 (consumers resolve there); behavioral probe, not version-string parse;
deletion with the OPTIONAL_TOKENS/VALID_COLOR_KEYS stay; `as never` at probe
sites. (SUPERSEDED: this round's owner position later conceded the lock to
principal's 0.84.3+recorded-run via job-18.9, and the FINAL owner position
(job-18.11) re-committed to 0.85.1 — see finals below.)

**Principal (job-18.8).** at this point holds: gate-2 test-only at two call
sites; regime-dependent token through `as never`; map count pi-owned 55/56;
LOCK stays 0.84.3 + non-negotiable recorded one-off 0.85.1 full-gate execution;
no widening. (SUPERSEDED in the final below: principal re-moved to 0.85.1.)

**Designer (job-18.9).** at this point holds: keep-with-meaning at 0.84.3,
R-2 framing, routing-only deletion, allowlist stay. (SUPERSEDED by the final
below.)

#### FINAL positions (exchange round 3 of 3 — the binding finals)

**Owner (job-18.11, FINAL).** LOCK — commits to **(A): lock 0.85.1, smoke
0.84.3** (floor cover per orchestrator binding): "The 'one-off rots' objection
is correct and it defeats my own (B). Once I conceded the lock governs only our
gates and not consumer resolution, the lock's only purpose is to maximize the
gate set's falsifying power over the claim we record — a 0.84.3 lock means every
green `bun test` run is green against the band we are *not* claiming." The
recorded one-off 0.85.1 run is retained as a migration witness but is NO LONGER
the evidence — the gate set is. Recorded label: "0.85.x-compatible as shipped
(deltas named)" — record names scrollbarThumb bg→fg with fallback
selectedBg→text, scrollbarTrack added (fg, ?? muted), searchMatchBg/
searchMatchText/thinkingMax fallbacks unchanged; upper bound meaning: 0.85.1
gate-enforced, `<0.86.0` untested boundary. Deletion scope — at this final,
delete `withThemeColorFallbacks` (extension + its unit test — both dist
constructors replicate its fills per-regime); drop scrollbarThumb from
BG_TOKEN_KEYS (8→7); add `scrollbarTrack` to `OPTIONAL_TOKENS`; KEEP the
OPTIONAL_TOKENS/VALID_COLOR_KEYS mechanism (allowlist deletion = silent
deactivation via swallowed throw); shipped theme files stay as-is (no explicit
scrollbar keys). Tests: construction-identity vs `loadThemeFromPath` (both
modes, 9 probe keys: accent, selectedBg, scrollbarThumb, searchMatchBg,
searchMatchText, thinkingMax, scrollbarTrack, text), drift assertion
(scrollbarThumb fg/text on 0.85.1 via the ref), band-stable-3 as construction
assertions, split 8→7, resolvedPalette oracle rebuilt, allowlist acceptance incl.
scrollbarTrack, smoke-at-0.84.3 floor, byte-exact lock. `as never` at probe
sites (precedent theme-compliance.test.ts:79,97). Claims: (c1) on 0.85.1
scrollbarThumb===text and count 56; on 0.84.3 ===selectedBg and count 55;
(c2) scrollbarThumb removed from OPTIONAL_TOKENS + a .council.json overriding it
→ seats.ts:102 throw, theme not applied — falsifies the "not a new break"
claim.

**Principal (job-18.12, FINAL).** LOCK — **(A): lock → 0.85.1** (regenerate
`bun.lock`; devDependency string `>=0.84.3 <0.86.0` UNCHANGED — the lock move
is the card's R-2(b)(i) evidence-generating deliverable, not ceiling-widening;
the smoke container pins 0.84.3 as the floor). "A recorded one-off is evidence,
not a gate — it has no ongoing falsifying power and will go stale; the only
configuration that deterministically exercises both ends of `>=0.84.3 <0.86.0`
is gates at 0.85.1 + smoke at 0.84.3." Recorded label: "0.85.x-compatible as
shipped" with the byte-precise deltas: 0.85.x resolves scrollbarThumb in the fg
map (?? text) + adds scrollbarTrack (?? muted) where 0.84.3 resolves it in the
bg map (?? selectedBg); the adaptation is DELEGATION (no version detection —
council stops owning the fallback), not a compatibility shim. Deletion scope —
YIELDS the tail to owner: "scrollbarThumb out of BG_TOKEN_KEYS (8→7) + the
scrollbarThumb line out of withThemeColorFallbacks; keep the 3 band-stable lines
(searchMatchBg/searchMatchText/thinkingMax) — idempotent with the constructor in
both bands, smaller diff. My 'delete helper entirely' is WITHDRAWN as over-
broad." KEEP OPTIONAL_TOKENS/VALID_COLOR_KEYS. Test corpus: construction-
identity, regime-blind: delete the hardcoded getBgAnsi("scrollbarThumb") ===
getBgAnsi("selectedBg") assertion; assert materializeTheme ≡ pi's own
loadThemeFromPath as EQUALITY probing scrollbarThumb via the regime-correct
accessor (fg at 0.85.1, bg at 0.84.3). Concrete values at 0.85.1: post-
construction count 56 (51 + fg{thinkingMax, searchMatchText, scrollbarThumb} +
bg{searchMatchBg, scrollbarTrack}), thumb = text, fg-probe no-throw. Designer's
(C) REJECTED: "incompatible as shipped" is falsified by the delegation argument.

**Designer (job-18.10, FINAL).** HOLDS (B)/(C): lock 0.84.3, recorded label
"incompatible as shipped; verified-to-0.84.3-only"; deletion scope routing-only
(drop scrollbarThumb from BG_TOKEN_KEYS; keep searchMatch*/thinkingMax in the
routing); the pure unit test dies with the helper. Rebuts the delegation
argument on a literal reading: pi's constructor is invoked on the result of
mergeThemeSection whose scrollbarThumb value comes from the loaded file, not
council's helper; 0.85.1's bundled dark.json/light.json carry
`scrollbarThumb: "text"` as a non-undefined string, so the constructor's bg
`?? selectedBg` fires only if the key is stripped — which needs its own
council-side decision and test. CONDITIONAL ON EVIDENCE: "if owner and
principal can demonstrate (via Skeptic-run gate 3 on 0.85.1 lock + their exact
diff) that the four failing tests go green, I will sign the optimistic label on
that evidence. Without that evidence, the label is a forecast, and the card's
acceptance clause demands evidence, not a forecast." Falsifiable predictions:
(1) principal's exact deletion WITHOUT further changes still fails gate 3 at
0.85.1 (T7 thumb, 256-mode getBgAnsi throw); (2) a per-variant override pinning
scrollbarThumb to selectedBg is what actually produces green on 0.85.1;
(3) the optimistic label is true only with that override in place.

#### Round-3 convergence state (for step 5 consolidator) — actuals

**Majority final (owner + principal): lock → 0.85.1 (regenerated bun.lock, devDependency string byte-unchanged), recorded label "0.85.x-compatible as shipped (deltas named)", deletion trim-only on the scrollbarThumb line (principal FINAL explicitly withdrew "delete helper entirely" as over-broad; owner FINAL still prefers full-helper deletion — a 2v1 on trim-only that remains a real sub-dispute for the consolidator), shipped theme files unchanged, tests regime-aware/construction-identity, allowlist kept.** Minority (designer): lock stays 0.84.3, "incompatible as shipped; verified-to-0.84.3-only", conditional on the empirical rewrite-green evidence — the settling test is the step-8/9 run on 0.85.1 with the deletion.

### Step 4 — Skeptic attack (job-18.13): BLOCKS (2 red, require the step-8 rewrite)

Scratch trees `/tmp/fllwup22-skeptic-0851` (0.85.1, routing-only deletion applied)
and `/tmp/fllwup22-skeptic-0843` (0.84.3, no deletion); main repo unmodified.
Seven objections, all with real runs:

1. **Deletion alone does not green the current corpus at 0.85.1 — CLOSED-RED
   (designer's prediction confirmed).** `bun test test/theme.test.ts
test/theme-activation.test.ts` → 7 fail / 25 pass: T5/T6 `toHaveLength(55)`→56;
T7 thumb `#e5e5e7 ≠ #31363f`; withThemeColorFallbacks unit `w.scrollbarThumb →
undefined`; splitThemeColors 8→7; both construction-identity
`getBgAnsi("scrollbarThumb")` throws. The agreed design always INCLUDED the
regime-aware test rewrite as a step-8 deliverable — this red run does not
contradict the design; it proves the rewrite is mandatory, not optional.
2. **Gate-2 type break — CLOSED-GREEN.** `bunx tsc --noEmit` at 0.85.1: 3 ×
TS2345 at test/theme-activation.test.ts:100,144,144 (getBgAnsi("scrollbarThumb")
not assignable to ThemeBg); extensions/ clean. 0.84.3 baseline: clean. The
deletion alone does not fix gate 2 — the test rewrite does (`as never` probe /
drop thumb from the 256-mode bg loop).
3. **Delta completeness — CLOSED-GREEN.** Only scrollbarThumb/scrollbarTrack
differ in dark/light.json; 0.85.0 ≡ 0.85.1 byte-identical; theme.js moves thumb
bg??selectedBg → fg??text, adds scrollbarTrack ?? muted, bgColorKeys 8→7;
new theme-json.js validation module; schema updated.
4. **Band-stable three — CLOSED-GREEN.** searchMatchBg===selectedBg,
searchMatchText===text, thinkingMax===thinkingXhigh hold on BOTH bands,
both variants. Probe table: count 55/56; scrollbarTrack abs/present;
thumb #31363f/#e5e5e7; getBgAnsi(thumb) works/throws;
getFgAnsi(thumb) throws/works.
5. **Allowlist swallow — CLOSED-GREEN.** seats.ts:102 parseOverrideMap throws
on unlisted key → activateTheme try/catch → warning notify, setTheme never
called — consumer recolor silently deactivates the theme. KEEP
OPTIONAL_TOKENS/VALID_COLOR_KEYS is correct.
6. **resolvedPalette has zero production consumers — CLOSED-GREEN.**
`grep -rn resolvedPalette extensions/` → definition only;
test/theme-resolved-palette.test.ts is its only caller. Dead-code candidate if
its test is removed.
7a. **"Green after deletion" must not be claimed for the current corpus —
BLOCKS.** The regime-aware corpus does not exist yet; acceptance demands
tests green on the declared side. The step-8 implementation must write and
verify the rewrite on both 0.84.3 and 0.85.1.
7b. **Lock version — factual correction by facilitator.** The Skeptic read the
installed node_modules (0.84.2) as the lock. Verified from bun.lock: the
LOCK resolves `@earendil-works/pi-coding-agent@0.84.3` (single entry);
node_modules is simply stale at 0.84.2. Gates run `bun install
--frozen-lockfile` → sync to 0.84.3. Record must note node_modules must be
synced (bun install) in the owner worktree before local gates.
7c. **Failure count at 0.85.1 with deletion is 7, not 4** — the original 4 plus
the withThemeColorFallbacks unit, splitThemeColors count, and truecolor
construction identity. The record's "4 committed theme tests" refers to the
pre-deletion drift surface (FLLWUP-21); accurate count depends on the corpus.
7d. **T6 equality holds both bands** — only the hardcoded count assertion
needs regime-awareness.

Verdict: **BLOCKS** on three items — (1) gate 3 red at 0.85.1 until the
regime-aware corpus is written and verified on both bands; (2) gate 2 red at
0.85.1 until the test rewrite clears the `as never`/256-mode sites; (3) the
regime-aware rewrite does not exist and acceptance needs tests green on the
declared side. All three are step-8 implementation deliverables, not design
flaws — the probe table (obj. 4) confirms the regime-aware design is feasible
exactly as specified. Non-blocking findings to record: lock 0.84.3 (node_modules
stale at 0.84.2); count is 7 not 4 with the deletion; resolvedPalette is
dead code.

### Step 5 — Consolidator synthesis (job-18.14): NOT ready to hand off; no ruling ripe

The consolidator left the run record with a full sort — settled / open-judgment /
open-objections — and a "Ready to hand off? No" verdict. Substance:

**Settled (with real run evidence):** routing-only deletion at the scrollbarThumb
seam (drop from `BG_TOKEN_KEYS` 8→7 + drop the scrollbarThumb line from
`withThemeColorFallbacks`); KEEP `OPTIONAL_TOKENS`/`VALID_COLOR_KEYS` (allowlist
deletion = silent consumer deactivation, obj 5 GREEN); shipped theme files
unchanged; three band-stable equalities hold on both bands (obj 4 probe table);
tests must be regime-aware + construction-identity (`as never` precedent); no
bound widening; record names the delta precisely (obj 3); gate-2 break is
test-only at two call sites (obj 2 GREEN); resolvedPalette has zero production
consumers (obj 6); lock resolves 0.84.3 with stale node_modules at 0.84.2
(facilitator-corrected obj 7b); failure count with deletion is 7 not 4 (obj 7c);
T6 equality holds both bands, only the hardcoded count is version-sensitive
(obj 7d).

**Open objections (all the same settling test — the step-8 regime-aware rewrite
verified green on BOTH 0.84.3 and 0.85.1, clearing gates 2 and 3):** (1) gate-3
red at 0.85.1 with the deletion and old corpus; (2) gate-2 red at 0.85.1 with
the deletion; (3) rewrite does not exist yet — acceptance demands green tests
on the declared side. These are step-8 implementation deliverables, not design
flaws — the probe table shows the regime-aware design is feasible exactly as
specified. The consolidator noted the one record inconsistency: the round-3
"converged" note said trim-only on `withThemeColorFallbacks`, while
principal's round-2 text advocated deleting the helper entirely — but
principal's FINAL round-3 position withdrew "delete entirely" as
over-broad, so trim-only stands settled. A separate minor alternative
(full-delete variant) was never run but is retired by the withdrawal.

**Open judgment — NOT RIPE, gated on the step-8 rewrite run:** the lock +
recorded-label fork. Majority (owner + principal, final): lock regenerates to
0.85.1, label "0.85.x-compatible as shipped (deltas named)", supersede
FLLWUP-21 R-2(b)(i). Minority (designer, final): lock stays 0.84.3, label
"incompatible as shipped; verified-to-0.84.3-only" — conditionally: designer
will sign the optimistic label on the Skeptic's evidence that the rewrite is
green on a 0.85.1 lock. The label is therefore EMPIRICAL (the step-9 Skeptic
run at the branch is the settling test designer itself named); no ruling seat
is called until that run reports. If green: Side A label + (via the run's
binding-consistency rule) lock at 0.85.1; if not green: Side B wins by
default. Two minor hygiene items ride with the handoff: `resolvedPalette`
removal (no production consumer; keep unless its oracle test needs removal)
and `scrollbarTrack` join of `OPTIONAL_TOKENS` (owner round-3 raised it; the
allowlist-KEEP rationale extends to it — a consumer declaring the new token
must not hit the swallowed-throw deactivation; spec resolves it).

### Step 6 — route what does not close: nothing to rule YET

No Phase-1 ruling covers the lock/label question, and none is needed now: the
consolidator's own routing says the open judgment is NOT RIPE — its empirical
layer (rewrite green on 0.85.1) is a step-8/9 deliverable, and under the run's
binding-consistency rule the lock follows whatever label the evidence sustains
(the card contract: decision made on evidence, tests green on the declared
side). No Needs Human; no product-owner dispatch warranted at this point. The
card proceeds to step 7 with the deliberation's majority design as the spec,
and the designer's named settling test is written into the spec's verification
requirements.

### Step 7 — spec written, handed to owner

Spec saved to `docs/superpowers/specs/2026-09-05-FLLWUP-22-design.md` (full
council path; commit ab2ac30). Contents: settled context (drift is real/narrow/
fully characterized; one type-level break FLLWUP-21 missed; council never draws
the scrollbar; shipped themes are 0.85.x-clean as shipped; the breakage is
test-contract over-pinning; allowlist = consumer recolor contract, MUST be kept;
three optional-token equalities band-stable), the recorded-decision MECHANISM
(not a pre-decided label — the step-8/9 evidence picks the side: optimistic
"0.85.x-compatible as shipped (deltas named)" + lock 0.85.1 + supersede
FLLWUP-21 R-2(b)(i) if green on both extremes, else pessimistic default), the
four deliverables (routing-only deletion; regime-aware test rewrite; lock
regen to 0.85.1; empirical record), the 8-item test corpus, binding exclusions,
the four-gate set, worktree/PR conventions. Self-review: no placeholders, no
scope beyond the card goal, single design per resolved point (decision
mechanism stated as two explicit branches). Card set In Progress (frontmatter +
board, commit ab2ac30); validate clean; owner dispatched.

### Step 8 — owner delivered (job-18.15), PR #38 open

Owner implemented in worktree `.worktrees/fllwup-22-scrollbar-token-drift`
(branch `feat/fllwup-22-scrollbar-token-drift` from origin/main a2bf137),
pushed, PR #38 open (observed: state OPEN, headRefOid `70139f60`, base main;
diff scope exactly bun.lock, the plan doc, the spec, extensions/seats.ts,
extensions/theme-activation.ts, test/theme.test.ts,
test/theme-activation.test.ts — package.json byte-untouched, smoke/untouched,
no seats/procedures, no env-split fixtures, no themes). Deliverables:
`docs/superpowers/plans/2026-09-05-FLLWUP-22-plan.md` (committed first —
empirical record per spec §7), routing-only deletion (`BG_TOKEN_KEYS` 8→7,
`?? selectedBg` line dropped from `withThemeColorFallbacks`, three band-stable
lines kept), regime-aware/construction-identity rewrite (version-parameterized
T5, band-stable T6 equality, provenance-only T7 + band-stable three, new
drift-characterization test, trim-only unit tests, reference-oracle 256-identity
with `as never`), `scrollbarTrack` added to `OPTIONAL_TOKENS` (recorded
discretion — allowlist is the consumer recolor contract), `bun.lock`
regenerated to in-range top 0.85.1, package.json constraint byte-exact
untouched. TDD: red baseline first (old corpus 4 fail + 3 new-assertion fails
on old engine), then green. Owner gates green at head `70139f6` on locked
0.85.1: (1) `bun install --frozen-lockfile` exit 0 (224 installs, no changes);
(2) `bunx tsc --noEmit` exit 0 (3 TS2345 cleared); (3) `bun test` 560 pass /
2 skip (network-gated) / 0 fail; (4) `python3 council/validate.py` clean.
Recorded 0.84.3 floor (scratch `/tmp/fllwup22-floor-0843`, branch overlaid):
tsc exit 0, `bun test` 560/2/0 — identical counts at both extremes.
Recorded decision: the evidence sustains the optimistic side —
"0.85.x-compatible as shipped (deltas named)"; bound means both extremes
gate-verified; FLLWUP-21 R-2(b)(i) superseded. Deltas named: scrollbarThumb
bg`??selectedBg`→fg`??text`; scrollbarTrack added (fg, `??muted`); bgColorKeys
8→7; resolved count 55→56; theme-json.js+schema; 0.85.0≡0.85.1 byte-identical.
In Review set (sole condition: open PR, observed). Skeptic at the branch next —
the 0.85.1 lock move, the trim-vs-full-deletion sub-dispute, the scrollbarTrack
allowlist addition, and the regime-aware corpus are its prime attack surface.
