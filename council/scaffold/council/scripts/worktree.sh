#!/usr/bin/env bash
# Council worktree discipline — the single deterministic entry point for every
# git worktree the council creates or removes.
#
# Canonical root: <repo>/<config-dir>/council/worktrees/<slug>/
# (see docs/superpowers/specs/2026-09-28-council-worktrees-design.md). The root
# is self-ignoring, like council/runs/. This script derives the repo root from
# its own location and never hardcodes the config dir: @CONFIG_DIR@ is rendered
# at scaffold-copy time, and COUNCIL_CONFIG_DIR overrides for tests/tools.
#
# Subcommands:
#   create <slug> [--branch <name>] [--base <ref>] [--detach]
#   list
#   check                 exit 1 if any council-owned worktree remains
#   remove <slug> [--force]
#   prune [--force]       remove every council-owned registered worktree
#   prune-scratch         remove unregistered eval-* copy dirs under the root
#   sweep [--force]       prune + prune-scratch
#
# create is idempotent; remove/prune refuse a worktree that is dirty or whose
# branch has unpushed commits / no upstream unless --force is passed.
set -u

DEFAULT_CONFIG_DIR='@CONFIG_DIR@'
# When run unrendered (packaged source, ad-hoc tests), fall back rather than
# carrying a literal token into a path.
case "$DEFAULT_CONFIG_DIR" in *'@'*) DEFAULT_CONFIG_DIR="${COUNCIL_CONFIG_DIR:-.pi}" ;; esac
CONFIG_DIR="${COUNCIL_CONFIG_DIR:-$DEFAULT_CONFIG_DIR}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd -P)"
ROOT="$REPO_ROOT/$CONFIG_DIR/council/worktrees"

note() { printf '%s\n' "$*"; }
skip() { printf 'SKIP: %s\n' "$*" >&2; }
fail() { printf 'FAIL: %s\n' "$*" >&2; exit 1; }

usage() {
	cat >&2 <<'EOF'
usage: worktree.sh <create|list|check|remove|prune|prune-scratch|sweep> [args]
  create <slug> [--branch <name>] [--base <ref>] [--detach]
  remove <slug> [--force]
  prune|sweep [--force]
EOF
	exit 2
}

