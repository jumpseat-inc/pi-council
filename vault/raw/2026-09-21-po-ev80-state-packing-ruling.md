---
slug: po-ev80-state-packing-ruling
card: EV-80
epic: EPIC-10
seat: product-owner
step: 6
date: 2026-09-21
kind: ruling
supersedes: null
---

# EV-80 — product-owner ruling on the two open-judgment items (board cap + Done entry shape; the cards-dir convention)

**Seat:** `product-owner`, ruling-only. **Run:** autonomous `/features-deliver`
over EPIC-10, card EV-80 (`Deliberating`, record `5694958…` on `main`, mode
`Deliberate`). **Inputs:** the card's deliberation record through step 5, the
`consolidator`'s two routed items, the `skeptic`'s O1 (closed-red) and O3
(open-untested, ruled judgment), `council/cards/EPIC-10.md`,
`council/cards/EV-78.md`.

Neither item is settled by a test, and neither changes what the card is *for*:
the goal names neither the caps nor the Done entry shape nor the card
directory, so both rulings are card-level and neither is an amended-goal act.
No recorded human decision is reversed. **No escalation is required** — see
§Escalation test for the one sub-variant that would have been.

## Q1 — the board cap: remedy (A), the Done titles stay

**Ruled: (A).** The board section keeps `{id, title, state}` for every entry,
open entries additionally carrying `goal` as settled, and the board cap is
raised from 16,000 to **22,000** measured tokens. The candidate cap (2,000)
and the siblings cap (6,000) are **unchanged** — the board is not funded from
either sibling cap. Consequences, all binding on the spec:

1. Caps sum `2,000 + 22,000 + 6,000 = 30,000 < 32,000`, so the packaged
   `council/gate/policy.json` budget is **not touched**, and round 3's
   caps-sum invariant keeps its exact agreed form (sum < `gateStateBudgetTokens`
   read through the loader, never a literal). The consolidator's blocker for
   (A) — "~27,000 makes the sum ~35,000, exceeding the budget" — priced only
   the largest-headroom variant of (A). A 22,000 board cap clears today's
   measured 16,277 with ~35% headroom while staying inside the existing
   envelope.
2. **The per-section headroom probe is mandatory and must measure through the
   packer itself**, not through test-local arithmetic. The measured tokens of
   each of the three sections must be asserted ≤ its cap. This is the O1
   lesson stated precisely: the owner's round-3 figures were "two independent
   undercounts", so a second measurement path is the defect class, not a
   cross-check.
3. **The probe's fixture is this repo's own `council/board.md`, read
   through `PKG_ROOT`** (a read-only pin over packaged data — the same shape
   as the caps-sum invariant the seats already agreed, and continuous with
   `test/ev77-gate-docs.test.ts` / `test/fllwup25-agents-page.test.ts`, which
   pin this repo's own artifacts). A synthetic fixture mirroring "representative
   board shape" cannot catch O1's class: what broke was the real board, and
   only a probe over the real board turns a future silent Done-cut into a loud
   red test. The AGENTS.md tmpdir convention governs tests that *write* to the
   repo filesystem; this probe writes nothing. Budget resolution stays
   mode-independent on this path because the packaged `policy.json` carries
   `gateStateBudgetTokens` explicitly, so the EV-64 absence arm cannot fire.
4. If (A)'s bind ever arrives for a consumer repo whose board exceeds the cap,
   the sacrifice must stay visible exactly as already settled: a
   `FollowupDropRecord` with `truncated: "cap"` and the kept count. The
   `sources` record and the drop record are what make a thin pack honest, and
   neither is affected by this ruling.

**Why (B) loses.** `gate-state.ts`'s own header states the standard this seat
ruled on: *"thin state produces confident wrong answers rather than visible
uncertainty."* Id-only Done entries are thin state of the worst kind — `EV-3`,
`FLLWUP-21`, `EPIC-9` carry no answerable content to a System One model
reading a JSON array, so `alreadyDone` degrades to a guess, and the guess the
model will make is "no". Under the shipped
`council/gate/followup/decision.json`, `alreadyDone? yes → Drop` is a hard
override and `alreadyDone: yes` is a counted option, so a section that can only
answer "no" removes one of the three questions from the decision — and the
problem EPIC-10 exists to fix is precisely that already-resolved work keeps
getting filed as new cards. (B) is cheaper per call (~2,172 fewer tokens per
candidate) and buys ~12% cap headroom; it pays that with the evidence the
question needs, permanently, in the ordinary case, to avoid a cut that
happens only under a bind. Cost is not the tiebreaker: the estimator
over-counts ASCII prose by +45.8% against the `o200k_base` reference
(`2026-09-20-po-ev64-budget-default-and-estimator-ruling` Q2), and board
titles/goals are prose, so (A) errs toward cutting early rather than
overrunning the transport — and EV-81's fail-closed transport resolves any
overrun toward the human anyway.

**Why (A) is the durable half of the pair, not merely the roomier one.** Any
fixed cap eventually binds; the question is what a bind sacrifices. Board
entries cost ~31.6 tokens each against open goals at ~122.6 each, so the
board section's growth is dominated by the *open* set — which (B) does not
shrink at all. Dropping Done titles therefore does not buy durability; it buys
one fewer epic before the same wall, on the far side of which (B) has no lever
left that preserves any `alreadyDone` evidence.

**Named caveat, not to be argued away in the spec.** The packer packs the board
in file order (settled), and this repo's `## Done` column happens to be
newest-first, so today's tail-cut sacrifices the *oldest* Done entries (EV-1…
EV-16-era). That is a fact about this board's current ordering, not a property
of the mechanism: `council/procedures/board-create-card.md` §6 prescribes no
positional rule inside a column. So (A) may be justified as "the kept entries
are the ones with real evidence", never as "the cut only drops stale work".

