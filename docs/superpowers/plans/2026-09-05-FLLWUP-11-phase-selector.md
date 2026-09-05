# FLLWUP-11: Smoke phase selector for the /council-models Phase 5 falsifier — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `smoke/driver.sh` accepts an environment-gated phase selector (`SMOKE_PHASE=5`) so the `/council-models` Phase 5 end-to-end smoke runs in isolation — no Phase 1–4 real-model dispatches — against a real registered command in a real session, reporting one PASS/FAIL; unset `SMOKE_PHASE` keeps the full path byte-for-byte the pre-change flow.

**Architecture:** Two changes. (1) `smoke/driver.sh`: wrap the existing Phase 0 body verbatim in `phase0_prepare()` and the existing Phase 5 body verbatim in `phase5_run()`, then gate the fan-out on `${SMOKE_PHASE:-}` — when set, a selector branch runs phase-0 prep (phase-0 PASS verdict suppressed so the run carries exactly one verdict) plus `phase5_run` and emits a single isolation `SMOKE PASS` line, then `exit 0` before the full path; when unset/empty, the branch is skipped and the full path calls the same functions at the same points, so banners, ordering, and `fatal` hard-fail semantics are unchanged. (2) `test/council-models.test.ts` (R-1 fold-in): the R-2 usage-line/listing-header expectations in H1/H2 and the R-3 notify expectation in H3 stop reading the module's own exports and instead assert against test-local ruled literals copied from EV-25's Phase-1 rulings, plus a new source-audit test that byte-locks the module constants to the same ruled literals — drift between code and ruling becomes a red test instead of invisible self-reference. `smoke/run.sh` forwards `SMOKE_PHASE` into the container.

**Tech Stack:** bash (`smoke/driver.sh`, `smoke/run.sh`), TypeScript strict + bun:test for the fold-in. No new dependencies.

**Spec:** Card FLLWUP-11 (EPIC-6) — the card face IS the spec (mechanical handoff, no spec file). Binding Phase-1 ruling R-1: the optional fold-in is in scope — Phase 5 assertions source the R-2 usage line and R-3 notify copy from the ruled literals rather than in-repo constants, closing the self-referential `USAGE_LINE` gap in `test/council-models.test.ts` H1. Ruled literals (EV-25 Phase-1 rulings, immutable):
- R-2 usage line: `[council-models] usage: /council-models [<seat> [<provider>/<model>[:thinking]]]` followed by `Current per-seat models:` and one line per seat — `<seat>: <provider>/<model>[:thinking] (override)` when an override exists, `<seat>: frontmatter default` otherwise.
- R-3 notify copy: `council-models: wrote <seat> → <provider>/<model>[:thinking] in .council.json — takes effect at the next dispatch.`

## Global Constraints

- **Unset-selector contract (the hard one):** with no `SMOKE_PHASE`, the driver's runtime behavior is the pre-change flow — same phase banners in the same order (`0a`…`0d`, `1`, `2`, `3`, `4`, `5`), same hard-fail semantics (a failure prints `SMOKE FAIL: …` to stderr and `exit 1`; no `set -e` is added; `set -uo pipefail` stays), same final `SMOKE PASS — full council loop + epic delivery + council-eval matrix + council-leaderboard + council-models verified` line. Verification is by code inspection (the Phase 1–4 statements are unmoved in the file) + `bash -n`; the full 3.5-hour harness is NOT run.
- **Isolation path:** `SMOKE_PHASE` set → ONLY `phase0_prepare` (with its PASS verdict suppressed) and `phase5_run` run; the Phase 1–4 real-model dispatches never execute. `SMOKE_PHASE` values other than `5` → `fatal` with a clear message. Exactly one verdict line is emitted by the isolation path: `SMOKE PASS — phase 5 (council-models) verified in isolation (SMOKE_PHASE=5)` (PASS) or a `SMOKE FAIL:` line (FAIL, exit 1 → `SMOKE FAIL phase exit=…` from run.sh).
- **Phase-5 preconditions:** the isolation path must prepare `$WORK` itself (fixture seed, deps resolvable, `pi install -l /pkg`, headless `/council-init` scaffold — which supplies `council/validate.py` via `council/scaffold/`) because the fixture's `council/` ships only `board.md`/`cards/`/`preflight.sh`. `/council-init` is deterministic scaffold + installs — NOT a real-model dispatch — so running it in the isolation path is consistent with "no Phase 1–4 real-model work". The Phase 0 statements are reused verbatim, only wrapped.
- **R-1 fold-in (no weakening):** every existing assertion stays; the change is (a) H1/H2/H3 expectation sources move to test-local ruled literals, (b) a new source-audit test byte-locks the module's exported constants/function output to the ruled literals. The driver's Phase-5 greps already inline the ruled bytes — they are kept byte-identical and gain a provenance comment.
- **Scope discipline:** touch only `smoke/driver.sh`, `smoke/run.sh`, `test/council-models.test.ts`. Do NOT touch `council/board.md`, `council/cards/*.md`, `extensions/*.ts`, or any engine code.
- **Gates, in order, none lowered:** `bun install --frozen-lockfile` (exit 0, no lockfile diff); `bunx tsc --noEmit` (clean, strict); `bun test` (whole suite green; 2 env-gated skips expected — count grows by the added tests); `python3 council/validate.py` ("All council artifacts valid"). Driver additionally `bash -n smoke/driver.sh`.
- **TDD note:** the fold-in changes ONLY test-file expectations (no production code exists for this card), so there is no red state to manufacture — the new audit test passes on current code (module == ruling today) and is the tripwire that turns red when the code drifts from the ruling. The driver change's falsifier is the isolation smoke run itself (the card's acceptance proof).
- **Committs** MUST be Conventional Commits; branch `fllwup-11-phase-selector` off main; push + one PR against main; no history rewriting.
- **Hygiene:** never leave a stray/probe test file in `test/`; before EVERY commit run `git status` and `git diff --cached` and verify the staged set contains only this card's files (a prior card swept implementation files into main via foreign-staged paths). Do not commit `smoke/.artifacts/` (gitignored) or in-container-created `node_modules`.

