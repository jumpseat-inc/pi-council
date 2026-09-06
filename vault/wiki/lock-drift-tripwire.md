---
title: Lock-Drift Tripwire
type: concept
summary: Local gate evidence is only as good as the tree it ran on — council/check-pi-drift.sh compares the installed pi-coding-agent version against bun.lock and fails with both versions and the remedy BEFORE preflight's frozen-lockfile self-heal can silently fix it.
aliases: [lock drift, check-pi-drift, drift tripwire, installed vs locked]
tags: [pi-council/concept, pi-council/process]
sources: ["[[2026-09-06-epic6-close-run-ledger]]"]
created: 2026-09-06
updated: 2026-09-06
---

# Lock-Drift Tripwire

A local `bun test` / `bunx tsc --noEmit` run validates whatever pi version
happens to sit in `node_modules` — not what `bun.lock` resolves. When the
installed copy drifts from the lock, local gate evidence is silently
**about the wrong dependency version**, and a claim green locally can be
red in CI (which installs fresh from the lock). Observed live in three
consecutive autonomous runs: installed 0.84.2 vs locked 0.84.3, then the
0.85.1 re-lock — each time caught only because a Skeptic happened to check.

## The mechanism (FLLWUP-24, PR #40 `2c5ec3b`)

`council/check-pi-drift.sh` — a standalone artifact invoked by
`council/preflight.sh` between the "project files present" check and the
`bun install --frozen-lockfile` line:

- **Installed side** — version read from
  `node_modules/@earendil-works/pi-coding-agent/package.json`.
- **Locked side** — resolution read via `bun pm ls --all`.
- **On drift** — `FAIL:` naming both versions and the verbatim remedy
  (`bun install --frozen-lockfile`), before any gate result can be trusted.
- **On match** — one quiet OK echoing the compared version.
- **Fresh clone** — passes through (nothing installed yet is not drift).

## The pre-heal ordering

The named FAIL must fire **before** preflight's frozen-lockfile self-heal:
self-healing first would make the drift invisible and the run
unreproducible ("what did my gates actually run against?"). The tripwire's
value is the *named* diagnosis, not the sync.

## The bun pm ls trap

Default `bun pm ls` returns **two identical leaves** for the same package
on a green tree — a naive `head -1` comparison is fail-open (it can look
correct on a drifted tree). `bun pm ls --all` yields exactly one. Caught as
a Skeptic `closed-red` during FLLWUP-24's design probe and fixed before the
spec; recorded here because the trap will bite anyone re-implementing the
check.

## The convention it backs

AGENTS.md hard-convention clause #13 (added by FLLWUP-24): local gate
evidence is trusted only after `council/preflight.sh` passes on the current
tree — re-run over skip. The wiki source page for AGENTS.md was refreshed
to match in the same run (FLLWUP-25), with a drift-proof consistency check
so the count cannot silently go stale again.

## Related

- [[preflight]] — the gate that hosts the tripwire
- [[smoke test]] — CI-side fresh-install enforcement (why only the local side needs the tripwire)
- [[env-split contract]] — the other way a gate can silently validate the wrong thing
- [[engineering board]] — the clause #13 record
- [[2026-09-06-epic6-close-run-ledger]] — the three-run motivation

## Sources

- [[2026-09-06-epic6-close-run-ledger]]
- `council/check-pi-drift.sh`, `council/preflight.sh`
