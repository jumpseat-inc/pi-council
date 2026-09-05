---
id: FLLWUP-24
title: Local gates refuse to run when installed deps drift from bun.lock
state: Deliberating
owner: null
epic: EPIC-6
goal: Running the repo's local gate commands against an installed node_modules that disagrees with bun.lock produces a named failure before any gate result is trusted, proven by a drift-detection assertion that names the stale dependency and the remedy, with the owner instruction set carrying the requirement.
---

## Intent

Filed from FLLWUP-22's delivery (council-runner report): in **two
consecutive runs** (FLLWUP-21 and FLLWUP-22), the repo's installed
`node_modules/@earendil-works/pi-coding-agent` sat at a version that
disagreed with `bun.lock`'s resolution (0.84.2 installed vs 0.84.3 locked,
then the 0.85.1 re-lock), and a local `bun test` / `bunx tsc --noEmit` run
without a prior `bun install` silently verified the *wrong* pi version —
local gate evidence that CI (fresh frozen-lockfile install) would not
corroborate. Each run's Skeptic had to spend a correction discovering it.

This card adds a drift tripwire so local gate evidence is trustworthy: an
assertion (in `council/preflight.sh` — the natural home, or wherever the
deliberation rules) that the installed `@earendil-works/pi-coding-agent`
matches `bun.lock`'s resolution and fails with a named diagnostic (stale
version, installed vs locked, remedy `bun install --frozen-lockfile`)
before any gate is trusted. The deliberation rules the exact mechanism and
home; the card requires that drift be detected and named before gate
results count. Related but distinct from FLLWUP-23 — that card is about a
*consumer* installing the package without dependencies; this card is about
*this repo's dev tree* drifting from its own lock. Filed under EPIC-6 per
the run's standing orchestrator directive; surface is run mechanics.

## Acceptance

- A drift-detection assertion that compares the installed
  `@earendil-works/pi-coding-agent` version against `bun.lock`'s
  resolution, failing with a named diagnostic (both versions, remedy
  `bun install --frozen-lockfile`) — proven red on a deliberately drifted
  scratch tree and green on a matching tree.
- The mechanism's home (preflight, owner instruction set, or equivalent)
  is the deliberation's ruling, recorded on the run record.
- CI is unchanged — the `gates` workflow already enforces the lock via
  fresh frozen-lockfile install; this card is the local-evidence tripwire.
- Full gate set stays green (`bun test`, `bunx tsc --noEmit`,
  `python3 council/validate.py`).

## Execution (run record)

### Step 1 gate (2026-09-06, runner container)