---

### Task 1: Phase 0 and Phase 5 become functions; add the `SMOKE_PHASE` selector to `smoke/driver.sh`

**Files:**
- Modify: `smoke/driver.sh` (structure only — all phase bodies byte-verbatim)

**Interfaces:**
- Consumes: existing `phase()`, `fatal()`, `assert.sh` helpers, `PKG=/pkg`, `WORK=/work`, `FLASH`.
- Produces:
  - `phase0_prepare [report_pass]` — the original Phase 0 body; prints `SMOKE PHASE 0 PASS` only when arg is `1` (default).
  - `phase5_run` — the original Phase 5 body including its `phase "5 council-models (EV-25)"` banner.
  - `SMOKE_PHASE` selector branch placed BEFORE the full path (so Phase 1–4 never runs when set).

- [ ] **Step 1: Restructure `smoke/driver.sh`**

Current structure (lines as of HEAD): vars → `phase()`/`fatal()` → `phase "0a seed worktree"` … Phase 0 body … `SMOKE PHASE 0 PASS` → `phase "1 council loop EV-1"` … Phase 4 body … `phase "5 council-models (EV-25)"` … Phase 5 body … `rm -f "$CM_OUT" "$CM_SEAT" "$CM_WRITE" "$CM_FAIL"` → final `SMOKE PASS — full …` line.

New structure (same bytes, moved/wrapped):

```bash
# FLLWUP-11: environment-gated phase selector. SMOKE_PHASE set → only the
# named phase's real work runs (Phase 1-4 real-model dispatches never happen);
# unset/empty → the full path below, byte-for-byte the pre-FLLWUP-11 flow.
# Only phase 5 is supported today.
SMOKE_PHASE="${SMOKE_PHASE:-}"

# Phase 0 — seed $WORK, deps, project-local install, headless /council-init
# (deterministic scaffold, NO real-model dispatch). Shared verbatim by the full
# path and the SMOKE_PHASE=5 isolation path; the isolation path suppresses the
# phase-0 PASS verdict so the run carries a single report (Phase 5's).
phase0_prepare() {
	phase "0a seed worktree"
	rm -rf "$WORK"
	cp -R "$PKG/smoke/fixture" "$WORK"
	cd "$WORK" || fatal "no worktree"
	git init -q -b main
	git add -A
	git commit -q -m "fixture seed"

	phase "0b package deps resolvable"
	(cd "$PKG" && bun install --frozen-lockfile >/dev/null) || fatal "bun install in package failed"

	phase "0c install pi-council project-local"
	pi install -l "$PKG" || fatal "pi install failed"
	grep -q "$PKG" .pi/settings.json || fatal ".pi/settings.json does not pin $PKG"

	phase "0d council-init (slash-routing spike)"
	pi --approve --model "$FLASH" -p "/council-init" || fatal "headless /council-init failed"
	[ -d council ] || fatal "council/ not scaffolded"
	[ -d vault ] || fatal "vault/ not scaffolded"
	[ -x council/preflight.sh ] || fatal "council/preflight.sh not executable"
	cmp -s "$PKG/smoke/fixture/.council.json" .council.json || fatal ".council.json was clobbered"
	cmp -s "$PKG/smoke/fixture/council/preflight.sh" council/preflight.sh || fatal "preflight.sh was clobbered"
	grep -q "superpowers" .pi/settings.json || fatal "superpowers not pinned project-locally"
	grep -q "rpiv-ask-user-question" .pi/settings.json || fatal "ask-user-question not pinned project-locally"
	python3 council/validate.py || fatal "validate.py failed after init"
	bash council/preflight.sh || fatal "preflight failed after init"

	if [ "${1:-1}" = "1" ]; then
		echo
		echo "SMOKE PHASE 0 PASS"
	fi
}
```

