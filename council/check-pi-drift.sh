#!/usr/bin/env bash
# FLLWUP-24 — local drift tripwire: installed pi-coding-agent vs bun.lock.
#
# The repo's installed node_modules/@earendil-works/pi-coding-agent is the pi
# engine every local gate run verifies against. When it drifts from bun.lock's
# resolution, `bun install --frozen-lockfile` silently re-syncs it (exit 0),
# so local gate evidence from a drifted tree looks green while CI (fresh
# frozen-lockfile install) would verify a different pi. This artifact names
# the drift BEFORE the self-heal install runs. Called by council/preflight.sh
# between the "project files present" check and the frozen-lockfile install.
#
# Pure interface: $1 = project root. Outputs exactly one OK:/FAIL: line to
# stdout per the preflight contract; exit 0 on match (or fresh-clone
# absence of the installed package — presence is the install line's job),
# non-zero on drift or ambiguity. Never writes to node_modules.
set -u

PKG="@earendil-works/pi-coding-agent"
REMEDY="run bun install --frozen-lockfile, then re-run preflight"

if [ $# -lt 1 ]; then
  echo "FAIL: usage: check-pi-drift.sh <project-root>"
  exit 1
fi
root="$1"

# ---- Installed side: the exact file a gate-run imports (read-only) ----
installed_json="$root/node_modules/$PKG/package.json"
if [ ! -f "$installed_json" ]; then
  echo "OK: $PKG not installed in this tree (no node_modules package.json) — fresh-clone pass-through, drift check skipped"
  exit 0
fi

installed=$(grep -m1 '"version"' "$installed_json" | sed -n 's|.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*|\1|p')
if [ -z "$installed" ]; then
  echo "OK: $PKG installed but package.json has no version field — drift check skipped"
  exit 0
fi

# ---- Locked side: bun's own lock reader, from the same project root ----
# The anchored leaf (name immediately followed by @) excludes sibling subpath
# entries such as @earendil-works/pi-coding-agent/typebox@1.3.7. No head -1:
# multiple distinct resolutions are ambiguity, i.e. fail-closed.
locked_lines=$(cd "$root" && bun pm ls --all 2>/dev/null | grep -F "$PKG@" || true)
locked_versions=$(printf '%s\n' "$locked_lines" | sed -n "s|.*${PKG}@\([^[:space:]]*\).*|\1|p" | sort -u)
locked_count=$(printf '%s\n' "$locked_versions" | grep -c . || true)

if [ "$locked_count" -eq 0 ]; then
  echo "FAIL: $PKG drift — installed $installed, but bun pm ls --all resolved no version — format changed / ambiguous — $REMEDY"
  exit 1
fi
if [ "$locked_count" -gt 1 ]; then
  echo "FAIL: $PKG drift — installed $installed, but bun pm ls --all resolved multiple distinct versions ($(printf '%s' "$locked_versions" | tr '\n' ' ')) — format changed / ambiguous — $REMEDY"
  exit 1
fi

# ---- Compare ----
if [ "$installed" = "$locked_versions" ]; then
  echo "OK: $PKG $installed matches bun.lock"
  exit 0
fi
echo "FAIL: $PKG drift — installed $installed, bun.lock resolves $locked_versions — $REMEDY"
exit 1