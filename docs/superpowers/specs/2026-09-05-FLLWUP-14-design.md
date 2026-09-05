# FLLWUP-14 — Kitty-protocol terminal smoke for the model search input (design spec)

Date: 2026-09-05. Card: `council/cards/FLLWUP-14.md` (full council — this spec writes up what
the deliberation settled; it does not derive anything new).

Authority, in order: (1) the card face — its `goal`/`Acceptance`, the full deliberation record
(steps 2–6), and the `## Phase 1 rulings (product-owner, step-6 escalations)` section (R-1, R-2),
which are binding on every seat; (2) this spec — the self-sufficient write-up an implementing
owner needs and nothing more. Wiki grounding: [[smoke-test]], [[council models picker]],
[[two-bit-focus-machine]], [[deterministic-merge-check]], [[headless-pi]].

## 1. What is being built

A **pty-driven automated smoke harness** that runs `/council-models` in a live pi TUI inside a
pseudo-terminal, delivers `/` and printable keystrokes **as CSI-u kitty-protocol sequences**, and
asserts the observed frames against the ruled copy set byte-exact. The same byte script and
expected-frame table are documented as the **manual procedure** — one artifact, two execution
modes (`smoke/search-smoke/README.md`). The harness is the live-path falsifier for the card's gap:
raw CSI-u bytes → pi's input pipeline → the modal's `ModelPicker.handleInput` — the tail that the
unit suite pins only given bytes.

The deliverable is **test-side code + durable docs**: files under `smoke/` and nothing else.
No `extensions/` change (that is an escalation, not a decision), no change to
`.github/workflows/gates.yml`, `test/`, or `package.json`.

## 2. Delivery shape (settled)

- **Primary deliverable**: `smoke/search-smoke/` containing:
  - `run.sh` — one-command host entrypoint. `timeout`-ceiled; provisions a scratch area
    (scratch `$HOME` + a scratch prefix npm install of `@earendil-works/pi-coding-agent@0.84.3`);
    seeds the scratch with the smoke fixture's 9-seat `.council.json` pin and the repo pinned
    project-local so the pi-council extension registers (the command must exist in the TUI);
    sets `defaultProjectTrust` so the TUI never prompts; runs the R-2 preflight guard, then the
    headless preflight, then invokes `driver.py`; writes artifacts and per-line diffs to
    `smoke/.artifacts/search-smoke/<ts>/`.
  - `driver.py` — python3 stdlib only (`pty`, `fcntl`, `termios`, `select`, `re`). Spawns the
    pinned pi in a pty (winsize 80×28, `TERM=xterm-256color`, scratch HOME), answers terminal
    queries deterministically, drives keystrokes as CSI-u, implements the ~150-line screen model
    and the frame assertions.
  - `README.md` — the durable procedure: byte table, expected frames (byte-exact), assertion
    rules, human-replay path, the R-1 contract-change statement, the R-2 guard description, and
    the objection-7 limitation statement (below). The automated harness and the manual procedure
    are the same artifact: the README documents exactly what `run.sh` does, byte for byte, so a
    person at a real kitty terminal can replay it.
- **Placement in the repo's verification set**: the kitty phase runs **only** under the
  `SMOKE_PHASE` path — never in `gates.yml`, never folded into the no-`SMOKE_PHASE` full path
  (the release-stability gate). `smoke/driver.sh`'s guard (`"only 5 is supported"` → hard fail)
  accepts the new value **6**; the new value takes an isolated branch that runs the search
  harness; the no-`SMOKE_PHASE` full path stays **byte-identical** (step-9 assertion: the diff
  of `smoke/driver.sh` is additive-only within the guard region). Execution: `SMOKE_PHASE=6`
  through the existing `smoke/run.sh` Docker path **and** directly as `bash smoke/search-smoke/run.sh`
  on the host (the host path is the runner-gate-set execution, self-provisioning, no Docker).
