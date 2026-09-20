# EPIC-14 Run Ledger

- Run: `/features-deliver EPIC-14` — "Reuse `.council.json` to enable the decisions gate; add a `/council-gate` toggle; check the OpenRouter credential when the gate is on"
- Run id: `2026-09-20T08-59-16-719Z-259999-vjf6un`
- Orchestrator: the human's agent, autonomously
- Phase 0 preflight: **PASS** (`bash council/preflight.sh`, `PASS: preflight clean`); `gh` authenticated; clean tree at `1e5bc29` (2 unpushed decomposition commits, pushed under R2)
- Seats resolved by name: all nine (`owner`, `principal`, `designer`, `skeptic`, `consolidator`, `judge`, `product-owner`, `steward`, `council-runner`), no repo-local overrides
- Build order (R3, dependency order): EV-73 → EV-75 → EV-74 → EV-76 → EV-77; strictly serial, one runner at a time (chain-promotion, job-33)
- Gate state throughout: **off** (`.council.json` has no `gate` section; `mode` removed from the packaged `policy.json`), so every card routed fallback **Deliberate** (`council_route op:route` basis: "gate mode off — no recorded decision") and ran the full-council path
- Merge-time environment: `main` ruleset requires 1 approving review; admin bypass (`current_user_can_bypass: always`) authorized run-scoped by R1

## Phase 1 rulings (binding, recorded on `council/cards/EPIC-14.md`)

- **R1 — merge authorization (all cards).** Run-scoped human authorization for `gh pr merge <PR> --squash --admin --match-head-commit <X>`, `<X>` the exact head SHA criterion 2 was read against. Run-scoped only; a SHA mismatch is a HALT, not a retry.
- **R2 — run-scoped record push.** Run-scoped human authorization for direct card+board state commits and the step-12 record commit to `main` on the admin identity (also covering the two unpushed decomposition commits). Run-scoped only; force-push/rewind/discard forbidden.
- **R3 — scope and order.** Full epic, five children, `EV-73 → EV-75 → EV-74 → EV-76 → EV-77`, chain-promotion not bulk. No card retired/descoped without a steward ruling.
- **R4 — EPIC-13 follow-up disposition.** `FLLWUP-74`→`EV-73` and `FLLWUP-76`→`EV-77` folded; `FLLWUP-71/72/73/75/77/78/79/80` recorded out of scope with per-card reasons. None silently dropped.
- **R5 — operator-facing copy.** Operator copy says "gate" (never "jev"); the echo names the resolved mode and that it applies to dispatches after the echo; the migration `FAIL:` names file + key + `.council.json` `gate.mode`; the preflight `FAIL:` names the decisions gate and both remediations. Exact literals are the seat's.

The human selected: both authorizations, no first-merge pause; "record all 8 out of scope"; the recommended build order; and the copy-vocabulary ratification.

## Merges (five-criteria check satisfied at the checked head for every card)

| Card | Mode | Runner result | PR | Match-head SHA | Merged SHA | Notes |
|---|---|---|---|---|---|---|
| EV-73 | Deliberate | DONE | #92 | `e581a88d8d28ea3957519551e0a72c35be341da5` | `3386faffdb35ec7ac8fac38f435eeaf5373b6cf4` | first autonomous merge; 1 ESCALATION (job-2); 2 verify cycles |
| EV-75 | Deliberate | DONE | #93 | `e996f9af7ee62304daa543385223a3b2781a2d78` | `64bf6ccf7f20cb63c4d1341e42c18e6b442eb50e` | 1 verify cycle; audited test-only ev40 flake fix (see closure note) |
| EV-74 | Deliberate | DONE | #94 | `ce091305fda78d1edbbb40f268953a8239264b02` | `201abbe0ce5aa171fe4915d3be77a977a7cf958e` | no escalation; 3 deliberation rounds |
| EV-76 | Deliberate | DONE | #95 | `06eaa38e86dfeed9e5806e0ba297e2cd66feda13` | `d53db842fe60029e9566df06e139db8ee12dd856` | no escalation; mechanism settled by skeptic probes |
| EV-77 | Deliberate | DONE | #96 | `316a656d13749ef67724309b5dfa687a2d170ff6` | `4fd75cbe7b0b8ca8f84672d9d0b177b6138f379d` | 1 ESCALATION (job-8); 2 verify cycles; final card |

