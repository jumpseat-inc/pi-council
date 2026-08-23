#!/usr/bin/env bash
#
# setup-llm-wiki.sh — Scaffold a Karpathy-style LLM Wiki inside a monorepo.
#
# Layout produced (paths relative to the monorepo root):
#   vault/                     the wiki (its own subtree)
#     CLAUDE.md                wiki schema — NESTED memory: loads on demand when
#                              Claude Code reads files under vault/, so it never
#                              pollutes the rest of the monorepo
#     raw/                     immutable sources (raw/assets/ for images)
#     wiki/                    LLM-generated pages
#       index.md  log.md  sources/
#     .gitignore               vault-scoped Obsidian noise
#   .claude/commands/          slash commands, available from the ROOT
#     wiki-ingest.md  wiki-query.md  wiki-lint.md
#
# Claude Code is launched from the monorepo ROOT, therefore:
#   - commands live in the ROOT .claude/commands and use vault/-prefixed paths
#   - the schema lives at vault/CLAUDE.md (NOT root) and loads only on demand
#   - the Obsidian vault you open is vault/ (sees raw + wiki); Claude's working
#     directory is the monorepo root. They are intentionally different.
#
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
VAULT="$ROOT/vault"
CMDS="$ROOT/.claude/commands"

echo "Monorepo root : $ROOT"
echo "Vault         : $VAULT"
echo "Commands      : $CMDS"
echo

if [ -e "$VAULT" ]; then
  echo "ERROR: $VAULT already exists. Move/rename it and re-run." >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# 1. Vault skeleton (three layers: raw / wiki / schema)
# ---------------------------------------------------------------------------
mkdir -p "$VAULT/raw/assets" "$VAULT/wiki/sources"
touch "$VAULT/raw/assets/.gitkeep" "$VAULT/wiki/sources/.gitkeep"  # keep empty dirs in git

# index.md — the content catalog (read first on every query)
cat > "$VAULT/wiki/index.md" <<'INDEX'
# Wiki Index

Catalog of every wiki page. On a query, read this first, then drill into the
relevant pages. Each entry: link + one-line summary (+ optional metadata).

## Overviews

## Entities

## Concepts

## Comparisons

## Sources
INDEX

# log.md — append-only timeline (newest first); first entry stamped today
{
  printf '<!-- Append-only. Newest entries at top. Format: ## [YYYY-MM-DD] <op> | <title> -->\n\n'
  printf '## [%s] scaffold | LLM Wiki initialized\n' "$(date +%F)"
  printf 'Vault scaffolded; index.md and log.md created. No sources ingested yet.\n'
} > "$VAULT/wiki/log.md"

# vault-scoped gitignore (the monorepo's own git tracks the vault; no nested repo)
cat > "$VAULT/.gitignore" <<'GITIGNORE'
.obsidian/workspace*.json
.obsidian/cache
.trash/
.llm-wiki-bootstrap.md
GITIGNORE

# ---------------------------------------------------------------------------
# 2. The schema — vault/CLAUDE.md (nested memory, loads on demand under vault/)
# ---------------------------------------------------------------------------
cat > "$VAULT/CLAUDE.md" <<'SCHEMA'
# LLM Wiki — Schema & Operating Rules

This subtree is an LLM-maintained wiki (the Karpathy pattern). You are the wiki
maintainer, not a chatbot. The human curates sources, directs analysis, and asks
questions; you do the bookkeeping — summarizing, cross-referencing, filing, and
keeping pages consistent. Obsidian is the IDE, you are the programmer, the wiki
is the codebase.

PATHS: Claude Code runs from the monorepo root, so every path below is written
relative to that root (e.g. `vault/raw/`, `vault/wiki/index.md`).

## Three layers
- `vault/raw/`       Immutable sources (articles, transcripts, PDFs, data;
                     images in `vault/raw/assets/`). READ these, NEVER edit or
                     delete them. Source of truth.
- `vault/wiki/`      Everything you generate: source summaries, entity pages,
                     concept pages, comparisons, overviews, synthesis. You OWN it.
