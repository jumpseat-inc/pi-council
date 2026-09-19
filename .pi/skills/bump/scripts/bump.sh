#!/usr/bin/env bash
#
# Deterministic release bump for the pi-council repository.
#
# Usage: bump.sh <major|minor|patch>
#
# Bumps the `version` field in package.json, commits it as
# `chore(release): X.Y.Z`, tags `vX.Y.Z`, force-moves the moving `latest`
# tag to the new release commit, and pushes main + both tags to origin.
#
# Preconditions (enforced): a clean working tree, the `main` branch, and a
# `vX.Y.Z` tag that does not already exist locally or on origin.
set -euo pipefail

LEVEL="${1:-}"

die() { printf 'bump: error: %s\n' "$*" >&2; exit 1; }
step() { printf '\n==> %s\n' "$*"; }

case "$LEVEL" in
	major | minor | patch) ;;
	"") die "missing bump level; usage: bump.sh <major|minor|patch>" ;;
	*) die "invalid bump level '$LEVEL'; expected major, minor, or patch" ;;
esac

command -v node >/dev/null 2>&1 || die "node is required but was not found on PATH"

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || die "not inside a git repository"
cd "$REPO_ROOT"

PKG="$REPO_ROOT/package.json"
[ -f "$PKG" ] || die "package.json not found at $PKG"

# Print the `version` field, or exit 1 with a clean message on malformed JSON.
read_version() {
	node -e '
		const fs = require("fs");
		try {
			const v = JSON.parse(fs.readFileSync(process.argv[1], "utf8")).version;
			if (typeof v !== "string" || v === "") throw new Error("missing or non-string version field");
			process.stdout.write(v);
		} catch (e) {
			console.error("bump: error: cannot read version from " + process.argv[1] + ": " + e.message);
			process.exit(1);
		}
	' "$PKG"
}

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
[ "$BRANCH" = "main" ] || die "refusing to bump on branch '$BRANCH' (expected main)"

if [ -n "$(git status --porcelain)" ]; then
	git status --short >&2
	die "working tree is not clean; commit or stash changes first"
fi

CURRENT="$(read_version)"
printf 'Current version: %s\n' "$CURRENT"

printf '%s' "$CURRENT" | grep -Eq '^[0-9]+\.[0-9]+\.[0-9]+$' ||
	die "current version '$CURRENT' is not a plain X.Y.Z semver"

IFS='.' read -r MAJ MIN PAT <<<"$CURRENT"
case "$LEVEL" in
	major) MAJ=$((MAJ + 1)); MIN=0; PAT=0 ;;
	minor) MIN=$((MIN + 1)); PAT=0 ;;
	patch) PAT=$((PAT + 1)) ;;
esac
NEXT="$MAJ.$MIN.$PAT"
printf 'Next version:    %s (%s bump)\n' "$NEXT" "$LEVEL"

step "Checking that tag v$NEXT is free"
git rev-parse -q --verify "refs/tags/v$NEXT" >/dev/null && die "tag v$NEXT already exists locally"
REMOTE_TAGS="$(git ls-remote --tags origin 2>/dev/null)" || die "cannot reach origin (git ls-remote failed)"
printf '%s\n' "$REMOTE_TAGS" | grep -q "refs/tags/v$NEXT$" && die "tag v$NEXT already exists on origin"

step "Bumping package.json $CURRENT -> $NEXT"
node -e '
const fs = require("fs");
const [file, next] = process.argv.slice(1);
const src = fs.readFileSync(file, "utf8");
const out = src.replace(/("version"\s*:\s*")[^"]*(")/, "$1" + next + "$2");
if (out === src) { console.error("bump: error: version field not found"); process.exit(1); }
fs.writeFileSync(file, out);
' "$PKG" "$NEXT"

NEW_VERSION="$(read_version)"
[ "$NEW_VERSION" = "$NEXT" ] || die "package.json version is '$NEW_VERSION' after edit (expected '$NEXT')"

step "Committing chore(release): $NEXT"
git add package.json
git commit -m "chore(release): $NEXT"

step "Tagging v$NEXT and moving latest"
git tag "v$NEXT"
git tag -f latest

step "Pushing main"
git push origin main

step "Pushing tag v$NEXT"
git push origin "v$NEXT"

step "Force-pushing latest"
# `latest` is a moving tag: it is re-pointed at each release, so updating it
# on the remote is necessarily a non-fast-forward and needs --force.
git push -f origin latest

printf '\nReleased v%s (was %s).\n' "$NEXT" "$CURRENT"
printf '  commit: %s\n' "$(git rev-parse --short HEAD)"
printf '  branch: main -> origin/main\n'
printf '  tags:   v%s, latest\n' "$NEXT"