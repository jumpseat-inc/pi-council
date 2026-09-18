---
id: FLLWUP-50
title: Supported refresh path for packaged council tooling in initialized consumer repos
state: Done
owner: null
epic: EPIC-9
goal: A consumer repo initialized against an earlier pi-council install is told at session start, non-fatally and no more than once per drift condition (re-arming on new drift), that its packaged council tooling (council/validate.py, _template.md, the procedures, the docstrings) is out of date, and can bring that tooling up to the currently installed package's version through a documented, supported path, without overwriting consumer-edited board, cards, or wiki.
---

## Intent

`scaffoldInto` is non-clobbering (AGENTS.md #6) and `council/validate.py` has no
override-resolution path (unlike seats, procedures, and fixtures). A consumer
repo initialized before FLLWUP-43 therefore keeps the old colon-space FAIL, the
`_template.md` warning sentence, the docstring, the `board-create-card.md`
paragraph, and the `features-new.md` bars indefinitely — unbounded, silent
skew. The steward ESC-3 disposition (recorded on `council/cards/FLLWUP-43.md`)
rules unbounded skew is not acceptable as a permanent state and cards this as
the mitigation; an override path alone is insufficient — this card must deliver
an adoptable path. Acceptance shape is steward-authored (the `goal` above); the
mechanism is this card's design.

## Run record (features-deliver / FLLWUP-50, EPIC-9 residuals run 2)

### Step 1 — promotion + classification (facilitator)

- **Promotion applied (`Backlog` → `Ready`), not asked.** The run-2 Phase-1
  **scope** ruling (`EPIC-9.md`, "Residual run 2 — Phase 1 rulings":
  "`FLLWUP-50` through `FLLWUP-60` (eleven `Backlog` residuals under the
  `Done` epic) are this run's delivery scope") promotes this card, and
  `steward`'s job-1 build order places it **sixth of eleven** ("then the
  refresh path over the settled payload (`50`)" — landing after the payload
  is settled by `FLLWUP-51` and `FLLWUP-53`). Run-2 precedent: each earlier
  card's runner applied the same autonomous promotion at its start
  (FLLWUP-60 `08fdb83`, FLLWUP-57 `bb5c5e8`, FLLWUP-51 `68e2edf`,
  FLLWUP-53's step-1 record). Promotion commit pushed under R3
  (disclosed in the report).
- **Path: full council.** Cross-seam — the deliverable spans the engine
  command surface (`extensions/index.ts` `council-init`,
  `extensions/scaffold.ts`), the scaffold tree (`council/scaffold/**`), and
  the packaged tooling files the `goal` names (`council/validate.py`,
  `council/cards/_template.md`, the procedures, the docstrings) — and
  spec-ambiguous by construction: steward's ESC-3 disposition explicitly
  left the mechanism open ("mechanism is that card's design"; "an override
  path alone is insufficient; the card must deliver an adoptable path"), and
  the `goal` admits more than one reasonable design (a refresh mode on
  `/council-init`, a separate command, a documented manual path,
  confirm-per-file vs all-or-nothing, what counts as "consumer-edited").
  Steps 2–6 run before any code is written.
- **Surface-touching: yes.** The deliverable changes what a person reads and
  does: `/council-init` output copy, any new refresh-path prose/diagnostics,
  and the documented path itself. Per council.md step 1 a surface-touching
  full-council card seats `designer` as a third generator in steps 2–3.
- **Seat resolution (`<seat_resolution_check>`):** `owner`, `principal`,
  `designer`, `skeptic`, `consolidator`, `judge` all resolve — the nine
  packaged seat files are present in the installed package clone
  (`council/agents/`), and no repo-local `.pi/agents/` override directory
  exists, so nothing shadows them. Ruling seats (`product-owner`,
  `steward`) are never dispatched by this container per
  `<escalation_contract>`.
- **Environment:** step 0 preflight skipped per the autonomous-run
  substitution (Phase 0 cleared it). Main checkout clean at `15852ae` ==
  `origin/main` (FLLWUP-53's close); `python3 council/validate.py` →
  `All council artifacts valid`. No `Needs Human` state and no outstanding
  ruling on this card — deterministic merge check criterion 5 holds at card
  start.
- **Gate set for this repo** (authoritative: `.github/workflows/gates.yml`):
  `bash council/preflight.sh FLLWUP-50`, `bunx tsc --noEmit`, `bun test`,
  `python3 council/validate.py`. No database/import/server gate exists in
  this repo; `COUNCIL_INTEGRATION=1` stays gated and is not run. Owner gates
  met in full regardless of change size.
- **Phase-1 rulings applicable here (applied, cited, not re-asked):** R2
  (merge, run-scoped `--admin`), R3 (record push, run-scoped, disclosed),
  step-13 follow-up confirmation re-homed to `product-owner`, and the
  steward **ESC-3 disposition** itself — the acceptance shape recorded
  verbatim on `FLLWUP-43.md`, which is this card's `goal`. Noted, not
  re-ruled: FLLWUP-51's product-owner item 2 ruled the positional-`goal`
  red-by-design consequence acceptable for consumer cards and owed release
  notes calling out that `goal:` is now positional — a refresh path that
  installs the new `validate.py` into consumer repos is the mechanism by
  which that consequence arrives, so the deliberation must treat
  consumer-card validation behavior as in-surface. FLLWUP-51 (`dee64c5`)
  and FLLWUP-53 (`e3b070c`) are recent merges whose pins must stay green
  (10-copy byte parity of `validate.py`, the widened packaged-prose guard in
  `test/prose.test.ts`, the positional-rule no-false-positive pin).
- **Grounded facts (verified at this tree):** the scaffold tree ships 8
  files (`council/board.md`, `council/cards/_template.md`, `.council.json`,
  `council/preflight.sh`, `council/validate.py`, `vault/CLAUDE.md`,
  `vault/wiki/index.md`, `vault/wiki/log.md`); `scaffoldInto`
  (`extensions/scaffold.ts`) is non-clobbering — existing files are reported
  `skipped` and left byte-for-byte untouched; the `council-init` handler
  (`extensions/index.ts:836-868`) calls
  `scaffoldInto(repoRoot, path.join(PKG_ROOT, "council", "scaffold"))` plus
  dep pinning, chmod on preflight.sh, and created/skipped reporting;
  procedures resolve override-aware from
  `<repo>/$CONFIG_DIR_NAME/council/procedures/` first-hit over `PKG_ROOT`
  (so a consumer repo reads the *installed package's* procedures unless it
  has its own copies — a stale local copy would shadow a newer one);
  `council/validate.py` has no override-resolution path (it is a
  scaffold-copied file executed by path, unlike seats/procedures/fixtures).
### Step 2 — round 1 positions (verbatim, three independent dispatches)

Card was already `Deliberating` and the board matched at `4c29afe` when this
container resumed; `python3 council/validate.py` → `All council artifacts valid`.
Dispatches: `owner` job-11.1 (1.0m, 1 turn, total 56970 tok, cost≈$0.0057);
`principal` job-11.2 (1.0m, 1 turn, total 134932 tok, cost≈$0.0218). Each was
given only the card; no peer position was shown.

**Designer round-1 provenance note (facilitator):** this container found an
untracked file `vault/raw/2026-09-18-design-fllwup50-refresh-path.md` at start
— a self-labeled designer round-1 position for exactly this card, left by a
prior container that evidently dispatched the designer and died before
recording step 2 (the card record at `4c29afe` stopped after step 1).
`vault/raw/` is the repo's tracked deliberation-source archive with direct
precedent (`2026-08-25-design-ev4-round1.md` et al.). Its content was verified
consistent with the tree (same line references as the step-1 record). It is
adopted as the designer round-1 position; no second designer dispatch was
spent. Owner and principal were dispatched fresh and saw no position but the
card, so isolation holds.

#### designer (round 1, recovered from vault/raw/2026-09-18-design-fllwup50-refresh-path.md — body verbatim, frontmatter elided)

# Design position — FLLWUP-50, the person-facing refresh path

## Read-me first

This is a **deliberation record**, not an implementation. No scaffold,
engine, or wiki file was edited. The card names the steward-authored
acceptance shape (the `goal`); the mechanism is this card's design.
The owner and principal will produce their own independent first-pass
positions; this file is the **designer** round-1.

The persona in every gulf below is a consumer-repo maintainer whose repo
was scaffolded against an older pi-council install — whose on-disk
`council/validate.py`, `council/cards/_template.md`, `council/preflight.sh`,
`vault/CLAUDE.md`, `vault/wiki/index.md`, and `.council.json` carry an
older package's bytes while her installed package carries the current
ones. She does not know this is true.

## The moments of decision

Three moments matter; the surface must serve all three:

1. **The moment of upgrade.** She runs `pi install -l git:github.com/jumpseat-inc/pi-council@latest`. The package updates in her user-scope settings; **her scaffolded files do not move**. Today, nothing tells her. This is the largest standing evaluation gulf.

2. **The moment of suspect.** Some downstream symptom makes her wonder: a FAIL: line she didn't expect, a board-create-card warning that doesn't match her copy, a template field she didn't add. She runs `python3 council/validate.py` and gets `All council artifacts valid`. The validator has no concept of its own age; today's validator doesn't even know there's a newer one.

3. **The moment of action.** She types a command that exposes drift and offers a refresh. The command must (a) tell her what is drifted, (b) tell her which of her files are at risk, (c) refuse to silently overwrite, and (d) leave her with a paper trail.

## Gulf closed

**Gulf of Evaluation** at moments 1 and 2. Today, a maintainer cannot see
the gap between her installed package's bytes and her scaffolded files.
She has no signal — no version stamp in any scaffold file (verified:
`grep -rn version council/scaffold/` returns zero meaningful matches;
the word appears only inside the validate.py `board drift` comment). The
package's copy of `council/validate.py` differs from the consumer's by
an unbounded amount, silently. The new surface must make the difference
visible at the moment she is deciding whether to refresh — not after
the fact.

**Gulf of Execution** at moment 3. Today there is no supported path: she
can manually `cp` from her clone (destructive, undocumented, and she
must know which files were scaffolded); she can run `pi install` (which
updates only the engine, never the scaffold); she can re-run
`/council-init` (which is by-design a no-op once initialized per
AGENTS.md #6, and `scaffold.ts:51` proves this with the
`skipped` branch). The supported path must be narrower than "delete the
council/ tree and re-init" and wider than "do nothing".

The refresh surface is not closed by a one-shot command — it is closed
by a command whose **output itself teaches** the maintainer what the
package shipped, what she has, and what would change.

## Norman analysis of the proposed surface

### Signifier — the "what changed" panel

Every scaffold file a maintainer might inspect needs a *visible* marker
of the version it was shipped against, so the package can later say
"this file is from vX; the current package ships vY." Today there is no
such marker. The closest existing convention is the
`docs/superpowers/specs/` header convention, but that does not extend
to scaffold files.

Three options I do NOT pick between (mechanism, left to owner/principal):

- A version stamp line at the top of each scaffolded text file
  (cheap; visually noise; one line of context).
- A separate manifest (`<repo>/.pi/council/scaffold-manifest.json`) of
  path → {packageVersion, sha256} (clean; requires the manifest to
  outlive the file's byte identity).
- A git-based "what did I commit" answer that compares a known clean
  scaffold against the repo state (no metadata; relies on her having
  the original bytes, which she doesn't on a non-clobbering overwrite
  history).

The sign that exists today that **must not be lost** is the
`+ created / = skipped` grammar from `extensions/index.ts:849-855`. The
refresh surface should reuse that grammar (`+ refreshed`, `= unchanged`,
`~ preserved`), so a maintainer who learned to read `/council-init`
output also reads `/council-refresh` output without new learning.

### Conceptual model — three buckets, learned from the output, not the doc

The model a maintainer must form to act correctly:

1. **Package-version files** (the 7 from `council/scaffold/` plus the 3
   empty dirs and `.pi/council/mcp.json`): the package may have newer
   versions of these; she may have edited them; she needs to choose
   per-file.
2. **Consumer-owned files** (the board `council/board.md`, the cards in
   `council/cards/*.md`, the wiki `vault/wiki/**`): the package never
   touches these — full stop. The refresh output should *show* they
   exist as a class (so she sees they're protected), then move on.
3. **Consumer-owned-in-spirit, engine-touched** (the `.pi/council/`
   content: `mcp.json`, `model-floors.json`): these have override
   semantics already documented in [[override-resolution]]; refresh
   should not perturb them.

The current surface (none) requires the maintainer to assemble this
model from memory. The new surface should *display* it on first run:
"It looks like you scaffolded against pi-council vX; here's vY. There
are 8 packaged-tooling files in your repo; I will only act on the 7 in
the scaffold tree, never on your board, cards, or wiki. Six files are
byte-identical to what I shipped; two diverge — one is unchanged, one
diverges because you edited it. What would you like to do?"

That sentence is the model. Without it, she is left to guess.

### Forcing function — refuse the destructive step without a diff

The single highest-consequence action a refresh command takes is
overwriting a file the maintainer edited. That action must be:

- **Pre-announced** by an explicit "the following files diverge from the
  package version *and* differ from the originally-scaffolded bytes"
  listing.
- **Per-file confirmed**, not batch-confirmed. The maintainer who edits
  `validate.py` should not be asked "delete five files" in one prompt.
- **Diff-shown**. The prompt must show the actual diff (or at least
  the path, the line count, and the first N lines) before yes.
- **Reversible** to the extent possible. A `.council-init.bak/` snapshot
  of the about-to-be-overwritten files, named and datestamped, lives
  next to the consumer's `vault/raw/`. This is knowledge-in-the-world:
  one folder the maintainer can browse to confirm what she lost.

The non-destructive action (overwriting a file that is byte-identical
to what was scaffolded) needs no confirm — it is mechanically identical
to a re-init. Reasonable default: it happens silently, listed as
`~ refreshed (unmodified since scaffold)` in the output.

### Feedback — the output is the deliverable

The output must be **informative by itself**, not a pointer to docs. A
maintainer who reads only the command output and does nothing else must
be able to answer:

- Did anything change? (output must distinguish changed/unchanged.)
- Was anything I edited touched? (output must distinguish
  unchanged/edited.)
- What does the package version on disk say? (output must name it.)
- If I said no to a destructive step, what will I lose by saying no
  later? (output must include a per-file "what's at stake" one-liner,
  or list the symptom the divergence causes.)

The existing `/council-init` output shape (created/skipped lists) is the
right template — the refresh just adds a third list (`preserved`) and a
header line saying "package version X → Y".

## Falsifiable predictions (cold-read comprehension, not CDP)

These are *hypotheses* about how a first-time maintainer reads the
command's terminal output. Each is asserted as a person-facing claim
with the smoke or pure-seam test that would falsify it.

- **P1 — "she learns drift is real on first sight."** A maintainer runs
  the refresh command and immediately names (a) the package version on
  her disk, (b) the package version she has installed, and (c) at least
  one symptom of the gap. Falsifier: a cold-read where she cannot name
  any one of the three (the surface failed to teach the model).

- **P2 — "she does not fear the destructive step."** A maintainer who
  *did* edit `validate.py` runs refresh, sees that file in the
  `preserved (yours diverges from package)` listing, and either keeps
  it (no confirm prompt fires for it) or accepts the package version
  after seeing the diff. Falsifier: she is asked to overwrite it by
  default (the confirm prompt fires unprompted) or she is asked to
  overwrite it without first seeing what would change (no diff shown).

- **P3 — "she knows her board, cards, and wiki are untouched."** A
  maintainer runs refresh, reads the output, and is confident that
  *none* of `council/board.md`, `council/cards/*.md`, or
  `vault/wiki/**` was modified. Falsifier: a git diff at the consumer's
  working tree after refresh shows changes under any of those paths
  (the surface advertises a protection it does not deliver) — or the
  output is ambiguous about whether those paths were even in scope.

- **P4 — "she trusts the package did the smallest safe thing."** A
  maintainer who *did not* edit `validate.py` runs refresh; the output
  shows her `validate.py` as `~ refreshed (unmodified since scaffold)`,
  without a confirm prompt for it. Falsifier: the unedited-but-stale
  file is left unchanged (the command did nothing) or asked for
  confirmation (the command imposes friction on the path of least
  resistance).

- **P5 — "the non-destructive path is the default."** A maintainer who
  runs the refresh command without flags sees a dry-run plan, then
  has to re-run with an `--apply`-class flag (or per-file accept) to
  commit changes. Falsifier: a flag-less run mutates her tree (the
  forcing function is bypassed) or the dry-run mode does not exist
  (forcing function is bolted on later).

P1, P2, P3 are the load-bearing ones; P4 and P5 are
secondary. Each is a person-facing claim, not a CDP assertion. The
smoke that would falsify P1–P3 is a test-fixture consumer repo
(initialized against a pinned older scaffold-tree sha, installed
against a different newer one) with the refresh output captured
verbatim; a downstream persona test reads the captured output and
asserts the comprehension the prediction names. P4 and P5 falsify
on any consumer-repo test where the run output is inspected against
the expected action graph.

## Copy I would NOT change, and why

- **`/council-init`'s "never overwrites" wording** (`extensions/index.ts:837`).
  That is the load-bearing invariant of the consumer's trust — any
  refresh path that erodes that wording erodes the contract. The
  refresh command must reproduce it: "your edits are preserved
  unless you explicitly ask to overwrite them."

- **The `+ created / = skipped` grammar** (`extensions/index.ts:849-855`).
  Refresh should adopt a sibling glyph, not invent a new visual
  vocabulary. The maintainer who learned one form reads the other.

- **The em-dash and FAIL: line conventions** of `council/validate.py`.
  Out of scope; refresh can not move them.

- **The .council.json field-merge semantics** ([[council-config]]).
  Refresh must not re-write `.council.json`. That file's
  field-merge-only contract is a trust boundary the maintainer formed.
  Drift in `.council.json` defaults, if any, is the job of
  `council-models`/the picker, not the refresh path.

- **The override-resolution precedence** ([[override-resolution]]).
  Refresh of a packaged file must NOT shadow an existing repo-local
  override — a consumer who has an override has it for a reason, and
  refresh must adopt the same first-hit-wins rule that seats and
  procedures use.

- **The non-clobbering invariant itself** (AGENTS.md #6,
  `extensions/scaffold.ts`). Whatever the refresh path does, it must
  preserve this. This is a hard scope fence.

- **`council/procedures/council.md`'s gate-record wording** post-FLLWUP-53.
  Refresh does not rename gate records.

- **`vault/CLAUDE.md`'s "READ these, NEVER edit or delete them"** on
  `vault/raw/`. Refresh does not touch `vault/raw/` (it is the source
  set the consumer maintains).

## Open judgment calls I deliberately do NOT resolve

These are mechanism choices — the seat doc explicitly says mechanism
is "this card's design," but the *person-facing consequences* of each
candidate are not all mine. I name them so the consolidator can route
them properly:

1. **Separate `/council-refresh` command vs. `/council-init --refresh`
   flag vs. documented-only manual path.** Mechanism choice — the
   argument from discoverability vs. command-surface-bloat vs.
   implementation-cost favors the separate command (a flag on
   `council-init` muddles the "never overwrites" copy); the argument
   from consumer-simplicity favors the flag (one fewer command in the
   palette). Owner territory. *I lean separate command with the
   `/council-init` output notifying when drift is detected, because
   each command has one job; I will not pick a winner here.*

2. **Drift-detection mechanism** — in-file version header vs. side-car
   manifest vs. file-byte hash from a remembered scaffold snapshot.
   Owner territory; I argue only that *whatever is chosen must be in
   the scaffold tree at scaffold time*, not retrofitted on first
   refresh, because a first-run that doesn't know what it scaffolded
   cannot know what's drifted.

3. **What counts as "consumer-edited"** — byte-identity vs. line-level
   git-blame attribution vs. user-stamped hash. The card calls it out
   explicitly. *Mechanism choice*; the safety guarantee is mine:
   whatever test classifies a file as "edited" must be conservative
   (false-negatives are safe; false-positives destroy work).

4. **Confirm mode** — interactive prompt per file vs. a two-phase
   pattern (`--plan` then `--apply`) vs. global flag. My *design*
   preference is two-phase, because it composes with headless and TUI
   flows; my *person-facing* preference is interactive-per-destructive-file,
   because that is the smallest unit of trust; but the second is
   incompatible with `-p` mode and `json` mode. Owner product call.

5. **Whether the refresh command surfaces across `--tools` to seat
   children** (some products may want a seat to trigger refresh mid-
   card). Out of scope today; this card is consumer-maintainer-
   directed, not seat-directed.

6. **Wiki posture** — the wiki pages `non-clobbering-scaffold` and
   `override-resolution` both assert "re-run is a no-op" as a feature.
   Refresh is *not* a re-run; it is a different command that the wiki
   must distinguish. Wiki-ingest follow-up, not a step-2 call; recording
   it here.

7. **The interaction with seed digests and fixture-shipped tooling**
   (`council/fixtures/<task>/seed/council/validate.py` × 8 + 1
   scaffold copy + 1 root = 10 byte-identical copies per FLLWUP-43
   T3). Refresh must not touch fixture seeds (they are governed by
   `seed.treeDigest`); the person-facing implication is "the refresh
   command reports `validate.py` once, even though there are 10
   copies; the fixtured copies follow the next packaged version per
   the next-fixture-pinning discipline." This is a cross-seam concern
   that is not mine to settle.

## What the wiki does and does not cover

**Used.** `vault/wiki/index.md` (module map), `vault/wiki/non-clobbering-scaffold.md`
(the non-clobbering invariant — `skipped` is the protected-by-design state),
`vault/wiki/override-resolution.md` (the precedence list — refresh must
honor it), `vault/wiki/council-config.md` (the field-merge contract of
`.council.json` — refresh must not rewrite it). Also grounded in source:
`extensions/index.ts:836-868` (the `/council-init` notify copy and the
created/skipped grammar), `extensions/scaffold.ts` (the byte-for-byte
invariant), `council/scaffold/**` (the 8 shipped files; `vault/CLAUDE.md`,
the wiki schema; `council/preflight.sh`, the `@CONFIG_DIR@` placeholder
that the scaffold renders at copy time).

**Gaps.** (a) `non-clobbering-scaffold.md` does not name *what to do
when the non-clobbering path is the wrong path* — i.e., when the
maintainer wants to update without losing edits. The page can only be
read as "scaffold is the safe initial path," with no companion.
(b) `override-resolution.md` does not enumerate scaffolded files
(`preflight.sh`, `validate.py`, `.council.json`, `_template.md`) among
the overrideable resources — and indeed they *aren't* overrideable
today, which is exactly the gap this card closes. (c) `council-config.md`
describes the writer but not the publisher — i.e., it does not say
whether the scaffold seed itself is the source of truth (it is, but
nobody reads it that way). All three are wiki-ingest follow-ups; none
is a PR blocker. *Recording, not authoring.*

## How a person would feel

Under time pressure on an unfamiliar path, after a package upgrade
that "didn't take," the maintainer is anxious and wants to know
"nothing in my repo will be deleted silently." The surface must read
*calm*: it must name the things it will not touch, list what it will
touch, show what's at stake, and give her a way out. Aesthetically
quiet, semantically specific. The opposite of "let me just `cp` the
new files in and see what breaks."


#### owner (job-11.1)

Grounding for this position was completed read-only earlier in this session against the working tree (card, all four wiki pages cited below, `scaffold.ts`, the `council-init` handler at `extensions/index.ts:836–868`, the 8-file scaffold tree, `validate.py`, `seats.ts:530–559`, `test/scaffold.test.ts`, `test/prose.test.ts`, `test/fllwup51-gate.test.ts`, the ESC-3 disposition on `council/cards/FLLWUP-43.md`). No edits, no branch state changes, no /tmp scratch needed — every claim below was verified by read or execution, none by recall. I present my position; per the isolation rule I have not seen and do not assume the other generators' positions.

---

## Approach

**Mechanism: `--refresh` mode on the existing `/council-init` command, backed by a new exported `refreshCouncilTooling(repoRoot, scaffoldRoot)` in `extensions/scaffold.ts` — three file classes, three treatments, one honest report.**

The grounding fact that shapes the whole design: the skew problem is not one problem but three, and the ESC-3 prose ("the procedures, the docstrings") conflates them. Verified against `seats.ts`:

- **Class 1 — executed-by-path tooling with no override story** (`council/validate.py`, `council/cards/_template.md`). `validate.py` is executed by the consumer at `python3 council/validate.py` from their own copy and has no override-resolution path (the resolution table in `seats.ts:530–559` covers seats, procedures, fixtures — never it). These are the only files the command itself must move: on refresh, a copy differing from `council/scaffold/` is overwritten byte-for-byte and reported `updated`. Neither file has a sanctioned consumer-edit story; there is no other path by which ESC-3's named skew ever closes.
- **Class 2 — local procedure overrides** (`$CONFIG_DIR_NAME/council/procedures/*.md`). Key fact the card prose glosses over: a consumer with **no local copies already reads the installed package's procedures** — `proceduresDir` falls back to `PKG_ROOT/council/procedures`, which *is* the installed package. Stale procedures exist only where a repo created override copies. The correct refresh action for those is **delete-the-override-as-documented-manual-step** (override resolution makes the packaged version reappear; the files are git-tracked, so git is the backup), reported per-file as `matchesPackaged` / `differs` — never silent deletion, because an override copy is by definition a tuning act (`vault/wiki/override-resolution.md`).
- **Class 3 — consumer data** (`council/board.md`, `council/cards/*.md`, `vault/**`, `.council.json`, `mcp.json`, plus `council/preflight.sh`). Only ever reported as `differs`, never touched. `preflight.sh` joins this class deliberately despite being scaffold-copied: its own header says "adapt to your project" — it is consumer-adaptable by design, so it must not join the overwrite allowlist even though it can go stale.

Refresh = `scaffoldInto` first (the half of skew that's already solved: files *added* to the scaffold since last init are created by the existing non-clobbering path), then Class-1 overwrite, then the three-way report, then a **best-effort post-refresh `python3 council/validate.py` with exit status surfaced in the same output**. That last step is load-bearing, not cosmetic: FLLWUP-51 changed validator behavior, so a refresh can *newly FAIL* a consumer board that silently passed before (a wrapped goal). Handing the consumer a newly-red gate in the same breath as the swap is honest; letting them discover it at their next run is not.

**Against the alternatives:** a separate `/council-refresh` command doubles the surface to name and document for zero capability; a write-into-`scaffoldInto` default violates convention #6 and turns every reinstill into a clobber risk; a version-stamp file in the consumer tree adds state to solve a problem content-compare already solves (we cannot distinguish stale from consumer-edited by provenance either — only by content); a registry/lockfile design (`council/.council-lock` recording scaffolded-at version) is the heavyweight alternative and I reject it for v1 — the report's `differs`/`identical`/`updated` triple is fully derivable from disk with no new durable state.

**"Consumer-edited," defined operationally.** This is the definitional core the goal hinges on, and content-identity is the only available discriminator: *a file is consumer-edited iff it differs byte-wise from the packaged scaffold copy and is not in the Class-1 tooling allowlist*. A file byte-identical to packaged is by-construction untouched (or re-created identically — indistinguishable and immaterial). For Class-2 overrides the presumption flips: *existence of a local copy is the consumer-edited signal*, regardless of content, because creating the override is itself the tuning act. There is no third state and no provenance check that can improve on this without adding durable state.

## Tradeoffs accepted

- A consumer who *deliberately* customized `validate.py` loses their customization on `--refresh`. Accepted: no sanctioned edit story exists for Class-1 files, git history is the undo, and the report names every file overwritten so the act is never silent.
- The procedures half of ESC-3 lands as adoptable-but-manual (report + documented delete action). This is the weakest part of the design; I judge "documented, supported path" satisfied but flag it for ruling below.
- Documentation that reaches consumers lives in the command description + refresh output (self-documenting surface), *not* the wiki — a consumer initialized early has no `non-clobbering-scaffold.md` page, and `vault/` is exactly the data we don't touch. We update this repo's wiki page for the record regardless.
- One command with a flag rather than a new command: slightly less discoverable, much less surface to keep coherent.

## Testable claims (red-first, bun:test, `test/`, mkdtemp repoRoot-parameterized)

1. **The money falsifier — ESC-3 reproduced then closed:** consumer tree with a *stale* `validate.py` (pre-FLLWUP-43 colon-space FAIL), valid board, one card whose goal contains a `: ` literal → `python3 council/validate.py` exits 1 (this half is runnable today and reproduces the skew on the current tree). After `refreshCouncilTooling`, the identical invocation exits 0 with `All council artifacts valid` — FLLWUP-51's positional behavior demonstrably reaching the consumer. Red at HEAD (no export to call).
2. **Class-1 overwrite, data untouched:** stale `_template.md` refreshed to sha256-identity with packaged; consumer-edited `board.md` (marker append) and a consumer card survive byte-for-byte; `vault/wiki/index.md` untouched.
3. **Convention-#6 guard:** plain `scaffoldInto` re-run after a refresh is still a no-op (files-filtered `created` empty, `skipped` populated).
4. **Idempotence:** second consecutive refresh reports `updated: []`.
5. **Override report, no silent delete:** differing local `board-create-card.md` override (dir built from `CONFIG_DIR_NAME`, never a literal `.pi`) is reported, file still exists after.
6. **`preflight.sh` edits survive:** adapted `preflight.sh` is `differs`-reported, not overwritten.
7. **Newly-red gate surfaced:** post-refresh board with a wrapped goal yields the FLLWUP-51 vocabulary FAIL (`wrap`/`second line`/`line break`/`value`) in the command path output.
8. **FLLWUP-53 coexistence:** new command description/report copy triggers no `test/prose.test.ts` finding.

Pins by construction: zero `validate.py` copies added or modified (FLLWUP-51's `sha256Tree` 10-copy parity stays green), no new prose in `council/agents|procedures` (FLLWUP-53's widened guard has nothing new to scan), `scaffoldInto` byte-identical (convention #6).

## Open-judgment (routed, not settled)

1. `preflight.sh` v1 treatment: report-only + documented manual `cp` (my recommendation) vs. ship `--refresh-file <path>` now.
2. Force-delete of stale procedure overrides: in-command with per-file confirm vs. documented manual deletion (my recommendation: manual).
3. Auto-run post-refresh `validate.py`: I say yes, report-only; confirm a newly-FAILing consumer board is an acceptable documented consequence (the card record itself says consumer-card validation behavior is in-surface, since FLLWUP-51's consequence arrives by this mechanism).
4. Version stamp vs. content-compare for the skew report (I default: content-compare, no new consumer-tree file).
5. Whether the Class-1 allowlist is repo-extensible (I say no — shipped constant in `scaffold.ts`; extensibility is speculative until a consumer asks).

## What the wiki does not cover

- `non-clobbering-scaffold.md` documents re-run-as-no-op and stops: no skew class, no refresh path, and no statement that `validate.py`/`_template.md` are the scaffold-copied resources with **no** override tier. `override-resolution.md`'s resource table omits them entirely — the "never-shadowable" column does not exist. Both owe the step-14-style correction with this card.
- No wiki page carries the **fixture seed trees as shipped `validate.py` copies** — the 10-copy parity obligation lives only in `test/fllwup51-gate.test.ts` and the FLLWUP-51 card record; it should be a standing hazard page.
- No wiki page states that consumers-without-local-overrides already read packaged procedures — derivable from `override-resolution` + `seats.ts` but never written, and it materially shrinks the skew class ESC-3's prose implies.
- `gate-parity` constrains this design only by analogy (refresh must not invent a gate stricter than any existing consumer); I cite it as a boundary, not a foundation.


#### principal (job-11.2)

**Deliberation only.** No file was edited, created, or deleted; no branch state touched; no `/tmp` scratch used. This dispatch carries no `bash` tool, so every claim below is verified by reading bytes in the working tree, not by executing — where that matters I say so. This is an independent first pass; I have grounded in the files and the wiki only.

## Cross-seam reading

**The actual hop chain for "an initialized consumer repo runs today's packaged tooling":**

| Hop | Resolved from | Evidence |
|---|---|---|
| Slash-command *instructions* (`/council`, `/features-deliver`, `/board-create-card`) | **packaged, current**, unless the repo holds a local override | `proceduresDir()` `extensions/seats.ts:557-560` (repo override first-hit, else `PKG_ROOT/council/procedures`); `renderProcedure` `extensions/index.ts:131-135` |
| `council/preflight.sh` | **consumer copy, frozen at init** | invoked repo-relative: `council/procedures/council.md:64`, `features-deliver.md:38` |
| `council/validate.py` | **consumer copy, frozen at init** | `council.md:119,227,309,334`, `board-create-card.md:94`, `features-new.md:196` |
| `council/cards/_template.md` | **consumer copy, frozen at init** | `board-create-card.md:12`, `features-new.md:27` |
| `board.md`, `council/cards/*`, `vault/**`, `.council.json`, `.pi/council/mcp.json` | consumer data | `scaffoldInto` copy list (`extensions/scaffold.ts`); `validate.py` `ROOT` |
| The engine | **never reads any of them** | no engine reference to `validate.py`; `scaffold.ts` only copies |

**The broken seam.** It is not "the consumer runs old files." It is a **one-way coupling**: the packaged procedure (current) names a repo-relative artifact (frozen). The package ships the *command*; the consumer ships the *implementation*; **no code anywhere compares the two sides.** `scaffoldInto` is a flat `walk()` with an `existsSync(dst) → skipped` branch, one special case (`preflight.sh`'s `@CONFIG_DIR@` render), and a separate non-clobbering `mcp.json` write — it has no notion of version, digest, or file class. No version stamp exists anywhere in the scaffold tree (`council/scaffold/.council.json` holds only `council`/`theme`/`retry`).

Underneath sit two more unmade seams. **Classification:** the scaffold tree mixes tooling and data with no code-level distinction — the only place in the codebase that knows `_template.md` is not consumer content is `validate.py`'s `main()` (`if path.name == "_template.md": continue`). The refreshable set today is therefore **exactly two files**: `council/validate.py` and `council/cards/_template.md`. The other six scaffold entries are consumer data (`board.md`, `vault/CLAUDE.md`, `vault/wiki/index.md`, `vault/wiki/log.md`, `.council.json`, `preflight.sh` — the last explicitly "adapt to your project"). **Provenance:** no repo records what was scaffolded, so "consumer-edited" is undecidable from the repo alone.

**One trap invisible from the procedures' side:** `council/validate.py` derives `ROOT = Path(__file__).resolve().parent.parent` and takes no root argument and no cwd. Any design that "resolves the validator from the package like procedures" would validate `PKG_ROOT/council/cards` — this repo's own board — and print `All council artifacts valid`. A false-green generator, strictly worse than skew. This is *why* the copy exists, and it forbids one whole candidate family.

**Invariants any design must preserve:** (I1) one authoritative validator per repo at any moment — procedure-invoked bytes == CI-invoked bytes, else `clean` means two things; (I2) `scaffoldInto` stays non-clobbering and no consumer byte is overwritten without an explicit act; (I3) override first-hit semantics — a repo-local seat/procedure override is reported, never shadowed or written; (I4) the shipped payload stays byte-parity pinned — 10 `validate.py` copies (`test/fllwup43-goal-oracle.test.ts:132`), 10 `_template.md` copies (`:144`), 8 `seed.treeDigest`s re-pinned in the same change, and FLLWUP-51's positional-rule pin and widened prose guard (`test/prose.test.ts:30-38`) stay green; (I5) the validator must run against the consumer's root; (I6) the manifest and any provenance record are new packaged/repo resource types, so AGENTS.md gains a line for each (convention #5's "any new resource type must follow this pattern") and #6's write rule must be stated, or a future contributor will read #6 as prohibiting the refresh; (I7) detection must be non-fatal and never block a session (the `session_start` try/catch house pattern, `extensions/index.ts:695-704`).

## Blind spots

- **Implementation vantage (`owner`).** From inside `scaffold.ts` the natural instinct is a refresh over "the scaffold tree minus the obvious data files." It cannot see the Python `ROOT` coupling across the seam, so "resolve instead of copy" looks like a simplification and is a false-green; and it cannot see that "the procedures" in the goal are already current, so implementing a procedure refresh is either a no-op or an override violation.
- **Person-facing vantage (`designer`).** It models the consumer's three buckets from the user story, but the tooling/data classification does not exist in code, so any output copy promising "we will never touch your board, cards, or wiki" while acting on entries derived from the scaffold tree is a promise the implementation cannot compute — four of the eight scaffold files *are* board/wiki data. It also tends to treat the already-initialized repo as a persona rather than as *state*: with no provenance record, "unedited but stale → auto-refresh quietly" is unsatisfiable for exactly the population this card is about.
- **Judge vantage.** The goal is satisfiable by byte-copying two files; it says nothing about the consumer being *told*, and nothing about the installed validator validating the consumer's repo rather than the package's. A judge reading only the goal can falsify neither.
- **Portfolio vantage (steward/product-owner).** This reads as one residual among eleven. From the portfolio seat the *reach* is invisible: the refresh is the first sanctioned write to consumer files in the product's history, i.e. a policy with a mechanism, not a local implementation choice.
- **Eval/fixture vantage.** Seed copies are digest-pinned and `rubric.json` is not; a refresh that changes the shipped payload without re-pinning turns the fixture loader red in a way that reads as an unrelated failure.

## Reframe

The card asks for "a path." The load-bearing artifacts are **a classification, a consent gate, and an observation** — the command is the visible quarter of it.

1. **`council/scaffold.manifest.json`** (packaged, sibling of the scaffold dir): every scaffold entry declared `tooling` or `data`. Tooling today: `council/validate.py`, `council/cards/_template.md`. A test asserts set equality with the scaffold tree, so a future scaffold file cannot land unclassified. Without this, the goal's third conjunct is unimplementable.
2. **`/council-update`** — a **TS command**, *separate* from `/council-init` (whose advertised contract is "never overwrites", `extensions/index.ts:837`; a mutating `--refresh` flag makes that contract conditional, against the honest-surface pattern). Dry-run by default. Per entry: `unchanged` / `behind` / `diverged` / `removed` / `shadowed`. Writes only with explicit consent, backs up before writing, never touches `data`-class entries, never writes under `.pi/council/procedures|agents/` (reports `shadowed`).
3. **An init-time record** at `<repo>/$CONFIG_DIR_NAME/council/scaffold.json` (path → sha256 + package version), written by `scaffoldInto` **on creation only**, leaving its non-clobbering semantics untouched. Honest caveat: this is not required for *correctness* — conservative "no record ⇒ `diverged` ⇒ ask" is safe — it is required for the refresh to be **adoptable** rather than a permanent per-file interrogation.
4. **Bootstrap = one confirmed diff, then mechanical.** Without a record, every differing tooling file is `diverged`: show the diff, ask per file, and on acceptance write and record the new digest as pristine. Two files makes this a two-line review. That is the "one-time migration" the ESC-3 disposition named.
5. **Detection at `session_start`** — compare tooling-class digests against the package's; if any differ, notify once, naming the files and the command. Non-fatal. This is the conjunct the goal sentence omits while the Intent requires: a capability nobody is told about is not a path.
6. **"The procedures" conjunct is satisfied by reporting, not writing** — a repo holding a local procedure override is told its override shadows a newer packaged procedure; nothing is overwritten. "The docstrings" is a sub-part of `validate.py` and refreshes with it.

**Rejected candidate, with reason:** engine-resolved validation (packaged validator run against the consumer root, or a `council validate` command) fails I1 (CI/hermetic runs keep the frozen copy → two meanings of `clean`) and, in the naive form, I5. **Worth the owner's consideration:** reclassify `_template.md` as package-resolved (read from the package like procedures), shrinking the refreshable set to one — trades away consumer template customization for zero skew. Open tradeoff, not mine to settle.

**What counts as "consumer-edited":** whole-file, per file; `edited` ⇔ repo bytes ≠ the recorded pristine digest. Absent a record the question is **undecidable** (a pristine old copy and a hand-edited copy are both simply "different from current"), so the classification must be **conservative in one direction**: false-positive ("edited" → skip/ask) is safe; false-negative ("pristine" → overwrite) destroys work. So: no record ⇒ treat as edited ⇒ ask. A `removed` file (deleted by the consumer) is a consumer decision — report it, never silently recreate. Line-level merge or git-blame attribution of a 200-line validator is rejected: the tooling files are small enough to replace whole-file after consent, and partial merges of a validator are how you get a validator nobody can reason about.

## Testable claims (runnable, not prose)

- **T1 (bootstrap, the card's scenario).** Temp repo carrying the pre-FLLWUP-43 `validate.py` rule and old `_template.md`, plus a consumer-edited card and edited `board.md`, and **no** record. Run the documented path: both tooling files become byte-equal to `council/scaffold/**`; `board.md`, `cards/*`, `vault/**` byte-identical; no other path changed. Red today (no such path exists).
- **T2 (false-green trap).** In the T1 repo, drop a card line from `board.md`, then validate *the way the documentation instructs*. Must FAIL. If it prints `All council artifacts valid`, the installed validator is running against the package's own tree — REJECT.
- **T3 (edit safety).** Same repo with a hand-modified `validate.py`: a flag-less run leaves it byte-identical and reports `diverged`; only an explicit per-file accept writes it, and only with a backup.
- **T4 (classification completeness).** Manifest key set == scaffold tree file set; no `data`-class entry is reachable from the write path. Reds the moment a scaffold file lands unclassified.
- **T5 (idempotence + untouched files).** Two consecutive applies: second reports all `unchanged`, writes nothing, creates no backup, leaves unchanged files' mtime unchanged.
- **T6 (non-clobbering preserved).** `scaffoldInto` twice on a fresh `mkdtemp`: second run creates nothing, skips everything, record and all bytes unchanged (extends `test/scaffold.test.ts:12-33`).
- **T7 (override semantics).** Repo with `.pi/council/procedures/council.md`: refresh reports `shadowed`, writes nothing under `.pi/`.
- **T8 (parity stays green).** 10-copy `validate.py` and 10-copy `_template.md` byte-parity, 8 `seed.treeDigest`s re-pinned in the same change, FLLWUP-51 positional pin and the widened prose guard green.
- **T9 (detection).** Stale tooling file → exactly one `session_start` notification naming the file and the command; fresh repo → zero.
- **T10 (documented path).** The command appears in the README command table (`README.md:195-203`) and its own description names the refresh semantics.

## Design questions the goal does NOT settle

**Testable (a test picks the winner):** bootstrap convergence (T1); validator-root correctness (T2); edit preservation (T3); classification completeness (T4); idempotence (T5); scaffold non-clobbering (T6); override no-write (T7); parity pins (T8); detection count (T9); payload classification — is `_template.md` tooling or data? (T1 vs T4 decide it either way, but the choice is a design input, not a test outcome).

**Open-judgment → route, do not settle here:**
1. **Is detection in scope?** The goal sentence does not require it; the Intent and the ESC-3 disposition do. → **steward** (amended goal is legal while `Deliberating`, per [[engineering-board]]).
2. **Policy or one-off?** Does the tooling class stay `{validate.py, _template.md}` forever, or does every future scaffolded resource get a lifecycle? → **steward**.
3. **Interaction model** — per-file interactive vs two-phase `--plan`/`--apply` (headless `-p`/`json` have no prompt). I argue separateness of the command is not negotiable; the name (`/council-update` vs `/council-refresh`) and the mode are → **product-owner** (+ designer).
4. **Record committed or local?** `.pi/council/*` is documented as committable (`README.md:262-270`); my argument is committed, but it is a real choice → **product-owner**.
5. **Bootstrap friction** — is "confirm a two-file diff once" acceptable for the FLLWUP-50 population, or must the migration be unattended? → **product-owner/steward**.
6. **`_template.md`** — refresh it, or reclassify it as package-resolved and drop it from the refresh set? → **owner/product-owner**.
7. **Seat-accessible refresh** (a seat triggering an update mid-card) — out of scope today → **product-owner**.

## Wiki gaps

- **No page exists for the hop chain** — nothing documents which bytes a consumer executes vs which the package supplies at runtime. This is the largest gap; [[non-clobbering-scaffold]] covers only the copy rule.
- [[override-resolution]]'s table omits `validate.py`, `_template.md`, `preflight.sh`, and does not say *why* `validate.py` is not overrideable (the `ROOT`-from-`__file__` coupling) — a reader concludes oversight rather than design consequence.
- [[preflight]] overstates what a consumer receives: it declares derivation from `council/scaffold/council/preflight.sh` and lists the lock-drift tripwire as a check, but the scaffold copy has no `check-pi-drift.sh` reference and `council/check-pi-drift.sh` is **not in the scaffold tree** (only `council/preflight.sh:60` references it).
- [[non-clobbering-scaffold]] never enumerates the 8-file scaffold tree and has no companion for "what to do when non-clobbering is the wrong path."
- [[engineering-board]]'s FLLWUP-43 retraction properly points at FLLWUP-51 for the wrapped-goal path, but nothing records that FLLWUP-51's pinned `_template.md` sentence is now a file the refresh must install into consumer repos.

**Pages used:** `vault/wiki/index.md`, [[non-clobbering-scaffold]], [[override-resolution]], [[gate-parity]], [[engineering-board]], [[deterministic-merge-check]], [[preflight]].

---

#### owner (job-11.3)

### Step 3 — round 2 positions (verbatim; exchange closed at 2 of ≤3 rounds)

Positions stabilised: separate command (owner conceded to both peers), the
record-based three-state discrimination with ask-once bootstrap / mechanical
steady state (all three aligned, owner conceding his round-1 content-compare
parenthetical was factually wrong), procedures reported-not-written,
`preflight.sh` in the never-touch class, post-refresh in-command validate as a
distinct report block. What remains is open-judgment (detection scope and
site, command name, the Class-1 consent fork as a policy ruling, record
committed-vs-local, `_template.md` refresh-vs-reclassify) — not a claim one
more exchange would settle, so no third round was run (council.md step 3,
stop early on stabilisation).

Dispatches: `owner` job-11.3 (5.6m, 4 turns, total 356462 tok, cost≈$0.0254);
`principal` job-11.4 (5.6m, 6 turns, total 198887 tok, cost≈$0.0162);
`designer` job-11.5 (5.6m, 5 turns, total 185702 tok, cost≈$0.0336). Each was
handed the others' round-1 positions via the card record.

---

#### owner (job-11.3)

Round-2 grounding: I re-read the three recorded round-1 positions on the card (lines 101–700). All file-level facts I cite below were verified by my own reads in this session's round-1 pass (`scaffold.ts`, `index.ts:836–868`, `validate.py` incl. the `ROOT = Path(__file__).resolve().parent.parent` line, `seats.ts:530–559`, the 8-file scaffold tree); no new code claims are introduced here. **No files edited, no branch state touched; deliberation only.**

## Round-2 owner position

### Dispute 1 — Command surface: I concede the separate command

Both principal and designer independently reached "separate command" from different grounds, and both grounds survive my re-check. My round-1 argument (surface economy) was real but weaker than the counter-argument I missed: `/council-init`'s contract is *static palette copy* ("never overwrites", `index.ts:837`) *plus wiki-documented no-op semantics* ([[non-clobbering-scaffold]]: "re-runs are no-ops and user edits always win"). A mutating flag makes both conditional, and a conditional contract is a dishonest signifier — exactly designer's frame. There is also a mechanical point neither peer made: `/council-init`'s current semantics ("run it and the repo gets scaffolded") is the correct default for the *new-repo* population; dry-run-default refresh semantics (designer P5, principal both) would break that population's one-command story if shared. Two intents, two defaults — separate commands. Converged. The name (`/council-update` vs `/council-refresh`) stays routed to product-owner per principal's open item 3; I have no stake.

### Dispute 2 — Provenance: I concede the record, and I was factually wrong in round 1

My round-1 parenthetical — "we cannot distinguish stale from consumer-edited by provenance either — only by content" — is **false**, and I withdraw it. A recorded pristine digest distinguishes exactly what content-compare cannot: `bytes == packaged` (current or stale), `bytes == recorded ∧ bytes ≠ packaged` (pristine-stale), `bytes ≠ both` (consumer-edited). Content-compare alone gives two states; the record gives three, and the third state is the one that decides whether a write is safe. Principal's undecidability argument is correct, and designer's P2/P4 pair is its person-facing form: without provenance I must choose between always-ask (friction forever, designer P4 falsified in steady state) and never-ask (silent overwrite of a hand-edited file, designer P2 falsified, convention-#6 spirit violated). I also accept principal's refinement I missed: the record is *not required for correctness* — required for adoptability, because "no record ⇒ ask" otherwise becomes a **permanent** per-file interrogation, and a permanently-annoying path is a path nobody adopts, which lands us back in ESC-3.

So I adopt the two-artifact provenance design: packaged `council/scaffold.manifest.json` (tooling/data classification, with principal's T4 set-equality guard — strictly better than my hardcoded allowlist constant, because the test forces every future scaffold file to be classified) plus the consumer-side pristine-digest record at `$CONFIG_DIR_NAME/council/scaffold.json` (convention-#3 name, written by `scaffoldInto` on creation only — non-clobbering semantics untouched, principal's T6). Both are new resource types, so principal's I6 stands: AGENTS.md gains a line for each and states the consent-gated write rule in the same change. That's owner work, not a dispute.

The one genuinely contested residue: **the no-record bootstrap default**. Principal rules "no record ⇒ treated as edited ⇒ ask"; I note this *does* falsify designer P4's letter for exactly the ESC-3 population the card is about (they can never have a retroactive record). But I'm conceding it anyway, for one reason principal didn't state: the ESC-3 disposition's own lesson is that *silent* states are the failure class, and the bootstrap is a one-time, two-file, diff-shown review — principal's "one confirmed diff, then mechanical" is the correct reading of "the one-time migration." Silent-auto-update-with-backup of an unclassifiable file would be the first consent-free consumer overwrite in the product's history; that is a policy, not an implementation detail (principal's portfolio blind-spot is right). Ask-once at bootstrap; mechanical forever after.

### Dispute 3 — Detection/observation: in scope for adoptability, routing the ruling

The goal sentence doesn't require detection; the Intent does ("an override path alone is insufficient — this card must deliver an **adoptable** path"). A path nobody learns exists has zero adoption in the ESC-3 population — repos whose maintainers will never read release notes. And designer's moment 1 (upgrade) is precisely when a `session_start` check fires: the maintainer upgrades, the next session sees tooling ≠ packaged and names the command. Designer and principal independently point at the same moment; I missed it entirely in round 1 (my report-only surface only helps people who already run the command). I endorse it in scope, non-fatal, house try/catch pattern. **One precision requirement on principal's T9**: "notify once" must mean *once per drift condition* (the set of drifted tooling files), not once per session and not once ever — a fresh drift after a fix re-arms; a known drift doesn't nag. That's a testable spec point, not a taste point. Whether detection rides this card or is amended into the goal: steward rules (principal's open item 1 — agree, amended goal is legal while `Deliberating` per [[engineering-board]]).

### Dispute 4 — Procedures conjunct: we already agree; merge the two halves

My "report per-file `matchesPackaged`/`differs`, delete is a documented manual step" and principal's "report `shadowed`, write nothing" are the same design with different label granularity. Merged: report status `shadowed` **plus** `matches-packaged | differs` per override copy — the second half is free information (it tells the consumer whether their override still buys them anything) and costs nothing. No silent deletion, never written under `$CONFIG_DIR_NAME/council/procedures/`. No dispute remains.

### Dispute 5 — The `ROOT` coupling: doesn't change my write path, but principal's trap is real and I adopt its test

My design was always copy-based, so the trap (packaged validator resolving `PKG_ROOT/council/cards`, printing false green) never touched my mechanism — but principal's T2 is the correct *red* form of a test I'd under-specified: my claim 1 ran the post-refresh validate in the consumer tree; T2's form (drop a board line, document-run the validator, must FAIL) also catches the false-green generator class, which is the worse failure. Adopt T2 verbatim. And the coupling's *reasoning* must land in the wiki: [[override-resolution]]'s table should say *why* `validate.py` is not overrideable (principal's wiki-gap #2) — a reader currently concludes oversight. Wiki-ingest obligation, recorded.

### Carried forward from my round-1, undisputed and still load-bearing

- **`scaffoldInto`-first**: files *added* to the scaffold since init are created by the existing non-clobbering path before any tooling treatment. Principal's design omits this; it's free capability and it keeps "the refreshable set is two files" true for update-in-place only.
- **Post-refresh in-command `python3 council/validate.py`** with exit status surfaced (my claim 7, principal's #6-adjacent, designer's "output is the deliverable"): a refresh can *newly* FAIL a consumer board (FLLWUP-51's wrap gate reaching a previously-silent board). Handing over the newly-red gate in the same output is honest; discovering it at the next run is not. This is also the card-record's own in-surface ruling applied.
- **`preflight.sh` stays data-class, report-only** (all three seats converge by different routes — its own "adapt to your project" header is the design evidence). My documented-manual-`cp` remediation line stays as the support story; my open item 1 (`--refresh-file` later) stays open, unrouted urgency.
- **Dry-run/plan default with two-phase apply** — adopted from both peers over my round-1 act-then-report; it's what makes headless `-p`/`json` viable (principal's point) and satisfies designer P5.
- **`_template.md` stays tooling-refreshable in v1**; principal's package-resolved reclassification is the better end-state but needs engine work (procedure-text substitution has no precedent — `$COUNCIL_PROCEDURES` substitutes one thing, not arbitrary packaged assets). Route per principal's open item 6: product-owner, with my recommendation "v1 refreshes it; reclassify as its own card."
- **Backup before any consented write** (principal + designer): timestamped copy, path named in the output. Location is an implementation detail; designer's `.council-init.bak/` name is wrong-shaped (it's not init's artifact) — `$CONFIG_DIR_NAME/council/` sibling is my lean. Non-binding.

### The one design point I add for routing (confirm granularity)

With a record present: **`behind` (pristine-stale) is consented at plan granularity, `diverged` (consumer-edited) at file granularity.** I.e., running the apply after reviewing the plan is the explicit act for all behind-files (designer P4: no per-file friction for the pristine path of least resistance); a diverged file is skipped from the plan-apply unless individually accepted (designer P2). This threads principal's I2 ("no consumer byte overwritten without an explicit act" — the reviewed plan-apply *is* the act) against the permanent-interrogation failure he named. It also decides his open item 3's mode question for the common case; the bare flag-vs-interactive residue stays product-owner's.

### Tradeoffs accepted

- I gave up the no-new-state simplicity that was my round-1's core virtue: the design now owns a packaged manifest + a consumer record + two classification tests. Worth it because the third state (consumer-edited) is the entire difference between a trustworthy path and a clobber risk.
- Ask-once bootstrap means the ESC-3 population's adoption is not zero-friction. One two-file review, once, then mechanical — accepted against silent-overwrite-of-unclassifiable-files.
- Behind-at-plan-granularity consent is the least conservative reading of I2 available. If product-owner rules stricter (per-file consent even for behind), the path still works; only friction changes.

### Testable claims (live ones only — the converged ones both peers' T1–T10 already carry)

1. **Record-state discrimination (red today):** same repo, three tooling-file states — pristine-stale (== old packaged, == recorded), consumer-edited (≠ both), matches-current — the report must emit three distinct statuses, and only the consumer-edited one is gated behind per-file consent. Settles dispute 2's behavioral residue; fails on any content-compare-only design (i.e., my round-1).
2. **Notification re-arm semantics (red today):** drift notify → fix by refresh → introduce a *new* drift → exactly one new notification, no repeat for the resolved one. Principal's T9 as I've amended it.
3. **Plan-granularity consent boundary:** plan-apply writes all behind-files and skips all diverged-files; a diverged file's bytes change only after its individual accept (extends both T3 and T5).
4. **False-green trap pin (principal's T2, adopted verbatim):** document-run validator on a deliberately-corrupted board must FAIL — reds any future "resolve instead of copy" simplification.

### Remaining open-judgment (routing, not settling)

1. Detection in/out of scope + goal amendment → **steward** (my rec: in, per the adoptability argument).
2. Command name; interactive-vs-two-phase residue; behind-consent granularity → **product-owner** (+ designer on copy).
3. Record committed vs local; `_template.md` v1-refresh vs package-resolved; policy question (does every future scaffolded resource get a lifecycle?) → **product-owner/steward** per principal's items.
4. Backup location, exact status glyphs (`~`/`=` vocabulary per designer's grammar-extension point) → implementation, owner's call at build time.

Both peers' wiki-gap lists stand; no wiki page is authored by this seat, and none of the gaps block the design. I have no remaining dispute with principal or designer that a test could settle — the three concessions above convert my round-1's contested positions into converged ones, and everything still open is a ruling, not a claim.


#### principal (job-11.4)

## Round-2 position — `principal`

**Read:** card `council/cards/FLLWUP-50.md` (all three round-1 positions verbatim), `vault/wiki/index.md`, [[non-clobbering-scaffold]], [[override-resolution]], and both sides of the seam re-opened this round: `extensions/scaffold.ts` (full), `extensions/index.ts:836-868` (council-init handler) and `:778-790` (procedure scan), `extensions/seats.ts:557-560`, `council/scaffold/council/validate.py:30-32,173`, `test/scaffold.test.ts`, `test/prose.test.ts:1-45`, `README.md:196-198,233-235`.

### Cross-seam reading

The seam is unchanged from my round-1: the packaged *procedure* (current) names a repo-relative *artifact* (frozen). Two facts I re-verified and that decide several disputes below:

- `validate.py:30` `ROOT = Path(__file__).resolve().parent.parent` — the copy is load-bearing; the file has no root argument and no cwd. Owner's and designer's designs both keep it a consumer copy and refresh it in place, so **both preserve I5 by construction**. Neither *names* the invariant, so it is unguarded prose-ward — a later "resolve it from the package like procedures" refactor re-opens it.
- `proceduresDir` (`seats.ts:557-560`) is **whole-dir** first-hit and is used only for the child system-prompt block (`hub-tools.ts:214`, `dispatch.ts:86`); the command surface (`index.ts:783-787`) scans both dirs and dedupes **per filename**. Owner's Class-2 claim ("a consumer with no local copies already reads the installed package's procedures") is correct, and is stronger than owner stated: a consumer with a *partial* local procedures dir gets a system prompt listing only their local files. That belongs in the report, not in the write path.
- Owner's design **adds no new resource type**: classification is a shipped constant in `scaffold.ts`, the report is derived from disk. That is decisive for dispute 3 (below).

### Blind spots

- **Owner (implementation vantage).** From inside `scaffold.ts`, "content-compare, overwrite Class-1 unconditionally" looks complete because it *does* close the ESC-3 skew. What it cannot see is that it has silently made a **policy choice** — "a hand-edited `validate.py` is not consumer data" — and that the designer's whole forcing-function argument (P2/P4) is a claim about that policy, not about the mechanism. Owner's "content-compare suffices" is true for the report triple and irrelevant to the question actually being asked: content-compare *cannot* distinguish pristine-old from hand-edited, so it cannot "suffice" for a preserve-edits policy — it is only sufficient for the overwrite-always policy owner chose.
- **Designer (person-facing vantage).** It models three buckets from the user story, but it does not know that the overwrite-always design satisfies the goal's literal protection list (board/cards/wiki) while failing its own P2. It also treats "unedited-but-stale → refresh quietly" as free; with no record it is only free if the design never asks, i.e. owner's policy — so P2/P4 and P5 are not independently satisfiable, and the designer did not notice the coupling.
- **My own round-1 vantage.** I over-claimed that the record is *required for adoptability*. Owner found the other resolution — don't ask. I concede that below.

### Reframe (narrowed, and the one real fork)

My round-1 reframe bundled four things whose necessity is not equal, and owner is right about the ones that are unnecessary:

1. **`scaffold.manifest.json`** — not required. Owner's hardcoded Class-1 allowlist does the same job with no new resource type, hence no AGENTS.md convention line (I6 moot). The *guard* I wanted is still needed, but it does not need the resource: add a test asserting the allowlist ∪ the data set == the scaffold tree file set. That fails the moment a future scaffold file lands unclassified, and costs no manifest.
2. **`scaffold.json` provenance record** — required **iff** the product picks preserve-edits. Owner's design makes it unnecessary by choosing overwrite-always. So the record is a consequence of a policy, not a goal requirement. I withdraw "required."
3. **Separate `/council-update` command** — still my lean, but I accept it is open judgment, not testable (dispute 1 below).
4. **`session_start` detection** — route, do not smuggle (dispute 5).

**The one real fork the consolidator must surface:** does a divergent Class-1 tooling file (`validate.py`, `_template.md`) get overwritten unconditionally (owner), or preserved-and-asked-about (designer P2/P4, my round-1)? The goal protects only board/cards/wiki, so **both satisfy the goal** and a judge cannot red either on the goal text. Everything else follows mechanically from this fork — the record exists only on the preserve side. This is the fork the deliberation should hand up as a product ruling, not resolve by argument.

### Direct responses to the five disputes

1. **Command surface — open judgment, with one testable residue.** The *behavioral* invariant is testable either way: a flag-less `/council-init` leaves every existing byte untouched (`test/scaffold.test.ts:12-33` already pins the scaffold half). The *choice* is not settled by any test. Owner's "doubles the surface for zero capability" is not right in either direction: a `--refresh` flag is also new surface — a new description sentence, dry-run semantics, and a README row — so both options are one new user-facing thing. Route to product-owner; my lean (separate command, shared `+ / =` grammar) stands but is not load-bearing. If the flag wins, the contract test is that `/council-init`'s description no longer asserts unconditional "never overwrites."
2. **Provenance — behavior testable, correctness open-judgment.** Runnable falsifier for owner's mechanism claim: build two repos, one with a pristine-old `validate.py`, one hand-edited; assert content-compare yields the *same* classification for both. It will — that is arithmetic, and it is why owner chose overwrite-always rather than a record. So the test settles mechanism, not policy. I concede the record is not required by the goal.
3. **I6 — moot for owner, unaddressed for designer.** Owner adds no resource type, so no AGENTS.md line and no #6 write-rule restatement is needed; owner's test #3 does guard #6's non-clobbering semantics. Designer's option (b) side-car manifest *would* trigger I6 and the designer did not note it. If a record is chosen, I6 stands verbatim: AGENTS.md gains a line for the new resource type and states the non-clobbering write rule, or a future contributor reads #6 as prohibiting the refresh.
4. **`ROOT` trap / I5 — preserved by both, stated by neither.** Owner's and designer's designs keep the copy and run it consumer-root-relative, so no false-green. But the invariant is implicit in both; my T2 (delete a board line, validate as documented, must FAIL) must land in the final plan regardless of which surface wins.
5. **Post-refresh validate — in scope; detection — route.** Owner's in-command `python3 council/validate.py` after refresh is cheap and directly in-surface: FLLWUP-51's consequence (a wrapped goal newly FAILing) arrives *through* this refresh, and reporting it in the same breath is the honest reading of "consumer-card validation behavior is in-surface" (the step-1 record says so). I accept it. `session_start` detection is the only thing that closes designer's moment-1 gulf ("nothing tells her"), but the goal sentence ("a documented, supported path") does not require it — route to steward as a goal amendment rather than bundling it.

### Testable claims

- **Policy fork, runnable:** repo with a hand-modified `validate.py`; flag-less refresh → owner's design changes bytes; preserve-edits design leaves bytes and reports `diverged`. The test fixes the behavior, not the winner.
- **Content-compare limit:** pristine-old vs hand-edited `validate.py` classify identically under byte-compare (falsifies "content-compare suffices" *for preserve-edits*, not for the report).
- **Classification guard without a manifest:** allowlist ∪ data-class == `walk(scaffold)` file set; reds when a scaffold file lands unclassified.
- **I5:** delete a line from `board.md`, run the documented validate; must FAIL. `All council artifacts valid` ⇒ the installed validator is running against the package tree — reject.
- **Refresh does not perturb the packaged pins:** no write under `council/fixtures/**`; 10-copy `validate.py`/`_template.md` parity and the 8 `seed.treeDigest`s unchanged by the refresh itself (they re-pin when the *packaged* `validate.py` next changes, which is a separate change, not this card's).
- **Non-clobbering preserved:** plain `scaffoldInto` after a refresh is still a no-op (extends `test/scaffold.test.ts:12-33`); prose guard `test/prose.test.ts` stays green.

**Still disputed:** only the Class-1 policy fork (testable behavior, open-judgment winner). **Open-judgment to route:** command surface (product-owner), the fork itself (product-owner/steward), `_template.md` refresh-vs-reclassify (owner/product-owner), record committed-vs-local if the preserve side wins (product-owner), `session_start` detection as a goal amendment (steward). I converge with owner on: no manifest, no new resource type, no engine-resolved validator, Class-2 procedures reported-not-written, `preflight.sh` in the never-touch class.


#### designer (job-11.5)

## Design position

Three concrete moves against the round-1 exchanges, from the person-facing seat only:

**One — separate command, but the help listing is the first signifier.** I join principal against owner's `--refresh` flag on `/council-init`; the existing description at `extensions/index.ts:837` ("never overwrites") is a trust contract, and a flag that violates it under the same name erodes the contract the consumer formed. Owner is wrong on this point. But I tighten both seats: the new command's `registerCommand` description is the first thing a maintainer reads (in `/commands` or `/help`), and it must already teach the protected class — not the operation. "Update packaged council tooling (validate.py, _template.md, preflight.sh) to the installed version; never touches your board, cards, or wiki; dry-run by default" belongs in the description, before any output runs.

**Two — adopt principal's five states, keep `/council-init`'s glyph rhythm, and split the bootstrap from steady state.** Owner's `updated`/`differs`/`identical` collapses "you are stale but I'm safe to write" into "differs," forcing consent forever; the consumer who knows her file is pristine (because it matched the scaffold bytes last refresh) should not be re-asked. Principal's `behind` carries that case. Principal's `shadowed` is structurally necessary — a `differs` on a local procedure override reads as "your override drifted," which is exactly the wrong message to send about an intentional tuning act. But principal's grammar abandons the `+`/`=` family for new full words; the maintainer who learned init loses the visual rhythm. Reuse the column-aligned table; introduce five glyphs (`=`, `↑`, `~`, `-`, `…`) keyed to the five states. The refresh output's table is the **conceptual model rendered** — principal is right that five states are needed, owner is right that the table should feel like init. Bootstrap = ask per `~`; steady state = free on `↑` once the recorded digest matches on-disk. Owner and principal both describe halves; neither holds the whole.

**Three — `session_start` notification is the wrong moment for drift; surface it when it bites.** A passive drift banner trains the maintainer to dismiss the surface that emits it. The "moment of suspect" is the moment the stale file becomes a consequence — when she invokes a procedure that depends on a rule her `validate.py` no longer enforces. The detection belongs at the *use site*, not at session start. This is a change from my round-1 framing, which named session_start detection as a needed solution; the round-2 exchange showed me that pre-announcement without a coupled consequence is the notification-fatigue failure mode. The consequence-coupled surface pairs the drift with the cost she just paid, which is what makes the message land.

**Bonus (neither seat raised) — the post-refresh validate output must be a separate report, not a fused line.** Owner proposes auto-running `validate.py` after refresh (T7-equivalent). If the consumer's cards were authored under the old rule and now FAIL under the new one, a fused report ("refresh complete + 3 FAIL: …") reads as "refresh broke my repo," which she will roll back from. The refresh output says what files moved; the validate output says what her board now says under the new validator. Conflating them turns refresh into the blamed actor when the board is independently red. The two must be visually distinct blocks in the same output.

## Gulf closed

- **Evaluation, at the moment of discovery** — the command's help description teaches the protected class before any output runs (P6).
- **Evaluation, at the moment of action** — the table answers the four-question matrix (what changes, what needs consent, what is protected, what overrides are doing) from the table alone, without reading prose (P1-amended).
- **Execution, at the moment of bootstrap** — first refresh asks per divergent file; second refresh is mechanical for any file whose recorded digest matches on-disk (P2-amended; this is principal's conservative default + owner's content-compare mechanic composed over time).
- **Evaluation, at the moment of suspect** — drift surfaces at the procedure invocation that depends on it, with the consequence named in the notification, not at session_start (P7; supersedes my round-1 framing).

## Principle and evidence

- **Honest-surface pattern**, against owner's `--refresh` flag. The `/council-init` description string at `extensions/index.ts:837` is the consumer's trust contract; a flag that contradicts it under the same command name is the trust-eroding move the [[echo-then-run]] and [[gate-parity]] pages both forbid (a write that promises one thing and does another). Principal's separate command preserves the contract; owner's flag does not.
- **Knowledge in the world**, against owner's "ask her to learn a new vocabulary." `extensions/index.ts:849-855` establishes `+ created / = skipped` as a learned visual form. The refresh output is the *same kind* of operation (a write list over scaffold paths) and should share the column-aligned rhythm. The five states are new glyphs, not new full words, so the column reads as the family. Evidence: `extensions/index.ts:849-855` for the existing rhythm; `vault/wiki/non-clobbering-scaffold.md` for the "skipped = protected-by-design" reading the maintainer already does.
- **Signifier at the right artifact**, against principal's `session_start` notification. A notification's attention is earned by the consequence it pairs with, not the state it announces. A generic "you're stale" banner without a coupled cost is the dismissal-training failure mode the [[echo-then-run]] page documents in adjacent form (a screen that asserts state the user can't verify gets ignored). Evidence: principal's T9 already names detection — but couples it to no consequence, which makes the notification a passive banner rather than an evaluation signal.
- **Forcing function at the smallest unit of trust**, against owner's auto-validate fusion. A destructive act must be per-file, per-act, and reversible (my round-1 P2). Fusing refresh + validate fuses two consequences the consumer reads as one — "refresh overwrote validate.py; now validate.py says my board is red; therefore refresh broke my board." The conflation is the error; the visual separation is the fix.
- **Conceptual model rendered, not stated**, against principal's manifest as the truth source. The maintainer who reads the manifest file is not the maintainer we're designing for; the maintainer who reads only the command output is. The five-state table is the model. A separate `<repo>/$CONFIG_DIR_NAME/council/scaffold.json` (principal's record) is implementer-correct as a *bootstrap memory* but must never appear in the output — it's an internal detail that the five-state glyphs already encode for the person.

## Falsifiable predictions (amended + new)

- **P1 (amended from round 1).** A maintainer who runs the refresh command and reads only the five-state table answers: (a) what would change without her consent, (b) what needs her consent, (c) what is protected (board/cards/wiki listed in the table even when `unchanged`, so she sees the class exists), (d) what her repo-local procedure overrides are doing (`… shadowed`). Falsifier: any of the four is unanswered by the table alone; or the protected class is omitted (the output lists only files that moved, not files the command refused to touch).
- **P2 (amended).** For a maintainer whose unedited-but-stale `validate.py` is at play: the first refresh (no scaffold.json record) asks her for consent; the second refresh (record now present, on-disk matches recorded) does not — it's reported `↑ behind` and refreshed without prompt. Falsifier: the first refresh overwrites silently (conservative default bypassed); or the second refresh still asks (record isn't being read, or the steady-state path collapses back to ask).
- **P3 (unchanged).** A git diff at the consumer's working tree after refresh shows zero changes under `council/board.md`, `council/cards/*.md`, or `vault/wiki/**` — and the table makes that promise visible, not just true.
- **P4 (unchanged).** A maintainer who did not edit `validate.py` sees it as `↑ behind` and refreshed without a confirm prompt.
- **P5 (unchanged).** A flag-less run produces a dry-run plan; mutation requires an explicit apply flag or per-file accept.
- **P6 (new).** A maintainer who has only read `/commands` (no other docs, no AGENTS.md) can name the three protected file classes — board, cards, wiki — from the refresh command's description string alone. Falsifier: the description is generic ("refresh packaged tooling") and she has no signal until she runs it; or the description mentions the action ("update tooling") without mentioning the protected class.
- **P7 (new).** A maintainer who invokes a procedure that calls into a stale packaged file sees a consequence-coupled notification whose first line names the cost the stale file had on her run (e.g., "this FAIL would not have fired under `validate.py` vY; the rule changed in FLLWUP-51"). Falsifier: the notification is generic ("3 packaged files drifted — run /council-update") with no consequence named; or the notification never fires even when the stale file was the proximate cause of a downstream surprise.
- **P8 (new).** A maintainer whose board independently FAILs under the new validator (because her cards were authored under the old rule, not because of refresh) reads the output and can separate "refresh changed these files" from "your board on the new validator has these issues" — the two are distinct blocks, not fused. Falsifier: a fused line ("refresh complete + 3 FAIL: …") reads as "refresh broke my repo"; or the validate result is omitted, and she doesn't know her board is red until she re-runs validate herself.
- **P9 (new).** A maintainer who has never opened AGENTS.md can answer "what is this command allowed to touch?" from the command's output alone. Falsifier: she has to consult AGENTS.md convention #6 to interpret the output (the surface assumes knowledge she doesn't have).

The load-bearing ones remain P1-amended, P2-amended, P3, and now P6 — the help-listing-as-signifier claim is the cheapest design move with the largest evaluation impact and neither seat named it. P7 and P8 are the two I changed my mind about; P9 is the design discipline I want the consolidator to track.

**One small gap both seats share:** neither names the case where the *package removes* a scaffold file the consumer still has (the inverse of principal's `removed`). Refresh should report this as a sixth state (`local-only`) and never delete. Owner and principal both skip it; it should appear in the table before the launch, not after the first consumer reports a surprise deletion.

## Preferences, ranked last

- **The five glyphs (`=`, `↑`, `~`, `-`, `…`) are taste**, not a grounding. The states are load-bearing; the glyphs are not. If the consolidator lands on three-character mnemonics (`upd`, `ask`, `rem`, `shd`, `ok`) I do not object; the table-rhythm principle is the load-bearing one.
- **Help-listing verb choice** ("Update vs. align vs. refresh vs. resync") is taste. My round-1 file was "refresh"; I now lean "update" because principal's `/council-update` reads as the verb the state table uses (`↑` = update-from-package), but any verb that the help-description sentence can hang the protected-class clause off is fine.
- **Whether `~ diverged` rows show the actual diff inline** in the table or only on `--verbose` is taste. The forcing-function principle (round-1 P2) is mine; the rendering of the diff is not.
- **Whether the consequence-coupled notification (P7) fires from the engine or from the procedure** is implementer territory — I do not pick a winner; both routes satisfy the prediction.


### Step 4 — skeptic attacks and tests (job-11.6 timeout→cancel→re-dispatch job-11.7, 6.3m, 15 turns, total 705376 tok, cost≈$0.0209)

Dispatch note: the first skeptic dispatch (job-11.6) timed out at its 15-minute
window mid-gate with no deliverable emitted; it was cancelled and re-dispatched
once with the same input per dispatch discipline (job-11.7, settled). No third
dispatch was needed.

All probes complete. Emitting final report.

---

# Skeptic report — FLLWUP-50 (step 4)

**Verdict: `no open objections` against the *design*. Two `closed-red` objections against the *record's accuracy* (seed-digest count; P4's "unchanged" stamp). No `blocks`.**

Every mechanism claim I could make runnable on today's tree ran green; the two reds are prose-level errors in the record, not design failures.

## Objections

**O1 — `closed-red` (record accuracy): "8 `seed.treeDigest`s" is wrong by 2× — the tree pins 16.**
Target: card intent ("packaged seeds carry a pinned sha256 `treeDigest`"), designer #7, principal I4 ("8 `seed.treeDigest`s re-pinned in the same change"), owner round-2 (same).
Settling test: `grep -l '"treeDigest"' council/fixtures/*/fixture.json | wc -l` → **16**. All 16 fixture `seed/` dirs carry a digest, and the loader enforces *every* one at load (`eval-fixtures.ts:684-685` throws on mismatch); only `T5`'s 8-task `TASKS` sublist is test-pinned (`fllwup43-goal-oracle.test.ts:167`). The "8" is the count of seeds that ship `council/validate.py` (verified per-fixture: exactly board-create-card, council, council-runner, features-deliver, features-new, owner, wiki-ingest, wiki-lint have `seed/council/validate.py`; the other 8 — consolidator, designer, judge, principal, product-owner, skeptic, steward, wiki-query — have seed trees without it). Consequence for the design: the plan's "re-pin N digests when the payload changes" scoping is understated; changing the packaged payload reshapes 16 digest-linked seed trees, not 8. Low mechanism impact, real pin-list impact.

**O2 — `closed-red` (record consistency): designer's P4, stamped "(unchanged)" in round 2, contradicts the converged ask-once bootstrap for exactly the card's population.**
Target: P4 "A maintainer who did not edit `validate.py` … refreshed without a confirm prompt. Falsifier: … asked for confirmation." Round-2 P2 was amended to "first refresh asks; second is mechanical," but P4 was *not* amended. For a record-less consumer repo (the ESC-3 population), the converged rule "no record ⇒ treated as edited ⇒ ask" makes the first refresh fire a per-file prompt *on the untouched-but-stale `validate.py`* — P4's own falsifier, by design. Owner concedes this in his own round-2 text ("this does falsify designer P4's letter for exactly the ESC-3 population … I'm conceding it anyway"). Settling test (the design's own red-first test, owner claim 1 / principal T1): record-less repo, pristine-stale `validate.py`, first refresh must ask ⇒ P4-as-written is red. P4 survives only re-read as P2-amended's steady-state half — i.e. it is redundant with P2-amended and its "unchanged" stamp is false. The P2 amendment was not propagated to P4.

**O3 — `closed-green` (empirical): the `ROOT` coupling and the false-green trap are exactly as claimed, and the copy-based design preserves I5.**
Target: principal's trap + owner's adoption. `validate.py` line 33 `ROOT = Path(__file__).resolve().parent.parent`; no root arg, no cwd (docstring's "run from the repo root" is advisory; code never reads cwd). Empirically: I copied the scaffold validator into a fresh `mktemp` consumer tree; a wrapped-goal card FAILed against the *consumer* tree (`FAIL: TST-1: frontmatter line 8 'wrapped continuation…' is not 'key: value'`, exit 1) — the validator checked its own copy's tree, never the package's. Engine-resolved validation would indeed print false green on `PKG_ROOT/council/cards`. All three seats' copy-based designs preserve this.

**O4 — `closed-green` (empirical, minor): owner's claim-7 vocabulary is approximate.**
Wrapped-goal FAIL text in this tree: `"is not 'key: value' — a wrapped/continued value, or the closing '---' is missing (a line break ends the value; keep the goal on one line)"` — contains "wrapped/continued value", "line break", "value", but no literal `wrap`/`second line` tokens as owner listed. Substance holds (a refresh can newly-FAIL a previously-passing board); the quoted tokens are not verbatim.

**O5 — `closed-green`: 10-copy parity pins are real and green.** `find council -name validate.py` = 10; `_template.md` = 10; pins at exactly `fllwup43-goal-oracle.test.ts:132` and `:144` (`T3`/`T3b`). Ran with prose suite: **28 pass / 0 fail**.

**O6 — `closed-green`: `scaffoldInto` non-clobbering semantics claimed are the code's actual semantics.** `extensions/scaffold.ts` walk has `existsSync(dst) → skipped`, `preflight.sh` `@CONFIG_DIR@` render + `mcp.json` non-clobbering write, no version/digest state anywhere. `bun test test/scaffold.test.ts`: **5 pass / 0 fail** ("first run creates everything, second run skips everything" present). The "record written on creation only" is pure design (untestable today — code absent); principal's T6 extension is the correct red-first shape.

**O7 — `closed-green`: `proceduresDir` whole-dir first-hit, both consequences, exactly as the seats claimed.** `seats.ts:557-560` returns override dir iff it exists, else `PKG_ROOT`. Consumers: `hub-tools.ts:214` + `dispatch.ts:86` (child system-prompt — partial local dir ⇒ system prompt lists only local files, principal's stronger claim true), and `index.ts:777-792` scans both dirs with per-filename dedupe for the command surface. Owner's Class-2 "no local copies ⇒ reads installed package's procedures" is correct.

**O8 — `closed-green`: preflight divergence claim and `preflight.sh`-as-data classification both hold.** Scaffold copy of `preflight.sh` has no `check-pi-drift` reference; root `council/preflight.sh:60` has `bash council/check-pi-drift.sh "$PWD" || exit 1`; `council/check-pi-drift.sh` exists at root, absent from the scaffold tree. The scaffold copy literally carries the "adapt to your project" section. Principal's wiki-gap and the never-touch classification are both grounded in the real bytes.

**O9 — `closed-green`: no engine reference to `validate.py` or `_template.md`** (grep of `extensions/`: zero hits); no version stamp anywhere in `council/scaffold/` (grep: zero hits); procedure invocation line refs are exact (`council.md:64,119,227,309,334`, `board-create-card.md:94`, `features-new.md:196`, `features-deliver.md:38`).

**O10 — `closed-red` (record accuracy, minor): designer round-1 "the 7 from `council/scaffold/`"** — the scaffold tree ships **8** files (`board.md`, `cards/_template.md`, `.council.json`, `preflight.sh`, `validate.py`, `vault/CLAUDE.md`, `vault/wiki/index.md`, `vault/wiki/log.md`); step-1's "8 files" is the correct count.

**O11 — `closed-green` (falsifiable-by-construction): P2-amended is exactly the converged ask-once bootstrap — no conflict.** "First refresh (no record) asks per `~`; second (record present, on-disk matches recorded) is mechanical" is the bootstrap carve, not a competitor. The only untruth in this corner is P4's stamp (O2).

**O12 — `open-untested` (correctly so): designer P1, P3, P5, P6, P8, P9, P7.** None have code to run against today. P3/P5/P8 are mechanically satisfiable by construction (class-exclusion write path; two-phase apply default; distinct report block — all three are adopted design requirements, so they cannot conflict). P1/P6/P9 need a persona test on the future command's output; no in-repo smoke exists. P7's mechanism (consequence-coupled detection at use site) is explicitly routed to steward as open judgment, so its falsifier is un-runnable until that ruling — the routing is honest, not a smuggled testable claim.

**Routing audit (surface 5):** the Class-1 fork is correctly handled — its test fixes behavior, the winner is policy, and principal explicitly routes the winner. The one item that *is* testable but was asserted as fact — the seed-digest count (O1) — was not routed anywhere; it must be corrected in the record, not ruled on. No routed item turned out to be purely a testable fact dressed as policy.

## What I ran

1. `grep -l '"treeDigest"' council/fixtures/*/fixture.json | wc -l` → **16**; per-fixture audit: 16 `seed/` dirs, 8 with `seed/council/validate.py`; `find council -name validate.py` → **10**, `_template.md` → **10**.
2. `bun test test/scaffold.test.ts` → **5 pass / 0 fail**.
3. `bun test test/prose.test.ts test/fllwup43-goal-oracle.test.ts` → **28 pass / 0 fail, 221 expects**.
4. `python3 council/validate.py` on a `mktemp` consumer tree (scaffold copy + wrapped-goal card + dropped board line) → `FAIL: TST-1: frontmatter line 8 'wrapped continuation line with a named value here' is not 'key: value' — a wrapped/continued value, or the closing '---' is missing (a line break ends the value; keep the goal on one line).` exit 1 — consumer-tree validation, lineage vocabulary, no false green. (My probe used an invalid `TST-1` ID, an artifact, immaterial to the demonstrated behavior.)
5. Source verifications: `validate.py:33` ROOT coupling; `seats.ts:557-560`; `scaffold.ts` walk; `index.ts:836-868` handler + "never overwrites" description + `+ created / = skipped` report (`  + ${c}` / `  = ${s}`); `index.ts:777-792` dual-scan dedupe; `hub-tools.ts:214`, `dispatch.ts:86`; `diff council/preflight.sh council/scaffold/council/preflight.sh` (6 diff hunks: `@CONFIG_DIR@` render + check-pi-drift section replaced by "adapt to your project"); zero engine hits for `validate.py`/`_template`.

## What this means for the design

**No block.** The converged mechanism — separate command, two-artifact provenance (manifest-less: allowlist test suffices; consumer record), three-state discrimination, ask-once bootstrap, plan-granularity-behind/file-granularity-diverged consent, procedures reported-not-written, `preflight.sh` never-touch, post-refresh validate as a distinct block, dry-run default — survives every check the tree can currently perform, and the false-green trap everyone converged around is real and empirically preserved. The record needs two corrections before it is relied on verbatim: **(a)** the seed-digest count is 16, not 8 — size any re-pin list accordingly; **(b)** designer P4's round-2 "(unchanged)" stamp is false — P4's letter is falsified by the design's own ask-once bootstrap for the ESC-3 population, exactly as the owner's concession states, and P4 should be re-stamped as subsumed by P2-amended.


### Step 5 — synthesis (consolidator, job-11.8: 3.8m, 5 turns, total 161681 tok, cost≈$0.0143)

# Synthesis — FLLWUP-50, step 5 (consolidator)

*Card:* `council/cards/FLLWUP-50.md` — "Supported refresh path for packaged council tooling in initialized consumer repos" (EPIC-9). Sources consulted: the card record in full; `vault/wiki/index.md`, [[non-clobbering-scaffold]], [[override-resolution]] (to verify the record's restatements of the copy rule and the override table — both hold as cited). The wiki does not cover a refresh/update surface at all; that absence is itself the card, and both generators' wiki-gap lists already record it as follow-up, none PR-blocking.

## 0. Converged mechanism (as it stands after two rounds + the skeptic)

A **separate, mutating TS command** (name open — `/council-update` vs `/council-refresh`) that refreshes **exactly the tooling class** — today `council/validate.py` and `council/cards/_template.md` — in an initialized consumer repo, and nothing else:

- **Classification in code, guarded by test.** A shipped tooling-class allowlist in `scaffold.ts`, plus a test asserting *allowlist ∪ data-class == the 8-file scaffold-tree set* (principal's manifest `scaffold.manifest.json` withdrawn in round 2 — the guard test achieves it with no new resource type). Data class — never written, report-only — is `board.md`, `cards/*`, `vault/**`, `.council.json`, `mcp.json`, and `preflight.sh` (its own "adapt to your project" header is the evidence; skeptic O8 confirmed the bytes diverge from root, including the absent `check-pi-drift.sh`).
- **`scaffoldInto`-first:** files *added* to the scaffold since the consumer's init are created by the existing non-clobbering path before any tooling treatment (owner's carry-forward, undisputed).
- **A provenance record that gives three states:** `$CONFIG_DIR_NAME/council/scaffold.json` (path → sha256 + package version), written by `scaffoldInto` on creation only, so non-clobbering semantics are untouched. Record ⇒ `behind` (pristine-stale, consentable at **plan** granularity) vs `diverged` (consumer-edited, per-file accept only, diff shown) vs current. **Ask-once bootstrap:** no record ⇒ conservative default (treat as edited ⇒ ask); one confirmed two-file review, then mechanical forever after. *This whole element is conditional on the Class-1 consent fork (§2.1); the fork's other leg deletes the record.*
- **Five-state report** (principal's states on init's `+`/`=` column rhythm, designer's synthesis) — `=` unchanged, `↑` behind, `~` diverged, `-` removed, `…` shadowed — plus the designer's sixth, `local-only` (package removed a file the consumer still has: report, never delete; no seat contested it), with the protected class listed in the table even when unchanged. Glyphs are explicitly taste (designer's own ranking-last note).
- **Procedures conjunct = reported, not written:** per local override copy, `shadowed` **and** `matches-packaged | differs` (the second tells the consumer whether their override still buys anything); never any write under `$CONFIG_DIR_NAME/council/{procedures,agents}/`; deletion of a stale override stays a documented manual step (git is the backup).
- **Dry-run/plan default; mutation only via explicit apply** (two-phase or per-file accept — mode residue routed); **timestamped backup before any consented write**, path named in output (location owner's call at build time; designer's `.council-init.bak/` shape dropped by consensus).
- **Post-refresh `python3 council/validate.py` run against the consumer root, always, surfaced as a visually distinct report block** — never fused with the refresh result (a newly-red board is the board's, not refresh's; FLLWUP-51's positional-rule consequence arrives *through* this mechanism, and the step-1 record rules consumer-card validation in-surface).
- **Unanimous rejection, now test-pinned:** engine-resolved validation (packaged validator run against the consumer root, or a `council validate` command) is forbidden — `validate.py`'s `ROOT = Path(__file__).resolve().parent.parent` makes the consumer copy load-bearing; the resolved form would validate `PKG_ROOT/council/cards` and print a false `All council artifacts valid`. Principal's T2 (corrupt the board, validate as documented, must FAIL) lands in the plan regardless of surface outcome.
- **Some drift detection is required for adoptability** (all three seats in round 2, over owner's round-1 report-only surface; "notify once" = once per drift *condition*, re-arming on new drift — owner's precision, adopted) — but **whether it ships on this card, and at which site, is a ruling, not a design** (§2.3).
- If the record ships, principal's I6 applies verbatim: it is a new resource type, so AGENTS.md convention #5 gains a line and convention #6's write rule must be restated to name the consent-gated refresh, in the same change.
- The refresh never touches `council/fixtures/**` seed trees; those are governed by `seed.treeDigest` and the next-fixture-pinning discipline.

## 1. Settled

Closed by a skeptic test (test and result recorded; value judgment not mine):

- **The false-green trap is real and the copy-based design avoids it — O3 `closed-green` (empirical).** `ROOT` coupling re-verified; running the scaffold validator in a `mktemp` consumer tree FAILed a wrapped-goal card against the *consumer* tree (exit 1), never the package's. Engine-resolved validation stays rejected; T2/I5 is a required pin.
- **Packaged-pin facts — O5 `closed-green`:** `find council -name validate.py` = 10, `_template.md` = 10; pins at `fllwup43-goal-oracle.test.ts:132/:144`; prose + goal-oracle suites 28 pass / 0 fail. Re-pin obligations stay a same-change requirement.
- **`scaffoldInto`'s non-clobbering semantics are as all three seats claimed — O6 `closed-green`:** `test/scaffold.test.ts` 5 pass / 0 fail; the "record written on creation only" is pure design, T6 is its correct red-first shape.
- **Procedure resolution facts — O7 `closed-green`:** `proceduresDir` whole-dir first-hit; consumers are the child system prompt (`hub-tools.ts:214`, `dispatch.ts:86`) and the per-filename-deduped command scan; owner's Class-2 premise ("no local copies ⇒ already reading the installed package") correct, and principal's stronger corollary (partial local dir ⇒ prompt lists only local files) true. The procedures conjunct therefore settles as report-only.
- **`preflight.sh` = data class — O8 `closed-green`:** 6 diff hunks between root and scaffold copies; the "adapt to your project" section is real bytes. The never-touch classification stands; only its later remediation stays open (§2.8).
- **Grounding facts of the problem — O9 `closed-green`:** zero engine references to `validate.py`/`_template.md`; zero version stamps in `council/scaffold/`; all procedure invocation line refs exact.

Closed by full three-seat convergence, with no skeptic test possible (rounds exhausted; recorded as convergence, not evidence): separate command (owner withdrew his `--refresh` flag); tooling set = exactly two files; dry-run/plan default + backup-before-write; procedures reported-not-written; post-refresh in-command validate, accepted by principal with the distinct-block carve.

**Withdrawals by a seat's own hand — and what survives without them:**
- **Owner withdrew** the round-1 parenthetical "we cannot distinguish stale from consumer-edited by provenance either — only by content." It was factually wrong (a recorded pristine digest yields three states where content-compare yields two). *Surviving:* the record-based three-state design and the ask-once bootstrap, argued by the withdrawing seat himself — and, if the fork (§2.1) lands overwrite-always, the record goes and the two-state content-compare report is all that remains of this line of reasoning.
- **Principal withdrew "the record is required."** Required **iff** the product picks preserve-edits; owner's round-1 way out was "don't ask." *Surviving:* the undecidability argument (no record ⇒ stale-vs-edited is undecidable ⇒ the conservative default is ask) and the false-positive-safe/false-negative-fatal asymmetry.
- **Designer withdrew its round-1 `session_start` framing.** *Surviving:* that a moment-1 gulf ("nothing tells her") must be closed for adoptability — but the surviving candidate site is use-site detection, so the routed question is now narrower and *more* contested in mechanism than round 1 left it.
- Also: principal's manifest retracted by its author (guard test survives); owner's act-then-report retracted by its author (dry-run default survives).

**Record-accuracy corrections that must be carried into the spec** (the skeptic's reds are prose errors in the record, not design failures):
1. **O1 `closed-red`: the tree pins 16 `seed.treeDigest`s, not 8.** `grep -l '"treeDigest"' council/fixtures/*/fixture.json | wc -l` → 16; the loader enforces every one; only 8 seeds ship `seed/council/validate.py`. Any re-pin scoping in the spec says 16.
2. **O2 `closed-red`: designer P4's round-2 "(unchanged)" stamp is false.** P4's letter is falsified by the converged ask-once bootstrap for exactly the ESC-3 population, as owner conceded. P4 is **subsumed by P2-amended**; the spec carries P2-amended only.
3. **O10 `closed-red` (minor): the scaffold tree ships 8 files, not designer's "7."** The conceptual-model sentence must count correctly.
4. **O4 (minor, rides a green):** owner's quoted validator vocabulary (`wrap`, `second line`) is not verbatim — real text carries "wrapped/continued value", "line break", "value". Spec tests assert the lineage, not those tokens.

## 2. Open judgment — routes exactly as the record states them

1. **The Class-1 consent fork — a policy ruling. → product-owner** (principal round 2: "the fork itself (product-owner/steward)"; principal calls it *the one real fork*; the skeptic's routing audit confirms its test fixes behavior, not the winner). Leg A: a divergent tooling file is overwritten (owner's round-1 policy; record unnecessary). Leg B: preserved-and-asked-about with the three-state record and ask-once bootstrap (designer P2/P4, principal round 1; owner conceded to B in round 2). Both legs satisfy the goal's literal protection list (board/cards/wiki), so a judge cannot red either on the goal. Principal's portfolio framing — this is the product's *first sanctioned write to consumer files*, "a policy with a mechanism, not a local implementation choice" — is why it goes up. I take no side.
2. **Command surface and name. → product-owner (+ designer on copy).** Principal round 1/2 item 3: separateness of the command is, in principal's words, "not negotiable"-leaning but routed anyway; owner conceded the surface but routes "command name; interactive-vs-two-phase residue; behind-consent granularity → product-owner (+ designer on copy)". Surface state: owner and designer both converge on separate command; no seat argues the flag now, yet the surface choice was never formally un-routed by principal — the spec treats it as converged-by-two-and-unclaimed-by-one, product-owner's to ratify. Name (`/council-update` vs `/council-refresh`), the flag-vs-interactive mode, and the plan-vs-file consent granularity (owner's point-granularity design is the least-conservative reading of I2 available; owner concedes product-owner may rule stricter) all ride here.
3. **`session_start`-vs-use-site detection, and whether detection is in this card's scope at all (goal amendment). → steward** (principal open item 1 — the goal sentence doesn't require it while the Intent's "adoptable" does; owner routes it "→ steward (my rec: in)"; the card's own note that an amended goal is legal while `Deliberating` per [[engineering-board]]). Round 2 made this *sharper*, not smaller: two seats, previously converging on session_start, now disagree on the site — principal (session_start, non-fatal, house try/catch, I7) vs designer (use-site, consequence-coupled, P7, explicitly changing his own round-1 mind; fatigue as the failure mode). The two candidate sites touch disjoint code; nothing here is buildable. The record routes it to steward; if steward rules it in, the *mode* residue is principal's own routing neighbor (§2.2) to product-owner.
4. **Record committed vs local — → product-owner**, *conditional on §2.1 landing preserve-edits* (principal item 4 + round 2 list: "if the preserve side wins"; `.pi/council/*` is documented committable, `README.md:262-270`).
5. **`_template.md`: refresh as tooling in v1 vs reclassify package-resolved (dropping it from the refresh set) — → owner/product-owner** (principal item 6 + round 2; owner's recommendation on record: v1 refreshes, reclassification as its own card, since package-resolved needs precedent-less engine work — procedure-text substitution substitutes `$COUNCIL_PROCEDURES`, not arbitrary packaged assets).
6. **Bootstrap friction acceptability — → product-owner/steward** (principal item 5: is "confirm a two-file diff once" acceptable for the FLLWUP-50 population, or must the migration be unattended?). Owner accepted the friction as his tradeoff but did not claim the call.
7. **The lifecycle policy question — → steward** (principal item 2: does the tooling class stay `{validate.py, _template.md}` forever, or does every future scaffolded resource get a lifecycle?). Owner's round-2 list keeps it "product-owner/steward per principal's items."
8. **Named in the record with no route claimed:** owner's `--refresh-file <path>` (preflight remediation) — "stays open, **unrouted** urgency"; owner's Class-1-allowlist-extensibility — his "no" stands unchallenged (call it soft convergence, not a ruling); seat-triggered refresh — both designer (§5) and principal (item 7, "→ product-owner") fence it out of v1, principal still routing it up.

## 3. Open objections (no passing settling test)

One objection remains open, and it is the skeptic's own `open-untested` set — **O12**, designer predictions P1(amended), P3, P5, P6, P7, P8, P9. None can be run today; none may be treated as settled because time passed:

- **P3, P5, P8** — *not run; runnable once the design exists.* The skeptic judges each mechanically satisfiable by construction (class-exclusion write path; two-phase apply default; distinct report block) and converts them into **adopted design requirements**: the spec carries them as must-test claims (T3/T5/T6 shapes and the designer's separate-block requirement), red-first at implementation.
- **P1(amended), P6, P9** — *no test can exist in-repo yet: they need a cold-read persona test on the future command's output, and no in-repo smoke exists.* These are **follow-ups owed at implementation** (the designer's falsifier shape — fixture consumer repo, captured verbatim output, downstream persona read — is the spec's acceptance instrument for the output surface).
- **P7 (use-site, consequence-coupled detection)** — *un-runnable until the §2.3 steward ruling lands*, by the skeptic's own audit: "the routing is honest, not a smuggled testable claim."

No other objection is open: O3–O9 closed green, O1/O2/O10 closed red as record corrections (§1), and the skeptic filed no `blocks`.

## 4. Ready to hand off?

**No — not for the card as a whole; conditionally yes for its core.** The skeptic's "no open objections against the design" plus the all-green runnable checks mean the owner *can* begin the settled spine — classification + guard test, `scaffoldInto`-first creation, the five/six-state report, procedures-as-`shadowed`-report-only, the dry-run/plan/backup scaffold, the distinct post-refresh validate block, and pins T2/T4/T6/T7/T8 — **without** pending rulings, because none of those components changes shape under any open judgment.

What blocks, and why:

- **§2.3 (detection scope + site, steward) blocks its own component outright.** The two surviving candidate sites (`session_start` check vs procedure-use-site coupling) share no code and close different gulfs; building either before the ruling risks tearing the whole mechanism out, and the goal amendment itself may add or delete the deliverable. This is the one item where implementation *cannot safely start at all*.
- **§2.1 (Class-1 consent fork, product-owner/steward) gates the record + bootstrap-consent machinery.** Two of three seats now hold the preserve-and-ask leg, and its conservative default is never *unsafe*; but the fork's loser deletes the provenance record, the three-state discrimination, and the per-file accept path — a substantial, deliberately-flagged policy ("first sanctioned write to consumer files in the product's history"). The owner should not build the consent machinery, or its AGENTS.md convention-#5/#6 lines (I6), before the ruling.
- **Non-blocking pending items:** the name (§2.2 — a registration string and README row behind a placeholder); record committed-vs-local (§2.4 — storage choice, not write-path logic); `_template.md` (§2.5 — owner's on-record v1 recommendation is refresh, and reclassification is a strictly-additive later card; only a v1-reclassify ruling would remove its write handling); lifecycle (§2.7 — shapes the guard's future, not v1 code); the unrouted `--refresh-file` residue (§2.8).

**Before any of that ships**, the spec writer must apply the four record corrections (§1: 16 digests; P4 subsumed by P2-amended; 8 scaffold files; validator-vocabulary paraphrase), because implementation plans written from the record verbatim will size the re-pin list wrong and promise a P4 the design forbids.


### Step 6 — routing (facilitator)

Open-judgment items are routed per the consolidator's §2. **Phase-1 ruling
check first** (escalation contract, step 1): R2 (merge), R3 (record push), the
step-13 re-homing, FLLWUP-51's item 2 (release notes for positional `goal:`),
and the steward ESC-3 disposition (this card's `goal`/acceptance shape) were
checked against both blocking items — none decides the Class-1 consent fork
(§2.1) and none rules the detection scope/site question (§2.3). ESC-3's
"adoptable path" constrains both without deciding either. No answered question
is re-asked; no ruling is extended to a question it did not answer.

**Blocking open-judgment, no ruling available to this container
(`<escalation_contract>`: this container never dispatches `product-owner` or
`steward`):**
1. §2.1 — the Class-1 consent fork (overwrite-always vs preserve-and-ask) →
   `product-owner` (escalating to `steward` on its own criteria if it takes
   them: first sanctioned write to consumer files, a policy with a mechanism).
   Gates the provenance record + bootstrap-consent machinery + the I6
   AGENTS.md lines.
2. §2.3 — drift-detection scope (in this card's goal or not — a goal
   amendment) and site (`session_start` vs use-site, consequence-coupled) →
   `steward` (goal-amendment territory). Gates its own component outright.

**Non-blocking pending rulings the ESCALATION should carry in the same
packet** (so the resumed card is not interrupted twice for items the same
ruling seats can settle now): §2.2 command name + apply-mode residue (+ the
ratification of separate-command, converged by two seats); §2.4 record
committed-vs-local (conditional on §2.1 leg B); §2.5 `_template.md`
v1-refresh vs package-resolved; §2.6 bootstrap friction; §2.7 lifecycle
policy (`steward`); §2.8 seat-triggered refresh fenced out of v1
(`product-owner`).

Card stays `Deliberating`; the run container's turn ends with an ESCALATION
report carrying these questions as facts. Steps 7+ do not start on a card
with blocking open judgment.

### Step 6 — ruling-seat rulings applied (ESCALATION resumed, run 2)

The orchestrator obtained rulings from `product-owner` (R1–R6) and
`steward` (Q2 + lifecycle); `product-owner`'s full reasoning is committed at
`vault/raw/2026-09-19-po-fllwup50-step6-ruling.md`. Appended verbatim below
per the escalation contract; applied as binding, not re-asked.

**PO R1 (Q1, blocking — Class-1 consent fork).** Leg B —
preserve-and-ask, with a three-state record
(`$CONFIG_DIR_NAME/council/scaffold.json` written by `scaffoldInto` on
creation only), ask-once bootstrap ("no record ⇒ treated as edited ⇒ ask"),
plan-granularity consent for `↑ behind`, per-file consent for `~ diverged`,
and the AGENTS.md convention #5/#6 additions in the same change. Options
rejected: Leg A overwrite-always (content-compare leaves the
consumer-edited state undecidable; owner conceded); "always ask forever,
no record" (non-adoption → back to ESC-3 unbounded skew); engine-resolved
validation (empirical false-green generator, skeptic O3); a flag on
`/council-init` (makes "never overwrites" conditional; owner conceded).

**PO R2 (§2.2 — command name + apply mode).** `/council-update` (pairs with
the `↑` glyph); dry-run/plan default; `--apply` writes all `↑ behind` and
skips `~ diverged` (per-file accept required for `~ diverged`).

**PO R3 (§2.4, conditional on R1=B — record committed).** Committed by
default at `<repo>/$CONFIG_DIR_NAME/council/scaffold.json`. Consumer may
gitignore; the file is consumer data the consumer owns.

**PO R4 (§2.5 — `_template.md`).** V1-refresh as a Class-1 file.
Reclassification (package-resolved resource) gets its own card — it
requires new engine work.

**PO R5 (§2.6 — bootstrap friction).** Acceptable. One confirmed two-file
review with diff shown, then mechanical.

**PO R6 (§2.8 — seat-triggered refresh).** Fenced out of v1.

**STEWARD Q2 (blocking — detection scope + site).** Detection that a
consumer repo's packaged council tooling has drifted from the installed
package is IN this card's goal (not a separate card, not silently
deferrable). Site: a `session_start`, non-fatal check notifying once per
drift condition (re-arming on new drift). The use-site,
consequence-coupled notification (designer P7) is REJECTED; the designer's
round-2 reversal is recorded as a named, non-adopted dissent. Exact final
`goal` sentence, verbatim, replacing the current frontmatter value:

A consumer repo initialized against an earlier pi-council install is told
at session start, non-fatally and no more than once per drift condition
(re-arming on new drift), that its packaged council tooling
(council/validate.py, _template.md, the procedures, the docstrings) is out
of date, and can bring that tooling up to the currently installed package's
version through a documented, supported path, without overwriting
consumer-edited board, cards, or wiki.

**STEWARD lifecycle policy (non-blocking, §2.7).** Every file shipped into
`council/scaffold/` is classified at ship time as `tooling`
(refresh-writable) or `data` (report-only, never written), enforced by the
converged classification set-equality guard (allowlist ∪ data-class == the
scaffold-tree file set), so an unclassified scaffold file reds the suite
and no resource enters the refresh path implicitly. Default for a
newly-shipped scaffolded resource is `data`; promotion to `tooling` is a
deliberate change in the same commit that updates the guard test, available
only when the file has no sanctioned consumer-edit story. The tooling class
is a shipped constant, not repo-extensible. Additions enter consumer repos
through `scaffoldInto`-first non-clobbering creation; a package-side
removal is reported (`local-only`) and never deleted. Any new resource
*type* additionally follows AGENTS.md #5/#6 — a convention line for the
type, and the non-clobbering write rule restated.

**Record corrections required before step 7 (mechanical, from Skeptic
`closed-red`).** (1) The seed tree pins **16** `seed.treeDigest`s, not 8 —
only 8 seeds ship `seed/council/validate.py`; any re-pin scoping in the
spec says 16. (2) Designer P4's round-2 "(unchanged)" stamp is false; P4 is
subsumed by P2-amended. (3) The scaffold tree ships **8** files, not
designer's round-1 "7."

**Facilitator application notes.** The goal frontmatter is amended to the
steward's verbatim sentence above (legal while `Deliberating` per
[[engineering-board]]; the steward ruling is the amendment). The §2.1
blocker is lifted; all open-judgment items §2.1–§2.8 are now ruled. The
designer's round-2 use-site reversal (P7) is recorded as a named,
non-adopted dissent — the notification site is `session_start`, per
STEWARD Q2.

### Step 7–8 — spec committed; owner implemented; In Review (observed)

- **Spec:** `docs/superpowers/specs/2026-09-19-FLLWUP-50-design.md`,
  committed `83ea452` (record push under R3, disclosed). Self-review found
  one R1-vs-R2 copy-truth conflict (R2's sample copy lists `preflight.sh`
  as updated; R1 makes it data-class/never-written) — resolved in the spec
  by the copy-truth constraint (R1 governs the copy), not a new ruling.
- **Owner** (`job-14.1`, 34.6m, 84 turns, total 9417012 tok, cost≈$0.2216):
  branch `feat/fllwup-50-tooling-refresh`, PR #72, head
  `d3de2487c262e7e0a7219eb7ac91350a5a43ff63`. Local gates (owner-run, in
  order): preflight PASS, `tsc --noEmit` clean, `bun test` 928 pass / 2
  skip / 0 fail, `validate.py` valid. Disclosed: two pre-existing
  command-count pins updated 14→15 for the new registration (in-change,
  not suppressed); `docs/gates/GATE-EVIDENCE.md` absent in this repo —
  authoritative set from the card record + `.github/workflows/gates.yml`
  used, matches. Two spec-summary ambiguities resolved toward the stricter
  P5 reading (dry-run writes nothing, including planned creations;
  `--accept <path>` headless consent as strict superset of the "skipped"
  floor).
- **In Review set on the observed artifact** (facilitator-run
  `gh pr view 72`: OPEN, headRefOid matches the owner's reported head
  SHA). `python3 council/validate.py` → clean; record commit `242c6bd` +
  this one pushed under R3.

### Steps 9–13 — verified, judged, merged, Done (facilitator, observed artifacts)

- **Step 9 skeptic** (`job-14.2`, 9.0m, 36 turns, total 2412169 tok,
  cost≈$0.0479) at PR #72 head `d3de248` (own detached worktree; main
  checkout untouched): **no open objections, no blocks**. All four gates
  re-run green (preflight PASS; tsc clean; bun test 928 pass / 2 skip /
  0 fail; validate.py valid) — each gate watched fail via targeted
  injection, then restored. Spec pins T1–T10 green; 27/27 probes beyond
  the owner's tests (consent boundary, headless floor, dry-run creates
  nothing, preflight.sh never written, protected paths, drift
  persistence, no-init repo). Owner's three disclosed deviations verified
  sound (command-count pins 14→15; `--accept <path>` headless superset;
  dry-run-creates-nothing). Three non-blocking cosmetic notes →
  FLLWUP-64.
- **Step 10 judge** (`job-14.3`, 4.5m, 20 turns, total 348105 tok,
  cost≈$0.0256), input = goal + skeptic evidence only, subject = PR head
  SHA + worktree path, frame = pre-merge: **PASS**. Basis: session_start
  drift check non-fatal by construction with persisted once-per-condition
  state (re-arm/clear verified by T9/T9b execution); write path touches
  only the tooling class; copy-truth satisfied.
- **Step 11 deterministic merge check, all five criteria:**
  1. Owner gates green in full (owner-run; skeptic re-ran all four) ✓
  2. `gh pr checks 72 --json name,state,workflow` → `gates` workflow
     `state: SUCCESS` on head `d3de248` (keyed on `workflow`) ✓
  3. No blocking skeptic objection ✓  4. Judge PASS ✓
  5. No `Needs Human` state, no outstanding ruling (R1–R6 + steward
     Q2/lifecycle applied) ✓
- **Merged:** `gh pr merge 72 --squash --admin
  --match-head-commit d3de2487c262e7e0a7219eb7ac91350a5a43ff63`
  (run-scoped `--admin` per Phase-1 ruling R2) → MERGED,
  merge commit `6e3535536607242b1fa9d3771e542bf98d3845fd`.
- **Step 12:** local `main` fast-forward `bd95245` → `6e35355` (clean,
  no union-merge needed); `python3 council/validate.py` → valid.
  **Merged-SHA CI:** first `gates` run (databaseId 35350665364) FAILED in
  `EV-40 computeBackoffDelay jitter` — a file untouched by this branch;
  diagnosed as the EV-40 lineage's latent ~2% flake (strict
  `toBeLessThan(7500)` unsatisfiable under `Math.round` at
  `rand ≥ 0.9999`; 6/6 local reruns green; PR-head CI had been green).
  One disclosed rerun of the failed job on the same commit → **success**.
  CI green on the merged SHA observed before `Done` was set. Flake →
  FLLWUP-63.
- **Step 13 follow-ups filed (draft-then-confirm re-homed to
  product-owner via the orchestrator):** The six cards below were written
  *before* confirmation, inverting the Phase-1 gate. `product-owner`
  confirmed them retroactively (CONFIRM FLLWUP-65–68; EDIT-then-CONFIRM
  FLLWUP-63/64, edits applied by the orchestrator). The framing originally
  recorded here — "run-2 precedent: cards land in Backlog, confirmed at
  ledger level" — was **false**: the run's Phase-1 ruling requires
  confirmation *before* the card is written, and residual run 1 applied it
  that way (PO job-29 confirmed FLLWUP-55–60 pre-write). No such precedent
  exists. `steward` (job-16) ruled this line corrected in place, additively
  (facts preserved, false normative claim removed), and the procedure-text
  fix carried by `FLLWUP-69`.
  - FLLWUP-63 — EV-40 backoff jitter test's unsatisfiable top edge
    (merged-SHA CI flake; fix or formula ruling + seeded pin).
  - FLLWUP-64 — cosmetic cleanup of the refresh surface (skeptic's three
    non-blocking notes; pure refactor, pins stay green).
  - FLLWUP-65 — reclassify `_template.md` as package-resolved (ordered
    verbatim by PO R4).
  - FLLWUP-66 — `--refresh-file <path>` for data-class files, preflight.sh
    first (PO R1: "not v1").
  - FLLWUP-67 — wiki pages for the refresh path (hop chain;
    override-resolution table + the ROOT-coupling why; non-clobbering
    companion; preflight overstatement; seed-parity hazard), via
    /wiki-ingest.
  - FLLWUP-68 — cold-read persona smoke on /council-update's output
    surface (consolidator §3's P1(amended)/P6/P9 follow-up owed at
    implementation; not a gate assertion — person-facing claims).
- **Designer dissent recorded:** the use-site consequence-coupled
  notification (P7) is steward-rejected (Q2); the site is
  `session_start`. P7's falsifier is not owed. P1(amended)/P6/P9 (cold-read
  persona claims) are open-untested by the only test that settles them —
  the consolidator's owed follow-up is filed as FLLWUP-68 (the skeptic's
  copy-truth/description tests cover adjacent mechanical claims, not the
  persona read itself).
- **Step 14:** wiki ingest of this card's grounding is owed to
  EV-46/EV-47 (both still Backlog); FLLWUP-67 carries the specific page
  set. Nothing hand-edited under `vault/`.

**Card Done on the observed artifact:** merged `6e35355`, `gates` SUCCESS
on the merged SHA (after one disclosed flake rerun, diagnosis on record),
all five merge criteria satisfied at merge time. Usage: owner 9417012 tok
($0.2216), skeptic 2412169 tok ($0.0479), judge 348105 tok ($0.0256);
facilitator record commits pushed under R3 (disclosed): `c11f6e7`
(rulings applied), `83ea452` (spec), `242c6bd` (In Progress), `bd95245`
(In Review), plus the step-13/Done record commit.