All merged SHAs are ancestors of `origin/main`; the `gates` workflow `SUCCESS` on every checked head SHA (keyed on the `workflow` field) and again on every merged SHA. Every card's owner gates were independently re-run by the orchestrator on the card's head worktree: `bash council/preflight.sh` PASS, `bunx tsc --noEmit` exit 0, full `bun test`, `python3 council/validate.py` clean. Every merge executed with `--match-head-commit <X>` under the R1 admin bypass. No `HALT`, no `RETIRED`, no `Needs Human`, no denied merge.

## Escalations and rulings

| Escalation | Card | Ruling seat | Outcome |
|---|---|---|---|
| Migration copy placement (EV-73 vs EV-75); class-4 scope reading | EV-73 | product-owner (job-2) | Enriched migration `FAIL:` ships on EV-75; class 4 is a `loadGateDecision` refusal on the three `decision.json` strings `decide()` interpolates (`overrides[i].question/.option/.basis`); `weights` keys dropped; questions.json newline-id → follow-up |
| J1 gateFail-tail asymmetry sentence; J2 mechanical pins for a docs card | EV-77 | product-owner (job-8) | J1 sentence IN (migration paragraph, carries the reason); J2 pins ship in `test/`, NOT `council/validate.py`; consumer-repo protection is a separate tooling-class card |
| Epic closure; missing version bump | EPIC-14 | steward (job-10) | EPIC-14 closed `Done` on observed acceptance; version bump **not** a closure condition → `FLLWUP-95` (human `/bump`); surfaced `latest` is a full epic behind `main` |

## Follow-ups filed

All `Backlog`, each its own card, confirmed by the orchestrator at the step-13 gate (none a prose bullet):

- `FLLWUP-81` (`EPIC-14`) — gate-state.ts lenient-reader hygiene (EV-73)
- `FLLWUP-82` (`EPIC-13`) — gate question ids single-line and cross-referenced (EV-73)
- `FLLWUP-83` (`EPIC-13`) — own-key membership for loadGateDecision's mechanical-record check (EV-73)
- `FLLWUP-84` (`EPIC-14`) — own-key membership for loadGatePolicy's unknown-key check (EV-75)
- `FLLWUP-85` (`EPIC-14`) — seed `gate: {"mode":"off"}` in the scaffold `.council.json`; canonical top-level key order (EV-74)
- `FLLWUP-86` (`EPIC-14`) — run-config-stability Phase-0 assertion for `gate.mode` (EV-74)
- `FLLWUP-87` (`EPIC-14`) — concurrent-session write discipline for `.council.json` (EV-74)
- `FLLWUP-88` (`EPIC-14`) — theme-watcher skips the reload when no theme bytes changed (EV-74)
- `FLLWUP-89` (`EPIC-14`) — give `/features-new` a run-start preflight step (EV-76)
- `FLLWUP-90` (`EPIC-14`) — e2e falsifier: stale-preflight consumer reaches the run-start gate-credential FAIL (EV-76)
- `FLLWUP-91` (`EPIC-14`) — wrapped-tool `council_preflight` (spawn-on-pass) single-FAIL mechanical (EV-76)
- `FLLWUP-92` (`EPIC-14`) — `{apiKey:""}` seam semantics vs the resolver's empty-means-absent rule (EV-76)
- `FLLWUP-93` (`EPIC-14`) — consumer-repo-safe protection for wiki-cited code paths (EV-77)
- `FLLWUP-94` (`EPIC-14`) — consider naming the config home in the `/council-gate` status read literal (EV-77)
- `FLLWUP-95` (`EPIC-14`) — cut the EPIC-14 release (bump, tag, move `latest`) — the closure residual

## EPIC-13 follow-up dispositions (R4)

