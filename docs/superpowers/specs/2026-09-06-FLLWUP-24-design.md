# FLLWUP-24 — Local drift tripwire: installed pi-coding-agent vs bun.lock

Date: 2026-09-06. Card: `council/cards/FLLWUP-24.md` (state: Deliberating →
In Progress). Deliberation: owner/principal/designer step-2 positions and
step-3 round-1 exchange (1 of ≤3 rounds, stabilized), Skeptic step-4 attack
(1 closed-red, 5 closed-green), consolidator step-5 synthesis. This spec is
the settled design; the owner implements exactly this, nothing beyond.

## Problem

The repo's installed `node_modules/@earendil-works/pi-coding-agent` drifted
from `bun.lock`'s resolution in two consecutive runs (FLLWUP-21, FLLWUP-22,
confirmed again in FLLWUP-23 and live at the start of this run: installed
0.84.2 vs locked 0.85.1), and local gate runs silently verified the wrong pi
version until a Skeptic caught each one. `bun install --frozen-lockfile`
silently re-syncs a drifted tree (exit 0), so the defect is invisible to a
developer who runs gates without a prior install. CI is not the hole — the
`gates` workflow installs fresh frozen-lockfile — this card is the
local-evidence tripwire only.

## Settled design

### Home (deliberation ruling, recorded per acceptance bullet 2)

The tripwire lives in this repo's point-of-use gate `council/preflight.sh`,
as a new standalone artifact `council/check-pi-drift.sh`. Not the scaffold
template `council/scaffold/council/preflight.sh` (stack-agnostic by design —
its "Project tooling gate" placeholder is generic; do not introduce bun
gates there), not `smoke/` or `council/fixtures/*/seed/` copies (expected
divergence — they keep their tripwire-less copies; the no-smoke binding
stands), not packaged seat/procedure content (binding-excluded).

