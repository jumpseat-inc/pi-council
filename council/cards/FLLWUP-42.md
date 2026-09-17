---
id: FLLWUP-42
title: Make the deterministic merge check independent of a human-granted admin bypass
state: In Progress
owner: null
epic: EPIC-9
goal: The deterministic merge check succeeds under a repository ruleset that requires an approving review without a human-granted admin bypass, or the procedure names the bypass explicitly as the sanctioned step.
---

## Intent

A `main` ruleset created mid-run requires 1 approving review plus linear
history, so every autonomous merge depended on the human's run-scoped
`--admin` authorization. The authority map replaces the human merge gate with
the five criteria, and the human's authorization is explicitly not extended
to the next run. Named by the steward closure ruling as owed before the next
autonomous run.

## Orchestrator rulings (Phase 1, binding)

Recorded human decisions for this run. Immutable and binding on every seat,
`steward` included; a runner that hits one applies it and cites the ruling
rather than re-asking.

- **R2 (merge authorization).** The human has explicitly authorized, for
  this run only, `gh pr merge <PR> --squash --admin --match-head-commit <X>`
  — the `--admin` bypass is the sanctioned merge step under the active
  `main` ruleset (1 approving review + linear history + thread resolution).
  This satisfies the goal's second disjunct, "or the procedure names the
  bypass explicitly as the sanctioned step"; the card's delivery is to make
  the procedure name it explicitly, not to remove the bypass. The
  authorization is run-scoped and is **not** extended to any later run.

## Run record (features-deliver / FLLWUP-42)

### Step 1 — classification (facilitator)

- **Path: mechanical.** The deliverable is confined to one seam —
  `council/procedures/features-deliver.md`'s deterministic-merge-check
  section. The design the card's `goal` leaves open (make the check succeed
  with no bypass, or name the bypass as the sanctioned step) is settled by
  binding Phase-1 ruling **R2**: the delivery is to name it, run-scoped,
  never extended to a later run. A deliberation would have nothing open to
  deliberate, and `<escalation_contract>` step 1 forbids re-asking an
  answered question. The five criteria and `--match-head-commit` pinning
  stand exactly as written; no code, criterion, or mechanism changes.
- **Surface-touching: yes.** The deliverable changes procedure prose a
  person (the operator) reads and the orchestrator follows — the copy that
  names the sanctioned merge step. On a mechanical card this seats no
  `designer` (council.md step 1); any design concern is a step-13
  follow-up candidate, never a reason to reopen.
- **Seat resolution (`<seat_resolution_check>`):** `owner`, `skeptic`,
  `judge` — the only seats this path dispatches — all resolve; the nine
  packaged seat files are present in `council/agents/`, and no repo-local
  `.pi/agents/` override directory exists, so nothing shadows them. Ruling
  seats (`product-owner`, `steward`) are never dispatched by this container.
- **Environment:** step 0 preflight skipped per the autonomous-run
  substitution (Phase 0 cleared it); run for information only on the main
  checkout → `PASS: preflight clean`, exit 0. `python3 council/validate.py`
  → `All council artifacts valid`. Local `main` == `origin/main` at
  `526ca2b`. No `Needs Human` state and no outstanding ruling on this card —
  criterion 5 holds at card start.
- **Gate set for this repo** (authoritative: `.github/workflows/gates.yml` +
  [[deterministic-merge-check]]; `docs/gates/GATE-EVIDENCE.md` does not exist
  here): `bash council/preflight.sh FLLWUP-42`, `bunx tsc --noEmit`,
  `bun test`, `python3 council/validate.py`. Owner gates met in full
  regardless of change size.
- **Blast radius checked (no digest re-pin owed):** no fixture seed carries
  a copy of `council/procedures/features-deliver.md`
  (`council/fixtures/*/seed/` holds board/cards/validate/preflight, not
  procedures), so AGENTS.md #5's `seed.treeDigest` machinery is untouched;
  no shipped test pins the merge paragraph (grep: no
  `--admin`/`match-head-commit`/merge-check assertion in `test/`);
  `prose.test.ts` forbids a pinned tech stack in procedure prose, so the new
  text must stay free of `bun`/`bunx`/`tsc`/`typescript`.
- **Phase-1 rulings applicable here:** R2 governs the delivery (applied,
  not re-asked). The scope / sequencing / follow-up-re-homing rulings govern
  process only; R1 governs FLLWUP-41, a different card. Nothing else on this
  card is open.

### Step 7 — hand to one owner (mechanical path)

No deliberation ran, so the card itself is the owner's handoff: its `goal`,
`Intent`, and the binding R2. Card set `In Progress`; `validate.py` clean;
`owner` dispatched.
