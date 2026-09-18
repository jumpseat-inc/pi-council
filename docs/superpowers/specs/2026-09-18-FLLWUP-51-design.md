# FLLWUP-51 — Loud gate for a goal wrapped onto a second line (design)

Card: `council/cards/FLLWUP-51.md` (EPIC-9 residual, fourth of eleven in
run-2 build order). Full-council path: steps 2–6 ran on this card; the
converged design below is what the deliberation settled (owner/principal/
designer rounds 1–2), the Skeptic ran its objections against (job-6.7), the
consolidator sorted (job-6.8), and `product-owner`/`steward` ruled on the
open judgment (PO items 1–4, steward item 5 — recorded verbatim on the card
face). This spec does not reopen any of it.

## 1. The design, in one paragraph

The loud gate is **the loader's own refusal**, not a post-hoc policy on a
parsed dict. `council/validate.py::parse_frontmatter` **raises** a
`FrontmatterError` carrying `(line_no, line_text, partial_meta)`; it never
returns a dict for a leading frontmatter block it would silently truncate.
`main()` catches per card, emits one structural `FAIL:` line, and still runs
the `REQUIRED_KEYS` loop against `partial_meta` so the
`missing required key 'goal'` class survives (T4). The predicate is a
**positional raw-line rule**: once a line whose key is `goal` has been seen
inside the leading block, only blank lines and the closing `---` may follow;
a non-blank line that is not `key: value`-shaped anywhere in the block is a
structural failure; a block never terminated by `---` (EOF reached, no bare
line hit) is a structural failure with a distinct message. There is **no key
vocabulary** — no unknown-key FAIL (withdrawn by owner in round 2; dominance
settled at Skeptic O7). No continuation-folding (considered and declined:
the goal demands refusal, and folding would flip currently-FAILing mid-block
wraps green). Authoring-time refusal is out of scope — detection at the
validator only; a machine-refusing procedure would be a *writer*, which is
what gate parity binds.

**Gate-parity mapping for the card domain** (seat-supplied interpretation,
recorded as the working reading; the wiki does not contain it — step-13/14
record): for cards there is **no code writer** (cards are written by
humans/procedures), the **loader is `parse_frontmatter`** (the sole
card-frontmatter parser in the repo — `extensions/index.ts::frontmatterField`
parses procedure frontmatter, not cards), and **dispatch is the
prose-mediated judge** (council.md step 10 hands the judge the goal text; no
code reads the parsed dict). Loader refusal is therefore the matched surface
by construction, and card gate parity is a procedure-discipline claim, not a
code-matched one.

## 2. The predicates, precisely

Inside the existing scan loop (leading block only — the loop already breaks
at the first `---`, so body-embedded fences in `FLLWUP-47.md`/`FLLWUP-49.md`
are never scanned; that scoping is structural, not added):

1. **Key after `goal`** — a `key: value`-shaped line appears after a line
   whose key is `goal` → raise. Message names the rule as **"line after
   `goal`"** (PO item 3.3 — not "last parsed key"), quotes the offending
   line's text (PO item 3.1), and contains the wrap vocabulary. Draft:
   `frontmatter line N '<line>' comes after 'goal' — a wrapped goal
   continuation parses as a key; keep the goal on one line, and keep goal
   last in the block.` (Wording is the implementer's; content requirements —
   quote, positional phrasing, vocabulary — are the design.)
2. **Bare non-`key: value` line** (the existing `elif line.strip(): break`
   branch becomes a raise) → raise. The message names **both hypotheses** —
   "wrapped value, or the closing `---` is missing" — because they are
   indistinguishable from inside the scan (PO item 3.2), quotes the line
   (PO item 3.1), and contains the vocabulary. Draft:
   `frontmatter line N '<line>' is not 'key: value' — a wrapped/continued
   value, or the closing '---' is missing (a line break ends the value; keep
   the goal on one line).`
3. **Unclosed block** — EOF reached with no closing `---` and no bare line
   already raised (a `closed` flag checked after the loop) → raise with a
   **distinct** message (Skeptic O15 / R-positional-F), **suppressed when a
   bare-line FAIL already fired** — one structural FAIL per card (PO item
   3.4). Draft: `frontmatter block is not closed — the closing '---' is
   missing (a line break ends the value; keep each key on one line).`

