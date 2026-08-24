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
