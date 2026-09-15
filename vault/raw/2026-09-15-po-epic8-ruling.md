# Product-owner ruling — EPIC-8 transcript-rendering decomposition (wave 3)

Run: `/features-new` decomposition of the human intake ("when /council-tree is invoked and we navigate into the transcript of an agent's session, tool calls are not rendered elegantly. Take inspiration from `minimalist-ui` and other coding agents like Claude Code or Codex."), epic id EPIC-8, four proposed children EV-33..EV-36. Three-wave deliberation per [[three-wave-decomposition]]: wave-1 principal authored the epic goal + children, wave-2 skeptic + designer attacked in parallel, wave-3 product-owner rules last, unconditional.

Source: facilitator-assembled disagreement ledger D1–D10 + amended A1–A8 draft. Vault wiki + EPIC-2 card history + EV-7/8/9 PO rulings cited inline.

## Framing — what the epic is for

The intake is a **rendering-taste** request, but principal's wave-1 reframe surfaced an upstream blocker: `parseTranscript` (`extensions/transcript.ts:30-80`) does **not** preserve `toolCallId` or `isError` on its `TranscriptBlock` output (verified by grep — neither field exists), so "elegant tool call" cannot be reached by any amount of `navigator.ts` work alone. The data layer must land first. Children's `Ready`-vs-`Backlog` is therefore a falsifiability question, not a sequencing preference.

Two binding rulings from EPIC-2 constrain this epic's surface vocabulary:

- **EV-8 PO ruling 1 (editor-driven focus)** — `controller.surface` is the sole arbiter; no `setFocus(widget)`; the below-editor widget stays render-only/passive. Children's "interaction model" must operate inside this constraint.
- **EV-9 PO ruling (tiny-regime floor, `DISPLAY_FLOOR = 7`)** — `extensions/focus-nav.ts:84`; at `termRows < 7`, Enter on a tree row is a consumed no-op. Children's "one-row floor" cannot widen this floor; the floor belongs to EV-9 and is read-only here.
- **EV-8 PO ruling 3 (taste set, hard rules)** — `-- TREE --` mode label (vim precedent), `TREE_ROW_MARKER = "\u258C"` (U+258C, one column), no j/k aliasing. These are inherited; the epic's "visible focus" mechanism must reuse `TREE_ROW_MARKER`, not invent a second signifier.
- **AGENTS.md 9.6 / [[council-theme]]** — every council-drawn color comes from a pi `Theme` token via `fg`/`bg`/`bold`; no literal hex, ANSI escapes, or 256-index literals. Children's chosen tokens (e.g. `muted` for failure status) must come from the existing token set; no new tokens.

The intake's "minimalist-ui" is read as **typographic/structural hierarchy + scarcity of color**, not palette/motion — palette is test-forbidden (token-only), empty rows are viewport-forbidden (`progressLines` floor 1, `focus-nav.ts:105`), and animation has no vehicle (widget render is a pure line slice).

## Slicing — no change

All four children stand. Principal and both attackers agree the four-child slicing is correct. The `transcript-block-fidelity`-first ordering is settled (data-fidelity must land before any rendering taste can be honestly delivered; without identity + error bit + shared accessor, child 2 is a cosmetic reskin of two unpaired lines).

## Epic goal — ratify

> Tool calls and the surrounding seat transcript render in the /council-tree inline progress view with an editorial, low-noise hierarchy, a visible focus-and-expand interaction model, and legibility that holds from a one-row viewport to a full panel, drawing only pi theme tokens

Captures the intake (tool-call rendering, minimalist-ui-as-typographic-restraint, human-interaction-design as focus-and-expand, Claude/Codex-as-precedent absorbed into "interaction model"). Token-only is the explicit binding rule. Surface is the inline progress view per [[run-transcripts]] (the modal path is superseded and survives only behind `navigator.ts:57` — out of scope).

## Child states — three Ready, one Backlog

