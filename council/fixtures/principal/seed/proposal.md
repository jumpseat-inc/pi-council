# Proposal: grader model pin via .council.json

Proposal text: "The fixture's graderModel can simply be written into the
repo's .council.json under the judge seat, using the same JSON the repo
already reads. This reuses the existing override machinery with zero new
plumbing."

The proposal misunderstands the contract: `.council.json` sits BELOW
`COUNCIL_EVAL_MODEL` and below the per-dispatch param, and the eval harness
must pin the grader per fixture — not per repo. The cross-seam consequence is
that two fixtures in the same repo would fight over one .council.json judge
entry.
