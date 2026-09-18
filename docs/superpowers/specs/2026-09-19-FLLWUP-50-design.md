# FLLWUP-50 design — Supported refresh path for packaged council tooling

Card: `council/cards/FLLWUP-50.md` (EPIC-9 residuals run 2). Full-council
path, 2 of ≤3 exchange rounds (stop-early on stabilisation), skeptic
O1–O12, consolidator synthesis, step-6 rulings applied (PO R1–R6; steward
Q2 + lifecycle policy). This spec writes up the settled design; it derives
nothing.

## Goal (amended by the steward ruling, binding)

> A consumer repo initialized against an earlier pi-council install is
> told at session start, non-fatally and no more than once per drift
> condition (re-arming on new drift), that its packaged council tooling
> (council/validate.py, _template.md, the procedures, the docstrings) is
> out of date, and can bring that tooling up to the currently installed
> package's version through a documented, supported path, without
> overwriting consumer-edited board, cards, or wiki.

## Rulings applied (binding, not re-litigated here)

- **R1 (Class-1 consent fork): leg B — preserve-and-ask.** Three-state
  record, ask-once bootstrap, plan-granularity consent for `↑ behind`,
  per-file consent for `~ diverged`, AGENTS.md #5/#6 additions in the same
  change. Rejected: overwrite-always (record); always-ask-forever (no
  record); engine-resolved validation (false-green); a flag on
  `/council-init`.
- **R2: `/council-update`; dry-run/plan default; `--apply` writes all
  `↑ behind`, skips `~ diverged`** (per-file accept required for
  `~ diverged`).
- **R3: record committed by default** at
  `<repo>/$CONFIG_DIR_NAME/council/scaffold.json`; consumer may gitignore.
- **R4: `_template.md` is v1-refresh (Class-1)**; package-resolved
  reclassification is its own card (follow-up filed at step 13).
- **R5: bootstrap friction acceptable** — one confirmed two-file review
  with diff shown, then mechanical.
- **R6: seat-triggered refresh fenced out of v1.**
- **Steward Q2: drift detection is IN scope; site is `session_start`.**
  Non-fatal; notify once per drift condition; re-arming on new drift. The
  designer's use-site consequence-coupled alternative (P7) is a named,
  non-adopted dissent.
- **Steward lifecycle policy:** tooling/data classification at ship time,
  enforced by the set-equality guard; default for a new scaffolded
  resource is `data`; `tooling` promotion is a deliberate same-commit
  change updating the guard test; tooling class is a shipped constant, not
  repo-extensible; `scaffoldInto`-first creation; package-side removal is
  reported (`local-only`), never deleted.

## Deliverable 1 — tooling/data classification (in `extensions/scaffold.ts`)

A shipped constant classifying every file in the `council/scaffold/` tree:

- **`tooling` (refresh-writable):** `council/validate.py`,
  `council/cards/_template.md`. Exactly these two today. Shipped constant,
  NOT repo-extensible (steward lifecycle).
- **`data` (report-only, never written):** `council/board.md`,
  `council/cards/*` (other than `_template.md`), `vault/**`,
  `.council.json`, `.pi/council/mcp.json` equivalents, and
  `council/preflight.sh` (its own "adapt to your project" header is the
  design evidence).

**Guard test (red on any unclassified scaffold file):** the set
`tooling ∪ data` must equal the scaffold-tree file set as walked at test
time (8 files today: `board.md`, `cards/_template.md`, `.council.json`,
`preflight.sh`, `validate.py`, `vault/CLAUDE.md`, `vault/wiki/index.md`,
`vault/wiki/log.md`). A scaffold file landing unclassified reds the suite.
This is principal's T4 without the manifest resource (manifest withdrawn by
its author in round 2).

## Deliverable 2 — the provenance record

`<repo>/$CONFIG_DIR_NAME/council/scaffold.json`:
`{ "<scaffold-relative-path>": { "sha256": "<digest>", "packageVersion": "<version>" } }`.

- **Written by `scaffoldInto` on creation only** — a file reported
  `created` gains a record entry; a file reported `skipped` does not.
  Existing non-clobbering semantics untouched.
- **Refresh may update the record only after a consented write** (the new
  digest becomes the recorded pristine digest). Never on a skipped or
  refused file.
- **Committed by default** (R3). Consumer data; a consumer may gitignore
  it and fall back to the bootstrap-ask default (conservative, safe).
- **New resource type** → AGENTS.md convention #5 gains a line in the same
  change stating (a) the record's semantics (a consumer-side file at this
  path is honored as the record, never merged or shadowed by the package)
  and (b) the consent-gated write rule (a record is written only on file
  creation; a refresh updates the record only after a consented write).
  Convention #6 is restated to name the consent-gated refresh write path so
  a future contributor does not read #6 as prohibiting the refresh.

## Deliverable 3 — the `/council-update` command (TS, separate from `/council-init`)

