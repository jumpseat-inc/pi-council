---
id: FLLWUP-55
title: Collapse the smoke driver's private pty screen model onto the shared kit
state: Deliberating
owner: null
epic: EPIC-9
goal: smoke/search-smoke/driver.py consumes the shared pty screen model instead of carrying its own class Screen/class Session, with the release gate's pinned-pi isolation and the README's stdlib-only claim preserved or explicitly amended.
---

## Intent

FLLWUP-49's goal scoped its universe to `test/` plus `ev43/`, so
`smoke/search-smoke/driver.py`'s own `class Screen`/`class Session` (the fourth
definition, O4) was left untouched and named as a bounded residual — the
`steward` FLLWUP-49 ruling called that "a scoping decision matching O4, not a
permanent portfolio acceptance". This card is that residual: decide whether the
smoke driver can import the shared kit without coupling the release gate (which
installs a pinned external pi 0.84.3) to a `test/` module that resolves the
dev-installed pi, and without falsifying `smoke/search-smoke/README.md`'s
"authored in the driver" claim. If it cannot, the card's deliverable is the
recorded rationale plus an amended README claim — not a forced share.

Approved by `product-owner` (job-29) as-is from FLLWUP-49's step-13 draft.

## Run record (features-deliver / FLLWUP-55 — EPIC-9 residuals run 2)

### Step 1 — promotion + classification (facilitator)

- **Promotion (`Backlog` → `Ready`) applied, not asked.** Phase-1 run-2 scope
  ruling (`EPIC-9.md` run-2 block, 284ced2): `FLLWUP-50` through `FLLWUP-60`
  "are this run's delivery scope". `FLLWUP-55` is the **eighth** of eleven in
  the `steward` job-1 build-order ruling ("harness hygiene (`55`, then `56`,
  whose live arm must precede the budget cards)"). Run-1 precedent (5608ed1)
  and run-2 precedents (FLLWUP-60 `08fdb83`, FLLWUP-57 `bb5c5e8`, FLLWUP-53,
  FLLWUP-50, FLLWUP-54): the autonomous promotion moves the residual card to
  its working state at its runner's start. `python3 council/validate.py`
  clean after both state moves.
- **Path: full council.** The `goal` is a decision between two admissible
  designs — (a) the smoke driver imports the shared pty kit
  (`test/faux-provider/pty_kit.py`, the FLLWUP-49 shape-test-pinned single
  `class Screen`/`class Session`), or (b) it does not, and the deliverable is
  the recorded rationale plus an amended README claim. The card's `Intent`
  names the tradeoff explicitly (release-gate independence from a `test/`
  module vs. the fourth screen-model copy) and pre-authorizes "not a forced
  share". That is `spec-ambiguous` (the goal admits more than one reasonable
  design) and `design-judgment` (a real tradeoff exists) per council.md
  step 1 — either alone is sufficient for a full council.
- **Surface-touching: yes (recorded).** `smoke/search-smoke/README.md` is the
  harness manual and the manual procedure — a surface a person reads — and it
  pins the greppable claim "`driver.py` imports python3 stdlib only … The
  screen model and the byte table are authored in the driver"
  (`README.md:114-116`). Every branch of the card's decision touches that
  claim (a share falsifies "authored in the driver"; the no-share branch's
  named deliverable is "an amended README claim"), so this card's
  deliverable includes user-visible copy by construction. The orchestrator's
  card face confirms: an amended README claim is a copy change, and if its
  wording is open judgment this container escalates with the drafted string
  rather than self-rules. `designer` is therefore seated as a third generator
  in steps 2–3.
- **Seat resolution (`<seat_resolution_check>`):** `owner`, `principal`,
  `designer`, `skeptic`, `consolidator`, `judge` — the seats this card may
  dispatch — all resolve; the nine packaged seat files are present in the
  installed package clone
  (`~/.pi/agent/git/github.com/jumpseat-inc/pi-council/council/agents/`) and
  no repo-local `.pi/agents/` override directory exists, so nothing shadows
  them. Ruling seats (`product-owner`, `steward`) are never dispatched by
  this container.
- **Environment:** step 0 preflight skipped per the autonomous-run
  substitution (Phase 0 cleared it for the run); run for information only →
  not run by this container at card start (FLLWUP-49/57 precedent). Local
  `main` == `origin/main` at `a0a11ab` (FLLWUP-54 merged at `52f2144`,
  merged-SHA CI green), working tree clean. `python3 council/validate.py` →
  `All council artifacts valid`. No `Needs Human` state and no outstanding
  ruling on this card — deterministic merge check criterion 5 holds at card
  start.
- **Gate set for this repo** (authoritative: `.github/workflows/gates.yml` +
  [[deterministic-merge-check]]; `docs/gates/GATE-EVIDENCE.md` does not exist
  here): `bash council/preflight.sh FLLWUP-55`, `bunx tsc --noEmit`,
  `bun test`, `python3 council/validate.py`. Owner gates met in full
  regardless of change size.
- **Blast radius checked (no digest re-pin owed):** no fixture seed carries
  any `smoke/` or `test/faux-provider` file — `council/fixtures/*/seed/`
  holds each fixture's own council/test/src trees only (verified by listing;
  no `driver.py` anywhere under `council/fixtures/`), so AGENTS.md #5's
  `seed.treeDigest` machinery is untouched. `test/prose.test.ts` pins
  `council.md` procedure prose — this card touches no procedure text. The
  FLLWUP-49 shape test (`test/faux-provider-shape.test.ts`) greps
  repo-wide for `class Screen`/`class Session` and today expects exactly two
  files (`test/faux-provider/pty_kit.py`, `smoke/search-smoke/driver.py`) —
  a share that removes the driver's own definitions moves that count, which
  the shape test's expectation will have to track; noted for the
  deliberation, not decided here.
- **Rulings applied here (cited, not re-asked):** Phase-1 run-2 scope governs
  the promotion; `steward` job-1 governs the build-order position; R2 governs
  the later merge; R3 governs the promotion/record pushes (disclosed per
  [[record-push-discipline]]). No card-specific Phase-1 ruling exists beyond
  R2/R3; the orchestrator's card face itself is not a ruling seat's product,
  and its "decide whether" framing is the deliberation's to resolve.

### Step 2 — independent first pass (round 1)

Three generators dispatched in parallel on the card alone (surface-touching
full council → `designer` seated alongside `owner` + `principal`). Jobs:
`owner` `job-20.1` (7.7m, 9 turns), `principal` `job-20.2` (7.7m, 11 turns),
`designer` `job-20.3` (7.7m, 8 turns), all settled `done`. Positions appended
verbatim.

#### Position — `owner` (job-20.1)

**Position: SHARE — the card's stated coupling fear is factually wrong about `pty_kit.py`; a full collapse is safe with additive kit params, and the one real cost (env semantics) is validated by a mandatory one-time smoke run**

The card's question, answered with tree evidence:

**CAN the driver import the shared kit without coupling the release gate to the dev-installed pi? YES.** Three verified facts:

