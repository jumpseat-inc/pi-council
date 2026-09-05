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

### Step 3 — bounded exchange (round 2)
Both generators re-dispatched with each other's round-1 positions
verbatim (jobs 10.3/10.4). Rounds recorded verbatim per round.
