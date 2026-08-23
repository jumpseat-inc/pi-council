#!/usr/bin/env bash
#
# discover-docs.sh — Enumerate pre-existing documentation across the monorepo and
# classify each file vs. what the vault has already ingested.
#
# Output: a TSV report on stdout, one row per candidate doc:
#   STATUS \t path \t type \t current_commit \t current_date \t recorded_commit
# STATUS is NEW | CHANGED | UNCHANGED | DELETED (relative to the manifest).
# A per-type summary is written to stderr.
#
# Source of truth is the codebase: each row pins the doc to its CURRENT commit,
# so the exact text is always recoverable with `git show <commit>:<path>` and
# drift is detectable by comparing current_commit to recorded_commit.
#
# Usage: discover-docs.sh [manifest-path]
#   manifest defaults to <repo-root>/vault/.repo-docs.tsv
#   manifest columns (written by the skill after ingest): path \t commit \t ...
#
# Compatible with bash 3.2 (macOS default): no associative arrays, no mapfile.
#
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
MANIFEST="${1:-$ROOT/vault/.repo-docs.tsv}"
cd "$ROOT"

classify() {
  local p="$1"
  case "$p" in
    */adr/*|*/decisions/*|docs/adr/*|docs/decisions/*) echo adr ;;
    .claude/skills/*/SKILL.md|*/.claude/skills/*/SKILL.md) echo skill ;;
    README.md|*/README.md)                 echo readme ;;
    *ARCHITECTURE*.md)                      echo architecture ;;
    *CONTRIBUTING*.md)                      echo contributing ;;
    *CHANGELOG*.md)                         echo changelog ;;
    AGENTS.md|*/AGENTS.md)                  echo agents ;;
    */CLAUDE.md)                            echo claude-md ;;
    .cursor/rules/*|*/.cursor/rules/*|*.mdc) echo agent-rules ;;
    .github/copilot-instructions.md)        echo agent-rules ;;
    docs/*|*/docs/*)                        echo docs ;;
    *)                                      echo markdown ;;
  esac
}

excluded() {
  local p="$1"
  case "$p" in
    vault/*) return 0 ;;                                   # never ingest the wiki into itself
    CLAUDE.md) return 0 ;;                                 # root config, not documentation
    .claude/skills/ingesting-repo-docs/*) return 0 ;;      # this skill's own files
    .claude/skills/*/SKILL.md|*/.claude/skills/*/SKILL.md) return 1 ;;  # KEEP existing skills
    .claude/*|*/.claude/*) return 0 ;;                     # other .claude config: commands, hooks, settings
    .github/copilot-instructions.md) return 1 ;;           # KEEP agent rules
    .github/*|*/.github/*) return 0 ;;                     # drop PR/issue templates etc.
    *) return 1 ;;
  esac
}

# recorded_commit <path> -> the commit pinned in the manifest (empty if none).
# awk lookup avoids bash 4 associative arrays.
recorded_commit() {
  [ -f "$MANIFEST" ] || return 0
  awk -F'\t' -v p="$1" '$1==p {print $2; exit}' "$MANIFEST"
}

# Track which paths we saw (for DELETED detection) in a temp file, not an array.
SEEN_FILE="$(mktemp "${TMPDIR:-/tmp}/discover-docs.XXXXXX")"
trap 'rm -f "$SEEN_FILE"' EXIT

NEW=0; CHANGED=0; UNCHANGED=0; DELETED=0

# Enumerate tracked doc candidates (git respects .gitignore: node_modules, dist, etc. are skipped)
while IFS= read -r p; do
  if excluded "$p"; then continue; fi
  printf '%s\n' "$p" >> "$SEEN_FILE"
  type="$(classify "$p")"
  read -r commit date < <(git log -1 --format='%h %cs' -- "$p" 2>/dev/null || echo "- -") || true
  rec="$(recorded_commit "$p")"
  if   [ -z "$rec" ];           then status=NEW;       NEW=$((NEW + 1))
  elif [ "$rec" != "$commit" ]; then status=CHANGED;   CHANGED=$((CHANGED + 1))
  else                               status=UNCHANGED; UNCHANGED=$((UNCHANGED + 1))
  fi
  printf '%s\t%s\t%s\t%s\t%s\t%s\n' "$status" "$p" "$type" "$commit" "$date" "${rec:--}"
done < <(git ls-files '*.md' '*.mdc' '.cursor/rules/*' 2>/dev/null | sort -u)

# DELETED: in the manifest but no longer a tracked candidate
if [ -f "$MANIFEST" ]; then
  while IFS=$'\t' read -r m_path m_commit _rest; do
    [ -z "${m_path:-}" ] && continue
    case "$m_path" in \#*) continue ;; esac
    if ! grep -Fxq "$m_path" "$SEEN_FILE"; then
      printf '%s\t%s\t%s\t%s\t%s\t%s\n' DELETED "$m_path" "-" "-" "-" "$m_commit"
      DELETED=$((DELETED + 1))
    fi
  done < "$MANIFEST"
fi

{
  echo "discover-docs: repo=$ROOT manifest=$MANIFEST"
  printf '  %-9s %d\n' NEW       "$NEW"
  printf '  %-9s %d\n' CHANGED   "$CHANGED"
  printf '  %-9s %d\n' UNCHANGED "$UNCHANGED"
  printf '  %-9s %d\n' DELETED   "$DELETED"
} >&2
