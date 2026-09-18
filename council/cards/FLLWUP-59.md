---
id: FLLWUP-59
title: Mechanically derive or police the shape witness's token allowlist
state: In Review
owner: null
epic: EPIC-9
goal: The shape witness's provider-token list is derived or policed mechanically, so a future token retirement cannot silently create a miss without the hand-maintained regex being updated.
---

## Run record (features-deliver / FLLWUP-59 — EPIC-9 residuals run 2)

### Step 1 — promotion + classification (facilitator)

- **Promotion (`Backlog` → `Ready`) applied, not asked.** Phase-1 run-2 scope
  ruling (`EPIC-9.md` run-2 block): `FLLWUP-50` through `FLLWUP-60` "are this
  run's delivery scope". `FLLWUP-59` is the **tenth of eleven** in the
  `steward` job-1 build-order ruling ("…then harness hygiene (`55`, then `56`,
  whose live arm must precede the budget cards), then the allowlist policing
  (`59`) over the settled harness, and the CI runaway backstop (`58`) last,
  sized against the final arm set"). Run-2 precedent (FLLWUP-56, run-1
  precedent 5608ed1): the autonomous promotion moves the residual card to its
  working state at its runner's start. The card's creation was already
  ratified by `product-owner` (job-29, FLLWUP-48 step-13 draft 2 confirmed) —
  the promotion-ratification power re-homed per `features-deliver.md`'s
  authority map. `Deliberating` set at step 2's opening per council.md.