- **Folded:** `FLLWUP-74` → `EV-73`; `FLLWUP-76` → `EV-77` (both `Done`).
- **Out of scope (recorded on the EPIC-14 card with reasons):** `FLLWUP-71`, `72`, `73`, `75`, `77`, `78`, `79`, `80`. All remain `Backlog` under `epic: EPIC-13`.

## Runner usage blocks (verbatim from `council_wait`)

### EV-73
```
[job-1] seat=council-runner state=done stopReason=stop elapsed=59.4m turns=42 tokens=in 647818/out 35709/cR 2085610/cW 0/reason 13117/total 2769137 cost≈$0.1066 (catalogue)
usage  subtree     basis=stream-assistant  turns=155 tokens=in 1509326/out 153582/cR 5423317/cW 0/reason 91364/total 7086225 cost≈$0.3547 (catalogue)
```
(first attempt, ESCALATION; resumed as job-3)
```
[job-3] seat=council-runner state=done stopReason=stop elapsed=73.4m turns=42 tokens=in 881818/out 42563/cR 2346622/cW 0/reason 22291/total 3271003 cost≈$0.1344 (catalogue)
job-3.1 owner      elapsed=26.6m turns=71 tokens=in 782891/out 41012/cR 4886027/cW 0/reason 11765/total 5709930 cost≈$0.1707 (catalogue)
job-3.2 skeptic    elapsed=10.8m turns=36 tokens=in 64791/out 35984/cR 1861888/cW 0/reason 18850/total 1962663 cost≈$0.0353 (catalogue)
job-3.3 owner fix  elapsed=6.0m turns=20 tokens=in 157488/out 4332/cR 259910/cW 0/reason 1716/total 421730 cost≈$0.0202 (catalogue)
job-3.4 skeptic v2 elapsed=6.1m turns=18 tokens=in 33081/out 15850/cR 456192/cW 0/reason 10338/total 505123 cost≈$0.0099 (catalogue)
job-3.5 judge      elapsed=1.0m turns=6 tokens=in 80736/out 3374/cR 116160/cW 0/reason 2038/total 200270 cost≈$0.0169 (catalogue)
usage  subtree     basis=stream-assistant  turns=193 tokens=in 2000805/out 143115/cR 9926799/cW 0/reason 66998/total 12070719 cost≈$0.3873 (catalogue)
```

### EV-75
```
[job-4] seat=council-runner state=done stopReason=stop elapsed=85.0m turns=48 tokens=in 932488/out 29811/cR 1978758/cW 0/reason 10787/total 2941057 cost≈$0.1285 (catalogue)
job-4.1 owner r1       turns=7  tokens=in 143141/out 10218/cR 25675/cW 0/reason 6816/total 179034 cost≈$0.0164
job-4.2 principal r1   turns=11 tokens=in 77657/out 12010/cR 388608/cW 0/reason 8303/total 478275 cost≈$0.0200
job-4.3 designer r1    turns=5  tokens=in 63652/out 10865/cR 124288/cW 0/reason 8369/total 198805 cost≈$0.0396
job-4.4 skeptic attack turns=14 tokens=in 67846/out 28999/cR 623360/cW 0/reason 21410/total 720205 cost≈$0.0150
job-4.5 consolidator   turns=9  tokens=in 40177/out 3038/cR 217088/cW 0/reason 940/total 260303 cost≈$0.0071
job-4.6 owner impl     turns=28 tokens=in 205031/out 15577/cR 666716/cW 0/reason 8144/total 887324 cost≈$0.0351
job-4.7 skeptic verify turns=24 tokens=in 62433/out 22710/cR 1015552/cW 0/reason 11155/total 1100695 cost≈$0.0206
job-4.8 judge          turns=8  tokens=in 45145/out 4322/cR 117216/cW 0/reason 1191/total 166683 cost≈$0.0143
usage  subtree     basis=stream-assistant  turns=154 tokens=in 1637570/out 137550/cR 5157261/cW 0/reason 77115/total 6932381 cost≈$0.2966 (catalogue)
```