**Full council, surface-touching — designer seated.** The card is
spec-ambiguous by its own Intent ("The deliberation rules the exact
mechanism and home") — the goal admits more than one reasonable design
for where the tripwire lives (`council/preflight.sh`, the owner
instruction set, or another equivalent) and how installed-vs-locked is
compared. Cross-seam by construction: the home (run mechanics,
`council/preflight.sh`), a driven proof (test/ + a scratch-tree
fixture), and the owner-agent guidance all move together. Surface-touching
per the council.md test ("strings and error text"): the deliverable is a
named diagnostic a person reads — both versions and the remedy — replacing
a silent wrong-version gate run. So `designer` joins `owner`/`principal`
as a third generator in steps 2–3, consistent with FLLWUP-23's precedent
(named diagnostic prose judged surface-touching there).

Evidence base and environment notes (this container):

- **Drift observed and recorded, then synced per the binding.** At
  container start, `node_modules/@earendil-works/pi-coding-agent/package.json`
  read **0.84.2** while `bun.lock` resolves **0.85.1** (devDependency band
  `>=0.84.3 <0.86.0`; lock entry `@earendil-works/pi-coding-agent@0.85.1`)
  — the exact failure class this card trips on, reproduced live during
  FLLWUP-21/22/23 and confirmed here. `bun install --frozen-lockfile`
  (exit 0, 30 packages) brought the installed tree to 0.85.1; git status
  clean afterward (node_modules ignored). Every local gate run in this
  run happens on lock-synced trees only.
- The recent deliverables that must stay green under this card's change:
  `test/env-split-contract.test.ts` (FLLWUP-21), the theme token suite
  (`test/theme.test.ts`, `test/theme-activation.test.ts`, and the other
  `theme-*.test.ts` files — FLLWUP-22), and `test/fllwup23-dep-less.test.ts`
  (FLLWUP-23).
- Binding exclusions: no packaged seat/procedure content changes; no
  `smoke/` changes; no `package.json`/`bun.lock` changes. CI
  (`.github/workflows/gates.yml`) is unchanged — fresh frozen-lockfile
  install already guards CI; this card is the local-evidence tripwire
  only.
- Gate authority: `.github/workflows/gates.yml` + the FLLWUP-21 plan
  record — frozen-lockfile install, `bunx tsc --noEmit`, `bun test`, and
  `python3 council/validate.py`, all full at every gate check.

### Step 2 — independent first pass (2026-09-06, runner container)

Owner (job-20.1), principal (job-20.2), designer (job-20.3) dispatched in
parallel, isolated inputs (card face + binding facts only). Positions
appended verbatim below.

#### Owner position (job-20.1)

All grounding complete — no repo files touched (probes ran under
`/tmp/lockprobe` only; main tree verified green: installed 0.85.1 == lock
0.85.1). Position follows.

- **Approach.** Tripwire lives in the preflight gate, as the card's own
  Intent anticipates, split for driven-proof testability: a new
  single-purpose `council/check-pi-drift.sh` (bash, `set -u`, takes
  project root as `$1`, prints `OK:`/`FAIL:` lines per the preflight
  contract, exits 0/1), invoked by the live `council/preflight.sh`
  between the `command -v bun` gate (line ~45) and the
  `bun install --frozen-lockfile` presence line (line ~50) — so drift is
  named before the self-heal install runs, and by construction before any
  gate result. Mechanism grounded in the actual lock: installed =
  `node_modules/@earendil-works/pi-coding-agent/package.json` `version`
  (read via `bun -e` — verified returns 0.85.1); locked = `bun pm ls`
  (bun's own lock reader) grepped for the anchored leaf
  `@earendil-works/pi-coding-agent@…`, `head -1`, version after the last
  `@`. Mismatch → `FAIL: @earendil-works/pi-coding-agent drift — installed
  <X>, bun.lock resolves <Y> — run bun install --frozen-lockfile, then
  re-run preflight`; absent node_modules → OK (fresh-clone presence stays
  the install line's job); equal → OK. No package.json/bun.lock/smoke/
  seat/procedure changes; CI untouched.
- **Why `bun pm ls`, not a hand parser:** bun.lock is lax JSON, not strict
  JSON — both `JSON.parse` and `Bun.file().json()` reject the committed
  lock (`Expected double-quoted property name… position 182 (line 9 col
  7)` — trailing comma after the last workspace dependency). The bare-name
  key is the root resolution (lockfileVersion 2):
  `"@earendil-works/pi-coding-agent": ["@earendil-works/pi-coding-agent@0.85.1",
  …` (bun.lock:82), while transitive entries get parent-prefixed keys
  (probed: `"strip-ansi/ansi-regex": ["ansi-regex@4.1.1"…` alongside root
  `"ansi-regex": ["ansi-regex@3.0.0"…`; the observed
  `@earendil-works/pi-coding-agent/typebox` subpath is the same shape).
  `bun pm ls` is lock-derived and node_modules-independent, proven by
  probe: installed ansi-regex hand-edited to 9.9.9 still prints 3.0.0;
  node_modules deleted entirely still prints 3.0.0 (exit 0, no network);
  on this repo 5 ms offline, two identical root-level leaves
  (devDependencies + peerDependencies), both 0.85.1 — `head -1` is
  deterministic for the root resolution. Degradation is fail-closed: if
  `pm ls` output changes so grep yields nothing while an installed version
  exists, the tripwire FAILs ("installed X, no lock resolution") — never a
  silent green.
- **Tradeoffs accepted.** (1) Preflight stops silently self-healing
  version drift — the tripwire names the remedy and halts the run; fresh
  clones unaffected (absence ≠ drift). (2) Locked version depends on `bun
  pm ls` output shape instead of parsing the lock text — `pm ls` is bun's
  own reader, the exact semantic "matches bun.lock's resolution";
  fail-closed on format change. (3) Scope is the one engine package
  (`@earendil-works/pi-coding-agent`), per the acceptance's named-package
  framing. (4) New file + preflight line instead of an inline block:
  preflight is not unit-runnable (git fetch, MCP/OpenRouter auth probes,
  network install), and acceptance demands red/green proof against scratch
  trees — the standalone script is the enabler; preflight remains its only
  production caller. Scaffold template untouched (diff proof: deliberately
  generic — "The council imposes no language, runtime, or package-manager
  requirement"). (5) Owner-instruction-set home rejected: packaged seats
  binding-excluded; no GATE-EVIDENCE.md; documentation alone failed twice;
  enforcement must sit at the point of use (every run crosses preflight
  step 0).
- **Testable claims.** T1 (red): scratch tree with minimal package.json +
  copy of real bun.lock + node_modules/…/package.json `{"version":"0.84.2"}`
  → script exits non-zero; stdout contains `0.84.2`, the lock's `0.85.1`,
  and `bun install --frozen-lockfile`. T2 (green): matching version (from
  the copied real lock) → exit 0, OK line; version-agnostic, not hardcoded
  to 0.85.1. T3 (red, direction-independent): installed 0.99.0 above the
  band → non-zero — equality on strings, not range-awareness. T4 (fresh
  tree): no node_modules → exit 0, distinct OK line. T5 (ordering):
  `readFileSync("council/preflight.sh")` satisfies
  `indexOf("check-pi-drift.sh") < indexOf("bun install --frozen-lockfile")`.
  T6 (deliverables intact): env-split-contract, theme suite,
  fllwup23-dep-less, and the full four gates stay green.

Evidence sources: `vault/wiki/index.md` → [[preflight]],
[[council-dependencies]], [[council-loop]], [[owner]]; `council/preflight.sh`
(live vs scaffold diff); `bun.lock`; `.github/workflows/gates.yml`;
`docs/superpowers/plans/2026-09-05-FLLWUP-21-plan.md`; fresh probes in
`/tmp/lockprobe`.

#### Principal position (job-20.2)

The card's three candidate "homes" are not alternatives; they are three
layers of one contract, and the load-bearing seam is not *where* but *in
what order and through which artifact*.

- **The preflight contract already extends the scaffold with exactly this
  class of gate — but its own install line silently swallows the drift
  signal.** The shipped template carries a placeholder "project tooling
  gate" and checks nothing; the repo's delivered copy already replaced
  that slot with real bun gates: `command -v bun`, `[ -f bun.lock ]`, and
  `bun install --frozen-lockfile >/dev/null 2>&1 || fail "bun install
  failed (deps not installed)"`. That last line is the trap: on a drifted
  tree it does **not** fail; it re-syncs node_modules to the lock and
  exits 0. A drift check appended *after* that line is dead code — the
  check must run **before** the frozen-lockfile install, and must not rely
  on that install (fresh-clone tolerance: absent node_modules ⇒ pass).
- **Two files named `preflight.sh`, different audiences.**
  `council/scaffold/council/preflight.sh` (template, `@CONFIG_DIR@`, no
  bun checks) is what `/council-init` writes into every consumer repo;
  `council/preflight.sh` (rendered, `.pi/` literal, bun gates) is this
  repo's own adapted copy. The drift check is this repo's dev-tree
  concern (its own devDependencies band `>=0.84.3 <0.86.0`, resolved
  0.85.1 at bun.lock:82). It belongs in the adapted copy only; putting it
  in the template ships a pi-coding-agent-specific check to every consumer
  that may not even have that devDependency. The card's "preflight.sh —
  the natural home" is ambiguous about *which* file.
- **Preflight alone cannot satisfy the card's goal.** The goal's "no local
  gate evidence is ever trusted from a drifted tree" is unconditional, but
  preflight is bypassable: nothing forces a direct `bun test` to be
  preceded by it. Detection in preflight is necessary, not sufficient. The
  "owner instruction set" layer (repo-root `AGENTS.md`, not the packaged
  `council/agents/owner.md` — that edit is binding-forbidden) converts
  detection into a trust rule: a hard-convention line that local gate
  evidence counts only after `council/preflight.sh` passes. `AGENTS.md` is
  the unambiguously repo-editable home that all seats read.
- **CI is structurally blind to this class, which is exactly why it must
  not be touched.** gates.yml installs fresh frozen-lockfile, so its tree
  is always lock-conformant; CI green is *consistent with* a developer
  silently verifying the wrong pi locally. "CI is unchanged" is right and
  should be read as "CI stays the authority, this is the tripwire."
- **Reframe.** Rule three layers: (1) detector as extracted artifact
  (e.g. `council/check-pi-drift.sh`) invoked by `council/preflight.sh`
  **before** the frozen-lockfile install — compares installed version to
  the lock's resolved version (bun.lock:82 package-key entry, not the
  nested `/typebox` entries), FAIL names both versions + remedy; (2) a
  hard-convention line in repo-root `AGENTS.md` that local gate evidence
  is trusted only after preflight passes; (3) a driven scratch-tree test
  that invokes the *same* extracted artifact — red on 0.84.2 + repo
  bun.lock, green on installed = parsed locked version. The single most
  load-bearing seam: **same-artifact + pre-install ordering** — if the
  test reimplements the parser, or the check runs after the install, the
  tripwire is theater.
- **Testable claims.** (1) Pre-install ordering (structural): test asserts
  by source inspection that preflight invokes the detector before the
  frozen-lockfile install; on a drift-injected scratch the detector exits
  1 (not silently repaired). (2) Same artifact: the test spawns the same
  shell script preflight sources; a TS reimplementation is the red flag.
  (3) Red/green on scratch with both versions + remedy in stderr. (4)
  Version-agnostic green derived from the copied bun.lock, never
  hardcoded. (5) Fresh-clone tolerance: absent
  node_modules/…/package.json ⇒ exit 0. (6) Parse precision: anchor on the
  package-key line, not the nested `/typebox` entry. (7) Gate/deliverable
  green: full suite + tsc + validate green, the three deliverable suites
  untouched (the detector only reads package files).

#### Designer position (job-20.3)

- **Design position.** The drift tripwire belongs in `council/preflight.sh`
  (the scaffolded pre-existing fixture), firing **before the first gate
  command in the run sequence** — not lazily at the moment the gate is
  invoked, and not via the owner instruction set. Preflight is the only
  place already wired to halt the run on a `FAIL:` line with a remediation
  string; making the owner "remember" to run it, or burying the check in a
  package.json script that runs after the user has already typed `bun
  test`, would re-create exactly the silent-wrong-version path this card
  exists to kill. The prose must show both versions inline (`installed
  0.84.2 ≠ locked 0.85.1`) and the remedy `bun install --frozen-lockfile`
  on the same line — a person who just had two consecutive runs verify the
  wrong pi needs to read what was *wrong*, not be told something "failed".
  When lock and installed match, the tripwire prints nothing — silent on
  success is the right default: the diagnostic's job is to *explain
  drift*, not to *announce health*.
- **Gulfs closed.** Gulf of Evaluation for the operator who just ran local
  gates and got red — or worse, green and trusted it. The card's named
  pain is not "the gate failed"; it is "the gate verified the wrong pi and
  I didn't know." Closing the gulf for the matching case means the absence
  of the diagnostic *must* be trustworthy; for the drifted case the prose
  names both versions so the operator can tell whether they need a
  frozen-lockfile install or something more sinister (stale lockfile,
  different package source, deliberate pin override).
- **Principles and evidence.** (1) Forcing function over training — the
  standing convention is that any `FAIL:` halts the run before gates;
  adding the check there makes it impossible to bypass by typing `bun
  test` directly. The card's binding excludes packaged seat/procedure
  content and `smoke/`, so an owner-instruction-set reminder is exactly
  the wrong home. (2) Knowledge in the world — the diagnostic must print
  both the installed version (from
  `node_modules/@earendil-works/pi-coding-agent/package.json`) and the
  locked version (from `bun.lock`), not just "drift detected". (3)
  Feedback proportional to consequence — the fix is one command; the
  prose names it verbatim. Burying the remedy under "see docs" is the
  tooltip-explaining-it anti-pattern. (4) Silent-on-success is earned —
  today's preflight is loud on success (`OK:` per gate); the drift check
  should invert that for the matching case (no line, or one quiet OK),
  because operators who see `OK: pi-coding-agent matches bun.lock` on
  every run learn to skip it, and silence means trustworthy.
- **Falsifiable predictions.** (1) Scratch: installed 0.84.2 + locked
  0.85.1 → preflight exits non-zero with one FAIL: line containing both
  versions and the literal remedy. (2) Matching → exit zero, no
  pi-coding-agent line. **Finding flagged, not just a design call:** the
  current `bun install --frozen-lockfile >/dev/null 2>&1` line in preflight
  silently re-installs if drift exists, meaning drift in this repo *should
  not have been possible* if preflight ran — the card's evidence says
  drift was observed live, so either preflight did not run before gates or
  a different process re-mutated node_modules. **Prediction: the
  diagnostic must run *before* the existing install line, or the existing
  line must be moved after a fresh version read** — else the tripwire
  reads a freshly-installed version and never fires. (3) Owner
  instruction set will not mention the check (grep owner.md for
  pi-coding-agent/drift → zero matches); if the seat prose ends up
  teaching the owner to "run bun install first", the forcing-function
  argument collapses. (4) `git diff package.json bun.lock` after the
  change is empty — the tripwire is observational, not corrective.
- **Preferences, ranked last.** Name the failure category `drift` (the
  card's own wording); make the FAIL line match the house colon-led style
  (`FAIL: superpowers is not installed project-locally — run /council-init
  …`).

### Step 3 — bounded exchange, round 1 (positions stabilized; rounds used: 1 of ≤3)

Round-1 responses of owner (job-20.4), principal (job-20.5), designer
(job-20.6) appended verbatim; each was given the other two seats'
positions summarized.

#### Owner round-1 response (job-20.4)

Grounded: re-read `council/preflight.sh` (self-heal line at :54),
`bun.lock`, the FLLWUP-24 card, wiki preflight/council-dependencies
pages, `extensions/scaffold.ts`, and diffed repo preflight against the
scaffold template and the smoke fixture.

- (a) **Layer (2) conceded outright.** Verified in the file:
  `council/preflight.sh:54` runs `bun install --frozen-lockfile
  >/dev/null 2>&1 || fail` — any check appended after reads a re-synced
  tree and is dead code. The tripwire invocation must sit between the
  "project files present" check (:52) and the install line (:54).
- **AGENTS.md layer — concede, in scope, but only as a repo-root line.**
  The FLLWUP-21/22 incidents were direct gate runs — the exact bypass the
  rule names. The tripwire detects; the AGENTS.md rule forbids trusting
  evidence before preflight. Scope boundaries: (i) repo-root AGENTS.md
  only — this package's own doc, not packaged seat/procedure content, so
  the binding exclusion is clean; (ii) never the `council/scaffold/`
  template — the frozen-lockfile line exists only in this repo's rendered
  copy; (iii) `smoke/fixture/council/preflight.sh` keeps its own
  tripwire-less copy per the no-smoke binding — recorded as expected
  divergence, not a missed sync. Designer's prediction 3 resolves against
  the goal's "owner instruction set carries the requirement" wording: the
  owner's existing procedures already run preflight at `/council` step 0
  and features-deliver Phase 0 — the requirement rides every owner run *by
  construction*; no seat/procedure edit; the record says the script is the
  home, the procedure wiring is the carrier. One concession: the wiki
  source page [[2026-08-23-agents]] ("12 hard conventions") goes stale
  when the line lands — that refresh is follow-up (ingesting-repo-docs),
  not this card's gate.
- (b) **Same-artifact — concede, with a shape that makes it work.** A TS
  twin is a second implementation that can diverge (CONFIRM-2/
  byte-identity lesson). Reconciliation: `council/check-pi-drift.sh` with
  a pure interface (inputs: lock path + installed package.json path;
  outputs: exit 0 on match, `FAIL:` on drift), invoked by preflight before
  :54. The driven bun:test spawns that artifact via `Bun.spawn` on scratch
  trees and asserts exit code + stream text — TS builds fixture *inputs*,
  asserts *outputs*, never reimplements the comparison. Spawning
  preflight.sh whole is impossible in a scratch tree (its earlier
  superpowers gate FAILs first); the standalone artifact is the same
  artifact preflight calls. Pre-install ordering becomes the structural
  test: tripwire invocation line-number < first `bun install
  --frozen-lockfile` line-number — red on the current file, green after.
- (c) **Prose + mechanism refinements.** Prose: accept the designer's
  single FAIL line with both versions inline and the verbatim remedy on
  the same line. **Rebut silence-on-success:** a silent tripwire makes
  deletion invisible — a refactor dropping the tripwire while keeping the
  self-heal install yields an identical silent transcript, so the record
  can't distinguish "checked, matched" from "check absent". Compromise: an
  `OK: pi-coding-agent <version> matches bun.lock` echoing the compared
  version — transcript becomes version evidence. Mechanism: principal's
  anchor demand verified against `bun.lock:82` (a bare version grep
  matches ~7 sibling `@earendil-works/*@0.85.1` lines; the typebox value
  is a decoy on the same line) — encoded as the lock-parse fixture test
  rather than prose. Refinement: rule the *installed* side be read from
  `node_modules/@earendil-works/pi-coding-agent/package.json`'s `version`
  field — the exact file the card's evidence read and a gate-run imports
  — rather than paring `bun pm ls` output. Kept revertible if the council
  rules pm ls.
- **Tradeoffs accepted.** New repo-local script + one preflight edit
  (scaffold untouched, fixture divergence expected, wiki source summary
  stale ← follow-up). One loud OK-line per run to keep tripwire deletion
  visible. Direct package.json read over pm ls drops a format-fragile
  layer at the cost of a mechanism-ruling concession. AGENTS.md line
  rides a run-mechanics card — small, single-line, binding-clean; the
  alternative (follow-up card) would ship the tripwire unclosed against
  the exact bypass it names.
- **Testable claims.** (1) Ordering: structural test asserting
  tripwire-invocation line < first `bun install --frozen-lockfile` line;
  red on current file, green after. (2) Same-artifact: spawn
  `council/check-pi-drift.sh` on a scratch tree with installed 0.84.2 vs
  lock 0.85.1 → exit 1, stream contains `0.84.2`, `0.85.1`, and the
  remedy verbatim; matching tree → exit 0. (3) Anchor: synthetic lock key
  line with doctored `"typebox": "9.9.9"` differing from the package's
  own version — a naive same-line parse reports the wrong locked version
  (red), the key-anchored `-m1` prefix parse is green. (4) Version-agnostic
  green: installed and locked both 9.9.9 → exit 0, no hardcoded expected
  version. (5) Fresh-clone tolerance: absent node_modules / missing
  version field → exit 0 pass-through (install line's job), no crash
  under preflight's `set -u`. (6) Non-gate claim: the wiki "12 hard
  conventions" summary is stale iff the AGENTS.md line lands.

#### Principal round-1 response (job-20.5)

The contract, grounded on both sides: locked side (`bun.lock:82`) leaf
`"@earendil-works/pi-coding-agent": ["@earendil-works/pi-coding-agent@0.85.1",
…]`, with near-misses a bare-name match would also hit — the workspace
ranges at `bun.lock:11` (`>=0.84.3 <0.86.0`) and `:18` (`*`), and the
subpath leaf `@earendil-works/pi-coding-agent/typebox@1.3.7` at
`bun.lock:520`. Installed side: `package.json:3` version 0.85.1 (synced).
Enforcement side (`council/preflight.sh:40–44`): `command -v bun` gate →
`[ -f bun.lock ] || [ -f package.json ]` → the frozen-lockfile install;
the insertion span owner names contains the project-root `-f bun.lock`
check, so the precise line-anchor matters.

- **Blind spots.** Owner (gate vantage): correct that prose-as-enforcement
  failed twice — but that kills only the *enforcement* half of the
  owner-instruction-set home, not the *contract* half: **the card's goal
  still literally ends "with the owner instruction set carrying the
  requirement", while the deliverable re-homes to the gate** — the gate
  vantage can't see the judge-evaluates-the-goal seam it's leaving
  contradicted. Second: `head -1` is a fail-open smuggled into a
  fail-closed design — "take the first match" is safe only while the
  anchor provably yields exactly one line. Designer (surface vantage):
  "silent on success, one FAIL line" is right for the reader, but the
  prose is downstream of a parse step: the diagnostic is only trustworthy
  if "exactly one locked-version line" is *asserted*, not *assumed*.
- **Reframe 1 — demote the AGENTS.md layer from "hard convention" to
  "goal parity."** Concede enforcement-at-point-of-use — the mechanism is
  the enforcement, and a convention #13 would be exactly the prose that
  failed twice. What survives is not prose but the *goal edit*: the ruling
  must supersede the goal's tail clause (edit it to "point-of-use preflight
  gate carries the requirement", or the run record must carry an explicit
  supersession note), else the deliverable ships contradicting the
  contract the judge evaluates against. Acceptance bullet 2 already
  permits re-ruling ("preflight, owner instruction set, or equivalent …
  recorded on the run record"), so this is parity cleanup, not a blocker.
- **Reframe 2 — relocate fail-closed from "format change" to "ambiguous
  match."** The fail-open doesn't live in reading the lock; it lives in
  `head -1`. An exactly-one-match assertion replaces the heuristic.
- **Testable claims (deltas).** (1) Anchor is load-bearing (green tree):
  `bun pm ls | grep -c '@earendil-works/pi-coding-agent@'` == 1 **and**
  `bun pm ls | grep -c 'pi-coding-agent'` > 1 (the bare name also hits the
  `…/pi-coding-agent/typebox@1.3.7` subpath). On (b): `bun pm ls` satisfies
  and exceeds the same-artifact claim — parser-identical to the enforcer
  (`bun install --frozen-lockfile`), where a lock-text grep would be a
  third parser that can disagree with bun in both directions. (2)
  Fail-closed on ambiguity (unit): feed the script a `pm ls` output with
  two `@earendil-works/pi-coding-agent@…` lines → exit 1 with a "format
  changed / ambiguous" diagnostic, not `head -1`'s first hit as OK. (3)
  Name-don't-heal (red fixture): drifted tree (0.84.2 vs 0.85.1) → exit 1,
  exactly one FAIL naming both versions + remedy, **and**
  `node_modules/…/package.json` still reads 0.84.2 afterward — the
  ordering test: heal-before-check can never go red, so red-on-drift
  already proves pre-heal; the on-disk assertion makes "named, not healed"
  explicit. (4) Diff scope: `git diff --stat` == exactly
  `council/preflight.sh` + new `council/check-pi-drift.sh`;
  `council/scaffold/council/preflight.sh`, all six
  `council/fixtures/*/seed/council/preflight.sh`, and
  `smoke/fixture/council/preflight.sh` byte-identical to HEAD.

On (a): enforcement home settled, the layer conceded; the only residue is
reframe 1's goal edit — not a follow-up card. On (c): no ordering residue
beyond the line-anchor precision (insert after `ok "project files
present"`, which asserts `bun.lock` exists) and claim 3's explicit form.

#### Designer round-1 response (job-20.6)

- (a) **FAIL line delta: none.** Owner's line — `FAIL: pi-coding-agent
  drift — installed <X>, bun.lock resolves <Y> — run bun install
  --frozen-lockfile, then re-run preflight` — matches house style (`FAIL:`
  gate verdict — one-thing-to-do, then re-run preflight) and carries all
  four surface items (package name, what we have, what the lock says,
  same-line remedy). One prediction if wrong: the package name after the
  colon, scoped or unscoped, is a legibility-vs-grep preference, ranked
  last.
- (b) **Silent success: one quiet OK line is the better default** (owner's
  sharp accepted). The check lives next to loud `OK:` lines for every
  other gate, and this is the gate the team's been bitten by — a silent OK
  means a future re-occurrence is invisible in the transcript. Tiny
  delta, high consequence.
- (c) **AGENTS.md layer is a different layer from prediction-3, not a
  contradiction.** Prediction-3 said the owner instruction set must not be
  *the home* (static prose at the wrong layer failed twice); principal's
  layer is a runtime-readable standing rule in the canonical
  repo-contributor contract — load-bearing, not decorative. It is a
  defense-in-depth backstop that catches the case where the check itself
  is silently skipped or fails-and-continues (parallel to the v0.5.0
  OpenRouter "structural only, not a live request" pattern). One sharp:
  the clause must be precise — *"prefer rerunning preflight over trusting
  local-gate evidence to skip it"* — not the vaguer "is trusted only after
  preflight passes", because the recovery path (board recap before fresh
  preflight) is the actual hazard.
- **Falsifiable predictions.** P-a: FAIL line prints package name,
  installed version, lock-resolved version on one line with same-line
  remedy. P-b: drift-success prints exactly one line `OK: pi-coding-agent
  versions consistent (installed <X>=lock <Y>)` matching the file's other
  OK lines. P-c: AGENTS.md gains a clause under the existing "Hard
  conventions" numbered list (not a new section), referencing
  `council/preflight.sh` by path, sharpened to the re-run-over-skip
  formulation. P-d: the test invokes the shell artifact via `bash
  council/check-pi-drift.sh`, never a Node/TS reimplementation. P-e:
  ordering — the drift check sits between the `command -v bun` gate and
  the `bun install --frozen-lockfile` line; its failure is emitted before
  any install side effect.

### Step 3 close — exchange stopped early (positions stabilized)

Exchange rounds used: 1 of ≤3. All three seats converged on a single
settled design:

- **Home (deliberation ruling, to be recorded per acceptance bullet 2 and
  the orchestrator's binding):** the tripwire lives in this repo's
  point-of-use Phase-0 gate `council/preflight.sh`, as a new standalone
  artifact `council/check-pi-drift.sh` (pure interface; the driven test
  spawns this same artifact — never a TS twin). Not the scaffold template
  (stack-agnostic, diff-proof generic), not smoke/ or fixture copies
  (expected divergence, no-smoke binding), not the packaged owner seat or
  other packaged content (binding-excluded). The goal's tail clause "with
  the owner instruction set carrying the requirement" is read as satisfied
  by the repo-root AGENTS.md hard-convention line (this repo's
  owner-facing instructions) + the procedure wiring already running
  preflight at every run's step 0 / Phase 0; supersession note lives on
  the run record and in the spec per principal reframe 1; acceptance
  bullet 2's "recorded on the run record" is the recording mechanism.
- **Mechanism:** installed side read from
  `node_modules/@earendil-works/pi-coding-agent/package.json` `version`;
  locked side via `bun pm ls` anchored leaf (exactly-one-match assertion
  — fail-closed on ambiguity, no `head -1` heuristic). Ordering:
  invocation between the "project files present" check and the
  `bun install --frozen-lockfile` line (:54), i.e. before the silent
  self-heal, so the diagnostic names the pre-heal versions. Absent
  node_modules → OK pass-through (fresh-clone presence stays the install
  line's job), under `set -u` no crash.
- **Diagnostic contract:** single `FAIL:` line naming the package, both
  versions inline, and the verbatim remedy `bun install
  --frozen-lockfile` (house colon-led style); on success one quiet
  `OK:` line echoing the compared version (transcript becomes version
  evidence — deletion of the tripwire becomes visible).
- **AGENTS.md:** one clause under the existing "Hard conventions"
  numbered list, referencing `council/preflight.sh` by path, sharpened to
  the re-run-over-skip formulation (designer P-c).
- **Proof:** driven bun:test on scratch trees — red on installed 0.84.2 vs
  locked 0.85.1 (with the node_modules still reading 0.84.2 after the red
  run: named, not healed), green on matching, version-agnostic green
  (e.g. 9.9.9/9.9.9), fresh-clone OK, ambiguity fail-closed, lock-parse
  precision (decoy typebox same-line), ordering structural assertion.
- **Scope:** the four existing gates in full (frozen-lockfile install,
  `bunx tsc --noEmit`, `bun test`, `python3 council/validate.py`); the
  three recent deliverables stay green (env-split-contract, theme suite,
  fllwup23-dep-less); diff touches only preflight.sh, check-pi-drift.sh,
  AGENTS.md, the new test, plan/spec docs.
- **Residual:** (i) exact artifact interface (project-root arg vs two
  path args) — implementation detail for the spec to pin; (ii) wiki
  source page [[2026-08-23-agents]] goes stale with the AGENTS.md line —
  follow-up (ingesting-repo-docs), not a gate. No open judgment dispute
  survives to step 6.
