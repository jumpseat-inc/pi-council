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
