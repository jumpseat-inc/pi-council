---
date: 2026-09-19
seat: product-owner
kind: ruling
subject: EPIC-11 — grounded, interview-driven council setup (/council-setup)
scope: wave-3 ruling on the wave-1 draft (EV-48…EV-55) and the wave-2 disagreement ledger
supersedes: null
---

# PO ruling — EPIC-11 decomposition

Ruling only. The epic goal, the child slices, and every undisputed child `goal`
stand as drafted. Where I amend a `goal` it is because that child's goal was
disputed on the ledger and the dispute cannot be closed without naming the thing
the judge must observe.

The question I held over every item: **does this serve the person the product
exists for, or does it serve the product?** The consumer maintainer running
`/council-init` in an unfamiliar repo is the person. The council looking
better-configured is the product. Several disputes below turn on that pair and
nothing else.

---

## 1. Epic goal — ratified, unchanged

Principal's one-liner is the intake's own sentence and is accurate. No
amendment. It carries the three load-bearing properties (grounded before asking,
recommended on every question, consent-gated + code-validated writes) and the
fence (no forked convictions, no relaxed opinions). Nothing in it is the defect.

## 2. States — chain-promotion, not a bulk promotion

The draft put EV-48…EV-54 `Ready` simultaneously. That is the exact pattern
[[chain-promotion]] was ruled against: "promoting them all at once invites each
card to spec dependencies that don't exist yet," and the cadence was bound once
in the EPIC-4 ruling (P1–P5) and executed at all four EPIC-4 links and all five
EPIC-7 links.

- **EV-48 — `Ready`** (chain head; promotes at board authoring).
- **EV-49, EV-50, EV-51, EV-52, EV-53 — `Backlog`**, each promoting to `Ready`
  the moment its predecessor's merge SHA is on local `main` with
  `python3 council/validate.py` clean. Predecessor order is principal's chain
  (48→49→50→51→52→53); EV-54 promotes after EV-52.
- **EV-55 — `Backlog`**, with a precondition on promotion (§11).
- **EV-56 — proposed new `Backlog` child** (§12).

This is a cadence ruling, not a re-slice: no child's scope, order, or goal
changed because of it.

## 3. O3 — "cost band" is dropped from the tier predicates

`CatalogueModel` is `{provider, id, name, reasoning, thinkingLevelMap}` —
facilitator-verified, and I confirmed the type directly
(`extensions/catalogue.ts:11-17`). There is no cost input. The input *could* be
plumbed (pi's static catalogue carries `model.cost`, per [[cost-provenance]]),
but should not be, here:

- [[cost-provenance]]'s finding is that pi's figure is a **`catalogue-estimate`**
  and that the listed price need not be the routed provider's charge (a 2–5x
  divergence was traced to upstream routing, not stale rates). EPIC-7 exists to
  stop exactly this class of plausible-but-false figure.
- [[gate-parity]] rejects a gate "bound to volatile catalogue metadata that is
  known-unreliable" — that was a stated reason the `.council.json` writer has no
  capability gate.
- Invariant 3 is about *intelligence*, not price. A tier that encoded cost would
  let a cheap model be argued into a deep seat.

Cost survives where it does serve the person: as **prose in the trade-off
sub-line** of a recommendation, where a human can weigh it. If it ever becomes a
predicate it must carry its basis label and must never be a violation class.

## 4. O4 — the diversity floor and the family axis

- **Family axis:** the vendor segment — the first path segment of `id` after the
  `provider/` prefix (`openrouter/deepseek/deepseek-v4-pro-0813` → `deepseek`).
  Designer's axis, adopted. The *provider* segment is useless as the axis today
  because every pin is `openrouter/...`, so a provider-family floor of 2 would be
  unsatisfiable and a floor of 1 trivially met. Reject "provider family" as the
  metric name; it invites exactly that misreading.
- **Floor integer: 3 distinct vendor families among the seated roster.** The
  shipped scaffold seed resolves to 4 (`z-ai`, `deepseek`, `minimax`, `qwen`),
  so 3 passes the shipped profile with one seat of headroom while a roster
  collapsed onto one or two lineages breaches. A floor of 2 satisfies the letter
  of invariant 4 but lets a nine-seat roster run on two models and call it
  diverse; a floor of 4 makes any legitimate re-pin a breach and would be
  quietly widened the first time it annoyed someone — a floor that cannot
  survive contact with a real re-pin is not a gate, it is a countdown.
