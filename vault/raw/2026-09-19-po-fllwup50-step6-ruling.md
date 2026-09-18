---
slug: po-fllwup50-step6
card: FLLWUP-50
epic: EPIC-9
seat: product-owner
step: 6
date: 2026-09-19
---

# FLLWUP-50 — product-owner step-6 ruling

Card state at ruling: `Deliberating`. Head SHA at subject: `b516056`
(EPIC-9 residuals run 2 main checkout, `origin/main` clean per the
card record's step-1). Step-6 escalation facts: full council run with
2 of ≤3 rounds (council.md step-3 stop-early on stabilisation),
skeptic attacks O1–O12 (O3–O9 closed-green; O1, O2, O10 closed-red
as **record** accuracy corrections, not design defeats), consolidator
synthesis §1 settled and §2 routed eight open-judgment items.

The ruling below settles the §2.1 Class-1 consent fork (the **blocking**
item per the consolidator's "Ready to hand off?" section) and carries
in the same packet the five non-blocking §2.2 / §2.4 / §2.5 / §2.6 /
§2.8 items the consolidator flagged as product-owner territory.
§2.3 (detection scope and site) and §2.7 (lifecycle policy) are
escalated to [[steward]] — both touch the card's `goal` or the
portfolio's resource-lifecycle policy, neither of which is mine.

Two `closed-red` record corrections from the skeptic must land before
step 7 (mechanical, not design):
1. The seed tree pins **16** `seed.treeDigest`s, not 8 (only 8 seeds
   ship `seed/council/validate.py`); any re-pin scoping in the spec
   says 16 (`grep -l '"treeDigest"' council/fixtures/*/fixture.json | wc -l`
   → 16, skeptic O1).
2. Designer P4's round-2 "(unchanged)" stamp is false; P4 is subsumed
   by P2-amended (skeptic O2).
3. (Minor) The scaffold tree ships **8** files, not 7 (skeptic O10).

The corrected number applies to any future scaffold-tree change that
re-pins seeds.

---

## R1 (Q1, blocking) — Class-1 consent fork: **leg B — preserve-and-ask with a three-state record, ask-once bootstrap, plan-granularity consent for `behind`, per-file consent for `diverged`.**

This is the product's first sanctioned write to consumer files. The
question is whether that first write is "overwrite always" (owner
round-1; leg A) or "preserve edits, ask once" (designer P2/P4 + principal
round-1; owner round-2 concedes; leg B). Both legs satisfy the `goal`'s
literal protection list (`council/board.md`, `council/cards/*.md`,
`vault/**`), so no test can pick the winner — this is a product
judgment, mine to rule.

### Mechanism × user value

**Mechanism — leg B is the only design that achieves three states.**
Content-compare alone yields two states: `bytes == packaged` and
`bytes ≠ packaged`. The record (`$CONFIG_DIR_NAME/council/scaffold.json`,
path → sha256 + package version, written by `scaffoldInto` on creation
only) yields three: `bytes == recorded ∧ bytes == packaged` (current),
`bytes == recorded ∧ bytes ≠ packaged` (`behind`, pristine-stale),
`bytes ≠ both` (`diverged`, consumer-edited). The third state is the
one that decides whether a write is safe. Owner round-2 withdrew his
round-1 parenthetical ("we cannot distinguish stale from consumer-edited
by provenance either — only by content") as factually wrong and adopted
the record in his own round-2 text; principal's T1 (record-state
discrimination) settles this behaviorally.

**User value — the consumer who hand-edited is the consumer we owe.**
The ESC-3 population this card is for is the consumer whose
`validate.py` carries an older package's bytes. A subset of those
consumers has *already opened the file and patched it locally* — they
read the validator, found the colon-space FAIL or whatever rule
bit them, and adapted the file to their repo. For that consumer, leg
A silently overwrites their adaptation on the first refresh. That is
the EV-37 defect class recurring (a validator lied about its behavior;
here a refresh path would lie about its preservation). Leg B asks
them, shows the diff, lets them decide; cost is paid once (a two-file
review with diff), the path becomes mechanical forever after. The
cost is bounded; the benefit is permanent work preserved.

**Policy precedent — first sanctioned write sets the shape.**
Every future scaffolded resource will face this question. Setting the
posture at "preserve and ask" leaves the door open for the design to
evolve (a future card can sharpen or relax consent without re-litigating
the principle). Setting it at "overwrite always" forecloses that
without a recorded reversal. The card record itself flags this as
"a policy with a mechanism, not a local implementation choice"
(principal round-1 framing) — a framing I read as: settle the principle
here so the next resource class inherits it.

### Specific design binding (the leg-B carve)

- **Tooling class = exactly `council/validate.py` + `council/cards/_template.md`**
  (today's two). A test asserts `tooling-class allowlist ∪ data-class ==
  the 8-file scaffold tree file set` (principal T4 refined: the
  guard test without the manifest resource); this fails the moment a
  future scaffold file lands unclassified.
- **Record** at `<repo>/$CONFIG_DIR_NAME/council/scaffold.json`,
  path → `{sha256, packageVersion}`, written by `scaffoldInto` on
  creation only (non-clobbering semantics untouched). This is a new
  resource type, so per AGENTS.md convention #5 the convention gains a
  line in the same change stating (a) the override-first-hit semantics
  (a consumer-side file at this path is honored as a record, not
  merged or shadowed by the package), and (b) the consent-gated
  write rule (a record is written only on file creation, never on
  refresh; a refresh updates the record only after a consented
  write). Convention #6's "non-clobbering scaffold" is restated to
  name the refresh write path so a future contributor does not
  read #6 as prohibiting the refresh.
- **Three-state report** — `=` unchanged, `↑ behind` (consentable at
  plan granularity; pristine-stale), `~ diverged` (per-file accept
  only; consumer-edited, diff shown), `-` removed (consumer deleted),
  `… shadowed` (consumer-local procedure override, see R3), plus
  designer's `local-only` sixth state for "package removed a file the
  consumer still has" (report, never delete). Glyphs are taste
  (designer's ranking-last note); the states are not. The protected
  class (`board.md`, `cards/*`, `vault/**`) is listed in the table
  even when `=` unchanged, so the maintainer sees the class exists.
- **Ask-once bootstrap.** `behind` files are consented at plan
  granularity (apply = the explicit act for the whole plan after
  reviewing it; per-file friction fires only for `~ diverged`).
  `diverged` files require individual accept with diff shown. A
  refresh of a repo with no record treats every non-current tooling
  file as `diverged` and asks per file; on the first consented
  accept, the new digest is written to the record. From then on,
  `behind` is mechanical.
- **Backup before any consented write.** Timestamped copy of the
  about-to-be-overwritten file at a path named in the output
  (location owner's call at build time; designer's
  `.council-init.bak/` shape dropped by consensus — `$CONFIG_DIR_NAME/council/`
  sibling is owner's lean, non-binding).
- **Procedures = reported, not written.** A local procedure override
  is reported `… shadowed` plus `matches-packaged | differs` per
  override copy (the second is free information: it tells the consumer
  whether their override still buys anything). No write under
  `$CONFIG_DIR_NAME/council/procedures/` ever. Deletion of a stale
  override stays a documented manual step (git is the backup).
- **`preflight.sh` stays data-class, report-only.** All three seats
  converge by different routes; its own "adapt to your project"
  header is the design evidence. A stale `preflight.sh` is reported
  and a documented manual `cp` is the support story. The
  `--refresh-file <path>` follow-up is owner territory at a later
  card; not v1.
- **Post-refresh `python3 council/validate.py` runs against the
  consumer root, always, surfaced as a visually distinct report
  block** (never fused with the refresh result — a newly-red board
  is the board's, not refresh's; FLLWUP-51's positional-rule
  consequence arrives through this mechanism, and the step-1 record
  rules consumer-card validation in-surface).
- **Engine-resolved validation is forbidden, test-pinned.** The
  `validate.py` `ROOT = Path(__file__).resolve().parent.parent`
  coupling (skeptic O3 `closed-green`) makes the consumer copy
  load-bearing; principal T2 (corrupt the board, validate as
  documented, must FAIL) is a required pin.

### Options rejected

- **Leg A (overwrite-always, no record).** Mechanically simpler,
  no AGENTS.md convention additions, no bootstrap ask. But the
  third state (consumer-edited) is undecidable without a record,
  and "overwrite always" silently destroys the work of the consumer
  who hand-edited — the EV-37 class defect recurring at the refresh
  surface. Owner round-2 withdrew this position and adopted the
  record-based design in his own text; the only argument for it now
  is mechanical simplicity, and that argument loses against the
  uncompensated silent-overwrite cost.
- **"Always ask, no record, forever."** A subset of leg B that
  drops the record. Satisfies safety but lands at the
  "permanently-annoying path nobody adopts" failure mode principal
  named — and a non-adopted refresh path returns the consumer to
  the unbounded skew ESC-3 already ruled unacceptable. The record
  is what makes the steady state mechanical; without it, the ask
  is permanent and the design fails its own adoptability test.
- **Engine-resolved validation** (any flavor — packaged validator
  run against consumer root, a `council validate` command, etc.).
  Skeptic O3 `closed-green`: empirically a false-green generator.
  Rejected unanimously.
- **Flag-on-`/council-init`** (owner round-1 surface). A mutating
  flag on a command whose contract is "never overwrites" makes
  that contract conditional, against the honest-surface pattern
  (`[[echo-then-run]]`, `[[gate-parity]]`). Owner round-2 conceded
  on this.

### Grounding

- `vault/wiki/non-clobbering-scaffold.md` — the load-bearing invariant
  `scaffoldInto` upholds; the refresh's `scaffoldInto`-first step
  preserves it, and the record written on creation only is the same
  non-clobbering semantics extended by one resource type.
- `vault/wiki/override-resolution.md` — first-hit-wins semantics;
  the refresh's "never shadow an existing repo-local override" rule
  for procedures and agents is the same principle that seats
  follow; the record file follows it by living at
  `$CONFIG_DIR_NAME/council/scaffold.json`.
- `vault/wiki/gate-parity.md` — writer ⊆ loader ∪ dispatch invariant;
  the post-refresh validate run is the matching downstream check
  that closes the loop on a refresh's newly-installed validator.
- `vault/wiki/echo-then-run.md` — quote the resolved selection via
  the same function the write uses; the five-state report quotes
  the same three-way discrimination the write path uses, and
  re-arms on the next refresh identically.
- `vault/wiki/product-owner.md` Cases §1 (open-judgment disputes,
  rule; do not split scope), §2 (fold-in test: the record + consent
  machinery is needed to honestly meet the existing `goal`'s
  preservation requirement, read as written — it folds in).
- `council/cards/FLLWUP-43.md` ESC-3 (the goal's acceptance shape
  itself: "an adoptable path"; this ruling is the adoptable path's
  consent posture).
- `council/cards/FLLWUP-50.md` step-2 owner round-1 → step-3 owner
  round-2 (the round-1 → round-2 concession on the record's
  necessity); step-2 principal round-1 → step-3 principal round-2
  (the policy framing); step-2 designer round-1 P2/P4 (the
  person-facing falsifiers); skeptic O3–O9 (the empirical grounding
  for every load-bearing mechanism claim).

### Reversibility

Medium. Reversing to leg A means deleting the record schema from
`scaffold.ts`, removing the AGENTS.md convention #5/#6 additions,
removing the three-state discrimination and per-file accept path,
and replacing the plan-granularity-behind / file-granularity-diverged
consent with a one-shot overwrite. All mechanical but touches the
new convention lines and the AGENTS.md file. Undoing this ruling is
strictly more expensive than adopting it because it requires
deleting capability, not adding it. Reasonable cost for a first
sanctioned-write posture that has to hold for every future
scaffolded resource.

---

## R2 (§2.2) — Command name + apply-mode residue: **`/council-update`; two-phase with `--apply` for non-interactive + per-file accept for `diverged`.**

The verb. Designer and principal both lean `/council-update` over
`/council-refresh` on grounds that pair cleanly with the R1
five-state report: "update" reads as the verb the `↑` glyph carries
(`↑` = update-from-package); "refresh" is ambiguous (does it mean
re-scaffold or re-pull?). Owner round-2 routes the name without
preference; he concedes the separate command but defers the verb.
Taste call grounded in the report grammar; both peers converge.

The surface. `test/scaffold.test.ts:12-33` already pins the
non-clobbering invariant for the existing `scaffoldInto`. The new
command's `registerCommand` description is the **first signifier** a
maintainer reads (in `/commands` or `/help`) — designer P6 is right
that it must teach the protected class before any output runs.
Required copy shape (owner's craft at build time): "Update packaged
council tooling (`validate.py`, `_template.md`, `preflight.sh`) to
the installed version; never touches your board, cards, or wiki;
dry-run by default."

The apply mode. Headless `-p` and `json` modes have no prompt; a
flag-less interactive ask-per-file is incompatible with them. The
two can coexist cleanly:
- **Default = dry-run / plan**: emits the five-state table, no
  writes. Headless-compatible.
- **`--apply`**: writes all `↑ behind` files in the plan and skips
  all `~ diverged` files. `~ diverged` files require their own
  per-file accept (interactive) or are skipped (headless); a
  `~ diverged` row's bytes change only after its individual accept.
- This threads `[[gate-parity]]`'s "no consumer byte overwritten
  without an explicit act" against the
  "permanently-annoying-path-no-adoption" failure mode principal
  named in R1's option-rejected: the reviewed plan-apply *is* the
  act for the `behind` class, and per-file friction fires only for
  the rarer `diverged` class.

### Options rejected

- **`/council-refresh`.** The verb reads as a re-scaffold; the
  report's `↑` glyph reads as an update-from-package. Mismatch
  between command name and report glyph is a minor confusion
  multiplier. Taste call; lean wins.
- **Interactive per-file ask for `behind` as well as `diverged`.**
  Maximally safe; maximally annoying. Falsifies designer P4 (a
  maintainer who did not edit `validate.py` should not be re-asked
  once the record exists); the record exists to make the path
  mechanical.
- **No `--apply` flag; flag-less run mutates.** Falsifies designer
  P5 (the destructive act must require an explicit step);
  violates the dry-run-by-default house pattern.

### Grounding

- `vault/wiki/product-owner.md` Cases §1 (open-judgment disputes).
- `vault/wiki/echo-then-run.md` — the dry-run output is the same
  function the write uses, so the table the maintainer reviews *is*
  the table the apply will execute (modulo the `~ diverged` per-file
  gate).
- `council/cards/FLLWUP-50.md` step-3 owner round-2 (the
  plan-granularity / file-granularity split); designer P5, P6, P9
  (the dry-run-default and description-as-signifier claims).
- `council/procedures/council.md` step-3 (stop-early on stabilisation;
  the surface convergence is converged-by-two-and-unclaimed-by-one).

### Reversibility

Trivial. Renaming a slash command is a one-line registration change
plus a README row and a wiki follow-up; the apply mode is a flag
add/remove. Neither touches the write path or the record.

---

## R3 (§2.4, conditional on R1=B) — Record committed vs local: **committed.**

`.pi/council/*` is documented committable (`README.md:262-270` and
`[[override-resolution]]`'s commit discipline). The record lives at
`<repo>/$CONFIG_DIR_NAME/council/scaffold.json`; it is consumer data
the consumer owns. The whole point of the record is adoptability —
a record the consumer commits gives the steady-state mechanical path
that R1's three-state discrimination depends on. A gitignored record
gives the "ask forever" failure mode R1's option-rejected named: every
refresh sees "no record," treats as `diverged`, asks per file, and
the path is permanently annoying → no adoption → consumer returns
to ESC-3's unbounded skew.

The opt-out remains open to the consumer: any repo can gitignore
`.pi/council/scaffold.json` and the path is theirs. The product's
default is committed; the consumer's choice is to override it.
`scaffoldInto` writes only on creation; a consumer who deletes the
file (or never commits it) falls back to the bootstrap-ask default,
which is conservative and safe.

### Options rejected

- **Local (gitignored by default).** Adoptability collapses; the
  record is permanent overhead with no steady-state payoff.
- **Opt-in committed (default gitignored, with a "make this
  mechanical" prompt at scaffold time).** Adds a friction the
  bootstrap is supposed to absorb; consumers who skip the prompt
  land in the same failure mode as local.

### Grounding

- `vault/wiki/override-resolution.md` (the `.pi/council/*` committable
  convention; commit discipline).
- `README.md:262-270` (the committable scope is documented, not
  invented).
- `council/cards/FLLWUP-50.md` step-2 principal round-1 item 4
  (the record-committed-vs-local routing); step-3 principal round-2
  (the conditional "if the preserve side wins" framing).

### Reversibility

Trivial. Switching the default is a one-sentence scaffold copy +
README change. Consumer records already in repos are unaffected
(they're consumer data); the change is only what new scaffolds do.

---

## R4 (§2.5) — `_template.md` v1-refresh vs package-resolved reclassification: **v1-refresh; reclassification as its own card.**

Owner round-2 recommends v1-refresh; principal's package-resolved
reclassification is the better end-state but needs engine work that
the current mechanism does not support. `proceduresDir()` substitutes
`$COUNCIL_PROCEDURES` — a single variable in a single text. A general
"resolve this file from the package" mechanism would need a new
substitution variable and a per-procedure integration point; that is
mechanism work, not a one-line convention change, and it sets a
precedent for resolving other packaged assets (procedures already
do this, but the consumer-repo procedure copy is a sanctioned
override path, not a packaged-only resource — the model is different).

V1 ships `_template.md` as a Class-1 file the refresh updates
byte-for-byte with the packaged copy. Reclassification — making
`_template.md` a package-resolved resource like procedures, where
the consumer's override (if any) shadows — is a strict improvement
(drops `_template.md` from the refresh set entirely, eliminates one
file from the bootstrap ask) and gets its own card.

### Options rejected

- **V1 reclassify now.** Requires new engine work (no precedent for
  arbitrary packaged-asset substitution); expands card scope into
  engine-mechanism territory; risks delivery.
- **Drop `_template.md` from the refresh set entirely.** Reintroduces
  the unbounded skew ESC-3 ruled unacceptable for exactly this file
  (its warning sentence is one of the surfaces FLLWUP-43 corrected).

### Grounding

- `council/cards/FLLWUP-43.md` ESC-3 disposition (the consumer-side
  template-warning skew is part of the unbounded-skew class).
- `vault/wiki/override-resolution.md` (the procedures model — but the
  consumer-side procedure copy is an *override path*, not an
  absent-resource case).
- `extensions/seats.ts:557-560` (the `proceduresDir` substitution
  model; not a generalized packaged-asset resolver).

### Reversibility

Low. V1 ships with `_template.md` in the refresh set; the future
reclassification card is strictly additive (it shrinks the refresh
set, doesn't change its semantics). Either direction is cheap.

---

## R5 (§2.6) — Bootstrap friction acceptability: **acceptable; one-time two-file review.**

The bootstrap is one confirmed two-file diff with the diff shown,
then mechanical forever after. For the ESC-3 population — consumers
already running a stale `validate.py` and a stale `_template.md` —
that's a single 30-second prompt on first refresh, after which the
refresh is `= unchanged` / `↑ behind` (mechanical). The alternative
shapes are: silent overwrite (unsafe; EV-37 class), ask forever (no
adoption; returns to ESC-3), or ask with no record (same as ask
forever). The one-time ask with record is the only shape that lands
the consumer in a steady state.

A consumer who opts to skip the refresh entirely stays on the stale
files — that is the consumer's choice, and the detection-notification
question (§2.3, routed to steward) is what surfaces drift to her
when she next encounters a consequence. The bootstrap is not the
adoption gate; the design's adoptability is.

### Options rejected

- **Unattended migration** (no ask, silent overwrite with backup).
  Requires "treat unrecorded as pristine" — exactly the policy that
  destroys the hand-edited consumer's work. Rejected on user-value
  grounds (R1).
- **Per-file friction forever.** Rejected on adoption grounds
  (principal's framing).

### Grounding

- `council/cards/FLLWUP-50.md` step-2 principal round-1 item 5
  ("is one confirmed two-file diff once acceptable for the FLLWUP-50
  population, or must the migration be unattended?").
- `vault/wiki/product-owner.md` Cases §1 (the operative-pair
  framing: mechanism × user value; this ruling weighs the cost of
  30 seconds once against the cost of unbounded manual update work
  forever).

### Reversibility

Trivial. The friction is the bootstrap default; a future card could
relax it (e.g. with a `--trust-pristine` flag for unattended bulk
migration) without changing the record or the consent posture. The
direction of relaxation is mechanical; the direction of tightening
is also mechanical.

---

## R6 (§2.8) — Seat-triggered refresh: **fenced out of v1.**

Both designer (round-1 §5) and principal (round-1 item 7) explicitly
fence seat-triggered refresh out of v1. The mechanism would require
`--tools` exposure to seat children (`mcp__council__update` or
similar), a hub-tool registration, and a child-sandbox exception
that the current child sandbox does not have. No card in EPIC-9 or
its residuals requires seat-side trigger; the consumer-maintainer
audience is the only v1 user. A future card that names a seat-side
use case (e.g. an "advisor" seat that detects drift mid-card and
asks the human) is the natural home for this capability.

### Options rejected

- **V1 seat exposure.** Mechanism work with no v1 consumer; expands
  scope and the child-sandbox surface; revisits a stable boundary
  (`vault/wiki/seats.md`'s tool-grant vocabulary).

### Grounding

- `vault/wiki/seats.md` (the seat tool-grant vocabulary — the
  boundary that would need to be widened for seat-triggered refresh).
- `council/cards/FLLWUP-50.md` step-2 designer round-1 §5, principal
  round-1 item 7 (both seats' explicit fence).

### Reversibility

Trivial. Fence is a "not implemented" default; lifting it is a
follow-up card that adds the hub-tool registration and child-grant
exposure. No existing capability is removed.

---

## What the resumed runner hands off

With R1–R6 ruled and the two (plus one minor) record corrections
scheduled, the resumed runner can resume FLLWUP-50 at step 7 with
this ruling appended verbatim. The deliverable moves as the
consolidator's §1 converged design states, with R1's binding on the
Class-1 consent fork:

- **Consent posture**: leg B (preserve-and-ask, three-state record,
  ask-once bootstrap, plan-granularity for `behind`, per-file for
  `diverged`). R1.
- **Command**: `/council-update`. R2.
- **Apply mode**: dry-run / plan default; `--apply` writes `↑ behind`
  and skips `~ diverged` (per-file accept required). R2.
- **Record**: committed by default at `<repo>/$CONFIG_DIR_NAME/council/scaffold.json`.
  R3.
- **`_template.md`**: v1-refresh; reclassification as a follow-up card.
  R4.
- **Bootstrap friction**: acceptable. R5.
- **Seat-triggered refresh**: fenced out of v1. R6.
- **Record corrections** (skeptic `closed-red`, pre-step-7
  mechanics): 16 `seed.treeDigest`s, not 8; designer P4 subsumed by
  P2-amended; 8 scaffold files, not 7.
- **Out of scope (correctly escalated to [[steward]])**:
  - **§2.3** — detection scope (in or out of `goal`) and site
    (`session_start` vs use-site, consequence-coupled). Goal-amendment
    territory; round 2 sharpened the question (principal vs designer
    now disagree on the site) but did not settle it.
  - **§2.7** — lifecycle policy: does every future scaffolded
    resource get a lifecycle (tooling/data classification + record
    treatment)? Portfolio-level; shapes the test-guard's future, not
    v1 code.

The blocker (§2.1) is lifted; the resumed runner can begin the
settled spine (classification + guard test, `scaffoldInto`-first
creation, the five/six-state report, procedures-as-`shadowed`-report-only,
the dry-run/plan/backup scaffold, the distinct post-refresh validate
block, and pins T2/T4/T6/T7/T8 per the consolidator §1) without
pending rulings on those components.

If §2.3 lands "in scope, use-site" (the designer's late-round lean
and the one I find more defensible from the user-value seat — a
passive drift banner trains dismissal, a consequence-coupled surface
earns attention by pairing the drift with the cost just paid), the
implementer adds the use-site detection; if §2.3 lands "out of
scope," detection rides the EPIC-9 follow-up wave. Either way, the
core refresh surface ships.

## Reversibility, end-to-end

The single change is one commit on a worktree branch with no
main-repo state mutation (per `vault/wiki/main-repo-immutability.md`);
the five merge criteria (`vault/wiki/deterministic-merge-check.md`)
apply at head SHA. The resume path is the standard EPIC-9 form: PR
with squash method, `--match-head-commit` pinning, merged-SHA gates
re-verified, step-12 union-merge-reconcile if the runner's record
commits advanced `origin/main` between branch cut and merge. No
escalation to [[steward]] is needed for R1–R6 — none changes the
portfolio (no recorded human decision is touched; no card is
declined; no permanent residual is accepted; the card `goal` is not
amended by these rulings). The §2.3 / §2.7 escalations carry the
goal-amendment and lifecycle-policy questions separately.

## Sources

- `council/cards/FLLWUP-50.md` — steps 1–6 verbatim (the three
  generators' positions, the skeptic's twelve objections, the
  consolidator's synthesis)
- `council/cards/FLLWUP-43.md` ESC-3 disposition (the acceptance
  shape that authored this card's `goal`)
- `extensions/scaffold.ts` — `scaffoldInto` non-clobbering
  semantics; the record-write path on creation only
- `extensions/index.ts:836-868` — `council-init` handler; the
  "+ created / = skipped" grammar the refresh output adopts
- `extensions/seats.ts:557-560` — `proceduresDir` whole-dir
  first-hit; the override model the refresh's procedure-half follows
- `council/scaffold/**` — the 8-file shipped scaffold tree
  (`board.md`, `cards/_template.md`, `.council.json`, `preflight.sh`,
  `validate.py`, `vault/CLAUDE.md`, `vault/wiki/index.md`,
  `vault/wiki/log.md`)
- `council/validate.py:30-32,121-124` — `ROOT` coupling; the
  colon-space rule that FLLWUP-43 retracted
- `README.md:262-270` — the `.pi/council/*` committable scope
- `vault/wiki/non-clobbering-scaffold.md` — the non-clobbering
  invariant the refresh upholds and extends
- `vault/wiki/override-resolution.md` — first-hit-wins;
  repo-override committable; the resource-type convention #5
  follows
- `vault/wiki/gate-parity.md` — writer ⊆ loader ∪ dispatch
  invariant; the post-refresh validate is the matching downstream
- `vault/wiki/echo-then-run.md` — the dry-run table echoes the
  apply table by construction
- `vault/wiki/product-owner.md` — Cases §1 (open-judgment disputes),
  §2 (fold-in test); the operative-pair framing (mechanism × user
  value) the R1 ruling applies
- `vault/wiki/seats.md` — the tool-grant vocabulary that fences
  seat-triggered refresh out of v1
- `vault/wiki/deterministic-merge-check.md` — the five merge
  criteria the resumed runner re-runs
- `vault/wiki/main-repo-immutability.md` — worktree-only state
  changes
- `vault/raw/2026-09-18-design-fllwup50-refresh-path.md` —
  designer's recovered round-1 position (the person-facing
  grounding for the report grammar and the consequence-coupled
  detection framing)
- Skeptic `job-11.7` report (O1–O12) — every load-bearing fact in
  this ruling; the empirical grounding for the `ROOT` coupling and
  every mechanism claim that ran green
