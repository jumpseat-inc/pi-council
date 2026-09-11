---
title: Preflight
type: concept
summary: The shell+script standard fixture that gates every council run — card-aware checks, MCP registration/auth, superpowers + ask-user-question pins, openrouter auth, and the lock-drift tripwire; any FAIL: line halts startup.
aliases: [preflight gate]
tags: [pi-council/concept]
sources: ["[[2026-08-24-ask-user-question]]", "[[2026-09-06-epic6-close-run-ledger]]", "[[2026-09-11-epic7-run-ledger]]"]
created: 2026-08-23
updated: 2026-09-11
---

# Preflight

> ⚠️ Derived from `council/scaffold/council/preflight.sh` (a template, non-doc), `council/procedures/council.md` (step 0), `council/procedures/features-deliver.md` (Phase 0), `council/procedures/features-new.md` (step 0) (captured 2026-08-23). Verify against the file.

`council/preflight.sh` (scaffolded by `/council-init`, with `@CONFIG_DIR@` rendered
at copy time) is the deterministic gate that must pass **before any council run
starts**. The facilitator runs it at `/council` step 0, and `features-deliver.md`
Phase 0 runs it once for an epic.

## What it checks (fail-fast)

- **superpowers** present project-locally (clone under
  `$CONFIG_DIR_NAME/git/github.com/obra/superpowers` or pin in
  `$CONFIG_DIR_NAME/settings.json`) — else `FAIL`.
- **ask-user-question** present project-locally (clone under
  `$CONFIG_DIR_NAME/npm/node_modules/@juicesharp/rpiv-ask-user-question` or pin
  in `$CONFIG_DIR_NAME/settings.json`) — else `FAIL`.
- **Project tooling** — the shipped scaffold checks none by default; it
  invites the repo to add its own build-tool, project-root, and dependency
  checks (the council imposes no language or runtime).
- **Card-aware**: `council/cards/<card>.md` exists when given.
- **main fast-forwards** from origin.
- **MCP gate** (context7 + tavily): registration present + stored credentials
  present. Structural only, not a live OAuth probe.
- **OpenRouter provider authorized** (v0.5.0) — API key source or stored auth.
- **Lock-drift tripwire** (v0.18.0, FLLWUP-24) — `council/check-pi-drift.sh`
  compares the installed `@earendil-works/pi-coding-agent` version against
  `bun.lock`'s resolution (`bun pm ls --all` — the default `bun pm ls`
  returns two identical leaves on a green tree, a fail-open trap) and
  fails naming both versions plus the remedy — **before** the
  frozen-lockfile self-heal line, so a drifted tree names itself instead
  of silently blessing wrong-version gate runs. See
  [[lock-drift tripwire]].

The MCP + OpenRouter gates were added incrementally: the context7 structural
assertion in v0.3.0, expanded to cover tavily in v0.4.0, and the OpenRouter
authorization assertion in v0.5.0. The ask-user-question gate landed with the
second council dependency (see [[council-dependencies]]).

⚠️ **Branch-freshness artifact (FLLWUP-27, EPIC-7).** The main-fast-forward
check assumes the branch is based at `origin/main`. In an autonomous run the
runner pushes its **board/card record commits to `main` mid-card**, so
`origin/main` legitimately advances past the card branch's base and preflight
reports `FAIL: local history does not descend from origin/main` at merge time
on a *correctly-based* branch. The recording practice (not a criterion
weakening): preflight is the run-start/owner-time gate; the step-11 re-run set
is `tsc`/`bun test`/`validate.py` ([[deterministic-merge-check]]). FLLWUP-27
proposes scoping the check to the branch merge-base.

## Contract

`FAIL:` **halts the run** verbatim; the script prints no install steps (the
facilitator's job is remediation). It's card-aware: with a card id it verifies
`council/cards/<id>.md` exists (the packaged template's comment invites
project-specific extensions, but the shipped check is presence-only).

## Related

- [[council-dependencies]], [[ask-user-question]], [[mcp-support]], [[council-loop]]
- [[lock-drift tripwire]] — the v0.18.0 tripwire this script hosts
- [[2026-08-23-context7-preflight-plan]]
- [[2026-09-06-epic6-close-run-ledger]] — the tripwire's motivation (three
  consecutive runs of silently lock-drifted local gates)
- [[2026-09-11-epic7-run-ledger]] — the branch-freshness artifact (FLLWUP-27)

## Sources

- `council/scaffold/council/preflight.sh`, `council/check-pi-drift.sh`
- [[2026-09-06-epic6-close-run-ledger]]