- `vault/CLAUDE.md`  This schema. We co-evolve it as we learn what works.

## wiki/ structure
- `vault/wiki/sources/`  One summary page per ingested raw source.
- `vault/wiki/`          Entity / concept / comparison / overview pages, flat
                         (Obsidian resolves `[[links]]` by note name, not path).
- `vault/wiki/index.md`  The catalog (below).
- `vault/wiki/log.md`    The append-only timeline, newest first (below).

## Page format — every wiki page begins with frontmatter
---
title: Exact Page Title
type: source | entity | concept | comparison | overview | synthesis
summary: One sharp sentence. You read this first to judge relevance.
aliases: [synonyms so links resolve]
tags: [topic/subtopic]
sources: ["[[2026-06-24-some-article]]"]
created: YYYY-MM-DD
updated: YYYY-MM-DD
---
Body in concise prose. Link every concept that has (or should have) a page with
`[[wikilinks]]`. End with `## Related` and `## Sources`.

## index.md
Categorized list of every wiki page: link + that page's one-line summary +
optional metadata. Sections: Overviews, Entities, Concepts, Comparisons,
Sources. Update on EVERY ingest. On a query, read this FIRST to find candidates.

## log.md — newest entry at top
Each entry: `## [YYYY-MM-DD] <op> | <title>` (op = ingest | query | lint), then
1-3 lines: what happened, pages touched, key takeaway. Keep it greppable.

## Operations

### Ingest
1. Read the source under `vault/raw/` fully.
2. Discuss key takeaways with me BEFORE writing — what's new, surprising, what
   it connects to. Wait for my steer.
3. Write a summary page in `vault/wiki/sources/` (type: source).
4. Create or update the entity/concept pages it affects. One source typically
   touches 10-15 pages — don't be shy.
5. Cross-link both directions. Where the source CONTRADICTS or supersedes an
   existing claim, flag it explicitly — never silently overwrite.
6. Update `vault/wiki/index.md`.  7. Append to `vault/wiki/log.md`.
8. Report: pages created, pages updated, contradictions flagged.
Default: one source at a time, me in the loop. Batch only if I say so.

### Query
1. Read `vault/wiki/index.md`, then the relevant pages.
2. Answer grounded in the wiki, citing the pages used (e.g. "per [[Concept X]]").
   If the wiki doesn't cover it, say so — don't fill the gap from general
   knowledge without flagging it.
3. When the answer is itself valuable (a comparison, analysis, connection),
   OFFER to file it back as a new wiki page so explorations compound.

### Lint
Scan for: contradictions, stale claims newer sources superseded, orphan pages
(no inbound links), concepts mentioned but lacking a page, missing
cross-references, gaps a web search could fill. Report prioritized; fix the
mechanical ones, ask me about judgment calls.

## Rules
- vault/raw/ is immutable. Track ingestion in log.md, never by moving raw files.
- One concept per page. Evergreen Title Case filenames. Pick ONE canonical term
  per concept (always "RAG"; alias "retrieval augmented generation").
- Keep the one-line `summary` sharp — it's how we both scan relevance.
- Update `updated` whenever you touch a page. Label synthesis as synthesis.
SCHEMA

# ---------------------------------------------------------------------------
# 3. Slash commands at the ROOT (run from monorepo root; vault/-prefixed paths)
# ---------------------------------------------------------------------------
mkdir -p "$CMDS"

cat > "$CMDS/wiki-ingest.md" <<'INGEST'
---
description: Ingest a source into the LLM wiki under vault/
argument-hint: [path-or-filename under vault/raw/]
---
Read `vault/CLAUDE.md` first for the schema and conventions.

Ingest this source: $ARGUMENTS
(If given a bare filename, resolve it under `vault/raw/`.)

Follow the Ingest operation in vault/CLAUDE.md exactly: discuss takeaways with me
first, then write the source summary in `vault/wiki/sources/`, create/update the
affected entity and concept pages, cross-link both directions, flag any
contradictions, update `vault/wiki/index.md`, and append to `vault/wiki/log.md`.
Then report pages created, pages updated, and contradictions flagged.
INGEST

