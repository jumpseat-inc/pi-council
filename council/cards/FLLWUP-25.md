---
id: FLLWUP-25
title: Wiki source page matches AGENTS.md hard-conventions count
state: In Review
owner: null
epic: EPIC-6
goal: The vault wiki source page summarizing AGENTS.md's hard conventions matches the current AGENTS.md — counting the conventions exactly as the file lists them, including clause #13 added by FLLWUP-24 — proven by a driven or scripted consistency check between the page and the file, with no behavior change anywhere in the gate set.
---

## Intent

Filed from FLLWUP-24's delivery (council-runner report): FLLWUP-24 added
hard-convention clause #13 to `AGENTS.md` (local gate evidence trusted only
after `council/preflight.sh` passes, re-run-over-skip formulation). The
wiki source page `[[2026-08-23-agents]]` summarizes the file as "12 hard
conventions" and its count is now stale — the repo lists 13 with the 9.5/9.6
sub-entries. This card is doc-sync maintenance created by this run's own
change: refresh the wiki source page via the wiki-ingest skill's procedure
(`vault/` is never hand-edited — the page update goes through the ingest
pass, not manual edits), so the wiki and `AGENTS.md` agree.

The consistency check is the testable artifact — a scripted comparison that
the page's convention count and list match `AGENTS.md`'s actual convention
headings, failing when they drift. This keeps the staleness class closed by
construction rather than by vigilance. Filed under EPIC-6 per the run's
standing orchestrator directive; surface is documentation only.

## Acceptance

- The wiki source page's hard-conventions summary matches `AGENTS.md`'s
  current convention list (count and content), refreshed via the
  wiki-ingest procedure rather than hand edits.
