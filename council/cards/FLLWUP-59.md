---
id: FLLWUP-59
title: Mechanically derive or police the shape witness's token allowlist
state: Deliberating
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