cat > "$CMDS/wiki-query.md" <<'QUERY'
---
description: Answer a question from the LLM wiki under vault/
argument-hint: [your question]
---
Read `vault/CLAUDE.md` first for the conventions.

Answer from the wiki: $ARGUMENTS

Read `vault/wiki/index.md` first, drill into the relevant pages, and answer with
citations to the pages used (e.g. "per [[Concept X]]"). If the wiki doesn't cover
it, say so plainly rather than filling the gap from general knowledge. If the
answer is worth keeping, offer to file it back as a new page under `vault/wiki/`.
QUERY

cat > "$CMDS/wiki-lint.md" <<'LINT'
---
description: Health-check the LLM wiki under vault/
---
Read `vault/CLAUDE.md` first.

Run the Lint operation across `vault/wiki/`: scan for contradictions, stale
claims, orphan pages (no inbound links), concepts mentioned but lacking a page,
missing cross-references, and gaps a web search could fill. Report a prioritized
list. Fix the mechanical issues; ask me about judgment calls before changing
substantive content.
LINT

# ---------------------------------------------------------------------------
# 4. Skill — discover & ingest pre-existing repo docs into the vault.
#     Installed at the ROOT .claude/skills so Claude Code auto-discovers it.
# ---------------------------------------------------------------------------
SKILL_DIR="$ROOT/.claude/skills/ingesting-repo-docs"
mkdir -p "$SKILL_DIR"

cat > "$SKILL_DIR/SKILL.md" <<'SKILL_MD_EOF'
---
name: ingesting-repo-docs
description: Use when seeding or refreshing the vault wiki from a monorepo's own documentation — docs/ folders, README / ARCHITECTURE / CONTRIBUTING / ADR / CHANGELOG files, AGENTS.md, .cursor/rules, or existing .claude/skills SKILL.md in the root or any subrepo — and when those docs have changed since they were last ingested.
---

# Ingesting Repo Docs

## Overview

A monorepo already contains scattered documentation. This skill discovers it,
ingests it into the vault wiki, and keeps it pinned to the commit it came from
so drift is detectable.

**Foundational principle: docs drift; the codebase is the source of truth.**
Repo docs are secondary sources — a snapshot of intent that may already be wrong.
Every page this skill produces says so, and when a doc contradicts the code, the
code wins.

**No copies.** A repo doc's immutable source is the file *at a commit*,
recoverable with `git show <commit>:<path>`. Pin the commit; don't duplicate the
doc into `vault/raw/`. (External sources — articles, PDFs — still go there.)

## When to use

- First-time seeding of the wiki from an existing repo's docs.
- Refresh after docs changed (drift): re-ingest only what moved.

**Not** for a single new external source — use `/wiki-ingest`. Not for the root
`CLAUDE.md` (config) or `vault/CLAUDE.md` (schema); the discovery script already
excludes them.

## What counts as a doc source

| Pattern | type |
|---|---|
| `docs/**`, `**/docs/**` (any package) | docs |
| `**/adr/**`, `**/decisions/**` | adr |
| `README.md` (root and every subrepo) | readme |
| `ARCHITECTURE*.md`, `CONTRIBUTING*.md`, `CHANGELOG*.md` | architecture / contributing / changelog |
| `AGENTS.md`, nested `**/CLAUDE.md` (not root, not vault) | agents / claude-md |
| `.cursor/rules/**`, `*.mdc`, `.github/copilot-instructions.md` | agent-rules |
| `**/.claude/skills/**/SKILL.md` (root and subrepos) | skill |

Excluded: `vault/**`, root `CLAUDE.md`, everything under `.claude/**` *except*
existing skills' `SKILL.md`, `.github/**` except `copilot-instructions.md`, this
skill, and anything gitignored (`node_modules`, `dist`, vendored deps).

## Workflow