- A scripted consistency check between the page and `AGENTS.md` exists and
  is green; it fails if the two drift again (red-honesty proven by a
  deliberate temporary drift in the check's own test, then restored).
- No behavior change: the full gate set stays green (`bun test`,
  `bunx tsc --noEmit`, `python3 council/validate.py`), and
  `council/check-pi-drift.sh` is untouched.

## Phase 1 rulings (product-owner, step-6 escalations)

**R-1 (SPEC-4 — heading format)**: The refreshed page's conventions-section heading is `## Hard conventions`, mirroring AGENTS.md's section heading verbatim (AGENTS.md line 47). The card's goal is that the page matches the current AGENTS.md, and mirroring the heading honors "exactly as the file lists them" without adding a parallel count site that must be kept in sync on every future convention change. The count token "thirteen" still lives in the settled assertion sites — the bold body sentence "thirteen hard conventions", the frontmatter summary, and `vault/wiki/index.md:72`'s one-line summary — so the count-token assertion has three load-bearing sites without leaning on the heading. The parser's slice anchor becomes symmetric between page and file, eliminating a fragile asymmetric-anchor coupling inside the consistency check. The "The thirteen hard conventions" heading form is rejected — its count word would need to track every future convention addition (a 14th convention would require a heading edit), making the heading a fourth count site with its own drift exposure. A heading rename is a one-line text edit on a single wiki page; undo is cheap.

**R-2 (SPEC-5 — `sources: []` disposition)**: Delete the `sources: []` frontmatter line and replace it with a populated `sources:` array of wiki-internal cross-references the page body actually contains, in `[[wikilink]]` form — mirroring the convention every other wiki page follows (e.g. `vault/wiki/seats.md:7`; `vault/CLAUDE.md:34` is the contract example). The `sources:` array carries wiki-internal cross-references, never the external repo-doc citation; the external citation goes in the four REQUIRED provenance keys per the wiki-ingest skill's contract (`provenance: repo-doc`, `source_path: AGENTS.md`, `source_commit: 2c5ec3b`, `captured: 2026-09-06`). The two axes are distinct; putting `AGENTS.md` in `sources:` would break the established convention and create a class of pages where the same path lives in two semantically different fields. Keeping `sources: []` as-is is rejected — after the refresh the page carries the AGENTS.md citation in three other places while `sources: []` literally claims zero sources (an internal contradiction), and the body's new cross-links ([[preflight]], [[council-theme]]) plus the existing Related section make `sources: []` false on its own wiki-internal axis too. The page's body `## Sources` section is re-pinned to `AGENTS.md @ 2c5ec3b` per the refresh — it is the human-readable mirror of `source_path`/`source_commit` and does not belong in `sources:`. Reverting is one ingest pass with the prior shape.

## Execution (run record)

### Step 1 gate (2026-09-06, runner container)

**Full council, surface-touching — designer seated.** The consistency
check's mechanism is spec-ambiguous by the card's own Intent: the exact
home (test/ vs a council/ script — the orchestrator binding allows a
script only if a test is ruled impractical, "record the choice"), the
assertion shape (count-only vs count + content), and how AGENTS.md's
9.5/9.6 sub-entries and the ` 10.` leading-space marker count "exactly as
the file lists them" all admit more than one reasonable design. The
change is cross-seam by construction: the vault page + index.md + log.md +
.repo-docs.tsv manifest + test/ (+ possibly a script) move together.
Surface-touching per the council.md test: the deliverable is wiki
documentation a person reads (user-visible copy) — the same surface
FLLWUP-24's change went stale on. So `designer` joins `owner`/`principal`
as a third generator in steps 2–3, consistent with FLLWUP-24's precedent.

Evidence base and environment notes (this container):

- **Drift confirmed:** AGENTS.md "## Hard conventions" on disk lists 13
  headings (1–13, with 9.5/9.6 sub-entries of 9; the ` 10.` marker carries
  a leading space; clause #13 = "Local gate evidence is trusted only after
  council/preflight.sh passes", added by FLLWUP-24's 2c5ec3b). The wiki
  source page `vault/wiki/sources/2026-08-23-agents.md` says "twelve hard
  conventions", lists 12 items under the OLD numbering (its item 12 = the
  .council.json override — now 9.5 in the file), and its item 1 ("Seats
  are opinionated on purpose") is also stale (v0.14.0 inverted convention
  #1 to "Seats are domain-neutral by design"). Frontmatter summary and
  vault/wiki/index.md's Sources entry both say "12 hard conventions".
- **Manifest:** vault/.repo-docs.tsv pins AGENTS.md at df1949e
  (2026-08-23) — the page's banner citation. AGENTS.md moved since;
  FLLWUP-24 (2c5ec3b) added clause #13.
- **Environment:** installed @earendil-works/pi-coding-agent 0.85.1 ==
  bun.lock resolution 0.85.1 (synced at container start; every local gate
  run in this run is on lock-synced trees); gh authenticated
  (tistaharahap). Gate authority: .github/workflows/gates.yml —
  frozen-lockfile install, `bunx tsc --noEmit`, `bun test`,
  `python3 council/validate.py` (no docs/gates/GATE-EVIDENCE.md exists in
  this repo).
- **Binding exclusions / scope:** refresh only the one stale page's
  conventions summary (+ the ingest pass's own index/log/manifest
  updates); vault/ never hand-edited — the page update rides the
  wiki-ingest procedure; no behavior change; `council/check-pi-drift.sh`
  untouched; env-split, theme-*, and mcp guard tests stay green;
  worktrees only, main-repo branch state immutable; PRs base at
  origin/main.

### Step 2 — independent first pass (2026-09-06, runner container)

Owner (job-21.1), principal (job-21.2), designer (job-21.3) dispatched in
parallel, isolated inputs (card face + binding facts only). Positions
appended verbatim below.

#### Owner position (job-21.1)

All grounding complete (AGENTS.md Hard conventions lines 47–92, the stale
page, index.md:72, .repo-docs.tsv, vault/CLAUDE.md, wiki-ingest.md, the
skill, fllwup24-drift test, validate.py, gates.yml, log.md, FLLWUP-24
card). Position follows.

- **Approach.** (1) Refresh rides the ingest pass: re-pin
  vault/.repo-docs.tsv AGENTS.md row df1949e → 2c5ec3b (last AGENTS.md
touch; content == HEAD), rewrite the [[2026-08-23-agents]] conventions
section to mirror the file's structure — 13 top-level items (1–13) with
the file's exact bold leads, 9.5/9.6 as labeled sub-entries under 9 — bump
summary/updated, refresh banner pin + captured date, index.md "12"→"13",
append log entry. Judgment calls recorded: (a) add the skill's REQUIRED
provenance frontmatter (provenance/source_path/source_commit/captured) on
this pass — the skill's contract is the ingest rulebook; (b) cross-link
#13 → [[preflight]], 9.6 → [[council-theme]]. (2) Consistency check lives
in test/, not a council/ script — ruling recorded: the drift hazard here
is content between two committed files, the enforcement moment is
commit/PR, and gates.yml runs bun test on every push — CI is the caller;
a council/ script would have no legitimate caller. New
`test/fllwup25-agents-page.test.ts` with a pure test-local
`diffConventions(agentsText, pageText)` — no new engine surface.
(3) Assertion shape: count + content + placement by exact mirror — parse
both sides with one regex (`^\s*([0-9]+(?:\.[0-9]+)?)\.\s+\*\*([^*]+)\*\*`,leading-whitespace-tolerant so ` 10.` and ` 9.6.` parse) and compare
the ordered (label, boldLead) sequences for exact equality — subsumes
count, stale item 1, misplaced 9.5, and missing #13. Exact-lead mirroring
required because the card's own drift instance is a lead paraphrase — a
fuzzy check would tolerate exactly the failure that motivated the card.
(4) Red-honesty inside the test, synthetic only (in-memory string
mutations of disk-read text): drop item 13 / revert item 1 lead / move 9.5
→ each yields a named finding; pristine real files → zero findings
(ongoing gate). No hardcoded "13" (mirrors FLLWUP-24's no-hardcoded-0.85.1).
(5) Gates: no deps → frozen-lockfile untouched; new test strict-typed;
validate.py has zero vault surface (only cards/ + board.md).
- **Tradeoffs accepted.** Exact-lead mirror makes every AGENTS.md lead
rewording force a page sync — that is the point. Enforcement at
CI/bun-test, not runtime — no pre-run moment matters more. Parser
shape-coupled to current numbering style — parser regression that
silently tolerates drift fails its own red tests (self-checking). Adding
provenance frontmatter slightly exceeds strict conventions-summary scope,
justified by the skill's REQUIRED contract; dropping it costs nothing.
- **Testable claims.** (1) diffConventions(AGENTS.md@HEAD, current stale
page) returns findings naming count mismatch AND item-1 lead diff AND
missing #13. (2) diffConventions(AGENTS.md@HEAD, refreshed page) → [] and
stays green on every bun test. (3) Red-honesty: in-memory mutations each
yield a named finding; pristine files → []. (4) Parser robustness: ` 10.`
and ` 9.6.` parse to labels 10/9.6; file slice yields exactly 15 entries =
13 top-level + 2 sub-entries. (5) Gate arithmetic: tsc 0, bun test +1
file green, validate unchanged. (Two vault-page judgment calls flagged for
the deliberation: provenance frontmatter, cross-links.)

#### Principal position (job-21.2)

Grounded: read the card, AGENTS.md conventions section, stale page,
index.md, vault/CLAUDE.md, wiki-ingest.md, the skill + discover-docs.sh,
.repo-docs.tsv, validate.py, prose.test.ts, fllwup24 test. Position
follows.

- **Approach.** The seam: the page is a derived summary whose only
authority is the file it summarizes — a one-way derivation. The check must
derive its expectation from AGENTS.md and assert the page conforms (never
the reverse, never a hardcoded list). Home: test/, ruling recorded — the
check is a pure two-file comparison with no runtime/network/state
constraint making bun:test impractical; a council/ script would have no
caller. Precedent: fllwup24-drift (driven scratch tree) + prose.test.ts
(reads real repo files); test-local helper module (precedent
test/theme-loader.ts) exporting string-level extract/compare functions so
red-honesty sub-tests point them at scratch content. Assertion shape:
count + content, one operation — ordered-list bijection of normalized
bold-lead labels, PLUS an assertion that the page's stated count token
("The N hard conventions" + frontmatter summary integer) equals the file's
derived count, so the prose word "twelve" can't survive a corrected list.
Count semantics: parse, don't hand-count — every numbered heading under
## Hard conventions, tolerating leading whitespace on ` 10.` and decimal
sub-entries; derived list = 13 integer headings with 9.5/9.6 attached to
9; page may present 9.5/9.6 as sub-bullets or flat — matching by label,
not positional numbering. Ingest pass: banner → current commit,
source_commit/captured/updated bumped, body rewritten (item 1 corrected,
9.5/9.6 present), index.md "12"→"13", log.md appended, .repo-docs.tsv pin
moved off df1949e. Blind spots named: (1) the ingest schema's
"discuss-with-me-first" step has no human in this run — the deviation
must be recorded in log.md (the card IS the steer: the human filed
FLLWUP-25 for exactly this refresh), else the log breaks the schema's own
flag-not-overwrite rule; (2) a test with a hardcoded expected list
re-opens the staleness class at clause #14 — the check must derive both
sides so a future AGENTS.md + page edit landing together stays green with
zero test edits.
- **Tradeoffs accepted.** Pin drift stays outside the gate (discover-docs.sh
time, not gate set) — the card's Intent is content drift; the pin is
refreshed now, future pin drift stays a skill-time concern. 9.5/9.6
sub-entry convention is a documented decision, not a parser accident — the
check enforces label-bijection over all 15 tokens. Renumbering
presentation tolerated; rename/rename-drop is not (page folding 9.5/9.6 as
sub-bullets passes; renaming clause 1 back to "opinionated" or dropping
clause 13 fails). The green-on-real-files assertion lands in the same PR
as the refresh (red before the refresh — correct TDD).
- **Testable claims.** (1) ` 10.` leading space is the regression trap — a
parser anchored ^10\. undercounts to 12, silently reproducing the
staleness inside the check; extraction of real AGENTS.md returns clause
10 + 13 clauses + 9.5/9.6. (2) Old page is red with a named diff (clause
13, clause 12 runs/, 9.6 theme, inverted clause 1 — not just "12 ≠ 13").
(3) Restore is green (scratch page bijecting real list passes; merged tree
passes). (4) No hardcoded list anywhere — mutating both a scratch
AGENTS.md and matching scratch page together (synthetic `14.`) stays green
with zero test edits. (5) Count and content are one check — a page with
exactly 13 items but one substituted label fails. (Pinned before
implementation: record the human-in-the-loop waiver "card = steer"
explicitly in the log.md entry — the only part of this card an autonomous
run can satisfy only by documenting the substitution.)

#### Designer position (job-21.3)

Grounded: card, AGENTS.md conventions, stale page, index.md:72,
.repo-docs.tsv, vault/CLAUDE.md, wiki-ingest.md, the ingesting-repo-docs
skill (+ the v0.14.0 source page precedent for re-ingest format). Position
follows.

- **Design position.** The page is a snapshot; its job is to be true to
its pinned commit while honestly reporting what drifted. (1) Restate the
conventions summary against AGENTS.md as it stands at HEAD: count,
per-item one-liners, section heading; 9.5/9.6 stay under parent 9 and are
labeled; the ` 10.` leading-space marker is not something a person reads —
normalize to "10." in the wiki copy and record the source's leading space
as a lint observation (the bug to fix in AGENTS.md, not a fact to
re-render). (2) Fix item 1 (opinionated → domain-neutral; v0.14.0 already
records the inversion). (3) Keep the banner but record drift explicitly
inside the body as a "Drift since pin" section: count at pin (12), count
now (13, with 9.5/9.6), reason (clause #13 added by FLLWUP-24/2c5ec3b) —
makes the page honest about now-vs-then without erasing history.
(4) Consistency check under test/, not council/ — a test is the right
home (mechanical assertion on a doc artifact; bun test is the documented
execution path; the fllwup24-drift shape — real artifact + scratch trees +
mkdtempSync + afterAll cleanup — is precedent; a council/ script would
not be exercised on the same loop as the gate set). (5) Assertion shape:
count + heading-prefix set, not count alone — count-only passes today
(13 == 13) while stale item 12 (.council.json now 9.5) and stale item 1
silently lie; "exactly as the file lists them" is count+content.
(6) Red-honesty as a separate in-test case: scratch AGENTS.md, deliberate
drift (add/remove clause, swap #1), same parse helper, assert the flip;
never edit real AGENTS.md on main. (7) No ingest pass on the rest of the
vault — scope guard; other pages carry correct specific references and are
out of scope; the only second-order touches are index.md:72 and log.md
(newest-first entry).
- **Gulf closed.** Evaluation: a reader currently believes 12 conventions;
the page closes the gulf at first read (count, per-item summary, item 1
all match) and the "Drift since pin" section closes it at second read.
Execution: the test closes the maintainer's remember-to-update-the-wiki
gulf — bun test fails until the wiki syncs, naming the missing clause.
- **Principle and evidence.** Signifier/mapping: the page's enumerated list
signifies the package's constraints, false at three points. Knowledge in
the world: the test moves the load off memory onto the suite (precedent
fllwup24-drift). Forcing function at lowest cost. Activity-centered: the
wiki-ingest path is the substrate; the test is the safety net. Nothing
inherited for free: index.md:72 is a one-line ride; the "twelve
conventions" in log.md:336–337 is historical record and must NOT be
rewritten (lint precedent: log.md:81–82 — historical mentions stay, only
the catalog entry moves).
- **Falsifiable predictions.** P1 (page text): summary line states the
file's count (or a "Drift since pin" section names the change); heading
matches. P2 (test shape): test/fllwup25-wiki-drift.test.ts exists; red
case exits 1 with a diagnostic naming the missing clause heading and the
wiki page; green at HEAD exits 0; pure-seam parse helpers. P3 (red-honesty):
within mkdtempSync + cleanup, drift on a COPY → red, restore → green,
never touching real files. P4 (no behavior change): full gate set green;
check-pi-drift.sh byte-identical. P5 (scope guard): git diff origin/main
-- vault/** touches only sources/2026-08-23-agents.md, index.md (line 72
only), log.md (new top entry), .repo-docs.tsv (pin KEPT at df1949e + log
note). P6 (count+content): reverting item 1 wording alone trips the test
red. P7 (no main mutation): red-honesty lives only in mkdtempSync trees.
- **Preferences, ranked last** (overrulable without re-litigation): word
the summary as "thirteen hard conventions (twelve integer-numbered plus
two sub-entries 9.5/9.6 of #9)…"; "Drift since pin" as an Obsidian
callout under the banner; name the test fllwup25-wiki-drift.test.ts.

### Step 3 — bounded exchange, round 1 (positions stabilized; rounds used: 1 of ≤3)

Round-1 responses of owner (job-21.4), principal (job-21.5), designer
(job-21.6) appended verbatim; each was given the other two seats'
positions summarized plus the six dissent points.

#### Owner round-1 response (job-21.4)

Grounded: card, AGENTS.md (lines 47–120: 13 integer + 9.5/9.6,
` 10.`/` 9.6.` leading spaces at 89/103, #13 at 117), stale page
(frontmatter lacks provenance keys; sources: [] + df1949e banner;
item 1 inverted; 12 items), .repo-docs.tsv (pin df1949e), log.md:336-337
(historical "12th convention"), index.md:72, skill REQUIRED contract
(SKILL.md:67–89), council-json-override precedent (equally
non-conformant page), git log (AGENTS.md last touched at 2c5ec3b ==
HEAD content).

1. **Pin — disagree with designer, agree with re-pin.** df1949e predates
the v0.14.0 item-1 inversion and has no #13; a df1949e banner above a
13-convention body is a false provenance claim — the exact thing the
banner exists to prevent. After refresh the banner honestly claims
`@ 2c5ec3b` (last AGENTS.md touch, content == HEAD) and body matches
pin. The 12→13 narrative belongs in the log entry (the skill's CHANGED
step says note what moved there); a permanent "Drift since pin" section
becomes a lie the moment the pin moves, and keeping the pin makes the
*banner* lie.
2. **Assertion shape — merged.** Ordered-exact (label, boldLead) alone
does NOT catch the "twelve" count token — it lives in prose +
frontmatter summary, outside the list — so merge: ordered label
bijection over all 15 tokens (labels are the file's own 1–13 + 9.5/9.6;
nesting free via `^[ \t]*`, renumbering not — labels are the cross-ref
keys) + normalized bold-lead equality per label (label-only bijection
passes a reverted item-1 lead — the v0.14.0 class) + stated-count token.
Over-rejection audit: 9.5/9.6 as sub-bullets → green; lead paraphrase
(stale page's item 8 "omp-style tool-grant vocabulary" vs file's
"Tool-grant vocabulary") → red by policy — page bolds the convention's
verbatim name, bodies paraphrase freely.
3. **Stated-count token — IN.** Load-bearing: this card's staleness is
the word "twelve" in two places a list-mirror can't reach. Assert
prose-summary token + frontmatter-summary token == derived integer
count (13). Cheap extension: also index.md:72's line — recommended in,
ruling recorded either way.
4. **` 10.` — all three, no conflict.** Parser tolerance mandatory; wiki
copy normalizes to clean "10."/"9.6."; fixing AGENTS.md whitespace is
the root cause but OUT of scope — logged follow-up, non-urgent because
tolerance makes the check correct against the file as it exists.
5. **Human-loop waiver — no objection.** "card = steer" in the log entry
is the schema's own flag-not-overwrite discipline; the card is the
human's directive, so the note is accurate, not a dodge.
6. **Provenance frontmatter — agree, one caveat.** The REQUIRED contract
mandates all four keys and no vault page carries them yet — this
refresh is the compliance moment. Caveat: it's a field shape this vault
lacks; record the conformance decision in the log entry and confirm
wiki-lint tolerates the keys so the schema change isn't silent.

**Approach.** One pure test-local diffConventions(agentsText, pageText)
in test/fllwup25-agents-page.test.ts, all expectations derived from the
file side — no hardcoded 13/15 anywhere. Parse both sides with a
leading-whitespace-tolerant regex (`^[ \t]*(\d+(?:\.\d+)?)\.\s+\*\*([^*]+)\*\*`;
`[^*]+` spans the multi-line bolds of 9.5/9.6/13), then assert (a)
ordered label equality, (b) per-label normalized bold-lead equality,
(c) stated-count token(s) == derived count. Red test against the current
stale page ships in the same PR as the refresh (TDD); red-honesty as
in-memory mutations of disk-read text only.

**Testable claims (merged shape).** T1: tolerant regex over real
AGENTS.md yields exactly 15 markers; a `^10\.`-anchored variant yields
14. T2: a page whose 15-item list is correctly mirrored but whose prose
still says "twelve" fails naming the token. T3: correct labels but
item-1 lead reverted fails naming item 1; a label-bijection-only check
passes it. T4: mutating a scratch AGENTS.md + matching scratch page
together (synthetic `14.`) stays green with zero test edits. T5:
in-memory mutations (drop #13, renumber 9.5→10, invert lead, wrong count
token) each yield a named finding; pristine files → []. T6: scratch page
nesting 9.5/9.6 under 9 with clean "10." passes; flat renumber 1–13
fails. T7 (if index extension ruled in): index.md:72's count token ==
derived count.

#### Principal round-1 response (job-21.5)

1. **Pin** — re-pin to 2c5ec3b. After refresh the banner honestly claims
"derived from AGENTS.md @ 2c5ec3b" because that's the commit actually
ingested; a body describing 2c5ec3b content under a df1949e banner makes
the banner a false claim. Keeping df1949e also breaks the skill's
idempotence contract ("the manifest exists to make ingest idempotent")
— discover-docs.sh would report AGENTS.md CHANGED forever, which is the
staleness class this card closes. Drift-from-12 is history → log.md
(append-only; the v0.7.0 "twelve" entry at log.md:336–337 already sits
there). No in-page "Drift since pin" section — it duplicates log.md's
job.
2. **Assertion shape** — Owner's exact ordered (label, boldLead) sequence
is the right surface and the *only* one of the three that catches the
item-1 lead paraphrase (same label `1`; count-only and my
label-bijection and designer's prefix-set all miss it). I withdraw my
sub-bullet tolerance — the file lists 9.5/9.6 as `9.5.`/`9.6.` numbered
items (AGENTS.md:88–101), so mirroring is both faithful and simplest.
Designer's count+prefix-set is subsumed.
3. **Stated-count token** — Confirmed, non-redundant. Owner's regex
parses only `^\s*N. **bold**` lines; the frontmatter summary ("now
twelve") and the body "twelve hard conventions" heading are invisible to
it, so a correctly-mirrored list with a stale prose count passes owner's
check alone. Keep the count-token assertion (summary integer + "The N
hard conventions" heading == derived count) as a complement.
4. **` 10.` space** — Parser tolerance mandatory (anchored `^10\.`
undercounts to 12; the file has the leading space on BOTH ` 9.6.` and
` 10.`, AGENTS.md:97/103). Wiki copy writes clean `10.`/`9.6.`
(presentation, not truth — the regex normalizes both). AGENTS.md
whitespace stays untouched (source edit, out of scope); flagged as a
one-line lint observation in the log entry, fix = follow-up if the human
wants.
5. **Waiver note** — Hold, no active objection. One line in log.md's new
entry recording "human steer = card FLLWUP-25, substituting the schema's
discuss-first step." Silence would violate vault/CLAUDE.md's "flag, never
silently overwrite".
6. **Provenance frontmatter** — Agree; not a judgment call: the REQUIRED
contract says a page missing the banner or the source_* frontmatter is
not done. Cross-links #13→[[preflight]], 9.6→[[council-theme]]: both
pages exist (index.md), both correct and cheap — fold in.

**New testable claims.** C1 — count-token extraction is numeral-agnostic
and no-hardcode: scratch AGENTS.md with synthetic `14.` + matching
scratch page stays green with zero test edits. C2 — leading-space
tolerance proven not to force byte-copying: AGENTS.md's ` 10.`/` 9.6.`
and the page's clean `10.`/`9.6.` normalize to equal labels → equality
holds.

**Cross-seam reading.** One-way derivation: the page has no authority of
its own; its truth is "exactly as AGENTS.md lists them" — 15 bold-lead
tokens (13 integer + two decimal sub-entries). The page is stale at
three independent points (count tokens); the manifest pins df1949e,
stale since 2c5ec3b; the page violates the skill's REQUIRED source_*
frontmatter. **Blind spots.** Owner (engine/test view): the
exact-sequence parser cannot see non-list count tokens. Designer
(reader/snapshot view): a kept df1949e disables drift detection exactly
where the card demands it; the "Drift since pin" section duplicates
log.md. Me: my label-bijection under-rejected the lead-paraphrase class
— corrected by adopting exact leads. **Reframe.** The three positions
were ~90% converged; the merge is owner's exact-sequence + count-token
complement + designer's log-flag of the ` 10.` source bug + re-pin. The
only genuine correction is mine (labels→leads); the only genuine
addition is the count-token assertion over owner's list-only surface.

#### Designer round-1 response (job-21.6)

Settled ground first: home is test/; ruling recorded; no behavior
change; in-memory string mutations for red-honesty; provenance
frontmatter per skill; cross-links #13 → [[preflight]], 9.6 →
[[council-theme]]; human-loop waiver recorded in log.md; the lint
observation on ` 10.` goes in log.md as a follow-up hook, not on the
page and not in AGENTS.md.

1. **Manifest/banner pin — DISAGREE with my own step-2 position; merge
to owner+principal: re-pin to 2c5ec3b.** A banner that pins df1949e
while the body lists 13 conventions is not a banner-of-record — a reader
who follows the citation will git show df1949e:AGENTS.md, find 12
conventions, then distrust the body. The Drift-since-pin section would
have papered over a self-inflicted citation lie. Re-pin + clean refresh
serves the reader. Scope guard still holds: this is the same refresh,
the manifest line moves with the banner.
2. **Assertion shape — merge to principal's bijection + stated-count
token, with owner's exact-lead matching folded in.** My heading-prefix
set was the weakest: it tolerates a stale frontmatter summary line and a
re-ordered list. The union of all three is the smallest check that names
every concrete drift the card's Intent lists (stale item 1, misplaced
9.5, missing #13, prose "twelve"). Parser must be the same one
(label-tolerant, ` 10.`-tolerant) for both sides. False-positive risk is
bounded by the red-honesty contract.
3. **Stated-count token — IN.** Cheapest defense against the precise
failure the card names (page currently has "twelve" in both summary +
frontmatter while having the wrong items underneath); single regex match
on the prose line plus the frontmatter integer.
4. **` 10.` leading space — parser tolerance only, on this card.**
AGENTS.md whitespace fix is a follow-up; it is a behavior change to a
hard-conventions source — different card, different gate surface.
Normalizing the wiki copy as a one-shot adjustment is fine; the lint
observation belongs in log.md and a follow-up card, not the page body.
5. **Human-loop waiver — agree, no objection.** The log entry should say
"card = steer" and name the human-loop waiver explicitly.
6. **Provenance frontmatter — agree, no objection.** Compliance with the
skill's REQUIRED contract; in-scope for this refresh.
7. **"Drift since pin" section — drop.** With the pin re-pinned there is
no then-vs-now to narrate; the body should be unambiguous.

**New falsifiable predictions.** P8 (merge shape): scratch page with
correct order but a substituted boldLead (clause 10 rewritten) fails
naming clause 10; scratch page with 13 correct items but prose "twelve"
fails as a stated-count-token mismatch; scratch page with 10/11 swapped
fails as a label-order finding. P9: no `Drift since pin` heading in the
refreshed page (grep returns zero matches). P10: git diff origin/main --
AGENTS.md is empty; the ` 10.` leading space preserved in source. P11:
the refreshed page banner reads `> ⚠️ Derived from \`AGENTS.md\` @
\`2c5ec3b\` (captured YYYY-MM-DD).` and `git show 2c5ec3b:AGENTS.md`
returns 13 hard-convention headings — a reader following the citation
lands on a file whose convention list matches the page body.

### Step 3 close — exchange stopped early (positions stabilized)

Exchange rounds used: 1 of ≤3. All three seats converged on one settled
design:

- **Home (deliberation ruling, recorded per the orchestrator binding):**
  the consistency check lives in test/ as
  `test/fllwup25-agents-page.test.ts` — a test IS practical for a vault
  file, so the ruling is: no council/ script; no new engine surface.
- **Assertion shape (merged):** (a) ordered label equality over all 15
  tokens — labels are the file's own 1–13 + 9.5/9.6, parsed with a
  leading-whitespace-tolerant regex
  (`^[ \t]*(\d+(?:\.\d+)?)\.\s+\*\*([^*]+)\*\*`); nesting-free,
  renumbering-forbidden; (b) per-label normalized bold-lead equality
  (exact-lead policy); (c) stated-count token == derived count,
  covering the prose heading ("The N hard conventions") AND the
  frontmatter summary integer, PLUS (owner recommendation, no
  objection) the index.md:72 count token as a third site — recorded
  ruling: included. No hardcoded 13/15 anywhere — both sides derived at
  runtime.
- **Refresh scope (ingest pass):** page rewritten to mirror the file's
  structure verbatim — 13 top-level items (1–13) with the file's exact
  bold leads, 9.5/9.6 as labeled sub-entries under 9, wiki copy
  normalizes ` 10.`→`10.`; item 1 corrected (domain-neutral by design);
  banner re-pinned to 2c5ec3b + captured date; frontmatter gains the
  skill-REQUIRED provenance keys (provenance: repo-doc, source_path:
  AGENTS.md, source_commit: 2c5ec3b, captured: 2026-09-06); summary
  bumped to "thirteen" (+ sub-entries parenthetical); cross-links #13
  → [[preflight]], 9.6 → [[council-theme]]; index.md:72 "12"→"13";
  log.md new top entry noting 12→13, item-1 inversion correction,
  clause #13 source, human-loop waiver ("card = steer"),
  provenance-frontmatter conformance decision, and a one-line lint
  observation on the ` 10.` leading-space marker (AGENTS.md fix
  deferred as follow-up candidate); .repo-docs.tsv AGENTS.md pin
  df1949e → 2c5ec3b. No "Drift since pin" section; historical
  "twelve" entries in log.md stay (append-only).
- **Proof:** red test against the current stale page ships in the same
  PR as the refresh (TDD); red-honesty as in-memory string mutations of
  disk-read text (drop #13, renumber 9.5→10, invert item-1 lead, wrong
  count token, 10/11 swap) each yielding a named finding; pristine real
  pair → []; no-hardcode counter-check (synthetic `14.` on both sides of
  a scratch pair stays green); parser-trap check (`^10\.`-anchored
  variant undercounts to 14 — must be 15).
- **Scope:** the four existing gates in full; env-split, theme-*, mcp
  guard suites untouched; check-pi-drift.sh byte-identical; diff touches
  only the vault page + index.md + log.md + .repo-docs.tsv + the new
  test (+ the plan doc). AGENTS.md itself is NOT edited (the ` 10.`
  whitespace fix is a deferred follow-up candidate).
- **Residual:** none open — all judgment points settled in round 1; no
  open judgment dispute survives to step 6.

### Step 4 — Skeptic attack (job-21.7): BLOCKS, 1 red / 10 green

Eleven objections, all with real runs in this container:

1. **Stated-count-token shape: "frontmatter summary integer" does not
   exist — CLOSED-RED.** The page's frontmatter summary contains no
   convention-count integer (only `['7','0']` from `v0.7.0`); the count
   is the word `twelve`, and after refresh will be "thirteen" — still a
   word. Fix required before spec: (a) normalize words→numbers
   ("twelve"→12); (b) add a dedicated numeric `count:` frontmatter
   field; or (c) drop the frontmatter-summary assertion and rely only on
   index.md:72 + the prose heading.
2. **Double count-token in page body (heading vs body prose) —
   CLOSED-GREEN.** The page has TWO `twelve hard conventions` instances
   (heading + bold body sentence). Spec must disambiguate which is
   authoritative (heading only / first match / both must match).
3. **log.md historical count tokens — CLOSED-GREEN.** log.md contains
   `12th AGENTS.md convention` and `(twelve conventions)` — historical,
   must stay append-only. Spec must constrain the count-token scanner to
   the page body + index.md:72 only; no vault-wide hunt.
4. **Section-heading format divergence — CLOSED-GREEN.** AGENTS.md uses
   `## Hard conventions`; the page uses `## The twelve hard conventions`.
   Spec must state the refreshed page heading format so the parser knows
   what to slice from.
5. **`sources: []` vs provenance — OPEN-UNTESTED.** Existing page has
   `sources: []` while the design adds source_path/source_commit — an
   empty sources array semantically claims zero sources. Spec must say
   keep / delete / replace (e.g. `sources: ["AGENTS.md"]`).
6. **validate.py has zero vault surface — CLOSED-GREEN.** `grep -rn
   'vault/' council/validate.py` → zero matches; page/provenance changes
   cannot cause a validate regression.
7. **No existing test reads the source page's exact text — CLOSED-GREEN.**
   `grep -rn '2026-08-23-agents' test/` → zero matches.
8. **Parser trap fully confirmed — CLOSED-GREEN.** Tolerant regex → 15
   matches (13 integer + 9.5 + 9.6); `^10\.`-anchored → 0;
   no-leading-space `^[0-9]+\.` → 12 (silently skips 10, 9.5, 9.6).
   ` 10.`/` 9.6.` carry 2 leading spaces; `9.5.` has none.
9. **Stale page is red with named findings — CLOSED-GREEN.** Labels
   differ (15 vs 12), item-1 lead differs, prose count token "twelve",
   frontmatter summary "twelve".
10. **`git show 2c5ec3b:AGENTS.md` == HEAD AGENTS.md — CLOSED-GREEN.**
    `diff` says IDENTICAL; 2c5ec3b is the last AGENTS.md touch.
11. **Baseline gates all green — CLOSED-GREEN.** `bun test` 571/2/0,
    `bunx tsc --noEmit` exit 0, `python3 council/validate.py` clean (run
    in this container on the sync-stable tree).

Verdict: **BLOCKS** — objection 1 is closed-red (the "frontmatter summary
integer" assertion is not implementable against a page whose summary uses
words, now or after refresh); objections 2–5 are spec-pinning gaps the
spec must close before the owner can implement; 6–11 clean. The
must-fix/must-specify set is carried to the consolidator as binding on
the spec write-up (council.md step 4: closed by the red result, not by
argument).

### Step 5 — Consolidator synthesis (job-21.8): two open judgment items

Sorted the record into settled / open judgment / open objections. All
Skeptic objections closed (1 red, 10 green). Settled: test/ home (no
council/ script); merged assertion shape (ordered label equality over all
15 tokens + per-label normalized bold-lead equality + stated-count token
== derived count); count-token kept; ` 10.` parser tolerance + wiki-copy
normalization + AGENTS.md whitespace fix deferred; index.md:72 third
assertion site included; pin re-pinned df1949e → 2c5ec3b; no "Drift
since pin" section; provenance frontmatter added; cross-links
#13→[[preflight]] / 9.6→[[council-theme]]; human-loop waiver in log.md;
red-honesty via in-memory mutations; no-hardcode counter-check; SPEC-3
(log.md historical entries out of scanner scope); all green Skeptic
items. RED-1 resolution (binding): fix (a) normalize words→numbers — all
three seats kept the assertion (rules out drop); the refresh plan writes
the word "thirteen" with no numeric count: field (rules out add-field);
principal C1 / owner T2·T5 / designer P8 compare the existing word token
to the derived integer — that IS normalization. The step-3 close's
phrase "frontmatter summary **integer**" is corrected to "frontmatter
summary count token (word, normalized to its integer)". SPEC-2 (binding,
settled by intent): both page-body instances (section heading AND bold
body sentence) are count-token assertion sites; both must match. Two
open judgment items survive:

- **SPEC-4** — refreshed page conventions-section heading format:
  `## Hard conventions` (match AGENTS.md) vs `## The thirteen hard
  conventions` (preserve page voice). No seat took a binding position;
  no test settles it; parser-slice consequence. Step-3 close never
  pinned it.
- **SPEC-5** — disposition of the existing `sources: []` frontmatter
  array when adding provenance keys (replace with `sources:
  ["AGENTS.md"]` / delete / keep). No seat expressed a position; the
  skill's REQUIRED contract names the four provenance keys, not
  `sources`; empty-array-claims-zero-sources tension.

Consolidator synthesis (verbatim):

> **Consolidator synthesis — FLLWUP-25.** The deliberation converged.
> The consistency check lives in `test/fllwup25-agents-page.test.ts` as
> a pure, test-local `diffConventions(agentsText, pageText)` with no new
> engine surface and no council/ script. The assertion is the merged
> shape: ordered label equality over all 15 tokens (1–13 + 9.5 + 9.6,
> parsed with `^[ \t]*(\d+(?:\.\d+)?)\.\s+\*\*([^*]+)\*\*`),
> per-label normalized bold-lead equality (exact-lead policy), and a
> stated-count-token assertion == derived count covering the page-body
> count tokens (both the section heading and the bold body sentence),
> the frontmatter summary, and index.md:72. No hardcoded 13/15
> anywhere. Red-honesty is in-memory string mutations of disk-read text
> only; a no-hardcode counter-check (synthetic `14.` on both sides of a
> scratch pair stays green) and a parser-trap check (`^10\.`-anchored
> variant undercounts, must be 15) ship alongside.
>
> **RED-1 resolution (binding on the spec).** Fix (a) normalize
> words→numbers; the spec must (i) replace every "frontmatter summary
> integer" phrase with "frontmatter summary count token (word,
> normalized to its integer)", (ii) pin the word→number normalization
> ("twelve"→12, "thirteen"→13), and (iii) note index.md:72 is already
> digit-form and needs no word normalization.
>
> **SPEC-3 (binding on the spec).** The count-token scanner is confined
> to the page body + frontmatter summary + index.md:72. Historical
> "twelve" entries in log.md are append-only and must NOT be flagged or
> rewritten.
>
> **SPEC-2 (binding on the spec, settled by intent).** Both page-body
> instances (section heading + bold body sentence) are count-token
> assertion sites; both must normalize-and-match the derived count.
>
> **Refresh scope (ingest pass).** Page rewritten to mirror AGENTS.md @
> 2c5ec3b verbatim — 13 top-level items with the file's exact bold
> leads, 9.5/9.6 as labeled sub-entries under 9, wiki copy normalizes
> ` 10.`→`10.`; item 1 corrected; banner re-pinned to 2c5ec3b +
> captured 2026-09-06; frontmatter gains
> provenance/source_path/source_commit/captured; cross-links
> #13→[[preflight]], 9.6→[[council-theme]]; index.md:72 "12"→"13";
> log.md new top entry (12→13, item-1 inversion correction, clause #13
> source, human-loop waiver "card = steer", provenance conformance
> decision, ` 10.` lint observation); .repo-docs.tsv pin df1949e →
> 2c5ec3b. No "Drift since pin" section. AGENTS.md is NOT edited.
>
> **Scope guards.** Full gate set stays green; check-pi-drift.sh
> byte-identical; env-split/theme/mcp suites untouched; diff touches
> only the vault page + index.md + log.md + .repo-docs.tsv + the new
> test (+ plan doc).
>
> **Open judgment carried to step 6 (two items).** SPEC-4 (heading
> format) and SPEC-5 (`sources: []` disposition) — both narrow
> spec-pinning gaps, not design disputes; neither test-settled, neither
> covered by a standing ruling.

### Step 6 — route what does not close: two open judgment items, no standing-ruling coverage

Applied: no Phase-1/standing ruling answers either item. Checked against
the recorded rulings — the EPIC-6 features-new ruling (B-6) and the
EPIC-5 D1/D5 copy-routing precedent establish that exact copy text is a
Phase-1-ruled class and route it to the ruling gate; they do not decide
FLLWUP-25's heading format or frontmatter-array disposition. The
subject-pinning and doc-sync classes have no standing rulings covering
these specific choices. All Skeptic objections are closed (1 red, 10
green) and binding-fixed above; no open objection remains. Both open
judgment items are genuine ruling-seat questions → **ESCALATED** to the
orchestrator for the ruling seat (product-owner, escalating to steward
per its own criteria), packet below. Red-flag check: deciding the page
heading format or the sources-array disposition myself — or extending a
copy-routing precedent to a choice it never made — would be deciding
rather than routing.

### Step 7 — spec written, handed to owner (2026-09-06, resumed container)

Rulings R-1/R-2 (product-owner, step-6 escalations) appended verbatim to
the card face as a `## Phase 1 rulings (product-owner, step-6
escalations)` section (commit 2f1fc12); both fold into the spec. Spec
saved to `docs/superpowers/specs/2026-09-06-FLLWUP-25-design.md`
(full-council path; commit 424c19c). R-1: conventions-section heading
`## Hard conventions` verbatim — no count word — symmetric parser slice
anchor between page and file, count-token assertion pinned to the three
sites (bold body sentence, frontmatter summary word, index.md:72 digit)
with word→number normalization (Skeptic RED-1 fix; SPEC-2 superseded by
R-1 for the heading site, which no longer carries a count word). R-2:
`sources: []` deleted and populated from the body's wiki-internal
[[wikilink]] targets; the AGENTS.md citation lives in the four REQUIRED
provenance keys (provenance: repo-doc, source_path: AGENTS.md,
source_commit: 2c5ec3b, captured: 2026-09-06) and the body `## Sources`
section re-pinned to `AGENTS.md @ 2c5ec3b`. Self-review: no
placeholders, no scope beyond the card goal, single design per resolved
point. Card set In Progress; validate clean; owner dispatched next.

### Step 8 — owner delivered (job-23.1), PR #41 open (2026-09-06, resumed container)

Owner implemented in worktree `.worktrees/fllwup-25-agents-page` (branch
`feat/fllwup-25-agents-page` based at origin/main cc2ce70), pushed, PR
#41 open (observed: state OPEN, headRefOid `2c1142b1…`, base main; diff
scope exactly 4 modified vault paths + 2 new files). Plan:
`docs/superpowers/plans/2026-09-06-FLLWUP-25-plan.md`. TDD order held:
suite red against the stale page, red on only the index digit after the
page rewrite, then fully green. Owner gates green at the gated head
26b2506 (pushed head 2c1142b differs by exactly one plan-doc
PR-reference line, verified `git diff`): frozen-lockfile exit 0 ("224
installs, no changes"), tsc clean, `bun test` 577/2/0 (new suite 6/6;
env-split-contract, theme-* ×9, fllwup23-dep-less, fllwup24-drift
103/0), validate clean. Notable: the stale page's missing `## Hard
conventions` heading surfaced as an extra R-1 violation named by the
test (a red finding, not a workaround). In Review set (sole condition:
open PR, observed). Skeptic at the branch next.

### Step 9 — Skeptic NO-BLOCK at head 2c1142b (cycle 1 of 3)

Skeptic (job-23.2) verified at pinned subject: head SHA `2c1142b1…`,
worktree `.worktrees/fllwup-25-agents-page`, loop frame stated (step 9
precedes step 10 judging and step 11's mechanical merge,
facilitator-executed). Verdict **NO-BLOCK**, all objections closed-green
with real output: four gates re-run at head (frozen-lockfile exit 0
"224 installs no changes", tsc clean, `bun test` 577/2/0 incl. new
suite 6/6 + untouched deliverable suites, validate clean); red-honesty
all 5 mutations yield named findings (labels/lead-1/page-body count
token); no-hardcode synthetic-14th pair green zero test edits;
parser-trap strict anchor undercounts 15→14; R-1 heading literal `##
Hard conventions` (no count word); R-2 `sources:` 7 wiki-internal
wikilinks, zero `[[AGENTS.md]]`, `## Sources` section @ 2c5ec3b, four
provenance keys present; scope byte-identity (AGENTS.md, check-pi-drift,
package.json, bun.lock, gates.yml ×0 bytes); banner pin 2c5ec3b with
`git show 2c5ec3b:AGENTS.md` == HEAD; index.md:72 "13"; log.md top
entry carries items (a)–(f) with historical lines 331/337 untouched;
.repo-docs.tsv row pinned. Stale-probe: `sliceConventions` throws on
the stale heading (red before refresh). Verify cycles used: 1 of ≤3.

### Step 10 — judge PASS (job-23.3)

Judge dispatched with exactly the card's `goal` (verbatim) + the step-9
Skeptic evidence, subject pinned (head `2c1142b1…`, head worktree
`.worktrees/fllwup-25-agents-page`), loop frame stated (step 10
precedes step 11's mechanical merge, facilitator-executed). Verdict
**PASS** — all four goal conjuncts mapped to evidence with its own
direct artifact runs: (1) "the vault wiki source page … matches the
current AGENTS.md" — diffConventions(agents, page) == [] (T-B) + direct
diff of all 13 conventions with matching leads; (2) "counting the
conventions exactly as the file lists them, including clause #13 " —
labels 1–13 + 9.5/9.6 present in both files; four indices agree on 13
(derived count, page body bold "thirteen", frontmatter summary word,
index.md:72 digit); clause #13 present; (3) "proven by a driven or
scripted consistency check" — the 6-test suite (26 expects) re-run by
the judge itself: 6 pass / 0 fail; (4) "no behavior change anywhere in
the gate set" — byte-identity diff 0 bytes on engine/gates files, full
suite 577/2/0, tsc clean. No REJECT basis; no goal-text defect. Verify
cycles used: 1 of ≤3.
