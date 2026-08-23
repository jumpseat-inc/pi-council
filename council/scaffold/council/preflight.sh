#!/usr/bin/env bash
# Council preflight (generic starting point — adapt to your project).
# Card-aware: with a card id it checks the card file exists. Extend with your
# project's own gates (database up, services running, datasets present) before
# your first run. Prints no install steps — that's the facilitator's job.
# Any FAIL: line must halt the run.
set -u

fail() { echo "FAIL: $*"; exit 1; }
ok() { echo "OK: $*"; }

command -v bun >/dev/null 2>&1 || fail "bun is not on PATH (install via https://bun.sh)"
ok "bun found: $(bun --version)"

[ -f bun.lock ] || [ -f package.json ] || fail "not a project root (no package.json/bun.lock)"
ok "project files present"

if [ -f package.json ]; then
  bun install --frozen-lockfile >/dev/null 2>&1 || fail "bun install failed (deps not installed)"
  ok "dependencies installed"
fi

if [ "${1:-}" != "" ]; then
  [ -f "council/cards/$1.md" ] || fail "card file council/cards/$1.md not found"
  ok "card $1 present"
fi

# main must be able to fast-forward from origin.
branch=$(git symbolic-ref --short HEAD 2>/dev/null || echo main)
if [ "$branch" != "main" ]; then
  git fetch origin >/dev/null 2>&1
  git merge-base --is-ancestor origin/main HEAD 2>/dev/null \
    || fail "local history does not descend from origin/main (stale before running a card)"
  ok "history is up to date with origin/main"
fi

echo "PASS: preflight clean"
