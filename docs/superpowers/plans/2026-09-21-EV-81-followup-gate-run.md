# EV-81 implementation plan — followup gate run, fail-closed to the human confirm gate

Spec (authoritative): `docs/superpowers/specs/2026-09-21-EV-81-design.md`.
Card: `council/cards/EV-81.md`. Worktree: `.worktrees/ev-81`, branch
`ev-81-jev-fail-closed`, base `8df2774` (main). All work happens in the
worktree; the main repo's branch state is never touched.

## Steps

1. **Red-at-base falsifier first** (`test/ev81-sideprobability-range.test.ts`):
   imports only pre-existing `extensions/gate.ts` + `gate-run.ts` +
   `gate-ledger.ts`, so it runs at the base sha. Asserts the NEW behavior:
   `decideFollowup` throws on a weighted choice answer with
   `probabilities{no:1.5}`; shipped `decide()` throws on the same; a
   `runGate` call carrying the out-of-range probability records
   `invalid-response` → `Deliberate`. Plus frozen absent/non-numeric → 0
   contributions (green at both). Run in a detached base worktree with this
   file transplanted: record raw red per-failure output (seven-field record
   per `vault/wiki/red-base-evidence.md`, carried in the PR description).
2. **`extensions/gate.ts`** — `sideProbability` choice branch: a finite value
   outside [0,1] throws naming question id, option, value, and the expected
   [0,1] range; message domain-neutral from birth. Noul branch and
   absent/non-numeric → 0 untouched.
3. **`extensions/gate-run.ts`** — fenced section: `runFollowupGate(state,
   questions, policy, decisionPolicy, opts)` + `FollowupRunResult` +
   `RunFollowupOpts` (no `basisSuffix`). Mirrors `runGate`: guards (off /
   model pin / endpoint never-path / noul join), credential expression
   byte-identical to preflight, `transportFailure`/`failRun` reused
   in-module, failure decision a literal `{disposition:"File", basis:"gate
   call failed: <reason>"}`, ledger lines via `appendGateCall` with
   `policyVersion: decisionPolicy.version`, `questionSetVersion:
   questions.version` (deliberate divergence, commented). Type-only import
   of `FollowupState`.
4. **`extensions/gate-transport.ts`** — amend the stale single-consumer
   header claim (two runtime consumers, one-way edge intact).
5. **`test/ev81-followup-run.test.ts`** — the 11 obligations' green half:
   fixture matrix (network/timeout/http-500/http-400-refusal/garbage/
   no-api-key/out-of-range → File), guard parity (zero POSTs, zero lines),
   policyVersion/questionSetVersion asserted against
   `loadFollowupDecision`/`loadFollowupQuestions` versions, pin request
   assertions (imported `GATE_ENDPOINT`/`GATE_PINNED_MODEL`), disjointness +
   mixed-fixture `resolveRoute`, one-line-per-call posture + directory
   snapshot diff, off ordering, success arms, EV-80 assignability pin gains
   a real consumer.
6. **`package.json`** — version 0.30.0 → 0.31.0 (minor: new followup
   orchestrator + helper behavior change).
7. **Gates, in order**: `bunx tsc --noEmit` → full `bun test` →
   `python3 council/validate.py` → `bash council/preflight.sh`. Record real
   outputs.
8. Commit (`feat(gate): EV-81 ...`), push, open PR to `main` carrying the
   red-at-base record, gate outputs, and the deliberate-divergence note.
   Do NOT touch `council/board.md`, `council/cards/`, `vault/`, or
   `docs/superpowers/specs/`.

## Non-goals (spec-pinned)

runGate's policyVersion writer fix (step-13), FLLWUP-96, any render/emitter/
card-write surface, the end-to-end "reaches step 13" arm (EV-84).