- **Explicit additional gate**: at steps 8/9 the harness runs on the host as
  `bash smoke/search-smoke/run.sh` — green iff every frame matches, red with per-line diff and
  kept artifacts. Ordinary CI remains exactly the current four gates.

## 3. Binding rulings folded in (R-1, R-2 — verbatim requirements)

- **R-1 — dummy-key contract change (ACCEPTED with documented mitigation)**: `run.sh` MUST
  `export OPENROUTER_API_KEY="${OPENROUTER_API_KEY:-sk-dummy}"` for the pinned pi 0.84.3
  process(es). Rationale (closed-green, Skeptic objection 2): `envApiKeyAuth("OpenRouter API
  key", ["OPENROUTER_API_KEY"])` defines no `check` method; its `resolve` reads the env var with
  zero network I/O; a non-empty value yields a non-undefined auth result; the OpenRouter
  catalogue populates statically from the bundled model set. Without it the scratch registry
  renders `No providers configured` and the harness never reaches frame 2. The **README MUST
  state** the contract change: the scratch HOME is not credential-less, the modal never
  dispatches (no keystroke initiates a model call), and the headless preflight is the misroute
  tripwire. `sk-dummy` is a placeholder, never persisted (env-var export only, no write to
  disk).
- **R-2 — 0.84.3 decode preflight guard (INCLUDED)**: before any TUI session, `run.sh` runs a
  `node -e` invocation against the npm-installed `@earendil-works/pi-coding-agent@0.84.3` dist
  (resolved via `NODE_PATH` into the pinned node_modules) asserting:
  - `decodeKittyPrintable("\x1b[47u") === "/"`
  - `matchesKey("\x1b[127u", "backspace") === true`
  If either assertion fails, the harness reds with a clear **"0.84.3 decode parity failed"**
  message and never boots the pty session. (Rationale: the Skeptic closed the decode mechanism
  against the installed pi-tui; the harness runs against the pinned 0.84.3, and the two are not
  observably identical from inside a seat. Reversibility is one `node -e` block.)

## 4. Driver behavior

### 4.1 Environment

- Pty winsize 80×28; `TERM=xterm-256color`; scratch `$HOME` (clean TUI config) seeded with:
  agent settings enabling default project trust (same value the smoke `Dockerfile` sets),
  project-local repo pin (`pi install -l <repo>` effect), and the fixture's `.council.json`
  (9 seats → `openrouter/deepseek/deepseek-v4-flash-0731`, one provider, one model family).
- `OPENROUTER_API_KEY` exported (R-1). A fresh session must reach the model level with ≥1
  provider row: frame 2 asserts **≥1 provider row and the `No providers configured — authenticate
  a provider in pi, then reopen /council-models.` literal ABSENT**.
- **Terminal-query answers** (deterministic): primary DA (`\x1b[c` → reply `\x1b[?1;2c`) and the
  kitty capability reply confirming **flag 1 only** (`\x1b[>1u`). Confirming flags=1 means
  printable keys move to CSI-u while special keys (arrows) stay legacy CSI — so Down is delivered
  as the base-case `\x1b[B`, exactly as a real xterm-compatible terminal emits it. Anything the
  driver cannot interpret is ignored; pi must not block on unanswered queries.
- `driver.py` imports **no pi/extension module** (greppable claim): the screen model and byte
  table are authored in the driver.

### 4.2 Keystroke byte table (kitty flag-1 CSI-u; bare form is the settled form)

| Key | Bytes |
|---|---|
| `/` | `\x1b[47u` |
| `c` `l` `a` `z` `e` … printable | `\x1b[99u` `\x1b[108u` `\x1b[97u` `\x1b[122u` … (`\x1b[<codepoint>u`) |
| non-ASCII printable (`é`, U+00E9) | `\x1b[233u` |
| backspace | `\x1b[127u` |
| Esc | `\x1b[27u` |
| Enter | `\r` |
| Down | `\x1b[B` (legacy CSI — flag-1 scope, §4.1) |

