#!/usr/bin/env bash
# FLLWUP-114 phase 7 — the startup-window waiter wrapper (container-only).
#
# Runs the bounded poller (smoke/phase7-dispatch.ts) against the phase's
# work dir; on success derives the runner's Hub run id (the newest run dir
# whose manifest names the runner seat) and echoes it for the sweep.
set -u

WORK="${1:?usage: phase7-wait.sh <workDir> <flash> <parentPid>}"
FLASH="${2:?usage: phase7-wait.sh <workDir> <flash> <parentPid>}"
PARENT_PID="${3:?usage: phase7-wait.sh <workDir> <flash> <parentPid>}"
PKG="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

FIRST="$(bun "$PKG/phase7-dispatch.ts" "$WORK" "EV-2" "$PARENT_PID" 840 2>&1)"
STATUS=$?
if [ "$STATUS" -ne 0 ]; then
	echo "$FIRST" >&2
	exit 1
fi

RUN_ID=""
for d in "$WORK"/.pi/council/runs/2*; do
	[ -d "$d" ] || continue
	if grep -q '"seat": *"council-runner"' "$d"/*.json 2>/dev/null; then
		RUN_ID="$(basename "$d")"
	fi
done
echo "$RUN_ID"
