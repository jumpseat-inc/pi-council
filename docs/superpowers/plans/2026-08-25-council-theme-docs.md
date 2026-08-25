# Council Theme System Documentation Implementation Plan (EV-5)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land the EV-5 documentation deliverables — the plan file, an AGENTS.md hard convention 9.6, and three README changes — so the wiki ingest can later derive a theme-system page from the spec.

**Architecture:** Documentation-only card. The design authority is the committed spec (`docs/superpowers/specs/2026-08-25-council-theme-design.md`); this plan covers only the two docs files the card prescribes (AGENTS.md and README.md) plus this plan itself. No engine code, no seat payload changes, no wiki edits (wiki ingest is a follow-up procedure, not this card). All work happens in an isolated git worktree off `main`; commits use Conventional Commits (`docs(scope): ...`); the four repo gates run in order after the edits.

**Tech Stack:** Markdown documentation; Bun (`bun install --frozen-lockfile`, `bunx tsc --noEmit`, `bun test`); Python 3 (`python3 council/validate.py`).

**Spec:** `docs/superpowers/specs/2026-08-25-council-theme-design.md` — the epic's design authority (approved, committed). This plan argues from spec §6 (AGENTS.md 9.6) and §7 (README changes, ruled binding), and from the binding product-owner ruling appended to the card's run record (four-state activation table, §4; precedence line, §7).

## Global Constraints

