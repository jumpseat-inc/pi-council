---
id: FLLWUP-22
title: Theme token drift vs pi 0.85.x grounds the devDependency upper bound
state: Deliberating
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

#### Round 3 (final — cap reached)

**Owner (job-18.7).** (a) LOCK — CONCEDES to 0.84.3 (principal's round-2 position),
under principal's non-negotiable: "a consumer installs pi themselves; our
bun.lock governs our own gates, not their resolution" — the lock is gate-control
and the card's goal is a supported-range claim evidenced through the gates PLUS
the record. Designer's "verified up to 0.84.3" is FLLWUP-21's housekeeping
verbatim, which the card's Intent explicitly calls insufficient — rejected.
(b) DELETION — line-by-line: delete ONLY the scrollbarThumb line from
withThemeColorFallbacks (rejects designer's thinkingMax-only reduction — the
other three fallback sources do not drift); BG_TOKEN_KEYS 8→7 (conceded);
KEEP VALID_COLOR_KEYS/OPTIONAL_TOKENS (verified: seats.ts:102 throws for any
unlisted key; activateTheme swallows into a warning → silent total theme
deactivation — designer's "boundary made explicit" falsified mechanically);
`as never` at probe sites. (c) Test corpus: 8 items — T5 count `P ≥ 0.85 ? 56 : 55`;
T6 equality unchanged; T7 regime-conditional (thumb = text/selectedBg by band);
fallback unit test as 3 ?? + scrollbarThumb pass-through; splitThemeColors
"exactly the 7 bg keys"; construction identity with regime-conditional thumb
probe through `never`; 256-mode drops thumb from bgAnsi loop, ≥0.85 asserts
fg identity; record artifact = 0.85.1 full-gate execution with concrete regime
values.

**Principal (job-18.8).** LOCK — CONCEDES to owner's 0.85.1, superseding its
own non-negotiable: "a recorded one-off is evidence, not a gate — it has no
ongoing falsifying power and will go stale; the only configuration that
deterministically exercises both ends of `>=0.84.3 <0.86.0` is gates at 0.85.1
(top, what a consumer resolves) + smoke at 0.84.3 (floor)." DELEGATE, DON'T
PROBE: delete withThemeColorFallbacks ENTIRELY + drop scrollbarThumb from
BG_TOKEN_KEYS; pi's own `new Theme` constructor (theme.js:266 on 0.84.3 vs :184
on 0.85.1) applies the regime-correct ?? fallback itself — the shipped theme
follows 0.85.x automatically with zero version detection. Keep
OPTIONAL_TOKENS/VALID_COLOR_KEYS (owner right on silent deactivation).
RESOLVED-PALETTE correction: has ZERO production consumers (only its unit test
imports it) — nothing rendered loses a token. Record: byte-exact range, lock
0.85.1 + smoke 0.84.3, decision "0.85.x-compatible as shipped", supersede
FLLWUP-21 R-2(b)(i). Rejects designer's (C): "incompatible as shipped" is
falsified by the delegation argument — the council never draws the scrollbar;
the only wrong-regime code is the council's own hardcoded fallback/routing,
which this card deletes.

**Designer (job-18.10).** HOLDS (B)/(C): lock 0.84.3, recorded label
"incompatible as shipped; verified-to-0.84.3-only"; deletion scope routing-only
(drop scrollbarThumb from BG_TOKEN_KEYS; keep searchMatch*/thinkingMax); the
pure unit test dies with the helper. Rebuts the delegation argument on a
literal reading: pi's constructor is invoked on the result of mergeThemeSection
whose scrollbarThumb value comes from the loaded file, not council's helper;
0.85.1's bundled dark.json/light.json carry `scrollbarThumb: "text"` as a
non-undefined string, so the constructor's bg `?? selectedBg` fires only if the
key is stripped — which needs its own council-side decision and test. CONDITIONAL
ON EVIDENCE: "if owner and principal can demonstrate (via Skeptic-run gate 3 on
0.85.1 lock + their exact diff) that the four failing tests go green, I will sign
the optimistic label on that evidence. Without that evidence, the label is a
forecast, and the card's acceptance clause demands evidence, not a forecast."
Falsifiable predictions: (1) principal's exact deletion WITHOUT further changes
still fails gate 3 at 0.85.1 (T7 thumb, 256-mode getBgAnsi throw); (2) a
per-variant override pinning scrollbarThumb to selectedBg is what actually
produces green on 0.85.1; (3) the optimistic label is true only with that
override in place.

#### Round-3 convergence state (for step 5 consolidator)

Settled across all three: deletion routing-only (drop scrollbarThumb from
BG_TOKEN_KEYS 8→7 + drop the scrollbarThumb line from withThemeColorFallbacks);
KEEP OPTIONAL_TOKENS/VALID_COLOR_KEYS (allowlist deletion = silent consumer
deactivation); shipped theme files unchanged (no explicit scrollbar keys); the
three band-stable equalities hold; tests must be regime-aware / construction-
identity vs pi's loadThemeFromPath; no bound widening beyond the declared range;
record must name the delta precisely. CONTESTED (2v1 + designer's conditional):
lock position (owner+principal: regenerates to 0.85.1, gates prove the top,
smoke 0.84.3 floor; designer: stays 0.84.3) and the recorded label
("0.85.x-compatible as shipped" vs "incompatible as shipped; verified-to-
0.84.3-only"). Designer's conditional makes the label contest EMPIRICAL — the
Skeptic's step-4 gate-3 run on a 0.85.1 lock with the agreed deletion is the
settling test it itself named.