The goal tail clause "with the owner instruction set carrying the
requirement" is read as satisfied: the repo-root `AGENTS.md` hard-convention
line (below) is this repo's owner-facing instructions; the existing
procedure wiring already runs preflight at every run's step 0 / Phase 0, so
the requirement rides every owner run by construction. A supersession note
to this effect is recorded on the run record and here (acceptance bullet
2's "recorded on the run record" mechanism). The goal text is not edited.

### Artifact: `council/check-pi-drift.sh`

- Standalone bash, `set -u`. Single argument: **project root**. (The locked
  side is `bun pm ls --all`, which is cwd-dependent — the script resolves
  the installed package relative to the same root it invokes `bun pm ls`
  from. A two-path-args interface would re-introduce a lock-text parser,
  which is ruled out.)
- Pure interface: inputs — project root; outputs — `OK:`/`FAIL:` lines to
  stdout per the preflight contract, exit 0 on match, non-zero on drift.
- **Installed side:** read `version` from
  `node_modules/@earendil-works/pi-coding-agent/package.json` at the
  project root. This is the exact file the card's evidence base read and
  the artifact a gate-run imports.
- **Locked side:** `bun pm ls --all` at the project root, grep for the
  anchored leaf `@earendil-works/pi-coding-agent@…`, extract the version
  after the last `@`.
- **Closed-red fix (binding, Skeptic objection 1):** default `bun pm ls`
  returns **2** identical `@earendil-works/pi-coding-agent@X` lines (the
  package is both a devDependency and a peerDependency — bun.lock:11/:18),
  so an exactly-one-match assertion fails on a green tree. Use
  `bun pm ls --all` (probe-verified: exactly 1 match; no `/typebox`
  subpath leakage) **or** a `count >= 1` rule with a cross-match version
  consistency check. **Never** a `head -1` heuristic. On ambiguity
  (two distinct versions match), exit 1 with a "format changed /
  ambiguous" diagnostic.
- **Fresh-clone tolerance:** if the installed package.json is absent (or
  its `version` field missing), exit 0 with a distinct `OK:` line — absence
  is not drift; the preflight install line owns fresh-clone presence. Must
  not crash under `set -u`.

### Ordering (pre-condition of every assertion)

`council/preflight.sh` gains the tripwire invocation between the
`ok "project files present"` check and the `bun install --frozen-lockfile`
line (currently :51–:54). The named diagnostic must fire **before** the
silent self-heal install, hence before any gate result is trusted. A
structural test asserts `indexOf("check-pi-drift.sh") <
indexOf("bun install --frozen-lockfile")` in the file.

### Diagnostic contract

- Drift: exactly one `FAIL:` line naming the package, both versions inline,
  and the verbatim remedy, house colon-led style, e.g.:
  `FAIL: @earendil-works/pi-coding-agent drift — installed 0.84.2, bun.lock resolves 0.85.1 — run bun install --frozen-lockfile, then re-run preflight`
  (package-name scoping — scoped vs unscoped — is a taste call the owner
  may finalize; the four surface items are required: package, installed
  version, locked version, same-line remedy).
- Match: exactly one quiet `OK:` line echoing the compared version (e.g.
  `OK: pi-coding-agent 0.85.1 matches bun.lock`) — the transcript becomes
  version evidence; deleting the tripwire becomes visible.

### AGENTS.md

One clause under the existing "Hard conventions" numbered list (not a new
top-level section), referencing `council/preflight.sh` by path, sharpened
to the re-run-over-skip formulation:

> Local gate evidence is trusted only after `council/preflight.sh` passes
> on the current tree — prefer rerunning preflight over trusting local-gate
> evidence to skip it.

(Wording is the designer's P-c sharpening; keep the re-run-over-skip
meaning.)

## Driven test (must be green on the branch)

A `bun:test` suite spawning `bash council/check-pi-drift.sh <scratch-root>`
— the same artifact preflight calls, never a TS reimplementation — on
scratch trees under the test's temp dir, asserting:

1. **Red / name-don't-heal.** Scratch with minimal `package.json`, a copy
   of the real `bun.lock`, and
   `node_modules/@earendil-works/pi-coding-agent/package.json`
   `{"version":"0.84.2"}` → exit 1; exactly one `FAIL:` line containing
   `0.84.2`, the lock's `0.85.1`, and the literal
   `bun install --frozen-lockfile`; **and** the node_modules package.json
   still reads `0.84.2` afterward (named, not healed).
2. **Green.** Installed version derived from the copied lock's resolution
   → exit 0, one quiet `OK:` line echoing the compared version.
3. **Version-agnostic green.** Installed and locked both `9.9.9` (synthetic
   lock) → exit 0; no hardcoded `0.85.1` anywhere in the suite.
4. **Fresh-clone.** Absent node_modules package.json (or missing `version`)
   → exit 0, no crash.
5. **Ambiguity fail-closed.** A `bun pm ls --all`-shaped fixture with two
   distinct `@earendil-works/pi-coding-agent@<X>` versions → exit 1 with a
   "format changed / ambiguous" diagnostic, never first-hit-as-OK.
6. **Green-tree exactly-one (fix verification).** On the real repo (or a
   scratch with the copied real lock): `bun pm ls --all | grep -c
   '@earendil-works/pi-coding-agent@'` == 1 and
   `bun pm ls --all | grep 'pi-coding-agent/typebox'` == 0.
7. **Ordering (structural).** `council/preflight.sh` satisfies
   `indexOf("check-pi-drift.sh") < indexOf("bun install --frozen-lockfile")`.
8. **Deliverables intact.** The three recent deliverables stay green (see
   Gates), and the full gate set passes.

## Gates (all four, in order, in full — the owner's four gates)

1. `bun install --frozen-lockfile` — exit 0 on the lock-synced tree; no
   lock mutation.
2. `bunx tsc --noEmit` — clean.
3. `bun test` — full suite green, including the new drift suite, and
   `test/env-split-contract.test.ts`, the `theme-*.test.ts` suite, and
   `test/fllwup23-dep-less.test.ts` unchanged and green.
4. `python3 council/validate.py` — clean.

The preflight run itself (`bash council/preflight.sh FLLWUP-24`) must
pass on the synced tree — the tripwire's OK path must not break the gate
that hosts it.

## Diff-scope guard

Modified: `council/preflight.sh` (one insertion), repo-root `AGENTS.md`
(one clause). New: `council/check-pi-drift.sh`, the new test file, plan
doc, this spec. Byte-identical to HEAD: `council/scaffold/council/preflight.sh`,
all `council/fixtures/*/seed/council/preflight.sh`,
`smoke/fixture/council/preflight.sh`, all packaged seat/procedure content
(`council/agents/*.md`, `council/procedures/*.md`), `package.json`,
`bun.lock`, `.github/workflows/gates.yml`.

## Worktree / PR conventions

The owner works in an isolated git worktree under `.worktrees/`, never on
`main` directly, and never issues `git checkout`/`git switch`/`git reset`
against the main repository path. Branch bases at `origin/main`. PR opened
against `main`. The node_modules in the worktree must be lock-synced
(`bun install --frozen-lockfile`) before any gate run; the observed drift
in this container (0.84.2 → locked 0.85.1, since synced) is recorded on
the card.