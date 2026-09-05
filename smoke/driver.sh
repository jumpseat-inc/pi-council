#!/usr/bin/env bash
# Container-side smoke orchestrator. Exits non-zero on the first failure.
set -uo pipefail

SMOKE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SMOKE_DIR/assert.sh"

PKG=/pkg
WORK=/work
FLASH="openrouter/deepseek/deepseek-v4-flash-0731"
PHASE1_TIMEOUT=$((30 * 60))
PHASE2_TIMEOUT=$((90 * 60))

phase() { echo; echo "=== $* ==="; }
fatal() { echo "SMOKE FAIL: $*" >&2; exit 1; }

# FLLWUP-11: environment-gated phase selector. SMOKE_PHASE set → only the
# named phase's real work runs (Phase 1-4 real-model dispatches never happen);
# unset/empty → the full path below, byte-for-byte the pre-FLLWUP-11 flow.
# Only phase 5 is supported today.
SMOKE_PHASE="${SMOKE_PHASE:-}"
# Phase 0 — seed $WORK, deps, project-local install, headless /council-init
# (deterministic scaffold — NO real-model dispatch). Shared verbatim by the full
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

# (a) no-arg form: R-2 usage block + per-seat current listing (all 9 seats override-pinned).
timeout 120 pi --approve -p "/council-models" >"$CM_OUT" 2>&1 \
	|| fatal "phase 5: /council-models no-arg did not settle"
grep -Fq '[council-models] usage: /council-models [<seat> [<provider>/<model>[:thinking]]]' "$CM_OUT" \
	|| fatal "phase 5: R-2 usage line missing"
grep -Fq 'Current per-seat models:' "$CM_OUT" \
	|| fatal "phase 5: listing header missing"
# Fixture pins are suffix-less string shorthands; each seat's FRONTMATTER
# `:suffix` thinking survives the level-less override (council-config
# precedence: explicit thinking > override :suffix > frontmatter), so the
# effective line names the preserved level.
grep -Fq 'owner: openrouter/deepseek/deepseek-v4-flash-0731:high (override)' "$CM_OUT" \
	|| fatal "phase 5: owner override line missing"

# (b) single-seat form: usage line + that seat's current line.
timeout 120 pi --approve -p "/council-models owner" >"$CM_SEAT" 2>&1 \
	|| fatal "phase 5: /council-models owner did not settle"
grep -Fq '[council-models] usage:' "$CM_SEAT" || fatal "phase 5: single-seat usage line missing"
grep -Fq 'owner: openrouter/deepseek/deepseek-v4-flash-0731:high (override)' "$CM_SEAT" \
	|| fatal "phase 5: single-seat current line missing"

# (c) write form: validate + write + R-3 notify (post-write read-back), file asserted.
timeout 120 pi --approve -p "/council-models owner openrouter/deepseek/deepseek-v4-flash-0731:high" >"$CM_WRITE" 2>&1 \
	|| fatal "phase 5: /council-models write did not settle"
grep -Fq 'council-models: wrote owner → openrouter/deepseek/deepseek-v4-flash-0731:high in .council.json — takes effect at the next dispatch.' \
	"$CM_WRITE" || fatal "phase 5: R-3 notify copy missing"
python3 -c '
import json
cfg = json.load(open(".council.json"))
val = cfg["council"]["owner"]
assert val == {"model": "openrouter/deepseek/deepseek-v4-flash-0731", "thinking": "high"}, val
assert len(cfg["council"]) == 9, "write must not disturb other seats: %d" % len(cfg["council"])
' || fatal "phase 5: post-write .council.json mismatch"
python3 council/validate.py || fatal "phase 5: validate.py failed after the write"

# (d) failure: model outside the catalogue → error, file byte-identical (nothing written).
cp .council.json "$WORK/.council.json.cm-before"
timeout 120 pi --approve -p "/council-models owner openrouter/no-such-model/xyz" >"$CM_FAIL" 2>&1 \
	|| fatal "phase 5: /council-models invalid-model did not settle"
grep -Fq '[council-models] error:' "$CM_FAIL" || fatal "phase 5: invalid-model error missing"
cmp -s .council.json "$WORK/.council.json.cm-before" || fatal "phase 5: invalid model still wrote .council.json"
rm -f "$WORK/.council.json.cm-before"

rm -f "$CM_OUT" "$CM_SEAT" "$CM_WRITE" "$CM_FAIL"
}

