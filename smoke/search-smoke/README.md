# FLLWUP-14 — Kitty-protocol terminal smoke for the model search input

A pty-driven automated smoke harness that runs `/council-models` in a live pi
TUI inside a pseudo-terminal, delivers `/` and printable keystrokes **as
CSI-u kitty-protocol sequences**, and asserts the observed frames against the
ruled copy set byte-exact. **This document is both the harness manual and the
manual procedure**: the automated `run.sh` executes exactly the byte script and
frame table below, so a person at a real kitty terminal can replay it by hand.

- Run the automated harness: `bash smoke/search-smoke/run.sh` (one command,
  self-provisioning — no Docker, no setup). Artifacts land in
  `smoke/.artifacts/search-smoke/<ts>/`.
- Run it inside the Docker smoke path: `SMOKE_PHASE=6 bash smoke/run.sh`.
- Replay by hand: at a kitty-protocol terminal, `cd` into a directory with the
  pi-council extension pinned project-locally (`.pi/settings.json`) and
  `defaultProjectTrust: "always"` set, run `pi`, then type `/council-models`
  and the byte sequences below, and compare the frames.

The harness is the **live-path falsifier** for FLLWUP-14's gap — raw CSI-u
bytes → pi's input pipeline → the modal's `ModelPicker.handleInput` — the tail
the unit suite pins only given bytes. It does **not** gate ordinary CI: the
unit kitty decode tests remain the CI gate (spec §1, binding fact).

---

## R-1 — contract change (binding ruling, ACCEPTED with documented mitigation)

The harness's `run.sh` **exports `OPENROUTER_API_KEY="${OPENROUTER_API_KEY:-sk-dummy}"`**
to the pinned pi 0.84.3 processes. The scratch HOME is therefore **not
credential-less** — by design:

- The modal under test **never dispatches**: `ModelPicker.handleInput` mutates
  picker state only; no keystroke initiates a model call, so the dummy key is
  never sent to any provider.
- `sk-dummy` is a placeholder string, never a real secret, and it is **never
  persisted** (env-var export only in `run.sh`, no write to disk).
- The **headless preflight** (step 4 below) is the misroute tripwire: any
  misroute-to-model-dispatch surfaces red there — before any TUI session —
  not as a confusing TUI-session failure.
- Mechanism (Skeptic objection 2, closed-green): `envApiKeyAuth("OpenRouter API
  key", ["OPENROUTER_API_KEY"])` defines no `check` method; its `resolve`
  reads the env var with zero network I/O; a non-empty value yields a
  non-undefined auth result and the OpenRouter catalogue populates statically
  from the bundled model set.

The tradeoff the ruling accepts: the scratch env loses the fails-fast-offline
property a credentialless HOME would give a *misroute*. The mitigation is that
a misroute is caught by the headless preflight red (or, failing that, fails as
a 401 on a live network / a timeout offline — recoverable observations, never
silent corruption).

## R-2 binding guard — 0.84.3 decode parity preflight (INCLUDED)

Before any TUI session, `run.sh` runs a `node -e` preflight against the
npm-installed `@earendil-works/pi-coding-agent@0.84.3` dist, resolved via
`NODE_PATH` into the pinned node_modules (`@earendil-works/pi-tui` is nested
under `@earendil-works/pi-coding-agent/node_modules`). Required assertions:

- `decodeKittyPrintable("\x1b[47u") === "/"`
- `matchesKey("\x1b[127u", "backspace") === true`

plus the rest of the driver byte table (all printable decodes, Esc/Enter/
legacy Down/Up, press-only form). If any fail, the harness reds with a clear
**"0.84.3 decode parity failed"** message and never boots the pty session.

