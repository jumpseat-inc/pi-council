#!/usr/bin/env bash
# FLLWUP-114 phase 7 — the orphan-safety net (container-only).
#
# The parent pi's natural -p teardown runs Hub.shutdown (SIGKILL per live job
# group), but the runner's own sub-dispatches are spawned detached into NEW
# process groups — if the phase killed the parent or the runner mid-flight,
# those descendants would survive the phase. Every council child carries
# COUNCIL_RUN_ID (childEnv), so the sweep kills exactly the process tree
# sharing this phase's run id — precise, never ambient.
set -u

RUN_ID="${1:?usage: phase7-sweep.sh <runId>}"
[ -n "$RUN_ID" ] || exit 2

KILLED=0
for p in /proc/[0-9]*; do
	pid="${p#/proc/}"
	[ "$pid" = "$$" ] && continue
	if tr '\0' '\n' < "$p/environ" 2>/dev/null | grep -qx "COUNCIL_RUN_ID=$RUN_ID"; then
		if kill -9 -"$pid" 2>/dev/null || kill -9 "$pid" 2>/dev/null; then
			KILLED=$((KILLED + 1))
		fi
	fi
done
echo "phase7-sweep: killed $KILLED process(es) carrying COUNCIL_RUN_ID=$RUN_ID"
