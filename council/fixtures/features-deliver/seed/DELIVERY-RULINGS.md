# Standing delivery rulings (recorded up front, machine-applicable)

Recorded for the unattended delivery of this epic. These rulings bind every
child card before any run starts, so the harness can play the human at the
merge gate without consulting prose mid-run.

## Per-child merge gate (smoke MERGE-CHECK precedent)

For each child card of EPIC-1, the merge gate approves only when ALL of:

1. the child's owner dispatch finished `done` (never `stalled`/`timeout`);
2. the child's judge report contains the token `PASS`;
3. the child's delivery attestation file `deliverables/<CARD>.md` contains
   the token `GATES GREEN` — the runner's own attestation that it re-ran the
   local gates (typecheck, `bun test`, `python3 council/validate.py`) and
   they were green;
4. the child's board line is not under `Needs Human`.

There is no `gh`/network attestation: the local gate re-run is the only
evidence, so the cell stays network-free.

## Resolutions

- Running container actions are the `council-runner` seat's job (isolated
  per child). The runner's attestation file is the causal link between the
  seat's claims and the re-run the harness verifies.
- A child whose merge gate holds stays in its current column; the runner
  re-runs its gates before re-offering the merge.