1. **`pty_kit.py` carries zero pi coupling** (`test/faux-provider/pty_kit.py:8-19`): it imports only `fcntl, json, os, pty, re, select, struct, termios, time` — pure stdlib. The `import.meta.resolve` of the dev-installed pi lives in `test/faux-provider/harness.ts:30-32`, which `driver.py` would **not** import. The card's phrasing "a `test/` module that resolves the dev-installed pi" conflates the directory with the harness. What the share actually creates is a **path dependency** (`driver.py → test/faux-provider/pty_kit.py`), not a pi coupling.
2. **The Docker container can see `test/`.** `smoke/run.sh` bind-mounts the whole repo (`-v "$REPO_ROOT:/pkg"`), `smoke/driver.sh:124` runs `bash "$PKG/smoke/search-smoke/run.sh"`, whose `REPO_ROOT` resolves to `/pkg`, and step 5 executes `python3 -B "$REPO_ROOT/smoke/search-smoke/driver.py"` — so `../../test/faux-provider/pty_kit.py` = `/pkg/test/faux-provider/pty_kit.py` exists in-container. Host path is symmetric. Also verified: `pi install -l "$REPO_ROOT"` pins the fixture worktree, but the driver is always executed from `$REPO_ROOT` itself — the import surface has exactly one copy in both paths.
3. **The two `Screen`s are byte-identical in executable logic.** A mechanical diff (run, not recalled) shows the kit/driver `feed`/`_csi`/`lines` bodies differ only in comments and the kit's extra `text()`; the driver's copy already carries the O2 relative-left `D` fix. The demonstrated cost of keeping a second copy is exactly the O2 drift class — nothing pins the smoke copy against future drift.

**The `Session`s are genuinely different — four deltas, all param-expressible without changing existing consumers** (`tui-retry.py:98` and `ev41-tui.py:86` call `Session(argv, work_dir, home, env_extra, path)` positionally):

| Delta | Kit | Driver | Resolution |
|---|---|---|---|
| Geometry | 24×80 hardcoded | 28×80 (assertion-bearing: the clip behavior at 28 rows IS frames 2–8) | `rows=ROWS, cols=COLS` params; TIOCSWINSZ + `Screen(rows, cols)` use them |
| Byte checkpointing | disk bytelog only | in-memory `buf` + `mark()` (load-bearing for frame artifacts and `extract_ids_from_bytes`) | additive `self.buf` in `_feed` + `mark()`; bytelog unchanged |
| Teardown | SIGKILL(9) | SIGTERM(15) | `term_sig=9` param |
| Env | explicit allowlist (FLLWUP-21 lesson) | ambient minus council vars | driver passes `env_extra={"OPENROUTER_API_KEY": …}`; council vars are never inherited under the kit's explicit env — **strictly stronger** than the driver's defensive pop |

Two residual mismatches the plan must handle: (a) `wait_stable` defaults differ (kit 6/0.1/15.0 vs driver 3/0.08/8.0) — driver call sites pass its values explicitly to preserve frame timing; (b) `respond_queries` sources differ (kit: last 8 KB of disk bytelog; driver: full in-memory `buf`) — with `buf` added, kit's `respond_queries` should prefer `self.buf` (a strict superset of the disk tail; kit consumers never `mark()`, so their behavior only widens the scan window, same reply). The driver calls it once at boot before any `mark()`, so behavior is preserved exactly.

What changes, file by file:

1. **`test/faux-provider/pty_kit.py`** — additive only: `rows/cols/term_sig` params (defaults 24/80/9 preserve both existing runners bit-for-bit), `buf`+`mark()`, `respond_queries` prefers in-memory bytes. Covered by the existing bun-test live arms.
2. **`smoke/search-smoke/driver.py`** — delete `class Screen` (~90 lines) and `class Session` (~120 lines); `sys.path.insert` two dirs up + `from pty_kit import Screen, Session, CSI_RE, OSC_RE`; construct `Session(..., rows=28, cols=80, term_sig=15, env_extra={"OPENROUTER_API_KEY": …})` with a `bytes.log` bytelog under the artifact dir. **Keep**: the byte table, `dechrome`/`model_rows`/matchers/walk/Framelog (driver-specific assertion logic — never kit material).
3. **`smoke/search-smoke/README.md`** — amend (Environment section) the claim to exactly:
   > `- driver.py imports python3 stdlib plus exactly one repo module — the shared stdlib-only pty substrate test/faux-provider/pty_kit.py (Screen, Session, the ANSI regexes). Neither module imports any pi/extension module (greppable claim: grep -nE '^(import|from)' smoke/search-smoke/driver.py test/faux-provider/pty_kit.py). The byte table, the frame matchers, and the session policy (28×80 winsize, checkpoint-byte mark(), SIGTERM teardown, OPENROUTER_API_KEY pass-through) are authored in the driver; the screen parser is shared with the faux-provider kit so the O2 drift class cannot recur.`