# Phase 6 — kitty-protocol search-smoke (FLLWUP-14). The pty harness is fully
# self-provisioning (scratch HOME, npm prefix pin of 0.84.3, fixture worktree
# with the repo pinned project-local) and imports nothing from this container's
# pi, so this phase just runs it inside the /pkg checkout.
phase6_run() {
phase "6 kitty search-smoke (FLLWUP-14)"
bash "$PKG/smoke/search-smoke/run.sh" \
	|| fatal "phase 6: search-smoke run.sh failed"
}

# FLLWUP-11 isolation path: SMOKE_PHASE set → phase-0 prep (no verdict) plus
# ONLY the named phase's real work; one PASS/FAIL report at the end. Values
# other than 5 (or 6, FLLWUP-14) are a hard fail — nothing partial executes.
if [ -n "$SMOKE_PHASE" ]; then
	if [ "$SMOKE_PHASE" != "5" ] && [ "$SMOKE_PHASE" != "6" ]; then
		fatal "unsupported SMOKE_PHASE='$SMOKE_PHASE' (only 5 and 6 are supported)"
	fi
	phase "FLLWUP-11 isolated run — SMOKE_PHASE=$SMOKE_PHASE (phases 1-4 real-model work skipped)"
	phase0_prepare 0
	if [ "$SMOKE_PHASE" = "5" ]; then
		phase5_run
		echo
		echo "SMOKE PASS — phase 5 (council-models) verified in isolation (SMOKE_PHASE=$SMOKE_PHASE)"
	else
		phase6_run
		echo
		echo "SMOKE PASS — phase 6 (kitty search-smoke) verified in isolation (SMOKE_PHASE=$SMOKE_PHASE)"
	fi
	exit 0
fi

phase0_prepare
phase "1 council loop EV-1"
timeout "$PHASE1_TIMEOUT" pi --approve --model "$FLASH" -p "/council EV-1" \
	|| fatal "phase 1: /council EV-1 did not settle within ${PHASE1_TIMEOUT}s"

phase "1 harness merge gate (plays the human)"
cd "$WORK" || fatal "no worktree"
GOT_STATE="$(sed -n 's/^state: *//p' council/cards/EV-1.md | head -1)"
if [ "$GOT_STATE" = "Done" ]; then
	echo "phase 1: EV-1 already Done — merge gate already completed (no harness merge)"
else
	if [ "$GOT_STATE" = "In Progress" ]; then
		# Flash-model variance: the facilitator may surface the git-strategy
		# question before implementation (card In Progress) instead of at the
		# merge gate (card In Review). Play the human: record the delivery
		# ruling and resume the run once.
		echo "phase 1: facilitator paused at In Progress — recording delivery ruling, resuming once"
		python3 -c "
import pathlib
p = pathlib.Path('council/cards/EV-1.md')
t = p.read_text()
t += '''
## Delivery mechanism (pre-decided — do not ask)

This fixture has no git remote, no gh, and no CI. Delivery is a local feature
branch in a worktree, verified at that branch by the Skeptic and judged by the
Judge, then merged into local main at the human merge gate. The git strategy is
decided; do not surface it as a question.
'''
p.write_text(t)
"
		git add council/cards/EV-1.md
		git commit -q -m "smoke: record delivery mechanism ruling (harness plays the human)" \
			|| fatal "phase 1: delivery ruling commit failed"
		timeout "$PHASE1_TIMEOUT" pi --approve --model "$FLASH" -p "/council EV-1" \
			|| fatal "phase 1: resumed /council EV-1 did not settle within ${PHASE1_TIMEOUT}s"
		GOT_STATE="$(sed -n 's/^state: *//p' council/cards/EV-1.md | head -1)"
	fi
	if [ "$GOT_STATE" != "In Review" ]; then
		fatal "phase 1: EV-1 stopped at state '$GOT_STATE', expected the In Review merge gate"
	fi
	FEATURE_BRANCHES="$(git for-each-ref --format='%(refname:short)' refs/heads | grep -v '^main$' || true)"
	COUNT="$(printf '%s\n' "$FEATURE_BRANCHES" | grep -c . || true)"
	if [ "$COUNT" -ne 1 ]; then
		fatal "phase 1: expected exactly one feature branch to merge, found: '$FEATURE_BRANCHES'"
	fi
	git merge --no-ff "$FEATURE_BRANCHES" -m "smoke: merge EV-1 feature branch (harness plays the human merge gate)" \
		|| fatal "phase 1: merge of $FEATURE_BRANCHES failed"
	python3 -c "
