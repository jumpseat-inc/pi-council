---
title: 2026-08-25 "/council-init --approve Trust" Fix (v0.11.3)
type: source
summary: The v0.11.3 fix — /council-init passes --approve to pi install -l when the project isn't trusted, so headless/remote dep pinning no longer fails with "Project is not trusted".
tags: [pi-council/source]
sources: ["[[2026-08-24-ask-user-question]]", "[[2026-08-23-council-json-override]]"]
created: 2026-08-25
updated: 2026-08-25
---

> ⚠️ Derived from commit `43b463d` "fix(council-init): pass --approve to pi install -l when the project isn't trusted" (captured 2026-08-25). Version bump 0.11.2 → 0.11.3 (patch).

The v0.11.3 bugfix — surfaced by `/council-init` reporting:

```
 ✓ superpowers already project-local — no action
 • ask-user-question not installed. Installing project-local so it travels with this repo:
   ✗ install failed (1): Project is not trusted. Use --approve to modify local package config.
```

## Root cause

`/council-init` pins council deps project-locally via `pi install -l
<source>`. But `pi install -l` writes to `.pi/settings.json`, which pi treats
as **trust-requiring**. In **interactive** mode pi shows a trust prompt; in
**headless/remote** mode (`-p`, `--mode json`, `--mode rpc`) it never prompts,
and with no saved decision in `~/.pi/agent/trust.json`,
`defaultProjectTrust: "ask"` (the default) treats the project as *not
trusted* → `pi install -l` refuses. `--approve`/`-a` is pi's documented
one-command override ("Trust project-local files for this command with -l"),
scoped to that command, not a persistent grant.

**Why superpowers passed but ask-user-question failed:** superpowers was
already in `.pi/settings.json` (installed earlier when trust was resolved), so
`/council-init` skipped its install ("no action"). ask-user-question was never
installed, so the fresh `pi install -l` subprocess hit the trust gate.

## The fix

- **`installArgsFor(source, { projectTrusted })`** — new pure helper returning
  `["install", "-l", "--approve", source]` when the project isn't trusted,
  `["install", "-l", source]` when it is.
- **`/council-init`** uses `ctx.isProjectTrusted()` to decide. Running
  `/council-init` *is* the approval, so it's carried through as `--approve`
  (scoped to the single command). Trusted projects get no flag at all.
- Test covers both branches.

## Related

- [[council-dependencies]] — the COUNCIL_DEPENDENCIES list this fixes
- [[ask-user-question]] — the dependency that failed to install
- [[non-clobbering-scaffold]] — /council-init scaffold behavior
- [[preflight]] — the gate that asserts these pins
- [[headless-pi]] — the operating mode where the trust prompt is absent
- [[pi-council-overview]] — version arc v0.11.2 → v0.11.3

## Sources

- Commit `43b463d` on `main`
- `extensions/dependencies.ts` (`installArgsFor`)
- `extensions/index.ts` (`/council-init` handler)
- `test/dependencies.test.ts`
- pi docs: `docs/security.md`, `docs/settings.md` (project trust, `--approve`)