- **Verbatim reproductions (binding, product-owner ruling):** the four-state activation table (spec §4) and the README precedence line (spec §7, blockquoted) are settled by a ruling — reproduce the precedence line **verbatim**, no rewording. The activation table itself is recorded in the spec; the README carries only the precedence line.
- **EV-2 owns the final `.council.json` theme shape.** README/AGENTS snippets may show the **working proposal shape from spec §3** and must note EV-2 owns the final call. Do not editorialize the shape (no vars/colors split, no flat-colors redesign — those are EV-2's open deliberation).
- **The spec is authoritative.** If a defect is found in it, report it in the implementation output rather than silently changing the spec.
- **AGENTS.md 9.6 register:** a numbered hard convention beside 9.5, same terse register (bold lead, mechanics named, no filler).
- **README bullet stays.** Ruling Q2: update the "Per-seat model/thinking overrides" bullet (README.md:161-162) to enumerate BOTH the `council` seat-override block AND the new top-level `theme` key — do not drop the bullet. The `.council.json` Git-table row (README.md:181) is updated regardless.
- **Gates (this repo, all four, in order, hard stop-and-fix each):**
  1. `bun install --frozen-lockfile` — clean install
  2. `bunx tsc --noEmit` — typecheck (strict)
  3. `bun test` — full suite; integration test self-skips without `COUNCIL_INTEGRATION=1` (expected, not a failure)
  4. `python3 council/validate.py` — must report "All council artifacts valid" (card acceptance explicitly requires this after the docs edits)
- **Commits:** Conventional Commits (`docs(scope): short imperative summary`). Never commit to main directly. Push the feature branch and open a PR (`gh pr create`). Do not poll CI — the gates workflow (EV-6) runs on the PR head SHA and the facilitator checks it directly.
- **No wiki edits.** Wiki ingest is the follow-up procedure after implementation lands, explicitly not part of this card.

---

### Task 1: Isolated worktree + clean baseline

**Files:**
- None (setup only)

- [x] **Step 1: Detect isolation** — `git rev-parse --git-dir` vs `--git-common-dir` equal and no superproject ⇒ normal checkout, create a worktree.
- [x] **Step 2: Create the worktree** — `git worktree add .worktrees/docs-council-theme-system -b docs/council-theme-system` (`.worktrees/` exists and is git-ignored; branch off current main HEAD `7e0477a`).
- [x] **Step 3: Gate 1 baseline** — `bun install --frozen-lockfile` → clean install.
- [x] **Step 4: Gate 2 baseline** — `bunx tsc --noEmit` → exit 0.
- [x] **Step 5: Gate 3 baseline** — `bun test` → 138 pass, 2 skip (integration self-skips), 0 fail.

### Task 2: AGENTS.md — hard convention 9.6

**Files:**
- Modify: `AGENTS.md` (insert between 9.5's last line, currently line 87, and 10, currently line 88)

**Interfaces:**
- Consumes: spec §6 (the two things 9.6 documents) and §5 (token-only drawing rule, both clauses).
- Produces: the convention line later cards (EV-2, EV-3, EV-4) and the wiki ingest cite.

- [ ] **Step 1: Insert convention 9.6** — replace the 9.5 tail + the start of 10:

```markdown
   new override fields there, not in seat frontmatter.
 10. **MCP secrets never go in `mcp.json`** — header values entered via
```

with:

```markdown
   new override fields there, not in seat frontmatter.
 9.6. **The council theme is configured per-repo via a top-level `theme` key
    in committed `.council.json`** — a sibling of `council` and a reserved key
    skipped in the `loadCouncilConfig` loop, parsed by `loadThemeConfig`;
    `enabled: false` is the off switch (presence implies enabled). Council-drawn
    UI draws only from pi theme tokens via `fg`/`bg`/`bold` — no literal hex,
    ANSI escapes, or 256-index literals in council-drawn output — and strings
    handed to `setWidget`/`notify`/`custom` stay plain text (styling there is
    pi's job, never inline ANSI).
 10. **MCP secrets never go in `mcp.json`** — header values entered via
```

- [ ] **Step 2: Verify** — `grep -n "^ 9\.6\." AGENTS.md` shows the convention; `grep -n "^ 10\." AGENTS.md` still shows 10 immediately after it; the existing 9.5 text is untouched.
- [ ] **Step 3: Commit**

```bash
git add AGENTS.md
git commit -m "docs(agents): add hard convention 9.6 — council theme key + token-only drawing rule"
```

### Task 3: README.md — update the two existing touch points

**Files:**
- Modify: `README.md` lines 161-162 (bullet under "How installation works"), line 181 (Git-table row)

**Interfaces:**
- Consumes: spec §7 (a) and (b), ruling Q2 (update the bullet, keep it).
- Produces: README copy that names both the `council` seat-override block and the top-level `theme` key.

- [ ] **Step 1: Update the bullet** — replace:

```markdown
 - **Per-seat model/thinking overrides.** A committed `.council.json` at the repo
   root overrides individual seat fields without replacing the whole seat:
   `{ "council": { "<seat>": { "model"?, "thinking"? } } }`, where a bare string
   is shorthand for `{"model"}` and accepts the same `:thinking` suffix as
   frontmatter. Frontmatter stays the default; the file wins. `/council-init`
   seeds it non-clobberingly with each seat's current defaults, and invalid JSON
   or an unknown `thinking` level fails loudly rather than degrading.
```

with:

```markdown
 - **Per-seat model/thinking overrides and theme.** A committed `.council.json`
   at the repo root overrides individual seat fields without replacing the whole
   seat: `{ "council": { "<seat>": { "model"?, "thinking"? } } }`, where a bare
   string is shorthand for `{"model"}` and accepts the same `:thinking` suffix as
   frontmatter. Frontmatter stays the default; the file wins. `/council-init`
   seeds it non-clobberingly with each seat's current defaults, and invalid JSON
   or an unknown `thinking` level fails loudly rather than degrading. The same
   file carries the council theme under a top-level `theme` key (see
   [theme customization](#theme-customization)).
```

- [ ] **Step 2: Update the Git-table row** — replace (middle column is 93 chars wide between pipes; new content is 78 chars, pad to 93 with 14 trailing spaces):

```markdown
 | `.council.json`                 | per-seat model/thinking overrides (seeded by `/council-init`)                  | commit     |
```

with:

```markdown
 | `.council.json`                 | per-seat model/thinking overrides + theme section (seeded by `/council-init`)             | commit     |
```

- [ ] **Step 3: Verify** — `grep -n "theme customization" README.md` and `grep -n "theme section" README.md` show both edits; the table still renders (column widths unchanged: col2=35, col3=129).
- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs(readme): enumerate the council theme key at both .council.json touch points"
```

### Task 4: README.md — "What you get" theme-customization subsection

**Files:**
- Modify: `README.md` (insert after the "The wiki" paragraph in "What you get", before `## Commands`)

**Interfaces:**
- Consumes: spec §3 (working proposal shape, with EV-2 ownership note), §7 (c) (subsection contents + verbatim precedence line).
- Produces: the config-surface documentation of the council theme (snippet, variant pinning, per-token override example, off switch, precedence line). Mechanics stay in the spec.

- [ ] **Step 1: Insert the subsection** — replace:

```markdown
 `vault/CLAUDE.md` (the schema). Council seats ground themselves through the
 wiki; rulings land in `vault/raw/` and get ingested, so decisions compound
 across cards instead of evaporating between sessions.

## Commands
```

with:

```markdown
 `vault/CLAUDE.md` (the schema). Council seats ground themselves through the
 wiki; rulings land in `vault/raw/` and get ingested, so decisions compound
 across cards instead of evaporating between sessions.

### Theme customization

The council ships an oh-my-pi-themed dark/light pair — `pi-council-dark` and
`pi-council-light`. Recolor it per-repo from the committed `.council.json`,
under a top-level `theme` key, a sibling of `council` (final shape owned by
EV-2; this is the working proposal from the epic's design spec):

```json
{
  "council": { "<seat>": { "model"?, "thinking"? }, ... },
  "theme": {
    "enabled": true,
    "variant": "auto",
    "overrides": { "accent": "#febc38" }
  }
}
```

- **Variant pinning** — `variant` is `auto`, `dark`, or `light`; `auto`
  follows the terminal background and resolves to `pi-council-dark` /
  `pi-council-light`. `/council-init` seeds the section non-clobberingly, so
  `auto` is the default for fresh installs.
- **Per-token overrides** — `overrides` is keyed by pi theme token names
  (`accent`, `border`, …) with values in pi's accepted formats (hex,
  256-index, var-ref, or `""`).
- **Off switch** — presence implies enabled; remove the `theme` section or set
  `theme.enabled: false` to turn the council theme off.

> A non-built-in concrete theme in settings.json (e.g. `gruvbox`) wins; the
> auto-follow pair and a persisted literal built-in `dark`/`light` — pi's
> recorded auto-detect — do not block council activation. To turn the council
> theme off, remove the `theme` section from `.council.json` or set
> `theme.enabled: false`.

## Commands
```

- [ ] **Step 2: Verify verbatim line** — `grep -n "A non-built-in concrete theme" README.md` shows the precedence line exactly as blockquoted in spec §7 (compare byte-for-byte, including `theme.enabled: false`).
- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs(readme): add theme-customization subsection under What you get"
```

### Task 5: Final gate run — all four, in order

**Files:**
- None (verification only)

- [ ] **Step 1: Gate 1** — `bun install --frozen-lockfile` → clean install, exit 0.
- [ ] **Step 2: Gate 2** — `bunx tsc --noEmit` → exit 0 (docs-only diff; still run it — no gate is skipped for size).
- [ ] **Step 3: Gate 3** — `bun test` → all pass (integration self-skips without `COUNCIL_INTEGRATION=1`; that is expected).
- [ ] **Step 4: Gate 4** — `python3 council/validate.py` → must report "All council artifacts valid" (no card or board drift from the docs edits).

Each gate is a hard stop-and-fix: a failure means fix the underlying problem before proceeding; never lower a threshold, never narrow scope to make a gate pass.

### Task 6: Push + PR

**Files:**
- None (delivery)

- [ ] **Step 1: Push** — `git push -u origin docs/council-theme-system`.
- [ ] **Step 2: Open the PR** — `gh pr create --title "docs: EV-5 council theme system documentation" --body "Implements card EV-5: AGENTS.md 9.6 + README theme-customization docs per the committed design spec. Gates: see EV-6 check on head SHA."` (base `main`).
- [ ] **Step 3: Report** — branch name, PR number/URL, exact head SHA, files changed, and the actual output of each of the four gates. Do not poll CI.

---

## Self-review (against the spec)

- **§6 (AGENTS.md 9.6)** → Task 2: theme key (top-level sibling, reserved key skipped in the `loadCouncilConfig` loop, parsed by `loadThemeConfig`, `enabled: false` off switch) + token-only drawing rule (both clauses). ✓
- **§7 (a) bullet** → Task 3 Step 1: kept and updated to enumerate both the `council` block and the `theme` key (ruling Q2: update, don't drop). ✓
- **§7 (b) Git-table row** → Task 3 Step 2: mentions the theme section, column widths preserved. ✓
- **§7 (c) "What you get" subsection** → Task 4: scaffold snippet (spec §3 working proposal, EV-2 ownership noted), variant pinning, per-token override example, off switch, precedence line verbatim. ✓
- **Binding ruling Q1** → the precedence line in Task 4 is the ruling's exact text; the four-state table stays in the spec (recorded activation decision per the card's acceptance). ✓
- **Card acceptance** → plan + spec exist under `docs/superpowers/` with the activation decision recorded (spec §4 + ruling); AGENTS.md documents the key + rule; README has the snippet; `validate.py` clean (Task 5 Step 4). ✓
- **Gates** → all four run in order at Task 5, none skipped for change size. ✓
- **Placeholder scan** → every step carries the exact content (edit old/new pairs, exact commands); no TBDs. ✓
