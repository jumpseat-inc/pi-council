# FLLWUP-25 — Wiki source page matches AGENTS.md hard-conventions count

Date: 2026-09-06. Card: `council/cards/FLLWUP-25.md` (state: Deliberating →
In Progress). Deliberation: owner/principal/designer step-2 positions and
step-3 round-1 exchange (1 of ≤3 rounds, stabilized), Skeptic step-4 attack
(1 closed-red, 10 closed-green), consolidator step-5 synthesis, step-6
escalation resolved by product-owner rulings R-1 (SPEC-4: heading format)
and R-2 (SPEC-5: `sources: []` disposition), recorded verbatim on the card
face. This spec is the settled design + rulings; the owner implements
exactly this, nothing beyond.

## Problem

FLLWUP-24 added hard-convention clause #13 to `AGENTS.md` (commit `2c5ec3b`).
The vault wiki source page `vault/wiki/sources/2026-08-23-agents.md`
summarizes the file as "12 hard conventions" under the old numbering: its
item 1 ("Seats are opinionated on purpose") is stale since the v0.14.0
inversion to "Seats are domain-neutral by design"; the `.council.json`
override clause (now 9.5 in the file) is listed as old item 12; clauses 9.6
(theme) and 13 (local gate evidence / preflight) are absent; the summary
word, frontmatter summary, body heading, and `vault/wiki/index.md:72` all carry the stale "twelve"/"12" count. The manifest pin
(`vault/.repo-docs.tsv`) sits at `df1949e` (2026-08-23); AGENTS.md has
moved since (last touch `2c5ec3b`, content == HEAD, probe-verified
identical in this run's step 1).

This card refreshes the page via the wiki-ingest procedure's path — `vault/`
is never hand-rewritten outside an ingest-shaped pass — and closes the
staleness class by construction: a scripted consistency check between the
page and `AGENTS.md` that fails on any future drift.

## Settled design

### Home (deliberation ruling, recorded)

The consistency check lives in `test/` as
`test/fllwup25-agents-page.test.ts` — a pure, test-local
`diffConventions(agentsText, pageText)` with **no new engine surface and
no `council/` script** (a test IS practical for a vault file; CI's `bun
test` gate is the caller). Precedent for reading real repo files:
`test/prose.test.ts` and the FLLWUP-24 suite. Helper functions (parser,
word→number normalizer) are test-local pure exports, precedent
`test/theme-loader.ts`.

### Parser (one regex, both sides, whitespace-tolerant)

`^[ \t]*(\d+(?:\.\d+)?)\.\s+\*\*([^*]+)\*\*` — leading-whitespace tolerant
so ` 10.` and ` 9.6.` (two leading spaces in AGENTS.md) and `9.5.` (none)
all parse; the bold-lead capture `[^*]+` must span newlines (the bolds of
9.5, 9.6 and 13 span multiple lines in AGENTS.md — implement with
dot-matches-newline semantics). Over the real file's conventions section
it yields exactly **15** tokens in order: integers 1–13 plus 9.5, 9.6.

### Parser slice anchors (R-1 — symmetric between page and file)

Both texts are sliced at their `## Hard conventions` heading — the page's
section heading **must be `## Hard conventions` verbatim** (R-1; AGENTS.md
line 47). The slice anchor is therefore symmetric between the two inputs,
removing any asymmetric-anchor coupling. The heading carries **no count
token**: it never reads "The thirteen hard conventions" or any count
word. A heading rename later is a one-line text edit — undo is cheap and
nothing depends on the heading's count word.

### Assertion shape (merged, exactly three checks)

1. **Ordered label equality** over all 15 tokens — labels are the file's
   own `1`–`13` plus `9.5`, `9.6` as decimal labels under parent 9. Nesting
   presentation is free (sub-bullet vs flat) because labels are parsed,
   not positions; renumbering is forbidden (a page that renumbers 9.5→10
   or flattens to 1–13 fails).
2. **Per-label normalized bold-lead equality** (exact-lead policy) — for
   each label, the page's bold lead, whitespace-collapsed, equals the
   file's bold lead, whitespace-collapsed. A lead paraphrase (the stale
   page's "omp-style tool-grant vocabulary" vs the file's "Tool-grant
   vocabulary"; a reverted item-1 lead) fails, naming the label.
3. **Stated-count token == derived count** — the derived count is the
   number of *integer* top-level labels in the file slice (13). The count
   token is asserted at exactly three sites (R-1 restates them; SPEC-2 is
   superseded by R-1 for the heading site, which no longer carries a
   count word):
   - **Page-body site:** the intro paragraph's bold phrase
     `**thirteen hard conventions**` — the count word immediately
     preceding the words "hard conventions" inside the bold phrase.
     Normalized (word→number: "thirteen"→13) it must equal the derived
     count.
   - **Frontmatter site:** the `summary:` value's count token — the
     summary contains its count as a *word* ("thirteen"), exactly one
     number-word token in the summary. Normalized it must equal the
     derived count. There is **no numeric `count:` frontmatter field**
     (Skeptic RED-1 fix, binding: the page writes the word "thirteen",
     never a numeric field; the assertion normalizes words→numbers —
     "twelve"→12, "thirteen"→13 — rather than dropping the assertion or
     adding a field).
   - **index.md site:** the `vault/wiki/index.md` Sources line containing
     `[[2026-08-23-agents]]` carries the count as a digit ("13"); the
     line's sole integer must equal the derived count.
   The word→number map covers at least the tokens that occur or could
   occur in these sites ("one".."twenty"); digits need no mapping. The
   count-token scanner is **confined to these three sites** (SPEC-3):
   historical "twelve"/"12th convention" entries in `vault/wiki/log.md`
   (lines ~331, ~337) are append-only and must never be scanned, flagged,
   or rewritten.

No hardcoded `13`/`15` anywhere in the suite — both sides are derived at
runtime from disk-read text.

### Refresh scope (ingest pass; R-1 and R-2 binding)

`vault/wiki/sources/2026-08-23-agents.md` rewritten in an ingest-shaped
pass:

- **Banner** (first body line) re-pinned:
  `> ⚠️ Derived from \`AGENTS.md\` @ \`2c5ec3b\` (captured 2026-09-06).`
  followed by the unchanged second line ("Docs drift; the codebase is the
  source of truth — verify against code before relying on this.").
- **Frontmatter:** gains the four REQUIRED provenance keys verbatim —
  `provenance: repo-doc`, `source_path: AGENTS.md`,
  `source_commit: 2c5ec3b`, `captured: 2026-09-06` (the external citation
  lives here and only here, per R-2's two-axis rule). The `summary:`
  value is refreshed: count word "thirteen" (its sole number-word), the
  parenthetical noting the 9.5/9.6 sub-entries, the v0.7.0 parenthetical
  moved to the log entry as history. `updated: 2026-09-06`.
  **`sources:` (R-2):** delete `sources: []`; populate with the
  deduplicated set of wiki-internal `[[wikilink]]` targets that appear in
  the refreshed page body (including the `## Related` section), in order
  of first appearance — after this refresh, at minimum `[[preflight]]`,
  `[[council-theme]]`, `[[council-config]]` plus the Related section's
  links. The array carries **only** wiki-internal page references — never
  `AGENTS.md`, never any external path or raw text. It is never empty.
- **Intro paragraph:** keeps the old page's opening shape; the count
  lives in the bold phrase `**thirteen hard conventions**` (the page-body
  count-token site above).
- **Conventions section:** heading `## Hard conventions` (R-1, verbatim,
  no count word). The list mirrors the file at `2c5ec3b`:
  - 13 top-level items (labels 1–13) with the file's **exact bold leads**
    (whitespace-collapsed form), including the corrected item 1 ("Seats
    are domain-neutral by design" — the v0.14.0 inversion) and the
    file's item 8 lead "Tool-grant vocabulary".
  - 9.5/9.6 as labeled decimal items `9.5.`/`9.6.` under parent 9,
    mirroring the file.
  - Wiki copy normalizes the leading-space markers: ` 10.` → `10.` and
    ` 9.6.` → `9.6.` (presentation only; the parser tolerates both).
  - Two cross-link annotations in the body (settled design): clause 13's
    body links `[[preflight]]`; clause 9.6's body links
    `[[council-theme]]`. The existing `[[council-config]]` annotation
    under the `.council.json` clause (today item 12, after refresh 9.5)
    is kept.
- **Other sections / Related:** unchanged (none stale). **`## Sources`**
  section (page bottom) re-pinned per R-2: `AGENTS.md @ 2c5ec3b` — the
  human-readable mirror of `source_path`/`source_commit`, not a
  `sources:` entry.
- **No "Drift since pin" section** (settled; the re-pinned banner makes
  it a lie).
- `vault/wiki/index.md:72` — the `[[2026-08-23-agents]]` Sources line's
  "12" → "13" (one line only).
- `vault/wiki/log.md` — one new entry at the top
  (`## [2026-09-06] ingest | AGENTS.md re-ingest — conventions summary
  12→13`), noting: (a) pin re-pin df1949e → 2c5ec3b and the 12→13
  re-count; (b) item-1 inversion correction (v0.14.0); (c) clause #13
  source (FLLWUP-24 / 2c5ec3b); (d) human-loop waiver: "card = steer" —
  card FLLWUP-25 substitutes the schema's discuss-with-me-first step
  (flag-not-overwrite discipline); (e) provenance-frontmatter conformance
  decision (first page carrying the REQUIRED four keys; no vault tooling
  rejects them — validate.py has zero vault surface); (f) the ` 10.`
  leading-space lint observation on AGENTS.md (source whitespace fix
  deferred as a follow-up candidate). Historical entries stay untouched.
- `vault/.repo-docs.tsv` — the AGENTS.md row only:
  `AGENTS.md	2c5ec3b	2026-09-06	[[2026-08-23-agents]]	agents`
  (pin + captured date).
- **`AGENTS.md` itself is never edited** (`git diff origin/main --
  AGENTS.md` empty). The ` 10.` whitespace fix is a deferred follow-up
  candidate.

### Proof / driven tests (must be green on the branch)

`test/fllwup25-agents-page.test.ts`, reading the real files from the repo
root (`process.cwd()`): `AGENTS.md`, the refreshed page, and
`vault/wiki/index.md`; red-honesty via **in-memory string mutations of
disk-read text only** — never edits to real files, never scratch writes.

1. **Parser fidelity (T-A):** the tolerant parser extracts exactly 15
   (label, boldLead) tokens from the real AGENTS.md slice, labels in
   order, including the whitespace-prefixed ` 10.`/` 9.6.` and the
   multi-line bolds.
2. **Green on the real pair (T-B):** `diffConventions(AGENTS.md,
   refreshed page)` returns zero findings; the index.md:72 integer equals
   the derived count. (This lands in the same PR as the refresh; the
   stale page is red against the current file — correct TDD ordering.)
3. **Red-honesty (T-C), each mutation yields a named finding** (drop
   item 13; renumber 9.5→10; invert the item-1 lead; swap 10/11; wrong
   count token — page bold sentence "twelve"), against in-memory copies.
4. **No-hardcode counter-check (T-D):** a scratch AGENTS.md + matching
   scratch page, both carrying a synthetic `14.` convention, stay green
   with **zero test edits** — both sides derived at runtime.
5. **Parser-trap check (T-E):** an anchor that drops the leading-
   whitespace tolerance demonstrably undercounts AGENTS.md's tokens
   (this run's probe recorded it silently skipping whitespace-prefixed
   tokens); the shipped tolerant parser does not.
6. **Count-token normalization (T-F):** the page-body bold phrase and the
   frontmatter summary word, normalized via the word→number map, each
   equal the derived count; a page whose list is correct but whose prose
   still says "twelve" fails naming the token (owner T2 / principal
   C1 shape).

### Gates (all four, in order, in full)

1. `bun install --frozen-lockfile` — exit 0 on the lock-synced tree; no
   lock mutation.
2. `bunx tsc --noEmit` — clean (new test strict-typed).
3. `bun test` — full suite green including the new suite; the FLLWUP-21..24
   deliverable suites (`test/env-split-contract.test.ts`, `theme-*.test.ts`
   ×9, `test/fllwup23-dep-less.test.ts`, `test/fllwup24-drift.test.ts`)
   unchanged and green.
4. `python3 council/validate.py` — clean (zero vault surface).

Preflight is not an owner gate here: `bash council/preflight.sh FLLWUP-25`
has a pre-existing invariant — its history gate (`merge-base --is-ancestor
origin/main HEAD`) fails on any unmerged PR branch once origin/main
advances past the branch base (recorded FLLWUP-24 step 9). Not a gate
finding; the four gates above are the authority.

### Diff-scope guard

Modified (4 paths): `vault/wiki/sources/2026-08-23-agents.md`,
`vault/wiki/index.md` (one line, :72), `vault/wiki/log.md` (one new top
entry), `vault/.repo-docs.tsv` (AGENTS.md row). New (3 paths): the test
file, the plan doc, this spec. Byte-identical to HEAD: `AGENTS.md`,
`council/check-pi-drift.sh`, `council/preflight.sh`,
`council/scaffold/**`, all `council/agents/*.md` and
`council/procedures/*.md`, `package.json`, `bun.lock`,
`.github/workflows/gates.yml`, every other file under `test/`.

### Worktree / PR conventions

The owner works in an isolated git worktree `.worktrees/fllwup-25-agents-page`
(branch `feat/fllwup-25-agents-page` based at `origin/main`), never on
`main` directly, and never issues `git checkout`/`git switch`/`git reset`
against the main repository path. PR opened against `main`. The worktree's
`node_modules` must be lock-synced (`bun install --frozen-lockfile`)
before any gate run, per the FLLWUP-24/25 standing binding.