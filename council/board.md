# Council Board

State columns. Each card appears exactly once, on one line under the column
matching its frontmatter `state`, as `- <ID> — <Title>` with an em dash
(U+2014). `python3 council/validate.py` enforces this.

## Backlog

- EV-85 — Seat-composition decisions as repo-overridable packaged data
- EV-86 — Pure seat-composition decision function with a fail-safe Default
- EV-87 — One-call seat-composition orchestration over the shared Jev transport
- EV-88 — End-to-end falsifier for the Jev seat-composition fail-closed arm
- FLLWUP-103 — Cover the wrapper's advisory arm in EV-83's own suite and pin the two escalation-basis tokens
- FLLWUP-102 — Make the http-404 unavailability literal claim only what the transport can establish
- FLLWUP-101 — Cold-read persona smokes on the step-13 follow-up surface (designer P1/P2/P3/P5/P7/P9)
- FLLWUP-100 — Card-gate calls always route full Deliberate — every live ledger line died at decide() on a missing answer probability
- FLLWUP-99 — Fix the shipped runGate policyVersion writer — lines carry the gate policy's version; the router reads the decision policy's
- FLLWUP-98 — Pin the follow-up headroom probe's tripwire on `truncated === false`
- FLLWUP-97 — Recency window for the follow-up board section when the cap binds
- FLLWUP-96 — Fail-loud questions↔weights equality at the gate's and the follow-up's composition sites
- FLLWUP-95 — Cut the EPIC-14 release — bump `package.json` past 0.28.0, tag, and move `latest`
- FLLWUP-93 — Consumer-repo-safe protection for wiki-cited code paths (the T1-class check beyond this repo)
- FLLWUP-94 — Consider naming the config home in the /council-gate status read literal
- FLLWUP-89 — Give /features-new a run-start preflight step — its seat dispatches share the gate-credential hole
- FLLWUP-90 — End-to-end falsifier — an already-initialized consumer with a stale council/preflight.sh reaches the run-start gate-credential FAIL
- FLLWUP-91 — Wrapped-tool council_preflight — own the preflight spawn on pass to make run-start single-FAIL mechanical
- FLLWUP-92 — Align runStartGatePreflight's injected apiKey semantics with the resolver's empty-means-absent rule
- FLLWUP-85 — Seed `gate: {"mode": "off"}` in the scaffold `.council.json` and pin a canonical top-level key order
- FLLWUP-86 — Run-config-stability Phase-0 assertion: gate.mode is a second mid-run-flippable config input
- FLLWUP-87 — Concurrent-session write discipline for `.council.json`
- FLLWUP-88 — Theme-watcher: skip the theme reload when a `.council.json` write touched no theme bytes
- FLLWUP-72 — Make step 11 execute the merge-check table, not a prose mirror of it
- FLLWUP-73 — Refresh the deterministic-merge-check wiki page for the mode-aware ruleset
- FLLWUP-71 — Add the user-visibility question to the gate question set — let a recorded Verify re-route on a surface-touching card
- FLLWUP-75 — Signify a slow advisory gate call without implying deliberation or failure
- FLLWUP-77 — Name the excluded gate-call count in the usage legend
- FLLWUP-78 — Make the gate legend key self-describing (deliberation, not gate)
- FLLWUP-79 — Signpost the gate ledger from the usage block's exclusion surface
- FLLWUP-80 — Bound the EV-68 textTree byte-equality flake window
- FLLWUP-81 — Eliminate gate-state.ts's duplicated lenient policy read — resolve the budget through the validated loader or pin the load-order invariant
- FLLWUP-82 — Every gate question id is single-line and cross-referenced across questions.json and decision.json
- FLLWUP-83 — Own-key membership for loadGateDecision's mechanical-record check — close the pre-existing prototype-chain `in` leak
- FLLWUP-84 — Own-key membership for loadGatePolicy's unknown-key check — same prototype-chain `in` class as FLLWUP-83, one loader over
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
- FLLWUP-61 — Worktree-seat cwd discipline for edit/write tools
- FLLWUP-62 — Gate the mid-block colon-bearing frontmatter continuation residual
- FLLWUP-63 — Fix the EV-40 backoff jitter test's unsatisfiable top edge (merged-SHA CI flake)
- FLLWUP-64 — Cosmetic cleanup of the FLLWUP-50 refresh surface (dead variable, duplicated helper, creationPass filter)
- FLLWUP-65 — Reclassify council/cards/_template.md as a package-resolved resource
- FLLWUP-66 — Per-file refresh (--refresh-file <path>) for data-class scaffold files, preflight.sh first
- FLLWUP-67 — Wiki pages for the refresh path — hop chain, scaffold-copied resources in override-resolution, non-clobbering companion
- FLLWUP-68 — Cold-read persona smoke on /council-update's output surface (designer P1/P6/P9)
- FLLWUP-69 — Pin the step-13 follow-up confirmation gate as pre-write and mark ledger-level confirmation unsanctioned
- FLLWUP-70 — Close the gates CI-timeout residuals — a per-step bound on every non-test step, and a ceiling census that covers every writing form
- EPIC-10 — Follow-up review decided by the typed TypeSafe Jev gate
- EV-45 — Unattended ingest of a run's own ledger, without the human steer turn
- EV-46 — Ingest at every single-card /council completion, attended or container-run
- EV-47 — Ingest the whole run when /features-deliver reaches its run ledger
- EPIC-11 — Grounded, interview-driven council setup via /council-setup
- EV-49 — Profile validator — the hard gate on the interview's model output
- EV-50 — <seat_emphasis> sibling block and the consumer-side-only resource type
- EV-51 — Consent-gated, backed-up, idempotent write path
- EV-52 — /council-setup procedure — explore → interview → apply
- EV-53 — /council-init hands off to /council-setup in the same turn
- EV-54 — Documentation of the interview, the tier map, and seat-emphasis notes
- EV-55 — Per-card-class optional-seat seating with the frozen roster
- EV-56 — End-to-end falsifier for headless /council-init non-clobber
- EV-59 — End-to-end falsifier for the first-run identity line
- EPIC-12 — pi-council version and git hash on the first pi run

