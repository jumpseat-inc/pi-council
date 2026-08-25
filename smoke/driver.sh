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

echo
echo "SMOKE PHASE 0 PASS"

phase "1 council loop EV-1"
timeout "$PHASE1_TIMEOUT" pi --approve --model "$FLASH" -p "/council EV-1" \
	|| fatal "phase 1: /council EV-1 did not settle within ${PHASE1_TIMEOUT}s"

phase "1 harness merge gate (plays the human)"
cd "$WORK" || fatal "no worktree"
GOT_STATE="$(sed -n 's/^state: *//p' council/cards/EV-1.md | head -1)"
if [ "$GOT_STATE" = "Done" ]; then
	echo "phase 1: EV-1 already Done — merge gate already completed (no harness merge)"
else
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
