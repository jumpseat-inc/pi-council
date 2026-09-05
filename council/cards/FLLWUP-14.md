---
id: FLLWUP-14
title: Kitty-protocol terminal smoke for the model search input
state: Deliberating
owner: null
epic: EPIC-6
goal: A documented smoke procedure drives `/council-models` in a live terminal by delivering `/` and printable keystrokes as CSI-u kitty-protocol sequences, and the observed frames show the search input opening, filtering, and Esc-clearing per the ruled copy set, with the procedure and expected frames recorded for re-execution.
---

## Intent

Filed from EV-27's delivery (owner-named follow-up, designer prediction 6):
the unit suite proves the modal's state machine *given bytes* — it pins
`decodeKittyPrintable("\x1b[47u")` → `/` and driven `handleInput` walks —
but no test exercises the real CSI-u delivery path from a kitty-protocol
terminal through pi's input pipeline into the modal. This card adds a
smoke procedure (manual or harness-driven, the deliberation decides) that
runs `/council-models` in a live kitty-protocol terminal, sends the
trigger and a query as CSI-u sequences, and compares observed frames
against the ruled copy set (`▌ / filter · esc clears`, the no-match
literal, the unchanged footer). State is Backlog because the delivery
shape — a documented manual procedure versus a pty-driven automated
harness — is an open design question for deliberation.

## Acceptance

- The procedure, when executed, produces recorded output showing: `/`
  (as `\x1b[47u`) opens the search input; typed CSI-u printables narrow
  the list; Esc clears the query per the ruled semantics.
- Expected frames are documented against the ruled copy set, byte-exact.
- The existing unit-level kitty decode tests remain the CI gate; the
  smoke is the live-path falsifier and does not gate ordinary CI.

## Execution

### Step 1 gate — full council, not surface-touching

Full council: the card's `goal` admits more than one reasonable design —
it explicitly delegates the delivery shape (a documented manual procedure
versus a pty-driven automated harness) to this deliberation; that
delegation is binding and no orchestrator ruling will be issued for it.
Not surface-touching: the deliverable is a verification artifact (test-side
code or durable runner-facing docs), not a change to any product surface,
user-visible copy, empty state, or error state — the model picker is
already shipped and fully ruled (EV-27, BUG-1, FLLWUP-13, FLLWUP-15 all
merged on main before this card); the smoke *verifies* the ruled copy, it
does not change it. Same class as FLLWUP-18/19 (seat-body docs) — no
`designer` seated. Runs steps 2–6 in full, then step 7's full-council
spec path.

State note: card dispatched at `Backlog`; the features-deliver
card-selection substitution replaces `Ready` promotion — the orchestrator
selects epic-scope cards in dependency order, and every EPIC-6 card this
run executed from `Backlog` the same way.

### Step 2 — independent first pass
`owner` (job-10.1) and `principal` (job-10.2) dispatched in parallel, each
with only the card plus the orchestrator binding facts (ruled copy set;
unit suite stays the CI gate; smoke is the live-path falsifier not gating
ordinary CI; goal governs done; delivery-shape delegation to this
deliberation; fact-5 environment reading to record). No `designer`
(step 1: not surface-touching). Positions recorded verbatim below.

