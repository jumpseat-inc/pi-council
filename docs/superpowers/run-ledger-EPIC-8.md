# EPIC-8 Run Ledger

- Started: 2026-09-15
- Orchestrator `/features-deliver EPIC-8`
- Phase 0 preflight: **PASS** (`bash council/preflight.sh`, zero `FAIL:`); `gh` authenticated; working tree at `7850f3c`
- Seats resolved: all required seats present packaged (`owner`, `principal`, `designer`, `skeptic`, `consolidator`, `judge`, `product-owner`, `steward`, `council-runner`), no repo-local overrides
- Build order (dependencies forced by the cards, R-ORDER): EV-33 -> EV-34 -> EV-35 -> EV-36

## Phase 1 rulings (binding, recorded on the card faces)

Recorded human decisions, immutable for the run and binding on every seat, `steward` included.

- **R-ORDER** — build order EV-33 -> EV-34 -> EV-35 -> EV-36; a card starts only after its predecessor's merge SHA is on local `main`.
- **R-READY** — EV-33 promoted to `Ready` (its D1/D2 goal amendments were transcribed at write time).
- **R-COPY** — composed tool-call unit `→ <Tool>  <primary-arg>`, `muted "✗"` suffixed on failure, result body indented 2 spaces, empty inline state `(waiting for output · idle)`; EV-36's one-row line reuses the composed head plus the failure suffix.
- **R-KEYMAP** — EV-35 header copy `<title> — ↑↓ move · e expand · t thinking · f follow(on) · g/G jump · esc back`; `g`/`G` advertised, not removed.
- **R-MARKER** — focus signifier `TREE_ROW_MARKER` (U+258C); no new glyph.
- **R-MODAL** — full-screen modal transcript out of scope (legacy, guarded at `navigator.ts:57`, owned by FLLWUP-4).
- **R-FOLLOWUP** — a fold-in is ruled by `product-owner`; a genuinely new follow-up card is confirmed by `steward`, written mid-run citing the ruling.
- **R-GATES** — owner gates `bash council/preflight.sh`, `bunx tsc --noEmit`, `bun test`, `python3 council/validate.py`; integration test gated behind `COUNCIL_INTEGRATION=1`.
- **R-MERGE** — deterministic five-criteria check replaces the human merge gate; merge `gh pr merge <PR> --squash --match-head-commit <SHA>`; the first merge announced in-line and watched.
- **R-ESCALATE** — judgment routes to `product-owner`, escalating to `steward`; the authority map's rows are exhaustive.

### First-merge supervision

- The run's first autonomous merge (EV-33, PR #47) was announced in-line before the runner dispatched and executed under the five-criteria check with the head SHA pinned — watched by the human, not merely reported (per `vault/wiki/deterministic-merge-check.md`).

## Card log

| Card | Runner result | PR | Match-head SHA | Merged SHA | Five criteria | Follow-ups |
|---|---|---|---|---|---|---|
| EV-33 | DONE (1 escalation) | #47 | `544bedbb64fba7addee3fed83f53ef50c9564c60` | `186c04dce68f3a27326ef1ee6ec724c0c091d1df` | YES — gates green at head; `gates` workflow SUCCESS on head + merged SHA; Skeptic cycle-2 passes (O7 waived per ruling, 7 others closed-green); judge PASS; no Needs Human | none |
| EV-34 | DONE (1 escalation) | #48 | `eb8ed129f17425bf0d7b590a0fb88445bf393e96` | `72351780e2f9974926404d26f9679b385d2f1e5f` | YES — gates green at head (`bun test` 676/2/0); `gates` SUCCESS on head + merged SHA; Skeptic passes (12 closed-green); judge PASS; no Needs Human | FLLWUP-36 filed; Item B (out-of-order `toolResult`) dropped as permanent residual |
| EV-35 | DONE (2 escalations) | #49 | `3b374382112a54c06ff251b8fcabd728c42ad3f6` | `85db7a689c8ab7df1fb87f3843d5465fd3d7d8e8` | YES — gates green at head (`bun test` 694/2/0); `gates` SUCCESS on head + merged SHA; Skeptic does-not-block (all closed-green, 1 verify cycle); judge PASS; no Needs Human | FLLWUP-37/38/39 filed; Item 2 (`t`-toggle cursor stability) dropped as permanent residual |
| EV-36 | DONE (1 escalation) | #50 | `abe2712bc4617464fa39eb49ece0dfe1495ffe63` | `6b858c9228cdf9ef136b86aca90ca8e0f077ca85` | YES — gates green at head (`bun test` 704/2/0); `gates` SUCCESS on head + merged SHA; Skeptic does-not-block (all closed-green, 1 verify cycle); judge PASS; no Needs Human | none |

All four merged SHAs verified ancestors of `origin/main`. No `HALT`, no `RETIRED`, no `Needs Human`.

## Escalations and rulings