The suffixed press form (`\x1b[47;1:1u`) survives as a **one-line README note only** (it is
accepted by the decode regex, closed-green, but is not the required wire form). The bare forms
are verified against 0.84.3 by the R-2 guard (which asserts the `/` and backspace cases; bring-up
adds the rest to the guard if cheap).

### 4.3 Frame mechanics (settled)

- **Per-checkpoint snapshots, never accumulated-stream greps**: after sending each keystroke
  batch, wait for quiescence (no new bytes across the polling window; poll, don't sleep; every
  wait `timeout`-ceiled; 3 stable polls define a stable frame), snapshot the bytes received since
  the prior checkpoint, strip ANSI per line, and assert against that snapshot.
- **Structural row assertions**: capture the pre-press model rows from the frame-2 snapshot;
  after typing, assert every visible row is a subset of the pre-press rows and contains the query
  (case-insensitive substring on the rendered row, id-minus-`:level`), and that the visible set
  equals the driver's independently-derived set (same predicate in python). Ruled literals are
  hardcoded byte-exact; row sets self-calibrate.
- **ANSI-stripped line model**: the screen is the stripped lines at width 80; "line 1" means the
  second line (index 1), i.e. the body row directly below the modal header.

### 4.4 Frames (80×28, ANSI-stripped per line; literals byte-exact)

1. `/council-models\r` → modal at seat level: header `council models — pick a model per seat`,
   footer `↑/↓ move · enter open · esc back` last.
2. `\r\r` (Enter → Enter: seat→provider→model level) → body rows, then penultimate
   `press / to filter models`, last `↑/↓ move · enter select · esc back`; no U+258C anywhere in
   the stripped frame; **the `No providers configured…` literal is absent**.
3. `\x1b[47u` (`/`) → line 1 `▌ / filter · esc clears`; the `press / to filter models` hint is
   gone from this and every later snapshot; footer `↑/↓ move · enter select · esc back` last.
4. `\x1b[99u \x1b[108u \x1b[97u` (`c`,`l`,`a`) → line 1 `▌ cla`; visible rows assert the
   §4.3 structural rule (derived set from the frame-2 capture; empty derived set → the no-match
   copy renders instead — the assertion follows the live render, never both); footer last.
