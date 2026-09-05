# FLLWUP-21 — Env-split registration contract: two-pole headless verification + devDependency pin

Card: FLLWUP-21 · Epic: EPIC-6 · Date: 2026-09-05 · State at spec: Deliberating (steps 2–6 closed; Phase 1 rulings R-1/R-2 binding, appended to the card face verbatim).

## 1. What the deliberation settled (context, not an open design space)

- **There is no 0.84.3→0.85.0 extension-load regression.** `pi-manifest.js` and `package-manager.js` are byte-identical between 0.84.3 and 0.85.0; `loader.js` differs only in the `isBundledNode` refactor (local → import), functionally identical for the npm-global path. Clean-env current `main` registers **all 14 parent-mode slash commands** on both 0.84.3 and 0.85.0 (step-2 owner evidence; step-4 Skeptic objection 3 closed-green).
- **The root cause of the historical symptom is pi-council's own env-keyed parent/child mode split** at `extensions/index.ts:117-121`: `const seatName = process.env.COUNCIL_SEAT; if (seatName) { runChildMode(pi, repoRoot, seatName); return; }`. Child mode registers hub tools + seat MCP but **zero slash commands** — version-independent.
- **The honest reproduction (red on current `main`) is the `COUNCIL_SEAT`-set pole**: zero slash commands registered → the unregistered-command → silent model-dispatch fallthrough (no `Failed to load extension` diagnostic — the factory succeeds, the child branch runs).
- **FLLWUP-14's "stock pi 0.85.0 loads no extension" observation came from a contaminated council-runner seat session** (`COUNCIL_SEAT=council-runner` inherited into a probe launched from inside a seat session → child mode → zero commands → misroute), not from the kitty smoke harness: `smoke/run.sh` forwards only `OPENROUTER_API_KEY` + `SMOKE_PHASE` into the container, `search-smoke/run.sh` unsets `COUNCIL_SEAT COUNCIL_JOB_ID COUNCIL_RUN_ID PI_SESSION_FILE` and pins `PI_VERSION="0.84.3"` — contamination-proof by construction and never exercises 0.85.0.
- **The devDependency `"*"` silently rode whatever pi shipped** and no gate drove `discoverAndLoadExtensions`, so the env-split contract was invisible to every falsifier.

R-1 (ADOPTED) replaced the card's `goal` and `## Acceptance` in full with the two-pole framing; R-2 (VERIFIED-INTERVAL HOUSEKEEPING) fixed how the devDependency pin is characterized and recorded. Both are binding; the deliverables below are exactly what R-1/R-2 name.

## 2. Deliverables

1. A two-pole driven headless verification, test-side in the repo's gate set.
2. The root cause of the env-split fallthrough documented on the card's run record with evidence, not guessed.
3. The `@earendil-works/pi-coding-agent` devDependency changed to `">=0.84.3 <0.86.0"` (in `devDependencies` only), with the R-2 (a)/(b)/(c) record made on the card's run record.

## 3. Deliverable 1 — the two-pole verification test

**Where it lives.** A new test file under `test/` (repo convention: `*.test.ts`, auto-discovered by `bun test`; suggested name `test/env-split-contract.test.ts`). It is part of the gate set (`bun test` in `.github/workflows/gates.yml`). It must run fully offline, with no API key and no model dispatch on any pole, bounded in wall time, and must work in CI (fresh HOME, empty `~/.pi`).

**The installed pi under test.** The devDependency-resolved pi package at `node_modules/@earendil-works/pi-coding-agent/` (the same version the new constraint resolves — this is what "the installed pi binary" means; in CI there is no global pi). The test resolves it from the package root (e.g. `import.meta.resolve` / `require.resolve` of the devDependency) and fails loudly if unresolvable. Its loader lives at `dist/core/extensions/loader.js` (verified present at this relative path in both 0.84.x and 0.85.x; exports `discoverAndLoadExtensions(configuredPaths, cwd, agentDir, eventBus)`).

