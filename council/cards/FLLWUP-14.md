---
id: FLLWUP-14
title: Kitty-protocol terminal smoke for the model search input
state: In Progress
owner: owner
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

## Phase 1 rulings (product-owner, step-6 escalations)

- **R-1 (dummy-key contract change — ACCEPTED with documented mitigation)**: The harness's `run.sh` MUST export `OPENROUTER_API_KEY="${OPENROUTER_API_KEY:-sk-dummy}"` to the pinned pi 0.84.3 binary. The presence-only auth path is the closed-green mechanism (Skeptic objection 2): `envApiKeyAuth("OpenRouter API key", ["OPENROUTER_API_KEY"])` defines no `check` method and its `resolve` reads the env var with zero network I/O and zero `fetch`/`http` imports; a non-empty value yields a non-undefined auth result and the OpenRouter catalogue populates statically from the bundled model set. The harness is unreachable-by-construction without this export (`/` is gated on a non-empty model list; a credentialless scratch HOME renders `No providers configured` and the harness never reaches frame 2). The lost fails-fast-offline safety property is acceptable because (a) the modal under test never dispatches — `ModelPicker.handleInput` mutates picker state only, no model call is initiated by any keystroke; (b) the harness's headless preflight asserts the R-2 usage line in the same scratch env before any TUI session, so any misroute-to-model-dispatch surfaces as a headless preflight red, not a TUI-session red; (c) a hypothetical misroute would attempt a real dispatch that fails as a 401 on a live network or as a network-timeout offline — both recoverable observations, not silent corruption; (d) `sk-dummy` is a placeholder string, not a real secret, and the harness does not persist it (env-var export in `run.sh`, no write to disk); (e) the repo's existing `smoke/run.sh` already hard-requires a real `OPENROUTER_API_KEY` at host level and passes it into the container, so the precedent for a harness setting a provider credential is on the books. The README MUST state the contract change — the scratch HOME is not credential-less, the modal never dispatches, and the headless preflight is the misroute tripwire.
- **R-2 (0.84.3 decode preflight guard — INCLUDED)**: The harness MUST include a preflight guard that runs before any TUI session — a `node -e` invocation against the npm-installed `@earendil-works/pi-coding-agent@0.84.3` dist asserting `decodeKittyPrintable("\x1b[47u") === "/"` and `matchesKey("\x1b[127u", "backspace") === true`. If either assertion fails, the harness reds with a clear "0.84.3 decode parity failed" message and never boots the pty session. The harness resolves the pinned 0.84.3 dist as the target (e.g. via `NODE_PATH` into the pinned node_modules). Rationale — the Skeptic closed the decode mechanism against the installed pi-tui while the harness runs against the pinned 0.84.3, and the two are not observably identical from inside a seat; on red without this guard the developer is left bisecting "product bug vs pin regression" without help. Reversibility is trivial — one `node -e` block, removable in one edit.

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

### Step 5 — Consolidator synthesis (job-11.2)
Synthesis written to the card verbatim:

#### Agreed design

Every seat converged on a single delivery shape, and the binding orchestrator facts frame it:

- **Delivery shape** — a pty-driven automated harness is the primary deliverable, landing under `smoke/search-smoke/` as `run.sh` + `driver.py` + a headless preflight + `README.md`; the *same byte script* is the documented manual procedure (one artifact, two execution modes). Both seats endorsed harness-primary + same-byte-script-manual-doc; the orchestrator delegated the delivery-shape choice to this deliberation (binding, no ruling issued).
- **Placement** — the harness runs in the `SMOKE_PHASE` path, never `gates.yml`. Both seats endorsed; consistent with the binding facts that the unit suite is the CI gate and the smoke is the live-path falsifier that does not gate ordinary CI.
- **`é` anti-legacy-fallback falsifier** — `\x1b[233u` → `▌ é` is in the design. Principal proposed; owner explicitly "Accepted." Objection 3 closed-green that `é` (U+00E9 = 233) is unreachable by the legacy `length===1 && 32..126` arm, so `▌ é` is true iff CSI-u was genuinely delivered *and* kitty decode ran.
- **Byte forms** — the owner's bare `\x1b[47u` byte table is code-correct; the principal withdrew the suffixed press form (`\x1b[47;1:1u`) as a *requirement* (it survives only as a one-line README note). Settled by evidence, not argument.
- **Non-empty registry requirement** — both seats converged that the harness must show ≥1 provider row at frame 2 (assert `EMPTY_NO_PROVIDERS` absent); `/` is gated on `group.models.length > 0`, so without a provider the smoke never reaches its subject. The owner derived the assertion from the principal's round-1 gating observation; both carry it in testable claims.
- **Per-checkpoint snapshot mechanism** (owner correction 1) — frame assertions are per-checkpoint (wait for quiescence, snapshot bytes since the prior checkpoint, ANSI-strip, assert against the snapshot), never accumulated-stream greps. Unchallenged by the other seat or the Skeptic; treated as part of the converged shape under attack.
- **Structural row assertions** (owner correction 3) — visible model rows are asserted structurally (every post-filter row ⊆ pre-press rows *and* contains the query), self-calibrating; only the ruled literals (header, `▌ / filter · esc clears`, `No models matching "…".`, `↓ then esc exits search`, both footers) are hardcoded byte-exact. Unchallenged.
- **SMOKE_PHASE-only isolation as a design goal** (owner correction 4, goal half) — the kitty phase runs *only* under `SMOKE_PHASE`, never folded into the no-`SMOKE_PHASE` full path. Both seats agree on the isolation goal; the *implementation* claim that the guard change preserves it is open (see open objection 10).

#### Settled disputes (test-closed)

- **Objection 2 — dummy-key mechanism:** closed-green. `envApiKeyAuth("OpenRouter API key", ["OPENROUTER_API_KEY"])` in pi-ai/providers/openrouter.js has no `check` key → `checkProviderAuth` falls to `resolveProviderAuth`; resolve reads `ctx.env(envVar)` — zero network I/O, zero fetch/http imports in auth/helpers.js or auth/resolve.js. `sk-dummy` → non-undefined auth → non-empty static OpenRouter catalogue. Test run; mechanism proven.
- **Objection 3 — decode/keys probes:** closed-green. Against installed 0.85.0: `\x1b[47;1:1u`→`/`, `\x1b[233u`→`é`, `\x1b[99;1:1u`→`c`; `matchesKey("\x1b[27;1:1u",escape)` and `("\x1b[127;1:1u",backspace)` true; `isKeyRelease("\x1b[47;1:1u")` false, `("\x1b[47;1:3u")` true. Closes the byte-form dispute by evidence.
- **Objection 4 — KITTY_CSI_U_REGEX:** closed-green. `/^\x1b\[(\d+)(?::(\d*))?(?::(\d+))?(?:;(\d+))?(?::(\d+))?u$/` at keys.js:1104 accepts bare, suffixed, and non-ASCII forms.
- **Objection 5 — kitty negotiation query:** closed-green. `\x1b[>7u\x1b[?u\x1b[c`, flags=7, at terminal.js:13-15.
- **Objection 6 — dispatch chain:** closed-green. `isKeyRelease` filter at tui.js:718-723, then `focusedComponent.handleInput(data)` with the raw byte string; council-models.ts:149 closes `handleInput: (d) => { picker.handleInput(d); }`.
- **Objection 7 — fact (`é` proves decode, not negotiation):** closed-green on the fact. `decodeKittyPrintable` is a pure state-independent function (keys.js:1120-1140); `setKittyProtocolActive(true)` fires only on a kitty reply (terminal.js:192-196); `kittyProtocolActive` is unobservable from outside the process. A `▌ é` frame proves the bytes reached the modal and decode ran; it does *not* prove the reply was parsed/accepted.
- **Objection 8 — harness absent:** closed-green as a fact (`ls smoke/search-smoke/` → absent, confirmed). The implication — all behavioral claims are design positions until the harness is built — is the standing reason the harness-implementation items remain open, not a separate dispute.
- **Objection 1 — `model-registry.js` citation:** closed-spectral. The principal's `model-registry.js:21-22` citation is absent from the bundled 0.85.0 pi-tui (44 files, no `model-registry.js`); the specific source citation underlying the "unreachable-by-construction" argument is not verifiable here. The underlying dummy-key-populates-registry claim is *independently* verified by objection 2, so the conclusion survives on a different footing than the principal argued.

