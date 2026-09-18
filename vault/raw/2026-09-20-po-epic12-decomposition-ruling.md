---
date: 2026-09-20
seat: product-owner
kind: ruling
subject: EPIC-12 — pi-council version and git hash on the first pi run
scope: wave-3 ruling on the wave-1 draft (EV-57, EV-58, EV-59) and the wave-2 disagreement ledger (8 items)
supersedes: null
---

# PO ruling — EPIC-12 decomposition

Ruling only. No child is re-sliced, no child's scope or order changes, and the
epic goal is the human's sentence. Where I amend a `goal` it is because that
child's goal was disputed on the ledger and the dispute cannot close without
naming the thing the judge must observe — the same bar the EPIC-11 wave-3
ruling held (§11: "the goal need not pin *all* copy, but it must pin the copy
that a judge would otherwise have to guess at").

The question held over every item: **does this serve the person the product
exists for, or does it serve the product?** The person is the human who typed
`pi` at a terminal and wants, in one glance, to know which code is running
under them. "The council prints its own version at start-up so the product
looks self-aware" is not a reason to do anything here.

---

## 1. Epic goal — ratified, unchanged

> Know what version of pi-council I am running whenever I run pi the first
> time; it should show the version and the latest git hash from the repo.

Principal transcribed the intake; the transcription is accurate and nothing in
it is the defect. Ratified byte-as-drafted (per
[[three-wave-decomposition]]: the human is the author of what the product is
for; wave 3 rules and never generates).

**One reading I settle explicitly, because it decides a mechanism later cards
might invent:** "whenever I run pi the first time" means **the first session
of each `pi` process** — `session_start { reason: "startup" }`, which pi fires
on every process launch for a fresh session
(`extensions.md:281`, `:399`). It does **not** mean "once ever," and no
persisted "have I shown the version yet" flag is in this epic. A
once-ever flag would answer the question exactly when the human cannot use it
(the first run after an install, when they have no bug to attribute) and go
silent on every run after a re-install, which is the whole case for the
feature. Statelessness is also the cheapest-to-reverse posture: nothing to
migrate, nothing to forget.

---

## 2. States — EV-57 `Ready`, EV-58 `Ready` (amended goal), EV-59 `Backlog`

- **EV-57 — `Ready`.** Ratified as drafted. The chain head; nothing it needs
  is absent.
- **EV-58 — `Ready`, with its goal amended (§5).** Dissent named: **designer**
  held `Backlog` on the ground that the surface vehicle was unpinned;
  **skeptic** held `Ready`. The designer was right about the defect and wrong
  about the state *given this ruling*, because the defect it argued from was
  "the vehicle is not pinned" and I am the authority that pins it. Once the
  vehicle, the guard, and all four copy literals are named in the goal, the
  card meets the bar — "detailed enough for the Council to deliberate on
  without further clarification" (`features-new.md` step 2). Downgrading it
  now would stall the epic behind a gap I have just closed. This is the EPIC-11
  §11 resolution applied to the same shape of dispute.
- **EV-59 — `Backlog`, chain-dependent.** Ratified. Promotion trigger is
  observed, not decided: both EV-57's and EV-58's merge SHAs on local `main`
  plus `python3 council/validate.py` clean ([[chain-promotion]], cadence bound
  once at EPIC-4 P1–P5 and executed since).

**Why EPIC-11's bulk-Ready correction does not bite here.** That ruling split
six simultaneously-`Ready` cards because each "spec[ed] dependencies that don't
exist yet." EV-58 does not: its goal takes the identity as an **injected
fixture** ("for a fixture identity"), so it is fully specifiable and testable
before EV-57 lands. The delivery order is still EV-57 → EV-58 mechanically,
but no card depends on an artifact that has no home.

---

## 3. Ledger item 2 — COPY FORM: the literal intake form wins

**Ruled:** `council: pi-council v0.20.0 (a1b2c3d)` — prefix `council: `, `v`
before the version, the short hash in ASCII parentheses, one space, no trailing
punctuation. `v0.20.0+commit.a1b2c3d` is rejected.

- **Mechanism.** `council: ` is the load-bearing prefix already carried by
  every session_start notification in the engine —
  `council: retry disabled for this session — …` (`index.ts:709`),
  `council: swept N orphaned seat process(es)` (`index.ts:714`),
  `council: packaged tooling is out of date …` (`council-update.ts:390`),
  `council theme: pi-council-<variant>` (`theme-activation.ts:324`). A distinct
  grammar for this one line would fragment the prefix convention the designer
  itself called load-bearing.
- **User value.** The moment this line earns its keep is when the human pastes
  it into a bug report. `v0.20.0 (a1b2c3d)` is a version and a **checkoutable
  ref**, which is exactly what AGENTS.md' release-notes section says the
  package is pinned by (`pi install git:…@ref`). `+commit.` is semver
  build-metadata syntax: correct, machine-parseable, and the thing a person
  has to explain. This product is a terminal toast read in half a second, not a
  manifest field.
- **Grounding on authorship.** The epic goal is the human's own sentence:
  "show the version and the latest git hash from the repo." Deviating from the
  human's literal words is a change to what they asked for; the literal form is
  therefore also the *less presumptive* option, not merely the prettier one.
- **Reversibility.** One template-literal constant plus its test string and the
  smoke assertion that sources the ruled literal ([[smoke-test]] Phase 5 "source
  the … notify copy from the ruled literals"). If a maintainer later wants
  semver-metadata form, that is a one-line change and a follow-up card, not a
  redesign.

## 4. Ledger item 3 — EV-60 (compare to latest released) is OUT of EPIC-12

**Ruled:** no EV-60; not introduced, not folded. Designer's Reading-B is
rejected and its own recommendation (out of scope) is sustained.

- The intake's words are "**the latest git hash from the repo**" — the repo
  whose code is running, i.e. the installed clone's HEAD. A network query for
  the newest *released* tag is a different question ("am I behind?"), which the
  human did not ask.
- **Mechanism cost, concretely:** it puts a network fetch on the `session_start`
  path — every `pi` launch pays an offline timeout, and the answer needs a
  staleness/cache policy nobody has specified. The house already has a
  version-drift mechanism and it is deliberately local and deliberately in
  tooling: `council/check-pi-drift.sh` compares installed-on-disk bytes against
  `bun.lock` and reports one `OK:`/`FAIL:` line through `preflight.sh`
  ([[lock-drift tripwire]], [[preflight]]); `/council-update` reports `behind`
  vs `diverged` from the on-disk provenance record, no network
  ([[2026-09-19-po-fllwup50-step6-ruling]]). "Is my tooling stale" belongs to
  those surfaces, where a human asked it explicitly, not to an unasked toast.
- **Not an escalation:** EV-60 is not a card on the board — the designer asked
  whether to create it, and declining to create a hypothetical card is a scope
  reading of this epic, not a portfolio decline. I do mark it for the human at
  the approval gate (§9) because it is the one place where my reading of *their
  own words* could be wrong.

## 5. Ledger item 1 / O3 / O1 / O4 — the EV-58 vehicle, and its amended goal

The vehicle is **pinned**: a one-shot `ctx.ui.notify(<identity line>, "info")`
at `session_start` when `event.reason === "startup"` **and**
`ctx.hasUI === true`. Not `setWidget`, not `setHeader`.

- `setWidget` is rejected on mechanism grounds, not taste: the council already
  owns that slot. `uiCtx.ui.setWidget("council", widgetLines(active))` is the
  hub-progress row (`index.ts:700-703`) and the job tree takes
  `setWidget(key, factory, { placement: "belowEditor" })`
  ([[council-job-tree-inline]]). A permanent identity row competes with the
  live progress surface for the same real estate, on every session, to answer
  a question asked once.
- EPIC-1 ruled the same shape of question the other way: **RULING 2** —
  "display no council-owned 'which theme is active' status surface — the
  repaint itself is the answer" ([[council-theme]]) — and EV-3's one-time
  notify was accepted precisely *as* the user's verification signal for an
  invisible in-memory fact ([[2026-08-25-design-ev3]]). This epic is that same
  case: an invisible fact (which bytes am I running) whose answer is a
  one-shot evaluation signal.
- `setHeader` is rejected for principal's and the designer's stated reason
  (wholesale-replace, and it would burn the input bar's identity).
- AGENTS.md 9.6 binds: the string stays **plain text**, no inline ANSI, no
  theme tokens.

**Ledger item 5 / skeptic O3 — RPC is pinned, and it is pinned by the guard,
not by a fourth enumeration.** Ruled: the emit condition is
`ctx.hasUI === true`, which pi defines as true in TUI **and** RPC (`false` in
print and json — `extensions.md:974`, and [[headless-pi]]'s mode table). In RPC
that notify is a fire-and-forget `extension_ui_request` frame with
`method: "notify"` on stdout, which the host may display or ignore
(`rpc.md:1191`). That is protocol-legal output on the protocol's own channel —
not fd-1 pollution — and it means a VSCode/Zed host gets the answer too.
Skeptic is right that "whenever I run pi" reaches RPC, and the board agrees
that RPC is a real council surface whose silence is a bug: **FLLWUP-4 — Repair
/council-tree RPC silent-no-op** sits in `Backlog` today. Naming the guard
closes the branch without inventing mode-specific prose. The headless negative
is stated as `ctx.hasUI === false (print, json)` — and the `else console.log`
fallback the engine uses for warnings is **deliberately not** followed here:
`--mode json` emits NDJSON on stdout, and an identity line there corrupts the
stream for zero user benefit. Print mode takes over stdout to stderr anyway
([[headless-pi]], EPIC-9 finding). Nothing is emitted when no one is watching.

**Ledger item 6 / skeptic O1 — `git-unavailable` gets copy and evidence.**
Sustained: a named contract branch with no required evidence and no named
emitted behavior is the EV-37 dead-branch class
([[2026-09-16-po-ev37-merge-gate-defect]] — a predicate whose whole reason to
exist catching none). Ruled, adopting the designer's literal:
`council: pi-council v<version> (git unavailable)`. The required evidence is
cheap and needs no git fixture at all, because EV-57's git reader is **already
injected**: one test arms a reader that throws and asserts the resolver returns
`git-unavailable` without throwing; one arms a reader returning exit 128
"not a git repository" and asserts `no-git-metadata`. The pair is what makes
the two arms non-collapsible — the two states must not render identically
(designer P2), because they name different remedies to the human.

**Ledger item 8 / skeptic O4 — the count is scoped to the identity line.**
Sustained on verified fact: `session_start` already emits other `council:`
notifications (retry-disabled `index.ts:709-711`, orphan sweep `:714`,
tooling-drift `:734-737`, theme activation `theme-activation.ts:324`, MCP
notes `:758`). An unscoped "exactly one plain-text line" is false in reachable
states and would be satisfied only by a session that happens to be quiet —
which is a test that passes for the wrong reason. Ruled: the assertion is
**exactly one notify whose text starts with the prefix `council: pi-council v`**,
and EV-58 must include one case where a *second* `council:`-prefixed
notification also fires, so the count cannot be satisfied by counting all
notifications.

### Amended EV-58 `goal` (single line, validator-legal; replaces the draft)

> On a `session_start` whose `reason` is `startup` and whose `ctx.hasUI` is true the council emits exactly one identity notification through `ctx.ui.notify` with kind `info`, its text byte-exactly `council: pi-council v<version> (<sha>)` with `<version>` the exact `version` field of the running package's `package.json` and `<sha>` the short HEAD hash of the running package root, counting exactly one notification whose text starts with `council: pi-council v` even when another `council:`-prefixed notification fires the same `session_start`, emitting nothing for the `new`, `resume`, `reload` and `fork` reasons, `council: pi-council v<version> (no git metadata)` when the identity resolver returned `no-git-metadata`, `council: pi-council v<version> (git unavailable)` when it returned `git-unavailable`, and when `ctx.hasUI` is false (print mode `-p` and `--mode json`) emitting nothing at all with no notify and no console output, proven by a test asserting the byte-exact string for a fixture identity, the single-identity count in a session where a second `council:` notification also fires, the empty output for each non-`startup` reason, both degraded strings as distinct outputs, and an assertion that neither print nor json mode writes an identity line to fd 1.

Its `Intent` must name the surface, not just the mechanism: *one-shot info
toast at TUI/RPC start-up, gone within seconds, no persistent row* — and must
say the package root it reports is the **running** package root
(`PKG_ROOT`, `seats.ts:29`), never the consumer cwd.

## 6. EV-57's amended `goal` — three evidence gaps, all of them the same class

EV-57's goal was not disputed on state and is undisputed on scope. I amend it
anyway, and the justification is that skeptic's charter finding generalizes: a
named contract clause with no named falsifier is unfalsified prose, whatever
its author. Two of these were skeptic's (O1, O2); the third is the designer's
P5/Intent-pin, and it is the one with real user consequence.

1. **`git-unavailable` evidence** (§5 above) — the injected-reader throw test.
2. **`core.abbrev` — the anti-slice discriminator (O2).** Sustained: on a
   default clone `--short` and `slice(0, 7)` are byte-identical, so the goal's
   own anti-slice claim cannot fail. Ruled: the primary fixture repo pins
   `git config core.abbrev 8` and the test asserts the returned hash has
   length 8 **and** byte-equals `git -C <fixture> rev-parse --short HEAD`.
   Eight, not six, because eight is the case the user actually hits — git's
   auto-abbreviation grows with repository size, so a slice-to-7 truncation is
   not merely un-caught by a 7-char fixture, it prints a hash that is *shorter
   than what git itself calls that commit*. (Designer P8, skeptic O2.)
3. **The ancestor-`.git` case — "never a substituted hash" made falsifiable.**
   `git -C <dir> rev-parse` walks **up** the filesystem. A package root with no
   `.git` nested inside some other repository returns *that repository's* HEAD,
   and the toast then states a hash that is not the running code — the single
   outcome worse than no hash, because the human repeats it in a bug report and
   a maintainer checks out the wrong bytes. The bare `/tmp`-with-no-`.git`
   fixture does not catch this: with no ancestor repo, the naive walk-up fails
   for the wrong reason and the test passes green against the defect. Ruled:
   EV-57's fixture set must include a **package root with no `.git` whose
   parent directory is a git repository**, asserting `no-git-metadata` and
   never the ancestor's hash — which requires the resolver to confirm the
   revision actually belongs to `<pkgRoot>` (e.g. compare
   `git -C <pkgRoot> rev-parse --show-toplevel` against the resolved root)
   rather than trusting any successful exit. That is the designer's "pin what
   the running package root is," turned into a test the implementation cannot
   satisfy by accident.

### Amended EV-57 `goal` (single line; replaces the draft)

> A resolver given a package root and an injected git reader returns the running pi-council identity — the `version` string read from `<pkgRoot>/package.json` and the short hash from `git -C <pkgRoot> rev-parse --short HEAD` — returning the literal degraded state `no-git-metadata` (no git metadata belonging to that root, including when an ancestor directory is a repository) or `git-unavailable` (git cannot be run), and never a throw, never a silent fallback, and never a substituted hash, proven by a test over a fixture package root asserting the version byte-equals that fixture's `package.json` version, the hash byte-equals the output of `git -C <fixture> rev-parse --short HEAD` on a fixture whose `core.abbrev` is pinned to 8 so the short hash is exactly 8 characters and a `slice(0, 7)` implementation fails byte-equality, a consumer-repo fixture at a different commit asserting the resolver reads the package root and not the consumer cwd, a `git worktree` fixture whose `.git` is a file, a `.git`-absent fixture asserting `no-git-metadata`, an ancestor-repo fixture whose package root has no `.git` but whose parent directory is a git repository asserting `no-git-metadata` and not the ancestor hash, and an injected reader that throws asserting `git-unavailable` with no exception escaping the resolver.

One non-binding mechanism note for the owner's `how` (not part of the goal): the
package already reads a running-package version in
`scaffoldPackageVersion` (`council-update.ts:235-241`, fallback literal
`"unknown"`, used by `scaffold.ts:182`). EV-57 owns *the* identity reader; it
must not fork a second one whose `"unknown"` fallback can leak into the
identity line, since `unknown` is neither of the two degraded states the goal
names.

## 7. EV-59's amended `goal` — arms the ledger found missing

Kept `Backlog`, chain-dependent, single child, unchanged scope: it is this
epic's end-to-end falsifier, and [[smoke-test]]'s standing discipline makes its
absence a defect ("the first Council command without an end-to-end falsifier is
a defect"). Amendments are evidence clauses, not scope:

- **rpc arm** (§5): the same fixture launch under `--mode rpc` puts exactly one
  `extension_ui_request` frame with `method: "notify"` on stdout whose `message`
  byte-equals the identity string. Without it, O3's branch stays open in the
  one place it could be observed.
- **`/reload` and resume non-refire** (designer P3): the live session that
  reloads or resumes emits no second identity line — the `reason` dispatch is
  proven against a real pi, not only a fake ctx.
- **fd-1 ordering** (designer P4): the headless negative asserts no line
  matching `council: pi-council v` anywhere on fd 1, ahead of or after the
  model's answer, rather than "the first line is not it."
- **Credential-free and budget-respecting**: the identity is emitted at
  `session_start`, before any dispatch, so the live arms must not require model
  credentials, and — per [[test-suite-budget]] — they ride the existing opt-in
  gate (`COUNCIL_INTEGRATION=1`) and the shared pty kit (`pty_kit.py`, the
  single screen model pinned by `test/faux-provider-shape.test.ts`), not a new
  private harness.
- **Red-at-base evidence** per [[red-base evidence]]: one seven-field record per
  arm; base is the commit immediately preceding EV-58's merge, so the expected
  red is mechanism-absent (the identity notify does not exist at base) — that
  boundary is skeptic-derived at verification, never owner-asserted.

### Amended EV-59 `goal` (single line; replaces the draft)

> A live `pi` launched with the council loaded from a fixture clone pinned to a known commit shows on start-up exactly the identity of that clone — the version from that clone's `package.json` and its `git rev-parse --short HEAD` — while a `/reload` and a resumed session in the same run show no second identity line, the same launch under `--mode rpc` puts exactly one `extension_ui_request` frame with method `notify` whose message byte-equals that identity string on stdout, and the same launch in `-p` and `--mode json` puts no line matching `council: pi-council v` anywhere on fd 1, proven by a pty test for the TUI arm and piped-stdout tests for the rpc and headless arms, credential-free and gated behind the existing opt-in integration flag, each arm carrying a red-at-base evidence record with the seven required fields against the commit preceding EV-58's merge.

## 8. Ledger item 4 — notify volatility is not a test obligation, and is accepted only provisionally

**Ruled:** EV-59 does **not** test "the user missed the toast." No falsifier can
observe a human's attention, and a card goal that names an unobservable
predicate is the unfalsifiable form skeptic's charter exists to reject. EV-58
and EV-59 prove the mechanism: the notification is emitted, once, at the right
time, through the right channel, with byte-exact text. Whether the eye caught
it is not a gate.

Designer's P1 and P7 are real and are **not** discarded — they route, which is
how this repo has always handled an out-of-band prediction: the EPIC-1 ruling
sent the `/settings`-visibility prediction "to the smoke test as an addition,
not to any card," on the ground that end-to-end UI behavior lives there
([[2026-08-25-po-ev1-escalation]] Q2), and the same shape later produced
**FLLWUP-68 — Cold-read persona smoke on /council-update's output surface
(designer P1/P6/P9)** as its own card rather than as a delivery gate on the
card that shipped the surface. So:

- If the human never sees the line in practice, the remedy is a **new** card
  (a discoverable re-ask surface), raised at step 13's follow-up gate — **not**
  a persistent row bolted onto EV-58. The persistent row is not free: it
  collides with the hub-progress widget and the below-editor tree (§5), i.e.
  it spends screen real estate on every session to serve a moment.
- This is a **provisional** acceptance, not a permanent one: I have not agreed
  that a transient surface is good enough as a standing property of the
  product, only that nothing in this epic's evidence can decide it. No
  escalation to steward is needed for a temporary acceptance.
- The information is never trapped: `git -C <install> rev-parse --short HEAD`
  answers the same question in one command, which is what makes best-effort
  tolerable here and would not be tolerable for a warning the human must act
  on (contrast the `warning` kind the drift and retry notifications use).

## 9. Gate notes for the human (not escalations)

Nothing in this ruling requires the steward, and nothing overturns a recorded
human decision — I checked specifically against EPIC-1's RULING 2 (no
council-owned status surface), which this ruling *follows*, and FLLWUP-4
(RPC silence is a bug), which §5 honors. No child's `goal` turned out to be the
defect; the defects were missing falsifiers and missing copy, both of which
this ruling supplies. Two readings of the human's own words are mine to flag,
not to settle silently:

1. **§4** — I read "the latest git hash from the repo" as *this clone's HEAD*.
   If you meant "the newest released hash, so I know I'm behind," that is a
   networked surface with a start-up-latency cost and belongs in a separate
   epic through `/features-new`, not in this one.
2. **§1** — I read "the first time" as *once per `pi` process*, so you see the
   line on every start-up rather than once ever. Say so at the gate if you
   meant the latter; it would be a different card, not a fold-in.
