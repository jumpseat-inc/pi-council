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
docker run --name "$CID" -e OPENROUTER_API_KEY -v "$REPO_ROOT:/pkg" "$IMAGE" \
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
ls -1dt "$REPO_ROOT"/smoke/.artifacts/2* 2>/dev/null | tail -n +$((KEEP + 1)) | xargs -r rm -rf

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