`registerCommand` name `council-update`; description is the first
signifier and must teach the protected class before any output runs
(designer P6), shape: "Update packaged council tooling (`validate.py`,
`_template.md`, `preflight.sh`) to the installed version; never touches
your board, cards, or wiki; dry-run by default." (exact wording owner's
craft; the protected-class clause is required). **Copy-truth constraint
(R1 governs R2's sample):** R2's sample copy lists `preflight.sh`, but R1
classifies `preflight.sh` data-class / never-written — the final copy must
not claim the command updates it; it may name it only as reported
(`preflight.sh: check for drift — adapted copies are reported, never
written`).

### Behavior

1. **`scaffoldInto`-first:** files added to the scaffold since the
   consumer's init are created by the existing non-clobbering path before
   any tooling treatment (reported with the `+ created` grammar).
2. **Five/six-state report** over the scaffold tree, on
   `/council-init`'s column-aligned `+`/`=` rhythm (glyphs are taste; the
   states are not):
   - `=` unchanged — bytes == packaged == recorded.
   - `↑ behind` — bytes == recorded ∧ bytes ≠ packaged (pristine-stale).
   - `~ diverged` — bytes ≠ recorded ∧ bytes ≠ packaged
     (consumer-edited), **or no record** (bootstrap).
   - `-` removed — consumer deleted a scaffolded file (report, never
     recreate silently).
   - `… shadowed` — consumer-local procedure override copies, each also
     reported `matches-packaged | differs`. Never any write under
     `$CONFIG_DIR_NAME/council/{procedures,agents}/`; deletion of a stale
     override stays a documented manual step.
   - `local-only` — the package no longer ships a file the consumer still
     has (report, never delete).
   - The protected class (`board.md`, `cards/*`, `vault/**`) is listed in
     the table even when `= unchanged`, so the maintainer sees the class
     exists (designer P1).
3. **Consent model:**
   - Default (no flag) = **dry-run / plan**: emits the table, writes
     nothing. Headless-compatible.
   - `--apply`: writes all `↑ behind` files (the reviewed plan is the
     explicit act — plan-granularity consent), **skips all `~ diverged`**
     files. A `~ diverged` file's bytes change only after its individual
     accept (interactive; skipped in headless `-p`/`json` mode).
   - **Bootstrap:** a repo with no record treats every non-current
     tooling file as `~ diverged` and asks per file, diff shown; on the
     first consented accept the new digest is written to the record. From
     then on `↑ behind` is mechanical. (R5: the one-time two-file review
     is acceptable.)
   - **Backup before any consented write:** timestamped copy of the
     about-to-be-overwritten file at a path named in the output
     (location owner's call; `$CONFIG_DIR_NAME/council/` sibling is the
     recorded lean, non-binding).
4. **`preflight.sh` stays data-class, report-only:** a stale copy is
   reported; the documented manual `cp` from the installed package is the
   support story. (`--refresh-file <path>` is a later card, not v1.)
5. **Post-refresh validate, as a distinct block:** after any consented
   write, run `python3 council/validate.py` against the consumer root and
   surface exit status as a **visually distinct report block**, never
   fused with the refresh result (a newly-red board is the board's, not
   refresh's — FLLWUP-51's positional-rule consequence arrives through
   this mechanism and is in-surface per the card record).
6. **README:** the command appears in the README command table with
   refresh semantics in its description (T10).

## Deliverable 4 — `session_start` drift detection (steward Q2)

At `session_start`, non-fatally (house try/catch pattern,
`extensions/index.ts` precedent), compare the tooling-class files' on-disk
bytes in the consumer repo against the installed package's copies:

- If any tooling file differs from the packaged copy, notify **once per
  drift condition** (the set of drifted tooling files), naming the files
  and `/council-update`.
- **Re-arming:** a fresh drift after a fix produces exactly one new
  notification; an already-notified, unresolved drift does not nag again.
  The notified-state is recorded so a second session with the *same*
  drift condition is silent; a changed condition re-arms.
- Never blocks a session; failures are swallowed.
- Detection covers the tooling class (the two Class-1 files). Procedure
  overrides and data-class staleness are the refresh command's report
  territory, not the notification's.

## Hard invariants (test-pinned)

- **I1/I5 — no engine-resolved validation, false-green trap pinned
  (T2):** `validate.py`'s `ROOT = Path(__file__).resolve().parent.parent`
  makes the consumer copy load-bearing. Pin: in a consumer tree, drop a
  board line, run the validator the way the documentation instructs — it
  must FAIL. `All council artifacts valid` ⇒ the packaged tree was
  validated — reject.
- **I2 — non-clobbering preserved (T6):** plain `scaffoldInto` after a
  refresh is still a no-op; record and bytes unchanged (extends
  `test/scaffold.test.ts:12-33`).
- **I3 — override no-write (T7):** a repo with a local procedure override
  gets `… shadowed` + `matches-packaged | differs`; nothing written under
  `$CONFIG_DIR_NAME/council/procedures|agents/`.
