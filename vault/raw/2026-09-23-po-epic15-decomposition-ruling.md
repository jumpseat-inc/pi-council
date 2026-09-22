# PO ruling — EPIC-15 wave 3 (usages cache-ordering)

Date: 2026-09-23. Wave 1 `principal` (job-1), wave 2 `skeptic` (job-2, closed-red
evidence), `designer` (job-3). This ruling settles disputes 1–7 on the ledger,
amends `BUG-2` and `FLLWUP-105`, adds `FLLWUP-106`, and escalates one portfolio
question to [[steward]].

## Intake

The human reported the `/usages` tool's non-fatal cache-write warning and
proposed that `/council-init` "also create the necessary directory." The
intake's *intent* — no warning, `.cache.json` left behind, cheap reruns — is
what is being served here; the proposed mechanism is a suggestion in a bug
report, not a recorded board decision, so it does not bind this ruling. The
draft-then-confirm gate remains the human's veto on the resulting card text
([[engineering-board]]).

## Verification performed by this seat (not taken on report)

- `council/skills/usages/scripts/usages.py`: `save_cache` (463–468) writes
  `p.with_name(p.name + ".tmp-<pid>")` with no parent mkdir; `main` calls it at
  744 inside `except OSError` → `log("usages: could not write cache: …")`, and
  calls `ensure_out_dir` (654–660, `mkdir(parents=True, exist_ok=True)` +
  `*` gitignore) only at 792. Ordering claim: **true**.
- `log()` writes to **stderr only** (38–39); the cache failure is never appended
  to `report["limitations"]`, and `render_markdown`/`human_summary` print
  limitations only. So a non-missing-dir cache failure is invisible in both
  artifacts. Designer P1: **true by code reading**.
- `resolve_exact` (481–534) increments `hits` only for gids already in
  `cache["generations"]`, and `gen_rows` come from harvested transcripts. A fresh
  empty agent dir ⇒ `gen_rows = ∅` ⇒ `hits ≡ 0`; a closed port adds nothing.
  Skeptic O2: **true**.
- `test/usages.test.ts`'s `runTool` (42–48) always injects `--out-dir <root>/out`
  and `--cache-file <root>/cache.json`, so the default in-dir cache path is
  never exercised. Existing fixtures already provide what O2's remedy needs:
  `sessionFile`/`assistant` builders and the T-U4 `Bun.serve` analytics/activity
  stub. Test ids T-U1…T-U6 and T-USK1 are taken; **T-U7/T-U8** are free.
- `council/procedures/usages.md` `**Report.**` addresses the printed summary and
  `!` limitation lines only — it neither routes nor forbids non-`!` stderr.
  Designer P2: **true**.
- `council/validate.py` docstring: `goal:` single line, last key, colon-space
  inside the value is lossless (FLLWUP-43/51). The amended goals below name the
  `usages: could not write cache:` literal directly and parse.

## Rulings

1. **O1 — FOR the discriminator, in the goal and the epic gate.** The skeptic's
   probe (pre-seed the output dir, leave `usages.py` untouched) turned the whole
   drafted epic observable green. A gate that the symptom patch passes is not a
   gate. `BUG-2`'s goal and the epic's `## Acceptance` both now carry the
   `--out-dir <fresh>` case, and the epic card records the closed-red probe as
   the reason it exists. Dissent: `principal` kept the discriminator in acceptance
   prose below the gate.
2. **O2 — AMEND, do not drop.** The rerun bullet is the *only* assertion of the
   intake's user value ("reruns will not be cheap"), so it is kept and its
   fixture is fixed: seeded session + live stub, closed port forbidden,
   `cache.hits === 1`. Dissent: dropping it (rejected — deletes the value
   claim), and the drafted "closed port is fine" fixture (unsatisfiable).
3. **O3 — AMEND the goal to the remediation copy.** `FLLWUP-105`'s deliverable
   is now one sentence in the *packaged* procedure — the stale copy self-signals
   with the warning, and the packaged procedure is the surface that already
   reaches every consumer (the EPIC-14 reach rule in
   [[non-clobbering-scaffold]]) — plus the exact delete-and-re-run-`/council-init`
   commands. The "build a refresh mechanism" reading is removed from this card
   and escalated (below). Dissent: `skeptic` offered "name a mechanism **or** the
   remediation copy"; this takes the latter. `principal`'s decision-proof goal is
   rejected.
4. **`BUG-2` state — `Ready`, after amendment.** The skeptic's
   "unsupported as drafted" is accepted as to the draft; the two defects it
   named (vacuous antecedent, ungreenable bullet) are closed in text.
5. **Cache-health `.md` row — DECLINED for EPIC-15, with a re-card trigger.** It
   fails the fold-in test (not needed for `BUG-2`'s goal as written —
   [[2026-09-21-po-ev73-step6-ruling]]) and, as a permanent row on every report,
   it signposts a failure class `BUG-2` largely removes. Precedent for
   drop-with-trigger: [[2026-09-18-po-fllwup56-step13-ruling]],
   [[2026-09-19-po-fllwup59-step13-ruling]]. **Trigger:** after `BUG-2` merges,
   any consumer-visible cache-write failure whose parent directory *does* exist
   (permissions, disk full, read-only mount) is carded immediately. Dissent:
   `designer` (preferred the fold-in) — recorded, and the diagnostic gap is real;
   it is deferred, not refuted.
6. **Procedure copy forbidding confabulated stderr framing — CARDED as
   `FLLWUP-106`, `Backlog`.** Not a fold-in (it changes no `BUG-2` observable),
   and not dropped: the intake itself is the evidence that the seat invented both
   a `⚠️` prefix and a causal story the procedure never authorized. Placed under
   EPIC-15 rather than free-floating because it is the same person-facing
   surface. Dissent: `designer` preferred an out-of-epic follow-up.
7. **Epic `## Acceptance` ordering — designer wins.** The in/out-of-scope
   statement for an already-initialized install is now bullet 1. Dissent:
   `principal` placed it last.

## Escalation to steward (not ruled here)

**Should `/council-update` own a refresh path for `/council-init`-copied
payloads outside `council/scaffold/` (the usages skill)?** This is a portfolio
question, not a card-level one: it would widen the single sanctioned
non-clobbering exception (AGENTS.md convention #6) to a new resource class, and
it presses against two settled records — D1, the human's binding decision that
the skill sits outside the scaffold tree "so no classification churn"
([[2026-09-21-usages-design]]), and FLLWUP-50 **R6**, which fenced
seat/copy-triggered refresh out of v1 with "lifting the fence is a follow-up"
([[2026-09-19-po-fllwup50-step6-ruling]]). `FLLWUP-105` is therefore scoped to
the remediation route that is compatible with both, and its acceptance forbids
adding the skill to `TOOLING_FILES` on this card. If steward lifts the fence,
that is a new card, not a fold-in.

## What this epic owes the person who filed it

They will run `/usages` in a repo whose copy still warns. `BUG-2` alone does
not reach them; the epic is not Done until `FLLWUP-105` lands, and that
dependency is stated in the epic card's first bullet rather than left to the
run ledger.