Then, after the (unmoved, byte-identical) Phase 1–4 statements and immediately after the Phase 5 body is wrapped, the file continues with:

```bash
# Phase 5 — /council-models end-to-end (EV-25). The greps below inline the
# EV-25 Phase-1 ruling literals VERBATIM (R-2 usage line, listing header,
# override-line shape; R-3 notify copy) — the ruling, not a module constant,
# is the authority (FLLWUP-11 R-1).
phase5_run() {
	phase "5 council-models (EV-25)"
	cd "$WORK" || fatal "no worktree"
	CM_OUT="$(mktemp)"
	CM_SEAT="$(mktemp)"
	CM_WRITE="$(mktemp)"
	CM_FAIL="$(mktemp)"
	## … the Phase 5 body is pasted here byte-verbatim from HEAD, through:
	rm -f "$CM_OUT" "$CM_SEAT" "$CM_WRITE" "$CM_FAIL"
}

# FLLWUP-11 isolation path: SMOKE_PHASE set → phase-0 prep (no verdict) plus
# ONLY the named phase's work; one PASS/FAIL report. Anything but 5 is a hard
# fail — nothing partial executes.
if [ -n "$SMOKE_PHASE" ]; then
	if [ "$SMOKE_PHASE" != "5" ]; then
		fatal "unsupported SMOKE_PHASE='$SMOKE_PHASE' (only 5 is supported)"
	fi
	phase "FLLWUP-11 isolated run — SMOKE_PHASE=$SMOKE_PHASE (phases 1-4 real-model work skipped)"
	phase0_prepare 0
	phase5_run
	echo
	echo "SMOKE PASS — phase 5 (council-models) verified in isolation (SMOKE_PHASE=$SMOKE_PHASE)"
	exit 0
fi

phase0_prepare

phase "1 council loop EV-1"
## … the UNCHANGED Phase 1–4 statements stay exactly where they are …
phase5_run

echo
echo "SMOKE PASS — full council loop + epic delivery + council-eval matrix + council-leaderboard + council-models verified"
```

The physical order in the file: vars → `phase()`/`fatal()` → `SMOKE_PHASE=` + `phase0_prepare()` (wrapping the original Phase 0 body) → `phase5_run()` (wrapping the original Phase 5 body, relocated up — bash defines functions at runtime, so both defs must precede the selector branch that calls them) → selector branch → `phase0_prepare` call → Phase 1–4 (unchanged, in place) → `phase5_run` call → final full-path PASS line. Because the selector branch sits before Phase 1–4 and both function defs precede it, `bash` line-order guarantees Phase 1–4 never executes when `SMOKE_PHASE` is set and no def-before-call hazard exists. `git diff --color-moved=blocks` shows the two bodies as moved blocks.

- [ ] **Step 2: Syntax-check the driver**

```bash
bash -n smoke/driver.sh
```
Expected: exit 0, no output.

- [ ] **Step 3: Verify the moved bodies are byte-verbatim and the full path is structurally unchanged**

```bash
cd "$(git rev-parse --show-toplevel)"
git show HEAD:smoke/driver.sh > /tmp/driver-before.sh
# Extract the Phase 0 body (statements only) from both and diff, and the Phase 5
# body (statements only) from both and diff — they must be identical.
```

Concretely: `awk`-extract the original Phase 0 block (`phase "0a seed worktree"` … `bash council/preflight.sh || fatal "preflight failed after init"`) from `/tmp/driver-before.sh` and from the working file; diff must be empty (the only difference between old Phase 0 and the function body is the trailing PASS-verdict `if`, which is additive and defaulted to the same output in the full path). Same for Phase 5 (`phase "5 council-models (EV-25)"` … `rm -f "$CM_OUT" "$CM_SEAT" "$CM_WRITE" "$CM_FAIL"`). Expected: both diffs empty.

