#!/usr/bin/env bash
# FLLWUP-14 kitty-protocol search-smoke — host one-command entrypoint (spec §2,
# §5; the README documents this exact sequence as the manual procedure).
#
# Self-provisions, in order:
#   1. A scratch area: scratch HOME (defaultProjectTrust always — the TUI never
#      prompts) + an npm prefix holding @earendil-works/pi-coding-agent@0.84.3.
#   2. A worktree seeded from smoke/fixture with this repo pinned project-local
#      (`pi install -l`) so the pi-council extension registers in the TUI.
#   3. R-2: the 0.84.3 decode-parity preflight (node -e against the pinned dist
#      via NODE_PATH) — red → "0.84.3 decode parity failed", no TUI session.
#   4. The headless usage-line probe (`/council-models` must print the R-2
#      usage line) — the misroute tripwire, same literal driver.sh phase 5 greps.
#   5. driver.py — the pty TUI session driving the nine falsifier frames.
#
# Hard fail, zero retries; artifacts every run. Re-run is the same command.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PI_VERSION="0.84.3"
PI_PACKAGE="@earendil-works/pi-coding-agent@${PI_VERSION}"
USAGE_LINE="[council-models] usage: /council-models [<seat> [<provider>/<model>[:thinking]]]"
KEEP=5
INSTALL_TIMEOUT=600        # npm install of the pinned pi into the scratch prefix
STEP_TIMEOUT=180           # any single pinned-pi invocation

# R-1 (binding ruling): the scratch env is NOT credential-less. Presence-only
# auth resolves OPENROUTER_API_KEY with zero network I/O; a non-empty value
# yields a non-undefined auth result and the OpenRouter catalogue populates
# statically from the bundled model set. sk-dummy is a placeholder, never
# persisted (env-var export only, no write to disk). The modal never dispatches
# (ModelPicker.handleInput mutates picker state only) and the headless preflight
# below is the misroute tripwire.
export OPENROUTER_API_KEY="${OPENROUTER_API_KEY:-sk-dummy}"

# Council child-mode env must not leak into the pinned pi processes. Set, the
# extension factory enters runChildMode, registers no parent commands, and
# /council-models misroutes to a real model dispatch (a 401 with sk-dummy).
unset COUNCIL_SEAT COUNCIL_JOB_ID COUNCIL_RUN_ID PI_SESSION_FILE 2>/dev/null || true

SCRATCH="$(mktemp -d "${TMPDIR:-/tmp}/search-smoke.XXXXXX")"
trap 'rm -rf "$SCRATCH"' EXIT
PREFIX="$SCRATCH/prefix"
SCRATCH_HOME="$SCRATCH/home"
WORK="$SCRATCH/work"

TS="$(date +%Y%m%d-%H%M%S)"
OUT="$REPO_ROOT/smoke/.artifacts/search-smoke/$TS"
mkdir -p "$OUT"

fail() { echo "SMOKE FAIL: $*" >&2; exit 1; }

echo "search-smoke: scratch=$SCRATCH (artifacts: smoke/.artifacts/search-smoke/$TS)"

# --- 1. scratch HOME: defaultProjectTrust always (same value smoke/Dockerfile sets) ---
mkdir -p "$SCRATCH_HOME/.pi/agent"
printf '%s\n' '{"defaultProjectTrust": "always"}' > "$SCRATCH_HOME/.pi/agent/settings.json"

# --- 2a. pinned pi into the scratch prefix ---
echo "search-smoke: installing $PI_PACKAGE into $PREFIX"
timeout "$INSTALL_TIMEOUT" npm install --prefix "$PREFIX" "$PI_PACKAGE" >"$OUT/npm-install.log" 2>&1 \
	|| fail "npm install of $PI_PACKAGE failed (see $OUT/npm-install.log)"
PI_BIN="$PREFIX/node_modules/.bin/pi"
[ -x "$PI_BIN" ] || fail "pinned pi binary missing at $PI_BIN"

# --- 2b. fixture worktree + project-local pin of this repo ---
rm -rf "$WORK"
cp -R "$REPO_ROOT/smoke/fixture" "$WORK"
cd "$WORK" || fail "no scratch worktree"
git init -q -b main
git add -A
git commit -q -m "search-smoke fixture seed"
timeout "$STEP_TIMEOUT" env HOME="$SCRATCH_HOME" OPENROUTER_API_KEY="$OPENROUTER_API_KEY" \
	"$PI_BIN" install -l "$REPO_ROOT" >"$OUT/pi-install.log" 2>&1 \
	|| fail "pi install -l failed (see $OUT/pi-install.log)"
grep -q "$REPO_ROOT" .pi/settings.json || fail ".pi/settings.json does not pin $REPO_ROOT"