4. **`driver.py` module docstring** — same amendment (it repeats "stdlib ONLY … authored here").
5. **`test/faux-provider-shape.test.ts`** — current test 4 scans `test/` only (the card's "repo-wide" phrasing is imprecise) and **stays green either way**; add a test asserting `smoke/search-smoke/driver.py` contains no `^class Screen`/`^class Session` and imports `pty_kit`, with the scope comment updated to note FLLWUP-55 extends the charter to `smoke/`. This is the red-at-base falsifier: at `0b85fd7` (the pre-mechanism base, i.e. current HEAD) it reds with per-failure text naming the driver's own `class Screen`/`class Session` — mechanism-absent, copy-set clean (transplant = the amended witness file alone); at head, `0 fail`.

Gate set: `bash council/preflight.sh FLLWUP-55`, `bunx tsc --noEmit`, `bun test` (≈94s envelope per [[test-suite-budget]]), `python3 council/validate.py` — the standard four. Card-specific probes: (1) red-base record for the witness extension via `bun test test/faux-provider-shape.test.ts` (cheap, both halves); (2) a 5-second container import probe — `docker run --rm -v "$PWD:/pkg" node:24-bookworm python3 -c "import sys; sys.path.insert(0,'/pkg/test/faux-provider'); import pty_kit; print(pty_kit.Screen)"` — proves the mount contract without the full harness; (3) **one host smoke run** `bash smoke/search-smoke/run.sh` (~5–10 min, network: npm install of pinned 0.84.3). Per [[smoke-test]], the smoke is the live-path falsifier, **not a CI gate** — it is a mandatory once-per-card probe here because the env-semantics delta has no other falsifier. Docker `SMOKE_PHASE=6` is optional belt-and-suspenders given probe (2).

Tradeoffs accepted: the env-semantics delta (ambient → explicit allowlist) is the one change only the smoke run can validate — a mandatory 5–10 min network-touching probe for this card rather than a permanent fourth copy of a parser that already drifted once (O2). Kit API growth (three params + `mark`) for one new consumer — accepted because all additions are default-preserving and defensible session primitives; the alternative (Screen-only share) leaves a permanent `Session` residual the steward explicitly declined to accept permanently. The witness charter change (test/-only → includes smoke/) is an explicit amendment FLLWUP-49's record must see named.

Blind spots: the smoke and Docker probe were not executed in this read-only pass — the mount contract is read from `smoke/run.sh`, not exercised. The `respond_queries` bytes-source switch is subtle; it should land with a test. Kit-default `wait_stable` timing is asserted-equivalent, not measured.

**Testable claims**: (1) `pty_kit.py` imports only stdlib — `grep -nE '^(import|from)' test/faux-provider/pty_kit.py` names no non-stdlib module; (2) `/pkg/test/faux-provider/pty_kit.py` imports inside the Docker mount contract — probe (2); (3) at base the extended witness reds naming the driver's own classes, at head `0 fail` — `bun test test/faux-provider-shape.test.ts` at both SHAs; (4) both kit consumers unchanged in behavior — the existing bun-test live arms stay green; (5) the nine frames stay green after the collapse — probe (3).

Wiki used: [[smoke-test]], [[test-suite-budget]], [[red-base-evidence]].

#### Position — `principal` (job-20.2)

## Cross-seam reading — what the contract actually is at HEAD

**Two pty models, and they are not the same kind of object.** `test/faux-provider/pty_kit.py` defines `class Screen:33` and `class Session:119`; `smoke/search-smoke/driver.py` defines `class Screen:66` and `class Session:265`.

- **The `Screen` halves are already semantically identical.** Both `D` clauses are relative-left (`pty_kit.py:92-94`; `driver.py:143-145`), both `K`/`J`/`G`/CUP/UTF-8/OSC handling match, both expose `lines()`. The only deltas are the default `ROWS` (24 vs 28 — both constructors take `rows, cols`, `pty_kit.py:36`) and the kit's extra `text()`. Sharing `Screen` is a zero-behavior-change refactor.
- **The `Session` halves differ on four policy axes**, not incidentally: env construction (driver `dict(os.environ)` minus council vars + key, `driver.py:272-277`; kit explicit `{PATH,HOME,TERM}` + `env_extra`, `pty_kit.py:132-135`), kill signal (driver SIGTERM 15, `driver.py:348`; kit SIGKILL 9, `pty_kit.py:190`), `wait_stable` defaults (driver `3/0.08/8.0`, `driver.py:313`; kit `6/0.1/15.0`, `pty_kit.py:171`), and byte retention (driver in-memory `buf`/`mark()`; kit bytelog file + `poll`). `driver.py:271`'s `self.outdir` is vestigial.

**The card's coupling premise is misattributed.** The dev-installed-pi resolver is `test/faux-provider/harness.ts:26` (`import.meta.resolve("@earendil-works/pi-coding-agent")`), a TS file. `pty_kit.py:17-25` imports only `fcntl/json/os/pty/re/select/struct/termios/time`. Importing `pty_kit.py` resolves no pi. The card describes `harness.ts`.

**The shape test is `test/`-scoped, not repo-wide.** `test/faux-provider-shape.test.ts:33` sets `TEST_DIR = join(REPO_ROOT,"test")`; test 4 (`:70-71`) counts `^class Screen`/`^class Session` under that root only, and its own header (`:9-11`) names `smoke/search-smoke/driver.py` the out-of-universe residual. Removing the driver's definitions does **not** move it — the card's parenthetical is inverted.

**Docker visibility is not a blocker (read-derived, not run).** `smoke/run.sh:30` bind-mounts `-v "$REPO_ROOT:/pkg"`; `smoke/driver.sh` phase 6 runs `bash "$PKG/smoke/search-smoke/run.sh"`; that script computes `REPO_ROOT` from its own path and invokes `python3 -B "$REPO_ROOT/smoke/search-smoke/driver.py"`; `smoke/Dockerfile` installs `python3`. `/pkg/test/faux-provider/pty_kit.py` is visible and importable on both the host and container paths.

**The boundary is not stated anywhere authoritative.** README pins "python3 stdlib only … no pi/extension module" (`smoke/search-smoke/README.md:114-116`) — nothing about `test/`. `vault/wiki/smoke-test.md` calls search-smoke a sibling; `smoke/driver.sh` phase-6's "imports nothing from this container's pi" is about pi. The "smoke/ → test/ layering inversion" exists only as a seat tradeoff (FLLWUP-49 principal round-1) and the steward's explicit "a scoping decision matching O4, not a permanent portfolio acceptance" — which leaves it open, not prohibited.

**Reframe.** The card's unit of decision is wrong: "the shared pty screen model" is two artifacts with different coupling profiles. `Screen` is pure and pi-version-independent, and already converged — the tree **forces** sharing it; there is no cost to weigh. `Session` owns fork/env/teardown/quiescence policy. Sharing it **changes the release gate's behavior** (env inheritance → explicit isolation, SIGTERM → SIGKILL, tighter → looser quiescence). That is a values call, not a forced move. The card's stated reason to hesitate (dev-pi coupling) is **void**; the Docker path is a non-blocker; and the boundary it appeals to is undocumented.

**Recommendation: share both.** `Screen` is free. `Session`'s four deltas are the FLLWUP-21-hardened explicit-env isolation — exactly what a release gate wants — and they are settled by the live smoke re-run this card already owes (`bash smoke/search-smoke/run.sh` on host and `SMOKE_PHASE=6 bash smoke/run.sh` in Docker). **Fallback if the goal's primary clause is read strictly and no amendment is available:** share `Screen`, keep the driver's `Session`, record the divergence — but then the goal's "class Session" clause is unmet literally and needs a reading. **If no-share is chosen:** the rationale must be the *correct* one (release-gate dependency direction), not the false dev-pi premise.

Files and claims that change: `driver.py` (delete `class Screen` `:66-~180`; `sys.path`-insert `REPO_ROOT/test/faux-provider`; `Screen()` → `Screen(ROWS, COLS)`; construct `pty_kit.Session([pi_bin], work_dir, home, {"OPENROUTER_API_KEY": …}, bytelog_path)`; driver-local offset-based `mark()`; keep `Framelog`, `content_lines`, `dechrome`, `sanitize_line`, matchers; docstring `:12-14` amended). `README.md:114-116` — exact replacement (share):
> - `driver.py` imports only python3 stdlib modules plus the repo's shared stdlib pty screen model (`test/faux-provider/pty_kit.py` — `Screen` and `Session`) — no pi/extension module, no third-party package (greppable claim). The byte table, the frame assertions, and the frame/query helpers are authored in the driver; the 28×80 screen model and the pty session machinery are the shared kit's (FLLWUP-55).

Exact replacement (no-share):
> - `driver.py` imports **python3 stdlib only** (`pty`, `fcntl`, `termios`, `select`, `re`, `struct`) — no pi/extension module (greppable claim). The screen model and the byte table are authored in the driver, deliberately: the release gate runs against a pinned external pi 0.84.3 and does not depend on the `test/` harness tree (FLLWUP-55 rationale).

`test/faux-provider-shape.test.ts`: widen the `^class Screen`/`^class Session` count root from `TEST_DIR` to `REPO_ROOT` (now exactly one, `pty_kit.py`); update the header comment (`:9-11`). Keep provider-extension/headless-runner assertions `test/`-scoped. `smoke/driver.sh` phase-6 comment: optionally note the shared-kit import. No `council/cards/**` or `vault/**` write; the `smoke-test.md` update is a step-14 ingest offer.

Testable claims: (1) premise greps — stdlib only / resolver at `harness.ts:26`; (2) shape-test scope `TEST_DIR` → `test/`; (3) Screen identity — feed `ESC[10;20H ESC[5D ESC[2K` + `é` + `ESC[2J` into both, `lines()` identical; (4) Session divergence — the four axes; (5) Docker visibility (NOT RUN — read-derived): container import probe → `24`; (6) release gate green after: `bash smoke/search-smoke/run.sh` → `SMOKE PASS`; `SMOKE_PHASE=6 bash smoke/run.sh` → `SMOKE PASS — phase 6`; (7) README claim grep; (8) shape test after — exactly one file.

Tradeoffs accepted: adopting the kit's explicit env drops ambient inheritance on the host path (declared, gate-verified); the kit's `wait_stable` defaults slow each checkpoint by ~0.3s; the offset-based `mark()` is new driver code; widening the shape test touches a Done card's witness. Blind spot: no shell — Docker probe and live gate unexecuted.

#### Position — `designer` (job-20.3)

**Design position: NO-SHARE (recommended).** The release-gate smoke keeps its own `class Screen`/`class Session`, and the README's `114-116` claim is amended to *name* the residual it carries, not to deny it. The reason is layering, not coupling-today: the smoke is a release-gate runner that installs a **pinned external pi 0.84.3** into a scratch prefix (`run.sh:54-62`, `smoke/Dockerfile:11`) and runs against *that* binary. A `smoke/ → test/` import inverts that boundary; the kit is stdlib-only at HEAD (`pty_kit.py:13-22`), so the *practical* coupling is zero today, but the *philosophical* coupling is real: the smoke stops being self-contained and starts depending on a module the smoke is supposed to help verify. The FLLWUP-49 record explicitly named this residual "a scoping decision matching O4, not a permanent portfolio acceptance" — open, not prohibited. Under no-share the deliverable is: (1) recorded rationale; (2) an amended README claim that keeps both greppable lines **true** and names the kit and the layering argument.

**Gulf closed — evaluation gulf, for the reader at the keyboard:** a person reading the README and running/replaying the smoke must be able to tell where the screen model lives at a glance; at HEAD the grep "authored in the driver" is a one-grep verification. **Execution gulf, for the contributor who later edits the kit:** under no-share a non-stdlib import added to `pty_kit.py` never silently lands in the smoke; under share it does, and "remember the smoke" becomes contributor discipline — knowledge in the head, not knowledge in the world.

**Principle: signifier and knowledge-in-the-world; layering as conceptual model; greppable claims as forcing functions.** The README claim is a greppable contract; the design's job is to keep the signifier and the code in lockstep. The smoke answers "does this package work in a real pinned pi session?"; the kit helps the unit suite answer "does the engine logic do what it says?". A share falsifies the second greppable claim and weakens the discipline.

**Wording drafts (exact, both branches):**

Branch (b) — No-share (recommended), README `:114-116` replace:
> - `driver.py` imports **python3 stdlib only** (`pty`, `fcntl`, `termios`,
>   `select`, `re`, `struct`) — no pi/extension module (greppable claim). The
>   screen model and the byte table are authored in the driver. A shared pty
>   screen model lives at `test/faux-provider/pty_kit.py` (one source of
>   truth across the test suite, FLLWUP-49); this driver does not import it.
>   `smoke/ → test/` would couple the release gate to a module the smoke is
>   verifying — the kit is stdlib-only at HEAD, but the boundary is
>   deliberate, not forced.

Driver docstring `:13-16` replace:
> python3 stdlib ONLY (pty, fcntl, termios, select, struct, re) — no pi/extension
> module is imported (testable claim 4). The screen model and the byte table are
> authored here. A shared kit at `test/faux-provider/pty_kit.py` exists; this
> driver does not import it (smoke → test is a deliberate layering inversion;
> the kit is stdlib-only today, the smoke stays self-contained).

Branch (a) — Share (admissible, not recommended), README `:114-116` replace:
> - `driver.py` imports **python3 stdlib only** (`pty`, `fcntl`, `termios`,
>   `select`, `re`, `struct`, `sys`, `os.path` — `sys`/`os.path` for the
>   `test/faux-provider/` path shim) — no pi/extension module is imported
>   (greppable claim; verified by `grep -E "^import " smoke/search-smoke/driver.py`
>   returning only stdlib identifiers). The screen model and the session
>   lifecycle are imported from `test/faux-provider/pty_kit.py` (one source
>   of truth across the test suite and the release gate); the byte table, the
>   modal-chrome stripping, and the model-id derivation are authored in the
>   driver. The kit is stdlib-only at HEAD (`grep -E "^import "
>   test/faux-provider/pty_kit.py` returns only stdlib identifiers); the
>   `smoke/ → test/` import is a deliberate layering inversion, held open by
>   a grep witness on the kit's import list — if the kit gains a non-stdlib
>   import, the smoke's release-gate independence breaks and the witness
>   fails.

Driver docstring `:13-16` replace:
> python3 stdlib ONLY at the smoke boundary — `sys` and `os.path` are stdlib
> and are used solely to put `test/faux-provider/` on the import path. The
> screen model and the session lifecycle are imported from
> `test/faux-provider/pty_kit.py` (one source of truth, FLLWUP-49); the byte
> table, the modal-chrome stripping, and the model-id derivation are authored
> here. No pi/extension module is imported (testable claim 4). The kit is
> stdlib-only at HEAD and a grep witness on its import list keeps it so;
> `smoke/ → test/` is a deliberate layering inversion.

**Comprehension contracts:** no-share keeps the one-grep property (`grep "authored in the driver"` → true claim; `grep "^class Screen" driver.py` → the definition), unchanged replay and smoke runs, and the why-not-imported answer in the README. Share loses the one-grep literal (the claim the README asks the reader to grep no longer exists), adds a `sys.path` shim, and moves the boundary witness to two greps plus a witness-on-the-kit discipline.

**Falsifiable predictions (per branch):** no-share — (1) greping "authored in the driver" after amendment yields a true claim naming the kit and the boundary; (2) a later non-stdlib kit import does not break the smoke; (3) the Docker path runs green with no shim; (4) the shape test still names driver.py the pinned residual. Share — (1) the old greppable literal lies unless amended (wording must distinguish driver-authored vs kit-imported); (2) Docker green requires the shim; (3) kit non-stdlib import breaks release-gate independence unless a grep witness exists; (4) the shape test's expected count moves 2 → 1 in lockstep.

**Tradeoffs accepted:** one extra `class Screen` definition in the smoke forever (the cost of self-containment; shape test pins it as a known residual); smoke `Session` divergence from the kit's is the same drift shape that motivated FLLWUP-49, but contained in one file with one greppable claim, and the smoke lives under `smoke/` where the shape test does not reach.

**Blind spots:** cannot run the smoke; the coupling argument was originally about the TS runner, not the py kit — the layering argument is *philosophical*, not *mechanical*; has not read EV-41/42/43 card bodies end-to-end; the shape test's 2-file expectation is a current contract either branch must track in lockstep.

### Step 3 — bounded exchange (round 2)

Re-dispatched each generator with the others' round-1 positions. Jobs:
`designer` `job-20.6` (15.5m, 2 turns, `done`); `owner` `job-20.4` (timed out
at 15.5m, 9 turns, `stopReason=toolUse`, no position delivered — cancelled per
the dispatch discipline and re-dispatched once); `principal` `job-20.5`
(15.5m, 13 turns, `stopReason=error` — provider error mid-turn, no substantive
position delivered — re-dispatched once). The re-dispatches receive
`designer`'s round-2 position below.

#### Round 2 — `designer` (job-20.6)

**Design position — concede to SHARE, conditioned on a witness test.** I withdraw the no-share recommendation. Round-1 evidence settles the mechanical questions: the kit carries no pi coupling (`harness.ts:26` is the resolver; `pty_kit.py:13-22` is stdlib-only), the Docker path sees `test/` (`smoke/run.sh:30` bind-mounts `$REPO_ROOT:/pkg`), the boundary I appealed to is documented nowhere authoritative, and the O2 drift class the steward named as residual is exactly what the second copy produced. My layering argument — "smoke → test/ is the wrong direction" — is a preference about who maintains what, not a principle that holds against a demonstrated maintenance cost. The right way to settle my execution-gulf concern is not to refuse the share but to install a **forcing function** that holds the kit stdlib-only in the gate.

**Gulf closed — execution gulf, for the contributor who later edits the kit.** Under no-share, a non-stdlib import added to `pty_kit.py` is silently fine for the smoke because the smoke doesn't import the kit. Under share-without-witness, the same import silently lands in the release gate's import surface. Under share-with-witness, that import breaks `test/faux-provider-shape.test.ts` (or a sibling) before the smoke ever runs. The witness moves "remember the smoke" from contributor discipline (knowledge in the head) to a gate-enforced property (knowledge in the world).

**Principle and evidence.** The instrument is the **forcing function**, not the README claim. Owner's drafted README wording asserts a greppable claim — that is a *signifier pointed at a grep the reader can run*, not a guarantee the gate enforces. The guarantee needs a test. Where it must live: extend `test/faux-provider-shape.test.ts` with an assertion that `test/faux-provider/pty_kit.py` contains zero non-stdlib `import`/`from` lines. The assertion must be **red-at-base with per-failure text naming the offending import** and **green at head** — the same red-base record discipline owner proposed for the smoke-shape assertion, applied to the kit-side of the share.

**Comprehension contracts under owner's drafted wording:** my round-1 "one-grep loss" claim is too literal. The reader's grep property is preserved, just pointed at a different literal. What the reader genuinely loses is the signifier "authored in the driver" as a unit-of-self-containment cue. What they gain is a richer prose contract naming what stays driver-authored (byte table, frame assertions, session policy: 28×80, `mark()`, SIGTERM, `OPENROUTER_API_KEY` pass-through) and what becomes shared (the screen parser). Net: more informative for a reader who already knows the kit; higher first-pass friction for a first-time reader.

**Wording — drafted-share vs. my round-1 share wording.** Their drafted wording (owner) serves the reader better than mine. Mine carries a defensive hedge which ages as documentation debt; theirs is a positive claim. The session-policy enumeration is the strongest single piece of the wording. **The wording is open judgment.** No test can settle prose; what a test can settle is the underlying claim the prose asserts. The drafted strings escalate to a copy ruling either way — flagged, not relitigated here.

**Falsifiable predictions.** (1) At base the extended witness test reds naming the driver's own `class Screen`/`class Session`; at head, `0 fail`. (2) After the share, the witness reports `^class Screen` count = 1 and `^class Session` count = 1 (kit only); before, both are 2. (3) Inside the Docker mount, the import probe prints the class. (4) The owed `bash smoke/search-smoke/run.sh` re-run returns `SMOKE PASS` after the share — the live-path falsifier for the four Session-policy axes. (5) A later PR that adds `import requests` to `pty_kit.py` fails the witness test in CI with a message naming the offending line — the layering argument translated from contributor-discipline into a CI signal.

**Tradeoffs accepted.** Conceding no-share gives up the philosophical self-containment of the smoke in exchange for closing the O2 drift class for both `Screen` and `Session`. The env-semantics delta (ambient-minus-council-vars → explicit `{PATH, HOME, TERM, env_extra}`) is strictly stronger isolation and is validated by the live smoke re-run.

**Concessions from round 1.** (a) The layering argument was philosophical, not mechanical. (b) The one-grep property is reframed, not lost. (c) Their drafted wording is the cleaner copy. (d) The right forcing function is a CI test, not a README hedge.

**Defenses from round 1.** (a) The execution-gulf concern was correct in mechanism; closed by the witness test, not by refusing the share. (b) The card's framing of `pty_kit.py` as resolving dev-installed pi was misattributed. (c) The boundary is undocumented; FLLWUP-49's residual language leaves the question open.

**Preferences, ranked last.** A small retained preference for the *middle* position (share `Screen`, keep `Session`), dominated by the simplicity argument and by the kit's `env_extra` policy being *strictly stronger* isolation. If the live smoke re-run reveals that the env isolation breaks something, the position reverts to the middle. That is a falsifiable commitment, not a hedge.

#### Round 2 — `owner` (job-20.7, attempt 2)

**Approach.** Converged: SHARE both classes, with one correction to `designer`'s condition and one convergence toward `principal`'s witness shape. Verified at HEAD (`a902a84`, which *is* this card's pre-mechanism base — the driver still carries `class Screen:66`/`class Session:265`): `pty_kit.py:13-21` imports exactly nine stdlib modules and nothing else; `test/faux-provider-shape.test.ts` test 4 scans `TEST_DIR` only and expects **exactly one** `^class Screen`/`^class Session`, both `pty_kit.py` — so the step-1 "expects exactly two files" parenthetical was wrong and `principal`'s round-1 correction stands.

**1. `designer`'s condition — accepted, with the red-base attribution corrected.** The kit-stdlib-only witness belongs in `test/faux-provider-shape.test.ts` (new test: extract every `^(import|from)` line from `pty_kit.py`, assert each top-level module is in a stdlib allowlist, failure text names the offending line — strongest form is an exact expected-set assertion `{fcntl,json,os,pty,re,select,struct,termios,time}`). But it **cannot be red-at-base**: the kit is *already* stdlib-only at base, so this assertion is green-at-base/green-at-head. It is a **charter pin** (the forcing function closing `designer`'s execution gulf), not a mechanism falsifier; its failure mode is provable by one-line mutation in a `/tmp` copy. The red-at-base obligation transfers to the driver-side assertion.

**2. Converged shape — my kit params + `principal`'s witness root.** Two merges, one hold:
- **Adopt `principal`'s REPO_ROOT-wide test-4 root** over my separate driver-side test: widen test 4's count root `TEST_DIR → REPO_ROOT`, expectation stays *exactly one* of each class, at `pty_kit.py`. One assertion that both extends the charter to `smoke/` and is the red-at-base falsifier — at base the driver's own classes make the count 2 ≠ 1, naming `smoke/search-smoke/driver.py` — mechanism-absent, transplant = the amended witness file alone.
- **Hold my additive kit shape over `principal`'s driver-local offset `mark()`.** A driver-local offset mark duplicates the checkpoint machinery in the driver — exactly the second-copy drift surface this card exists to delete. In-kit `buf`/`mark()` + `respond_queries`-prefers-buf is one implementation, default-preserving (kit consumers never `mark()`, so the buf-preference only widens the scan window over a strict superset of the disk tail — same reply). Land with a buffered-bytes-equivalence test.
- **Charter effects:** test 4's header comment (`:9-11`) must be amended to record the FLLWUP-55 extension — a named amendment to FLLWUP-49's witness charter the step-14 record carries. Provider-extension/headless-runner assertions (tests 2/3) stay `test/`-scoped.

**3. The owed smoke re-run.** **Owner runs `bash smoke/search-smoke/run.sh` at step 8** — the live-path falsifier for the four Session-policy deltas; the env-semantics change has no other falsifier; a mandatory once-per-card probe, not a CI gate. Skeptic at step 9 audits the record, does not re-pay the ~5–10 min network run unless the record is deficient. Green proves the explicit env isolation, `term_sig=15`, 28×80 geometry, and `buf`/`mark()` checkpointing hold against the pinned external pi 0.84.3. Instability triggers `designer`'s ranked-last revert to the middle position (share `Screen`, keep `Session`).

**Tradeoffs accepted.** I give up my separate driver-side witness test for `principal`'s single widened-root assertion (same property, one fewer test). The witness charter of a Done card (FLLWUP-49) is amended — named, not silent. The stdlib witness being green-at-base means the red-base record covers one falsifier, not two — inventing a fake red for a charter pin would be an artificial transplant, not evidence.

**Testable claims.** (1) Kit stdlib-only at base — nine `import` lines, all stdlib, at `a902a84` (run). (2) Red-at-base falsifier: widened test 4 at base → count 2 ≠ 1 naming `driver.py`'s classes; at head `0 fail`. (3) Kit-consumer preservation: `bun test` live arms green with defaulted params; buffered-bytes equivalence test green. (4) Smoke re-run at step 8 → `SMOKE PASS`, else the middle-position revert triggers.

**Still open after this round.** (a) the README/docstring copy — open judgment, escalates to a copy ruling regardless; (b) the smoke re-run outcome — empirical, settles at step 8 and gates `designer`'s revert. The design itself is converged; no test-settled question remains between the three seats.

#### Round 2 — `principal` (job-20.8, attempt 2)

Evidence labels: **[read]** = read/grep/ls at HEAD `a902a84`; **[run]** = none (read-only toolset).

**Cross-seam reading.** The seam is `pty_kit.py`'s `Session` against its **three** consumers. `tui-retry.py:98` and `ev41-tui.py:86` both call `Session(argv, work_dir, home, env_extra, bytelog_path)` **positionally**, call `respond_queries()` **once at boot**, and **never call `mark()`**. Kit `Session.__init__` hardcodes `ROWS, COLS` (`pty_kit.py:119-140`), kills with `9` (`:190`), and `respond_queries` scans the **last 8 KB** of the bytelog (`:180-188`). `_feed` (`:151-154`) is on the consumers' hot path. `test/faux-provider-shape.test.ts:33,70-75`: test 4's root is `TEST_DIR`, expects **exactly one** file (`pty_kit.py`).

**Blind spots.** Owner's slice: treats `buf`/`mark()`/`respond_queries`-prefers-buf as "additive, default-preserving" — true from inside `driver.py`'s needs; false from inside the kit's *other* consumers, because `_feed` and `respond_queries` are their executed code too. Designer's slice: bundles a *green-at-base* guard into the same "red-at-base" claim as the driver-shape falsifier — under [[red-base evidence]] they are two different records. My round-1 blind spot: I proposed widening test 4's root to `REPO_ROOT` without checking what the gitignore-blind `filesUnder` walk reaches.

**1. `designer`'s witness — accept, reclassified; count-root reconciled.**
- **Accept** the stdlib-only kit assertion — as a **guard, not the FLLWUP-55 falsifier** (green at base and head; reds only on future drift). Implement it **two-sided** (mirror the FLLWUP-48 `__pycache__` sub-describe): real kit green + a synthetic scratch file containing `import requests` reds — the checker is itself tested. The red-at-base falsifier is the **driver-shape** assertion.
- **I withdraw the `REPO_ROOT` widening; adopt owner's leave-test-4-scoped + new driver assertion.** `filesUnder` walks with `readdirSync` and excludes only `__pycache__` + the witness, so a `REPO_ROOT` root descends into `.worktrees/` and `.pi/`. `.worktrees/fllwup-49/test/faux-provider/pty_kit.py` **exists right now** — a `REPO_ROOT` count is ≥2 on every developer checkout, green in CI (no worktrees): the worst witness property (locally-trained-to-ignore).
- **Charter effect**: owner's leave-scoped shape is charter-faithful — test 4's universe stays `test/` (FLLWUP-49's declared universe); the new assertion extends the charter to `smoke/`, named in the header. Widening to `REPO_ROOT` would make FLLWUP-49's own universe claim false inside its own test.
- **One strengthening**: `^class Screen`/`^class Session` alone misses a subclass. Add a ban on screen internals (`def feed(`, `def _csi(`) or `class .*Screen` — otherwise `class SmokeSession(Session)` can re-grow a private model invisibly.

**2. Implementation deltas vs owner — my shape wins on consumer-invariance.**
- **Accept `rows=24, cols=80, term_sig=9` params** — defaults reproduce `ROWS/COLS` and `9` exactly; both existing consumers construct and execute **bit-identically**.
- **Reject `buf`/`mark()` in the kit and `respond_queries`-prefers-buf, as the default.** `_feed` is on the consumers' hot path, so `self.buf += d` gives the two **non-marking** consumers unbounded memory growth for the whole session, and the `respond_queries` source switch changes their executed behavior — verified only by gated arms (`ev41-retry-e2e.test.ts:338` spawns `ev41-tui.py`). The driver's checkpoint needs are served from the bytelog the kit **already writes and flushes** (`_feed`), so `mark()` = offset slice of `bytelog_path`, and the driver's full-boot query scan reads the same file. **Zero kit growth for `buf`; both consumers' executed code untouched.**
- **Effects**: `tui-retry.py`, `ev41-tui.py` — **no change at all**. `driver.py` — `rows=28, cols=80, term_sig=15, env_extra={"OPENROUTER_API_KEY": …}` plus a small bytelog-offset `mark()`/query-scan layer.
- **If owner wants in-kit `buf`/`mark()` for reuse**, the constraint: `respond_queries` keeps a bounded source (disk) or scans the whole bytelog, never `self.buf`; and the unbounded `buf` is named as a new contract on the non-marking consumers.
- **Cross-seam correction to owner's risk attribution**: the env-semantics delta is **not** "the one change only the smoke can validate" — `ev41-tui.py`/`tui-retry.py` already run a real pi TUI under the kit's explicit env with green arms, so env isolation is pre-validated. The smoke's unique falsification value is the **28×80 geometry, SIGTERM teardown, and `wait_stable` timing against the pinned external 0.84.3 binary**.

**3. The owed smoke re-run.** `owner` runs it (implementer's gate set), on the changed tree before merge. Command: `bash smoke/search-smoke/run.sh` on the host (~5–10 min, network); `SMOKE_PHASE=6 bash smoke/run.sh` optional. Green proves the pinned external pi boots under the kit's explicit env, query answers land, the 28×80 param is honored, frames match, teardown works. Red proves one of the four Session-policy axes broke the gate → revert to designer's retained middle position. Not a CI gate ([[smoke-test]]); the mandatory once-per-card live probe.

**4. Concessions, defenses, what's still open.** Concessions: (a) `REPO_ROOT` widening — withdrawn, falsified by `.worktrees/` residue; (b) designer's stdlib-only witness — accepted, reclassified as guard, made two-sided; (c) `rows/cols/term_sig` — accepted; (d) `owner`'s README wording is the cleaner copy; wording is open judgment and escalates to a copy ruling regardless. Defenses: (a) the step-1 "repo-wide, two files" premise is wrong on both counts; (b) `respond_queries`-prefers-buf is not default-preserving for the two existing consumers; (c) the dev-pi coupling premise was misattributed to `pty_kit.py`; `harness.ts:26` holds the resolver. **Open — test-settled**: the mark shape (offset-vs-in-kit-buf, distinguished by T3), smoke green/red, post-change counts. **Open — judgment**: README/docstring wording only.

**Testable claims.** T1 (red-at-base falsifier): at base the witness reds naming `driver.py`'s `class Screen:66`/`class Session:265`; at head `0 fail`. T2 (kit guard, green both): two-sided — real `pty_kit.py` zero non-stdlib `^(import|from)` lines; the checker reds on a scratch file with `import requests`. T3 (consumer invariance / distinguishing test): `pty_kit.Session` exposes **no `buf` attribute**, and `git diff` for `tui-retry.py` + `ev41-tui.py` is empty after the change. T4 (witness scope): after the change `countMatches(TEST_DIR, /^class Screen/m) == 1`; curated `test/ + smoke/` count `== 1`; a `REPO_ROOT` count `≥ 2` (worktree residue). T5 (live): `bash smoke/search-smoke/run.sh` → `SMOKE PASS`.

Wiki used: [[smoke-test]], [[red-base evidence]], [[test-suite-budget]].

#### Round 3 — `owner` (job-20.9)

Grounded at HEAD (`pty_kit.py:119-203`, `driver.py:265-348` read before ruling). **Conceding — `principal` is right on both facts.**

**The mark shape: concede to `principal`'s bytelog-offset `mark()`.** The memory-growth fact survives the code check: `_feed` (`pty_kit.py:151-154`) is called from `poll()`/`wait_stable()` on every read for both non-marking consumers; neither `tui-retry.py` nor `ev41-tui.py` ever calls `mark()`, so `self.buf += d` is unbounded accumulation for the whole session — and worse than priced: CPython has no `+=` optimization for `bytes`, so it is quadratic copying on top of unbounded retention. The `respond_queries`-prefers-buf objection also holds: the disk tail is the last 8 KB (`pty_kit.py:200-203`), the buf is the full stream, so the scan window genuinely widens — an executed-behavior change verifiable only by gated arms. And the round-2 counter ("driver-local mark duplicates the checkpoint machinery — the second-copy drift surface") does not survive grounding: the O2 drift class is *screen-parser* drift — CSI/OSC state-machine logic; the offset mark is an offset, a slice read, and a query scan (~10 lines) — driver-specific checkpoint *policy* with exactly one consumer, no divergence surface. Equivalence verified in code: every byte that entered the driver's `buf` also enters the kit's bytelog (both fed from the same `os.read`), so `bytelog[offset:size]` is byte-identical to `buf`-since-last-mark, and the boot query scan reads `bytelog[0:size]` — identical window, strictly full, not 8KB-clipped.

**Witness strengthening: accepted**, plus one symmetric completion: add `def _feed\(` to the ban list (`class .*Screen` / `def feed(` / `def _csi(`), since `_feed` is the Session-side ingest point where private byte capture would re-enter.

**Final converged design (for the spec):** `driver.py` deletes `class Screen`/`class Session`, imports `Screen, Session` from `test/faux-provider/pty_kit.py` via a two-line stdlib `sys.path` shim; the kit gains additive `rows`/`cols`/`term_sig` params (defaults 24/80/9 reproduce both existing consumers bit-identically) and **no** `buf`/`mark` — the driver implements checkpointing as a bytelog-offset layer over the kit's written-and-flushed bytelog (`mark()` = read `bytelog[offset:getsize()]`, advance offset; boot query scan = same file from offset 0), with `Session(rows=28, cols=80, term_sig=15, env_extra={"OPENROUTER_API_KEY": …}, bytelog_path=<artifact dir>/bytes.log)`; the driver keeps its byte table, `dechrome`/`model_rows`/matchers/walk/`Framelog`; `tui-retry.py` and `ev41-tui.py` receive zero diff. Witness: test 4 stays `TEST_DIR`-scoped (the `.worktrees/` falsification of the REPO_ROOT widening is accepted — my widening is withdrawn); a new driver-shape assertion extends the charter to `smoke/` (red-at-base naming `driver.py:66`/`:265`, head = exactly one of each class, `pty_kit.py` only) strengthened with the ban set; the two-sided stdlib-only guard lands as a charter pin, not a falsifier. Copy: README/docstring amended per the round-2 wording, updated to name the checkpoint layer as driver-authored — open judgment, escalates to a copy ruling. Gates: the standard four, plus one host `bash smoke/search-smoke/run.sh` at step 8 — with `principal`'s correction accepted: the smoke's unique falsification value is 28×80 geometry, SIGTERM teardown, and `wait_stable` timing against the pinned 0.84.3 (env isolation is pre-validated by the kit consumers' green arms). Red smoke triggers `designer`'s ranked-last revert to the middle position.

**Tradeoffs accepted.** The in-kit `buf`/`mark()` reuse argument is withdrawn entirely — the checkpoint primitive stays driver-local; a future second marking consumer re-implements ~10 lines rather than importing one; "mark()" as a kit-reusable concept dies with this card and a future card can re-open the kit-side question with a bounded design.

**Testable claims.** (1) Equivalence: feeding any byte stream through a kit `Session` with offset-0 `mark()` calls at the driver's mark points yields byte sequences identical to the current driver's `mark()` outputs (property test; green at head, red on reintroduced divergence). (2) T3: after the change `pty_kit.Session` has no `buf` attribute and `git diff tui-retry.py ev41-tui.py` is empty; kit `respond_queries` still reads the last-8KB disk tail. (3) T1/T2/T4/T5 stand as in `principal`'s round 2, with T4's ban set extended by `def _feed\(`.

No open design question remains between `owner` and `principal` — the delta is resolved, `principal`'s shape wins, and only the copy ruling and the step-8 empirical run remain.

#### Round 3 — `principal` (job-20.10)

(Dispatched concurrently with `owner`'s round 3; it did not see `owner`'s concession. Its constraints are compatible with `owner`'s final shape; the mark-location nuance is carried to step 4/5, not settled here.)

**Cross-seam reading (grounded at HEAD).** The kit `Session` (`pty_kit.py:122`) writes+flushes the bytelog in `_feed` (`:145-148`) and reads only its **last 8 KB** in `respond_queries` (`:196-199`); kills with `9` (`:207`), hardcodes `ROWS, COLS` (`:23,131`). Its **three** consumers: `tui-retry.py:98` and `ev41-tui.py:86` construct positionally and call `respond_queries()` **once at boot** after `drain(6.0)` — neither ever calls `mark()`. The driver is the fourth (`driver.py:265`): in-memory `buf` (`:269`), `_ingest` (`:296-297`), full-buf `respond_queries` (`:332-334`), `mark()` (`:338-340`), consumed by `assert_frame` (`:373`), boot (`:412,421`), `walk_universe` (`:620,639`).

**1. Mark shape — T3 as written does not settle it; T3′ does.** The empty-diff half of T3 is true under *both* shapes. The only distinguishing property is the **executed behavior of the kit's non-marking consumers**:

**T3′ (distinguishing, two-sided, cheap):** build a kit `Session` whose `send` is stubbed and feed a scripted stream through `_feed` — a query (`\x1b[>7u`) at offset 0 followed by >8 KB, then **never call `mark()`**, then `respond_queries()`. Assert (a) **zero replies sent** (the boot query has aged past the 8 KB window), and (b) after feeding >1 MB, **no growing byte store exists**. At HEAD both hold; under the in-kit-`buf` shape (a) sends two replies and (b) retains ~1 MB. The synthetic half reds on a scratch `buf`-bearing session, so the checker is itself tested.

Does that make the delta test-settled? Yes, *conditional on the invariant the card itself states*: "additive, default-preserving." A widened reply predicate and a session-long store are not default-preserving for consumers that never mark. **Reframe:** don't choose between driver-local and in-kit-`buf` — put `mark()` **in the kit, sourced from the bytelog the kit already writes and flushes** (`mark()` = read from a tracked offset to EOF, offset := EOF; no `buf`, `_feed` untouched, `respond_queries` left on the disk tail). The driver's boot query-reply is **driver-local policy** — it already holds `boot_raw` (`driver.py:412`) and can send `DA_REPLY`/`KITTY_REPLY` itself, exactly as wide as HEAD's full-buf scan. If in-kit `buf` is still preferred, the T3′ red must be named in the spec as a new contract on the two non-marking consumers, not as "default-preserving."

**2. Subclass-ban — final form.** The widened driver-shape assertion (scope `smoke/search-smoke/driver.py`) asserts **four** things: no `^class\s+\w*(Screen|Session)\b`; no screen internals `^\s*def (feed|_csi)\(`; `from pty_kit import` present; two-sided synthetic half (a scratch file with `class SmokeSession(Session):` and `def _csi(` reds the ban). `test/` test 4's regex and exactly-one-of-each expectation stay **untouched** (charter-faithful). The widened regex is line-anchored, so comments and strings do not false-positive. Driver.py reds at base on both counts (`:66`, `:82`, `:120`, `:265`).

**3. Converged design — confirmed as stated.** SHARE both classes; kit gains `rows=24, cols=80, term_sig=9` params and `mark()` (bytelog-sourced); witness = test 4 stays `test/`-scoped + new smoke-scoped driver-shape assertion (red-at-base) + two-sided stdlib guard + subclass/internal ban; the FLLWUP-55 charter amendment named in the witness header (`test/faux-provider-shape.test.ts:9-11`); `driver.py` keeps byte table/dechrome/matchers/`Framelog`, gains the kit import; the `REPO_ROOT` widening is dead (`.worktrees/fllwup-49/test/faux-provider/pty_kit.py` exists now — verified by `ls`); `owner` runs `bash smoke/search-smoke/run.sh` at step 8; smoke red → the middle-position revert.

**Testable claims.** T1: at base the widened driver assertion reds naming `driver.py:66/265`; at head `0 fail`. T2 (green both, two-sided). T3′ (distinguishing): non-marking kit session fed a >8KB-aged query replies **0** times and retains no growing byte store. T4: post-change `countMatches(TEST_DIR, /^class Screen/m) == 1`; curated `test/ + smoke/` == 1; `REPO_ROOT` count ≥ 2. T5 (live): `bash smoke/search-smoke/run.sh` → `SMOKE PASS`.

### Facilitator note — exchange closed at round 3 (cap reached)

The ≤3-round cap is reached; the exchange is closed. All three seats end on **SHARE** (`designer` conditionally, with its stdlib-witness + smoke-re-run conditions and a ranked-last middle-position revert). The remaining mark-location nuance — `owner`'s final design puts the ~10-line bytelog-offset mark **driver-local**, `principal`'s round-3 reframe offers a kit-side bytelog-sourced `mark()` — satisfies every stated constraint either way (no `buf`, `_feed` untouched, `respond_queries` untouched, both consumers bit-identical); it rides to step 4 (Skeptic) and step 5 (consolidator) as a design-choice item, not a live dispute. Carried open items: the README/docstring copy wording (open judgment — copy ruling), the step-8 smoke re-run (empirical, gates the middle-position revert), and the driver-local-vs-kit-side mark location. A step-1 record correction is appended below.

### Step-1 record correction (appended, not rewritten)

The step-1 blast-radius note said the FLLWUP-49 shape test greps "repo-wide … exactly two files". **Wrong on both counts, verified independently by both seats in rounds 1–2:** `test/faux-provider-shape.test.ts:33` sets `TEST_DIR = join(REPO_ROOT, "test")` and test 4 (`:70-75`) counts `^class Screen`/`^class Session` under `test/` only, expecting **exactly one** file (`pty_kit.py`) — `smoke/search-smoke/driver.py` was never counted; its header (`:9-11`) names the driver the out-of-universe residual. The facilitator correction is recorded here so the deliberation record is internally consistent; the classification conclusions (full council, surface-touching) are unaffected.