import pathlib
p = pathlib.Path('council/cards/EV-1.md')
t = p.read_text()
p.write_text(t.replace('state: In Review', 'state: Done'))
"
	move_board_line "$WORK" "EV-1" "Done" || fatal "phase 1: board line move failed"
	python3 council/validate.py || fatal "phase 1: validate.py failed after harness merge"
	git add -A
	git commit -q -m "smoke: EV-1 Done (harness merge gate)" \
		|| fatal "phase 1: reconciliation commit failed"
fi

assert_card_state "$WORK" "EV-1" "Done" || fatal "phase 1: EV-1 card is not Done"
assert_board_column "$WORK" "EV-1" "Done" || fatal "phase 1: EV-1 board line not under Done"

RUN_DIR="$WORK/.pi/council/runs"
[ -d "$RUN_DIR" ] || fatal "phase 1: no runs dir at $RUN_DIR"
SEAT_SESSIONS="$(find "$RUN_DIR" -name '*.jsonl' | wc -l | tr -d ' ')"
if [ "$SEAT_SESSIONS" -lt 3 ]; then
	fatal "phase 1: expected >= 3 seat sessions in runs/, found $SEAT_SESSIONS"
fi

phase "1 kill-shot probes EV-1"
cd "$WORK" || fatal "no worktree"
bun run typecheck || fatal "phase 1: typecheck failed after the run"
bun test || fatal "phase 1: test suite failed after the run"
COUNT="$(bun src/cli.ts test/fixtures/sample.md --count)" \
	|| fatal "phase 1: --count invocation failed"
[ "$COUNT" = "3" ] || fatal "phase 1: --count probe expected 3, got '$COUNT'"

echo
echo "SMOKE PHASE 1 PASS"

phase "2 epic delivery EPIC-1"
timeout "$PHASE2_TIMEOUT" pi --approve --model "$FLASH" -p "/features-deliver EPIC-1" \
	|| fatal "phase 2: /features-deliver EPIC-1 did not settle within ${PHASE2_TIMEOUT}s"

assert_card_state "$WORK" "EV-2" "Done" || fatal "phase 2: EV-2 card is not Done"
assert_card_state "$WORK" "EV-3" "Done" || fatal "phase 2: EV-3 card is not Done"
assert_board_column "$WORK" "EV-2" "Done" || fatal "phase 2: EV-2 board line not under Done"
assert_board_column "$WORK" "EV-3" "Done" || fatal "phase 2: EV-3 board line not under Done"
python3 council/validate.py || fatal "phase 2: validate.py failed after epic delivery"

phase "2 kill-shot probes EV-2/EV-3"
cd "$WORK" || fatal "no worktree"
JSON_OUT="$(bun src/cli.ts test/fixtures/sample.md --json)" \
	|| fatal "phase 2: --json invocation failed"
assert_json_links "$JSON_OUT" || fatal "phase 2: --json output mismatch"
set +e
bun src/cli.ts test/fixtures/sample.md --json --count >/dev/null 2>&1
CONFLICT_EXIT=$?
set -e
[ "$CONFLICT_EXIT" -eq 2 ] || fatal "phase 2: --json --count conflict exited $CONFLICT_EXIT, want 2"
IMAGES_OUT="$(bun src/cli.ts test/fixtures/sample.md --images)" \
	|| fatal "phase 2: --images invocation failed"
assert_images_output "$IMAGES_OUT" || fatal "phase 2: --images output mismatch"

bun run typecheck || fatal "phase 2: typecheck failed on final tree"
bun test || fatal "phase 2: test suite failed on final tree"

phase "2 council-runner dispatch evidence"
RUN_DIR="$WORK/.pi/council/runs"
[ -d "$RUN_DIR" ] || fatal "phase 2: no runs dir at $RUN_DIR"
RUNNER_SESSIONS="$(grep -rl '"seat":"council-runner"\|"seat": "council-runner"' "$RUN_DIR" 2>/dev/null | wc -l | tr -d ' ')"
if [ "$RUNNER_SESSIONS" -lt 1 ]; then
	fatal "phase 2: no council-runner session found under $RUN_DIR"
fi

echo
phase "3 council-eval matrix (EV-20 Q3 §8)"
cd "$WORK" || fatal "no worktree"
PHASE3_TIMEOUT=$((30 * 60))
PHASE3_TASK="eval-smoke"
PHASE3_MODEL="$FLASH"
EVAL_OUT="$(mktemp)"
REEVAL_OUT="$(mktemp)"

# Drive the full /council-eval seam headlessly: dispatch->scratch->grade->store->summary.
timeout "$PHASE3_TIMEOUT" pi --approve -p "/council-eval $PHASE3_TASK $PHASE3_MODEL --repeat 2" >"$EVAL_OUT" 2>&1 \
	|| fatal "phase 3: /council-eval did not settle within ${PHASE3_TIMEOUT}s"