- **Path: full council.** The `goal` is itself a disjunction — "**derived or
  policed** mechanically" — and each branch admits more than one reasonable
  mechanism (deriving the token list from a maintained single source vs
  policing the regex's coverage against an independent enumeration). That is
  `spec-ambiguous` plus `design-judgment`; either suffices per council.md
  step 1. Not cross-seam in the repo-area sense (the witness test file and
  possibly adjacent test-hygiene files only).
- **Surface-touching: no (recorded).** The deliverable is internal test
  machinery in `test/faux-provider-shape.test.ts` (and at most adjacent test
  files): no product-visible surface, no user-visible copy, no empty state,
  no error state. No `designer` is seated. A design concern on this card
  would be filed as a step-13 follow-up, not used to seat `designer` on a
  mechanical concern.
- **Rulings applied here (cited, not re-asked):** Phase-1 run-2 scope governs
  the promotion; `steward` job-1 governs the build-order position; **R2**
  governs the later merge (`gh pr merge <PR> --squash --admin
  --match-head-commit <X>`, all five deterministic criteria); **R3** governs
  record pushes (direct to `main`, admin identity, disclosed in this card's
  record and the run ledger); the run-wide **zero-new-live-arms** constraint
  (FLLWUP-49 O10) applies — any change here must add zero live arms; and
  step-13's draft-then-confirm gate is re-homed to `product-owner` as
  **pre-write** (this container drafts, never writes an unapproved follow-up,
  and never dispatches `product-owner`). No card-specific Phase-1 ruling
  exists beyond R2/R3.
- **Seat resolution (`<seat_resolution_check>`):** `owner`, `principal`,
  `skeptic`, `consolidator`, `judge` — the seats this card dispatches — all
  present in `council/agents/` (nine files); no repo-local `.pi/agents/`
  override directory exists, so nothing shadows them. Ruling seats
  (`product-owner`, `steward`) are never dispatched by this container per
  `<escalation_contract>`.
- **Environment:** step 0 preflight skipped per the autonomous-run
  substitution (Phase 0 cleared it for the epic). `python3
  council/validate.py` → `All council artifacts valid`. Local `main` ==
  `origin/main` at `ed8cc84` (FLLWUP-60, 57, 51, 53, 50, 54, 55, 56 all
  merged; working tree clean). No `Needs Human` state and no outstanding
  ruling on this card — deterministic merge check criterion 5 holds at card
  start. `council/agents/` is the packaged set; `.council.json` carries the
  run-stable seat-model overrides (run-config-stability).
- **Gate set for this repo** (authoritative: `.github/workflows/gates.yml`):
  `bunx tsc --noEmit`, `bun test`, `python3 council/validate.py`, plus
  `bash council/preflight.sh FLLWUP-59` (the FLLWUP-27
  stale-by-construction line aside, when it recurs).
- **Settled-harness facts carried in (from the orchestrator, neutral — no
  seat position attached):** the token regex in
  `test/faux-provider-shape.test.ts` test 6 is a hand-maintained allowlist
  that already missed once (the retired-path source-comment token at
  `test/ev41-retry-e2e.test.ts:325`, found by FLLWUP-48 and fixed on that
  card without widening the regex per its principal's refinement, which
  recorded the allowlist-decay as a finding — this card). Since then the
  harness changed materially: FLLWUP-49 promoted the shared faux-provider
  station (`test/faux-provider/`), FLLWUP-55 collapsed the smoke driver onto
  `test/faux-provider/pty_kit.py` and added the two-sided stdlib-only guard
  (shape tests 9–11), and FLLWUP-56 added `test/ev41-seat-child-live.test.ts`
  plus the `EV40_TOOLCALL_WAIT` knob (`harness.ts:175`). The mechanism this
  card delivers must cover the settled harness and keep those guards green.
- **Evidence base read before this decision:** `council.md` and
  `features-deliver.md` in full; `council/cards/FLLWUP-59.md`,
  `FLLWUP-48.md` (the full run record, including step-13 draft 2 and the
  principal's allowlist-decay refinement); `EPIC-9.md` (run-2 Phase-1 block);
  `test/faux-provider-shape.test.ts` in full; `test/faux-provider/` station
  listing; `vault/wiki/index.md` (no page covers the token allowlist; the
  nearest pages are `test-suite-budget.md` and `smoke-test.md` — this card's
  durable artifact may warrant a page at step 14).
- **Step 2 is opened below:** state `Deliberating` on the card and board,
  `validate.py` clean, then `owner` + `principal` dispatched independently on
  the card alone (no `designer` — not surface-touching).

## Intent

`test/faux-provider-shape.test.ts`'s token regex is a hand-maintained
allowlist; FLLWUP-48 found it had already missed once (the retired-path
source-comment token at `ev41-retry-e2e.test.ts:325`), fixed on that card
without widening the regex per its principal's refinement. A mechanical
derivation or police of the token list prevents the next token retirement
from silently creating a new miss.

Approved by `product-owner` (job-29) from FLLWUP-48's step-13 draft 2.

### Step 2 — independent first pass (round 1)

Two generators dispatched independently on the card alone (no `designer` — not
surface-touching). Jobs: `owner` `job-26.1` (8.6m, 10 turns), `principal`
`job-26.2` (8.6m, 17 turns), both settled `done`. Positions appended verbatim.

#### Position — `owner` (job-26.1)

**Approach — derive, don't police.** Replace test 6's hand-maintained regex
with a **git-derived retired-path set**: the mechanical definition of a
"retired token" is *a path that exists in some commit's history and does not
exist in the current tree*, plus its *retired ancestor directories* (a dir
that once contained files and now contains none). Test 6 then asserts no
path-shaped reference to any derived retired token survives in the scan
domain. There is no allowlist left to maintain — the next token retirement
enters the derived set automatically, and any stale reference becomes a loud
red with no regex edit. Probed empirically before taking the position
(read-only, in-repo):

- **Green at head**: derived tokens (16 retired files, 3 retired dir tokens:
  `ev43/`, `smoke/artifacts/`, `test/ev40-harness/`) produce **zero**
  path-shaped collisions on the current `test/` + `smoke/` tree, witness
  excluded.
- **Reds on the actual FLLWUP-48 miss**: run against the pre-fix content of
  `test/ev41-retry-e2e.test.ts` (parent of `ca22360`), the mechanism fires on
  `test/ev41-tui.py` — the exact token the hand regex had already missed
  once.
- **Why not "police"**: a police test (assert the hand regex covers the
  derived set) keeps two sources of truth whose disagreement must still be
  resolved by a hand edit — the exact decay mode. Deriving collapses the
  list; there is nothing left to forget.

**Where it lives and what it scans.** Inside
`test/faux-provider-shape.test.ts` itself, replacing test 6's regex literal.
The witness already owns the right machinery: `filesUnder` (witness
self-exclusion, `__pycache__`/bytecode exclusion — same rule applied to
derivation: `__pycache__` paths never become tokens), `countMatches`, the
`test/` universe, the FLLWUP-55 `smoke/` extension. Structure follows the
file's existing pure/impure pattern (`kitImportViolations`,
`bannedScreenSessionLines`):

- `deriveRetiredTokens(historyPaths, currentPaths)` — **pure**, takes two
  path lists.
- `retiredPathViolations(src, tokens)` — **pure**: a violation is a full
  retired file path as substring, OR a retired dir token `d/` followed by a
  path-continuation character (`[A-Za-z0-9_]`).
- Thin impure wrapper spawns `git log --all --pretty=format: --name-only` and
  `git ls-tree -r HEAD --name-only` from `REPO_ROOT` — read-only `git`
  subprocesses, the same benign spawn class as `python3 -m py_compile`
  (test 8 already spawns). No pi arm, no pty, no new test file, no arm-count
  change.

**How it fails loudly on the next retirement.** Dev renames/moves a path;
`git log` now reports it as historical; if any source under
`test/`/`smoke/` still names the old path in a path-shaped way, test 6 reds
with the offending token and file. The fix is always *fix the stale
reference* — never edit the mechanism. This is the inversion the card asks
for: a retirement can no longer *silently* create a miss; it can only loudly
create a red.

**Two-sidedness (does not weaken the witness).**

- Synthetic red probes: scratch sources naming
  `test/ev40-harness/ev41-tui.py`, `test/ev41-tui.py`,
  `ev43/falsifier-headless.ts` must red — each hand-regex token family is
  covered at derived granularity.
- The mechanism also reds on the **real historical miss** (archeology probe
  above) — stronger than any synthetic.
- The bytecode/self-exclusion rules are inherited, not reimplemented, and the
  existing scan-domain test (bytecode dropped, source hit) stays.

**Settled-harness coverage.** The mechanism is orthogonal to
FLLWUP-49/55/56 changes: it reuses the witness's post-FLLWUP-55 scan domain
(test/ + smoke/), keeps tests 9–11 untouched, and the `EV40_TOOLCALL_WAIT`
knob / seat-child-live file are just more files in the scan. Nothing about
the derivation depends on harness internals.

**One deliberate semantic narrowing, stated and owned.** The hand regex's
bare `ev40-harness\/` alternative reds on a *bare dir mention followed by
whitespace* ("the retired ev40-harness/ family"); the derived path-shaped
rule does not. Claimed as a correction, not a weakening: the current tree
proves the bare-dir rule is unimplementable mechanically — it would red on
the legitimate retirement-documentation prose in
`test/ev43-reachability.test.ts:6` ("the retired ev43/ scratch extension"),
which is precisely why the hand regex was forced into the awkward
`ev43\/falsifier` shape. The derived rule polices *path-shaped references*
(the only kind that can mislead a reader into thinking a file exists); prose
dir mentions are out of scope by design, and that boundary is pinned by a
green-side synthetic test. If a future miss hides in a bare-dir prose
mention, it is not a resolvable-path reference and the witness's charter
(shape of the harness, not prose style) does not reach it.

**Tradeoffs accepted.**

1. The narrowing corner above — a bare-dir whitespace mention escapes
   policing. Bounded, named, test-pinned.
2. **History dependence**: derivation needs a non-shallow git repo.
   Silent-empty derivation would be the witness passing while policing
   nothing — the exact failure mode — so empty/errored history is a **named
   loud FAIL**, never a green. Accepted cost: two `git` spawns per
   `bun test` run (~tens of ms against the ≈94s suite budget,
   `test-suite-budget.md`).
3. `--all` includes side-branch history: a path that only ever existed on an
   unmerged branch becomes a token. At the `test/`+`smoke/` scan scope and
   this repo's merge discipline, the false-red risk is judged negligible and
   the simpler, deterministic derivation preferred.
4. The retired set grows forever with history — scan cost is linear in files
   × tokens; trivial at current scale (868 historical paths), no
   optimization now (no speculative abstraction).

**Testable claims (Skeptic-runnable).**

1. **Green-at-head**: `deriveRetiredTokens` over real history +
   `retiredPathViolations` over the real scan domain yields `[]` today.
2. **Historical-miss red**: the pure checker run on
   `git show ca22360^:test/ev41-retry-e2e.test.ts` returns a violation
   containing `test/ev41-tui.py` — the mechanism would have caught
   FLLWUP-48's actual miss.
3. **Next-retirement tripwire**: with synthetic history lists (a fake future
   retirement) the derived set grows and a scratch source naming the retired
   path reds — pure-function test, no git spawn needed.
4. **Two-sided boundary**: "retired ev43/ scratch extension" → green; "see
   ev43/falsifier-headless.ts" → red; "via test/ev40-harness/ev41-tui.py" →
   red; "the retired ev40-harness/ family" → green (the owned narrowing,
   pinned).
5. **Loud-fail**: an errored or empty `git log` (shallow clone) produces a
   named failure, never a silent pass.
6. **Zero-new-arms**: the diff touches only
   `test/faux-provider-shape.test.ts`; arm count, pi/pty spawns unchanged.

**Wiki note**: the vault has no page for this witness (nearest:
`test-suite-budget.md`, `smoke-test.md`); the implementing owner should
record the mechanism (derived retired-path set, path-shaped boundary,
loud-fail rule) as a wiki page in the same PR, per house discipline.

#### Position — `principal` (job-26.2)

Grounding read: the wiki index, the witness, the harness, FLLWUP-48/55 specs,
the FLLWUP-59 card, `gates.yml`, and the two sibling police-pattern tests
(`prose.test.ts`, `fllwup25-agents-page.test.ts`); verified actions/checkout's
default `fetch-depth` against its own README (single commit) rather than
memory.

**The contract, exactly.** Test 6 (`test/faux-provider-shape.test.ts:123-125`)
asserts no file under `TEST_DIR` (`:24`) contains any of three literal
fragments: `ev40-harness/`, `ev43/falsifier`, `ev43/ev43-falsifier`. Scan
domain is `filesUnder` (`:29-46`) — all of `test/`, minus the witness itself
(`:26`) and bytecode. The trio is the residue of FLLWUP-49's refactor
(`docs/superpowers/specs/2026-09-17-FLLWUP-49-design.md:52-71`).

**The seam the card doesn't name.** The witness's scan substrate is the
**filesystem**; the fact it polices — "this path was retired" — lives on a
**different substrate, git history**. Test 6 reads no git. The transfer of
that fact from the refactor commit into the regex at `:124` is carried by
*human memory*. That hand-carry is the allowlist, and it is the only
unmechanical link in the chain.

**The decay vector, file-grounded.**

- FLLWUP-49 retired **four** path tokens: `ev40-harness/`, the `ev43/`
  falsifier pair, and `test/ev41-tui.py` → `test/faux-provider/ev41-tui.py`
  (`FLLWUP-49-design.md:66`). The regex covers three. The fourth is absent.
- The miss surfaced as a *prose comment* —
  `test/ev41-retry-e2e.test.ts:325`, found by FLLWUP-48 (`FLLWUP-48.md:706-710`),
  fixed on that card without widening the regex. That comment now reads
  `test/faux-provider/ev41-tui.py`.
- **The sharper fact:** because `ev41-tui.py` is still not in the regex,
  test 6 cannot detect a *regression* of the exact miss it exists to prevent.
  If `:325` were reverted, `bun test` is green. The coverage gap and the
  known miss coincide.
- **Why comments:** a stale *import* is red under `tsc` — that is why the
  three import moves were safe. A stale *mention* has no compiler. Test 6 is
  the repo's only mechanism that treats comments as checked prose, and its
  detection is exactly as good as its literal list.
- **The token choice is hand judgment, not derivable.** `ev43/` is retired
  *and* legitimately alive: `test/ev43-reachability.test.ts:6` comments on
  "the retired ev43/ scratch extension", and `:52-53` carry provider ids
  `ev43`/`ev43-model`. That is why the token had to be narrowed to
  `ev43/falsifier`. There is no mechanical rule for "which shortest
  non-existent prefix is safely retired".

**Who updates what when a token retires.** The mover card updates importers
(forced by `tsc`). Nothing forces it to touch
`test/faux-provider-shape.test.ts:124`; the move doesn't touch that file. If
it forgets, only a comment reference survives, the full gate set is green,
and the decay is invisible until a human reads it. Green-by-omission is
structurally unlike every other falsifier in this suite.

**Wiki gap (cited):** `vault/wiki/index.md` has no page for this;
`vault/wiki/test-suite-budget.md` covers the envelope and `smoke-test.md` has
no mention of the witness or token (grep: no matches). Nothing in the wiki
states this contract, so a durable page is a plausible step-14 artifact.

**Blind spots**

- **Owner's vantage (inside the test file).** Sees the regex and the scan;
  cannot see the retirement event (different card, often an earlier commit)
  and cannot see a *missing* token — a miss is byte-indistinguishable from a
  clean tree. Its natural local fix is hand-widening, which *is* the decay.
- **The mover's vantage (inside a refactor card).** Sees the moved path and
  its code consumers; `tsc`/`bun test` red on stale imports. Cannot see
  stale comment mentions — no compiler reads prose. It has **no forcing
  function at all**; the obligation is ambient.
- **The history/prose vantage.** The corpus is deliberately full of
  references to retired paths and provider ids
  (`ev43-reachability.test.ts:6,:52-53`). This vantage *defeats* the obvious
  derivation rule "was committed, now absent" — it is the reason the
  allowlist is narrow.
- **The CI vantage.** The witness runs in `gates.yml`, whose checkout step
  (`gates.yml:9`) has no `fetch-depth`. actions/checkout's README states the
  default is a single commit. Any mechanism deriving retirement facts from
  `git log`/`git diff` across history sees a one-commit repo in CI and
  silently yields a near-empty set — **a new silent-miss class with the same
  signature as the one this card fixes**. This fact is invisible from inside
  the deliberating card and invisible from inside `test/`.
- **The card-framing vantage.** The goal says "provider-token list"; test 6's
  subject is retired **path** tokens. Test 2's provider count
  (`fauxProvider(`, `:92`) and test 4's class count are different policing.
  The naming is a wrong-object hazard.

The principal disagrees with the facilitator's "not cross-seam" note in the
**substrate** sense: the source-of-truth decision (git history) and the
CI-shape fact are both invisible from inside the test file, and they are the
two facts that decide the design.

**Reframe.** The card's "derived **or** policed" is a false binary on two
counts, and the disjunction hides the actual decision.

**First, derivation does not remove the hand judgment — it relocates it.**
A pure "derive from retirements" rule emits `ev43/`, which false-positives on
legitimate history. To stay green it must carry a *carve-out list* (which
prefixes are still alive) — so the hand-maintained token allowlist becomes a
hand-maintained exclusion allowlist. The decay moves; it doesn't die.

**Second, "police" is ambiguous and the ambiguity decides the card:**

- **P1 (list hygiene):** every regex entry names something now absent. Cheap,
  in-tree, shallow-clone-proof — and does **not** prevent a miss.
  Insufficient for the goal.
- **P2 (coverage):** every retirement is covered by the regex. This is the
  goal. It requires an independent retirement enumeration.

So the real axis is **where the retirement enumeration comes from**. Three
grounded candidates, honestly costed:

**(a) git history** — `git diff --diff-filter=D --no-renames <base> HEAD --
test/ ev43/ smoke/`. Authoritative: AGENTS.md forbids rewriting history on
`main`, so retirement facts are durable, and this is the *only* source that
sees a retirement the mover forgot. Cost: `gates.yml:9` is depth-1, so it
needs `fetch-depth: 0` **plus a fail-loud guard that throws when history
depth is insufficient** (otherwise it recreates the silent miss), a pinned
window base (the witness's creation commit is the principled boundary —
"retirements the witness could have witnessed"), and a *fragment* reduction,
not a path literal (claim 3). Trap to pin: with default rename detection, a
`git mv` shows as `R`, not `D`, so `--diff-filter=D` alone can miss it — the
design must pin `--no-renames` or use `--diff-filter=DR` (claim 9).

**(b) in-tree mention-resolution** — scan source for path-like tokens, check
each on disk. Shallow-proof, no git, zero list — but over-broad: `ev43/`,
temp prefixes (`ev43-test-`, `ev41-tui-test-`), and card references are
legitimate non-resolving mentions. Needs an exclusion list; (a) again with a
worse extractor.

**(c) committed retirement ledger** — explicit, shallow-proof, but
hand-written = today's regex in a new file. Unless a dev-side generator
(preflight, where full `.git` exists) writes it, in which case CI verifies
only the ledger's internal consistency, not its completeness.

**Recommendation: P2 via (a), keep `:124` as the operational instrument, and
reuse the two idioms already shipped in this repo rather than invent one.**

- `test/fllwup25-agents-page.test.ts` is the house shape for
  derive-one-side / assert-stated-side / **named finding** / zero hardcoded
  numbers (`derivedCount` `:81`, `diffConventions` `:89`, T-D synthetic
  no-hardcode `:261`). The police check should mirror it and fail with the
  **token name** in the message. Honest caveat: its derived side is *in-tree*
  (AGENTS.md); the retirement set is not, so it is a shape precedent, not a
  source precedent.
- `test/prose.test.ts:18-25` is the house shape for a legitimate substring
  surviving a retirement — strip `features-deliver.md`, then assert no bare
  `deliver.md`. That is exactly the `ev43/` vs `ev43/falsifier` carve-out,
  already shipped as an idiom.

Under this reframe, "the regex stays byte-stable except when the mechanism
changes it" is honest and satisfiable: the mechanism makes the omission *loud
and named*; a human still edits the literal. If instead the mechanism
*generates* the alternation, that constraint is not a code property at all —
provenance of a byte change is unobservable from the tree; only review sees
it. The clause is worth interrogating on that ground.

**No design is sound-and-obvious here** — the git/CI interplay and the
fragment-vs-path trap are load-bearing and currently unaddressed. That is the
reframe this card earns.

**Testable claims (Skeptic-runnable)**

1. **CI history is one commit.** In a `git clone --depth 1` (the gates.yml
   environment, `fetch-depth` default 1 per actions/checkout README):
   `git rev-list --count HEAD` → `1`; `git log --diff-filter=D --name-only
   -- test/ | wc -l` → `0`, vs the full-history count `> 0`. Expected: the
   derivation source at `gates.yml:9` is blind without `fetch-depth: 0`.
2. **The regex has a regression-reachable miss.** Revert
   `test/ev41-retry-e2e.test.ts:325` to
   `// (c) Parent-turn falsifier — TUI branch (pty, via test/ev41-tui.py)`;
   run `bun test test/faux-provider-shape.test.ts`. Expected: test 6
   **green** — the card's premise, as a runnable check.
3. **Full-path derivation is strictly weaker.** Fixture
   `"const retired = 'ev40-harness/';"` (already at `:143`): current regex
   matches; a derivation emitting the deleted full path
   `test/ev40-harness/harness-headless.ts` does **not**. Expected: pass/pass
   — reduction must be to a fragment.
4. **Naive fragment rule over-matches.** Rule "shortest non-existent prefix"
   applied to `ev43/falsifier-headless.ts` → `ev43/`; scanning `TEST_DIR`
   with `/ev43\//` hits `test/ev43-reachability.test.ts:6` and `:52-53` while
   test 6 at HEAD is green. Expected: ≥1 hit → the rule is wrong; the narrow
   token is hand judgment. Raw evidence: `grep -n 'ev43/'
   test/ev43-reachability.test.ts`.
5. **Coverage police has genuine red-at-base.** Window = FLLWUP-49's parent
   SHA → HEAD; assert `derived ⊆ covered`; at base it reds naming
   `ev41-tui.py` (or its fragment), at head it is green. Satisfies
   `[[red-base evidence]]`.
6. **Zero new live arms.** `grep -c 'test('` over
   `ev40-headless`/`ev40-live-gates`/`ev41-retry-e2e`/`ev43-reachability` →
   3/5/5/2 and `ev41-seat-child-live` → 2, before and after; no new
   `spawnSync` of pi/pty (only a `git` argv, at most).
7. **Carve-out is a tested artifact, not an implicit regex.** Two-sided copy
   of `prose.test.ts:23`: `ev43/` in a synthetic source file is **not** a
   hit; `ev43/falsifier-headless.ts` **is**.
8. **Wrong-object guard.** `grep -n 'provider-token\|providerToken' test/` →
   no such list; test 6 is the only token list. Confirms the goal names
   `:124`.
9. **Rename-detection trap.** On the same window, compare
   `git log --diff-filter=D --no-renames --name-only` against
   `git log --diff-filter=DR --name-status`. Expected: identical retirement
   sets; if they differ, the design must pin the flag or it silently misses
   `git mv` retirements (the FLLWUP-49 case).

Tradeoffs stated plainly: (a) buys authority and CI-time visibility at the
cost of one `gates.yml` line and a shallow-history failure mode that must be
made loud; it also makes CI depend on git plumbing. (b)/(c) buy
shallow-independence at the cost of an exclusion list or a ledger whose
completeness is unverifiable in CI. Derivation-as-generation buys less hand
maintenance at the cost of making the "byte-stable" binding constraint
unenforceable.

### Step 3 — bounded exchange (round 2) — positions materially converged, one enumeration point open

Re-dispatched each generator with the other's round-1 position. Jobs: `owner`
`job-26.3` (7.8m, 7 turns), `principal` `job-26.4` (7.0m, 6 turns), both
settled `done`. Positions appended verbatim. On the mechanism axis the seats
**converged on derive-and-replace** (the principal withdrew P2-coverage
policing: "the regex is gone, so 'coverage policing' names a relation that no
longer has a right-hand side"; it retired its byte-provenance objection). The
remaining live divergence is the **enumeration source**: the owner's converged
shape kept `git log --all`; the principal argues HEAD-ancestry-only
(determinism) and says the difference is settled by a determinism test, not
taste. Round 3 (final under the ≤3-round cap) follows to close that point.

#### Round 2 — `owner` (job-26.3)

## Point-by-point engagement

**(i) CI shallow clone — I concede, and my round-1 guard as specified does not cover it.** Measured on a CI-style clone (`git clone --depth 1 --no-local` of this repo): `rev-list --count HEAD` = **1**, `.git/shallow` present, but `git log --all --pretty=format: --name-only` emits **33,035 bytes / 852 path lines — non-empty** (the grafted tip squash-commit's own diff), and `ev40-harness` lines = **0** vs **12** in the full repo. My round-1 guard said "empty or errored history is a named loud FAIL." The failure mode is not empty — it is **silent-partial**: the derived set contains whatever the tip commit touched and looks exactly like a healthy mechanism while missing every earlier retirement, including the one this witness exists to police. An empty-output check cannot fire on it. So the principal is right on both halves, and they are not alternatives: (a) the guard must test shallowness **structurally** — `.git/shallow` existence and/or a `rev-list --count` floor — not output emptiness; (b) `fetch-depth: 0` at `gates.yml:9` is still required, because a mechanism that loud-fails every CI run is an outage, not a witness. The guard's job is every *other* shallow context (archive clones, a future workflow edit); fetch-depth fixes the one we control. One procedural flag: the `gates.yml` line sits outside the card's recorded surface ("internal test machinery in `test/faux-provider-shape.test.ts` and at most adjacent test files") — that needs a recorded scope amendment, not a silent inclusion.

**(ii) Derivation relocates hand judgment — partially concede.** Measured: the only `ev43/` in the live scan domain (`test/ev43-reachability.test.ts:6`) is followed by a space — green under my path-shaped rule (dir token + continuation char). So the principal's claim-4 over-match defeats the *naive shortest-prefix* rule, not mine, and my derived set needs **no carve-out list today**: `ev43/` vs `ev43/falsifier` is defeated by a rule, not by an entry. But the principal's deeper point survives in narrowed form: for an *intentional* path-shaped mention of a retired path, the mechanism's only escape valve is "reword the comment" — a prose discipline, same as `prose.test.ts` forcing `features-deliver.md`. If a future contributor declines, the in-mechanism escape becomes a hand-maintained exclusion list — the decay relocated, exactly as stated. I accept that and pin it as declared discipline with a two-sided test, rather than claim list-freeness forever. The `--all` side-branch tradeoff stands as owned in round 1.

**(iii) P2 vs derive — I hold derive.** The blind-spot classes are *identical* (rename trap, shallowness, scan-domain gaps hit both mechanisms' shared enumeration). The differences are elsewhere. Under police, a **clean** retirement — no stale references — makes CI red until a human widens the regex under red pressure; that hand edit is the decay opportunity (late, wrong, or a future refactor deletes the "annoying" police test and leaves today's naked regex). Under derive, a clean retirement is green and requires nothing, and a stale reference reds at the retirement commit with token and file named; the future-protection the list buys ("token is in the list, so a later regression is caught") is provided statelessly. Once the pins land, I claim derive's silent-miss surface ⊆ police's. Police's one genuine advantage I won't hide: the hand regex is substrate-independent and keeps working where git is unfixably shallow, while derive loud-fails. I reject it as decisive because we own `gates.yml`.

**(iv) Fragment-vs-path — I concede the fixture and repair it mechanically.** `const retired = 'ev40-harness/';` does not red under my round-1 rule (the derived dir token is `test/ev40-harness/`, not bare `ev40-harness/`); the current regex reds. Round-1 principal claim 3 lands. But the reduction need not be hand-fragmented: emit **segment-aligned suffix fragments** of retired paths, each emitted only if it collides with no live path. Measured today: `harness-headless.ts` appears nowhere in `test/`+`smoke/` (emissable); bare `ev40-harness/` appears only in the self-excluded witness (emissable); basename `ev41-tui.py` collides with live `test/faux-provider/ev41-tui.py` (not emissable — live-path mentions stay green while the full retired path `test/ev41-tui.py` reds: the historical miss caught, the live path not false-positived). The residual honesty: the emission criterion sees live *paths*, not prose — a future prose mention of an emitted fragment reds and forces the same reword-or-carve-out choice as (ii). And the owned asymmetry stands: bare-dir whitespace mentions ("the retired ev40-harness/ family") are green under derive, red under today's regex — unpolicable by any mechanical rule, since the principal's own claim 4 proves raw `ev43/` policing reds legitimate prose.

## Converged shape

Derive-replace, upgraded from round 1 with: (1) `--no-renames` pinned enumeration; (2) structural shallow guard **plus** `fetch-depth: 0` in `gates.yml`, with a recorded card-scope amendment; (3) `retiredPathViolations` extended with segment-aligned, collision-checked fragment emission; (4) no carve-out list — the prose-discipline boundary pinned two-sided; (5) red-base falsifier in a worktree at FLLWUP-49's parent (red naming the `test/ev41-tui.py` fragment, green at head), satisfying the seven-field convention. **Open:** (a) the gates.yml scope amendment is procedural and sits with the facilitator/PO record; (b) whether the judge reads the owned bare-dir narrowing as inside the goal's "cannot silently create a miss" — I argue yes (the miss class the mechanism targets is resolvable-path references), but it is the judge's call, not mine to make.

**Tradeoffs accepted** — silent-partial failure mode fully conceded and closed with two independent measures; bare-dir prose and intentional full-path prose are unpolicable and pinned as named, tested boundaries rather than pretended away; derive loud-fails where police would degrade gracefully, accepted because CI is ours to configure; a `git` spawnSync and one CI-config line added, against the zero-new-live-arms constraint (no pi/pty arms).

**Testable claims**

1. **Shallow-partial (measured here, reproducible):** depth-1 `--no-local` clone → `rev-list --count HEAD` = 1, `.git/shallow` present, log output 33,035 bytes/852 lines, `ev40-harness` lines 0 (full repo: 948 commits, 12 lines). Proves the empty-check guard is insufficient.
2. **Rename trap (measured):** synthetic repo, `git mv old/x.py new/x.py`; `git log --name-only` default shows **only** `new/x.py` in the move commit; with `--no-renames`, both. My round-1 enumeration command verbatim would have been blind to pure-rename retirements — the pin is mandatory.
3. **Guard (updated):** with `.git/shallow` present (or rev-list count below floor), the witness fails with a named shallow-history error — never green.
4. **Fragment emission (new):** derived fragment set over real history + live tree contains `harness-headless.ts` and bare `ev40-harness/` but **not** `ev41-tui.py`; scratch source `const retired = 'ev40-harness/';` reds; scratch mentioning `test/faux-provider/ev41-tui.py` greens; scratch mentioning `test/ev41-tui.py` reds.
5. **Historical miss (unchanged):** `git show ca22360^:test/ev41-retry-e2e.test.ts` fed to the checker yields a violation naming `test/ev41-tui.py` — red-at-base at FLLWUP-49's parent, green at head.
6. **Current-regex regression blindness (I now adopt the principal's claim 2):** revert `ev41-retry-e2e.test.ts:325` to the retired token; `bun test test/faux-provider-shape.test.ts` is green on today's code — the card's premise, runnable.
7. **Zero new live arms:** diff touches only the witness + the one `gates.yml` line; arm counts 3/5/5/2 + 2 unchanged; only a `git` argv added to the existing spawn class.

#### Round 2 — `principal` (job-26.4)

**Grounding**: `vault/wiki/index.md` (no page covers this witness — nearest `test-suite-budget.md`, `smoke-test.md`); `test/faux-provider-shape.test.ts`; `.github/workflows/gates.yml`; `council/cards/FLLWUP-48.md:687-709`; `test/ev43-reachability.test.ts:6,52-53`; `.gitignore`. No bash/`git` tool in this seat, so I verified only the tree-side facts directly; history-side facts are cited from FLLWUP-48's record.

## Cross-seam reading

The tree-side half of the owner's green-at-head claim holds: I find no path-shaped occurrence of any of the three hand tokens under `test/`/`smoke/`, witness-excluded — the only `ev40-harness/` occurrences are `faux-provider-shape.test.ts:143,145` (the witness's own fixtures), and `ev43/` appears bare only as retirement prose (`ev43-reachability.test.ts:6`, followed by a space) plus the live provider id `ev43`/`ev43-model` (`:52-53`). The pre-fix miss text is independently on record at `FLLWUP-48.md:708` ("via test/ev41-tui.py"), so the historical-red premise is grounded in the repo, not memory. I could **not** verify the full 16-token derived set green at head without git — that remains Skeptic claim 1.

## Blind spots

- **Owner (inside the test file)**: sees the scan and the tokens; cannot see that the mechanism's *runtime substrate* (git history depth) is set by a file it doesn't touch — `gates.yml`. The mechanism's correctness is co-owned by a line outside its diff.
- **Principal (this seat)**: I can read the tree but not enumerate history here; every claim about the derived *set* is second-hand until Skeptic runs it.
- **Facilitator (card framing)**: recorded "not cross-seam … `test/faux-provider-shape.test.ts` (and at most adjacent test files)" — falsified below; the surface note excludes the one file the chosen mechanism depends on.

## Reframe

**The proposed design is sound in family; two mechanical corrections, no reframe of the approach.**

**(i) P2 adds nothing — conceded.** Under derive-and-replace the regex is gone, so "coverage policing" names a relation that no longer has a right-hand side. The only coverage the hand regex has that the derived rule lacks is bare-dir mention, and the owner's charter argument is correct and general: bare `d/` is the canonical *retirement-documentation* form (`ev43-reachability.test.ts:6` *is* that sentence), so it is mechanically indistinguishable from a stale mislead *for every token*, not just `ev43/`. A mechanism that preserves bare-dir coverage must carry a hand carve-out — the decay. I withdraw P2; the owner's narrowing is a correct boundary, not a weakening. One caveat I'd keep visible: it is correct *as an owned semantic choice*, and the owner has already test-pinned both sides (claim 4).

**(ii) Byte-provenance objection retired.** The orchestrator's constraint ("part of the mechanical mechanism, not a manual edit") targeted hand-widening. Removing the regex satisfies the constraint's *intent* more strongly than any byte-stable edit. There is no byte to have provenance for. Conceded.

**(iii) Claim 5's guard is broken as stated, and `fetch-depth: 0` is required, not optional.**

- At `depth=1`, `git log --all --pretty=format: --name-only` is **not empty** — it returns HEAD's tree. So an "empty/errored history → FAIL" guard **does not fire** and the witness passes while policing nothing. That is exactly the silent-miss signature this card exists to kill. The guard must detect *shallowness* (`git rev-parse --is-shallow-repository`) or, better, a **canary**: assert the derived set contains a known-irrevocable retirement (e.g. the `test/ev40-harness/` dir token or `ev41-tui.py`). The canary catches truncated histories that `--is-shallow-repository` misses, is environment-independent, and never needs updating (a retired path cannot un-retire) — a tripwire, not an allowlist.
- Loud-fail *alone* converts a silent miss into a permanently red gate; that is not a shippable card state. `fetch-depth: 0` at `gates.yml:9` is therefore **required for the mechanism to be shippable**. Owner's claim 6 ("diff touches only `test/faux-provider-shape.test.ts`") is falsified by the mechanism's own substrate: the diff is **two files**. The facilitator's surface note ("at most adjacent test files") is also wrong. Owner of the line: the implementing owner, same PR — not a follow-up card.
- Also verify claim 5's own boundary: `git rev-parse --is-shallow-repository` on a `--depth 1` clone → `true`; on full → `false`.

**(iv) `--all` is the wrong enumeration; the difference is test-settled, not judgment.** `--all` makes the token set a function of the *local ref set*: a developer with a stale branch containing a retired path gets a red CI does not reproduce (and vice versa). A gate whose verdict depends on which branches exist at run time is not deterministic. **HEAD-ancestry only** (`git log --pretty=format: --name-only HEAD`) is deterministic, and for a `pull_request` checkout (merge commit, ancestry includes base) it already contains main's retirements; the retirement-under-review is on the PR branch, hence in ancestry. No window base is needed, and I'd drop my round-1 "witness creation commit" pin too: full HEAD ancestry is deterministic *and* catches pre-witness stale comments that a window would miss, at zero false-red. The `--all` vs HEAD-ancestry difference is **settled by a determinism test**, not left to taste.

## Converged shape both seats can sign

`deriveRetiredTokens(historyPaths, currentPaths)` fed by **HEAD-ancestry** `git log --name-only` (no `--all`), path-shaped rule unchanged; a **canary** (derived set must contain `test/ev40-harness/` or `ev41-tui.py`) as the loud-fail; and `fetch-depth: 0` at `gates.yml:9`. Diff = two files. If the owner insists on `--all`, that is the one genuinely open item — and it should be defended against the determinism claim, not by "negligible false-red."

**Testable claims**

1. **Depth-1 nondeterminism (owner claim 5 falsifier)**: in `git clone --depth 1`, `git log --all --pretty=format: --name-only | sort -u` is **non-empty** (equals HEAD's tree) → an emptiness guard passes while the retired set is ∅. Expected: guard does not fire ⇒ claim 5 as written is wrong.
2. **Shallow detection**: `git rev-parse --is-shallow-repository` → `true` at depth 1, `false` at full. Both parse cleanly on the repo's git version.
3. **Canary**: with a truncated history whose base postdates FLLWUP-49's deletion, the canary (derived ∋ `ev41-tui.py`) reds; at full history it is green. Expected: red/green.
4. **`--all` environment-dependence**: create branch B with a path not on main; delete it; `git log --all --name-only` includes it, `git log --name-only HEAD` does not. Expected: `--all` superset ⇒ token set varies with ref set.
5. **HEAD-ancestry sufficiency at PR head**: on `refs/pull/N/merge`, `git log --pretty=format: --name-only HEAD` includes both branch and base retirements. Expected: no `--all` needed.
6. **Two-file diff (owner claim 6 falsifier)**: a shallow-repo CI run reds only after `gates.yml` gains `fetch-depth: 0`; grep `fetch-depth` at `gates.yml:9` is absent at base. Expected: mechanism unshippable without the line.
7. **`smoke/artifacts/` token existence**: `git log --all --name-only | grep -c '^smoke/artifacts/'` — `.gitignore` tracks `smoke/.artifacts/` (dot), so if this is `0`, the owner's narrative token list names a non-historical path (harmless to the mechanism, but correct the record).

### Step 3 (cont.) — round 3 (final; ≤3-round cap hit) — exchange CLOSED, converged

Re-dispatched each generator with the other's round-2 position. Jobs: `owner`
`job-26.5` (6.5m, 5 turns), `principal` `job-26.6` (5.4m, 9 turns), both
settled `done`. Positions appended verbatim. **Closed at 3 rounds with the
final converged shape both seats sign:**

- **Derive-and-replace**: `deriveRetiredTokens(historyPaths, currentPaths)`
  fed by **HEAD-ancestry** `git log --no-renames --pretty=format: --name-only
  HEAD` (`--all` retired by the determinism test — owner conceded point (A)
  after running it; the principal's argument: no mainline retirement can be
  missing from HEAD ancestry because AGENTS.md forbids main history
  rewriting, while `--all` makes the verdict a function of the local ref
  set).
- **Path-shaped rule + segment-aligned, collision-checked fragment emission**
  (collision universe = **all live tracked paths** via `git ls-tree -r HEAD`,
  not `test/`+`smoke/`); **scan domain stays `TEST_DIR` (test/ only)**
  byte-identical to today — the owner's round-1 "test/ + smoke/" phrase was a
  description error, corrected (the FLLWUP-55 `smoke/` extension is tests
  9–11 via `SMOKE_DRIVER`, never the token scan).
- **Composed loud-fail guard**: structural shallow check
  (`git rev-parse --is-shallow-repository` / rev-list floor) **OR**
  canary-missing → named loud FAIL; **canary asserted on the pre-suppression
  derived retired-path set** (must contain `test/ev40-harness/` and
  `test/ev41-tui.py`) — never on the fragment set (`ev41-tui.py` is
  collision-suppressed and unsatisfiable as a fragment canary); plus
  **`fetch-depth: 0` at `gates.yml:11`** (line number corrected by the
  principal — `:9` is `runs-on`, `:11` is the checkout step), same PR.
- **No carve-out list**; **three owned narrowings pinned two-sided**: bare-dir
  prose mention (green), bare basename of a relocated path (green), and
  intentional full-path prose mention (escape = reword, prose discipline).
- **Red-base falsifier** per the seven-field `[[red-base evidence]]`
  convention at FLLWUP-49's parent (red naming the `test/ev41-tui.py` full
  path), green at head.
- **Diff = two files**: `test/faux-provider-shape.test.ts` + one line at
  `gates.yml:11`, one PR.
- **Record correction** (owner round 3, claim 7 reversal): `smoke/artifacts/`
  (no dot) **is** a genuine historical retired dir token
  (`smoke/artifacts/.gitkeep` in HEAD ancestry, absent from the tree); the
  principal's `.gitignore` dot-dir reading didn't make it non-historical.
  Token kept.

Two residual items both seats assign onward, neither an inter-seat dispute:
(a) the `gates.yml` line's scope amendment — **facilitator record action,
taken below** (step-1 surface note amended; no ruling needed, it is a
bookkeeping correction of this container's own classification note); (b) the
judge's eventual reading of the three owned narrowings against the goal's
"cannot silently create a miss" — step-10 territory by construction (the
judge takes the goal + Skeptic evidence); both seats argue they are
resolvable-path out-of-scope, not misses, and neither holds a contrary
position, so there is no open-judgment dispute between seats to route.

#### Round 3 — `owner` (job-26.5)

**Grounding:** this round adds only measured evidence — `git log`/`ls-tree`
on the real repo (read-only, main checkout untouched), a synthetic repo in
`/tmp` for the determinism test, and a depth-1 `--no-local` clone. Wiki:
`vault/wiki/index.md` read; no page covers this witness (nearest
`test-suite-budget.md`, `smoke-test.md`); the seven-field convention is
`[[red-base evidence]]` and stays a requirement on the falsifier.

**(A) Enumeration — conceded. HEAD-ancestry wins, and it is settled by the
test, not by taste.** Ran the principal's claim-4 determinism test rather
than defending `--all`:

- Synthetic repo: a path that exists and is retired **only** on side branch B
  — `git log --all --name-only` contains it (**2** lines); `git log --name-only
  HEAD` does not (**0**). Delete branch B — same tree, `--all` now **0**. Same
  working tree, two different verdicts, decided solely by the local ref set.
  That is nondeterminism by construction; the round-1 "negligible false-red"
  is retired as an argument.
- On the real repo today the two sets happen to be identical (868 paths, 16
  retired tokens each, 0 side-only paths across 949 commits — the repo's
  merge discipline merges everything), so nothing green changes today. But
  the mechanism must not be correct *by accident of current ref hygiene*;
  106 refs exist locally and tomorrow's stale branch is the first
  nondeterministic red. HEAD-ancestry (`git log --pretty=format: --name-only
  HEAD`, `--no-renames` pinned) is also the *correct* semantics: "retired
  relative to the state under test." The round-1 tradeoff 3 is dropped
  entirely and the principal's converged shape adopted on this axis.

**(B) Guard — composed, taking the best of both.** The final guard is
**`(git rev-parse --is-shallow-repository) == true` OR `canary-missing` →
named loud FAIL**, two distinct messages, plus `fetch-depth: 0` at
`gates.yml:9` (owner's line number; the principal corrected to `:11` in its
round-3 — the principal's reading governs, see below). Measured: a depth-1
`--no-local` clone reports `is-shallow-repository: true` **and** yields an
empty HEAD-ancestry retired set — so on the CI failure mode we control,
*both* halves fire; the shallow check gives the precise diagnostic, the
canary covers the histories shallow-detection can't see (windowed fetches,
archive exports, a future workflow edit that truncates without shallowing).
One load-bearing detail the composition forces: **the canary checks the
derived retired-token set, not the emitted fragment set** — `test/ev41-tui.py`
is deliberately *not* emissable as a fragment (basename collides with live
`test/faux-provider/ev41-tui.py`), so a canary read off the fragment set
would red on a healthy mechanism. Canary content measured at HEAD:
`test/ev41-tui.py` retired ✓; `test/ev40-harness/` dir retired with all 3
historical files absent ✓. "A retired path cannot un-retire" holds at
full-path granularity (recreating the exact historical path is a
`tsc`-visible event, not a silent one).

**(C) Confirmed.** Fragment-emission (segment-aligned, collision-checked,
live-path-aware) and no-carve-out-list (prose-discipline boundary pinned
two-sided) both stand in the final shape, unchanged from round 2.

**(D) Closed.** Two-file diff (`test/faux-provider-shape.test.ts` + one line
at `gates.yml:9`→`:11`), same PR; the facilitator's step-1 surface-note
amendment removes the scope item flagged.

**One record correction — the principal's round-2 claim 7 lands the opposite
way.** `smoke/artifacts/` (no dot) **is** a historical path:
`smoke/artifacts/.gitkeep` is in HEAD ancestry and absent from the current
tree, so `smoke/artifacts/` is a genuine retired dir token and the round-1
narrative list was correct. (Separately, `smoke/.artifacts/.gitkeep` is
historical *and live* — correctly not a token.) The principal's `.gitignore`
reading was right about the dot-dir; the conclusion "non-historical" doesn't
follow, because both paths exist in history.

**Final converged shape (signature position):**
`deriveRetiredTokens(historyPaths, currentPaths)` fed by **HEAD-ancestry**
`git log --pretty=format: --name-only HEAD` with `--no-renames`; path-shaped
rule with segment-aligned collision-checked fragment emission; no carve-out
list; guard = is-shallow **OR** canary-missing (canary on the token set:
`test/ev41-tui.py` / `test/ev40-harness/`), both loud with named errors;
`fetch-depth: 0` at `gates.yml:11`. Diff = two files, one PR. Red-base
falsifier per the seven-field convention at FLLWUP-49's parent (red naming
the `test/ev41-tui.py` full path), green at head.

**Testable claims (new this round)**

1. **Determinism (settles A):** synthetic repo, side-branch-only retired path
   — `--all` 2 hits / HEAD 0 with branch present; `--all` 0 after branch
   deletion; HEAD constant 0. Verdict varies with ref set under `--all`,
   invariant under HEAD-ancestry.
2. **Today's equality is contingent, not relied on:** real repo, `comm -13`
   of the two enumerations = 0 lines; noted as context, not a design input.
3. **Composed guard fires twice on the CI mode:** depth-1 `--no-local` clone
   → `is-shallow-repository` true AND derived retired set ∅ → both guard
   halves red; full clone → both false/green.
4. **Canary/target-set boundary:** derived token set at HEAD contains
   `test/ev41-tui.py`; emitted fragment set does **not** — canary must read
   the former.
5. **Claim-7 reversal:** `grep -c '^smoke/artifacts/'` over HEAD-ancestry
   paths = **1** (`smoke/artifacts/.gitkeep`, absent from current tree) — the
   token is historical; the record keeps it.

Nothing remains open for the consolidator on the owner's side.

#### Round 3 — `principal` (job-26.6)

**Cross-seam reading** (files on both sides of the seam, at HEAD)

- The token contract lives at `test/faux-provider-shape.test.ts:124`:
  `countMatches(TEST_DIR, /ev40-harness\/|ev43\/falsifier|ev43\/ev43-falsifier/)`,
  with `TEST_DIR = join(REPO_ROOT, "test")` (`:24`). **Test 6 scans `test/`
  only.** The FLLWUP-55 `smoke/` charter extension is tests 9–11 via
  `SMOKE_DRIVER` (`:53`); it never touches the token scan. The owner's
  round-1 phrase "reuses the witness's post-FLLWUP-55 scan domain (`test/` +
  `smoke/`)" is not what the file does — a description error, not a proposed
  widening; resolution in (D) below.
- The CI substrate is `.github/workflows/gates.yml`. The checkout step is
  **line 11** (`- uses: actions/checkout@v4`); **line 9 is `runs-on:
  ubuntu-latest`**. Both seats, the card's converged shape, and the
  scope-amendment request cite `gates.yml:9` for the `fetch-depth` addition.
  Acting on `:9` would break the job. Correct the citation to `:11`.
- Tree side: `test/ev40-harness/` absent; `harness-headless.ts` absent
  repo-wide; `test/faux-provider/ev41-tui.py` live (the basename collision is
  real); `test/ev41-retry-e2e.test.ts:325` currently names the live path; the
  only bare `ev43/` in the scan domain is `test/ev43-reachability.test.ts:6`,
  space-followed, plus live provider ids at `:52–53`. The owner's round-2
  tree facts hold.
- Wiki: `vault/wiki/index.md` has no page for this witness (nearest
  `test-suite-budget.md`, `red-base-evidence.md`); the durable-page note
  stands.

**Blind spots, named separately**

- *Owner, inside the witness*: sees the regex, the scan, and the fixtures.
  Cannot see that test 6's actual scan domain is `test/`-only while its own
  prose says `test/`+`smoke/`; cannot see that the enumeration's verdict
  depends on the run-time ref set; cannot enumerate collisions without git.
- *This seat (history vantage)*: reads the tree, not history; every
  derived-set claim stays second-hand until the skeptic runs it.
- *CI vantage*: the depth-1 default and `.git/shallow` are visible from the
  workflow, but the `--all` local-ref dependence is invisible from a single
  machine.
- *Card framing*: "provider-token list" names retired *path* tokens; and the
  recorded surface excludes the one CI file the mechanism's correctness
  depends on.

**Reframe** — the family is settled; no new reframe is earned. Closing the
four points:

(A) **HEAD-ancestry wins; `--all` is retired.** The owner held `--all` "as
owned," which is a stance, not evidence. The burden was a runnable test
showing a *mainline* retirement that HEAD-ancestry misses — and none can
exist: AGENTS.md forbids history rewriting on `main`, so every path ever in
main's history is in HEAD's ancestry. `--all` adds only side-branch-only
paths, which are not mainline retirements and make the gate's verdict a
function of the local ref set. A determinism test settles it; no
counter-evidence was produced. **Enumeration = `git log --no-renames
--pretty=format: --name-only HEAD`.**

(B) **The two guards compose; canary is primary.** Structural shallow check
(`.git/shallow`, and a `rev-list --count` floor as a secondary) catches
truncation with a clear diagnostic; the canary catches the deeper class —
history present but the retirement absent (grafted/partial, `git replace`, a
future `fetch-depth` edit). Composition detail that matters: **the canary
must assert on the derived retired-path set, before fragment emission.**
`ev41-tui.py` is collision-suppressed from the fragment set, so a canary
written against fragments would be unsatisfiable. Assert `derivedRetiredPaths
∋ {test/ev40-harness/, test/ev41-tui.py}`.

(C) **The round-1 window base is fully retired.** Confirmed: HEAD-ancestry at
full depth is deterministic and catches pre-witness stale comments a window
would exclude, at zero false-red. No window base.

(D) **Fragment emission: one correction, one added named boundary, both
testifyable.**

- *Correction*: the scan domain stays `TEST_DIR` (`test/`-only),
  byte-identical to today. Widening test 6 to `smoke/` is an unrequested
  coverage change and would itself need a red-base check. The
  collision/suppression universe, by contrast, should be **all live tracked
  paths** (`git ls-tree -r HEAD --name-only`), not `test/`+`smoke/` —
  otherwise a live basename living outside those two dirs fails to suppress a
  fragment and a legitimate live-path mention in `test/` false-reds.
- *Added boundary (parallel to the owned bare-dir one)*: a **bare basename of
  a relocated path** (`ev41-tui.py`, no directory) is unpoliced because the
  live `test/faux-provider/ev41-tui.py` suppresses it. Same ambiguity class
  as bare-dir prose: a non-resolvable mention. Named as a third owned
  narrowing and pinned two-sided (bare green / `test/ev41-tui.py` red / live
  full path green). Optional strictness the owner may take or decline (not
  blocked on it): emit the fragment but exempt its occurrence when preceded
  by the live path — an enhancement, not parity.

**Converged shape both seats can sign**

Derive-replace: `deriveRetiredTokens(historyPaths, currentPaths)` fed by
HEAD-ancestry, `--no-renames` pinned; path-shaped rule with segment-aligned,
live-path-collision-checked fragment emission; scan domain = `TEST_DIR`
(unchanged); canary (pre-suppression) primary plus structural shallow check;
`fetch-depth: 0` added at **`gates.yml:11`** under a recorded scope
amendment; the full fragment set green-at-head, red-at-base at FLLWUP-49's
parent naming the `test/ev41-tui.py` full path; no carve-out list — the three
named narrowings (bare-dir, bare-basename-of-relocated-path, intentional
full-path prose) pinned two-sided. Diff = two files.

**Testable claims (new/changed only)**

1. **Scan domain is `test/`-only** — `grep -n actions/checkout
   .github/workflows/gates.yml` → `11`; and `faux-provider-shape.test.ts:124`
   passes `TEST_DIR`. Insert `ev40-harness/` into a scratch `smoke/` source
   and `bun test test/faux-provider-shape.test.ts` stays green (test 6 does
   not read `smoke/`).
2. **Enumeration nondeterminism** — create branch B with path
   `test/zzz-retired.test.ts` not on `main`; delete it on B. `git log --all
   --name-only | grep -c '^test/zzz-retired.test.ts$'` = 1; `git log --name-only
   HEAD | grep -c '^test/zzz-retired.test.ts$'` = 0. ⇒ `--all` token set
   varies with the local ref set.
3. **Canary pre-suppression** — over real history+tree,
   `derivedRetiredPaths` contains `test/ev40-harness/` and
   `test/ev41-tui.py`; the *emitted fragment* set does **not** contain
   `ev41-tui.py` (live collision) but does contain `harness-headless.ts` and
   bare `ev40-harness/`. A fragment-based canary on `ev41-tui.py` is
   therefore unsatisfiable.
4. **Full fragment set green-at-head** —
   `retiredPathViolations(src, fullFragmentSet)` over the real `test/` scan
   domain yields `[]` today; fed `git show ca22360^:test/ev41-retry-e2e.test.ts`
   it reds naming the `test/ev41-tui.py` full path. (Round-1 claim 1 covered
   only the path rule; this is the fragment rule's half.)
5. **Bare-basename narrowing** — scratch mentioning bare `ev41-tui.py` →
   green (characterized boundary); `test/ev41-tui.py` → red;
   `test/faux-provider/ev41-tui.py` → green.

**Remaining open for the consolidator**: (a) the `gates.yml` scope amendment
is procedural and sits with the facilitator/PO record — with the corrected
line number `:11`; (b) the judge's reading of the three owned narrowings
against the goal's "cannot silently create a miss" (both seats argue they are
resolvable-path out-of-scope, not misses).

### Step-1 record amendment (facilitator, bookkeeping — surface note corrected)

The step-1 note "internal test machinery in `test/faux-provider-shape.test.ts`
(and at most adjacent test files)" is amended per the deliberation: the
deliverable's diff is **two files** — `test/faux-provider-shape.test.ts` plus
one line at `.github/workflows/gates.yml:11` (`fetch-depth: 0` on the
checkout step), same PR. The principal's round-3 falsified the original note
(and its `:9` line-number guess at `runs-on`); the mechanism's correctness is
co-owned by the CI checkout depth. Classification itself unchanged: still
full-council, still not surface-touching (CI workflow depth is not a
person-visible surface). Recorded here rather than re-opening step 1; no
ruling required — this corrects this container's own classification prose.

### Step 4 — Skeptic attacks and runs tests (`job-26.7`)

`skeptic` (5.8m, 20 turns) built the signed mechanism faithfully in /tmp and
ran every claim plus blind-spot attacks. Full report below. **Facilitator
transcription (counting only): ten objections — six `closed-green` (O3–O8,
O10), three `closed-red` (O1, O2, O9 — all spec/record defects, all
"amendable, not mechanism-death" per the skeptic), and one `open-untested`
(live reproduction of `git replace`/grafted/archive histories — canary design
verified sound against the real token set). Verdict: blocks, two items.**

- **O1 (`closed-red`)** — the recorded red-base falsifier's base is
  misidentified: FLLWUP-49's parent `fce0ecb` predates the retirement
  (`test/ev41-tui.py` live, `test/ev40-harness/` 3 live files) → 0
  violations, no red. The red fires at the FLLWUP-49 mechanism merge
  `323abdc` itself: violations `test/ev41-retry-e2e.test.ts ('frag',
  'test/ev41-tui.py')` + `test/ev43-reachability.test.ts ('frag','ev43/')`.
  Re-identify the base as `323abdc` (or `a420940`/`f12f3be`) and state the
  transplant caveat. Record defect, not mechanism defect.
- **O2 (`closed-red`)** — the signed fragment rule is jointly unsatisfiable
  with green-at-head and the record's own two-sided nibbles: with collision
  universe = all live tracked paths, bare `ev43/` is emitted (0 collisions)
  and plain-substring-matches `test/ev43-reachability.test.ts:6` ("the
  retired ev43/ scratch extension") → **1 violation at HEAD** (first CI run
  red). With dir-tokens-only matching (continuation-char rule), HEAD is
  green but the owner's fixture claim — scratch `const retired =
  'ev40-harness/';` reds — goes GREEN (apostrophe is not a continuation
  char). No single stated rule satisfies both; only the content-aware
  emission universe the principal's round-3 rejected fits both, and that
  re-introduces mention-driven decay.
- **O9 (`closed-red`)** — bare `ev40-harness/` is not derivable from the
  stated rules (ancestor dirs are `test/` and `test/ev40-harness/`; a
  root-level `ev40-harness/` never existed in 868 historical paths); emitting
  it requires an unstated dir-suffix rule, which then forces the O2
  inconsistency on `ev43/`. Claim 3's "contains bare `ev40-harness/`" is
  false under the signed derivation.
- **O3–O8, O10 (`closed-green`)** — shallow-partial failure mode confirmed
  (emptiness guard cannot fire; structural + canary + `fetch-depth: 0`
  justified); enumeration determinism confirmed (`--all` verdict varies with
  ref set, HEAD-ancestry invariant; today's equality contingent); rename trap
  confirmed; historical-miss red confirmed (`ca22360^` = `5ac7ea1` carries
  the pre-fix text; checker reds naming `('frag','test/ev41-tui.py')`);
  regression-blindness premise confirmed (reverting `:325` → real suite
  **12 pass / 0 fail**); scan domain test/-only confirmed; canary
  pre-suppression confirmed (token set has both targets; fragment set
  suppresses `ev41-tui.py` — fragment canary unsatisfiable); zero-new-arms
  green on what is runnable.
- **Record corrections (non-blocking):** `smoke/artifacts/` grep count is 2
  not 1 (1 unique path — token historicity holds); "16 retired files" = 16
  including a retired `council/__pycache__/validate.cpython-314.pyc` — **15
  non-bytecode tokens** (the design excludes bytecode); 868 paths ✓;
  `gates.yml:11` ✓; `ca22360^` = `5ac7ea1` ✓; note that FLLWUP-48's merged
  commit `1cf907f` is *not* in the FLLWUP-49 branch-line ancestry (why the
  pre-fix comment survives at `fce0ecb`) — recorded so the corrected base
  doesn't get "re-fixed" into another wrong sha.
- **Blind spots:** `git replace`/grafted/archive-export histories —
  `open-untested` as live reproduction (not cheaply runnable), canary design
  verified sound against the real token set (any truncated history loses
  both canary targets and trips loudly). Witness self-exclusion under the
  new design — `closed-green` by code read; casualty noted: the FLLWUP-48
  scan-domain test's fixture (`'ev40-harness/';`) stops redding under any
  consistent rule and must be re-fixture'd by the implementation.

**Step-4 result: the converged design as signed carries two blocking closed-red
defects (O1, O2/O9).** Both are spec-level, with the discriminating probes
already run. Step 5 consolidator next.

#### skeptic — step 4 (`job-26.7`) — verbatim

## Skeptic report — FLLWUP-59 (full council, step 4)

I read the card in full, built the mechanism faithful to the signed spec in
/tmp, and ran every claim plus the blind-spot attacks. Two blocking
objections, both settled by runs.

### Objections

**O1 — The recorded red-base falsifier's base is misidentified (the claimed
red cannot fire there).** The converged shape's seven-field base is
"FLLWUP-49's parent" = `fce0ecb` (`323abdc^`). At that tree,
`test/ev41-tui.py` is **live** (1 tree hit) and `test/ev40-harness/` still
has 3 live files — the retirement the falsifier is priced on had not happened
yet. Derived retired-set at `fce0ecb` contains no `test/ev41-tui.py`;
violations over the scan domain = **0**. The red does fire — at the FLLWUP-49
mechanism merge `323abdc` itself: violations
`[test/ev41-retry-e2e.test.ts ('frag','test/ev41-tui.py'),
test/ev43-reachability.test.ts ('frag','ev43/')]`. The record must
re-identify the base as `323abdc` (or `a420940`/`f12f3be`) and re-state the
selection rule; at `fce0ecb` the transplant also lacks the entire
`test/faux-provider/` station, which the record never stated (convention
field 5/6 violation). The *mechanism* is fine; the *recorded evidence* is
invalid as written. Status: **closed-red** (record defect — the falsifier at
the stated base produces no red).

**O2 — Green-at-head for the signed fragment rule fails; the record's own
two-sided nibbles are jointly unsatisfiable as signed.** Under the round-3
signed emission spec (segment-aligned suffix fragments + bare dir fragments,
collision universe = all live tracked paths via `ls-tree`), bare `ev43/` has
**0 live-path collisions** → emitted → plain-substring match on
`test/ev43-reachability.test.ts:6` ("the retired ev43/ scratch extension") →
**1 violation at HEAD**. This is exactly the naive over-match the record
claims is "defeated by a rule." The alternative matching (dir tokens only via
the continuation-char rule) gives 0 violations at HEAD but leaves the owner's
own fixture claim — scratch `const retired = 'ev40-harness/';` **reds** —
**GREEN** (apostrophe is not `[A-Za-z0-9_]`). No single rule instantiation
satisfies the record's claims jointly; only a *content-aware* emission
universe (owner's round-2 measurement language: "appears only in the
self-excluded witness (emissable)") fits — the exact universe the principal's
round-3 correction rejected, and which re-introduces the mention-driven decay
the card exists to kill. Status: **closed-red** (design-as-signed, first CI
run would be red on `:6`).

**O3 — Shallow-partial failure mode (claim 2)** — **closed-green** (claim
holds): depth-1 `--no-local` clone → `rev-list --count HEAD` = 1,
`is-shallow-repository` = true, `.git/shallow` present, `log --all` non-empty
(33,035 B / 852 lines), `ev40-harness` lines 0, HEAD-ancestry retired set ∅.
The emptiness guard cannot fire; the structural check + canary composition is
justified, and `fetch-depth: 0` is required.

**O4 — Enumeration determinism (claim 1)** — **closed-green**: synthetic
side-branch-only retired path, measured at the *main* tip: `--all`=2 / HEAD=0
with branch present; `--all`=0 / HEAD=0 after branch deletion. Verdict varies
with ref set under `--all`, invariant under HEAD-ancestry. Real repo
`comm -13` (HEAD vs `--all`) = 0 today — the equality is real but contingent.

**O5 — Rename trap (claim 8)** — **closed-green**: synthetic
`git mv old/x.py new/x.py` — default `log --name-only` shows only
`new/x.py`; `--no-renames` shows both. The pin is mandatory.

**O6 — Historical-miss red (claim 5a)** — **closed-green**: `ca22360` exists,
its parent (`5ac7ea1`) carries the pre-fix `:325` text, and feeding that
content to the checker with today's tokens yields exactly 1 violation naming
the `test/ev41-tui.py` fragment — the mechanism would have caught FLLWUP-48's
actual miss.

**O7 — Regression-blindness premise (claim 5b)** — **closed-green**: reverting
`:325` to `via test/ev41-tui.py` in a HEAD worktree and running the real
suite: **12 pass / 0 fail** — today's regex cannot detect a regression of its
own known miss.

**O8 — Scan domain, canary, gates line (claims 3, 6, 9)** — **closed-green**,
two record drifts: `:124` passes `TEST_DIR`; scratch `smoke/` file carrying a
retired full path → witness still **12 pass / 0 fail** (test 6 never reads
`smoke/`); `grep -n actions/checkout → 11` (line 9 is `runs-on` — the
record's correction is right); canary targets both present in the
*pre-suppression* token set (`test/ev41-tui.py` ✓, `test/ev40-harness/` dir ✓)
while the emitted fragment set contains `harness-headless.ts` ✓ but **not**
`ev41-tui.py` ✓ (live `test/faux-provider/ev41-tui.py` suppresses it — a
fragment canary on `ev41-tui.py` would indeed be unsatisfiable). Drifts:
owner's verbatim `grep -c '^smoke/artifacts/'` = **2** (path touched at 2
commits), not 1 — `sort -u` gives the 1 unique path, so the token's
historicity holds; "16 retired files" = 16 *including* the retired
`council/__pycache__/validate.cpython-314.pyc` — 15 non-bytecode tokens (the
design excludes bytecode). Both non-blocking.

**O9 — "Bare `ev40-harness/`" is not derivable from the stated rules.**
Ancestor dirs of the retired files are `test/` and `test/ev40-harness/`; a
root-level `ev40-harness/` never existed in 868 historical paths, so no
suffix/ancestor rule emits it. Emitting it (per claim 3/4) requires an
unstated dir-suffix rule, which then forces the O2 inconsistency on `ev43/`.
Status: **closed-red** (claim 3's "contains … bare `ev40-harness/`" is false
under the signed derivation; record/spec contradiction).

**O10 — Zero-new-live-arms (claim 10)** — **closed-green** on what is
runnable pre-implementation: arm counts 3/5/5/2 + 2 verified; the only spawn
in the file is the benign `python3` `spawnSync` (test 8); the design statement
adds only a `git` argv, no pi/pty spawn. The two-file diff (`gates.yml:11`) is
prospective — design-consistent, not runnable yet.

**Blind spots the seats didn't claim** — `git replace`/grafted/archive-export
histories: **open-untested** as a live reproduction (not cheaply runnable
here), but the canary's design is verified sound against the real token set —
any truncated history loses `test/ev41-tui.py`/`test/ev40-harness/` from the
derived set and trips the canary loudly. Witness self-exclusion under the new
design: **closed-green** by code read — the `endsWith(WITNESS)` exclusion is
unchanged, its fixture tokens stay inside the excluded file, and the scratch
`.pyc`/dir tests write under `mkdtemp` outside `test/`; the one casualty is
the FLLWUP-48 scan-domain test's *fixture* (`'ev40-harness/';` stops redding
— see O2), which the implementation must re-fixture.

### What I ran (real output, verbatim where decisive)

- **O1 base check** — `git worktree add --detach /tmp/fllwup59-wt-base
  fce0ecb`; `git ls-tree -r fce0ecb | grep -c '^test/ev41-tui.py$'` → `1`;
  `...test/ev40-harness/` → `3`; `REPO=<wt> python3 /tmp/fllwup59/checker.py
  A` → `retired_files: 8 / dir_tokens: ['smoke/artifacts/'] /
  green-at-head violations: 0`. Same command in the `323abdc` worktree →
  `retired_files: 15`, violations list:
  `test/ev41-retry-e2e.test.ts ('frag', 'test/ev41-tui.py')` /
  `test/ev43-reachability.test.ts ('frag', 'ev43/')`.
- **O2** — checker over HEAD: `green-at-head violations: 1 →
  test/ev43-reachability.test.ts ('frag','ev43/')`. Nibble probes (variant
  A): `fixture 'ev40-harness/;'` → GREEN; `"the retired ev43/ scratch
  extension"` → RED; `"see ev43/falsifier-headless.ts"` → RED;
  `"test/faux-provider/ev41-tui.py"` → GREEN; `"via test/ev41-tui.py"` → RED.
  Variant B: `fixture 'ev40-harness/;'` → GREEN (owner claims RED); HEAD
  violations → `[]`.
- **O3** — `git clone --depth 1 --no-local … /tmp/fllwup59-shallow` →
  `rev-list --count HEAD: 1 / is-shallow: true / .git/shallow: yes /
  log --all 33035B 852 lines / ev40-harness lines: 0 / HEAD-ancestry retired
  set: 0`.
- **O4** — synthetic repo, measured at main tip: `--all: 2 HEAD: 0`; after
  `git branch -D B`: `--all: 0 HEAD: 0`. Real repo `comm -13 HEAD-vs--all` =
  `0`.
- **O5** — synthetic: default log rename commit shows only `new/x.py`;
  `--no-renames` shows `new/x.py` + `old/x.py`.
- **O6** — `git show ca22360^:test/ev41-retry-e2e.test.ts | sed -n 325p` →
  `// (c) Parent-turn falsifier — TUI branch (pty, via test/ev41-tui.py)`;
  checker on that content → `1 violation, naming ('frag','test/ev41-tui.py')`.
- **O7** — reverted `:325` in a detached HEAD worktree; `bun test
  test/faux-provider-shape.test.ts` → `12 pass / 0 fail` (test 6 green).
- **O8** — `grep -n actions/checkout .github/workflows/gates.yml` →
  `11: - uses: actions/checkout@v4`; scratch `smoke/scratch-skeptic.test.ts`
  containing `test/ev40-harness/ev41-tui.py` → witness `12 pass / 0 fail`;
  `grep -c '^smoke/artifacts/'` (HEAD-ancestry) → `2`, `sort -u` → 1 path
  (`smoke/artifacts/.gitkeep`); historical unique paths = 868; retired files
  16 incl. / 15 excl. bytecode.
- **O10** — `grep -c '^\s*test('` → ev40-headless 3, ev40-live-gates 5,
  ev41-retry-e2e 5, ev43-reachability 2, ev41-seat-child-live 2.

All worktrees removed; main checkout untouched (read-only commands only).

### Verdict — **blocks**

Two items block; both are amendable specs, not mechanism-death:

1. **Red-base falsifier base identity (O1)**: `fce0ecb` yields 0 violations —
   the seven-field record as stated is void. Must re-identify the base as the
   FLLWUP-49 mechanism merge `323abdc` (or `a420940`/`f12f3be`), where the
   red names the token — and state the transplant's missing-station caveat if
   the parent is retained for any other purpose.
2. **Fragment-rule green-at-head + nibble set (O2/O9)**: as signed
   (path-only collision universe), bare `ev43/` is emitted and reds
   `ev43-reachability.test.ts:6` — the first CI run of the implemented
   witness is red, and the record simultaneously claims the `'ev40-harness/';`
   fixture reds, which no single matching rule permits. The seats must
   reconcile the collision universe (path-only vs the content-aware form the
   owner actually measured) and re-pin the two-sided fixtures to one
   consistent rule before implementation; until then, both "green-at-head"
   (both seats' central claim) and the fixture tripwire are false as written.

Record corrections (non-blocking): `smoke/artifacts/` count is 2 not 1 (1
unique path); the 4th "retired file" is a bytecode path the design excludes
(15 tokens); `868` paths ✓; `gates.yml:11` ✓ as already corrected in the
record; `ca22360^` = `5ac7ea1` confirmed as the pre-fix tree; FLLWUP-48's
merged commit `1cf907f` is *not* in the FLLWUP-49 branch-line ancestry, which
is why the pre-fix comment survives at `fce0ecb` — worth a one-line note so
the corrected base doesn't get "fixed" by future readers into another wrong
sha.

### Step 5 — synthesis (`job-26.8`)

`consolidator` settled `done` (1.1m, 3 turns). Verbatim synthesis below.
**Facilitator transcription (counting only, deciding nothing):** the sort is
— settled: seven closed-green objections (O3–O8, O10) each with the test that
closed it, plus four non-blocking record corrections; **open judgment: none**
(defended from the record: no seat holds a position against another on any
values question; both blocking closed-red defects are mechanically
constrained); open objections: the `git replace`/grafted/archive-export
`open-untested` blind spot — carried as a named limitation (canary verified
sound against the real token set; loud, not silent). On O2/O9 the
consolidator's constraint finding: content-aware emission is ruled out by the
seats' own anti-decay convergence (owner round 2, principal round 2); plain
substring for bare dir tokens is ruled out at HEAD (skeptic's run);
continuation-char matching with the *old* fixture is ruled out by the fixture
claim — the escape is the skeptic's own noted re-fixture of the FLLWUP-48
scan-domain test to a full retired path. Classified (iii): an
implementation-detail step 7's spec must pin and step 9's skeptic verifies.

#### consolidator — step 5 (`job-26.8`) — verbatim

## FLLWUP-59 — Consolidation

### Agreed design (all seats converged)

The seats converged on **derive-and-replace**: delete the hand-maintained
token regex; replace it with `deriveRetiredTokens(historyPaths, currentPaths)`
fed by `git log --no-renames --pretty=format: --name-only HEAD`
(HEAD-ancestry, not `--all`); emit segment-aligned, live-path-collision-checked
fragment tokens; scan domain stays `TEST_DIR` (`test/`-only); no carve-out
list; three owned narrowings (bare-dir prose, bare-basename-of-relocated,
intentional full-path prose) pinned two-sided; composed loud-fail guard
(structural shallow check OR canary-missing → named FAIL); `fetch-depth: 0`
at `gates.yml:11`, same PR; diff = two files.

All seats and the Skeptic agree this direction is correct.

### Settled disputes (closed by Skeptic tests that ran)

| # | Objection | Test/result | What it settled |
|---|-----------|------------|-----------------|
| **O3** | Shallow-partial failure mode | depth-1 clone → count 1, is-shallow true, log non-empty, retired set ∅ | Emptiness guard insufficient; structural check + canary + `fetch-depth: 0` justified. |
| **O4** | Enumeration determinism | `--all` varies with ref set; HEAD-ancestry invariant | `--all` retired. |
| **O5** | Rename trap | default log misses `git mv`; `--no-renames` catches it | Pin mandatory. |
| **O6** | Historical-miss red | `ca22360^` content → 1 violation naming `test/ev41-tui.py` | Mechanism catches FLLWUP-48's actual miss. |
| **O7** | Regression-blindness premise | Revert `:325` → 12 pass / 0 fail | Premise confirmed. |
| **O8** | Scan domain, canary, gates line | all confirmed; two record drifts non-blocking | Confirmed. |
| **O10** | Zero-new-live-arms | arm counts verified; only `git` argv added | Constraint satisfied. |

**Record corrections (all non-blocking):** `smoke/artifacts/` count 2 (1
unique path); 16 retired files include 1 bytecode path — 15 non-bytecode
tokens; 868 paths ✓; `gates.yml:11` ✓; `ca22360^` = `5ac7ea1` ✓; `1cf907f`
not in FLLWUP-49 branch-line ancestry (why the pre-fix comment survives at
`fce0ecb`).

### Open judgment — for `product-owner`, escalating to `steward`

**None.** No seat holds a position against another seat's position on any
values or tradeoff question. The two blocking defects (O1, O2/O9) are
spec/record defects where the seats' own signed arguments and the Skeptic's
runs constrain the resolution mechanically — they are not taste disputes.

### Open objections

**O1 — red-base falsifier base identity (`closed-red`, blocking, mechanically
resolvable).** The defect: base `fce0ecb` predates the retirement → 0
violations, no red. The red fires at `323abdc` (FLLWUP-49 mechanism merge).
Constraint: mechanically determined — re-identify to `323abdc` (or
`a420940`/`f12f3be`), state the transplant caveat (at `323abdc` the entire
`test/faux-provider/` station is absent — convention fields 5/6). No judgment
required — step 7's spec pins the SHA and states the caveat.

**O2/O9 — fragment-rule emission/matching universe jointly unsatisfiable as
signed (`closed-red`, blocking, constrained with one implementation choice).**
Three combinations tested:

| Universe | Matching | HEAD result | Owner's fixture | Verdict |
|----------|----------|-------------|-----------------|---------|
| All live tracked paths | Plain substring | RED on `ev43-reachability.test.ts:6` | RED | HEAD green fails |
| All live tracked paths | Dir-tokens + continuation char | GREEN | GREEN (old fixture) | Fixture claim fails |
| Content-aware | Plain substring | GREEN | RED | Reintroduces mention-driven decay |

Ruled out by the record: content-aware emission (both seats' anti-decay
convergence); continuation-char matching *with the old fixture* (the skeptic's
noted re-fixture is the escape); plain substring without prose handling (HEAD
red). Remaining choice is **(iii) an implementation-detail that step 7's spec
must pin and step 9's Skeptic will verify** — not (ii) open judgment: the
seats do not disagree on which rule; both accept prose discipline as the
boundary; the implementer chooses among the remaining consistent rules under
the recorded constraints.

**Open-untested — `git replace`/grafted/archive-export histories.** Acceptable
as a named limitation: canary design verified sound against the real token
set (any truncated history loses both targets and trips loudly). Carry as a
named limitation; flag for a later harness-hardening card if one exists.

### Ready to hand off?

Yes — but **no open judgment items remain for `product-owner` to rule on; no
escalation to `steward` is needed.** O1 re-identification and the O2/O9 rule
pinning are step-7 spec actions; the scope amendment is recorded; the
`open-untested` blind spot is a named limitation.

### Step 6 — routing (facilitator)

The consolidator sorted **zero open-judgment items and zero open objections
requiring a ruling seat**. Nothing routes to `product-owner` (and this
container could not dispatch it anyway per `<escalation_contract>`); nothing
goes `Needs Human`. The two blocking closed-red defects are settled facts
whose repairs are mechanically constrained — they are incorporated as spec
requirements at step 7, and step 9's skeptic verifies against them. The
`open-untested` blind spot carries as a named design limitation guarded by
the canary (consolidator's finding, per the record; it is a step-4
deliberation blind spot, not a step-9 residual — if it still stands at step
9's exit it is routed per `<step_9_iteration_cap>`). The card proceeds to
step 7 with no state change here (still `Deliberating`; step 7's opening
writes `In Progress`).

### Step 7 — spec written and handed to one owner

Spec: `docs/superpowers/specs/2026-09-18-FLLWUP-59-design.md` (full-council
path — writes up the settled design, does not derive one). Self-review before
committing: no placeholder text (the wiki page's file name is bounded
discretion, not an open choice); internally consistent with steps 2–6 and
both skeptic corrections (O1 base re-identification pinned to `323abdc` with
the transplant caveats; O2/O9 emission/matching rule pinned to the one
consistent family the recorded constraints leave); scope bounded to the
card's `goal` plus the step-1-recorded scope amendment (gates.yml `:11`) and
the both-seats-endorsed wiki page; §9 names what is out of scope; an owner
reading only this file cannot reasonably reach two different designs (the
emission/matching clauses each cite the measured result that forces them).
Card set `In Progress`; board moved; `validate.py` clean before the owner
dispatch. Owner dispatched next (step 8) with the spec, the fresh-worktree
constraint, and the full gate set.

### Step 8 — owner implemented (`job-26.9`, PR #76)

`owner` settled `done` (27.6m, 42 turns). Observed artifacts (facilitator-
verified, not taken from the seat report): **PR #76 open** at
`https://github.com/jumpseat-inc/pi-council/pull/76`, branch
`fllwup59-derived-token-set`, head SHA `6579d683a5df46f726870f7bb2f1b33897a36e41`;
changed files `gh pr view 76 --json files`: `.github/workflows/gates.yml`,
`docs/superpowers/plans/2026-09-18-FLLWUP-59-derived-token-set.md`,
`test/faux-provider-shape.test.ts`, `vault/wiki/index.md`,
`vault/wiki/retired-path-tokens.md`. **State set `In Progress`→`In Review` on
the sole step-8 condition: a branch exists with an open PR.** Owner-reported
gate evidence (subject to step-9 verification): tsc clean; `bun test`
940 pass / 2 skip / 0 fail (81 files, 102.7s); validate.py clean; preflight
PASS. §8 acceptance evidence in the PR body, including the headline
regression catch (`:325` reverted → test 6 red naming `test/ev41-tui.py`;
restored → green), red-base at `323abdc` (transplanted witness: test 6 red
mechanism-absent; test 9 fail is the recorded transplant caveat), shallow and
canary loud-fails, re-fixture two-sided, zero-new-arms. Three disclosed,
grounded deviations: (1) dir-token emission reads "ancestor dirs of retired
paths that are themselves retired" — suffix fragments of *live* ancestor dirs
would red legitimate prose at HEAD (measured); reproduces the spec's example
dir set exactly; (2) the gates.yml change is one `fetch-depth: 0` setting
across two physical YAML lines (`with:` parent key); (3) the witness header
gained an FLLWUP-59 paragraph (the old header's "pure filesystem reads" claim
became false). Step-9 skeptic dispatched next at the pinned subject.