- **Non-vacuity is the requirement:** the goal must carry a test that a
  one-family roster returns `diversity-floor`, and a test that the packaged
  roster returns `ok`. Under a floor of 1 neither test exists and the breach
  class is empty — skeptic's finding, sustained.

## 5. O2 — EV-49's referent, the floor predicate, and the literal violation names

Skeptic is right that the two model sets differ on 7 of 9 seats, and right that
"both validate ok" is incoherent under a *ranking* floor. The fix is not to pick
one referent; it is to see that they are **two different profiles, both of which
must be legal**:

- **proof A** — the profile assembled from the nine packaged seats' frontmatter
  defaults validates `ok`. This is "the council's convictions are legal."
- **proof B** — the profile in `council/scaffold/.council.json` validates `ok`.
  This is "a fresh repo is born legal, not born in violation." Nothing requires
  the two to agree; the drift is a fact about the payload, not a contradiction.

The floor itself is a **capability predicate per tier** — `reasoning === true`
and the proposed level ∈ `supportedThinkingLevels` with `≥` the tier's minimum —
because that is the only thing derivable from the catalogue
(`ModelEntry.supportedThinkingLevels` via pi's `getSupportedThinkingLevels`, the
sole capability authority per `catalogue.ts:6-9`). Skeptic's consequence — that
this makes "principal and steward sit in the deepest tier" vacuous — holds only
if the deepest-tier claim is read as a capability claim. Read it as what it is:
a **relational constraint over the map**, i.e. no seat's tier rank exceeds
principal's or steward's. Then the capability predicate does the per-seat work
and the relational constraint does the ordering work, and neither is vacuous.
The tier set must therefore be an **ordered named set** (ranked), not a bag of
labels, or the ordering constraint is untestable.

**Literal violation names, pinned** (designer's finding: prose class names are
stub-satisfiable by `["anything"]`): `tier-floor`, `judge-model-collision`,
`skeptic-model-collision`, `diversity-floor`, `unknown-model`,
`invalid-thinking`. Each test asserts its literal, and the two collision names
are distinct from each other by construction — a shared `model-collision` string
would let one arm satisfy both tests.

## 6. O5 — one typed parse, and it throws

