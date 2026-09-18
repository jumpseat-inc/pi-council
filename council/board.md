# Council Board

State columns. Each card appears exactly once, on one line under the column
matching its frontmatter `state`, as `- <ID> — <Title>` with an em dash
(U+2014). `python3 council/validate.py` enforces this.

## Backlog

- EPIC-1 — omp-themed council theme for pi, configurable from the scaffold .council.json
- EPIC-2 — Inline council job tree beneath the input bar
- EPIC-3 — Council-decomposed features-new with a bounded session
- EPIC-4 — Model eval harness for council commands and seats
- FLLWUP-1 — Fix HTML export under an active in-memory council theme
- FLLWUP-2 — Make the .council.json theme export section editable
- FLLWUP-3 — Revisit empty dark and light variant shells for consumer discoverability
- FLLWUP-4 — Repair /council-tree RPC silent-no-op in navigator.ts:57
- FLLWUP-5 — Criterion-type-aware judge projection in projectVerdictRecord
- FLLWUP-6 — Judge-bearing fixture smoke (Phase 5)
- FLLWUP-7 — eval-results retention policy
- FLLWUP-8 — council-leaderboard task drill-down filter
- EPIC-5 — /council-models provider and model picker for per-seat .council.json overrides
- FLLWUP-26 — Per-run cumulative token ceiling guard in /council
- FLLWUP-27 — Preflight branch-freshness clause vs mid-card record pushes
- FLLWUP-28 — Widen cellScope.usage to the full tuple and amend the eval-store contract
- FLLWUP-29 — Persist Anthropic cacheWrite1h write-premium tokens
- FLLWUP-30 — Live end-to-end falsifier for the invocation boundary under pre-prompt compaction
- FLLWUP-31 — Per-node subtree reconciliation against seat session files
- FLLWUP-32 — Usage-store retention and compaction policy
- FLLWUP-33 — Live end-to-end falsifier for the EV-31 gated write path
- FLLWUP-34 — Bounded retry policy for a failed usage-store write
- FLLWUP-35 — Usage/accounting wiki page for the EPIC-7 lineage
- FLLWUP-36 — Remove the unreachable pre-EV-34 transcript renderer left in TranscriptView
- FLLWUP-37 — Keep the progress keymap header visible when follow-mode content overflows the viewport
- FLLWUP-38 — Clamp the inline progress transcript header to the granted render width
- FLLWUP-39 — Dispose the replaced transcript view when the inline progress surface switches sessions
- FLLWUP-50 — Supported refresh path for packaged council tooling in initialized consumer repos
- FLLWUP-51 — Loud gate for a goal wrapped onto a second line
- FLLWUP-53 — De-repo-specific council.md step 8's gate-file reference and widen the prose guard
- FLLWUP-54 — Wiki page for the red-base evidence convention
- FLLWUP-55 — Collapse the smoke driver's private pty screen model onto the shared kit
- FLLWUP-56 — Saturate the seat-dispatch provider-error arm onto a config-injected faux provider
- FLLWUP-58 — Runaway timeout-minutes backstop on the gates CI job
- FLLWUP-59 — Mechanically derive or police the shape witness's token allowlist
- FLLWUP-61 — Worktree-seat cwd discipline for edit/write tools
- EPIC-10 — Fewer follow-up cards by merging near-duplicates, and unattended wiki ingest at every run completion
- EV-46 — Ingest at every single-card /council completion, attended or container-run
- EV-47 — Ingest the whole run when /features-deliver reaches its run ledger

## Ready

- EV-44 — Merge near-duplicate follow-up candidates before a card is drafted
- EV-45 — Unattended ingest of a run's own ledger, without the human steer turn

## In Progress


## In Review

- FLLWUP-57 — Suite determinism under a catalogue-valid ambient COUNCIL_EVAL_MODEL

## Needs Human

## Done

- FLLWUP-52 — Evolve EV-39 R4 — retrying row label denotation

- FLLWUP-60 — Non-admin record-push path for autonomous runs
- FLLWUP-48 — Suite-cost budget for the live pty and -p falsifier arms

- FLLWUP-49 — Promote the offline faux-provider harness into a shared smoke helper

- FLLWUP-47 — Documented red-base convention for falsifier evidence

- FLLWUP-45 — Navigator attempt-awareness for retried dispatches

