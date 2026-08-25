---
id: EV-2
title: Theme configuration in the scaffold .council.json
state: Ready
owner: null
epic: EPIC-1
goal: The scaffold .council.json carries an editable theme section that loadCouncilConfig parses and validates and that merges repo overrides over the shipped omp defaults
---

## Intent

User-visible surface: the customization file the consumer edits — this card
makes the theme editable without touching engine code.

`.council.json` already exists as the committed repo override file for seat
model/thinking (AGENTS.md 9.5, `loadCouncilConfig` / `applySeatOverride` in
seats.ts). The theme section lives alongside, e.g. a top-level `theme` key
(sibling of `council`) carrying `name` (default `pi-council`), dark and
light palette `vars`, and per-token `colors` overrides. The exact shape is
for the Council to fix, subject to these requirements:

- Lives in the scaffold's `.council.json` so `/council-init` writes it into
  consumer repos, non-clobbering (a consumer's existing `.council.json` is
  never overwritten — scaffold invariant).
- Parsed and validated by the same config machinery: malformed JSON or an
  invalid token name / value throws with a message naming the file, like the
  seat overrides do today.
- Merge semantics: repo values win over shipped defaults; an absent section
  means "no theme config" (activation card decides what that implies).
- Editing a var or token recolors the next session; the shape should be
  small enough to hand-edit in a text editor.

## Acceptance

- `loadCouncilConfig` returns the parsed theme section; unit tests cover
  happy path, missing section, malformed JSON, invalid token, and override
  merge (repo wins).
- Scaffold test: a fresh `scaffoldInto` into an empty temp repo writes the
  theme section; re-running into a repo with an existing `.council.json`
  leaves it byte-for-byte untouched.
- The default scaffold section matches the shipped omp palette from EV-1.

## Phase 1 Ruling (recorded, binding)

Recorded 2026 by the human before the run: the exact shape of the `.council.json` theme section was surfaced in the rulings preflight and **deliberately delegated to the Council** ("let the Council decide"). The Council fixes the shape within this card's stated requirements (sibling of `council`, name `pi-council`, repo-over-shipped merge semantics, non-clobbering scaffold) and must **not** escalate the shape question — it is a working decision, not an open-judgment dispute.
