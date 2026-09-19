---
title: Council Update
type: concept
summary: /council-update — the FLLWUP-50 consent-gated refresh path for packaged council tooling in an initialized consumer repo, backed by the scaffold.json provenance record and a once-per-drift session-start notice.
aliases: [council update, package refresh, tooling refresh, scaffold provenance, scaffold.json, /council-update]
tags: [pi-council/concept]
sources: ["[[2026-09-18-epic9-residual-run-2-ledger]]", "[[2026-09-19-po-fllwup50-step6-ruling]]"]
created: 2026-09-20
updated: 2026-09-20
---

FLLWUP-50 gave an initialized consumer repo a **supported refresh path** for the
packaged council tooling it was scaffolded with — without ever clobbering
consumer data. It carves the one sanctioned exception into
[[non-clobbering-scaffold]]'s invariant.

## The drift notice

At parent `session_start`, the engine compares the consumer's recorded scaffold
digests against the installed package and notifies — non-fatally, no more than
once per drift condition, re-arming on new drift. The once-per-condition state
lives in `$CONFIG_DIR_NAME/council/tooling-drift.state.json`: engine-written,
transient, never a consumer override surface.

## The provenance record

`<repo>/$CONFIG_DIR_NAME/council/scaffold.json` maps each scaffold-created file
to its pristine digest plus the package version that wrote it. A consumer-side
file at that path is honored as the record — never merged or shadowed by the
package — and is written only when `scaffoldInto` creates files. It is committed
by default; a consumer may gitignore it and fall back to the conservative
ask-once bootstrap.

## The refresh path

`/council-update` is **dry-run by default** (prints the plan, writes nothing).

- `--apply` refreshes `↑ behind` files.
- `--accept <path>` accepts `~ diverged` files, one at a time.
- A timestamped backup precedes every write.

Only **tooling-class** files are ever written: `council/validate.py` and
`council/cards/_template.md`. Data-class scaffold files — the board, cards other
than `_template.md`, `vault/**`, `.council.json`, `preflight.sh`, `mcp.json` —
are never written. This is AGENTS.md convention #6's single sanctioned
non-clobbering exception (see [[2026-08-23-agents]]).

## Related

- [[non-clobbering-scaffold]] — the invariant this is the consented exception to
- [[engineering-board]] — `validate.py` and `_template.md` are the tooling class
- [[2026-09-18-epic9-residual-run-2-ledger]] — the run that shipped FLLWUP-50
- [[2026-09-19-po-fllwup50-step6-ruling]] — the ruling that settled the mechanism

## Sources

- `extensions/council-update.ts`, `extensions/scaffold.ts`
- [[2026-09-19-po-fllwup50-step6-ruling]]