| Escalation | Card | Ruling seat | Outcome |
|---|---|---|---|
| EV-33 acceptance bullet 3 vs bullet 4 (header consumer) | EV-33 | product-owner (job-6) | Fold-out: export the accessor; bullet 3 amended; header consumer is EV-34's scope. Goal stood, no steward escalation |
| EV-34 step-13 follow-ups (dead `blockLines`; out-of-order result) | EV-34 | steward (job-9) | FLLWUP-36 confirmed; Item B dropped as permanent residual; no promotion |
| EV-35 Q1–Q5 (fold-in; header pin; follow-off copy; EV-9 test edit; `t`-stability) | EV-35 | product-owner (job-12) | Q1 fold-in (no goal change); Q2 no pin (defer to EV-36/FLLWUP); Q3 presence/absence; Q4 T9 narrowing + positive assertion; Q5 visible-index scheme. No steward escalation |
| EV-35 step-13 follow-ups (overflow header; `t`-stability; width clamp; view leak) | EV-35 | steward (job-14) | FLLWUP-37/38/39 confirmed; Item 2 dropped as permanent residual |
| EV-36 Q1–Q4 (one-row subject under follow; Q5 reach; divergence; clamp site) | EV-36 | product-owner (job-17) | Q1 = R3 (read-only effective index); Q2 Q5 reaches R2; Q3 divergence accepted as the card's comprehension rule; Q4 clamp at `unitLines:723`. No steward escalation |
| Epic closure | EPIC-8 | steward (job-19) | EPIC-8 CLOSED `Done`; four follow-ups ride `Backlog` unpromoted; two permanent residuals ride with the epic; no version bump as a closure condition |

## Follow-ups filed

All `Backlog`, `epic: EPIC-8`:

- `FLLWUP-36` — Remove the unreachable pre-EV-34 transcript renderer left in TranscriptView
- `FLLWUP-37` — Keep the progress keymap header visible when follow-mode content overflows the viewport
- `FLLWUP-38` — Clamp the inline progress transcript header to the granted render width
- `FLLWUP-39` — Dispose the replaced transcript view when the inline progress surface switches sessions

## Accepted permanent residuals (no card)

- Out-of-order `toolResult` (a result ordered before its `toolCall` renders standalone and folded) — accepted by `steward` (job-9) on reachability.
- `t`-toggle cursor stability (the visible-index scheme can move the focus target when `t` reveals thinking) — accepted by `steward` (job-14).

## Runner usage blocks (verbatim from `council_wait`)

### EV-33

```
[job-5] seat=council-runner state=done stopReason=stop elapsed=21.0m turns=35 tokens=in 420663/out 21261/cR 1459456/cW 0/reason 8623/total 1901380 cost≈$0.0802 (catalogue)
[job-7] seat=council-runner state=done stopReason=stop elapsed=7.7m turns=29 tokens=in 210047/out 13502/cR 903808/cW 0/reason 3498/total 1127357 cost≈$0.0423 (catalogue)
```

### EV-34

```
[job-8] seat=council-runner state=done stopReason=stop elapsed=22.3m turns=47 tokens=in 419897/out 53583/cR 2764800/cW 0/reason 32099/total 3238280 cost≈$0.1034 (catalogue)
[job-10] seat=council-runner state=done stopReason=stop elapsed=2.0m turns=18 tokens=in 63468/out 12484/cR 676352/cW 0/reason 6140/total 752304 cost≈$0.0190 (catalogue)
```

### EV-35

```
[job-11] seat=council-runner state=done stopReason=stop elapsed=29.5m turns=32 tokens=in 283484/out 63885/cR 2764032/cW 0/reason 14827/total 3111401 cost≈$0.0891 (catalogue)
[job-13] seat=council-runner state=done stopReason=stop elapsed=23.0m turns=53 tokens=in 373733/out 40936/cR 3966336/cW 0/reason 15798/total 4381005 cost≈$0.0925 (catalogue)
[job-15] seat=council-runner state=done stopReason=stop elapsed=2.2m turns=16 tokens=in 181721/out 10279/cR 730496/cW 0/reason 3092/total 922496 cost≈$0.0356 (catalogue)
```

### EV-36

```
[job-16] seat=council-runner state=done stopReason=stop elapsed=25.9m turns=40 tokens=in 686392/out 61961/cR 2233344/cW 0/reason 19721/total 2981697 cost≈$0.1468 (catalogue)
[job-18] seat=council-runner state=done stopReason=stop elapsed=28.7m turns=61 tokens=in 480929/out 44190/cR 5044352/cW 0/reason 21085/total 5569471 cost≈$0.1138 (catalogue)
```

### Ruling-seat dispatches

```
[job-6]  seat=product-owner  elapsed=0.7m turns=1  tokens=in 11254/out 6986/cR 197/cW 0/reason 6606/total 18437 cost≈$0.0118
[job-9]  seat=steward        elapsed=1.5m turns=10 tokens=in 40706/out 9680/cR 264192/cW 0/reason 6777/total 314578 cost≈$0.0127
[job-12] seat=product-owner  elapsed=5.6m turns=15 tokens=in 85550/out 19865/cR 683648/cW 0/reason 14857/total 789063 cost≈$0.0905
[job-14] seat=steward        elapsed=2.3m turns=13 tokens=in 124339/out 17627/cR 419584/cW 0/reason 13815/total 561550 cost≈$0.0305
[job-17] seat=product-owner  elapsed=0.9m turns=7  tokens=in 85884/out 10897/cR 261697/cW 0/reason 7474/total 358478 cost≈$0.0545
[job-19] seat=steward        elapsed=1.9m turns=15 tokens=in 124305/out 10266/cR 424192/cW 0/reason 6773/total 558763 cost≈$0.0261
```

## Run closure

- All four EPIC-8 children merged to `main` with the `gates` workflow `state: SUCCESS` on each merged SHA: EV-33 `186c04d` (#47), EV-34 `7235178` (#48), EV-35 `85db7a6` (#49), EV-36 `6b858c9` (#50).
- `steward` (job-19) ruled EPIC-8 **closed `Done`** on observed acceptance, ending the run; EPIC-8 frontmatter and board moved to `Done` beside its children.
- `python3 council/validate.py` → `All council artifacts valid`.
- No `HALT`, no `RETIRED`; four `product-owner` escalations and two `steward` follow-up confirmations, all resolved in-run. No version bump imposed as a closure condition.