- [ ] **Step 4: Commit**

```bash
git add smoke/driver.sh
git status && git diff --cached --stat   # ONLY smoke/driver.sh staged
git commit -m "feat(smoke): SMOKE_PHASE=5 selector — run the /council-models phase in isolation (FLLWUP-11)"
```

### Task 2: Forward `SMOKE_PHASE` through the host entrypoint

**Files:**
- Modify: `smoke/run.sh` (one line)

**Interfaces:**
- Consumes: nothing new.
- Produces: `SMOKE_PHASE` (possibly empty) present in the container environment — guarded with `${SMOKE_PHASE:-}` against `set -u`.

- [ ] **Step 1: Forward the variable**

Replace in `smoke/run.sh`:

```bash
docker run --name "$CID" -e OPENROUTER_API_KEY -v "$REPO_ROOT:/pkg" "$IMAGE" \
```

with:

```bash
docker run --name "$CID" -e OPENROUTER_API_KEY -e SMOKE_PHASE=${SMOKE_PHASE:-} -v "$REPO_ROOT:/pkg" "$IMAGE" \
```

(When unset on the host the container sees an empty `SMOKE_PHASE` — the driver's `${SMOKE_PHASE:-}` treats it as the full path. No other run.sh behavior changes.)

- [ ] **Step 2: Syntax-check + confirm the unset host path passes an empty value**

```bash
bash -n smoke/run.sh
SMOKE_PHASE= bash -n smoke/run.sh   # and: an unset-equivalent
```
Expected: exit 0 both ways.

- [ ] **Step 3: Commit**

```bash
git add smoke/run.sh
git status && git diff --cached --stat   # ONLY smoke/run.sh staged
git commit -m "feat(smoke): forward SMOKE_PHASE into the smoke container (FLLWUP-11)"
```

### Task 3: R-1 fold-in — ruled literal authority in `test/council-models.test.ts`

**Files:**
- Modify: `test/council-models.test.ts`

**Interfaces:**
- Consumes: existing imports `USAGE_LINE`, `LISTING_HEADER`, `modelsNotifyLine`, `FLASH`, `run()`, `makeRepo()`.
- Produces: test-local ruled-literal constants + one new source-audit test; H1/H2/H3 expectations anchored to the ruling. `USAGE_LINE`/`LISTING_HEADER`/`modelsNotifyLine` imports stay (used by the audit test / W1/W3).

- [ ] **Step 1: Add the ruled-literal constants (bytes copied from EV-25's face)**

Insert after the `const DISPLAY = …` block:

```ts
// EV-25 Phase-1 ruling R-2/R-3 byte literals — the authority. FLLWUP-11 R-1:
// H1/H2/H3 assert the emitted output against THESE ruled bytes, not the
// module's own exports (no self-reference); the source-audit test below also
// byte-locks the module's constants/function output to them, so drift between
// the ruling and the code is a red test.
const RULED_USAGE_LINE = "[council-models] usage: /council-models [<seat> [<provider>/<model>[:thinking]]]";
const RULED_LISTING_HEADER = "Current per-seat models:";
const RULED_NOTIFY_FLASH_HIGH =
	"council-models: wrote owner → openrouter/deepseek/deepseek-v4-flash-0731:high in .council.json — takes effect at the next dispatch.";
```

- [ ] **Step 2: Point H1/H2/H3 at the ruled literals**

H1: `expect(lines.slice(0, 3)).toEqual([USAGE_LINE, "", LISTING_HEADER]);` → `toEqual([RULED_USAGE_LINE, "", RULED_LISTING_HEADER]);`

H2: `expect(text).toBe([USAGE_LINE, "", LISTING_HEADER, "owner: openrouter/deepseek/deepseek-v4-flash-0731:low (override)"].join("\n"));` → `expect(text).toBe([RULED_USAGE_LINE, "", RULED_LISTING_HEADER, "owner: openrouter/deepseek/deepseek-v4-flash-0731:low (override)"].join("\n"));`

H3: the `expect(text).toBe("council-models: wrote owner → openrouter/deepseek/deepseek-v4-flash-0731:high in .council.json — takes effect at the next dispatch.")` body → `expect(text).toBe(RULED_NOTIFY_FLASH_HIGH);`

- [ ] **Step 3: Add the module-vs-ruling source-audit lock**

Append after the existing `"source audit: council-models.ts emits plain text — no ANSI, no literal #hex (9.6)"` test:

```ts
test("source audit: module R-2/R-3 bytes match the EV-25 ruling literals (FLLWUP-11)", () => {
	// The ruled bytes are the authority; these assertions make a module drift
	// from the ruling visible even though H1/H2/H3 now assert the ruled literal
	// directly (no self-reference).
	expect(USAGE_LINE).toBe(RULED_USAGE_LINE);
	expect(LISTING_HEADER).toBe(RULED_LISTING_HEADER);
	expect(modelsNotifyLine("owner", { model: FLASH, thinkingLevel: "high" })).toBe(RULED_NOTIFY_FLASH_HIGH);
});
```

- [ ] **Step 4: Run the file's tests**

```bash
bun test test/council-models.test.ts
```
Expected: all pass (module currently matches the ruling — this is the tripwire standing green). Confirm the new test ran (grep for `FLLWUP-11` in the output).

- [ ] **Step 5: Commit**

```bash
git add test/council-models.test.ts
git status && git diff --cached --stat   # ONLY test/council-models.test.ts staged
git commit -m "test(council-models): assert R-2/R-3 output against the EV-25 ruled literals, not the module constants (FLLWUP-11)"
```

### Task 4: Gates, isolation proof, push, PR

- [ ] **Step 1: Run the four gates in order (worktree), each a hard stop-and-fix**

```bash
bun install --frozen-lockfile      # exit 0; git diff --exit-code bun.lock
bunx tsc --noEmit                  # clean (strict)
bun test                           # full suite green (2 env-gated skips)
python3 council/validate.py        # "All council artifacts valid"
```
Driver: `bash -n smoke/driver.sh` (rerun after Task 3 in case of later edits).

- [ ] **Step 2: Isolation proof — run the driver with the selector through run.sh**

```bash
SMOKE_PHASE=5 bun run smoke        # = bash smoke/run.sh; docker image pi-council-smoke is cached
```
Expected, and record the exact observed output: `=== FLLWUP-11 isolated run — SMOKE_PHASE=5 … ===`, phase-0 banners `0a`…`0d` (NO `SMOKE PHASE 0 PASS` line), NO `=== 1 … ===`/`=== 2 … ===`/`=== 3 … ===`/`=== 4 … ===` banners, then `=== 5 council-models (EV-25) ===` with all its greps green, ending `SMOKE PASS — phase 5 (council-models) verified in isolation (SMOKE_PHASE=5)` and host-side `SMOKE PASS (artifacts: smoke/.artifacts/<ts>)`, exit 0. (If the run fails, treat as a gate: fix, rerun.)

- [ ] **Step 3 (cheap, optional): FAIL-path report shape**

```bash
SMOKE_PHASE=999 bun run smoke
```
Expected: driver fatals `SMOKE FAIL: unsupported SMOKE_PHASE='999' (only 5 is supported)`; run.sh prints `SMOKE FAIL phase exit=1 …`; exit 1. If budget does not allow a second docker run, document that the branch is verified by inspection (`fatal` → `exit 1`).

- [ ] **Step 4: Push and open the PR**

```bash
git push -u origin fllwup-11-phase-selector
gh pr create --base main --head fllwup-11-phase-selector --title "feat(smoke): SMOKE_PHASE=5 selector — /council-models phase isolation (FLLWUP-11)" --body "…"
```
Commit set before pushing: `git status`, `git log main..HEAD --oneline` — expect exactly the three card commits (plan-doc commit included; if it was made before Task 1, four commits, all this card's).

## Self-Review

- **Spec coverage:** acceptance 1 (selector runs only Phase 5, real session, PASS/FAIL report) → Task 1 + Task 2 + Task 4 Step 2; acceptance 2 (R-2/R-3 from ruled literals, no self-reference) → Task 3 + driver provenance comment in Task 1; acceptance 3 (phases 0–4 unchanged when unset) → Task 1 Step 3 (verbatim-move diff + unmoved Phase 1–4 statements) + Task 4 Step 1 (`bash -n`). No gaps.
- **Placeholder scan:** the only "…" runs are markers for byte-verbatim pastes whose source is the HEAD file at a named region — the executor's Step 3 diff proves the paste. No TBDs.
- **Type consistency:** `phase0_prepare`/`phase5_run` defined before every call (order guaranteed by the restructure's physical layout); `RULED_*` names used identically in Steps 1–3; no signature drift.