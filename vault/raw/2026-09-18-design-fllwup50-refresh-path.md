---
title: 2026-09-18 — Design seat, FLLWUP-50 round 1, person-facing refresh path
type: design
source: council/cards/FLLWUP-50.md
---

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