- **Child 1 (`transcript-block-fidelity`) — `Backlog`.** The drafted goal body is **not falsifiable as written** (see D1 + D2): a positional `call[i]→result[i]` pairing satisfies the demo; the title's "one shared argument summary" claim is outside the goal body. Until the goal is amended per D1 + D2, the card cannot promote to Ready. The amendments are small, the falsifiability bar is non-negotiable.
- **Child 2 (`tool-call-unit-rendering`) — `Ready`** with Intent amendments (D4 + D10(a) + D10(c)) and a proof-fixture amendment (D3, open-untested → legacy-blocks fixture in the proof). Goal body stands.
- **Child 3 (`transcript-interaction-model`) — `Ready`** with a goal-body amendment (D5, "every key changes a rendered line" → "every key has well-defined behavior") and Intent amendments (D6 + D10(b)). The amendment is a one-sentence tightening; `forward-unhandled` (EV-8 ruling 2) and `TREE_ROW_MARKER` (EV-8 ruling 3) are inherited.
- **Child 4 (`transcript-one-row-floor-legibility`) — `Ready`** with a parenthetical-scope amendment (D7, "twenty-three rows" is testably false — actual max `progressLines` at `termRows=40` is 31 under `computeProgressLayout`) and an Intent mechanism amendment (D9).

---

## Disputes

### D1 — child 1 title vs goal (skeptic O2, closed-red)

**Objection**: title says "tool-call identity, error state, **and one shared argument summary**" but the goal body contains no argument-derivation assertion. The seam-cut note (`firstArgOf` at `navigator.ts:233` is consumed by the tree-row `activityCopy` at `:249` AND must be consumed by the new transcript header) is therefore unenforceable: an implementation that satisfies the goal body can leave the seam-cut note unmet, leaving "two layers each assuming the other is the source of truth."

