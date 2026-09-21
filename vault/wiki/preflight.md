---
title: Preflight
type: concept
summary: The shell+script standard fixture that gates every council run — card-aware checks, MCP registration/auth, superpowers + ask-user-question pins, openrouter auth, and the lock-drift tripwire; since EPIC-14 a packaged run-start `council_preflight` tool runs before it and fails loud when the decisions gate is on without an OpenRouter credential. Any FAIL: line halts startup.
aliases: [preflight gate]
tags: [pi-council/concept]
sources: ["[[2026-08-24-ask-user-question]]", "[[2026-09-06-epic6-close-run-ledger]]", "[[2026-09-11-epic7-run-ledger]]", "[[2026-09-16-epic9-run-ledger]]", "[[2026-09-17-epic9-residual-run-ledger]]", "[[2026-09-21-epic14-run-ledger]]", "[[2026-09-21-usages-design]]"]
created: 2026-08-23
updated: 2026-09-21
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
proposes scoping the check to the branch merge-base. **It recurred through
EPIC-9 (2026-09-16)** on most cards — cleared on EV-37 and EV-40 by an owner
rebase onto `origin/main`, recorded verbatim elsewhere — confirming the
recording practice is stable: preflight is the run-start/owner-time gate, and
the step-11 re-run set is `tsc`/`bun test`/`validate.py`.

  ⚠️ It recurred again through the **EPIC-9 residual run (2026-09-17)** on most
  cards, and `FLLWUP-49` observed a further edge: on a **detached HEAD** (as in
  a worktree) `git symbolic-ref` finds no branch, so the freshness check is
  structurally skipped. Both are the same artifact; FLLWUP-27 remains the
  owning card.

## The packaged run-start gate-credential check (EPIC-14, EV-76)

Since EPIC-14 the run-start sequence is **`council_preflight` then
`council/preflight.sh`**, invoked by both packaged run-start procedures
(`council/procedures/council.md` step 0 and `features-deliver.md` Phase 0). The
tool (`extensions/preflight.ts`, `runStartGatePreflight`) composes
`loadGateConfig` with `resolveOpenRouterApiKey()` and, when the **resolved gate
mode is not `off`** and no OpenRouter credential resolves, emits one line:

`FAIL: decisions gate is enabled (mode "<mode>") but no OpenRouter credential resolved — set OPENROUTER_API_KEY, or run /login openrouter in pi to store an openrouter api_key credential, then re-run preflight`

The gate being `off`, or a credential resolving, adds nothing and the existing
unconditional OpenRouter check's output stays byte-identical.

**Why it is a packaged tool and not a line in `council/preflight.sh`:** the
scaffold `preflight.sh` is **data-class** ([[non-clobbering-scaffold]],
[[council-update]]) and is never refreshed, so a check that lives only there
reaches *fresh* `/council-init` consumers and silently misses every repo already
initialized. A packaged, override-resolved procedure/tool path is what reaches
**existing** consumers without a scaffold refresh. This is the standing rule for
any check that must reach repos already on disk. `FLLWUP-90` is the end-to-end
falsifier that a stale-`preflight.sh` consumer still hits the FAIL.

## Not the same key as `/usages` (2026-09-21)

The scaffold `preflight.sh`'s OpenRouter check and the packaged run-start check
both accept the **inference** credential (`OPENROUTER_API_KEY` or a stored
openrouter `api_key`). [[usages-report]] needs the **management / provisioning**
key (`OPENROUTER_MANAGEMENT_KEY`) and never accepts the inference key, so it
carries its own hard gate inside the packaged `/usages` procedure rather than
riding either preflight. A repo can be fully preflight-clean and still have no
management key.

## Contract

`FAIL:` **halts the run** verbatim; the script prints no install steps (the
facilitator's job is remediation). It's card-aware: with a card id it verifies
`council/cards/<id>.md` exists (the packaged template's comment invites
project-specific extensions, but the shipped check is presence-only).

## Related

- [[council-dependencies]], [[ask-user-question]], [[mcp-support]], [[council-loop]]
- [[lock-drift tripwire]] — the v0.18.0 tripwire this script hosts
- [[metered-deliberation-routing]] — the decisions gate the run-start check guards (EV-76)
- [[non-clobbering-scaffold]], [[council-update]] — why the check is packaged, not in the scaffold script
- [[2026-08-23-context7-preflight-plan]]
- [[2026-09-06-epic6-close-run-ledger]] — the tripwire's motivation (three
  consecutive runs of silently lock-drifted local gates)
- [[2026-09-11-epic7-run-ledger]] — the branch-freshness artifact (FLLWUP-27)
- [[2026-09-17-epic9-residual-run-ledger]] — the artifact's recurrence + the
  detached-HEAD skip
- [[2026-09-21-epic14-run-ledger]] — the run-start gate-credential check (EV-76)

## Sources

- `council/scaffold/council/preflight.sh`, `council/check-pi-drift.sh`
- `extensions/preflight.ts` (EV-76), `council/procedures/council.md` step 0
- [[2026-09-06-epic6-close-run-ledger]]
- [[2026-09-21-epic14-run-ledger]]