## Deliberating


## Ready
- EV-48 — Packaged seat-tier map with repo-local merge override
- EV-57 — Resolve the running pi-council identity from the package root
- EV-58 — Show the pi-council version and hash on the first pi run
- FLLWUP-109 — Foreign --cache-file parent: absent parent is created before the cache write
- FLLWUP-110 — Cache hit/miss counts in the human-readable usages summary
- FLLWUP-107 — Renderer substitution-set pin for procedure copy
- FLLWUP-108 — Usages remediation pin: catch command-drop and update-step-drop

## Deliberating

## In Progress
- FLLWUP-111 — Migrate runTool in test/usages.test.ts to the async spawn pattern

## In Review

## Needs Human

## Done
- FLLWUP-104 — Fix the live noul answer-shape drift — the decisions API returns `{"type":"noul","noul":<p>}`, the engine reads `probability`, in both gate domains
- EPIC-15 — Usages tool creates its output directory before writing the cache
- FLLWUP-106 — The usages procedure forbids inventing framing around the tool's stderr
- FLLWUP-105 — Name the remediation route for a stale copied usages skill
- BUG-2 — Usages tool creates its output directory before writing the cache
- EV-84 — End-to-end falsifier for the Jev-gated follow-up review
- EV-83 — Route the follow-up decision through /features-deliver Phase 3 and the council-runner escalation path
- EV-82 — Record and render the follow-up decision at step 13's pre-write confirm gate
- EV-81 — Reuse the gate's Jev transport with a human-bound fail-closed posture

- EV-80 — Follow-up review state packing: candidate + board/open cards + same-run siblings
- EV-79 — Pure follow-up disposition function with a fail-safe File default
- EV-78 — Follow-up disposition decisions as repo-overridable packaged data
- EPIC-14 — Reuse `.council.json` to enable the decisions gate; add a `/council-gate` toggle; check the OpenRouter credential when the gate is on
- EV-73 — Gate enablement lives in `.council.json`; the pin stays in code
- EV-75 — Legacy `council/gate/policy.json` cannot silently disagree with `.council.json`
- EV-74 — `/council-gate` to enable or disable the decisions gate
- EV-76 — Run-start preflight fails loud when the gate is on and no OpenRouter credential resolves
- EV-77 — Document the gate's `.council.json` surface, its command, and the decide() basis vocabulary
- FLLWUP-74 — Enforce loadGateDecision's invariants — verify > 0 and the hostile-string cross-checks
- FLLWUP-76 — Document the decide() basis vocabulary, the callId:null fallback, and the intake-vs-dispatch split
- EPIC-13 — Metered deliberation routing — a System One gate decides Deliberate, Verify, or Direct per card
- EV-72 — Pre-registered threshold tuning from the ledger
- EV-71 — Decisions-aware gate spend accounting
- EV-70 — Direct mode and the mode-aware merge check
- EV-69 — Deterministic routing to Verify mode
- EV-67 — Gate verdict rendered as information at the draft-then-confirm approval gate
- EV-66 — Advisory gate at features-new intake
- EV-68 — Card execution mode recorded on the run manifest
- EV-65 — One-call decisions transport with fail-closed posture
- EV-64 — Budget-bounded gate state packing
- EV-63 — Pure decide() mode and seat-inclusion function with offline fixtures
- EV-62 — Packaged-and-overridable gate policy and question set
- EV-61 — Durable gate ledger with a recomputable decision record
- EV-60 — Cost-per-card and cost-per-epic baseline from existing run manifests
- FLLWUP-59 — Mechanically derive or police the shape witness's token allowlist
- FLLWUP-56 — Saturate the seat-dispatch provider-error arm onto a config-injected faux provider
- FLLWUP-54 — Wiki page for the red-base evidence convention
- FLLWUP-58 — Runaway timeout-minutes backstop on the gates CI job
- FLLWUP-55 — Collapse the smoke driver's private pty screen model onto the shared kit
- FLLWUP-50 — Supported refresh path for packaged council tooling in initialized consumer repos
- FLLWUP-53 — De-repo-specific council.md step 8's gate-file reference and widen the prose guard
- FLLWUP-51 — Loud gate for a goal wrapped onto a second line
- FLLWUP-57 — Suite determinism under a catalogue-valid ambient COUNCIL_EVAL_MODEL
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
