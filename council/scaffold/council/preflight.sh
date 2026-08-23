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

# ---- MCP gate (context7, tavily) ----
# The scaffold writes @CONFIG_DIR@/council/mcp.json registering context7 and
# tavily. Structural check only: registration present + stored credentials
# present for each. A real OAuth re-auth/live-token probe is out of scope for
# preflight. Any FAIL: line must halt the run. (@CONFIG_DIR@ is replaced with
# the real config-dir name by council-init at copy time; the agent-auth path
# honors $PI_CODING_AGENT_DIR.)
for c7 in context7 tavily; do
  c7_mcp="@CONFIG_DIR@/council/mcp.json"
  if [ ! -f "$c7_mcp" ] || ! grep -q "\"$c7\"" "$c7_mcp" 2>/dev/null; then
    fail "$c7 not registered (missing or no entry in $c7_mcp) — run /council-init"
  fi
  ok "$c7 registered"

  c7_auth="${PI_CODING_AGENT_DIR:-$HOME/.pi/agent}/council/mcp-auth.json"
  if [ ! -f "$c7_auth" ] || ! grep -q "\"$c7\"" "$c7_auth" 2>/dev/null; then
    fail "$c7 not authenticated — no stored credentials in $c7_auth — run /mcp login $c7"
  fi
  ok "$c7 authenticated (stored credentials present)"
done

echo "PASS: preflight clean"