`loadModelTiers(repoRoot)` is exported from EV-48 and imported by EV-49; the
validator never re-parses the file, and neither consumer declares its own shape.
On the failure posture the two shipped precedents disagree and only one is
right for this resource: `loadModelFloors` (`extensions/index.ts:72-87`)
collapses a malformed file to `{}` — correct for a max-tokens hint, **wrong for
a gate input**, where silent degradation means every violation class goes quiet
green and the validator approves whatever the interview proposes. The tier map
follows `loadCouncilConfig` instead: malformed JSON, an unknown tier name, a
missing relational field, or a seat absent from the map **throws and names the
offender** ([[override-resolution]]: "Malformed config or invalid values throw
rather than silently degrading"). This is not a style choice; a fail-open
constraint file is how a hard gate becomes theatre.

## 7. EV-50 — "consumer-side-only" made testable, and O6's demotion

- The non-vacuity proof is the **stray packaged directory**: the resolver's
  precedence list for an emphasis note contains exactly one directory,
  `<repo>/$CONFIG_DIR_NAME/council/seat-emphasis/`, and a test asserts that a
  file placed at `PKG_ROOT/council/seat-emphasis/<seat>.md` is **not** read into
  the prompt. This mirrors `seatDirs` (`seats.ts:530-533`), which is two entries
  for seats and must be one for emphasis notes. Designer's settling test,
  adopted.
- **O6 sustained:** skeptic is right that the byte-identity proof is
  tautological — no consumer-side write reaches `PKG_ROOT/council/agents/*.md`,
  so that assertion passes against an emphasis feature that does nothing at all.
  It is retained only as a regression guard and is no longer the proof; the
  sibling-block assertion (both `<repository_grounding>` and `<seat_emphasis>`
  present when both exist) plus the stray-directory assertion carry the child.
- Ring 0 invariant 2 is satisfied by construction here and worth stating in the
  Intent: `buildSystemPrompt` (`seats.ts:592-598`) joins an array, so a new
  element is a sibling and cannot displace `groundingBlock`. Nothing in this
  child may reorder or condition that block.

## 8. WHD-2 — `preflight.sh` stays a write surface; no convention-6 amendment

The designer named this wholesale and was right to name it. It is not a contract
amendment, and the premise that it is one is wrong in its reach.

AGENTS.md convention 6's data-class enumeration is **scoped to the
`/council-update` refresh path**. Read it that way and the world is consistent;
read it as a blanket ban and two shipped write paths are already violations:
`/council-models` writes `.council.json` (EV-24, `writeSeatOverride`,
`council-config-writer.ts:253`, Done), and the wiki-ingest flow writes
`vault/wiki/**` (EPIC-10's EV-46/EV-47 are live cards). Both surfaces appear in
the same enumeration. So the rule is: *the package never pushes its bytes over a
consumer's data-class file.* `/council-setup` does not push packaged bytes; it
records a human's answer into their own file.

Grounding that settles it on the merits: the scaffolded
`council/scaffold/council/preflight.sh` carries a section literally headed
`---- Project tooling gate (adapt to your project) ----`, printing
`ok "project tooling gate — extend with your project's checks"`. [[preflight]]
records the same: "the shipped scaffold checks none by default; it invites the
repo to add its own build-tool, project-root, and dependency checks." The intake
asking the interview to fill in that section is the file being used for the one
purpose its own header states. Leaving it unfilled — the alternative — is the
mechanism that fails the user: a freshly-init'd repo whose council runs with no
project gate at all, which is exactly the gap this epic exists to close.

Two boundaries I do hold:
- The write is **append-into-that-section only** (idempotent, guarded by a
  marker the writer looks for), never a rewrite of the file, and never touches
  the superpowers / ask-user-question / MCP / OpenRouter gates.
- **FLLWUP-66 is untouched and its PO R1 is not overturned.** That recorded
  decision ("`--refresh-file` … not v1") governs *pulling packaged bytes into* a
  data-class file via `/council-update`. `/council-setup` is the opposite
  direction (recording a human's selection) and a different command. FLLWUP-66
  stays `Backlog` on its own merits.
- EV-54 records the scoping in prose — one clause in convention 6 naming
  `/council-update` as the subject of the never-written list — so a future
  contributor does not re-litigate this. That is a clarification of scope, not
  an amendment of the rule.

Remaining open items on EV-51, ruled: "matches" is defined **per surface,
semantically** (`.council.json` = field equality on `council.<seat>.{model,
thinking}`; `seat-emphasis/<seat>.md` = byte equality; `vault/wiki/**` = page
exists and its body is unchanged, never a whole-index byte compare;
`mcp.json` = the set of registered server keys, not file bytes; `preflight.sh` =
the marker-delimited block is present with identical bytes). Consent is
**per-surface, with one consolidated plan echo first** — the plan lists every
target and its resolved value, one Enter accepts the plan, and a surface
individually declined is skipped. That is [[echo-then-run]]: the echo quotes the
exact tuples through the same functions the write uses, so echo == write by
construction, and declining one line does not cost the person a re-interview.
The no-consent stub-satisfiability is closed by requiring the pair to exercise a
real consent-granted overwrite **with a backup** for each of the five surfaces,
not merely an early return.

## 9. O1 — the headless seam, and the signal is `hasUI`, not `ctx.mode`

The designer's hazard is real but its diagnosis is wrong on the facts, and its
proposed settlement is unimplementable.

The extension **strips `ask_user_question` from the LLM's tool list when
`!ctx.hasUI`** (`reconcile.ts:25-38`), and RPC/ACP hosts (VSCode pendant, Zed,
Paseo) are deliberately *not* stripped because `rpc-fallback.ts` renders the
questionnaire through `ui.select`/`ui.input`. So headless `-p` does not hang,
auto-approve, or refuse — it presents a **missing tool**, and an LLM told
"every question goes through `ask_user_question`" will improvise. Its own error
string tells it to "ask the questions as plain chat text instead." Combine that
with EV-53's automatic same-turn handoff and **`smoke` Phase 0 — which runs
`pi -p "/council-init"` — becomes an unattended interview that can write a
fitted configuration with no human anywhere.** [[smoke-test]] records Phase 0's
assertions as "non-clobber (`.council.json`, `preflight.sh`, `board.md`
survive)": a setup turn that writes any of them headlessly turns the release
harness into the thing that violated invariant 9.

The proposed settlement `on ctx.mode != 'tui' … and exits non-zero` fails twice:
a markdown procedure has no `ctx` and cannot set an exit code (and [[headless-pi]]
records that print mode owns the exit code and needs a one-shot `exit` listener
even for the *engine*), and `mode != "tui"` would needlessly kill the interview
in every RPC host that can genuinely ask.

Ruling, split by which surface can actually observe the condition:

- **EV-53 (engine, TS) owns the gate.** `/council-init` performs its handoff
  **only when the host can ask**; otherwise it scaffolds, reports that the repo
  is initialized but not yet configured, and names `/council-setup` as the next
  interactive step. Zero writes, no interview turn started. This is the same
  placement call the shipped handler already makes for TUI fire-and-forget vs
  headless `waitForIdle` (`index.ts:836-857`): the engine knows the mode, the
  prose does not.
- **EV-52 (procedure) owns the degrade.** When `ask_user_question` is not
  available, `/council-setup` runs the probes, prints the repo profile and every
  question it would have asked with its recommendation and trade-off, writes
  nothing, and tells the human to re-run interactively. Adopted from
  [[remote-oauth-login]]: the product's settled headless idiom is *print the
  thing the human must act on and resume in a later interactive turn* — never
  refuse-with-a-mystery-failure and never proceed on assumed answers.
- Esc/cancel is a first-class refusal state, not an error: the tool returns
  `cancelled: true` with a DECLINE envelope, and RPC-vs-decline are
  distinguishable (`undefined` from `ui.custom()` means host-cannot-render,
  never user-declined). EV-52 must treat decline as stop-with-no-writes and
  `no_custom_ui` as the degrade path.

## 10. O7 — the recommendation marker is not the council's to invent

The tool's own shipped guidelines (`ask-user-question.ts:292`, repeated at
:279) say: *"If you recommend a specific option, make that the first option in
the list and add '(Recommended)' at the end of the label."* There is no
`recommended` field in `OptionSchema`, and inventing a marker token would be a
council-private convention that the RPC dialog walker (`formatOptionLine`,
`rpc-fallback.ts:60-63`) and any future extension version are free to ignore.

Ruling: EV-52 uses **the tool's documented grammar** — recommended option
**first** in `options`, literal `(Recommended)` suffixed on its `label`,
trade-off in `description`, and the cited profile field named in the `header`
chip (≤ its documented max length) or the question text. The fixture asserts
both the literal suffix and the first-position ordering. Reserved-label safety
follows: `(Recommended)` is a suffix on a 1–5 word label, not one of the
reserved `Other` / `Type something.` / `Next` rows.

"Every question cites a profile field" is closed against the zero-question stub
by requiring the fixture to assert **a minimum non-empty question set** covering
each decision the interview owns (model/thinking per tuned seat, gate selection,
MCP server selection, seat-emphasis offer, wiki-seed offer) and an explicit
**missing-profile-field** state: a probe that could not resolve prints as
"not detected — I can't recommend this one" rather than silently dropping the
question. Never ask what a probe can answer, and never pretend to recommend what
it could not.

## 11. WHD-1 — EV-52/EV-53 stay Ready; the copy literals the dispute actually turned on are pinned now

I reject designer's option (a), downgrading both. These two cards carry the
chain's contracts — the consent-preserving handoff and the headless branch —
and downgrading both stalls EV-51 and EV-54 behind a documentation-taste gap
that is not a contract gap. Option (b) is also wrong as stated: the goal need
not pin *all* copy, but it must pin the copy that a judge would otherwise have
to guess at, and until this ruling the headless contract was not pinned at all.

Settled: EV-52 and EV-53 remain `Ready` (subject to §2's cadence), each with its
goal amended to name the items the ledger found missing — the marker literal and
the degrade behavior for EV-52, the hasUI gate and its post-scaffold report copy
for EV-53. The remainder of the copy set (the notify line's exact wording, the
refusal-re-ask phrasing, the idempotent-resume summary) is the card's own
designer deliverable at steps 2–3, which is how this repo has always settled
taste: ruled literals recorded mid-card and pinned by test, as with EPIC-9's R5
countdown copy and EPIC-6's 10-copy parity pins ([[parent-turn-continuation]]).
Where the designer was right on principle — the Intents were gists — I hold them
to it: an Intent that names no surface is not an Intent, and both cards'
Intents are rewritten before delivery. That is the owner's work, not mine.

**EV-55 terminology.** "Core loop seats" is rejected as a term: it collides with
the dispatch set, and designer's fact is right — `council-runner`'s
`spawns: [owner, principal, designer, skeptic, consolidator, judge]` seats owner,
principal and designer too, so the intake's frozen five are not "the loop." The
correct term is the **frozen roster**: the five seats the intake names as not
removable by consumer tuning — `skeptic`, `judge`, `product-owner`, `steward`,
`consolidator` — and the reason is Ring 0 invariant 1 (they are modeled on real
people and their removal weakens a conviction), not a claim about dispatch
order. EV-55's goal must say *frozen roster*, must not imply the others are
optional, and must state that its mechanism (surface, file, how `council.md`
reads it) is unspecified until the card is elaborated. `Backlog`, as principal
ruled; promotion additionally gated on (i) the mechanism being named, and (ii)
whether a domain seat authored by the interview is a **sixth write surface**
that EV-51 does not yet enumerate. EV-52 correspondingly does **not** ask the
per-card-class seating question — that question has no home until EV-55 exists,
and an interview that asks what it cannot write is worse than one that doesn't
ask.

## 12. The two completeness observations, and one the ledger missed

- **The "Onboarding run" idiom — out of scope, no child.** Neither the intake as
  recorded before me nor any file in this repo contains an "Onboarding run"
  idiom; a repo-wide case-insensitive search for *onboarding* returns only
  unrelated vendored skill files. The observation rests on a premise I cannot
  verify, so I do not fund it. The behavior it wants is already the house
  mechanism: a ticket-shaped follow-up surfaces as a card through step 13's
  follow-up confirmation gate (re-homed to this seat in the EPIC-9 residual
  run, and pinned pre-write by FLLWUP-69). No new surface, no child.
- **The "consent receipt" surface — fold-in to EV-51, and it is already a
  shipped record type.** `<repo>/$CONFIG_DIR_NAME/council/scaffold.json`
  (`scaffold.ts:43-45`) is the consumer-side provenance record, and
  `council-update.ts:17-18` states the rule: "The record updates only after a
  consented write." The intake's item 9 already requires provenance recorded for
  `/council-update`. So EV-51's writers must **update that existing record on
  each consented write**, not invent a receipt surface. Cheapest-to-reverse and
  it keeps one audit trail rather than two.
- **A gap neither wave named: `/council-setup` has no end-to-end falsifier, and
  the standing rule says that is a defect.** [[smoke-test]]: "the first Council
  command without an end-to-end falsifier is a defect." Phase 0 will now drive a
  headless `/council-init` whose contract includes *not* interviewing, and no
  child proves it. **Proposed EV-56** (`Backlog`, off-chain, required before the
  epic releases): a smoke phase asserting that a headless `/council-init`
  scaffolds, hands off or declines per §9, and leaves `.council.json`,
  `preflight.sh` and `board.md` byte-identical to the scaffold, plus that
  `SMOKE_PHASE` selects the new phase in isolation (the FLLWUP-11 selector is
  the mechanism). I flag this at the gate rather than authoring the board; the
  id needs re-checking at fetched HEAD before it is written
  ([[card-id-allocation]]).

## 13. Nothing escalated

No ruling here changes the portfolio. I did not decline a card, I did not accept
a residual permanently (the cost-band drop is reversible by a later epic and is
a design call inside this one, not a standing wound), I did not touch a recorded
human decision — FLLWUP-50's PO R1 governs the refresh direction and stands
untouched, and the human's intake decision to write `preflight.sh` is honored
rather than re-litigated — and no child's `goal` turned out to *be* the defect.
If the steward reads convention 6 differently than §8 does, that is the steward's
call and this ruling should be reopened, not worked around.
