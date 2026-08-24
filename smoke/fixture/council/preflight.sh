#!/usr/bin/env bash
# Smoke-fixture preflight: adapted from the scaffolded generic version.
# Removed: origin/main ancestry gate (no remote in an ephemeral container)
# and the context7/tavily MCP gate (OAuth is impossible unattended).
set -u

fail() { echo "FAIL: $*"; exit 1; }
ok() { echo "OK: $*"; }

# ---- Superpowers gate ----
SUPER_PKG=".pi/git/github.com/obra/superpowers"
SUPER_PIN=".pi/settings.json"
if [ -d "$SUPER_PKG" ] && [ -f "$SUPER_PKG/package.json" ]; then
  ok "superpowers present (skills package under $SUPER_PKG)"
elif [ -f "$SUPER_PIN" ] && grep -q 'superpowers' "$SUPER_PIN" 2>/dev/null; then
  ok "superpowers present (pin in $SUPER_PIN)"
else
  fail "superpowers is not installed project-locally — run /council-init, then /reload."
fi

# ---- Ask-user-question extension gate ----
ASK_PKG=".pi/npm/node_modules/@juicesharp/rpiv-ask-user-question"
ASK_PIN=".pi/settings.json"
if [ -d "$ASK_PKG" ] && [ -f "$ASK_PKG/package.json" ]; then
  ok "ask-user-question present (extension under $ASK_PKG)"
elif [ -f "$ASK_PIN" ] && grep -q 'rpiv-ask-user-question' "$ASK_PIN" 2>/dev/null; then
  ok "ask-user-question present (pin in $ASK_PIN)"
else
  fail "ask-user-question is not installed project-locally — run /council-init, then /reload."
fi

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

# ---- OpenRouter (model provider) gate ----
if [ -n "${OPENROUTER_API_KEY:-}" ]; then
  ok "openrouter authorized (OPENROUTER_API_KEY set)"
elif [ -f "${PI_CODING_AGENT_DIR:-$HOME/.pi/agent}/auth.json" ] && grep -q '"openrouter"' "${PI_CODING_AGENT_DIR:-$HOME/.pi/agent}/auth.json" && grep -q '"api_key"' "${PI_CODING_AGENT_DIR:-$HOME/.pi/agent}/auth.json"; then
  ok "openrouter authorized (stored api_key in auth.json)"
else
  fail "openrouter not authorized — set OPENROUTER_API_KEY"
fi

echo "PASS: preflight clean"