What a red means: the pinned 0.84.3 pi-tui and the version the deliberation
closed the decode mechanism against (the runner's installed pi) are **not
observably identical** from inside a seat. This guard turns a confusing red
into a calibrated one: it distinguishes a *version regression* (preflight
red) from a *product bug* (preflight green, frames red). Reversibility is one
`node -e` block.

## Objection-7 limitation — what the negotiation assertion does NOT prove

The harness asserts pi's own emitted kitty negotiation query, `\x1b[>7u…`, in
the boot stream. That proves pi **asked** for kitty mode — not that it
**accepted** the reply. `decodeKittyPrintable` is a pure, state-independent
function, so `▌ é` proves the CSI-u bytes reached the modal and decode ran —
**not** negotiation acceptance. `kittyProtocolActive` is unobservable from
outside the process; the negotiation-acceptance half remains an unasserted
assumption by design (step-6 applied routing, spec §7).

## Real-terminal split statement

The pty harness writes **press-only forms** and never press+release pairing:
a real terminal's release events are `:3`-suffixed (`\x1b[47;1:3u`) and are
filtered by pi's `isKeyRelease`. If a real kitty run ever double-appends an
input, that is **a finding to report, not a harness bug** — the expected-frame
table stays shared. The manual procedure below is the verification mechanism
for the real-terminal half (real emission + negotiation under flags=7); its
live execution is **not a gate** (binding fact).

---

## Environment

- Pty winsize **80×28**, `TERM=xterm-256color`, scratch `$HOME` seeded with
  `{"defaultProjectTrust": "always"}` in `$HOME/.pi/agent/settings.json` and
  the repo pinned project-local (`pi install -l <repo>`), plus the smoke
  fixture's `.council.json` (9 seats → `openrouter/deepseek/deepseek-v4-flash-0731`).
- `OPENROUTER_API_KEY` exported (R-1) — the registry is non-empty, the modal is
  reachable.
- **COUNCIL seat-hazard**: run the harness from an environment WITHOUT the
  council child-mode vars (`COUNCIL_SEAT`, `COUNCIL_JOB_ID`, `COUNCIL_RUN_ID`).
  Set, the pi-council extension enters child mode, registers no parent
  commands, and `/council-models` misroutes to a real model dispatch (a 401
  with the dummy key). `run.sh` unsets them defensively.
- Terminal-query answers (deterministic): primary DA `\x1b[?1;2c` and the
  kitty capability reply **`\x1b[>1u`** — confirming flag 1 only. Flags=1 moves
  printable keys to CSI-u while special keys stay legacy CSI, so **Down is
  delivered as the base-case `\x1b[B`**, exactly as a real xterm-compatible
  terminal emits it. Anything the driver cannot interpret is ignored; pi must
  not block on unanswered queries.
- `driver.py` imports **python3 stdlib only** (`pty`, `fcntl`, `termios`,
  `select`, `re`, `struct`) — no pi/extension module (greppable claim). The
  screen model and the byte table are authored in the driver.

## Byte table (kitty flag-1 CSI-u; the bare form is the settled form)

| Key | Bytes |
|---|---|
| `/` | `\x1b[47u` |
| `c` `l` `a` `z` `e` … printable | `\x1b[99u` `\x1b[108u` `\x1b[97u` `\x1b[122u` … (`\x1b[<codepoint>u`) |
| non-ASCII printable (`é`, U+00E9) | `\x1b[233u` |
| backspace | `\x1b[127u` |
| Esc | `\x1b[27u` |
| Enter | `\r` |
| Down | `\x1b[B` (legacy CSI — flag-1 scope) |

The suffixed press form (e.g. `\x1b[47;1:1u`) is accepted by the decode regex
but is **not** the required wire form; it survives only as this note.

## The nine frames (80×28, ANSI-stripped per line; literals byte-exact)

Ruled copy set (source: `extensions/model-picker.ts`):

- header `council models — pick a model per seat`
- search row `▌ / filter · esc clears` (U+258C at column 0, then the hint)
- pre-press hint `press / to filter models`
- no-match `No models matching "<query>".` + exit hint `↓ then esc exits search`
- footers `↑/↓ move · enter open · esc back` (seat/provider), `↑/↓ move · enter select · esc back` (model)

"line 1" = the body row directly below the modal header (the modal frame's
border top sits at screen index 0; the header at index 1; the search row at
index 2).

| # | Keystrokes (CSI-u unless noted) | Asserted frame |
|---|---|---|
| 1 | `/council-models\r` | seat level: header; seat rows; footer `↑/↓ move · enter open · esc back` last; no U+258C |
| 2 | `\r\r` | model level: body rows; the pre-press hint and `↑/↓ move · enter select · esc back` are *below the modal panel clip* at 80×28 (see note at the bottom); `No providers configured …` absent; no U+258C |
| — | pre-press walk | the driver walks the model list to the bottom (Down × ~1400) and back to index 0, capturing the full catalogue as the derivation universe |
| 3 | `\x1b[47u` | line 1 `▌ / filter · esc clears`; hint gone from this and every later snapshot; footer/clip as above |
| 4 | `\x1b[233u` | line 1 `▌ é`; `No models matching "é".` then `↓ then esc exits search`; footer `…enter select · esc back` last, never a fifth footer |
| 5 | `\x1b[99u \x1b[108u \x1b[97u` | line 1 `▌ cla`; visible rows == the driver-derived filter of the captured universe (`"cla"`-matching, case-insensitive, id-minus-`:level`), ordered, within the search window |
| 6 | `\x1b[127u` | line 1 `▌ cl`; rows recomputed via the same structural rule |
| 7 | `\x1b[122u \x1b[122u` | line 1 `▌ zz`; exactly `No models matching "zz".` then `↓ then esc exits search`; footer last; never a fifth footer |
| 8 | `\x1b[27u \x1b[27u` | line 1 back to `▌ / filter · esc clears`; header unchanged; clear-and-stay (a second Esc cannot ascend) |
| 9 | `\x1b[B \x1b[27u` | provider level: header; provider rows (`> OpenRouter`); footer `↑/↓ move · enter open · esc back` last; no U+258C anywhere |

Notes on the frame table:

- **Two intermediate clears are part of the byte script.** After frame 6
  (`cl`), an Esc clears the query so the no-match frame 7 runs on the query
  **`zz`** alone (the byte-exact literal is `No models matching "zz".`); the
  é falsifier (frame 4) then a backspace returns to the empty hint row before
  `cla`. Transcriptions of "run.sh does" (this table) match the driver's byte
  sequence exactly.
- **Live-render note (bring-up settled, spec §4.4 "the assertion follows the
  live render")**: `withModalFrame` shows `maxPanelHeight-2` content lines;
  with the full 1400+-row catalogue the modal's list fills the panel, and the
  pre-press hint and `…select · esc back` footer sit **below the panel clip** —
  they are not rendered at 80×28. Frames with room (no-match, provider, seat)
  assert the footer byte-exact, last, single-occurrence (the four-footer
  rule); full-row frames assert the deterministic clip (last visible line is a
  model row, no footer text rendered). The BUG-1 R-3 hint and the footer copy
  remain byte-exact-pinned by the unit suite; the smoke asserts what the live
  terminal render shows.

## Assertion rules

- **Per-checkpoint snapshots**: after each keystroke batch, wait for
  quiescence (3 stable polls; poll, never sleep; every wait `timeout`-ceiled),
  snapshot the bytes since the prior checkpoint, run them into the screen
  model (the modal repaints incrementally — rows the TUI does not re-send stay
  from earlier paints), strip ANSI per line, and assert against the snapshot.
- **Structural row assertions, never hardcoded rows**: the pre-press universe
  is captured by walking the list to the bottom; the expected visible set is
  the python-derived filter (case-insensitive substring on the row minus its
  `:level` suffix, same predicate as `filterModelRows`), sliced to the

  live search window (FLLWUP-15 shrink, taken from the empty-query snapshot,
  never hardcoded). The live visible set must equal it, exactly and in order;
  every visible row must be a member of the captured universe (a walk miss is
  a calibrated failure, not a false pass). Ruled literals are built-in
  byte-exact; row sets self-calibrate against the live catalogue.
- **No retries**: a red is per-frame, per-line diffs (expected vs actual) plus
  kept artifacts at `smoke/.artifacts/search-smoke/<ts>/` — the captured
  stream, the frames, and the derived row sets. Re-run is the same command.

## Artifact pruning (foreign-entry tolerance)

Runs are kept to the last 5 (`KEEP=5`) under `smoke/.artifacts/search-smoke/`.
The artifacts tree is bind-mounted into the Docker smoke path
(`SMOKE_PHASE=6 bash smoke/run.sh`), whose container runs as **root**, so a
container run leaves **root-owned** run dirs that a later host run cannot
remove. Pruning is best-effort housekeeping and is **decoupled from the
verdict**: a run whose nine frames are green exits 0 and prints
`SMOKE PASS` even when expired dirs cannot be deleted. Everything that can
be pruned is pruned; every entry that cannot be removed is named in a
visible `prune:` warning on stderr, distinguishing foreign-owned entries
(root-owned from a container run — inert history, leave in place) from
own-permission ones (e.g. a `chmod 000` run dir you own — restore access
and remove it by hand). A prune failure is never silent and never inverts a
green verdict. The same tolerance applies to the top-level Docker
entrypoint's prune in `smoke/run.sh`.

## Human-replay path

At a kitty-protocol terminal (or any xterm-compatible terminal; the only
kitty-specific call is that the printable keys below are sent as CSI-u —
a real kitty under flags=7 does this itself for typed letters with the
appropriate config):

1. Start `pi` in a scratch repo with the pi-council extension pinned
   project-locally and `defaultProjectTrust: always`. Verify the TUI booted.
2. Type `/council-models` and press Enter (frame 1). Type Enter twice
   (frame 2). Type `/` (frame 3). Type `é` (frame 4), Esc… — follow the
   keystroke table and compare each frame against the expected table above.
3. The automated run is the same script with the kitty-terminal half replaced
   by the pty + hand-answered capability reply.

## COOK — one artifact, two modes

`run.sh` (host) == manual procedure: R-2 `node -e` parity → headless
`/council-models` usage probe → pty session. The usage-line probe must print
`[council-models] usage: /council-models [<seat> [<provider>/<model>[:thinking]]]`
— same literal `smoke/driver.sh` phase 5 greps.