# (b) the transcript carries durable [council-eval] lines.
grep -q '\[council-eval\]' "$EVAL_OUT" \
	|| fatal "phase 3: no [council-eval] lines in the run transcript"

# (a) per-repeat snapshot dirs (r1, r2) exist under council/eval-results/<cellId>/.
SNAP_COUNT="$(find "$WORK/council/eval-results" -mindepth 3 -maxdepth 3 -type d -name snapshot 2>/dev/null | wc -l | tr -d ' ')"
if [ "$SNAP_COUNT" -lt 2 ]; then
	fatal "phase 3: expected >= 2 snapshot dirs (r1/r2), found $SNAP_COUNT under council/eval-results"
fi

# (c) aggregateCell(readAll(cellId)) byte-identical live vs re-derivation: recompute
# the summary purely from the on-disk records (same summarizeStore path) and compare.
(cd "$PKG" && bun smoke/reeval.ts "$WORK/council/eval-results" >"$REEVAL_OUT" 2>&1) \
	|| { echo "phase 3: re-derivation failed:"; cat "$REEVAL_OUT" >&2; fatal "phase 3: re-derivation failed"; }
assert_reeval_identical "$EVAL_OUT" "$REEVAL_OUT" \
	|| fatal "phase 3: live summary != record-derived re-derivation"

# (d) validate.py green after the matrix runs.
python3 council/validate.py || fatal "phase 3: validate.py failed after the matrix"

rm -f "$EVAL_OUT" "$REEVAL_OUT"

phase "3 council-eval seam evidence"
EVAL_RESULTS="$WORK/council/eval-results"
[ -d "$EVAL_RESULTS" ] || fatal "phase 3: no eval-results dir at $EVAL_RESULTS"
RESULT_COUNT="$(find "$EVAL_RESULTS" -name '*.json' | wc -l | tr -d ' ')"
if [ "$RESULT_COUNT" -lt 2 ]; then
	fatal "phase 3: expected >= 2 eval result records, found $RESULT_COUNT"
fi

phase "3 snapshots persisted"
find "$EVAL_RESULTS" -mindepth 3 -maxdepth 3 -type d -name snapshot | sed "s|$WORK/||" >&2

phase "4 council-leaderboard (EV-21 §6)"
cd "$WORK" || fatal "no worktree"
LB_OUT="$(mktemp)"
LB_REVAL="$(mktemp)"
LB_VIEW="$(mktemp)"

# Drive /council-leaderboard headlessly against the Phase-3 gate-only records
# (eval-smoke seat fixture, one model, one version pair).
timeout 120 pi --approve -p "/council-leaderboard" >"$LB_OUT" 2>&1 \
	|| fatal "phase 4: /council-leaderboard did not settle"

# (a) State B renders for the gate-only store.
grep -q 'results exist, all gate-only (self)' "$LB_OUT" \
	|| fatal "phase 4: State B line did not render for the gate-only store"

# (b) both slices render (By command / By seat), each labeled by its axis.
grep -q 'By command (procedure fixtures)' "$LB_OUT" \
	|| fatal "phase 4: By-command slice not rendered"
grep -q 'By seat (seat fixtures)' "$LB_OUT" \
	|| fatal "phase 4: By-seat slice not rendered"

# (c) summarizeStore (reeval) and the leaderboard reader agree byte-for-byte on
# n/mean/σ over the same Phase-3 records (same-function-both-sides).
(cd "$PKG" && bun smoke/reeval.ts "$WORK/council/eval-results" >"$LB_REVAL" 2>&1) \
	|| fatal "phase 4: summarizeStore re-derivation failed"
(cd "$PKG" && bun smoke/leaderview.ts "$WORK/council/eval-results" "$WORK" >"$LB_VIEW" 2>&1) \
	|| fatal "phase 4: leaderboard reader failed"
assert_leaderboard_matches_reeval "$LB_VIEW" "$LB_REVAL" \
	|| fatal "phase 4: leaderboard reader != summarizeStore on n/mean/σ"

# (d) validate.py green after the leaderboard runs.
python3 council/validate.py || fatal "phase 4: validate.py failed after the leaderboard"

rm -f "$LB_OUT" "$LB_REVAL" "$LB_VIEW"

phase5_run

echo
echo "SMOKE PASS — full council loop + epic delivery + council-eval matrix + council-leaderboard + council-models verified"
