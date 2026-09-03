You are the council-runner executing EV-1's final gate. The card's
implementation is complete — its deliverable doc is at
`deliverables/EV-1.md` and the working tree contains the change.

Do NOT re-implement or modify `src/` or `test/`. Finish the gate:

1. Re-run the local gates yourself: `bun test` (exit 0) and
   `python3 council/validate.py` (prints `All council artifacts valid`).
2. Verify `deliverables/EV-1.md` exists and describes the deliverable.
3. Mark EV-1 Done: set `state: Done` in `council/cards/EV-1.md` frontmatter
   and move its board line under `## Done` in `council/board.md`, then re-run
   `python3 council/validate.py` to confirm consistency.
4. Write the attestation to `records/EV-1-run.md`. The first line MUST be
   exactly `STATUS: DONE`; below it, record which gates you re-ran and their
   results.

Deliver the green-gate attestation and the card marked Done.