### EV-74
```
[job-5] seat=council-runner state=done stopReason=stop elapsed=117.7m turns=57 tokens=in 2050324/out 48756/cR 2976403/cW 0/reason 11573/total 5075483 cost≈$0.2527 (catalogue)
job-5.1 owner        turns=5  tokens=in 78463/out 6584/cR 27136/cW 0/reason 3375/total 112183 cost≈$0.0095
job-5.2 principal    turns=12 tokens=in 101152/out 14112/cR 498176/cW 0/reason 9892/total 613440 cost≈$0.0251
job-5.3 designer     VOID — empty output; re-dispatched once
job-5.4 designer     turns=5  tokens=in 81161/out 12152/cR 137726/cW 0/reason 6246/total 231039 cost≈$0.0472
job-5.5 owner r2     turns=4  tokens=in 62247/out 4896/cR 11136/cW 0/reason 3246/total 78279 cost≈$0.0073
job-5.6 principal r2 turns=6  tokens=in 43800/out 8774/cR 109056/cW 0/reason 6943/total 161630 cost≈$0.0122
job-5.7 designer r2  turns=1  tokens=in 12063/out 3613/cR 128/cW 0/reason 3040/total 15804 cost≈$0.0080
job-5.8 owner r3     turns=3  tokens=in 27379/out 3757/cR 17984/cW 0/reason 2505/total 49120 cost≈$0.0039
job-5.9 principal r3 turns=10 tokens=in 42465/out 11092/cR 212480/cW 0/reason 8378/total 266037 cost≈$0.0137
job-5.10 skeptic r1  turns=34 tokens=in 64672/out 38296/cR 1681920/cW 0/reason 28014/total 1784888 cost≈$0.0326
job-5.11 consolidator VOID — could not find the worktree record; re-dispatched once
job-5.12 consolidator turns=3 tokens=in 10279/out 2988/cR 36736/cW 0/reason 0/total 50003 cost≈$0.0024
job-5.13 owner impl  turns=39 tokens=in 319527/out 26963/cR 1609539/cW 0/reason 12940/total 1956029 cost≈$0.0658
job-5.14 skeptic verify turns=32 tokens=in 61907/out 25603/cR 1323520/cW 0/reason 13259/total 1411030 cost≈$0.0257
job-5.15 judge       turns=5  tokens=in 133302/out 2390/cR 60192/cW 0/reason 1069/total 195884 cost≈$0.0185
usage  subtree     basis=stream-assistant  turns=291 tokens=in 3180855/out 221874/cR 10275684/cW 0/reason 116299/total 13678413 cost≈$0.5581 (catalogue)
```

### EV-76
```
[job-6] seat=council-runner state=done stopReason=stop elapsed=95.3m turns=63 tokens=in 1606342/out 52471/cR 3797147/cW 0/reason 18791/total 5455960 cost≈$0.2287 (catalogue)
job-6.1  owner        r1   turns=10 tokens=in 208477/out 12837/cR 99648/cW 0/reason 9734/total 320962 cost≈$0.0244
job-6.2  principal    r1   turns=26 tokens=in 219620/out 33420/cR 1368704/cW 0/reason 26466/total 1621744 cost≈$0.0571
job-6.3  designer     r1   produced no position (settled empty); re-dispatched as job-6.4
job-6.4  designer     r1'  turns=4  tokens=in 43890/out 10308/cR 75400/cW 0/reason 7583/total 129598 cost≈$0.0301
job-6.5  owner        r2   turns=11 tokens=in 57289/out 10567/cR 191104/cW 0/reason 8812/total 258960 cost≈$0.0118
job-6.6  principal    r2   stalled at turn 15, cancelled; re-dispatched as job-6.8
job-6.7  designer     r2   turns=6  tokens=in 28290/out 10110/cR 571648/cW 0/reason 7281/total 134572 cost≈$0.0264
job-6.8  principal    r2'  turns=5  tokens=in 37839/out 9703/cR 62976/cW 0/reason 8130/total 110518 cost≈$0.0117
job-6.9  skeptic      s4   turns=43 tokens=in 105627/out 31037/cR 2142976/cW 0/reason 19579/total 2279640 cost≈$0.0410
job-6.10 consolidator s5   turns=5  tokens=in 19109/out 6099/cR 83712/cW 0/reason 3644/total 108920 cost≈$0.0046
job-6.11 owner        s8   turns=39 tokens=in 166153/out 20858/cR 1394412/cW 0/reason 8474/total 1581423 cost≈$0.0463
job-6.12 skeptic      s9   turns=26 tokens=in 52989/out 21066/cR 962304/cW 0/reason 11174/total 1036359 cost≈$0.0192
job-6.13 judge        s10  turns=8  tokens=in 44178/out 2808/cR 66528/cW 0/reason 1092/total 113514 cost≈$0.0103
usage  subtree     basis=stream-assistant  turns=274 tokens=in 2859281/out 253721/cR 11423963/cW 0/reason 160833/total 14536965 cost≈$0.6290 (catalogue)
```

