#!/usr/bin/env bash
# Council preflight for the EV-18 features-deliver fixture seed. Card-aware,
# no MCP, no origin fetch, no .pi presence gates — an eval scratch has none of
# those and the harness plays the human. Any FAIL: line must halt the run.
set -u

fail() { echo "FAIL: $*"; exit 1; }
ok() { echo "OK: $*"; }

command -v bun >/dev/null 2>&1 || fail "bun is not on PATH"
ok "bun found: $(bun --version)"

[ -f bun.lock ] || [ -f package.json ] || fail "not a project root (no package.json/bun.lock)"
ok "project files present"

if [ "${1:-}" != "" ]; then
  [ -f "council/cards/$1.md" ] || fail "card file council/cards/$1.md not found"
  ok "card $1 present"
fi

echo "PASS: preflight clean"