validate_slug() {
	case "$1" in
		'' | -*) fail "invalid slug: '$1'" ;;
	esac
	case "$1" in
		*'..'* | /* | *' '*) fail "invalid slug: '$1'" ;;
	esac
	case "$1" in
		*[!A-Za-z0-9._/-]*) fail "invalid slug: '$1'" ;;
	esac
}

ensure_root() {
	mkdir -p "$ROOT"
	[ -f "$ROOT/.gitignore" ] || printf '*\n' >"$ROOT/.gitignore"
}

registered_paths() {
	git -C "$REPO_ROOT" worktree list --porcelain 2>/dev/null | awk '/^worktree /{sub(/^worktree /, ""); print}'
}

is_registered() {
	registered_paths | grep -Fxq "$1"
}

council_worktrees() {
	local w
	while IFS= read -r w; do
		case "$w" in
			"$ROOT"/*) printf '%s\n' "$w" ;;
		esac
	done < <(registered_paths)
}

is_dirty() {
	[ -n "$(git -C "$1" status --porcelain 2>/dev/null)" ]
}

# True when the worktree is on a branch that is not fully pushed: no upstream,
# or commits ahead of the upstream. Detached HEAD is treated as not-unpushed
# (there is no branch to lose).
branch_is_unpushed() {
	local p="$1" br up ahead
	br="$(git -C "$p" rev-parse --abbrev-ref HEAD 2>/dev/null || true)"
	[ "$br" = "HEAD" ] && return 1
	up="$(git -C "$p" rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>/dev/null || true)"
	[ -z "$up" ] && return 0
	ahead="$(git -C "$p" rev-list --count '@{u}..HEAD' 2>/dev/null || echo 1)"
	[ "$ahead" != "0" ]
}

# remove_one <path> <force 0|1> — returns 0 removed, 1 refused (reason on stderr).
remove_one() {
	local p="$1" force="$2"
	if [ ! -e "$p" ]; then
		note "absent: $p"
		return 0
	fi
	if [ "$force" -eq 0 ]; then
		if is_dirty "$p"; then
			skip "dirty worktree (uncommitted changes): $p"
			return 1
		fi
		if branch_is_unpushed "$p"; then
			skip "unpushed commits or no upstream: $p"
			return 1
		fi
	fi
	if [ "$force" -eq 1 ]; then
		git -C "$REPO_ROOT" worktree remove --force "$p" || return 1
	else
		git -C "$REPO_ROOT" worktree remove "$p" || return 1
	fi
}

cmd_create() {
	local slug="$1" branch="$2" base="$3" detach="$4" p
	validate_slug "$slug"
	p="$ROOT/$slug"
	ensure_root
	if is_registered "$p"; then
		note "$p"
		return 0
	fi
	if [ -e "$p" ]; then
		fail "path exists but is not a registered worktree: $p"
	fi
	[ -n "$base" ] || base="HEAD"
	if [ "$detach" -eq 1 ]; then
		git -C "$REPO_ROOT" worktree add --detach "$p" "$base" >/dev/null 2>&1 || fail "git worktree add failed for $p"
	else
		[ -n "$branch" ] || branch="$slug"
		if git -C "$REPO_ROOT" show-ref --verify --quiet "refs/heads/$branch"; then
			git -C "$REPO_ROOT" worktree add "$p" "$branch" >/dev/null 2>&1 || fail "git worktree add failed for $p"
		else
			git -C "$REPO_ROOT" worktree add -b "$branch" "$p" "$base" >/dev/null 2>&1 || fail "git worktree add failed for $p"
		fi
	fi
	note "$p"
}

cmd_list() {
	council_worktrees
}

cmd_check() {
	local w found=0
	while IFS= read -r w; do
		[ -n "$w" ] || continue
		printf 'FAIL: residual council worktree: %s\n' "$w" >&2
		found=1
	done < <(council_worktrees)
	[ "$found" -eq 0 ] || return 1
	note "OK: no resident council worktrees"
}

cmd_remove() {
	local slug="$1" force="$2" p
	validate_slug "$slug"
	p="$ROOT/$slug"
	ensure_root
	if ! is_registered "$p"; then
		if [ ! -e "$p" ]; then
			note "absent: $p"
			return 0
		fi
		fail "not a registered council worktree: $p"
	fi
	if ! remove_one "$p" "$force"; then
		fail "refused to remove $p (use --force to override)"
	fi
	note "removed: $p"
}

cmd_prune() {
	local force="$1" w rc=0
	ensure_root
	while IFS= read -r w; do
		[ -n "$w" ] || continue
		if ! remove_one "$w" "$force"; then
			rc=1
		else
			note "removed: $w"
		fi
	done < <(council_worktrees)
	return $rc
}

cmd_prune_scratch() {
	[ -d "$ROOT" ] || return 0
	local d
	for d in "$ROOT"/eval-*; do
		[ -e "$d" ] || continue
		is_registered "$d" && continue
		rm -rf "$d" && note "removed scratch: $d"
	done
}

cmd_sweep() {
	local force="$1" rc=0
	ensure_root
	cmd_prune "$force" || rc=1
	cmd_prune_scratch || rc=1
	return $rc
}

[ $# -ge 1 ] || usage
cmd="$1"
shift

case "$cmd" in
	create)
		slug="" branch="" base="" detach=0
		[ $# -ge 1 ] || usage
		slug="$1"
		shift
		while [ $# -gt 0 ]; do
			case "$1" in
				--branch)
					branch="${2:-}"
					shift 2
					;;
				--base)
					base="${2:-}"
					shift 2
					;;
				--detach)
					detach=1
					shift
					;;
				*) usage ;;
			esac
		done
		cmd_create "$slug" "$branch" "$base" "$detach"
		;;
	list)
		cmd_list
		;;
	check)
		cmd_check
		;;
	remove)
		slug="${1:-}"
		[ -n "$slug" ] || usage
		shift
		force=0
		[ "${1:-}" = "--force" ] && force=1
		cmd_remove "$slug" "$force"
		;;
	prune)
		force=0
		[ "${1:-}" = "--force" ] && force=1
		cmd_prune "$force"
		;;
	prune-scratch)
		cmd_prune_scratch
		;;
	sweep)
		force=0
		[ "${1:-}" = "--force" ] && force=1
		cmd_sweep "$force"
		;;
	*) usage ;;
esac