1. **Discover.** Run the bundled script from the repo root:
   `bash .claude/skills/ingesting-repo-docs/discover-docs.sh`
   It prints a TSV — `STATUS \t path \t type \t commit \t date \t recorded_commit`
   — where STATUS is NEW | CHANGED | UNCHANGED | DELETED vs. the manifest at
   `vault/.repo-docs.tsv`. A per-type count goes to stderr.
2. **Review with the human.** Show the candidate list. Prune false positives
   (auto-generated docs, boilerplate, templates) before ingesting. Skip
   `UNCHANGED`. Confirm before bulk-ingesting.
3. **Ingest** each NEW/CHANGED doc using the Ingest operation in `vault/CLAUDE.md`
   (discuss → source summary → update entity/concept pages → cross-link → index →
   log). Read the doc at its current commit. This skill adds the contract below.
4. **Record the pin.** Append one line per ingested doc to `vault/.repo-docs.tsv`:
   `path \t commit \t captured-date \t [[wiki source page]] \t type`
5. **Handle CHANGED / DELETED.** CHANGED: re-ingest, bump `updated`, note what
   moved in `log.md`, and re-check claims the old version supported. DELETED: mark
   the derived pages `source: missing` and flag for the human — don't auto-delete.

## REQUIRED output contract

Every wiki page derived from a repo doc MUST carry, with no exceptions:

**Frontmatter additions:**
```yaml
provenance: repo-doc
source_path: packages/api/docs/endpoints.md
source_commit: 341b9b8
captured: 2026-06-25
```

**A banner as the first body line:**
```markdown
> ⚠️ Derived from `packages/api/docs/endpoints.md` @ `341b9b8` (captured 2026-06-25).
> Docs drift; the codebase is the source of truth — verify against code before relying on this.
```

A page missing the banner or the `source_*` frontmatter is not done. This is a
structural requirement, not a reminder.

## Common mistakes

- **Ingesting the vault into itself** — `vault/**` must stay excluded.
- **Dropping the banner** because the doc "looks authoritative." It is exactly
  those that mislead once code moves. Banner every page.
- **Re-snapshotting UNCHANGED docs** — the manifest exists to make ingest
  idempotent. Skip them.
- **Letting a doc override code.** When a doc contradicts the codebase, record
  the contradiction on the page and treat the code as correct.
- **Copying docs into `vault/raw/`** — pin the commit instead; `git show` recovers
  exact text without duplicating the monorepo.

## A note on testing this skill

Per the writing-skills methodology (obra/superpowers), baseline-test a skill with
subagents — watch an agent handle a messy repo *without* it, capture the failures,
confirm the skill fixes them. This one ships un-pressure-tested against your repo;
do a RED/GREEN pass on a branch before trusting it on the whole tree.
SKILL_MD_EOF

cat > "$SKILL_DIR/discover-docs.sh" <<'DISCOVER_SH_EOF'
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
DISCOVER_SH_EOF
chmod +x "$SKILL_DIR/discover-docs.sh"

# ---------------------------------------------------------------------------
# 5. Bootstrap message -> clipboard.
#     Fetches Karpathy's pattern from its canonical URL (it is an "idea file
#     designed to be copy-pasted into your agent"), prepends it to an orientation
#     message, and copies the whole thing to the OS clipboard. Degrades fine
#     offline: vault/CLAUDE.md already carries the operational rules.
# ---------------------------------------------------------------------------
GIST_URL="https://gist.githubusercontent.com/karpathy/442a6bf555914893e9891c11519de94f/raw/ac46de1ad27f92b28ac95459c782c07f6b8c964a/llm-wiki.md"
BOOTSTRAP_FILE="$VAULT/.llm-wiki-bootstrap.md"

fetch_url() {  # $1=url -> stdout; non-zero on failure
  if   command -v curl >/dev/null 2>&1; then curl -fsSL --max-time 20 "$1"
  elif command -v wget >/dev/null 2>&1; then wget -qO- --timeout=20 "$1"
  else return 1; fi
}