**owner — first pass (job-10.1):** Delivery shape: BOTH — pty-driven
automated harness as the load-bearing falsifier, the same byte-script
documented as the manual procedure. A manual-only procedure (which fact 5
relieves of execution) would leave the card's gap — raw bytes → pi's
input pipeline → the modal — unfalsified, colliding with the repo's own
smoke discipline (first Council command without an end-to-end falsifier
is a defect). Harness lands under `smoke/search-smoke/`: `run.sh` (one
command; `timeout`-ceiled; scratch `$HOME`; `npm install --prefix
<scratch> @earendil-works/pi-coding-agent@0.84.3`; seeds the smoke
fixture's 9-seat `.council.json` pin; invokes `driver.py`; writes
artifacts + diffs to `smoke/.artifacts/search-smoke/<ts>/`), `driver.py`
(python3 stdlib only — `pty`,`fcntl`,`termios`,`select`,`re`; spawns the
pinned pi in a pty, winsize 80×28, `TERM=xterm-256color`, scratch HOME;
answers terminal queries deterministically — primary DA, kitty push
`CSI > 1u` capability reply; ~150-line screen model; poll-until-stable
defines a frame; ANSI stripped per line), a headless preflight
(`pi --approve -p "/council-models"` in the same scratch env must print
the R-2 usage line — eliminates the misroute-to-model-dispatch trap),
and `README.md` (the durable procedure: byte table, expected frames,
assertion rules, human replay path; automated harness and manual
procedure are the SAME artifact). Key probe evidence: on the runner's
stock pi (0.85.0) the pi-council extension does not load at all — TUI
and headless, `/council-models` and `/council-init`, fresh scratch HOME
+ `--approve`: both misroute to a real model dispatch; themes load,
extensions don't; the only environment where these commands are proven
to register is the smoke image (`smoke/Dockerfile` pins `PI_VERSION=
0.84.3`). Byte table (kitty flag-1 CSI-u, matching the card's `\x1b[47u`
literal): `/`→`\x1b[47u`; `c,l,a`→`\x1b[99u \x1b[108u \x1b[97u`;
backspace→`\x1b[127u`; `z`→`\x1b[122u`; Esc→`\x1b[27u`; Enter→`\r`.
Nine falsifier frames (80×28, stripped per line): (1) `/council-models`
`\r` → header `council models — pick a model per seat` + footer
`↑/↓ move · enter open · esc back`; (2) Enter→Enter (model level) →
penultimate `press / to filter models`, last `↑/↓ move · enter select ·
esc back`, no U+258C anywhere; (3) `\x1b[47u` → line 1 `▌ / filter ·
esc clears`, hint gone, model footer last; (4) `\x1b[99u \x1b[108u
\x1b[97u` → line 1 `▌ cla`, visible rows == derived set (independent
python substring predicate, id-minus-`:level`), footer last; (5)
`\x1b[127u` → line 1 `▌ cl`, rows recompute; (6) `\x1b[122u \x1b[122u`
→ line 1 `▌ zz`, `No models matching "zz".`, `↓ then esc exits search`,
footer last; (7) `\x1b[27u` twice → line 1 back to `▌ / filter · esc
clears`, header/footer unchanged; (8) Down, `\x1b[27u` → provider frame,
no U+258C. Global: model footer last in every frame; `▌` only in search
frames; `z` outside any seed catalogue (environment-independent); list
rows derived-from-live, ruled literals human-authored. Testable claims:
(1) `bash smoke/search-smoke/run.sh` green iff every frame matches, red
with per-line diff + kept artifacts; (2) three mutation probes (drop the
`decodeKittyPrintable` fallback → frame 3 red; mutate `SEARCH_ROW_EMPTY`
by one byte → frame 3 red; delete the BUG-1 hint render → frame 2 red);
(3) `driver.py` imports no extension module (greppable); (4) diff vs
`main` touches nothing under `gates.yml`/`test/`/`package.json`; (5)
headless preflight returns the R-2 usage line under the pinned pi.
Blind spots/risks: pi-0.84.3-in-python-pty + hand-answered kitty
negotiation only proven by the harness's own first green run (a red is
either a genuine delivery bug — e.g. `matchesKey` rejecting kitty Esc
`\x1b[27u` — or a harness bug, distinguishable via the per-line diff);
timing flakiness mitigated by 3-stable-polls; misroute exposure bounded
by credential-less scratch HOME (fails fast offline); the 0.85.0
extension-load breakage itself is a real compatibility regression
(`devDependency` is `"*"`) — out of scope here, worth its own FLLWUP.
FACT-5 verdict: harness branch — harness provisions both the terminal
(pty) and the pi version (0.84.3), runs in the runner's gate set as an
explicit ADDITIONAL gate (four repo gates + harness) while ordinary CI
stays untouched (the only reading under which fact 5's "must run in the
gate set" and the acceptance's "does not gate ordinary CI" are both
true). Declared fallback: if the harness cannot run green here, ship the
documented manual procedure (same byte script + expected frames as the
README) with live execution not a gate — the card's goal is met under
either branch.

