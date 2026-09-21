# EPIC-11 recut, wave-2 designer attack — the surface and what's missing

**Seat:** designer. **Run:** `/features-new EPIC-11` recut (per the human's
"RECUIT this epic to take into account for our previous work in EPIC-13 to use
Typesafe's Jev" intake). **Wave:** 2 of 3 (attack wave-1's decomposition
artifact; do not re-slice, do not rule). The attack is in two parts: a critique
of the surface-touching `Intent` blocks for failing to name screen/copy/state
per the `/board-create-card` bar, and the observational missing-child arguments
I carry in my native format — none of them with a runnable settling test, all
grounded in what a consumer maintainer running `/council-setup` actually meets
when Jev is in the loop.

## 1. What changes for the person the moment this recut lands

A consumer maintainer runs `/council-init` (today: scaffold + `initialized, not
configured` notify) and then `/council-setup` (planned: the parent-TUI modal
driven by `rpiv-ask-user-question`). Wave-1's reframe is the right shape: the
interview obtains a seat-composition decision from a new setup gate domain
before the first human question, the **safe direction is `Default`**, the human
is still asked regardless, and the persona lives as a `<seat_emphasis>` note
rather than as a forked conviction body. That posture is sound — but it is the
**first question on a screen the person has never seen**, with copy that
EV-52's amended goal names in structure (`(Recommended)` suffix, header
carrying a profile field) but not in literal text. I name what's missing and
what the surface doesn't yet tell the person.

## 2. Surface-touching flag, by child

The procedural bar (the `/board-create-card` rule, the EPIC-10 surface critique
that named the same gap on EV-81/82/83): **a user-visible surface, if any, is
named in the child's `Intent` — which screen, which copy, which state.** Wave-1
flags three children as surface-touching. I read each `## Intent` against that
bar:

| Child | Surface-touching? | Names the screen? | Names the copy? | Names the state? |
|---|---|---|---|---|
| EV-85 | no (loader) | n/a | n/a (FAIL: line is engine error a person reads) | n/a |
| EV-86 | no (pure) | n/a | n/a | n/a |
| **EV-87** | **YES** (orchestration; basis lands on a surface like EV-82's step-13 line) | **no** | **no** | **no** |
| EV-88 | no (smoke) | n/a | n/a | n/a |
| EV-49 (amend) | no (validator); literal name is copy the interview surfaces (`re-asked` with the violation literal) | n/a | partial (literal name) | partial (six classes named) |
| EV-50 (amend) | partly (seat-emphasis block rendered to seat prompt; not user-facing UI, but a seat reads it) | partial (buildSystemPrompt join) | partial (persona is "subject") | n/a |
| **EV-52** (amend) | **YES** (parent-TUI interview modal) | partial (`ask_user_question` modal, first question = seat-composition) | **no** (literal text not pinned) | yes (off / Redefine / not-detected / host-cannot-ask named) |
| **EV-54** (amend) | **YES** (README/AGENTS.md copy) | partial (per-section heading granularity) | **no** (literal heading text not pinned) | partial (`gate.mode` named, no enablement teaching) |

The bar I am holding each against is the FLLWUP-75 shape on this codebase (the
"slow advisory gate" literal line, byte-exact, replaced not appended) and the
EV-82 precedent the recut cites (`Mode: <disposition> — <basis>`, four named
constituents on one line, one render state per unavailable state). EV-87, EV-52,
EV-54 do not clear it.

## 3. Findings, ranked by consequence

### Finding A — the seat-composition question has no profile-field citation

**Moment:** the first interview question, before any model/emphasis question.

**Principle violated:** EV-52's own amended goal. "Every recommendation citing a
field of a deterministic repo profile (language and package manager, test
runner and CI, monorepo shape, user-visible surfaces, docs inventory, wiki
presence, existing overrides, repo size) built before the first question."
The seat-composition decision is a Jev disposition, **not** a profile field —
and the reframe correctly acknowledges this ("A Jev disposition is **not** a
profile field: it is an external, currently-degraded judgment whose absence is
itself a state"). But EV-52's amended goal still requires the citation, so
the first question's header is left grammatically malformed. The human sees a
header that names a profile field, but the recommendation is Jev's. The first
screen of the interview reads like every other screen, then breaks the rule.

**Consequence to the person:** at the moment they need to weigh the
recommendation, the citation in the header cannot help them weigh it — because
the recommendation is not derived from the cited field. The header is a
signifier of provenance and the provenance is mis-attributed. This is the
largest standing design hazard (the gap between what the surface implies and
what the data knows) and it lands on the first question.

**Evidence:** wave-1 EV-52 `## Acceptance` (amended) lists "non-empty question
set each citing a profile field" as a bar; the reframe paragraph above
contradicts it for the seat-composition question; nothing in the slicing
reconciles.

**Smallest fix:** an EV-52 sub-acceptance that the first question's header is
explicit about its source — a profile-citation suffix is wrong; the right
suffix is the Jev disposition provenance. Concrete literal sketch (subject to
the owner's copy pass): header `council seats — Jev's recommendation: <disposition>`
instead of `council seats — <profile field>`. The `(Recommended)` suffix on the
option label stays; the trade-off sub-line on each option stays; the profile
citation rule applies from the second question onward.

### Finding B — `gate.mode: off` is invisible to the human

**Moment:** the human runs `/council-setup` with `gate.mode: off` (the
packaged default). The interview asks the seat-composition question, the
recommendation literal is `Default`, and the human reads that as "the system
recommends my repo keep the packaged seats." The system does no such thing:
the recommendation is the **fail-safe** because Jev was not consulted, and the
human never learns the difference.

**Principle violated:** signifier (the disposition's provenance is invisible)
and the "what the data can and cannot claim" standing concern. The data
cannot support the claim the surface implies; closing that gap honestly, not
with a disclaimer, is a permanent concern.

**Consequence to the person:** the human makes a seat-composition decision
thinking the system weighed their repo. The system did not. If they later
discover `gate.mode: off`, they have no signal that the interview's
recommendation was a fail-safe and not a judgment; if they never discover
it, they operate on a recommendation they believe came from Jev. The
EV-88 success-path proof requires a `Default` literal; today every live run
returns `Default` for an entirely different reason — and the test cannot tell
those two cases apart on the surface.

**Evidence:** EV-87 `## Acceptance` pins "basis exactly `gate call failed: <reason>`"
on every failure class, but does not pin the basis for `mode: off` — the
procedure never sees a gate call to fail, it sees a config flag. EV-54 names
`gate.mode` in a docs section but does not teach the maintainer "set
`gate.mode: active` to enable Jev's seat-composition decision; otherwise the
recommendation is always `Default`." EV-52 names the state but does not name
the literal distinguishing copy.

**Smallest fix:** two coordinated moves, both inside EV-52 + EV-54.

1. **EV-52 sub-acceptance** that when `gate.mode` is anything other than
   `active`, the first question's header carries a `gate.mode` provenance
   suffix: `council seats — Jev unavailable (<gate.mode>): Default`. The
   trade-off sub-line on the `Default` option names the gap ("the packaged
   seats are the safe direction; Jev did not weigh in because `gate.mode` is
   `<mode>`"). On `gate.mode: active` with a successful call, the header is
   `council seats — Jev's recommendation: <disposition>` (Finding A's
   literal); on a failed call, `council seats — Jev unavailable (gate call
   failed): Default`.
2. **EV-54 sub-acceptance** that the README's `/council-setup` section
   teaches enablement in one short paragraph before the heading list: what
   `gate.mode: off` means for setup specifically (Jev is not consulted; the
   interview's recommendation is the safe direction, not a judgment), and
   what setting it to `active` buys (a Jev-weighted recommendation, on the
   fail-closed arm still `Default`).

### Finding C — the persona question's literal copy is not pinned

**Moment:** the per-seat persona question, after the seat-composition decision.

**Principle violated:** EV-52's own grammar (recommendation cited, trade-off in
description, `(Recommended)` suffix on the label). The persona is the
**subject** of the seat-emphasis note per EV-50's amend — but the question that
elicits the persona is in EV-52's copy set without literal text.

**Consequence to the person:** the persona question reads as decoration unless
its options are concrete. A trade-off sub-line on "modeled on a real human
persona suited for the work" is vacuous — what are the options, and what
changes about the seat's behavior?

**Evidence:** EV-52 (amended) names the per-seat question but does not pin
the option count, the option labels, or the trade-off sub-line; EV-50
(amended) names the persona as the note's subject but does not bind the
validator to enforce "suited" — there is no rule that the proposed persona
must be appropriate to the seat's tier or to the work the seat will do.

**Smallest fix:** an EV-52 sub-acceptance that the persona question carries
two named trade-off dimensions in its description (`what the persona does
differently` + `what the persona costs in tokens`) and a literal pre-press
hint naming the seat's tier. The options are user-typed personas (the
`ask_user_question` tool's free-text path, or a "custom" option); the
validator's `frozen-seat-missing` arm does not gate persona appropriateness,
but EV-50's persona-as-subject clause is the place the future evaluator
checks ("did the persona change the seat's behavior in the next dispatch?").

### Finding D — the Redefine flow's question sequence is unspecified

**Moment:** the human accepts Jev's `Redefine` recommendation (or the human
picks `Redefine` directly when Jev is unavailable).

**Principle violated:** the activity the interview exists to support
("finish the task without losing your place"). EV-52 names the per-seat
persona question for every retained seat but does not name: (a) the question
that asks which packaged seats to drop; (b) the question that asks which
brand-new seats to add; (c) the question that asks which retained seats get
a persona; (d) the consolidation question that summarizes the proposed
roster before consent.

**Consequence to the person:** a Redefine path that asks only the persona
question produces a roster that has *every* packaged seat with a persona
note — i.e., not a Redefine. The human thinks they accepted a meaningful
change and got the packaged scaffold plus persona flair. This is the same
class of mistake FLLWUP-69 closed: an unsignalled action looks
indistinguishable from a benign one.

**Evidence:** EV-52 (amended) `## Acceptance` enumerates the per-seat persona
question and the validator re-ask; nothing enumerates a Redefine-only flow.

**Smallest fix:** an EV-52 sub-acceptance that the question sequence is
deterministic and named per path:

- **`Default` path:** one question (seat composition) + per-seat persona
  question + confirmation.
- **`Redefine` path:** seat-composition question + seat-set question (which
  packaged seats to drop, which to keep, in 2–4 options presented as a
  multi-select) + optional new-seat question (typed names) + per-kept-seat
  persona question + validator re-ask + roster-summary confirmation.

EV-52's amended goal has room for this; the pathing is the missing half.

### Finding E — EV-87's ledger line has no rendered-surface pin

**Moment:** the setup call's ledger line is written, but where is it read?

**Principle violated:** the EV-82 "presented, never written" precedent
(`rendered line is presented, never written: a test asserts the full
Mode: <disposition> — <basis> render appears in no card file`). The setup
ledger line carries a basis (`gate call failed: <reason>` or `Default` /
`Redefine` resolved) and a disposition; if it appears in a card file the
human has been deceived. EV-87's `## Acceptance` does not pin this.

**Consequence to the person:** the setup ledger line could end up in a
card's provenance section, an AGENTS.md audit, or a wiki ingest, and the
human would read it as a system verdict rather than a fail-closed status
recording.

**Evidence:** EV-87 (amended) `## Acceptance` lists "exactly one POST per
call, pinned model and endpoint, never the forbidden chat path; every
failure class yields status failed, disposition `Default`, basis exactly
`gate call failed: <reason>`, and one ledger line; no pathology produces
an automatic `Redefine`; the transport is imported, not re-declared." No
"presented, never written" pin.

**Smallest fix:** an EV-87 sub-acceptance that the setup ledger line is
read by the same surface as the followup ledger line (EV-82's step-13
chat line, the engine's `decisionLine` generic), and a test asserting the
setup line literal does not appear in any card file. This is the same test
EV-82 ships verbatim.

### Finding F — the setup domain's new disposition literals are not in the ledger schema

**Moment:** the first successful setup call writes a ledger line whose
`resolvedMode` is one of `Default` or `Redefine`.

**Principle violated:** the seam-cut observation in wave-1 ("Setup ledger
lines carry `resolvedMode` ∉ `GATE_DECISION_MODES`, which `gate-route.ts`
already rejects"). The recut names this as a "named residual" and ships the
work to the implementing owner; but `gate-route.ts:231` rejects non-`GATE_DECISION_MODES`
resolvedMode, so the setup domain's literal is **rejected on read** until the
schema widens.

**Consequence to the person:** a setup ledger line written today cannot be
re-derived from the ledger alone — the reader that wrote it cannot read it
back, and any surface that joins on `resolvedMode` (the followup's
`decisionLine`, the gate's `composeGateReview`) sees a malformed input.

**Evidence:** wave-1's seam-cut section; `gate-route.ts:231` (named in
wave-1's own reading). EV-87 (amended) `## Acceptance` does not name the
schema literal that must be added; neither does EV-85 (data surface) or
EV-86 (decision function).

**Smallest fix:** either EV-87 or EV-85 names the new
`GATE_DECISION_MODES` literal(s) (`Default`/`Redefine`) and asserts the
setup ledger lines are accepted by `gate-route.ts`'s `resolvedMode`
validator. This is a one-line schema widening, but it is the seam between
the new domain and the shipped infrastructure, and naming it on a card is
the difference between "succeeds at first call" and "succeeds at first
*successful* call."

### Finding G — the persona's seat-side use is unspecified

**Moment:** the persona note is written to `<repo>/$CONFIG_DIR_NAME/council/seat-emphasis/<seat>.md`;
a seat dispatches in the next run and reads its prompt. Does the seat read
the persona? Does the seat's behavior change in any observable way?

**Principle violated:** "knowledge in the world beats knowledge in the
head" — the persona is on the screen, but unless the seat reads it and
behaves differently because of it, it is decoration. The slicing says the
persona is "the seat's real-human persona" and "suited for the work the
seat will do," but neither is a falsifiable claim about seat behavior.

**Consequence to the person:** the maintainer invests five minutes writing
a persona note for the principal seat. The principal seat's next dispatch
reads `<seat_emphasis>` and ignores it. The maintainer concludes the
feature is theatre and files a follow-up that adds nothing of substance.

**Evidence:** EV-50 (amended) `## Acceptance` pins "the emphasis note's
subject is the seat's real-human persona and no packaged `council/agents/*.md`
is read or forked" — a structural pin, not a behavioral one. EV-52's
interview copy and EV-49's validator neither reference the persona.

**Smallest fix:** a low-cost evaluator-only test, not a card claim of
behavior change: a CDP-smoke-style cold read (the FLLWUP-101 shape) where
a seat with a persona note is dispatched, the seat's reply is captured,
and a fixed rubric of expected-but-not-required behaviors is checked.
Failure grounds a follow-up card, not an amendment to EV-50; this is the
correct posture for a "persona is decoration unless someone uses it" claim.

### Finding H — brand-new seats' emphasis notes and personas are unspecified

**Moment:** the human picks `Redefine` and adds a brand-new seat, e.g.,
`docs-writer` at `<repo>/$CONFIG_DIR_NAME/agents/docs-writer.md`.

**Principle violated:** EV-50's resource — `seat-emphasis/<seat>.md` —
assumes the seat exists; a brand-new seat has no packaged seat to
emphasize. The slicing does not name whether the interview asks the persona
question for a brand-new seat, nor whether the brand-new seat's emphasis
note is written *before* or *after* the conviction body is in place.

**Consequence to the person:** the human picks `Redefine`, names a
`docs-writer` seat, writes a persona note for it — and the note's subject
is a conviction body that doesn't yet exist, so the seat's first dispatch
has the persona without the body, and the order of writes is not in scope
for any acceptance.

**Evidence:** EV-50 (amended) `## Acceptance` enumerates "for a seat with a
note" — packaged seats only. EV-52 (amended) does not name brand-new seats.

**Smallest fix:** an EV-50 sub-acceptance that the loader reads emphasis
notes only for seats `listSeatNames` returns (the packaged + repo-local
union), and a brand-new seat gets its emphasis note written only after
the conviction body is on disk and resolvable. The ordering is a write
order inside EV-51's idempotent write path — not a new contract, just a
naming of which order the write path takes.

### Finding I — EV-88 is missing the active+credential success arm

**Moment:** the smoke phase runs against a fixture with `gate.mode: active`
and a resolvable credential. The fixture-forced `Default` variant is
useful, but it does not prove the success path.

**Principle violated:** "the standing discipline treats a Council command
without an end-to-end falsifier as a defect." EV-88 asserts the off-arm
and the unreachable-endpoint arm; the active+credential arm is missing.

**Consequence to the person:** the success path is exercised only by
EV-87's orchestration unit test, not by an end-to-end smoke. The
difference matters because EV-87 tests the transport in isolation;
EV-88's missing arm is the only place a real `/council-setup` invocation
with a real Jev call is exercised end to end.

**Evidence:** EV-88 (amended) `## Acceptance` lists "Both variants print
the recommendation literal `Default` and a non-empty question set; zero
seat-emphasis files and zero new agent files are created; a deliberately
injected seat-emphasis write makes the phase fail; the `active` variant
exercises the real `runSetupGate` fail-closed path (not a stub)." The
"active variant" is `mode: active` with an unreachable endpoint, which is
fail-closed, not success.

**Smallest fix:** an EV-88 sub-acceptance that a third variant runs with
`gate.mode: active`, a resolvable credential, and a fixture-forced
`Redefine` (via override `council/gate/setup/decision.json` thresholds +
override rules, the EV-78 precedent). The arm is opt-in (`COUNCIL_INTEGRATION=1`
or a sibling var); the default suite stays green without it.

### Finding J — the docs surface does not teach `gate.mode` enablement

**Moment:** the maintainer reads the README, finds `/council-setup` under a
`##` heading, and reads the heading prose. Nothing in the prose teaches
what `gate.mode: off` means for the setup interview.

**Principle violated:** the EV-78 precedent for docs-as-loader — the data
surface ships with documented enablement in the README, not in a
follow-up card.

**Consequence to the person:** the maintainer reads `/council-setup`
docs, runs the command, gets a `Default` recommendation, files a follow-up
that says "Jev never decided anything" — and the answer to that follow-up
is a one-line config change they could have made before running the
command. The README is the place that one-line config change belongs.

**Evidence:** EV-54 (amended) `## Acceptance` enumerates "Each of
`/council-setup`, the Jev seat-composition decision, `model-tiers.json`, and
`seat-emphasis` appears under a `##` heading in README." Nothing in the
enumeration names the `gate.mode` enablement paragraph.

**Smallest fix:** see Finding B's second half — an EV-54 sub-acceptance
that the `/council-setup` section includes one short paragraph before the
heading list teaching enablement.

## 4. What's missing from the slicing — observational, no settling test

These are the principal/designer completeness charter observations, not
skeptic's runnable falsifiers.

### Observation 1 — the seat-composition question's option text

EV-52 names the `(Recommended)` grammar and the trade-off sub-line but
does not pin the option labels or trade-off text. The recut's posture is
two options (`Default` vs `Redefine`), but the option labels in the modal
are not on a card. EV-78's deliberation made the followup option labels
literal data in `questions.json`; the setup domain's option labels deserve
the same discipline. Suggested: the option labels are `Keep the packaged
council (Default)` and `Customize the council (Redefine)`, with trade-off
sub-lines that name what each path costs in tokens / rounds / consent
acts. Pinning them on EV-85 (the data surface) makes them overridable per
repo, the same override pattern EV-78 ships for followup.

### Observation 2 — the per-card-class seating is merged with seat composition

EV-55 stays unamended and the reframe explicitly says "Deliberately not
merging EV-55." But the persona question is per-seat, and the per-card-class
seating question (when it lands) is also per-seat. The two questions look
similar on the surface and may collide on the interview flow. Naming the
seam between them now (EV-55 lands downstream, EV-52's interview defers
the per-card-class question until then) keeps a future card from
discovering the collision.

### Observation 3 — the seat-composition ledger line is not read by anyone

The followup ledger line is read by `composeFollowupReview` and rendered at
step 13. The card-gate ledger line is read by `composeGateReview`. The setup
ledger line, after EV-87's amend, is written but the reader is unspecified.
If the line is read only by the interview itself (to shape the next
question), the file is per-invocation, not per-repo — and the durable
audit belongs elsewhere. If the line is read at the next `/council-setup`,
it is per-repo — and a consent act is required to clear stale lines.
Either choice is fine; the slicing leaves it open.

### Observation 4 — the per-seat persona's first-dispatch observable

The persona-as-decoration concern (Finding G) is best settled by a
follow-up card that runs an evaluator smoke, not by an amendment to
EV-50. The slicing should not claim "the seat behaves differently" —
that is a behavior the maintainer will discover, not a contract the
validator enforces.

## 5. Acceptance I do not overturn

I am not attacking the slicing's reframe. The third gate domain + the
`Default` fail-safe + the seat-emphasis note + the `frozen-seat-missing`
validator literal are the right shape. The `gate.mode: off` keeps the
default behavior unchanged. The "human is still asked" posture is the
correct bias. The intent to "spread to other use cases" is not on a card
yet and need not be.

I am attacking what the surface does not yet tell the person. The recut
is sound; the literal-copy and the `gate.mode` teaching are the gap.

## Related

- [[followup-decision-gate]] — the third-domain precedent I am measuring against
- [[confirmation-authority]] — the `active` mode's "recorded decision is the
  source, never the confirmation" ruling; the setup domain inherits this
  posture via `gate.mode: active` + confirmation at the consent gate, but
  EV-52 does not name this inheritance
- [[gate-parity]] — the writer may be stricter than the runtime only where
  dispatch is also stricter; the setup domain's `gate-call-failed: <reason>`
  basis inherits the fail-closed transport verbatim
- [[metered-deliberation-routing]] — the shipped gate whose FLLWUP-104 drift
  is the reason every live setup call resolves `Default` today; the
  `gate.mode: off` finding is downstream of this same drift

## Sources

- `vault/raw/2026-09-19-po-epic11-decomposition-ruling.md` (the prior
  ruling)
- `council/cards/EPIC-11.md`, `EV-49.md`…`EV-56.md`
- `council/gate/followup/{questions,decision}.json`, `extensions/gate.ts`,
  `extensions/gate-run.ts`, `extensions/gate-followup.ts`
  (read directly, the seam-cut observations ground here)
- `vault/raw/2026-09-21-design-epic10-re-cut-surface.md` (the same seat's
  prior critique of EV-81/82/83 — the bar I am holding the recut to)
- `vault/raw/2026-09-22-po-ev84-step13-noul-shape-ruling.md` (the
  FLLWUP-104 evidence base)