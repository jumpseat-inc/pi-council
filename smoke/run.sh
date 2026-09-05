#!/usr/bin/env bash
# Host entrypoint. Hard fail, zero retries; artifacts every run.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IMAGE="pi-council-smoke"
KEEP=5

if [ -z "${OPENROUTER_API_KEY:-}" ]; then
	echo "SMOKE FAIL: OPENROUTER_API_KEY is not set" >&2
	exit 1
fi

docker build -q -t "$IMAGE" "$REPO_ROOT/smoke"

TS="$(date +%Y%m%d-%H%M%S)"
OUT="$REPO_ROOT/smoke/.artifacts/$TS"
CID="smoke-$TS"
mkdir -p "$OUT"

set +e
docker run --name "$CID" -e OPENROUTER_API_KEY -e SMOKE_PHASE=${SMOKE_PHASE:-} -v "$REPO_ROOT:/pkg" "$IMAGE" \
	bash /pkg/smoke/driver.sh
STATUS=$?
set -e

# Artifacts: the whole worktree minus disposable dep dirs.
if docker cp "$CID":/work "$OUT/work" 2>/dev/null; then
	rm -rf "$OUT/work/node_modules" "$OUT/work/.pi/npm" "$OUT/work/.pi/git"
else
	echo "run.sh: could not copy /work out of the container" >&2
fi
docker rm -f "$CID" >/dev/null 2>&1 || true

# Prune to the last $KEEP runs.
#
# Best-effort housekeeping — an unremovable artifact dir (foreign-owned, e.g.
# root-owned from a bind-mount container run, or own-but-permission-blocked)
# must never invert a green verdict, but a failed removal is never silent:
# every entry that cannot be deleted is named in a visible warning on stderr.
pruned=0
unremovable=0
while IFS= read -r d; do
	if rm -rf -- "$d" 2>/dev/null; then
		pruned=$((pruned + 1))
	else
		unremovable=$((unremovable + 1))
		if [ -O "$d" ]; then
			echo "run.sh: prune: cannot remove own artifact dir $d (permissions) — restore access and remove by hand" >&2
		else
			echo "run.sh: prune: cannot remove foreign-owned artifact dir $d (e.g. root-owned from a bind-mount container run) — left in place" >&2
		fi
	fi
done < <(ls -1dt "$REPO_ROOT"/smoke/.artifacts/2* 2>/dev/null | tail -n +$((KEEP + 1)))
if [ "$unremovable" -gt 0 ]; then
	echo "run.sh: prune: pruned $pruned, left $unremovable in place — verdict unaffected; remove by hand if you own them" >&2
fi

if [ "$STATUS" -eq 0 ]; then
	echo "SMOKE PASS (artifacts: smoke/.artifacts/$TS)"
else
	echo "SMOKE FAIL phase exit=$STATUS (artifacts: smoke/.artifacts/$TS)" >&2
	if [ -f "$OUT/work/.pi/council/runs" ] || [ -d "$OUT/work/.pi/council/runs" ]; then
		LAST="$(find "$OUT/work/.pi/council/runs" -name '*.jsonl' -print0 2>/dev/null | xargs -0 ls -t 2>/dev/null | head -1)"
		if [ -n "$LAST" ]; then
			echo "--- last seat transcript tail ($LAST) ---" >&2
			tail -c 4000 "$LAST" >&2
		fi
	fi
fi
exit "$STATUS"