**Env discipline (hard requirement, contamination-proof by construction).** Every subprocess this test spawns receives an explicitly constructed environment — never an inherited one. The env contains only the variables the pole requires (e.g. `PATH`, scratch `HOME`, and optionally `COUNCIL_SEAT`); everything else from the parent process — including `OPENROUTER_API_KEY`, any provider keys, `COUNCIL_JOB_ID`, `COUNCIL_RUN_ID`, `PI_SESSION_FILE` — is **dropped**, not scrubbed-then-riskily-forwarded. A seat session that runs `bun test` (this run's owner/skeptic will) has `COUNCIL_SEAT` and `OPENROUTER_API_KEY` in its own env; the explicit-env construction is what makes the test immune to that contamination (the FLLWUP-14 probe-contamination lesson, applied structurally). The scratch HOME is a `mkdtemp`-created empty directory; the test cleans it up on completion.

**Mechanism 1 — registration-count assertions (primary; deterministic; model-free).**

A small driver script (sibling fixture, e.g. `test/fixtures/env-split-driver.ts`) imports `discoverAndLoadExtensions` from the installed devDependency's loader and:

- creates a scratch `agentDir` + scratch HOME under a temp dir,
- calls `discoverAndLoadExtensions([<repoRoot>/extensions], <repoRoot>, <scratchAgentDir>)` with `cwd = <repoRoot>` (the extension's `process.cwd()` is the repo root; procedures resolve from the repo's `council/procedures` when no `.pi` override exists),
- prints one JSON line: the loaded extension entry's `.commands.size` (or explicitly `{"error": ...}` when the loader reports a load error), and exits 0.

The test spawns the driver twice, with explicit env:

- **Pole A (clean env)** — env without `COUNCIL_SEAT` → assert `commands.size === 14` (7 procedure commands + `council-init`, `council-jobs`, `council-leaderboard`, `council-models`, `council-eval`, `council-tree`, `mcp`).
- **Pole B (`COUNCIL_SEAT` set)** — same env plus `COUNCIL_SEAT=<probe>` → assert `commands.size === 0`.

These are the acceptance's two poles: a clean scratch HOME with no council configuration registers all parent-mode slash commands; the same HOME with `COUNCIL_SEAT` set registers zero. Pole B is the red reproduction — it stays red on every version the verification targets (the mechanism is version-independent; the child branch returns before any command registration).

**Mechanism 2 — end-to-end clean-env pole through the real binary.** Spawn the installed pi CLI headless with the explicit clean env, `cwd = <repoRoot>`: `<pkgRoot>/dist/cli.js --approve -p "/council-eval"`. Assert: exit 0, stdout contains `[council-eval] usage:`, and stderr does **not** contain `Failed to load extension`. This is the smoke's existing headless tripwire, driven by the installed binary.

**Mechanism 3 — end-to-end `COUNCIL_SEAT`-set pole through the real binary (red reproduction; bounded).** Same spawn with `COUNCIL_SEAT=<probe>` in the explicit env and no API-key variables present: assert that (a) the process exits within a bounded timeout (e.g. 60s; expected prompt — with no key, the unregistered-command path fails fast with "No API key found…", the step-2 evidence), (b) stdout does **not** contain `[council-eval] usage:`, and (c) stderr does **not** contain `Failed to load extension` (the silence discriminator — the factory succeeded, child mode ran). The bounded timeout is the guard against a model dispatch ever hanging the suite; because the env drops all provider keys, no dispatch can succeed or linger.

If the owner finds a version of the installed pi whose no-key unregistered-command path does not exit promptly (i.e. mechanism 3's prompt-exit expectation fails on the resolved version), the spec's fallback is: keep mechanism 3's assertions (b) and (c) with the bounded timeout, and rely on mechanism 1 for the deterministic "zero slash commands" assertion — mechanism 3 is the end-to-end red-pole tripwire, mechanism 1 is the gate's decisive count.

**Test header.** The test file's top comment states, in one paragraph: this test asserts the env-keyed parent/child mode split contract at `extensions/index.ts:117-121`; pole A (clean env, all 14 commands) and pole B (`COUNCIL_SEAT` set, zero commands); the explicit-env construction makes it immune to seat-session contamination. The full root-cause narrative lives in Deliverable 2, not duplicated here.

## 4. Deliverable 2 — root cause on the card's run record

- The owner writes `docs/superpowers/plans/2026-09-05-FLLWUP-21-plan.md` (carried in the PR — branch-verifiable): the implementation plan plus the **root-cause write-up with evidence**, covering (i) the env-keyed mode split at `extensions/index.ts:117-121` (`const seatName = process.env.COUNCIL_SEAT; if (seatName) { runChildMode(...); return; }`), (ii) the downstream path — child mode registers zero slash commands, so a council command name falls through to pi's unregistered-command → model-dispatch path (the unexpected-cost hazard), (iii) the FLLWUP-14 probe-contamination finding — that discovery probe inherited `COUNCIL_SEAT` from its council-runner seat session, while the kitty smoke harness itself is contamination-proof by construction (`smoke/run.sh` forwards only `OPENROUTER_API_KEY` + `SMOKE_PHASE`; `search-smoke/run.sh` unsets the council vars, pins `PI_VERSION="0.84.3"`), and (iv) the no-loader-drift evidence (byte-identical `pi-manifest.js`/`package-manager.js`; `loader.js` differs only in the `isBundledNode` refactor). Every claim cited to its evidence (installed-code reads, real-binary runs, FLLWUP-14 step-8 deviation (1)) — nothing guessed.
- The runner mirrors the root-cause write-up and the R-2 record onto the card face (`council/cards/FLLWUP-21.md`, the card's run record) in the step-8 recording commit, so the durable record lives where the acceptance says it does, in the runner's voice, sourced from the owner's evidence.

## 5. Deliverable 3 — the devDependency pin and the R-2 record

- `package.json`: `devDependencies."@earendil-works/pi-coding-agent"` changes from `"*"` to `">=0.84.3 <0.86.0"`. **Only the `devDependencies` line.** `peerDependencies."@earendil-works/pi-coding-agent"` stays `"*"` (consumer-facing contract for pi hosts — out of this card's scope), `dependencies` is untouched, and the smoke's `PI_VERSION="0.84.3"` pin is untouched.
- **`bun.lock` must be regenerated in-range** (`bun install`): it currently pins `0.84.2` (below the new floor); the registry resolves the constraint to `0.85.1` (`latest` per dist-tags). The regenerated lock must satisfy `bun install --frozen-lockfile` (CI's gates line). The two-pole test then runs against the lock-resolved pi — the version the constraint actually delivers.
- **The R-2 record on the card's run record** (runner records; owner produces the empirical facts): (a) the constraint string chosen — `">=0.84.3 <0.86.0"`; (b) the version(s) empirically verified against — the lock-resolved pi the gate test actually runs (0.85.1 after regeneration), plus the run's recorded 0.84.3 and 0.85.0 evidence (step-2 owner, step-4 Skeptic — clean-env registration green and `COUNCIL_SEAT`-set red on both, cited, not re-run); (c) the version(s) empirically verified to fail against **outside** the interval — **none** (record this explicitly; no out-of-interval pi version was verified to fail, and the constraint's upper bound means "we have not verified beyond the upper bound", not "this range restores the fix" — R-2's own framing). The record states what the bound means so a future reader sees the upper bound's actual semantics. Reversibility: one line in `package.json` plus a lock regeneration.

## 6. What this card does NOT do (binding, from the rulings)

- **No behavior change to the mode split** (`extensions/index.ts:117-121`, `extensions/child.ts`) — the card documents and pins the contract; it does not redesign child mode. The fallthrough hazard itself (a seat child that shells out to a parent-mode command silently downgrades the nested invocation) is follow-up material, not this card.
- No change under `smoke/` (the pinned `PI_VERSION=0.84.3`, `run.sh` env forwarding, `search-smoke/` all unchanged).
- No change to packaged seats or procedures (`council/agents/*.md`, `council/procedures/*.md` untouched).
- Diff is confined to: the new test file under `test/`, the driver fixture under `test/fixtures/` (if needed), `docs/superpowers/plans/2026-09-05-FLLWUP-21-plan.md`, `package.json`'s one devDependencies line, and `bun.lock`.

## 7. Gates (authoritative record: `.github/workflows/gates.yml`; this repo has no `docs/gates/GATE-EVIDENCE.md`)

Run them all, in order, in the worktree; no threshold lowered, no finding suppressed, regardless of change size:

1. `bun install --frozen-lockfile` succeeds (validates the regenerated lock).
2. `bunx tsc --noEmit` exits 0.
3. `bun test` — the full suite green, including the new two-pole test.
4. `python3 council/validate.py` clean.

There is no import/normalization gate and no production-boot gate for this repo; the four above are the complete set. The pinned 0.84.3 smoke is untouched and not re-run by this card.

## 8. Branch/PR conventions (run binding)

- Work in an isolated worktree under the repo's `.worktrees/`, created from `origin/main` — never `git checkout`/`switch`/`reset` against the main repository path (the local `main` carries the runner's council-record commits that must not appear in the PR diff).
- Branch name `feat/fllwup-21-env-split-contract` (or similar); PR base `origin/main`; conventional commit(s).
- The runner verifies at the exact PR head SHA and head worktree path (subject pins per FLLWUP-18/19), then runs step 9 (Skeptic at the branch), step 10 (judge with the goal + Skeptic's evidence — the judge never sees the card title), and the step-11 deterministic merge check (five criteria, pinned to the checked SHA).