**Settling test (Skeptic's)**: after child 1 lands, `grep -n firstArgOf extensions/navigator.ts` still hits AND the goal's demo test passes — goal green, seam-cut note broken.

**Ruling**: adopt Skeptic. The goal body must add an assertion that the single accessor (`firstArgOf`-shaped) is **the** primary-argument derivation, consumed by both the tree row (preserves the `/ran bash/` assertion at `test/ev7-council-tree-widget.test.ts:99`) AND the new transcript header. Title stands; goal body is amended to back it.

**Grounding**: principal's wave-1 seam-cut note (verbatim, A6): "this child must also expose the **single** primary-argument derivation. Today `firstArgOf` (`navigator.ts:233`) ad-hoc `JSON.parse`s `detail`, and `activityCopy` (`:249`) is the tree's only user of it; the transcript redesign will want the same string. Leaving two derivations is the 'two layers each assuming the other is the source of truth' failure." Verified by read.

**Reversibility**: low — one sentence append to the goal body, no implementation work undone.

### D2 — child 1 stub-satisfiability (skeptic O1, open-untested)

**Objection**: the demo ("two same-named tool calls, only one result errors") can be passed by pairing `call[i]→result[i]` in arrival order without preserving any identity, so the goal does not force the identity it titles.

**Settling test (runnable)**: parse a fixture where the two same-named calls' results arrive **out of arrival order** and assert each unit's name + primary-argument matches its **own** result body — a positional stub passes the goal's demo and fails this.

**Ruling**: adopt Skeptic. The goal's demo fixture must exercise out-of-order results so positional pairing demonstrably fails. This is the only way the title's "tool-call identity" claim becomes provable from the goal alone.

**Grounding**: the goal's claim is "parseTranscript output alone lets a consumer **pair** every toolCall block with its **own** toolResult block" — the word "own" demands identity preservation, not positional correlation. The demo is loose against the claim; this is an Intent/draft tightening, not a goal rewrite.

**Reversibility**: low — fixture swap, no implementation work undone.

**Joint D1 + D2 effect**: child 1's `state` is `Backlog` until both amendments are transcribed into the goal body. Once transcribed (out-of-order demo + single-accessor assertion), promotion to `Ready` is automatic (the card is then falsifiable and the title-goal mismatch is resolved). Per [[chain-promotion]] this is the ruled cadence; no re-asking at gate.

### D3 — child 2 goal omits its own stated fallback (skeptic O3, open-untested)

**Objection**: the child's text requires "must still render call/result blocks unpaired if the fields are absent" but the goal's proof (one success + one failing call, both with identity fields) never exercises absent fields, so an implementation that crashes on legacy blocks passes the goal.

**Settling test (runnable)**: render a fixture of legacy blocks without identity fields, assert no throw and sane lines.

**Ruling**: adopt Skeptic. Add a **second** proof fixture to the goal — a legacy-blocks fixture (no `toolCallId`, no `isError`) that exercises the rendering without throwing. The "must still render" clause moves from the dependency note into the goal's proof.

**Grounding**: `parseTranscript` does not preserve either field today (verified by grep); legacy blocks are the realistic case until child 1 lands downstream, and the rendering must not regress on them.

**Reversibility**: low — additive fixture, no implementation work undone.

### D4 — child 2 Intent surface specification (designer, open)

**Objection**: the `Intent` names "inline progress transcript body at width 80" only. The designer requires the Intent name (i) **both surfaces** (inline + modal), (ii) **the literal copy it changes** (`navigator.ts:674` `t.fg("warning", "→ ${b.label}")` for `toolCall`, `:675` `t.fg("muted", "⎿ ${b.label} · ${b.bytes ?? 0}b")` for `toolResult`), (iii) **the collapsed vs expanded state** (no body vs body indented underneath), (iv) **the failure-token choice** (since `warning` is already in use for `toolCall`, a failed result cannot also be `warning` without losing distinction).

**Ruling**: adopt (i), (ii), (iii) as **Intent amendments** (not goal rewrites — goal body stays as one-success + one-failing proof). Reject (i)'s modal half: the modal path is the legacy `navigator.ts:743+ openTranscript` which survives only behind the `navigator.ts:57` guard ([[run-transcripts]]: "superseded by the inline form; modal code path survives only behind the navigator.ts:57 guard, which is the subject of FLLWUP-4"). The epic's surface is the inline path; the modal is the dead code path, not a surface to test against. The desginer's H5 prediction is moot.

For (iv), the failure-token choice: per [[designer]] "Preferences, ranked last" convention, taste without a binding constraint delegates to the designer. The designer's preference is `muted "✗"` (failed-result token), and the token set is drawn from the existing theme (`muted` is already a valid token; "✗" is a glyph not a color — both pass AGENTS.md 9.6). **Endorse** `muted "✗"` as the failed-result token.

**Grounding**: `navigator.ts:674-675` (verified), `council-theme` token set, AGENTS.md 9.6, [[designer]] taste convention.

**Reversibility**: low — token choice is one constant change.

### D5 — child 3 goal overstrict (skeptic O4, closed-red)

**Objection**: "every key the inline progress transcript advertises in its header changes a rendered line" is testably false on correct clamp behavior — `↑` at the top / `↓` at the bottom correctly changes nothing (the `focused` index is clamped at both ends, `navigator.ts:693-697` verified). A correct implementation fails the goal.

**Settling test**: fresh view, `render(80)`, `handleInput("↑")`, `render(80)` — outputs are equal. Goal green requires inequality → fails on a correct implementation.

**Ruling**: amend the goal to read "**every key the header advertises has well-defined behavior** (consumed or forwarded with a defined destination), and the keys that change a rendered line do so." The "well-defined" formulation absorbs EV-8 ruling 2's forward-unhandled policy (consume handled set, `super.handleInput(data)` for everything else) and the boundary-clamp behavior (correct no-op). The "follow and thinking states are visible in the rendered output" half stands — the header line itself changes when `f`/`t` toggles, satisfying visibility.

**Grounding**: `navigator.ts:693-697` clamp logic (verified), EV-8 ruling 2 forward-unhandled policy, EV-8 ruling 3 `-- TREE --` label as the published handled set.

**Reversibility**: trivial — one sentence replace.

### D6 — child 3 Intent surface spec + keymap honesty (designer, open)

**Objection**: the `Intent` must name (i) **both surfaces** (inline + modal), (ii) **the literal copy it changes** (header at `navigator.ts:724`, currently `${title} — ↑↓ move · e expand · t thinking · f follow${this.follow ? "(on)" : ""} · esc back`), (iii) **the focus marker** (reuse `TREE_ROW_MARKER` U+258C per EV-8 ruling 3, not a second signifier), (iv) **which rendered line each of `e`/`t`/`f` changes** (the header line for `t` and `f`; the visibility of the body for `e`), (v) **advertise-vs-remove for `g`/`G`** (currently bound in `handleInput` but not in the header).

**Ruling**: adopt (ii), (iii), (iv) as Intent amendments. Reject (i)'s modal half for the same reason as D4 — the modal is dead code behind `navigator.ts:57`. **For (v)**, the designer's "advertise" option wins — keep the `g`/`G` binding (vim-style jump-to-top/bottom; both Claude Code and Codex ship the same), add `g/G jump` to the header copy. Removing the binding would lose a useful key; advertising it costs two header cells.

**Grounding**: EV-8 ruling 3 (U+258C hard rule); `navigator.ts:724` header copy + `:693-697` binding (verified); Claude Code / Codex precedents for `g`/`G` (cited in intake).

**Reversibility**: trivial — copy change is a string literal; binding change is a branch add/remove.

### D7 — child 4 range misstated (skeptic O5a, closed-red)

**Objection**: "twenty-three rows" max is false. Measured: `computeProgressLayout(40, 11)` (termRows=40, treeContent=11) → `progressLines=23`; `computeProgressLayout(40, 1)` (termRows=40, treeContent=1) → `progressLines=31` (treeLines clamps to 3, `focus-nav.ts:114`). The max over termRows 7..40 is **31**, not 23.

**Settling test**: assert max `progressLines` over termRows 7..40 equals 23 — fails on current code.

**Ruling**: amend the parenthetical scope. Two clean options:

- **(a) drop the parenthetical.** Mirror the epic goal's "from a one-row viewport to a full panel." This is the cheapest-to-reverse call; the proof remains falsifiable on the IFFY (line count never exceeds the granted viewport; one-row case identifies the active block) without a misleading number.
- **(b) update to the correct bound.** "From one row to termRows − 9 rows" (the formula gives `progressLines = max(1, termRows − 9)` in the normal regime, clamped by `PROGRESS_VIEWPORT_FLOOR=3`).

**Pick (a).** The goal's falsifiable claims are the count + content half (D8); the parenthetical scope is descriptive, not load-bearing. Mirroring the epic's vocabulary keeps the document hierarchy clean.

**Grounding**: `focus-nav.ts:99-115` `computeProgressLayout` math (verified); `PROGRESS_CHROME=5`, `PROGRESS_TREE_FLOOR=3`, `PROGRESS_VIEWPORT_FLOOR=3` constants.

**Reversibility**: trivial — single phrase.

### D8 — child 4 count/content split (skeptic O5b, open-untested)

**Objection**: the count half already passes today (`render` slices to `viewportRows`, `navigator.ts:734-737`; inline path re-slices at `:447`); only the content half ("the one-row case identifies the active block rather than a mid-body continuation line") is red.

**Settling test (runnable)**: `new TranscriptView(fixture, theme, "t", 1, …).render(80).length ≤ 1` (passes today) vs single line contains a block label (fails today).

**Ruling**: keep the goal body as bundled (one-row line count + active-block identity). The count half is a tautology that follows from the render-slicing contract and is worth retaining as a regression guard. The content half is the load-bearing claim. No split.

**Grounding**: `navigator.ts:734-737` slice logic (verified); the goal's IFFY formulation already couples count + content — splitting would loosen the falsifiability surface.

**Reversibility**: trivial — either half can be removed if proven tautological in step-9.

### D9 — child 4 Intent mechanism choice (designer, open)

**Objection**: "the one-row case identifies the active block" has three defensible mechanisms — (i) head-only (render only the focused block's composed head), (ii) head + status suffix (composed head plus a trailing token for failure/follow state), (iii) focused-block-first-line (the focused block's first wrapped line). The `Intent` must pick one.

**Ruling**: per [[designer]] "Preferences, ranked last" convention, taste without a binding constraint delegates to the designer. The designer's preference is **(ii) head + status suffix** — the one-row line is the focused block's composed head (from child 2's `Intent`) with the failure token (from D4 — `muted "✗"` for failed, omitted for success) as a trailing suffix. Reuse the composed head from child 2 (single source of truth). Endorse.

**Grounding**: EV-8 ruling 3 single-source-of-truth discipline (signifier reads from one state pointer); child 2's composed head; D4's failure token.

**Reversibility**: trivial — one render branch.

### D10 — missing-child items the Intents must absorb (designer, observational)

The designer surfaced four items owned by no child in the draft. Rulings:

- **(a) Inline-progress empty-state copy** (`" (waiting for output…)"` / `"  (no transcript)"` at `navigator.ts:727`). This is the first thing a person sees for a still-running seat; if it's wrong, the elegant rendering is undermined before the body even appears. **Folds into child 2's `Intent`** — child 2 owns the inline progress body; the empty-state copy is part of the body. The designer's preference is `(waiting for output · idle)`; endorse as taste. Fold-in, not new card.

- **(b) `g`/`G` advertise-vs-remove.** Resolved via D6 (v) — **advertise**.

- **(c) Failure-token choice under-constrained** (`warning` already in use for `toolCall`). Resolved via D4 (iv) — **endorse `muted "✗"`** as taste, drawn from existing token set.

- **(d) Modal surface inherits `blockLines` changes unasserted (H5).** **Out of scope.** The modal is the legacy path (superseded per [[run-transcripts]], survives only behind `navigator.ts:57`); the FLLWUP-4 RPC repair is the active follow-up. This epic does not own the modal.

---

## State ratification summary

| Child | Title (slug) | State | Required before Ready |
|---|---|---|---|
| EV-33 | `transcript-block-fidelity` | **Backlog** (demoted from Ready) | D1 (single-accessor assertion in goal body) + D2 (out-of-order demo fixture in goal body) |
| EV-34 | `tool-call-unit-rendering` | Ready (ratified) | Intent amendments per D4 + D10(a) + D10(c); proof-fixture amendment per D3 |
| EV-35 | `transcript-interaction-model` | Ready (ratified) | Goal-body amendment per D5; Intent amendments per D6 + D10(b) |
| EV-36 | `transcript-one-row-floor-legibility` | Ready (ratified) | Goal-body parenthetical amendment per D7; Intent mechanism amendment per D9 |

## Escalations

None. No card declined, no recorded human decision overturned, no portfolio change, no card goal found to be the defect (the child 1 goal is imprecise, not wrong — its intent is right; the proof is loose; the amendments fold in cleanly).

## Reversibility index

| Ruling | Reversibility |
|---|---|
| Epic goal ratification | trivial (rewrite during Backlog) |
| Child 1 → Backlog | low (amendments are sentence-level; promotion is automatic once transcribed) |
| Child 2 Ready + amendments | low |
| Child 3 Ready + amendments | trivial |
| Child 4 Ready + amendments | trivial |
| D1 (single-accessor) | low |
| D2 (out-of-order demo) | low |
| D3 (legacy-blocks fixture) | low |
| D4 (Intent spec + `muted "✗"`) | low |
| D5 ("well-defined behavior" formulation) | trivial |
| D6 (Intent spec + advertise `g`/`G`) | trivial |
| D7 (drop parenthetical "23") | trivial |
| D8 (keep bundled IFFY) | trivial |
| D9 (head + status suffix mechanism) | trivial |
| D10(a/b/c/d) (absorbed items) | low |

## Sources

- `council/agents/product-owner.md` (role), `council/agents/designer.md` (taste convention), `council/agents/skeptic.md` (evidence terms)
- `vault/wiki/three-wave-decomposition.md`, `vault/wiki/run-transcripts.md`, `vault/wiki/council-job-tree-inline.md`, `vault/wiki/council-theme.md`, `vault/wiki/product-owner.md`, `vault/wiki/designer.md`, `vault/wiki/two-bit-focus-machine.md`
- `vault/raw/2026-08-26-po-ev8-ruling.md`, `vault/raw/2026-08-26-po-ev9-tiny-regime-floor.md`, `vault/raw/2026-09-04-po-epic5-ruling.md`
- `council/cards/EV-7.md` (OV-1, OV-2, EV-7 source), `council/cards/EV-8.md` (EV-8 source + Rulings 1–3), `council/cards/EV-9.md` (Phase 1 inline, EV-9 source + tiny-regime PO ruling)
- `extensions/navigator.ts:233-249` (`firstArgOf`/`activityCopy`), `:664-687` (`blockLines`), `:674-675` (tool head copy), `:693-697` (clamping), `:724` (header copy), `:727` (empty state), `:734-737` (slice)
- `extensions/focus-nav.ts:37` (`TREE_ROW_MARKER`), `:84` (`DISPLAY_FLOOR`), `:99-115` (`computeProgressLayout`)
- `extensions/transcript.ts:30-80` (`parseTranscript` — no `toolCallId` / `isError`)
- `test/ev7-council-tree-widget.test.ts:99` (`/ran bash/` assertion)
- AGENTS.md 9.6 (token-only drawing rule)