- **I4 — packaged pins untouched:** no write under `council/fixtures/**`;
  10-copy byte parity of `validate.py` and `_template.md`
  (`test/fllwup43-goal-oracle.test.ts:132/:144`), the FLLWUP-51
  positional-rule pin, and the widened prose guard stay green. **The seed
  tree pins 16 `seed.treeDigest`s** (skeptic O1 `closed-red`; only 8 seeds
  ship `seed/council/validate.py`) — any change that reshapes a seed tree
  re-pins all affected digests among the 16. This card does not modify the
  packaged `validate.py` or `_template.md` bytes, so no re-pin is expected;
  if implementation proves otherwise, the re-pin list is sized to 16 and
  lands in the same change.
- **Classification completeness (T4):** tooling ∪ data == walked scaffold
  set, per Deliverable 1.
- **Edit safety (T3 + owner claim 1):** record-state discrimination —
  pristine-stale / consumer-edited / matches-current emit three distinct
  statuses; only consumer-edited is gated behind per-file consent; a
  flag-less run leaves a hand-modified `validate.py` byte-identical.
- **Idempotence (T5):** two consecutive applies — second reports all
  `= unchanged`, writes nothing, creates no backup.
- **Notification semantics (T9 + owner claim 2):** drift notify → fix →
  introduce a new drift → exactly one new notification, no repeat for the
  resolved one.
- **Consent boundary (owner claim 3):** `--apply` writes all `↑ behind`
  and skips all `~ diverged`; a diverged file's bytes change only after
  its individual accept.
- **Prose:** any new command copy triggers no `test/prose.test.ts`
  finding (FLLWUP-53's widened guard) — keep new prose out of
  `council/agents|procedures` scanned shapes or make it pass the guard.

## Designer requirements adopted (must-test at implementation)

- **P2-amended (load-bearing):** first refresh (no record) asks per
  diverged file with diff shown; second refresh (record present, on-disk
  matches recorded) is mechanical for `↑ behind`. (Designer P4's round-2
  "(unchanged)" stamp is false — skeptic O2 `closed-red`; P4 is subsumed
  by P2-amended and the spec carries P2-amended only.)
- **P3:** zero post-refresh changes under `council/board.md`,
  `council/cards/*.md`, `vault/wiki/**` — and the table makes the
  protection visible.
- **P5:** flag-less run produces a plan; mutation requires `--apply` (plus
  per-file accept for `~ diverged`).
- **P6:** the command description alone names the protected class.
- **P8:** refresh result and post-refresh validate result are visually
  distinct blocks.
- **P9:** the output alone answers "what is this command allowed to
  touch?" without consulting AGENTS.md.
- P1 (amended), P6, P9 are cold-read persona claims — the fixture
  consumer repo + captured verbatim output shape is their acceptance
  instrument; file as follow-up if no in-repo smoke is practical.
- **P7 is a non-adopted dissent** (steward Q2 rejected the use-site
  design); its falsifier is not owed.

## Out of scope (fenced, per rulings)

- Seat-triggered refresh / `--tools` exposure (R6).
- `_template.md` package-resolved reclassification (R4 — own follow-up
  card).
- `--refresh-file <path>` per-file refresh for `preflight.sh` (later
  card; the documented manual `cp` is the v1 support story).
- Any change to the packaged `validate.py` or `_template.md` bytes; any
  write under `vault/**`, `council/board.md`, `council/cards/*` (data
  class), `council/fixtures/**`, or `$CONFIG_DIR_NAME/council/{procedures,agents}/`.

## Red-first test list (bun:test, `test/`, mkdtemp repoRoot-parameterized)

1. **T1 (bootstrap, the card's scenario):** temp consumer repo with
   pre-FLLWUP-43 `validate.py`, old `_template.md`, edited card + board,
   no record → after bootstrap consent both tooling files are byte-equal
   to `council/scaffold/**`; `board.md`, `cards/*`, `vault/**`
   byte-identical; record now carries the new digests.
2. **T2 (false-green pin):** corrupt the board; document-run validate;
   must FAIL.
3. **T3 (edit safety / three states):** pristine-stale, hand-edited, and
   matches-current `validate.py` → three distinct statuses; flag-less run
   changes nothing.
4. **T4 (classification guard):** tooling ∪ data == scaffold walk set.
5. **T5 (idempotence):** second apply — all unchanged, no writes, no
   backup.
6. **T6 (non-clobbering):** `scaffoldInto` re-run after refresh is a
   no-op.
7. **T7 (override semantics):** local procedure override → `… shadowed` +
   matches/differs, no writes under `.pi/` (CONFIG_DIR_NAME-derived).
8. **T8 (parity pins):** 10-copy parity, 16-digest pin awareness,
   positional pin, prose guard green.
9. **T9 (notification):** drift → one notification; resolved drift →
   none; new drift → exactly one new one.
10. **T10 (documented path):** README row + description copy shape.

## Acceptance

The card's `goal` (amended) is the judge's input. The deliverable closes
ESC-3's unbounded skew for the tooling class, notifies the consumer at
`session_start` per the steward's site ruling, and never overwrites
consumer-edited board, cards, or wiki.