# --- 3. R-2 decode-parity preflight (binding ruling, spec §3) ---
# Against the npm-installed 0.84.3 dist, via NODE_PATH into the pinned
# node_modules (pi-tui is nested under pi-coding-agent there). Covers the full
# driver byte table; the two required assertions are the first two.
echo "search-smoke: R-2 decode-parity preflight (pinned ${PI_VERSION})"
if ! NODE_PATH="$PREFIX/node_modules/@earendil-works/pi-coding-agent/node_modules" \
	node -e '
		const tui = require("@earendil-works/pi-tui");
		const asserts = [
			[tui.decodeKittyPrintable("\x1b[47u") === "/", "decode /"],
			[tui.matchesKey("\x1b[127u", "backspace") === true, "backspace"],
			[tui.decodeKittyPrintable("\x1b[99u") === "c", "decode c"],
			[tui.decodeKittyPrintable("\x1b[108u") === "l", "decode l"],
			[tui.decodeKittyPrintable("\x1b[97u") === "a", "decode a"],
			[tui.decodeKittyPrintable("\x1b[122u") === "z", "decode z"],
			[tui.decodeKittyPrintable("\x1b[233u") === "\u00e9", "decode \u00e9"],
			[tui.matchesKey("\x1b[27u", "escape") === true, "escape"],
			[tui.matchesKey("\r", "enter") === true, "enter"],
			[tui.matchesKey("\x1b[B", "down") === true, "legacy down (flag-1 scope)"],
			[tui.matchesKey("\x1b[A", "up") === true, "legacy up (flag-1 scope)"],
			[tui.isKeyRelease("\x1b[47u") === false, "press-only form"],
		];
		const failed = asserts.filter(([ok]) => !ok).map(([, n]) => n);
		if (failed.length > 0) {
			console.error("0.84.3 decode parity failed: " + failed.join(", "));
			process.exit(1);
		}
	' >"$OUT/r2-preflight.log" 2>&1; then
	fail "0.84.3 decode parity failed (R-2 guard, see $OUT/r2-preflight.log) — pinned ${PI_VERSION} vs installed pi-tui differ; do not boot the TUI session"
fi

# --- 4. headless usage-line probe (misroute tripwire, spec §5) ---
echo "search-smoke: headless usage-line probe"
timeout "$STEP_TIMEOUT" env HOME="$SCRATCH_HOME" OPENROUTER_API_KEY="$OPENROUTER_API_KEY" \
	"$PI_BIN" --approve -p "/council-models" >"$OUT/headless.txt" 2>&1 \
	|| fail "headless /council-models did not settle under the pinned pi"
grep -Fq "$USAGE_LINE" "$OUT/headless.txt" \
	|| fail "headless preflight: R-2 usage line missing (misroute tripwire) — see $OUT/headless.txt"

# --- 5. pty TUI session (frames 1-8 + the é falsifier) ---
echo "search-smoke: driving the pty TUI session"
env HOME="$SCRATCH_HOME" WORK_DIR="$WORK" PI_BIN="$PI_BIN" OPENROUTER_API_KEY="$OPENROUTER_API_KEY" \
	TERM=xterm-256color python3 -B "$REPO_ROOT/smoke/search-smoke/driver.py" "$OUT"
DRIVER_STATUS=$?
if [ "$DRIVER_STATUS" -ne 0 ]; then
	fail "driver.py exited $DRIVER_STATUS — frames red (artifacts kept at smoke/.artifacts/search-smoke/$TS)"
fi

# Prune to the last $KEEP runs.
#
# Pruning is best-effort housekeeping and must never invert a green frame
# verdict: the artifacts tree is bind-mounted into the Docker smoke path,
# whose container runs as root, so a container run can leave root-owned run
# dirs here that this user cannot remove (and a dir can be unremovable for
# other reasons, e.g. own-permission). We prune every entry we legitimately
# can, and every entry that cannot be removed is named in a visible warning
# on stderr — prune failures are never silent.
pruned=0
unremovable=0
while IFS= read -r d; do
	if rm -rf -- "$d" 2>/dev/null; then
		pruned=$((pruned + 1))
	else
		unremovable=$((unremovable + 1))
		if [ -O "$d" ]; then
			echo "search-smoke: prune: cannot remove own run dir $d (permissions) — restore access and remove by hand" >&2
		else
			echo "search-smoke: prune: cannot remove foreign-owned run dir $d (e.g. root-owned from a Docker bind-mount run) — left in place" >&2
		fi
	fi
done < <(ls -1dt "$REPO_ROOT"/smoke/.artifacts/search-smoke/2* 2>/dev/null | tail -n +$((KEEP + 1)))
if [ "$unremovable" -gt 0 ]; then
	echo "search-smoke: prune: pruned $pruned, left $unremovable in place — verdict unaffected; remove by hand if you own them" >&2
fi

echo "SMOKE PASS — kitty search-smoke, 9 frames green (artifacts: smoke/.artifacts/search-smoke/$TS)"