- FLLWUP-44 — Name the provider failure before the backoff countdown
- FLLWUP-41 — Reconcile council.md step 12's non-fast-forward wording with the union-merge repair
- FLLWUP-42 — Make the deterministic merge check independent of a human-granted admin bypass
- FLLWUP-43 — Make the goal field a lossless oracle for the judge
- EPIC-9 — Provider-error retry with exponential backoff under a .council.json policy
- EV-41 — End-to-end falsifier for provider-error retry on both paths

- EV-42 — Per-attempt identity for a retried dispatch in the run substrate

- EV-39 — Hub-level retry of a seat dispatch with exponential backoff
- EV-40 — Automatic continuation of a parent turn that ends in a provider error
- EV-43 — Reachability falsifier for parent-turn continuation
- EV-38 — Retry policy section in .council.json with shipped defaults
- EV-37 — Retry classification predicate for settled job reports
- EV-36 — Transcript legibility at the one-row progress floor
- EV-35 — Transcript interaction model — visible focus, honest keymap, visible toggles

- EV-34 — Compose each tool call and its result into one rendered unit

- EV-33 — Transcript parser preserves tool-call identity, error state, and one shared argument summary
- EPIC-8 — Elegant tool-call and transcript rendering in the /council-tree inline progress view
- EPIC-7 — Token and cost usage accounting for autonomous council invocations
- EV-29 — Provider-reported actual cost and per-component divergence from the estimate
- EV-32 — Usage reported at every autonomous entry point

- EV-31 — Durable usage store outside the pruned run directory, with session provenance

- EV-30 — Invocation-scoped spend record from the invoking session plus its job subtree

- EV-28 — Full usage tuple and cost provenance in the hub usage record
- FLLWUP-25 — Wiki source page matches AGENTS.md hard-conventions count
- FLLWUP-40 — Isolate COUNCIL_EVAL_MODEL from the eval-runner dispatch-primitive test

- FLLWUP-24 — Local gates refuse to run when installed deps drift from bun.lock

- FLLWUP-23 — Named failure for pi-council installs missing node_modules
- FLLWUP-22 — Theme token drift vs pi 0.85.x grounds the devDependency upper bound
- FLLWUP-21 — Restore pi-council extension load on stock pi 0.85.0 and pin the devDependency

- FLLWUP-14 — Kitty-protocol terminal smoke for the model search input
- EPIC-6 — /council-models model-name search filter in the model selection modal

- FLLWUP-15 — Search-mode modal frame fits the terminal at full window height
- FLLWUP-18 — Judge dispatch inputs pin the verification subject and loop frame
- FLLWUP-19 — Skeptic dispatch inputs pin the verification subject and loop frame
- FLLWUP-20 — Judge seat guidance names the runner-pinned verification subject

## Done

- FLLWUP-17 — Main-repo immutability constraint in the working seats' own guidance

- FLLWUP-16 — Seat dispatch inputs forbid main-repo branch-state mutation

- FLLWUP-13 — No-match state names how to leave search mode

- BUG-1 — Backspace deletion in the model search input and a first-use `/` filter hint

- FLLWUP-11 — Smoke phase selector for the /council-models Phase 5 falsifier
- FLLWUP-10 — Writer thinking preservation matches loader resolution for object-form model overrides
- EV-27 — `/`-triggered search input in the model selection modal
- EV-26 — Pure model-name filter over the thinking-level cross-product
- EV-25 — Register the /council-models command and wire picker to writer
- EV-23 — Token-only modal picker for per-seat provider and model selection
- FLLWUP-9 — Explicit clear-thinking-override affordance for a seat
- EV-24 — Non-destructive .council.json merge-write for seat overrides
- EV-22 — Resolve enabled providers and models for the picker from pi's registry
- EV-21 — Results leaderboard with variance
- EV-20 — Matrix runner with repeat aggregation
- EV-12 — Document the council-decomposed features-new flow
- EV-11 — Bounded decomposition session
- EV-19 — Scoring rubric and run verifier
- EV-17 — Per-run model override for eval dispatches
- EV-18 — Shipped benchmark fixtures for commands and seats
- EV-16 — Design the council model eval system
- EV-10 — features-new decomposition dispatches the council
- EV-9 — Open the selected subagent's progress from the inline tree

- EV-8 — Bidirectional arrow-key focus navigation between the input bar and the inline tree

- EV-7 — Render the job tree inline beneath the input bar with per-row last activity

- EV-4 — Theme compliance and live repaint of council surfaces

- EV-1 — Port the oh-my-pi palette to a shipped pi theme
- EV-6 — Add the gates GitHub Actions workflow
- EV-5 — Document the council theme system
- EV-2 — Theme configuration in the scaffold .council.json
- EV-3 — Activate the council theme on session start
