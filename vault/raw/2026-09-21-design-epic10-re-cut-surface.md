# EPIC-10 re-cut, wave-2 designer attack — the surface

**Seat:** designer. **Run:** `/features-new EPIC-10` re-cut. **Wave:** 2 of 3
(attack wave-1's decomposition artifact; do not re-slice, do not rule). The
attack is in two parts: a critique of the surface-touching `Intent` blocks
(EV-81, EV-82, EV-83) for failing to name the screen/copy/state per the
`/board-create-card` bar, and the observational missing-child arguments I
carry in my native format — none of them with a runnable settling test, all
of them grounded in what a person at step 13 or at run close actually meets.

## 1. The surface today, before this epic lands

`council/procedures/council.md` step 13 (verbatim, the only surface here):

> Draft the follow-up card(s) and present them to the human to edit, drop,
> or approve — write nothing to `council/cards/` that the human has not
> approved. Only after approval, write the approved cards, run
> `python3 council/validate.py` until it is clean, and commit.

The pre-write confirmation gate is pinned by `FLLWUP-69`
(`council/cards/FLLWUP-69.md`); the slow advisory card-gate render is
modeled by `FLLWUP-75` (`council/cards/FLLWUP-75.md`) — a literal line text
(`gate: advisory call in progress · <id>`), replaced not appended, zero
lines after settle, no failure or deliberation wording. `FLLWUP-75` is the
shape of an existing surface-touching card on this codebase; it is the bar
EV-82 must clear.

The container return contract today is four tags
(`council/procedures/features-deliver.md` Phase 2): `ESCALATION` | `DONE` |
`RETIRED` | `HALT`. None carries a disposition outcome. The Phase 3 ledger
line is what the run emits at close; today it carries merge bases and
follow-ups filed, nothing more.

## 2. Where wave-1 names the surface but does not pin it

Three children in the wave-1 artifact are tagged "surface-touching":

- **EV-82** — the step-13 chat line ("the `Mode:` disposition line and the
  merge/drop copy, and the absence of an unqualified decision when the gate
  is off"). `## Intent` names the surface in the abstract, not the text.
- **EV-83** — the Phase 3 ledger line and the container
  `ESCALATION`/`DONE` completion copy. `## Intent` names the surface in the
  abstract, not the text.
- **EV-81** — mostly engine, but the fallback is surface: "the run reaches
  the human draft-then-confirm step" when the gate call fails. `## Intent`
  names the engine posture, not what the person sees.

A fourth child is arguably surface-touching and not tagged:

- **EV-78** — packaged data under `council/gate/followup/`. The
  `## Acceptance` quotes a `FAIL: <file> has an invalid <key> — …` line,
  which is an engine error a person will read at the loader stage. Not a
  primary surface; carry as observation only.

The `/board-create-card` procedural bar: *"A user-visible surface, if any,
is named in the child's `Intent` — which screen, which copy, which state."*
EV-82 and EV-83 each name a screen (`step 13`, `Phase 3`) and a state
(`off`, `advisory`, `active`), but **none of them names the copy** with the
literal specificity `FLLWUP-75` already uses on the same codebase.

## 3. Findings, ranked by consequence

### Finding A — `Merge` target is not on the line

**Moment:** step 13, when the disposition is `Merge`.

**Principle violated:** signifier (and the
`knowledge-in-the-world-beats-knowledge-in-the-head` corollary).

**Consequence to the person:** A person reading `Mode: Merge — basis` at
step 13 cannot name *what* the candidate is being merged into. The basis
text is "single-line deterministic" per wave-1 but does not require a
target id; the disposition vocabulary `File|Merge|Drop` does not carry a
target. The person must open `council/board.md` or scan the run's other
not-yet-drafted candidates to find the target. This is a Gulf-of-Evaluation
failure: the system knows the merge target (the card packer's same-run
sibling list and the board's open-card list, per EV-80) but the surface
does not.

**Evidence:** wave-1 EV-82 `## Acceptance` quotes the disposition as
`Mode: <disposition> — <basis>` and pins basis as "single-line
deterministic" with no target-id requirement. Wave-1 EV-80 packs board and
sibling data; the line does not carry it.

**Smallest fix:** an EV-82 sub-acceptance that the rendered line carries
the merge target verbatim — either as `Merge → EV-<n>` (into an existing
card) or `Merge ↔ <sibling title>` (into another surfaced candidate). The
form should match the wave-1's basis single-line rule so the line stays
one line.

### Finding B — `Drop` cost is not on the line

**Moment:** step 13, when the disposition is `Drop`.

**Principle violated:** signifier (the `cost surface` analogue — a
destructive decision without a visible cost is a forcing function in the
wrong direction).

**Consequence to the person:** A person being told Jev recommends `Drop`
on a candidate cannot see what is being lost from the line alone. The
candidate's title or identifying line must be on the line, otherwise the
person has no visible cost to push back on. This is the same class of
defect FLLWUP-69 closed for the pre-write posture: an unsignalled
destructive action looks indistinguishable from a benign one.

**Evidence:** wave-1 EV-82 `## Acceptance` does not require the line to
carry the candidate's title or id for any disposition.

**Smallest fix:** an EV-82 sub-acceptance that every disposition line
leads with the candidate's title (or a deterministic short-form: the
candidate's id when the title is too long). This is the same
"knowledge-in-the-world" move Finding A asks for.

### Finding C — the mode signifier is missing on the line

**Moment:** step 13, in `advisory` or `active` mode.

**Principle violated:** mapping (same text, different consequence is a
mapping failure, not a feature).

**Consequence to the person:** EV-82 says `advisory` "renders without
enforcing" and `active` "applies after confirmation." Same line text,
different consequence. A person at step 13 cannot tell whether they are
looking at a recommendation (advisory) or a pre-write disposition (active)
without reading `.council.json`. The wave-1 epic `## Acceptance` says
"`off` leaves step 13 unqualified; `advisory` renders as information
without enforcing; no mode writes a card before the human's confirmation"
— but does not name the rendered text.

**Evidence:** wave-1 EV-82 `## Acceptance`; EV-82 `## Intent`.

**Smallest fix:** an EV-82 sub-acceptance that the rendered line carries
the live mode qualifier — e.g., `Mode (advisory): File — basis` vs
`Mode (active): File — basis`, or absent for `off`. Byte-stable, replaced
not appended. The qualifier is the smallest text change that closes the
gulf.

### Finding D — the unavailable-state render is unnamed

**Moment:** step 13, when the gate is `off`, when the gate call fails,
when the credential does not resolve, or when Jev's model-card page still
says coming-soon (the wave-1 itself names this as a real availability
state).

**Principle violated:** emotion is functional (a person under time
pressure on an unfamiliar path is anxious; an interface that names an
absent decision calmly is doing real work). The analogue for the card
gate is `FLLWUP-75` — a literal slow-advisory line with zero lines after
settle, no failure or deliberation wording. The follow-up surface has no
analogue.

**Consequence to the person:** A person in `off` mode, a person whose
gate call failed, and a person whose credential did not resolve all see
the same step-13 prompt — drafted cards, no `Mode:` line. They cannot tell
"no one decided" from "the decider could not be reached" from "the gate
is off by configuration." The wave-1's own seam #9 flags this: *"What a
person sees when Jev is unreachable … is unnamed; may need a surface
child."*

**Evidence:** wave-1 seam #9; wave-1 EV-81 `## Acceptance`; wave-1 EV-82
`## Acceptance` (the `off` clause). FLLWUP-75 is the existing analogue
on the same codebase.

**Smallest fix:** an EV-82 sub-acceptance that names the rendered line
for each unavailable state — `off` (gate disabled), `gate call failed:
<reason>` (EV-81), credential unresolved (EV-81), model-card coming-soon
(wave-1 itself flags). Modelled on FLLWUP-75: a literal line text,
replaced not appended, returning zero lines when the gate resolves and is
applied. If product-owner rules EV-82 cannot carry all four states, file
as a missing child — but my position is that EV-82 is the right home
because the surface is the same line.

### Finding E — the container report's disposition outcome is partial

**Moment:** run close, when a runner returns one of the four tags
(`ESCALATION` | `DONE` | `RETIRED` | `HALT`).

**Principle violated:** signifier (a tag without a sign is a label, not a
disposition).

**Consequence to the person:** Wave-1 EV-83 says "the four-tag report
carries the follow-up outcome on `DONE` (and `RETIRED` where a candidate
is dropped)" — but says nothing about `ESCALATION` (gate failure or
unresolved credential) or `HALT` (environment failure). A person reading
`ESCALATION: <candidate-id>` cannot tell what action is implied. A person
reading `HALT:` cannot tell whether the disposition was ever reached.

**Evidence:** wave-1 EV-83 `## Acceptance`; `council/procedures/features-deliver.md`
Phase 2 four-tag contract.

**Smallest fix:** an EV-83 sub-acceptance that all four tags carry a
disposition-outcome line — `DONE` and `RETIRED` per wave-1; `ESCALATION`
carrying the gate-failed/unresolved basis and the candidate id; `HALT`
either pinning "no disposition reached" or carrying the partial state.
Either way, a person reading the report must be able to tell what
happened.

### Finding F — the pre-write clause is preserved but the surface is unnamed

**Moment:** step 13, the moment of confirmation.

**Principle violated:** constraint on a surface is not the surface.

**Consequence to the person:** EV-82's `## Acceptance` preserves "no
mode writes a card before the human's confirmation" — the forcing
function, correctly. FLLWUP-69 pins the clause in prose. But what the
person SEES at the moment of confirmation — the line, the disposition,
the candidate text — is not pinned by this epic. The pre-write pin is
about *when*; the surface pin is about *what*. They are different
questions.

**Evidence:** wave-1 EV-82 `## Acceptance`; FLLWUP-69 `## Acceptance`.

**Smallest fix:** this is largely a consequence of Findings A–D being
fixed; once the line carries the disposition + target/cost + mode + (when
applicable) the unavailable qualifier, the pre-write moment becomes the
moment the person reads the line, confirms, and the run proceeds. The
smallest fix is the same fix.

## 4. Observational missing-child arguments

I carry three observations the design seat owes the wave-3 product-owner
on. None has a runnable settling test; they are person-needs arguments,
not falsifiers. Per the wave-2 charter, my seat owns observational
missing-child arguments in native format.

a. **Unavailable-state render.** Wave-1 seam #9 raised this and did not
   resolve it. From the design seat it should ride EV-82 as a
   sub-acceptance (Finding D). If product-owner rules EV-82 cannot carry
   four unavailable states, it is a missing child. My position: ride
   EV-82 — the surface is the same line, and one card owning the full
   surface is cheaper than two cards owning halves.

b. **Mode signifier on the line.** Same logic as the unavailable render:
   ride EV-82. If product-owner prefers to separate the surface contract
   from the procedure binding, file as a missing child. My position:
   ride EV-82 — the qualifier is part of the line, not a separate surface.

c. **Container report disposition-outcome line for all four tags.** Wave-1
   EV-83 owns `DONE` and `RETIRED`; `ESCALATION` and `HALT` are unnamed.
   From the design seat this rides EV-83 as a sub-acceptance (Finding E).
   If product-owner rules EV-83 cannot carry all four, file as a missing
   child. My position: ride EV-83 — the runner report is one surface
   owned by one card.

## 5. Falsifiable predictions

Each prediction states a hypothesis I would hand to `skeptic` as an
out-of-band smoke (the repo's render-smoke script, never the gate config).
A CDP smoke walks the rendered surface in a real pi session and asks a
cold-read persona; that is the falsifier for these design claims.

1. **The `Mode: <disposition> — <basis>` line is a tag, not a sign.**
   *Hypothesis:* a person reading `Mode: Merge — basis` at step 13
   cannot name the merge target from the line alone. *Smoke:* render the
   step-13 prompt with a `Merge` disposition, ask the persona "where
   does this merge to?" — if the answer requires opening the board or
   reading the basis line, Findings A and F are correct.

2. **`advisory` and `active` produce byte-identical line text.**
   *Hypothesis:* the rendered `Mode:` line is the same string in both
   modes. *Smoke:* side-by-side render of the same disposition under
   both modes — if the lines are byte-identical, Finding C is correct.

3. **`off` and unavailable/failed produce the same surface.** *Hypothesis:*
   a person in `off` mode and a person whose gate call failed see the
   same step-13 prompt. *Smoke:* render comparison — if the lines are
   identical, Finding D is correct.

4. **The container `ESCALATION` is a tag, not a sign.** *Hypothesis:* a
   person reading `ESCALATION: <candidate-id>` in a runner report
   cannot tell what action is implied. *Smoke:* render the report with
   one `ESCALATION` entry, ask the persona "what do you do?" — if the
   action is not on the line, Finding E is correct.

5. **The `Drop` disposition does not name what is being dropped.**
   *Hypothesis:* the rendered step-13 line for `Drop` does not contain
   the candidate's title or id. *Smoke:* capture the rendered line for
   a `Drop` candidate; if the title is absent, Finding B is correct.

## 6. Preferences, ranked last

- I would prefer the disposition line to read as
  `<Candidate title>: <disposition> → <target or cost> — <basis>`
  rather than `Mode: <disposition> — <basis>`. The leading noun makes
  the line about what is being decided, not about the meta-decision; the
  arrow makes the disposition's target/cost explicit. This is taste; the
  falsifier is the same as prediction #1.
- I would prefer the unavailable-state line to read as a single, calm
  sentence above the drafted cards rather than as a parenthetical
  inside the disposition line, mirroring FLLWUP-75's positional choice.
  This is taste; the falsifier is the render smoke of the unavailable
  state.

## 7. What I am not arguing

- I am not arguing the wave-1 reframe is wrong. The output-domain mismatch
  (`Deliberate|Verify|Direct` ≠ `File|Merge|Drop`) is a real seam, and
  the second-decision-domain framing is correct. I am not reopening it.
- I am not arguing the children should be re-slid. The wave-1 children
  EV-78/79/80/81/82/83/84 are the right shape; my critique tightens the
  `Intent` of the three surface-touching ones and proposes three
  observational sub-acceptances (or, in product-owner's judgment, three
  missing children).
- I am not arguing the fail-closed direction. `Drop` and auto-`Merge`
  are forbidden on call failure; the human pre-write gate is the safe
  side. The wave-1 is right about this; my Finding D only adds that the
  person needs to be told *why* the safe side was taken (off / failed /
  unresolved), not just that it was.
- I am not arguing the EV-44/45/46/47 disposition. The wave-1 proposes
  EV-44 → rework/retire (the merge rule moves into EV-78/79/80),
  EV-45 → retired and re-homed (ingest is a separate subsystem),
  EV-46 → retired (wires step 14 to EV-45's capability, now gone),
  EV-47 → retired (run-level ingest at Phase 3, same as EV-46). These
  are product judgments; I do not rule on them from this seat.

## 8. The deliverable shape

This document is the wave-2 attack from the design seat. Wave-3
`product-owner` reads it as one input; the wave-1 principal's seams and
the skept's falsifiability attack are separate inputs. I do not re-slice
the children, I do not rule on the per-child dispositions, and I do not
write code. I leave the surface as an unresolved person-needs question
for product-owner to either fold into the EV-82/83 `Intent` blocks,
carve into new children, or rule out — and I name the smoke that would
settle each design claim when `skeptic` runs it.