**Vocabulary echo is required, with a suite pin** (PO item 3.5): every
structural FAIL message MUST contain at least one of {`wrap`, `second line`,
`line break`, `value`} shared with `council/procedures/board-create-card.md`.
The draft messages above each satisfy this; the suite pins it (§5).

`main()` renders the raise as the existing `FAIL: <fname>: <message>`
grammar, exits 1. On a raise, `partial_meta` replaces the returned dict for
all downstream per-card checks (id match, required keys, id pattern, state,
board presence) — so T4's `missing required key 'goal'` still prints
alongside the structural FAIL, and a card whose partial meta carries a valid
id/state still gets its board checks.

## 3. Green-side guarantees (must not break)

- **Single-line goal containing `: `** parses clean, exit 0 (T1-shape;
  FLLWUP-43's retraction intact — Skeptic O10).
- **Extra intentional keys before `goal:`** — e.g. `labels: x` between
  `epic` and `goal` — parse clean, exit 0 (Skeptic O9). This is the
  executable record of the withdrawn unknown-key FAIL and of PO item 2's
  ruling that red-by-design applies only to goal-not-last.
- **All shipped data stays green**: every card in `council/cards/`
  (including FLLWUP-47/49 with body-embedded fences), the 8 seed trees, and
  `smoke/fixture/council/` exit 0 (Skeptic O8, re-run from source per the
  PO process requirement).

## 4. Documented residuals (both pinned, neither gated)

1. **Mid-block colon-bearing continuation of a non-goal key** (e.g.
   `owner:` wrapped as ` queue: …` before `goal`) — silent today, silent
   under this design. Pinned by a test asserting the exit-0/silent behavior
   (the residual, not the gate). The design record's justification is
   **narrowed per PO item 1**: the cheap predicates (whitespace-in-key
   check, key-shape regex) catch only the space-bearing sub-shape and would
   reject whitespace-leading keys the loader currently accepts silently —
   parser-character + sub-shape-coverage grounds, not impossibility. Filed
   as a step-13 follow-up card under EPIC-9; a later card may gate it.
2. **Unclosed frontmatter whose body begins with a bare `---`** (PO item 4)
   — the loop breaks at the body's `---`, so a leading block missing its
   closer with a body that starts with `---` parses with all six keys and
   exits 0. Uncaught-**by-design**: the grammar cannot distinguish a body
   fence from the closer. Pinned R8-style: "leading frontmatter block
   missing closer + body line 1 is bare `---`" → exit 0 with all 6 keys.
   Called out explicitly here as a known residual.

## 5. Surfaces that move (complete list)

1. `council/validate.py` — the raise-based loader gate + predicates above;
   docstring updated (it currently documents "goal present on a single
   line" with no enforcement — the FLLWUP-43 defect shape; the check now
   ships).
2. `council/scaffold/council/validate.py` + the 8
   `council/fixtures/<task>/seed/council/validate.py` copies —
   **byte-identical** (T3 pins 10 copies).
3. 8 `council/fixtures/<task>/fixture.json` — `seed.treeDigest` re-pinned to
   `sha256Tree(seed/)` and `fixtureVersion` `1.1.0` → `1.2.0` (T5;
   T5b/rubric untouched — c3 already grades single-line).
4. `council/procedures/board-create-card.md` (**root copy only** — verified:
   neither `council/scaffold/council/` nor the seed trees carry
   `procedures/`): make **goal-last explicit** and correct the conflation —
   "a line break ends the *value*; a line without the `key: value` shape
   ends the *block*" are two different mechanisms (principal round-1). Keep
   the section instructional (detection, not authoring-time refusal).
5. `test/fllwup43-goal-oracle.test.ts` — **T7 flipped in the same change**
   (a wrapped goal now refuses: parse raises; validate exits 1), T5's
   `fixtureVersion` assertion → `1.2.0`, header note updated. T2/T2b/T6/T8
   blobs are legal and stay green.
6. New `test/fllwup51-*.test.ts` — the red-first set (§6).
7. `package.json` — `version` bumped in the same PR (AGENTS.md: payload
   behavior changed).

**Release notes** (PO item 2): the PR must call out that `goal:` is now
**positional** (a key after `goal:` refuses) and that consumer cards must
conform — a consumer card with goal-not-last was already outside the
documented contract (`board-create-card.md` §3, `_template.md` line 7);
red-by-design is acceptable, ESC-3's "without overwriting" governs content
preservation, not validation strictness.

**Step-14 wiki ingest owed** (PO item 2): the new positional rule and the
FAIL message must be recorded in `vault/wiki/engineering-board.md` via
`/wiki-ingest` (never hand-edited); the current "real remaining silent-loss
path" sentence names this card and retires on ingest.

## 6. Test set (red-first; all proven red on today's tree at Skeptic step 4)

New `test/fllwup51-*.test.ts`, reusing the FLLWUP-43 harness shapes
(`councilTree`, `runValidate`, direct `parse_frontmatter` import via
subprocess):

- **R1** — wrapped bare continuation after `goal` (`goal: first part` /
  ` second part`) → exit 1, `FAIL:` line naming the wrap and quoting the
  offending line — not merely `missing required key`.
- **R2′ (anti-bolt-on)** — direct one-arg `parse_frontmatter` on the wrapped
  blob must **raise**, never return a truncated dict
  (`{"goal": "first part"}`). If R1 is green while R2′ is red, the gate is a
  `main()`-only bolt-on — the exact gate-parity violation this card exists
  to prevent.
- **R3** — wrap + `epic: null` after it → the diagnostic names the wrap, not
  (only) the missing key.
- **R4a (control)** — `goal: retry when the message is` + ` Rate limited:
  try again later` → exit 1 naming key-after-goal (the wrap vocabulary, not
  "unknown key").
- **R4b (the discriminator)** — `goal: a card whose` / ` goal: field is
  wrapped is refused` (duplicate-goal overwrite) → exit 1. Today 0; the
  withdrawn unknown-key FAIL would also miss it — positional raw-line rule
  is the only predicate that closes it.
- **R5′ (positional no-false-positive, asserted in the suite)** — every
  `^goal:` line in `council/cards/**`, `council/scaffold/council/cards/**`,
  and `council/fixtures/*/seed/council/**` is followed by `^---$`; plus the
  full-tree green run (all cards, 8 seeds, `smoke/fixture/council/` → 0,
  body fences included).
- **R7 (green pin, encodes the withdrawal + PO item 2)** — `labels: x`
  before `goal`, single-line goal → exit 0.
- **R8 (unclosed, both shapes)** — six key lines + EOF, no closer → exit 1
  with the distinct "not closed" message; unclosed-with-bare-body → exit 1
  with the both-hypotheses message; **unclosed leading block + body line 1
  bare `---`** → exit 0 with all 6 keys (PO item 4's pinned residual).
- **R9 (T4 preservation)** — `goal:no-space-after-key` still prints
  `missing required key 'goal'` (raise path feeds `partial_meta` into the
  required-key loop).
- **R10 (residual pin)** — mid-block colon-bearing continuation of a
  non-goal key → exit 0 (documented residual, §4.1; silent today, silent
  under the design).
- **R11 (vocabulary echo suite pin, PO item 3.5)** — every structural FAIL
  emitted by the R1/R4a/R8 shapes contains at least one of {wrap, second
  line, line break, value}.
- **R12 (one structural FAIL per card, PO item 3.4)** — unclosed-with-bare-
  body emits the bare-line FAIL and does **not** also emit the "not closed"
  message.

Amended in `test/fllwup43-goal-oracle.test.ts`: **T7 flips in the same
change** (parse raises; validate exits 1) or the suite is self-contradictory;
T5 `fixtureVersion` → `1.2.0`.

Gate set for verification (PO process requirement, binding): the owner builds
against this repo's `council/validate.py` — never a `/tmp` scratch tree —
and the Skeptic re-runs **all four gates plus its probes against the branch
head**: `bash council/preflight.sh FLLWUP-51`, `bunx tsc --noEmit`,
`bun test`, `python3 council/validate.py` (preflight rerun preferred over
trusting local-gate evidence, AGENTS.md #13).

## 7. Out of scope (recorded, not reopened)

- Continuation-folding / lossless joining (declined; goal demands refusal).
- Unknown-key FAIL / any key-vocabulary gate (withdrawn; O7 dominance).
- Authoring-time refusal in a procedure (a second surface; gate parity
  binds writers).
- The mid-block colon-bearing residual's gating (PO item 1: follow-up card
  under EPIC-9; a later card may gate it).
- Rubric changes (c3 already grades single-line; T5b stays at 1.1.0).