### EV-77
```
[job-7] seat=council-runner state=done stopReason=stop elapsed=27.0m turns=26 tokens=in 349052/out 21474/cR 1068683/cW 0/reason 6628/total 1439209 cost≈$0.0571 (catalogue)
usage  subtree     basis=stream-assistant  turns=127 tokens=in 1034098/out 107121/cR 4621010/cW 0/reason 55109/total 5762229 cost≈$0.2815 (catalogue)
```
(first attempt, ESCALATION; resumed as job-9)
```
[job-9] seat=council-runner state=done stopReason=stop elapsed=78.6m turns=53 tokens=in 348422/out 33385/cR 2806660/cW 0/reason 11533/total 3188467 cost≈$0.0919 (catalogue)
job-9.1 owner impl      turns=67 tokens=in 457699/out 49469/cR 5074009/cW 0/reason 29912/total 5581177 cost≈$0.1474
job-9.2 skeptic cycle 1 turns=83 tokens=in 109260/out 80206/cR 6731264/cW 0/reason 58913/total 6920730 cost≈$0.1185
job-9.3 owner fix       turns=14 tokens=in 92516/out 5037/cR 256332/cW 0/reason 2322/total 353885 cost≈$0.0145
job-9.4 skeptic cycle 2 turns=19 tokens=in 34093/out 12241/cR 453888/cW 0/reason 5564/total 500222 cost≈$0.0096
job-9.5 judge           turns=9  tokens=in 36097/out 3205/cR 165120/cW 0/reason 1420/total 204422 cost≈$0.0148
usage  subtree     basis=stream-assistant  turns=245 tokens=in 1078087/out 183543/cR 15487273/cW 0/reason 109664/total 16748903 cost≈$0.3966 (catalogue)
```

Ruling-seat dispatches: product-owner jobs 2, 8; steward job 10.

## Run closure

- All five EPIC-14 children merged to `main` with the `gates` workflow `state: SUCCESS` on each checked head SHA and each merged SHA; final suite **1286 pass / 5 skip / 0 fail**; `python3 council/validate.py` → `All council artifacts valid`.
- `steward` (job-10) ruled **EPIC-14 closed `Done`** on observed acceptance; the epic card and its board line moved to Done beside its five children.
- `package.json` at **`0.28.0` — no bump; release pending.** The steward ruled the version bump **not** a closure condition (EPIC-7 precedent) and routed it to the human's release path as `FLLWUP-95`. Material fact surfaced: the moving `latest` tag is a full epic behind `main` (`latest` at v0.19.0; v0.20.0–v0.28.0 untagged).
- No `HALT`, no `RETIRED`, no `Needs Human`; two product-owner escalations and one steward closure ruling, all resolved in-run. One intermediate escalate-and-resume each on EV-73 and EV-77.
- **Scope note:** EV-75's PR carried an audited, test-only fix to `test/ev40-parent-retry.test.ts` (closed top edge `<= 7500`), overlapping `FLLWUP-63` (`epic: EPIC-9`), which additionally requires a seeded adversarial case at `rand ≥ 0.9999`; `FLLWUP-63` is left `Backlog`/open. No production threshold changed.
- Process note for the harness: the EV-73 and EV-75 runners left their board/card record edits uncommitted in the main checkout (identical to the branch); the orchestrator cleared them before each fast-forward. EV-76 and EV-77 did not.