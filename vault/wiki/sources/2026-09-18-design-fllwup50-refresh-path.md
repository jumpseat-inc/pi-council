---
title: 2026-09-18 design — FLLWUP-50 person-facing refresh path (round 1)
type: source
summary: The designer's round-1 position on the packaged-tooling refresh path — three moments of decision, the evaluation and execution gulfs, five cold-read predictions, the copy that must not change, and seven mechanism choices deliberately left open.
aliases: [design-fllwup50-refresh-path, fllwup50 design, refresh path design]
tags: [pi-council/design, pi-council/epic9]
sources: ["[[2026-09-18-design-fllwup50-refresh-path]]"]
created: 2026-09-18
updated: 2026-09-18
---

# Design — FLLWUP-50 person-facing refresh path (round 1)

Source: `vault/raw/2026-09-18-design-fllwup50-refresh-path.md`. A deliberation
record, not an implementation. Grounds the FLLWUP-50 refresh surface; its page
updates are carded as `FLLWUP-67`.

## The three moments

A consumer-repo maintainer whose files were scaffolded against an older install
meets three moments: the **upgrade** (the package moves, her files do not, and
nothing tells her), the **suspect** (a symptom, then `validate.py` says
"valid" because it has no concept of its own age), and the **action** (a command
must show drift, name at-risk files, refuse silent overwrite, leave a paper
trail).

## The two gulfs

- **Evaluation**: no version stamp in any scaffold file
  (`grep -rn version council/scaffold/` finds none), so the gap between installed
  bytes and scaffolded bytes is invisible.
- **Execution**: no supported path — manual `cp` is destructive and undocumented,
  `pi install` updates only the engine, and `/council-init` is a by-design no-op
  once initialized.

## Surface requirements

- A **visible version marker** per scaffold file (stamp line, side-car manifest,
  or git-based compare — mechanism open).
- Reuse the `/council-init` `+ created / = skipped` grammar so a maintainer reads
  refresh output without new learning.
- **Three buckets** the output must teach: package-version files, consumer-owned
  files (board, cards, wiki — never touched), and engine-touched overridables
  ([[override-resolution]]).
- The destructive step must be pre-announced, **per-file confirmed**, diff-shown,
  and backed by a datestamped snapshot.
- The output itself is the deliverable — a maintainer reading only the output
  must be able to answer what changed, what she edited, and what is at stake.

## Five cold-read predictions

P1 she learns drift is real on first sight; P2 she does not fear the destructive
step; P3 she knows her board, cards, and wiki are untouched; P4 she trusts the
package did the smallest safe thing; P5 the non-destructive path is the default.
P1–P3 are load-bearing; the falsifiers are person-facing, not CDP assertions
(the shape later carded as `FLLWUP-68`).

## Copy that must not change

`/council-init`'s "never overwrites" wording; the `+ created / = skipped`
grammar; `.council.json`'s field-merge semantics (refresh must not rewrite it);
[[override-resolution]] precedence (refresh must not shadow a repo-local
override); the non-clobbering invariant (AGENTS.md #6); `vault/CLAUDE.md`'s
"READ, never edit" on `vault/raw/`.

## Open mechanism choices (named, not resolved)

Separate command vs. flag; drift-detection mechanism; what counts as
"consumer-edited" (conservative by requirement — false-negatives safe,
false-positives destroy work); confirm mode (two-phase vs. interactive-per-file);
seat exposure; wiki posture (refresh is *not* a re-run); interaction with seed
digests and the 10 byte-identical `validate.py` copies.

## Wiki gaps named (later carded as FLLWUP-67)

[[non-clobbering-scaffold]] lacks a companion "what to do when non-clobbering
is the wrong path"; [[override-resolution]]'s table omits the scaffold-copied
resources; [[council-config]] describes the writer but not the publisher.

## Related

- [[non-clobbering-scaffold]], [[override-resolution]], [[council-config]]
- [[2026-09-19-po-fllwup50-step6-ruling]] — the ruling that settled the choices
- [[2026-09-18-epic9-residual-run-2-ledger]]

## Sources

- [[2026-09-18-design-fllwup50-refresh-path]]