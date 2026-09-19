# EPIC-9 Residual Run 2 Ledger — 2026-09-18

Source of record for the second `/features-deliver` run over EPIC-9's
residuals: the eleven `Backlog` cards `FLLWUP-50`–`60`, delivered after the
first residual run had closed. Produced by the run orchestrator. Immutable
under `vault/raw/`.

## Authorization and Phase 1 rulings

The human recorded, before the first dispatch:

- **Scope**: `FLLWUP-50`–`60` (eleven); EPIC-9 stays `Done`. `FLLWUP-52` in
  scope but retired under R4; `FLLWUP-54` in scope and wanted.
- **Sequencing** re-homed to `steward` (strategy row); `FLLWUP-60` first by its
  own recorded ruling.
- **Merge** (R2): run-scoped authorization for
  `gh pr merge <PR> --squash --admin --match-head-commit <X>`; the five
  deterministic criteria still hold; not extended to a later run.
- **Record push** (R3): run-scoped authorization for the direct step-12 record
  commit on the pusher's admin identity — satisfying `FLLWUP-60`'s
  precondition; not extended to a later run.
- **Label denotation** (R4) on `FLLWUP-52`: EV-39 R4's pending ordinal stands;
  no `navigator.ts` change; the card retires.
- **Step-13 follow-ups**: draft-then-confirm re-homed to `product-owner`,
  **pre-write**.

Phase 0 preflight: `PASS: preflight clean`; all eight working/ruling seats plus
`council-runner` resolved.

## Build order (steward job-1)

`FLLWUP-60 → 52 → 57 → 51 → 53 → 50 → 54 → 55 → 56 → 59 → 58`, strictly
serial, one runner at a time. Rationale: the owed record-push machinery first;
the R4 retirement as bookkeeping; then gate-instrument fidelity, the
validator/goal-oracle net, and the packaged procedure prose; then the refresh
path over the settled payload and its wiki page; then harness hygiene before
the allowlist policing and the CI backstop sized against the final arm set.

## Merges

| Card | PR | Merged SHA | Path |
|---|---|---|---|
| FLLWUP-60 | #67 | `aa1923fe` | mechanical + surface-touching |
| FLLWUP-52 | — | — | RETIRED under R4 |
| FLLWUP-57 | #68 | `89d0fe40` | full council |
| FLLWUP-51 | #70 | `dee64c5a` | full council |
| FLLWUP-53 | #71 | `e3b070c0` | mechanical + surface-touching |
| FLLWUP-50 | #72 | `6e353553` | full council |
| FLLWUP-54 | #73 | `52f21449` | full council (wiki via `/wiki-ingest`) |
| FLLWUP-55 | #74 | `97f4b6db` | full council |
| FLLWUP-56 | #75 | `6adbfa69` | full council |
| FLLWUP-59 | #76 | `e1b78017` | full council |
| FLLWUP-58 | #77 | `3ffb7d01` | full council |

All five deterministic criteria held per card; `gates` `SUCCESS` on each PR head
SHA (keyed on the `workflow` field) and re-observed on each merged SHA. No
`HALT`, no denied merge.

## What the cards changed

- **FLLWUP-60** — `council.md` step 12 names the run-scoped record-push
  authorization; an unauthorized direct push is a HALT. Closes the gap
  `record-push-discipline` recorded.
- **FLLWUP-57** — `test/override.test.ts` captures/restores the ambient
  `COUNCIL_EVAL_MODEL`; the suite is shell-independent for every
  catalogue-valid value. The root cause was masking luck, not a real env leak.
- **FLLWUP-51** — a wrapped goal line (and non-`key: value` lines, an unclosed
  block, a key after `goal:`) is refused with a diagnostic naming the defect;
  `goal:` is now **positional** (last key). Consumer-visible breaking change.
- **FLLWUP-53** — `council.md` step 8 no longer hard-references
  `docs/gates/GATE-EVIDENCE.md`; the prose guard now covers every packaged seat
  and procedure, not `features-deliver.md` alone.
- **FLLWUP-50** — a supported, consent-gated refresh path for packaged council
  tooling (`/council-update`), with a `scaffold.json` pristine-digest record and
  a `session_start` drift notice; scaffold files are classified
  tooling/data; non-clobbering preserved for data-class files.