5. `\x1b[127u` (backspace) → line 1 `▌ cl`; rows recomputed; footer last.
6. `\x1b[122u \x1b[122u` (`z`,`z`) → line 1 `▌ zz`; exactly
   `No models matching "zz".` then `↓ then esc exits search` (both byte-exact), footer last —
   never a fifth footer. (`zz` never matches the bundled catalogue: empirically zero `zz`
   substrings across the OpenRouter bundle's 692 ids, including `z-ai/*`.)
7. `\x1b[27u` twice (Esc, Esc) → line 1 back to `▌ / filter · esc clears`; header and footer
   unchanged (clear-and-stay; a second Esc cannot ascend — still `inputFocused`).
8. `\x1b[B` (Down) then `\x1b[27u` (Esc) → provider-level frame (header + provider rows +
   `↑/↓ move · enter open · esc back` last); no U+258C anywhere; Esc-after-Down ascends because
   Down cleared `inputFocused` (focus-out edge).

## 5. Preflight chain (in order, all in the same scratch env)

1. **R-2 decode parity guard** (`node -e` vs pinned 0.84.3, §3). Red → "0.84.3 decode parity
   failed", no TUI session.
2. **Headless usage-line probe**: `pi --approve -p "/council-models"` must print the R-2 usage
   line `[council-models] usage: /council-models [<seat> [<provider>/<model>[:thinking]]]`
   (the in-repo authority is `extensions/council-models.ts` `USAGE_LINE`; driver.sh phase 5
   greps the same literal). This proves registration **and** is the misroute tripwire: any
   misroute-to-model-dispatch surfaces red here, not in the TUI session.
3. **TUI session**: `driver.py` drives frames 1–8 (§4.4).

## 6. Assertion contract for reds

A red prints per-checkpoint, per-line diffs (expected vs actual stripped lines) and keeps
`smoke/.artifacts/search-smoke/<ts>/` — the captured stream, the frames, and the derived row
sets — for triage. No retries; re-run is the same one command.

## 7. The README (the durable procedure)

Contents, all mandatory:

- Byte table (§4.2) and the nine-frame expected table (§4.4) byte-exact — this IS the manual
  procedure's expected-frame table; a person at a real kitty terminal replays the same bytes and
  compares the same frames.
- Assertion rules (§4.3–§4.6 semantics).
- **R-1 contract-change statement** (per ruling): the scratch HOME is not credential-less
  (`OPENROUTER_API_KEY` defaulted to the placeholder `sk-dummy`, presence-only auth, no network),
  the modal never dispatches, and the headless preflight is the misroute tripwire.
- **R-2 guard description**: the pin-parity preflight against 0.84.3 and what a
  "0.84.3 decode parity failed" red means (version regression vs product bug disambiguation).
- **Objection-7 limitation statement** (step-6 applied routing): the negotiation assertion is
  only pi's own emitted `\x1b[>7u` query in the captured stream — it proves pi *asked* for kitty
  mode, not that it *accepted*; `decodeKittyPrintable` is a pure, state-independent function, so
  `▌ é` proves the CSI-u bytes reached the modal and decode ran, not negotiation acceptance
  (`kittyProtocolActive` is unobservable from outside the process).
- **Real-terminal split statement**: the pty harness writes press-only forms and never press+
  release pairing (a real terminal's release events are `:3`-suffixed and filtered by
  `isKeyRelease`); if a real kitty run ever double-appends, that is a finding to report, not a
  harness bug. The manual procedure is the verification mechanism for the real-terminal half
  (real emission + negotiation under flags=7); its live execution is not a gate (binding fact).
- Human-replay path: how to reproduce the exact run by hand at a kitty terminal.

## 8. Testable claims (the settled set — step 9 asserts these)

1. `bash smoke/search-smoke/run.sh` is green iff every frame matches; red carries per-line diff
   and kept artifacts.
2. Three product mutation probes: (a) drop the `decodeKittyPrintable` fallback → frame 3 red;
   (b) mutate `SEARCH_ROW_EMPTY` by one byte → frame 3 red; (c) delete the BUG-1 `press / to
   filter models` hint render → frame 2 red.
3. Anti-harness-regression `é` falsifier: `\x1b[233u` → `▌ é`. U+00E9 (233 > 126) is unreachable
   by the legacy `length === 1 && 32..126` arm, so `▌ é` is true iff the driver genuinely
   delivered CSI-u **and** kitty decode ran — a driver bug that strips ESC and sends legacy bare
   `/` keeps probes (a)–(c) green but reds here.
4. `driver.py` imports no pi/extension module (greppable).
5. PR diff vs `origin/main` touches nothing under `.github/workflows/` (gates.yml), `test/`, or
   `package.json`.
6. Headless preflight returns the R-2 usage line under the pinned 0.84.3.
7. Frame 2 shows ≥1 provider row and not `No providers configured …`.
8. `run.sh` with `OPENROUTER_API_KEY` **unset** still reaches frame 2 with ≥1 provider row
   (R-1 default kicks in).
9. R-2 `node -e` parity holds against the npm-installed 0.84.3 dist.
10. `SMOKE_PHASE=6` runs the harness through the Docker path; the no-`SMOKE_PHASE` full path is
    byte-identical before/after (diff of `smoke/driver.sh` additive-only within the guard).

## 9. Non-goals / out of scope

- No change under `extensions/`, `test/`, `package.json`, `.github/workflows/`.
- No change to the no-`SMOKE_PHASE` full smoke path.
- The 0.85.0 extension-load regression (the runner's stock pi loads no pi-council extension;
  `devDependency` is `"*"`) is a real compatibility finding but out of scope — a follow-up card
  candidate.
- The harness is Linux-friendly (python3 stdlib `pty`); no cross-platform requirement.
- Live execution of the manual/real-terminal path is not a gate (binding fact).