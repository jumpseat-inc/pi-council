#!/usr/bin/env bash
# Council preflight for the EV-18 board-create-card fixture seed. No MCP, no origin
# fetch, no .pi gates — an eval scratch has none of those. FAIL halts. Card
# argument not used: features-new drafts cards rather than running one.
set -u

fail() { echo "FAIL: $*"; exit 1; }
ok() { echo "OK: $*"; }

command -v bun >/dev/null 2>&1 || fail "bun is not on PATH"
ok "bun found: $(bun --version)"

[ -f bun.lock ] || [ -f package.json ] || fail "not a project root (no package.json/bun.lock)"
ok "project files present"

echo "PASS: preflight clean"