#### Open judgment — for `product-owner`, escalating to `steward`

1. **Dummy-key contract change (objection 2 ownership note).** The dummy-key requirement is *required* (proven: harness unreachable without it) and its mechanism is closed-green — but it changes the harness's safety contract. The owner's round-1 shape relied on a credentialless scratch HOME that "fails fast offline"; exporting `OPENROUTER_API_KEY=sk-dummy` makes a misroute *attempt a real dispatch with the dummy key* rather than failing fast. **Side A (principal):** the dummy key is required for the harness to reach its subject at all; presence-only auth, zero network, zero real secret — the loss of fails-fast-offline is acceptable because the modal never dispatches. **Side B (owner's original contract):** the fails-fast-offline property was a deliberate safety feature of the scratch-HOME design; neither seat's round-2 text restated the accepted consequence, so the tradeoff was never explicitly owned. No test settles whether the lost offline-safety property is an acceptable contract change — it is a values/tradeoff call.

2. **0.84.3 decode preflight guard (principal reframe 3).** Principal *recommended* a cheap `node -e` preflight against the npm-installed 0.84.3 dist asserting `decodeKittyPrintable("\x1b[47u")==="/"` and `matchesKey("\x1b[127u","backspace")`, to disambiguate a 0.84.3 version regression from a product bug *before* the TUI boots. The owner never saw principal round 2 and never accepted or rejected it. **Side A (principal):** the 0.84.3-vs-installed-`*` pi-tui parity is unverifiable from inside a seat; the preflight makes that link runnable and turns a confusing red into a calibrated one. **Side B (owner's existing headless preflight):** the shape already carries a headless preflight asserting the R-2 usage line, which proves registration; adding a second decode preflight is extra surface for a link that the harness's own first green run will exercise anyway. Tradeoff: additional preflight surface vs earlier disambiguation. Not settled by either seat or any test.

#### Open objections — Skeptic objections whose settling test has not passed

1. **Objection 7 (interpretation) / negotiation-acceptance not asserted — unverifiable.** The fact is closed-green, but the design *carries* a negotiation assertion (pi's own emitted `\x1b[>7u`) that proves pi *asked* for kitty mode, not that it *accepted*. The owner's correction (2) narrowed the assertion to exactly that emitted query and acknowledged the limitation; the Skeptic ruled the interpretation "incomplete" and required the limitation to live in the README/spec explicitly. Settling test: assert `kittyProtocolActive` is true from the harness. **Cannot be run** — the flag is unobservable from outside the process. The negotiation-acceptance half remains an unasserted assumption; the README must say so.

2. **Objection 9 — real-terminal half has no gated falsifier — not run / not defined.** The pty harness falsifies the bytes→pi-pipeline→modal half by hand-answering the kitty capability reply; the *real-terminal* half (a real kitty's DA-reply quirk and actual keystroke emission under flags=7) is covered only by the manual procedure, which fact-5 and the acceptance make non-gating. The owner acknowledged the split ("press-only forms, never press+release pairing") but defined no gated verification of the real-terminal half. A future regression in negotiation reply-parsing could pass every pty-harness gate and surface only when a human runs the unenforced manual procedure. Settling test: a gated falsifier of the real-terminal half. **Not defined, not run.**

3. **Objection 10 — `SMOKE_PHASE` guard change to shared `driver.sh` — not run.** driver.sh:122-123 currently fatals on any `SMOKE_PHASE != 5`; the owner's correction (4) requires the guard to accept a *new* value — a structural change to a shared conditional tree that gates the release-stability full path. The design asserts the full path "stays byte-identical" but does not test it. Settling test: implement the guard change and assert the no-`SMOKE_PHASE` full path is byte-identical before/after. **Not run.** The Skeptic notes it is "addressable at implementation, assertable at step 9."

#### Ready to hand off?

**No.** The harness itself does not exist (objection 8 fact), and three open objections block a clean handoff: negotiation-acceptance is structurally unverifiable (objection 7 interpretation — requires an explicit README limitation, not a test), the real-terminal half has no gated falsifier (objection 9 — needs a design decision on whether to accept the gap or add a gate), and the `SMOKE_PHASE` guard change to shared `driver.sh` is untested (objection 10 — settles only at implementation/step 9). Two open judgment calls also remain unresolved: the dummy-key contract change's loss of fails-fast-offline (objection 2 ownership note) and the 0.84.3 decode preflight guard (principal reframe 3). Route open judgment to `product-owner`, escalating to `steward`; route the open objections to implementation (9, 10) and to spec-writing (7's README limitation), with 9's accept-the-gap-or-add-a-gate choice also routing to `product-owner`.

### Step 6 — routing (facilitator, applies standing rulings; escalates the rest)
Ruling-seat questions are not decided here: each open item is routed against the Phase 1/standing rulings first, per the escalation contract — an answered question is not re-asked.

- **Open objection 7 (README limitation):** not a ruling question. The owner's round-2 correction (2) already commits to the exact limitation language (negotiation asserted only as pi's own emitted `\x1b[>7u`; `decodeKittyPrintable` is state-independent so `é` proves decode, not negotiation acceptance). Folded into the spec as a required README statement — step-9 assertable. No ruling needed.
- **Open objection 9 (real-terminal half):** the question "is live execution of the manual/real-terminal path a gate?" is answered twice on record — the orchestrator's binding fact ("if a manual procedure, the procedure and expected frames land as durable docs and live execution is not a gate") and the acceptance ("the smoke is the live-path falsifier and does not gate ordinary CI"). Applied: the real-terminal half is documented (expected-frame table + human replay path in the README), live execution not a gate; the harness carries the gate-set falsifier. The residual is boundary documentation folded into the spec (the README states the manual path is the verification mechanism for the real-terminal half; the pty harness writes press-only forms, never press+release — that split is a finding-flag, not a harness bug). No new ruling needed.
- **Open objection 10 (SMOKE_PHASE guard):** settling test exists and is runnable only after implementation — carried into the spec as a required step-9 assertion (the new phase value handled in an isolated branch; no-SMOKE_PHASE full path byte-identical before/after; git diff of driver.sh additive-only within the guard). No ruling needed.
- **Open judgment A (dummy-key contract change):** not covered by any Phase 1/standing ruling. Genuinely unanswered — **ESCALATED** (packet A).
- **Open judgment B (0.84.3 decode preflight guard):** not covered by any Phase 1/standing ruling; proposed by principal, never responded to by owner (exchange closed at round 2), no test settles it. Genuinely unanswered — **ESCALATED** (packet B).

The card halts here pending the orchestrator's rulings; step 7 does not start on a card with open ruling questions.

### Step 6 cont. — rulings received, card resumed (job-12.1, resumed container)
Both escalated packets ruled by `product-owner` (via the orchestrator, resumption input): **R-1** (dummy-key contract change — ACCEPTED with documented mitigation, README MUST state the contract change) and **R-2** (0.84.3 decode preflight guard — INCLUDED, a `node -e` parity assertion before any TUI session). Both appended verbatim in the `## Phase 1 rulings (product-owner, step-6 escalations)` section above; binding on every seat, steward included. The binding facts restated in the resumption (ruled copy set byte-exact; unit kitty decode tests remain the CI gate; the smoke is the live-path falsifier, not a CI gate; the pty harness lands as test-side code — no `extensions/` change unless proven unavoidable (an escalation, not a decision); re-executable without tribal knowledge) were already on record from step 1/2 and are not re-recorded. Per R-1/R-2 the step-7 spec folds in: `OPENROUTER_API_KEY` defaulted-and-exported in `run.sh`, README contract-change statement, and the R-2 `node -e` decode parity preflight. Objective 7's README-limitation language (negotiation asserted only as pi's own emitted `\x1b[>7u`; `é` proves decode, not negotiation acceptance) is likewise part of the spec per step 6's already-applied routing. Proceeding to step 7 (spec).

### Step 7 — spec written, handed to owner (job-12.1)
Spec saved to `docs/superpowers/specs/2026-09-05-FLLWUP-14-design.md` (full-council path). Contents: delivery shape (`smoke/search-smoke/` = `run.sh` + `driver.py` + `README.md`; same-artifact manual procedure; `SMOKE_PHASE=6`-only placement in `driver.sh` with additive-only guard change; host-level `bash smoke/search-smoke/run.sh` as the runner-gate-set additional gate), R-1 and R-2 folded in verbatim as binding requirements, driver behavior (pty 80×28, flag-1-only kitty capability reply so arrows stay legacy `\x1b[B`, byte table in bare CSI-u form, per-checkpoint snapshots, structural row assertions), nine frames byte-exact against `model-picker.ts` source-verified literals (header `council models — pick a model per seat`; search row `▌ / filter · esc clears`; hint `press / to filter models`; no-match `No models matching "zz".` + `↓ then esc exits search`; footers `↑/↓ move · enter open · esc back` / `↑/↓ move · enter select · esc back`; `No providers configured …` absent at frame 2), preflight chain (R-2 `node -e` → headless R-2 usage-line probe → TUI session), README mandatory statements (R-1 contract change; R-2 guard; objection-7 negotiation limitation; real-terminal split), and the settled testable-claims set (mutation probes, `é` falsifier, greppable no-extension-import, diff-touches-nothing under gates.yml/test/package.json, unset-key still reaches frame 2). Self-review: no placeholders, no scope beyond `smoke/`, single-design on each resolved point (SMOKE_PHASE value 6; Down = `\x1b[B` under flag-1 scope; frame-4 derived-set rule follows the live render). Spec committed. Handed to the sole owner; card → `In Progress`.

### Step 8 — owner implemented, In Review (job-13.1)
Owner dispatched with a pointer brief (spec + card face + repo pointers). Branch `feat/fllwup-14-search-smoke`, head `48ea5a3`, worktree `.worktrees/fllwup-14-search-smoke`, PR **#36** open (observed: state OPEN, headRefOid `48ea5a3`, base `main`). Diff confined to `smoke/driver.sh`, `smoke/search-smoke/*`, and the plan doc — nothing under `.github/workflows/`, `test/`, `package.json` (claim 5). Owner-reported local gates, all green: `bunx tsc --noEmit` exit 0; `bun test` 555 pass / 2 skip / 0 fail; `python3 council/validate.py` clean; `bash smoke/search-smoke/run.sh` SMOKE PASS — 9 frames green, ran 3× incl. once with `OPENROUTER_API_KEY` unset (claim 8); `SMOKE_PHASE=6 bash smoke/run.sh` Docker path green. Harness frame results: pre-press walk captured the 1416-row catalogue; `cla`→181 derived rows, `zz`→0, `é`→0; `▌ é` falsifier green; R-2 node-e + headless usage-line probe green under pinned 0.84.3; full path byte-identical (`cmp`). Owner-recorded deliberate deviations (each documented in the harness README): (1) the COUNCIL_SEAT/COUNCIL_JOB_ID/COUNCIL_RUN_ID env of this runner's session makes the extension enter child mode and register nothing — `run.sh` unsets them; found at bring-up, not assumed; (2) the frame-2 live window shows ~23 rows while `cla` matches rows deeper, so the driver walks the list once to build the derived universe — implements the spec's own live-render clause; (3) at 80×28 `withModalFrame` clips full-row frames' footer, so full-row frames assert the deterministic clip while short frames (no-match/provider/seat) assert footer-last byte-exact. In Review set (sole condition: open PR). Step 9 next: skeptic at the branch, subject = head `48ea5a3` + worktree path.

### Step 9 — Skeptic verification, NO-BLOCK (job-13.2, verify cycle 1 of ≤3)
Skeptic dispatched at the pinned subject (FLLWUP-19 constraint): head SHA `48ea5a3`, worktree `.worktrees/fllwup-14-search-smoke`, loop frame stated (cycle 1 of ≤3). Re-ran the full gate set in the worktree: tsc exit 0, bun test 555 pass/2 skip/0 fail, validate.py clean, host harness `bash smoke/search-smoke/run.sh` 9 frames green ×3 (incl. unset-key), `SMOKE_PHASE=6` Docker path green. Verdict **NO-BLOCK**, 15 objections settled: **14 closed-green** — mutation probes (a) and (b) each provably red on scratch-edit (can-fail shown); `é` falsifier works (artifact `04-e-acute.txt`: `▌ é` line 12, `No models matching "é".` line 13; 233 > 126 unreachable by the legacy arm); `driver.py` imports stdlib only (AST: pty/fcntl/os/select/re/struct/sys/termios/time); diff touches nothing under `.github/workflows/`/`test/`/`package.json`; R-2 guard can-fail shown (broken assertion → exit 1 "0.84.3 decode parity failed" pre-TUI); headless preflight emits the R-2 usage line; `zz` → 0 hits across the 1416-row pinned-0.84.3 universe, frame 9 shows the no-match triple footer-last; all 8+ ruled literals byte-identical across TS source/driver/README; all 5 README mandatory statements present; unset-key run reaches frame 2 (R-1 default); the three owner deviations assessed as not-weakening (child-mode env unsets defensive + headless preflight is the misroute tripwire; full-catalogue walk strictly stronger than a frame-2 snapshot; footer clip documented with short frames still asserting footer-last); re-executability: README sufficient one-command; gate-integrity probe: `bun test` exits 1 on injected failure. **1 closed-red (documentation, not product defect)**: spec §8.2 claim (c) — deleting the PRE_SEARCH_HINT render does NOT redden frame 2 at 80×28 with a full catalogue, because the hint renders below the `withModalFrame` panel clip (maxPanelHeight−2) and the driver's frame-2 matcher asserts the deterministic clip there; the hint's byte-exact rendering is pinned by `test/model-picker.test.ts` "BUG-1 2" (unit suite remains the CI gate). Skeptic's remedy: the spec must say the probe reddens frame 2 only at a height where the hint is visible. **Applied to the spec on main** (`2026-09-05-FLLWUP-14-design.md` §8.2 claim (c) amended with exactly that limitation, plus the step-9 finding attribution). No owner rework required — no product change, nothing the PR carries was affected. ### Step 9.5 — merge-gate re-run finding: harness prune exits non-zero on container-owned artifacts (verify cycle 2 red, card back to In Progress)
At the step-11 deterministic merge check the runner re-ran the owner gates at head `48ea5a3` as its own observed artifacts (tsc exit 0; bun test 555 pass/2 skip/0 fail — wait, 557 across 54 files, 0 fail; validate clean; CI `gates` SUCCESS on the head SHA). The host harness `bash smoke/search-smoke/run.sh` — **RED (exit 123, no `SMOKE PASS` line)**: its final prune pipeline (`ls … | tail | xargs rm -rf`) cannot delete the **root-owned** artifact dirs the Docker path (`SMOKE_PHASE=6 bash smoke/run.sh`, run from the worktree with `-v $WORKTREE:/pkg`, container runs as root) writes into the worktree's `smoke/.artifacts/search-smoke/` (observed: `20260905-120743`, `20260905-121557` owned by root); `xargs` returns 123, `set -euo pipefail` kills the script before `SMOKE PASS`. The frames themselves were green (artifacts written); the defect is the gate command's exit status: **the host harness does not exit 0 on a green-frame run when a prior container run has left root-owned entries in the shared artifacts tree** — reproducible across owner (its Docker run created the first root dir), skeptic (noted "exit 123 … irrelevant"), and runner. The Skeptic's frame-level verification stands; the exit-status finding is the runner's observed-artifact red at the merge gate, criterion 1 (owner gates green in full). Handed back to the owner per step 9 (fix cycle 2 of ≤3): the host harness must exit 0 on green frames under every supported sequence (host-only, host-after-container, container-after-host) without swallowing genuine prune failures. Root-owned dirs left in place for the fix's repro; `.artifacts` is gitignored so no diff pollution. Card → `In Progress`.

### Step 9.6 — fix cycle 2: prune defect fixed, PR composition corrected (job-13.4, job-13.5)
Owner fix (job-13.4, pushed `48ea5a3..7d3cdcc` on the same branch, PR #36): the prune in both host scripts (`smoke/search-smoke/run.sh` and the identical-class `smoke/run.sh`) is now best-effort housekeeping decoupled from the verdict — a tolerant loop prunes every entry it can, names every unremovable entry in a visible `prune:` warning on stderr (foreign-owned vs own-permission branches via `-O`), and never inverts a green frame verdict; failures never silent. Can-fail proven without root: an own `chmod 000` dir with content as the oldest prune candidate made the old `xargs -r rm -rf` pipeline exit 123 and the fixed harness exit 0 with the warning visible. Re-gates at `7d3cdcc` (owner-reported, worktree): tsc 0, bun test 0 (555/2/0), validate 0, host harness exit 0 + `SMOKE PASS` with the root-owned dirs and chmod-000 proof dir in place, `SMOKE_PHASE=6` Docker exit 0. README documents the tolerance. **Composition correction (job-13.5)**: the fix cycle had also edited two main-side single-writer artifacts in the worktree (the card face and the spec, both stale at the branch base) and pushed them onto the PR; per board discipline those are the runner's documents — the owner restored both to the branch-base versions and the PR head is now `4b470ec`, carrying exactly the deliverable set (`docs/superpowers/plans/2026-09-05-FLLWUP-14-plan.md`, `smoke/driver.sh`, `smoke/run.sh`, `smoke/search-smoke/{run.sh,driver.py,README.md}`). The owner's root-cause content is re-recorded here (above) and the prune contract as spec §8 claim 11, both in the runner's voice. Skeptic re-verification (cycle 2) next at head `4b470ec`.

### Step 10 — judge PASS (job-13.3)
Judge dispatched with exactly the card's `goal` and the step-9 Skeptic evidence (FLLWUP-18/20 subject pin: head `48ea5a3`, worktree `.worktrees/fllwup-14-search-smoke`, loop frame stated). Verdict **PASS**. Basis: all three goal conjuncts satisfied at `48ea5a3` — (1) documented smoke procedure: `smoke/search-smoke/README.md` (byte table, nine expected frames, assertion rules, human-replay path; Skeptic confirmed all 5 mandatory statements); (2) live-terminal CSI-u drive: `bash smoke/search-smoke/run.sh` 9 green frames in a pty; artifacts `03-search-open.txt` (`▌ / filter · esc clears`), `06-cla.txt` (`▌ cla`), `07-cl.txt` (`▌ cl` after backspace), `08-cleared.txt`/`10-esc-esc.txt` (Esc-clearing restored); (3) ruled copy byte-exact across driver/README/TS + recorded frames for re-execution. The single closed-red (spec claim-c) is documentation-only, product-side pinned by the unit suite. No REJECT basis raised. Step 11 (deterministic merge check) next.