**principal — first pass (job-10.2):** Cross-seam reading of the seam
under test: the unit suite pins only the tail two hops
(`picker.handleInput(rawByteString)` → `decodePrintable` →
`decodeKittyPrintable`, model-picker.ts ~L120-123 kitty CSI-u arm +
`length===1 && 32..126` legacy fallback) — `test/model-picker.test.ts`
drives `SLASH_KITTY="\x1b[47u"`. The unproven middle is pi's input
infrastructure, grounded in the installed pi-tui/pi sources: (1)
Negotiation — `terminal.js` requests kitty flags 7 via
`\x1b[>7u\x1b[?u\x1b[c`; a `\x1b[?(\d+)u` reply with flags≠0 sets
`kittyProtocolActive(true)`; flag bit 1 makes a real kitty emit CSI-u
for plain printables; (2) Reassembly — `stdin-buffer.js`
`extractCompleteSequences` passes CSI-u through as a raw `"data"`
event, never converted; (3) Dispatch — `tui.js`
`handleTerminalInput` reaches `focusedComponent.handleInput(data)` with
the raw byte string; (4) Overlay boundary — council-models.ts factory
closes `handleInput: (d) => { picker.handleInput(d); ... }` — raw string
is the contract end-to-end. Manual vs pty falsify different halves: a
manual run falsifies the terminal's half (real kitty emission +
negotiation); the pty harness deterministically falsifies the
pi-pipeline half; the frames look identical either way, so falsifying
power lives in which bytes were actually delivered and whether the
legacy fallback could have produced the same outcome. Named blind
spots: (a) the unit suite pins only the BARE `\x1b[47u` form while a
real kitty under flags=7 emits the event-type-suffixed press form
(`\x1b[47;1:1u`) — `decodeKittyPrintable`'s regex accepts it but no
test feeds it — the on-the-wire shape is unproven; (b) "search opens"
is NOT evidence the CSI-u path ran — the legacy fallback decodes a bare
`/` identically (frame-only assertion = false pass); (c) the modal's
rows come from `ctx.modelRegistry.getAvailable()` — an empty registry
renders "No providers configured" and `/` is gated on a non-empty model
list, so no provider = the smoke can never reach its subject; the
credentialless `gates.yml` has none (`bun test`, no secrets). Position:
land a pty-driven harness as the deliverable — test-side, in the
`smoke/` Docker path via the existing `SMOKE_PHASE` selector, NOT in
`gates.yml`; a one-page manual procedure is the companion doc for the
single inch the harness emulates (real-kitty emission/negotiation),
sharing the same expected-frame table, non-gating and secondary.
Harness shape (`smoke/kitty-smoke.sh`): `script -qefc "pi --approve"`
pty (util-linux, Linux-only OK — gates run ubuntu-latest); poll with
`timeout` ceilings (never fixed sleeps); assert pi emits `\x1b[>7u` and
write `\x1b[?7u` back; open the modal with legacy bytes
`/council-models\r` then `\r\r` to the model level (out of card scope);
deliver search keystrokes as CSI-u ONLY, using the SUFFIXED flag-2
press form (`/`=`\x1b[47;1:1u`; `c l a u d e`=`\x1b[99;1:1u` …
`\x1b[101;1:1u`; Esc=`\x1b[27;1:1u`; DEL=`\x1b[127;1:1u`); and the
ANTI-LEGACY-FALLBACK FALSIFIER: deliver a non-ASCII printable via CSI-u
(`\x1b[233u` → `é`) and require `▌ é` — the legacy fallback cannot
produce `é`; only `decodeKittyPrintable` can; this one assertion turns
the smoke from "search opens" into "the CSI-u decode path ran." Falsifier
frames (byte-exact, ANSI-stripped, width 80, single-provider fixture):
pre-press (rows + `press / to filter models` + footer last, no `▌`);
after `\x1b[47;1:1u` (`▌ / filter · esc clears`, hint gone, footer
last); after typing `claude` (`▌ claude`, rows narrow); no-match `zzzz`
(`▌ zzzz` → `No models matching "zzzz".` → `↓ then esc exits search` →
footer last, never a fifth footer); after Esc focused (`▌ / filter ·
esc clears` restored — clear-and-stay, a second Esc must not ascend);
backspace (`▌ claude` → `▌ claud`, one char, recompute). Testable
claims: (1) `decodeKittyPrintable("\x1b[47;1:1u") === "/"` and
`decodeKittyPrintable("\x1b[233u") === "é"` — runnable today against the
real pi-tui; (2) harness sends `\x1b[47;1:1u` and observes the empty
hint AND sends `\x1b[233u` and observes `▌ é` — together prove the CSI-u
delivery path ran; (3) after `/` opens search, `press / to filter
models` no longer appears in the stream (BUG-1 R-3 dismissal live); (4)
the ruled footer is the last literal at every checkpoint and no fifth
footer appears; (5) Esc-as-CSI-u with focus clears-and-stays, second
Esc does not ascend. Risks: false pass via legacy/coerced `/` (mitigated
by the `é` assertion); false pass if negotiation never engaged
(mitigated by asserting the `\x1b[>7u` query explicitly); false fail on
empty registry (harness only meaningful with `OPENROUTER_API_KEY` — why
it lives in the smoke path, not `bun test`); false fail from startup
dialogs (fixture must pre-seed pi's default model/settings, distinct
from the 9 `.council.json` seat pins); false fail from pty size/timing
(poll, don't sleep); `script -e` is util-linux-specific (documented).
FACT-5 verdict: harness branch — the harness runs in the repo's
deterministic verification set via `bun run smoke` (Docker,
`SMOKE_PHASE`-scoped), NOT `gates.yml` (credentialless → empty registry
→ `/` never opens search; adding a provider secret to gates.yml would be
an infra change beyond test-side code and therefore an ESCALATION, not a
decision).

### Step 3 — bounded exchange (rounds 2 of ≤3)
Both generators re-dispatched with each other's round-1 positions
verbatim (owner job-10.3, principal job-10.4). Positions stabilised;
exchange stopped after round 2 (step 3: stop early when stabilised).
Positions recorded faithfully below.

**owner — round 2 (job-10.3):** Verified the principal's pipeline claims
by reading the installed pi-tui sources before responding: `terminal.js`
kitty negotiation (flags 7, `\x1b[>7u\x1b[?u\x1b[c`, reply→
`setKittyProtocolActive=true`), `stdin-buffer.js`
`extractCompleteSequences`/`emitDataSequence` pass CSI-u through raw,
`tui.js:618` filters `isKeyRelease` before the focused overlay's
`handleInput`, council-models.ts closure hands the raw string to
`picker.handleInput`. Live decode probe (bun, installed pi-tui):
`\x1b[47;1:1u`→`/`, `\x1b[233u`→`é`, `\x1b[99;1:1u`→`c`;
`matchesKey("\x1b[27;1:1u",escape)`, `("\x1b[127;1:1u",backspace)`,
`("\x1b[13;1:1u",enter)` all true; `isKeyRelease("\x1b[47;1:1u")` false.
Placement facts confirmed: gates.yml runs `bun test` without secrets;
smoke/run.sh hard-requires `OPENROUTER_API_KEY` and passes `SMOKE_PHASE`
through; driver.sh phase 5 is headless-only; `/` gated on
`group.models.length > 0` with R-4#1 on empty providers. ENDORSES the
principal's central placement argument: harness lives in the
`SMOKE_PHASE` path, never `gates.yml`. Four corrections to the
round-2-merged shape: (1) frame assertions CANNOT be accumulated-stream
greps (`phase5_run`'s `grep -F` works for a linear headless transcript;
a pty stream repaints and earlier frames stay in the accumulation, so
"no longer appears in the stream" claims and changed-footer claims are
only assertable per-checkpoint: wait for quiescence (no new bytes in a
poll window, timeout-ceilinged), snapshot bytes since the prior
checkpoint, ANSI-strip, assert against the snapshot); (2) negotiation
assertion is only pi's own emitted `\x1b[>7u` in the captured stream —
`decodeKittyPrintable` is a state-independent pure function, so "search
opening is evidence kitty mode engaged" is false; drop the
modifyOtherKeys rationale (owner verified decode with no session state);
(3) model rows asserted STRUCTURALLY, never hardcoded: capture pre-press
model rows from the terminal's own frame, then after typing `claude`
assert every visible row ⊆ pre-frame rows AND contains `claude` —
self-calibrating; the ruled literals (header, `▌ / filter · esc
clears`, `No models matching "…".`, `↓ then esc exits search`, both
footers) are hardcoded byte-exact; (4) the kitty phase must be
SMOKE_PHASE-isolated only — never folded into the no-SMOKE_PHASE full
path (the full path is the release stability gate; driver.sh's guard
"only 5 is supported" changes to accept the new value; the full path
stays byte-identical). Plus: (5) one live seam the harness will not
close and should say so — the harness writes press-only forms, never
kitty press+release pairing (release is `:3`, filtered by `isKeyRelease`;
if a real kitty run ever double-appends, that is a finding, not a
harness bug — the expected-frame table stays shared). Accepted: the
`é` falsifier (`\x1b[233u`; the legacy arm is `length===1 && 32..126`
so it cannot produce `é` — verified in `model-picker.ts`
`decodePrintable`). New testable claims: fast unit gate pinning the
harness vocabulary through the REAL modal with zero new infra —
`ModelPicker.handleInput("\x1b[47;1:1u")` renders `SEARCH_ROW_EMPTY` at
line 1; `"\x1b[99;1:1u"` appends `c`; `"\x1b[233u"` renders `▌ é`;
`"\x1b[127;1:1u"` on `claude` yields `claud` (model-picker.test.ts
currently pins only the bare forms — net-new coverage); harness truth
conditions are per-frame (no post-`/` quiescent snapshot contains
`press / to filter models`; footer last at every checkpoint; `▌ é` only
after `\x1b[233u`); boot stream contains `\x1b[>7u`; the `\r\r` blind
pick of seat 0/provider 0 is calibrated by the harness itself (if the
fixture resolves to `No providers configured`, the phase fails with the
R-4#1 literal visible — a calibrated failure, not a false pass).

**principal — round 2 (job-10.4):** Read the wiki, the card, both round-1
positions, the picker source, and the installed pi-tui/pi-ai/pi sources
on both sides of the seam. The decode side is narrower and better
behaved than either seat claimed in round 1: `KITTY_CSI_U_REGEX =
/^\x1b\[(\d+)(?::(\d*))?(?::(\d+))?(?;(\d+))?(?::(\d+))?u$/`
(pi-tui/dist/keys.js:1104) accepts bare `\x1b[47u`, suffixed
`\x1b[47;1u`/`\x1b[47;1:1u`, AND non-ASCII `\x1b[233u` → `/`,`/`,`é`
(keys.js:1120); `matchesKey("\x1b[27u",escape)` and
`matchesKey("\x1b[127u",backspace)` match via `matchesKittySequence`
(keys.js:648-754, 478). **The owner's byte table is code-correct as
written; the suffixed press form is withdrawn as a design requirement**
(it survives only as a one-line note in the manual README). BUT the
seam's other side is fatal to the owner's shape as specified:
`ctx.modelRegistry.getAvailable()` =
`[...runtime.getAvailableSnapshot()]` (model-registry.js:21-22) =
`all.filter(m => configuredProviders.has(m.provider))`
(model-runtime.js:168-174); `configuredProviders` = providers where
`checkAuth()` is non-undefined (model-runtime.js:176-198); OpenRouter
auth is `envApiKeyAuth("OpenRouter API key", ["OPENROUTER_API_KEY"])`
(providers/openrouter.js:12) whose `resolve` reads the credential store
or env var and returns the key with NO network call and NO `check`
method (auth/helpers.js:7-34); `checkProviderAuth` falls through to
`resolveProviderAuth` → non-undefined iff a key is resolvable
(models.js:225-242). **The owner's harness as specified is
unreachable-by-construction**: it provisions the terminal and the pi pin
but NOT the model registry — the 9-seat `.council.json` pin populates
seats, not providers; a credentialless scratch HOME yields
`No providers configured` and frames 2-9 can never appear; the owner's
round-1 risk note ("scratch HOME has no provider credentials so any
residual misroute fails fast offline") treats the very property that
kills the harness as a safety feature. Reframe — minimal, inside the
owner's own shape (owner's harness-primary + same-byte-script-manual-doc
design ENDORSED): (1) required — `run.sh` must `export
OPENROUTER_API_KEY="${OPENROUTER_API_KEY:-sk-dummy}"` (any non-empty
value; presence-only auth → non-empty static OpenRouter catalogue, zero
real secret, zero network; a dummy key fails at dispatch but the modal
never dispatches); plus a derived assertion: frame 2 shows ≥1 provider
row and NOT `No providers configured` (the headless preflight's R-2
usage-line probe proves registration, not a non-empty registry); (2)
recommended — the anti-harness-regression falsifier: send `\x1b[233u`
and require `▌ é`. The owner's three mutation probes mutate PRODUCT
code; none can detect a harness bug where the driver strips ESC and
delivers legacy bare bytes — under that bug frame 4 still greens (the
legacy arm decodes a bare `/`) AND mutation probe 1 still greens; `é`
(U+00E9 = 233 > 126) is unreachable by any single-byte legacy input, so
`▌ é` is true iff the driver genuinely delivered CSI-u AND the kitty
decode ran — the card's gap made falsifiable against its own harness,
not just against product regressions; (3) sharpen the 0.84.3 unverified
link — add a cheap preflight guard: `node -e` against the npm-installed
0.84.3 dist asserting `decodeKittyPrintable("\x1b[47u")==="/"` and
`matchesKey("\x1b[127u","backspace")`; if those fail the harness reds
BEFORE the TUI session, disambiguating version regression from product
bug. Testable claims: (1) `run.sh` with `OPENROUTER_API_KEY` unset must
still reach frame 2 with ≥1 provider row; (2) `envApiKeyAuth.resolve`
performs no network I/O — greppable (auth/helpers.js resolve body has no
fetch/http import; `checkProviderAuth` never calls `apiKey.check` for
OpenRouter because `envApiKeyAuth` defines no `check` key); (3) all
three decode forms true against the installed pi-tui today — the
byte-form dispute is closed by evidence, not argument; (4) mutation: a
driver bug sending bare `/` instead of `\x1b[47u` — the owner's three
probes stay green but the `é` assertion reds (a harness without `é` is
vacuous against this class); (5) frame 2 asserts ≥1 provider row /
`EMPTY_NO_PROVIDERS` absent. Unverifiable from inside this seat: whether
0.84.3's bundled pi-tui differs from the installed `"*"` pi-tui —
exactly the link claim (3) makes runnable before the TUI boots.

### Step 4 — Skeptic attacks (job-11.1)
Skeptic dispatched with a pointer brief: read the card face (full deliberation
record), run the settling tests it names, attack the converged shape (pty harness
primary + same-byte-script manual doc, dummy-key provisioning, `é` falsifier,
0.84.3 decode preflight guard, per-checkpoint snapshots, SMOKE_PHASE-only
isolation), and attack the delivery-shape falsifiability. Its report, recorded
verbatim:

**Objection 1 — model-registry.js line citations reference a file absent from
the bundled pi-tui:** `find @earendil-works/pi-tui/dist -name '*.js'` (44 files)
contains no `model-registry.js`. **closed-spectral** — the principal's
`model-registry.js:21-22` citation cannot be read here; the generic
dummy-key-populates-registry claim is independently verified (objection 2), but
the specific source citation underlying the "unreachable-by-construction"
argument is not verifiable against the 0.85.0 install.

**Objection 2 — OpenRouter envApiKeyAuth dummy-key claim verified:**
`envApiKeyAuth("OpenRouter API key", ["OPENROUTER_API_KEY"])` in
pi-ai/providers/openrouter.js; no `check` key → `checkProviderAuth` falls to
`resolveProviderAuth`; resolve body reads `ctx.env(envVar)` — zero network I/O,
zero fetch/http imports in auth/helpers.js or auth/resolve.js; `sk-dummy` →
non-undefined auth → models appear. **closed-green**. Ownership note: the
dummy-key requirement changes the harness contract (loses its
"fails-fast-offline" property up-front; a misroute would attempt dispatch with
the dummy key); neither seat's round-2 text modified its position to restate the
accepted requirement.

**Objection 3 — all decode/keys probes pass against installed 0.85.0:**
`\x1b[47;1:1u`→`/`, `\x1b[233u`→`é`, `\x1b[99;1:1u`→`c`;
`matchesKey("\x1b[27;1:1u",escape)` and `("\x1b[127;1:1u",backspace)` true;
`isKeyRelease("\x1b[47;1:1u")` false, `("\x1b[47;1:3u")` true. **closed-green** —
the byte-form dispute is closed by evidence; `é` is unreachable by the legacy
arm (decodePrintable fallback is `length===1 && 32..126`, model-picker.ts
L120-121).

**Objection 4 — KITTY_CSI_U_REGEX at keys.js:1104 exactly as claimed:**
`/^\x1b\[(\d+)(?::(\d*))?(?::(\d+))?(?:;(\d+))?(?::(\d+))?u$/` accepts bare,
suffixed, and non-ASCII forms. **closed-green**.

**Objection 5 — kitty negotiation query is `\x1b[>7u\x1b[?u\x1b[c`, flags=7:**
terminal.js:13-15. **closed-green**.

**Objection 6 — dispatch chain as claimed:** `isKeyRelease` filter at tui.js:718-
723 then `focusedComponent.handleInput(data)` with the raw byte string;
council-models.ts:149 closes `handleInput: (d) => { picker.handleInput(d); }`.
**closed-green**.

**Objection 7 — the `é` falsifier proves kitty decode ran, NOT that negotiation
succeeded:** `decodeKittyPrintable` is a pure state-independent function
(keys.js:1120-1140); `setKittyProtocolActive(true)` fires only when a kitty
reply arrives (terminal.js:192-196). A `▌ é` frame proves the `\x1b[233u` bytes
reached the modal; it does not prove the reply was parsed. The negotiation
assertion the design carries (pi's own emitted `\x1b[>7u`) proves pi asked, not
that it accepted. The `kittyProtocolActive` flag is unobservable from outside
the process. **closed-green on the fact; the interpretation (é = negotiation
proven) is marked incomplete — the limitation the owner's round-2 correction
(2) already states must live in the README/spec explicitly.**

**Objection 8 — harness does not exist on main; all behavioral claims about it
are open-untested by construction:** `ls smoke/search-smoke/` → absent. Design
positions under attack on falsifiability, not settled facts.

**Objection 9 — the delivery-shape falsifiability split leaves the real-terminal
half without a gated falsifier:** pty harness falsifies bytes→modal through a
fake reply; a real kitty terminal's half (DA reply quirk, real keystroke
emission) is only covered by the manual procedure, which fact-5/the acceptance
make non-gating. A future regression in negotiation reply-parsing could pass all
pty harness gates and surface only when a human runs the unenforced manual
procedure. **open-untested** — the design acknowledges the split (owner:
"press-only forms, never press+release pairing") but does not define gated
verification of the real-terminal half.

**Objection 10 — the SMOKE_PHASE extension changes existing gated code:**
driver.sh:122-123 currently fatal on any `SMOKE_PHASE != 5`; the owner's
round-2 correction (4) requires the guard to accept a new value — a structural
change to a shared conditional tree, with leakage-into-the-full-path risk that
the design asserts away ("stays byte-identical") but does not test. **open-
untested** — addressable at implementation, assertable at step 9.

**What it ran:** decode/matchesKey/isKeyRelease probe via bun against installed
0.85.0 (all pass); greps over pi-ai openrouter.js auth/helpers.js (no network
I/O), keys.js:1104 regex, tui.js isKeyRelease gate, model-picker.ts
L120-121/L304-380, terminal.js L13-15/L131-196; `.github/workflows/gates.yml`
(4 gates: tsc, test, validate — no smoke); driver.sh:122-123 guard; `ls
smoke/search-smoke/` (absent).

**Verdict: Blocks** — (1) the harness does not exist, so every behavioral claim
is untestable design position; (2) `é` proves decode, not negotiation
acceptance — the negotiation half is an unasserted assumption; (3) the
real-terminal half is never falsified by a gate; (4) the principal's strongest
citation (model-registry.js) is absent from the 0.85.0 install — weakening but
not overturning the dummy-key requirement (independently verified).
