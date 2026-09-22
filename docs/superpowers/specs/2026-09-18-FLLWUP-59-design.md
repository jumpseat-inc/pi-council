# FLLWUP-59 — Mechanically derive the shape witness's retired-path token set

Card: `council/cards/FLLWUP-59.md`. Goal (verbatim): "The shape witness's
provider-token list is derived or policed mechanically, so a future token
retirement cannot silently create a miss without the hand-maintained regex
being updated."

This spec writes up the design the full council settled (three deliberation
rounds, `owner` + `principal`, then a Skeptic pass that closed six claims
green and found two spec defects — both incorporated here as requirements).
It pins every choice the deliberation left; the implementing owner reads only
this file.

## 1. The mechanism: derive-and-replace

Delete the hand-maintained regex literal in `test/faux-provider-shape.test.ts`
test 6 (`/ev40-harness\/|ev43\/falsifier|ev43\/ev43-falsifier/`, file line
~124) and replace it with a **derived retired-path token set** fed by git
HEAD-ancestry. There is no hand-maintained list left to forget: the next
token retirement enters the derived set automatically, and a stale
path-shaped reference reds with the token and file named.

Structure (follows the file's existing pure/impure pattern):

- `deriveRetiredTokens(historyPaths, currentPaths)` — **pure**. Retired
  paths = paths in history but not in the current tree, **excluding Python
  bytecode** (`__pycache__` segments, `.pyc/.pyo/.pyd` suffixes — 15
  non-bytecode tokens measured at HEAD; a 16th historical path is retired
  bytecode and is excluded by the same rule the witness already applies to
  scanning).
- `retiredPathViolations(src, tokens)` — **pure** (matching rule in §2).
- Thin impure wrapper: two read-only `git` `spawnSync` calls from
  `REPO_ROOT`:
  - enumeration: `git log --no-renames --pretty=format: --name-only HEAD`
  - live tree: `git ls-tree -r HEAD --name-only`
  This is the same benign spawn class as test 8's `python3 -m py_compile`.
  **Enumeration is HEAD-ancestry only — never `--all`.** (Settled: `--all`
  makes the verdict a function of the local ref set — nondeterministic;
  measured both on a synthetic repo and confirmed by the seats. No mainline
  retirement can be missing from HEAD ancestry because AGENTS.md forbids
  rewriting `main` history.)
- On any `git` error: **named loud FAIL** — never a silent pass.
- Scan domain stays `TEST_DIR` (all of `test/`, witness self-excluded,
  bytecode excluded) — **byte-identical to today's `countMatches(TEST_DIR, …)`.
  Test 6 never reads `smoke/`** (the FLLWUP-55 `smoke/` charter extension is
  tests 9–11 via `SMOKE_DRIVER` and is untouched). Widening the token scan to
  `smoke/` is out of scope.

## 2. Emission and matching (pinned — the O2/O9 repair)

The Skeptic proved the deliberation's signed rule jointly unsatisfiable
(three combos tested; exactly one consistent family survives the recorded
constraints). The pinned rule:

**Emission** (from the 15 non-bytecode retired paths):

- **Path fragments**: each retired file path plus its segment-aligned suffix
  fragments (drop leading path segments; e.g. `test/ev40-harness/harness-headless.ts`
  → also `ev40-harness/harness-headless.ts` and `harness-headless.ts`).
  A fragment is emitted **iff no live tracked path contains it as a
  substring**. (Measured: `harness-headless.ts` and
  `ev40-harness/harness-headless.ts` emissable; `ev41-tui.py` NOT emissable —
  live `test/faux-provider/ev41-tui.py` contains it. The collision universe
  is live tracked **paths** from `ls-tree`, never file **contents** — a
  content-aware universe is ruled out by the deliberation's anti-decay
  convergence.)
- **Dir tokens**: each retired ancestor directory and its segment-aligned
  suffix dir fragments, with trailing slash (e.g. `test/ev40-harness/`,
  `ev40-harness/`, `ev43/`, `smoke/artifacts/`). A dir token is emitted **iff
  no live tracked path has it as a path prefix**.

**Matching** (in `retiredPathViolations`):

- A **path fragment** (not ending in `/`) violates on a **plain substring
  match**.
- A **dir token** (ending in `/`) violates only when followed by a
  **path-continuation character**: `[A-Za-z0-9_./-]`. A dir token followed by
  anything else (space, quote, apostrophe, end of line) does not violate.

Why this is the one consistent rule (each clause is load-bearing):

- Dir-token + continuation-char is what keeps HEAD green:
  `test/ev43-reachability.test.ts:6` ("the retired ev43/ scratch extension"
  — space after) must NOT violate, while `:52-53`'s provider ids
  (`ev43`/`ev43-model`) never contain `ev43/` at all. Plain-substring dir
  matching reds `:6` on the first CI run — ruled out.
- Plain-substring path fragments is what makes the re-fixture'd FLLWUP-48
  scan-domain tripwire red (§3) and catches `via test/ev41-tui.py`
  (apostrophe before, no continuation issue — substring).
- Continuation-char matching on the *old* fixture (`const retired =
  'ev40-harness/';`) leaves it green — apostrophe is not a continuation char
  — which is why the fixture itself must move to a full retired path (§3).
- Content-aware emission ("emit only what the witness's prose allows") is
  ruled out by both seats' convergence: it re-creates the hand-maintained
  exclusion list this card exists to kill.

## 3. Re-fixture the FLLWUP-48 scan-domain test (required, in-file)

The FLLWUP-48 `describe("scan domain — bytecode exclusion")` test's red-side
fixture is `writeFileSync(join(scratch, "x.ts"), "const retired =
'ev40-harness/';\n")`. Under the pinned rule that string goes **green**
(apostrophe after a dir token). Change the fixture to a retired **full path**
fragment, e.g. `const retired = 'test/ev40-harness/harness-headless.ts';`,
and use the same token in the scratch `__pycache__/x.pyc` side. The test
stays two-sided: bytecode dropped, source hit.

## 4. Owned narrowings (pinned two-sided, in the same file)

Three mention classes are out of scope by design — each pinned by a
scratch-source probe (the skeleton already has `mkdtempSync` scratch tests):

1. **Bare-dir prose**: a dir token followed by a non-continuation char
   ("the retired ev43/ scratch extension", "the retired ev40-harness/
   family") → green.
2. **Bare basename of a relocated path**: `ev41-tui.py` without directory →
   green (suppressed: live `test/faux-provider/ev41-tui.py` collides).
   Probe set: bare basename green / `test/ev41-tui.py` red / live full path
   `test/faux-provider/ev41-tui.py` green.
3. **Intentional full-path prose** mentioning a retired path: red — the
   escape valve is rewording (prose discipline, same as `prose.test.ts`
   forcing `features-deliver.md`). Pinned as declared discipline; if a future
   contributor declines, the in-mechanism escape would become a
   hand-maintained exclusion list — that is the known, owned decay boundary,
   named in the wiki page (§6), not hidden.

Positive tripwires (all must red): `see ev43/falsifier-headless.ts` (dir
token + continuation), `via test/ev41-tui.py` (full path), a source carrying
`ev40-harness/harness-headless.ts`.

## 5. The loud-fail guard (composed)

Before deriving, assert BOTH; each failure names its cause and fails the
witness — never a silent pass:

1. **Structural shallow check**: `git rev-parse --is-shallow-repository` —
   `true` → named FAIL ("shallow history: derived token set would be silently
   partial"). (Measured: a depth-1 `--no-local` clone reports `true` AND
   yields an empty HEAD-ancestry retired set; the empty-output guard the
   deliberation first proposed does NOT fire — this check does.)
2. **Retirement canary**: the derived **retired-path set** (pre-suppression —
   never the emitted fragment set; `test/ev41-tui.py` is collision-suppressed
   from fragments and a fragment-based canary would be unsatisfiable) must
   contain **both** `test/ev41-tui.py` and `test/ev40-harness/`. Missing →
   named FAIL ("retirement canary absent — history truncated"). A retired
   path cannot un-retire; the canary is a tripwire, not an allowlist. It
   covers histories the shallow check cannot see (windowed fetches, archive
   exports, a future workflow edit).

**CI substrate (second file in the diff):** `.github/workflows/gates.yml`'s
checkout step (line 11, `- uses: actions/checkout@v4`) gains `fetch-depth: 0`
— without it every CI run loud-fails (a permanently red gate is not
shippable). The line is in the same PR, owned by the implementing owner. (It
is NOT `gates.yml:9` — that line is `runs-on: ubuntu-latest`.)

## 6. Wiki page (same PR)

New page (suggest `vault/wiki/retired-path-tokens.md`; name at implementer's
discretion) linked from `vault/wiki/index.md`'s Concepts section,
documenting: the contract (test 6 polices retired **path** tokens — not
provider ids), the derived mechanism and its exact git commands, the pinned
emission/matching rule, the three owned narrowings, the composed guard +
canary, the loud-fail rule, and the red-base falsifier (§7). No new flag, no
`council/preflight.sh` string, no user-visible copy.

## 7. Red-base falsifier (seven-field convention)

- **Base SHA: `323abdc`** — the FLLWUP-49 mechanism merge. NOT its parent
  `fce0ecb` (Skeptic O1, closed-red: at `fce0ecb` the retirement hasn't
  happened — `test/ev41-tui.py` live, `test/ev40-harness/` 3 live files, 0
  violations). Base-selection rule: the first tree in HEAD ancestry where
  both the retirement and the stale reference exist — the commit that created
  the stale reference.
- **Acceptance**: the derived checker (pure functions, fed the base
  worktree's `git log`/`ls-tree` — a transplant; at `323abdc` the committed
  witness is the original FLLWUP-49 version with no derived mechanism, and
  running the whole head witness file there would error on the FLLWUP-55
  `smoke/` tests whose subject files don't exist yet) yields **≥1 violation
  naming the `test/ev41-tui.py` full path** (in `test/ev41-retry-e2e.test.ts`).
  At HEAD the same checker yields `[]`.
- **Transplant caveats for the seven-field record**: (a) at `323abdc` the
  `test/faux-provider/` station exists but not the FLLWUP-55 `smoke/` driver;
  (b) FLLWUP-48's merged commit `1cf907f` is NOT in the FLLWUP-49
  branch-line ancestry — that is why the pre-fix comment survives at
  `fce0ecb`; record this so a future reader doesn't "fix" the base into
  another wrong SHA.

## 8. Acceptance criteria (Skeptic-runnable; all must hold)

1. **Green-at-head**: full `bun test` green; the derived checker over the
   real scan domain yields `[]`; the three owned-narrowing probes and the
   live-path probe all green.
2. **Headline regression catch**: revert `test/ev41-retry-e2e.test.ts:325` to
   `// (c) Parent-turn falsifier — TUI branch (pty, via test/ev41-tui.py)` on
   a scratch worktree → test 6 **REDS** naming the `test/ev41-tui.py` full
   path. (Measured premise: today's regex stays green there — 12 pass / 0
   fail.) This is the card's goal, demonstrated.
3. **Tripwires red**: the §4 positive probes red with token and file named.
4. **Red-base at `323abdc`** per §7.
5. **Shallow loud-fail**: in a depth-1 `--no-local` clone (or with
   `.git/shallow` simulated), the witness fails with the named shallow error,
   never green.
6. **Canary loud-fail**: with a truncated/synthetic history losing both
   canary targets, the witness fails with the named canary error.
7. **Re-fixture two-sided**: §3's test — bytecode dropped, source hit.
8. **Zero-new-live-arms**: arm counts 3/5/5/2 (`ev40-headless`,
   `ev40-live-gates`, `ev41-retry-e2e`, `ev43-reachability`) + 2
   (`ev41-seat-child-live`) unchanged before/after; the only new spawn is the
   read-only `git` `spawnSync` (no pi, no pty); `EV40_TOOLCALL_WAIT` knob and
   FLLWUP-55 guards (tests 9–11) untouched and green.
9. **Full gate set**: `bunx tsc --noEmit`, `bun test`,
   `python3 council/validate.py`, `bash council/preflight.sh FLLWUP-59`.

## 9. Out of scope

No changes to any other witness test's semantics (tests 1–5, 7–11) beyond
the §3 re-fixture; no `smoke/` widening of the token scan; no preflight.sh
strings; no new env flags; no product-visible copy; no `council/` engine
changes beyond zero. The `git replace`/grafted/archive-export blind spot is a
**named limitation** (canary guards it loudly; live reproduction deferred —
recorded as such in the wiki page).

## Addendum (2026-09-22) — dir-token liveness is segment-aware

§2's dir-token emission rule originally read "emitted iff no live tracked path
has the dir as a **prefix**." Prefix-only liveness proved too weak on the
skills-consolidation commit (`1b982dd`): retiring `.agents/skills/**` emits the
segment-aligned suffix dir token `skills/`, which no live path has as a prefix,
yet `skills/` is live as a *segment* under `.pi/skills/**`. The token then red
`test/scaffold.test.ts`'s legitimate live reference to the `/usages` scaffold
destination `skills/usages/SKILL.md` — a false positive, not a stale path.

The refinement: a dir token is emitted iff **no live tracked path carries it as
a path segment** — prefix or any interior segment (`/${path}/`.includes(`/${f}/`)).
This is the dir-token analogue of the path-fragment rule's substring-liveness
and preserves every intended token (`test/ev40-harness/`, `ev40-harness/`,
`ev43/`, …), whose dirs appear in no live path. The `vault/wiki/retired-path-tokens.md`
emission section carries the current rule; this addendum records why it changed.
A pure falsifier (`dir tokens colliding with a live path SEGMENT are suppressed`)
locks the refined rule in `test/faux-provider-shape.test.ts`.