## Q2 — the cards directory: option (a), the pair travels with the board

**Ruled: (a).** Open-card goals resolve at
`path.join(path.dirname(boardPath), "cards", "<id>.md")`. `repoRoot` remains
the anchor for the policy load and for nothing else in the board-pair
resolution.

**The load-bearing reason is not the doctrine the skeptic framed it on — it is
which convention can be silently wrong.** Both conventions are byte-identical
in production, so the only difference is behaviour when `boardPath` is
relocated. Under (b), a relocated board reads goals from a card set under
`repoRoot` — possibly a *different* card set, whose files exist and parse, so
the adopted degrade path (`goal: ""`, surfaced in
`sources.cardsMissingGoal`) never fires. That is mismatched evidence packed as
if it were matched: the confident-wrong-answer class, and the one class the
`sources` record cannot see. Under (a) the board and its cards move together,
so a wrong pairing needs someone to deliberately split them across two
directories. Fewer silent-wrong states wins.

The shipped-precedent objection to (a) does not hold on inspection:
`gate-route-tool.ts:73` anchors a *relative* `cardPath` at `repoRoot`, but
there a caller that knows which card it means supplies the path, and
`repoRoot` is only a relative-path base. The packer has no such caller — it
derives every card path from board ids, so the only question is which explicit
input it derives from, and deriving from the sibling half of the same
`council/`-anchored pair is the reading that matches how `validate.py` treats
BOARD and CARDS: one fixed pair under `council/`.

Both positions were coherent; (a) is ruled on the mismatch-visibility ground
above, with the explicit-input doctrine as the secondary argument.

## Binding obligations carried to the spec (both items)

1. Board cap 22,000; candidate 2,000; siblings 6,000; caps-sum invariant kept
   in its agreed form, read through the loader.
2. Per-section headroom probe measured **through the packer**, against this
   repo's packaged `council/board.md` resolved via `PKG_ROOT`, asserting each
   section's measured tokens ≤ its cap.
3. Done entries carry `{id, title, state}` — pinned by a test, so the shape
   cannot drift back to `{id, state}` by edit.
4. Cards-dir resolution pinned by the discriminating fixture the skeptic
   named: a relocated `boardPath` whose sibling `cards/` carries a distinctive
   goal, with a *different* goal at `<repoRoot>/council/cards/`; assert the
   packed goal is the dirname-derived one. The R0 headline test's fixture
   shape follows this single relocated pair.
5. The module comment states the pair rule in one line ("the board and its
   cards are one resource; the cards dir is derived from `boardPath`, never
   from `repoRoot`") so a later reader does not "correct" it back.

## Escalation test applied

Not triggered. The ruled form of (A) leaves `council/gate/policy.json`'s
`gateStateBudgetTokens: 32000` exactly as shipped, changes no constant in the
card gate's `SECTION_CAPS`, and keeps `gateStateBudgetTokens` as the single
budget for both domains (EV-78 point 10). What *would* have been a packaged
contract — raising the shared 32,000 budget, or funding the board by shrinking
the card gate's own caps — is ruled out by this decision, not deferred. If the
board ever grows past a re-derived followup cap in a way that requires moving
the *shared* budget, that is a `steward` act and arrives as its own card.

## Named, not carded (temporary, each with a home)

1. **Board growth past the cap.** Today's board measures 16,277 against 22,000.
   It will bind. Home: obligation 2's tripwire fires first, and the remedy on
   the far side is packing a *recency window* of Done entries (dropping whole
   stale entries, never their titles) — a future card, expressly **not** a
   fold-in into EV-80: EV-80's goal is packing what the board and its open
   cards hold, and a recency window is a different claim about that board.
   The step-13 follow-up pass of this card's run should file it.
2. **Per-candidate board cost.** Each follow-up decision carries the whole
   board section, so run cost scales with candidate count. Home: the same
   recency-window card; recorded here so the trade is not rediscovered as a
   surprise after the first `advisory` run's usage block.
3. **Unconventional within-column ordering** (§Q1 caveat). Home: if a future
   board-compaction card needs the tail order to mean something, it must pin
   the ordering convention itself; not EV-80's surface.

## Related

- `council/cards/EV-80.md` — the card ruled on (record steps 1–6)
- `council/cards/EV-78.md` — step-6 thresholds ruling, the card-level-ruling shape this follows
- `vault/raw/2026-09-21-po-epic10-recut-ruling.md` — R9 (the dedup pass is unconditional), R5
- `vault/raw/2026-09-20-po-ev64-budget-default-and-estimator-ruling.md` — the budget's semantics, the estimator's direction, caps-sum-as-bound
- `vault/wiki/metered-deliberation-routing.md` — the shipped packer this card mirrors
- `vault/wiki/engineering-board.md` — the fold-in test, goal immutability, docs-card `test/` pins
- `extensions/gate-state.ts` header — "thin state produces confident wrong answers"