- **FLLWUP-54** — `vault/wiki/red-base-evidence.md` + its source page, via
  `/wiki-ingest` (the run's one full ingest).
- **FLLWUP-55** — the smoke driver imports the shared `test/faux-provider/pty_kit.py`
  screen model; the README/docstring claim is amended and pinned.
- **FLLWUP-56** — a live falsifier for the seat child's own provider-error path
  (a real seat child reached through a scratch-repo shim); two pi-runtime
  mechanism findings (below).
- **FLLWUP-59** — the shape witness's retired-path token set is derived from git
  HEAD ancestry, not a hand-maintained regex; `fetch-depth: 0` on the gates
  checkout.
- **FLLWUP-58** — one `timeout-minutes: 60` on the `bun test` step, asserted by a
  tree-derived census tripwire; the strict/any-arm reading of "never pre-empts
  an arm's own ceiling".

## Goal amendment (steward pen, orchestrator execution)

**FLLWUP-51** — the goal was strictly under-inclusive for the agreed design
(branch D, the green-side guarantees, parity mechanics, the documented
residual). `steward` amended it in place while `Deliberating`; the judge is
bound by the amended sentence.

## New facts about the machinery

- **pi's project-extension discovery is not `-a`-gated.** A print-mode parent
  loads its cwd's `.pi/extensions` too, so a scratch-repo shim must gate on the
  `--session-id` child discriminator and no-op otherwise.
- **jiti loader asymmetry, second face.** A nested `require()` inside a
  jiti-transformed extension re-resolves through jiti's sync pipeline and
  mis-resolves file-valued subpath aliases; `await import()` bypasses it. An env
  write must precede the dynamic import (ESM evaluates deps first).
- **The step-13 follow-up gate is pre-write, and it was inverted.** A run-2
  runner wrote cards before confirmation and recorded a false "confirmed at
  ledger level" precedent. `steward` ruled the line a false precedent, had it
  corrected on the card face, and carded `FLLWUP-69`.
- **Live-arm header rule clarified.** A header carries the design-time expected
  wall clock plus its ceiling; the measured figure has one authoritative home
  (the per-file budget row); an estimate beaten by measurement is not a defect.
- **CI backstop census is thinner than advertised.** Compact-form
  third-positional-arg ceilings are invisible to a standalone-line scan; the
  true default-suite floor is 52 min against the shipped 60 — a ~1-minute
  headroom, not the 1.42× the first pass advertised.

## Disclosures

- **R3 record pushes**: every step-12 record commit went direct to `main` on the
  pusher's admin identity under the run-scoped R3 authorization; each card
  discloses its own commit list.
- **Concurrent board writers**: EPIC-10/EPIC-11/EPIC-12 decomposition and
  delivery runs wrote the shared board mid-run; two sanctioned union-merge
  repairs, no force-push, no history rewrite.
- **Merged-SHA CI flake**: the EV-40 `computeBackoffDelay` jitter test reddened
  the merged-SHA CI on `FLLWUP-50` and `FLLWUP-55` (untouched files) — one
  disclosed same-commit rerun each; carded as `FLLWUP-63`.
- **FLLWUP-56 facilitator deviation**: two owner dispatches were cut by a
  default-15m window misconfiguration; a lingering process wrote commits
  mid-session and the report misattributed them. The facilitator verified author
  identity and timestamps and corrected the provenance.

## Follow-ups filed (all `epic: EPIC-9`, `Backlog`)

`FLLWUP-61` (worktree-seat cwd discipline), `62` (frontmatter continuation
residual), `63` (EV-40 jitter top edge), `64` (refresh-surface cosmetics), `65`
(`_template.md` reclassification), `66` (`--refresh-file`), `67` (refresh-path
wiki pages), `68` (cold-read persona smoke), `69` (pin the pre-write step-13
gate), `70` (gates CI-timeout residuals). Drafts dropped by `product-owner`:
FLLWUP-60 candidate B, FLLWUP-56 A/B, FLLWUP-59 1/2.

## Ruling-seat dispatch load

`product-owner` jobs 3/7/12/15/18/21/24/25/27/29/31; `steward` jobs 1/8/13/16.
Six escalations served; escalation paced the run, as in EPIC-7/8/9.

## Owed to `/wiki-ingest`

`record-push-discipline` (FLLWUP-60 closure), `test-suite-budget` (FLLWUP-56
header rule, FLLWUP-57 masking-luck, FLLWUP-58 honest census),
`engineering-board` (FLLWUP-51 positional rule), `headless-pi` and
`council-theme` (FLLWUP-56 findings), `retired-path-tokens` (caveat (a)),
`smoke-test` (FLLWUP-55 boundary), `sources/2026-08-24-bugfix-seat-prose`
(FLLWUP-53 guard), plus the carried run-1 stale sentences.