copy_to_clipboard() {  # reads stdin -> OS clipboard; non-zero if no tool found
  local os; os="$(uname -s 2>/dev/null || echo unknown)"
  case "$os" in
    Darwin)
      command -v pbcopy >/dev/null 2>&1 && { pbcopy; return 0; } ;;
    Linux)  # native Linux or WSL
      if grep -qiE 'microsoft|wsl' /proc/version 2>/dev/null && command -v clip.exe >/dev/null 2>&1; then
        clip.exe; return 0; fi
      if [ -n "${WAYLAND_DISPLAY:-}" ] && command -v wl-copy >/dev/null 2>&1; then wl-copy; return 0; fi
      command -v xclip  >/dev/null 2>&1 && { xclip -selection clipboard; return 0; }
      command -v xsel   >/dev/null 2>&1 && { xsel --clipboard --input;   return 0; }
      command -v wl-copy >/dev/null 2>&1 && { wl-copy;                   return 0; } ;;
    MINGW*|MSYS*|CYGWIN*)  # Git Bash / MSYS / Cygwin on Windows
      command -v clip     >/dev/null 2>&1 && { clip;     return 0; }
      command -v clip.exe >/dev/null 2>&1 && { clip.exe; return 0; } ;;
  esac
  return 1
}

GIST="$(fetch_url "$GIST_URL" 2>/dev/null || true)"

{
  [ -n "$GIST" ] && printf '%s\n\n---\n\n' "$GIST"
  cat <<'ORIENT'
The text above (if present) is Andrej Karpathy's LLM Wiki pattern. This monorepo
has already been scaffolded to follow it:

- vault/CLAUDE.md            the schema/rules for maintaining the wiki
- vault/wiki/{index,log}.md  the catalog and timeline (currently empty)
- vault/wiki/sources/        one summary page per ingested source
- vault/raw/                 drop external sources (articles, PDFs) here
- /wiki-ingest /wiki-query /wiki-lint   slash commands (run from this root)
- skill: ingesting-repo-docs  seeds the wiki from this repo's own existing docs

Read vault/CLAUDE.md so you understand the conventions, then confirm you
understand the structure. Do NOT ingest anything yet. Tell me you're ready and
list my options to start: (a) ingest an external source I drop in vault/raw/, or
(b) seed the wiki from this repo's existing docs.
ORIENT
} > "$BOOTSTRAP_FILE"

OS_NAME="$(uname -s 2>/dev/null || echo unknown)"
if copy_to_clipboard < "$BOOTSTRAP_FILE"; then
  CLIP_STATUS="copied to clipboard (detected: $OS_NAME) - open Claude Code and paste."
else
  CLIP_STATUS="no clipboard tool found on $OS_NAME. Copy it manually from $BOOTSTRAP_FILE (Linux: install xclip, xsel, or wl-clipboard)."
fi
if [ -n "$GIST" ]; then
  GIST_STATUS="pattern fetched from Karpathy's gist."
else
  GIST_STATUS="gist not fetched (offline?) - bootstrap still works; paste it later from $GIST_URL"
fi

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------
echo "LLM Wiki scaffolded."
echo
echo "Created:"
echo "  vault/{CLAUDE.md, raw/assets, wiki/{index.md,log.md,sources}, .gitignore}"
echo "  .claude/commands/{wiki-ingest, wiki-query, wiki-lint}.md"
echo "  .claude/skills/ingesting-repo-docs/{SKILL.md, discover-docs.sh}"
echo
echo "Bootstrap: $GIST_STATUS"
echo "Bootstrap: $CLIP_STATUS"
echo
echo "Next:"
echo "  1. Obsidian -> 'Open folder as vault' -> select  $VAULT"
echo "  2. From the monorepo ROOT, run:  claude"
echo "  3. Paste (Cmd/Ctrl+V). Claude reads vault/CLAUDE.md and confirms it's"
echo "     ready - it won't ingest anything yet."
echo "  4. Drop a source in  vault/raw/  then:  /wiki-ingest <filename>"
echo "  5. Ask with  /wiki-query ... ; health-check with  /wiki-lint"
echo "  6. Seed from existing docs:  'ingest this repo's existing docs into the vault'"
echo
echo "Commit with the monorepo's own git (no nested repo needed)."
