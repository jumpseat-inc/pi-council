# Wiki Index

Catalog of every wiki page. On a query, read this first, then drill into the
relevant pages. Each entry: link + one-line summary (+ optional metadata).

## Overviews

- [[pi-council-overview]] — Pi-council as an installable package: the Council
  + wiki workflow, two engine halves, the loop, and the release version arc
  (through v0.19.0: EPIC-6 closed, EPIC-7's honest usage accounting landed on
  main, EPIC-8's elegant transcript rendering closed Done, EPIC-9's
  provider-error retry closed Done and was released, and EPIC-9's nine promoted
  standing-machinery/residual cards were delivered in a follow-up run).

## Entities

- [[owner]] — Engineering voice + single implementing owner; four gates to a PR.
- [[skeptic]] — Council's formal adversary; every claim is broken until a test proves it.
- [[judge]] — Fresh-context PASS/REJECT evaluator against the card's goal.
- [[principal]] — Cross-cutting seam-reframer; never implements.
- [[designer]] — Human-centered design seat (Don Norman tradition).
- [[consolidator]] — Synthesis voice; names disagreement, never resolves it.
- [[product-owner]] — Card-level product judgment; escalates to steward.
- [[steward]] — Portfolio-level authority; the product-owner's escalation target.
- [[council-runner]] — Autonomous per-card execution container for features-deliver; carries main-repo immutability + pinned verification subjects (v0.18.0).
- [[council models picker]] — /council-models surface: command, resolver, token-only modal, the `/`-triggered model-name search input (two-bit focus machine, ruled search copy), complete as of v0.18.0 (backspace, pre-press hint, exit hint, frame fit, kitty smoke).
- [[council config writer]] — the .council.json write path (EV-24): byte-region splice, field-level merge, atomic, gate-parity validation; FLLWUP-10 fixed the `:suffix` seam, FLLWUP-9 added `clearSeatOverride`.

## Concepts

- [[seats]] — The seat abstraction; frontmatter schema, tool-grants, child sandboxing.
- [[facilitator]] — The routing-and-bookkeeping role that runs the loop and decides nothing.
- [[council-loop]] — The facilitator-run deliberation → implement → verify → judge loop.
- [[engineering-board]] — The card board + cards under council/; validate.py discipline.
- [[procedure-commands]] — The scanned, override-aware slash-command set + the 7 procedures.
- [[repository-grounding]] — The engine-appended prompt block that grounds seats in the wiki/code.
- [[override-resolution]] — Repo-local resources shadow packaged ones by filename.
- [[non-clobbering-scaffold]] — /council-init; creates files without ever overwriting.
- [[model-output-floors]] — Data-driven min-token floors for models with wrong catalogue ceilings.
- [[council-dependencies]] — The packages /council-init pins project-locally and preflight enforces (superpowers + ask-user-question).
- [[ask-user-question]] — The rpiv-ask-user-question extension: a human-in-the-loop question tool for the parent session.
- [[hub-job-supervision]] — The job table + spawn/monitor/stall-kill engine and 3 council tools.
- [[mcp-support]] — Model Context Protocol servers, auth (loopback or copy-paste remote login), and seat grants (tools only).
- [[remote-oauth-login]] — The copy-paste OAuth pattern for headless/remote agents: print the URL, paste the redirect back, PKCE makes it safe without tunnels.
- [[preflight]] — The card-aware, fail-fast shell+script gate before every run, now hosting the lock-drift tripwire.
- [[lock-drift tripwire]] — Local gates refuse to run when installed deps drift from bun.lock; the named FAIL fires before the frozen-lockfile self-heal.
- [[llm-wiki]] — The persistent, compounding knowledge base (sources → wiki → schema).
- [[council-config]] — The committed `.council.json`; field-level per-seat model/thinking override PLUS top-level `theme` and `retry` sections, scaffold-seeded.
- [[council-theme]] — EPIC-1's omp-palette theme subsystem: pinned dark/light pair, `.council.json` recolor surface, four-state activation, token-only drawing + live repaint (v0.12.1: module located via `getPackageDir()`, not a bare-specifier).
- [[smoke-test]] — The definitive unattended end-to-end test: Phases 0–5 (council loop, epic, /council-eval matrix, /council-leaderboard, /council-models) in an isolated container, with a SMOKE_PHASE selector (FLLWUP-11) and the kitty search-smoke pty harness (FLLWUP-14) as siblings; standing discipline — the first Council command without an end-to-end falsifier is a defect.
- [[headless-pi]] — pi's non-interactive modes (-p/json/rpc): no trust prompt, single-shot teardown, stale ctx, the waitForIdle pattern for command turns (but not event contexts), and print mode's stdout takeover + post-settle exit code.
- [[run-transcripts]] — the on-disk run substrate: per-job manifests + session JSONL under .pi/council/runs/, the job forest, and the /council-tree surface (inline as of EPIC-2) reading it.
- [[council-job-tree-inline]] — EPIC-2's inline below-editor job tree (EV-7 last activity, EV-8 editor-driven focus, EV-9 inline progress); supersedes the /council-tree modal.
- [[three-wave-decomposition]] — The /features-new structure (v0.15.0): three bounded waves — principal authors, skeptic+designer attack, product-owner rules last; facilitator authors nothing; human gate untouched.
- [[presented-never-written]] — The two-part /features-new gate: attribution-free card drafts exactly as written, plus a never-persisted ledger of contributors and unresolved disagreements.
- [[card-id-allocation]] — Board ids are allocated at fetched HEAD, never a stale clone's memory; diverged mains reconcile by union merge; validate.py is the net.
- [[model-eval-harness]] — The EPIC-4 subsystem: /council-eval matrix runner + /council-leaderboard rankings over 16 shipped fixtures; evidence replaces guesswork for seat model pins.
- [[eval-store-contract]] — ResultRecord/VerdictRecord keyed on full tuples (cellId, repeat, scoredUnder/gradedBy, versions), append-only, scoredUnder "self" sentinel, cellScope telemetry stamped at settle.
- [[cell-aggregation]] — The shared pure aggregate: mean/Bessel σ, E1 CI-on-difference triage, E2 length-never-zero, E3 histogram; same-function-both-sides byte-identity; the CONFIRM-2 version-blindness lesson.
- [[grader-topology]] — Grader as harness-dispatched sibling linked by cellId; cell-invariance by topology, three cost columns, no exclusion rule.
- [[deterministic-merge-check]] — The features-deliver merge gate: five mechanical criteria observed directly, merged --match-head-commit, Done only after gates green on the merged SHA.
- [[record-push-discipline]] — The step-12 direct-to-main record push is a privileged write the authority map does not re-home; under a ruleset blocking direct updates it needs a recorded, run-scoped authorization or a non-bypass path (FLLWUP-60).
- [[run-config-stability]] — A mid-run `.council.json` seat-model change silently alters which models later dispatches use; scope-pure commits + a Phase-0 stability check.
- [[two-bit-focus-machine]] — The modal key-handling pattern from EV-27: searchActive × inputFocused, Esc routed on inputFocused, Down as the focus-out edge; ▌ signifier + capture-by-construction trigger; backspace-as-delete added by BUG-1.
- [[env-split contract]] — The parent/child mode split is keyed on COUNCIL_SEAT and version-independent; two-pole verified; the "0.85.0 regression" was probe contamination; the fallthrough-to-model-dispatch hazard documented.
- [[main-repo immutability]] — No checkout/switch/reset against the main repo path, worktree-only, enforced on runner + working seats + dispatch inputs after two record-corruption incidents.
- [[verification-subject pinning]] — Judge/skeptic dispatch inputs name the PR head SHA + head worktree path and the loop frame; wrong-tree verdicts eliminated.
- [[union-merge-reconcile]] — The diverged-main repair after squash merges fold a runner's board commits: union-keep both record sides, validate.py as the net, sweep for conflict markers; push records as you go to avoid it.
- [[gate-parity]] — A write/validation layer may be stricter than the runtime only where an existing gate is also that strict; capability lives at selection, not persistence.
- [[echo-then-run]] — The house confirm pattern: quote the exact resolved selection via the same function the write uses; echo == write by construction; never assert state the screen cannot compute.
- [[chain-promotion]] — Dependent child chains promote Backlog→Ready automatically as each predecessor's merge lands; ruled once, executed without re-asking.
- [[procedures-vs-commands]] — Markdown procedures (LLM judgment is the feature) vs TS commands (LLM obedience is required); the rule of thumb from EPIC-4.
- [[usage-accounting]] — The EPIC-7 subsystem: the full flat token/cost tuple with `costBasis`/`usageSource` provenance, captured at the hub, recorded, stored, and reported.
- [[spend-record]] — Invocation-scoped two halves (`ownSession` session-enumeration + `subtree` stream projection), each with its own basis; unresolvable boundary zeroes both.
- [[usage-store]] — The durable store at `getAgentDir()/council/usage/`: one record per invocation, schema v2, `pointerSurvivable` + `ResolveOutcome`, surviving run pruning.
- [[usage-block]] — The deterministic block at five autonomous exits: grammar identity across forms, three whole-block states (failed > unresolved > empty), the conditional `n/a` legend.
- [[cost-provenance]] — pi computes cost from the static catalogue and never reads a provider charge; OpenRouter reports generation-level dollars + a BYOK-only split — no per-component dollars exist.
- [[transcript-unit-rendering]] — the EPIC-8 composed tool-call unit (`→ <Tool>  <primary-arg>`, indented result, `muted "✗"`); why parser identity came first.
- [[honest-keymap]] — advertised keys must be honored; the `matchesKey` vs raw-byte bug class (kitty/modifyOtherKeys CSI-u) EPIC-8 fixed.
- [[one-row-floor]] — the one-row progress grant: the follow-mode effective index (R3), the markerless live-tail rule, the frozen-grant and width-clamp fixes.
- [[retry-classification]] — the pure retry-vs-terminal predicate: keyed on stopReason/errorMessage not state, a superset of pi's pattern, verified against pi's installed bundle.
- [[retry-policy]] — the `.council.json` top-level `retry` sibling: shipped defaults, fail-loud validation, the off switch, and the injected denominator snapshot.
- [[parent-turn-continuation]] — the `agent_settled` + `sendUserMessage` resume loop: input-bar countdown, Esc/Enter semantics, headless SIGINT/exit-75, and the event-ctx gap.
- [[per-attempt-provenance]] — one job id/manifest/row per retried dispatch, with an `attempt` field, carried cumulative usage, and per-attempt session pointers.
- [[figure-scoped-disclosure]] — a usage qualifier applies to a figure: `partial` iff a figure exists and an attempt is unaccounted; `n/a` alone when the figure is absent.
- [[test-suite-budget]] — the measured default-`bun test` wall-clock envelope (FLLWUP-48, ≈94s): per-file live-arm table, ceiling-vs-budget distinction, 180s drift threshold (not a budget), re-measure command, standing maintenance rules.
- [[red-base evidence]] — The convention fixing what a falsifier's red-at-base evidence record must contain (seven fields) and how records compare (comparison triple; skeptic-derived two-class mechanism-absent boundary; head half green).

## Comparisons

_(none yet)_

## Sources

- [[2026-09-17-po-fllwup47-step6-ruling]] — The FLLWUP-47 product-owner ruling that settled the red-base evidence convention (R1–R6) and carried the true EV-41 causal story; the source of [[red-base evidence]].
- [[2026-08-23-readme]] — README: makes the author's "prompted instead of prompting" project.
- [[2026-08-23-agents]] — AGENTS.md: the 13 hard conventions + repo operating rules.
- [[2026-08-23-pi-council-design-spec]] — Design of the pi-council package.
- [[2026-08-23-mcp-support-design-spec]] — Design of the MCP subsystem (v0.2.0).
- [[2026-08-23-pi-council-implementation-plan]] — V0.1.0 build-out runbook.
- [[2026-08-23-mcp-implementation-plan]] — V0.2.0 MCP build-out runbook.
- [[2026-08-23-context7-preflight-plan]] — V0.3.0 Context7-by-default + preflight plan.
- [[2026-08-23-council-json-override]] — V0.7.0: the committed .council.json field-level seat override layer.
- [[2026-08-24-bugfix-seat-prose]] — Bugfix: purges stale deliver.md / GATE-EVIDENCE.md / hardcoded .pi / "registry" framing from seat + procedure prose.
- [[2026-08-24-ask-user-question]] — Ask-user-question second dependency: generalized COUNCIL_DEPENDENCIES list, preflight gate.
- [[2026-08-24-unattended-smoke-test-design]] — Design of the v0.10.0 unattended smoke test: container, fixture, phases, hard-fail contract.
- [[2026-08-24-unattended-smoke-test-plan]] — Six-task runbook that built the smoke test (fixture, image, driver, costing tasks).
- [[2026-08-25-smoke-test-bugfixes]] — The three production bugs the smoke caught (headless dispatch, MCP startup, hub-tool allowlist) + v0.10.0 release.
- [[2026-08-25-remote-mcp-oauth]] — V0.11.0: two-phase copy-paste remote OAuth login (/mcp login --remote + /mcp auth), persisted PKCE verifier, headless auto-detection.
- [[2026-08-25-remote-mcp-oauth-fix]] — V0.11.1: registered-list redirect-URI derivation + stale-client re-registration, fixing Clerk's invalid_request.
- [[2026-08-25-mcp-login-refresh]] — V0.11.2: login/auth now refresh the live runtime so /mcp list reflects credentials, not stale unauthenticated/tools=0.
- [[2026-08-25-council-init-approve]] — V0.11.3: /council-init passes --approve to pi install -l on untrusted projects, fixing headless dep pinning.
- [[2026-08-25-council-tree-modal]] — V0.11.4: /council-tree + transcript viewer render as full-screen modals (backdrop + bordered panel), fixing unreadable overlay.
- [[2026-08-25-design-ev1-round2]] — Designer round-2 on EV-1: theme port requires the pi.themes manifest entry + verbatim omp var names + hot-reload asymmetry.
- [[2026-08-25-po-ev1-escalation]] — PO ruling on EV-1: spec §3/§4 corrections ride the PR + EV-2 pointer; predictions route to smoke/EV-4; NAME-1 card edit stands.
- [[2026-08-25-design-ev3]] — Designer first-pass on EV-3: pure decideActivation, raw-settings detection, in-memory construction, notify as evaluation signal.
- [[2026-08-25-design-ev3-round2]] — Designer round-2 on EV-3: the five activation disputes (custom pairs block, ui.theme continuity, tempfile, corrected acceptance).
- [[2026-08-25-design-ev4-round1]] — Designer audit for EV-4: token-only surface map, CouncilTree cache-stale repaint trap, widget function form, in-memory HTML-export gap.
- [[2026-08-26-smoke-v0.12.0]] — Clean-green v0.12.0 smoke run of the full council loop + epic in a fresh container; the harness as stability gate, not bug-hunter.
- [[2026-08-26-theme-module-resolution-fix]] — Bugfix v0.12.1: the council theme silently never activated in an installed package because `loadPiThemeModule` used a bare-specifier `import.meta.resolve` (not covered by pi's extension remap); now walks pi's install root via public `getPackageDir()`.
- [[2026-08-26-design-ev8]] — Designer EV-8 first pass: focus as a signifier (▌ marker + vim-mode label), derived multi-line rule, safe release-and-replay default.
- [[2026-08-26-po-ev8-ruling]] — PO EV-8 ruling: editor-driven focus (no setFocus), forward-unhandled keys, taste set endorsed (-- TREE --, U+258C, no j/k).
- [[2026-08-26-design-ev9]] — Designer EV-9 first pass: inline progress expansion (tree rows + divider + TranscriptView), shared-VStack bound, progress routing table.
- [[2026-08-26-design-ev9-round2]] — Designer EV-9 round 2: tree-as-anchor height budget (drops 50/50), Enter-as-no-op reaffirmed, union encoding.
- [[2026-08-26-po-ev9-tiny-regime-floor]] — PO EV-9 ruling: min supported terminal height 7 rows; below it Enter is a consumed no-op (inline progress silently unavailable).
- [[2026-09-03-v0.14.0-domain-neutral-stack-agnostic]] — v0.14.0: seats/procedures de-domained + stack-agnostic, convention #1 inverted, specs/plans archived to stubs.
- [[2026-09-04-epic3-run-ledger]] — The EPIC-3 run (v0.15.0): /features-new rebuilt as a three-wave seated deliberation with a bounded session; the id-collision, stall-window, and confabulated-judge lessons.
- [[2026-09-04-epic4-run-ledger]] — The EPIC-4 run (v0.15.0/v0.16.0): the model eval harness end to end; six deterministic-gate merges, the ruling chain, divergent-main repair, CONFIRM-2.
- [[2026-09-04-epic5-run-ledger]] — The EPIC-5 run: /council-models shipped end to end (resolver, first .council.json writer, modal, wiring); gate parity, echo-then-run, Phase 1 rulings preflight, stall recoveries.
- [[2026-09-05-epic6-run-ledger]] — The EPIC-6 run: the model-name search filter (EV-26/EV-27) plus FLLWUP-9/10/11 closed; five gated merges, zero escalations, first fully-autonomous epic closure; stall recurrence, sub-dispatch loss, staged-set contamination lessons.
- [[2026-09-06-epic6-close-run-ledger]] — The EPIC-6 close run: BUG-1 + FLLWUP-13..25 delivered (14 gated merges), the env-split contract proven (no 0.85.0 regression), the single-writer discipline hardened three layers deep, first epic-card closure, v0.18.0.
- [[2026-09-11-epic7-run-ledger]] — The EPIC-7 run: honest token/cost usage accounting (EV-28/30/31/32/29, five gated merges) — every child escalated, the provider has no per-component dollar source, the stalled runner re-learned the window invariant, second epic-card closure at v0.18.0.
- [[2026-09-15-epic8-run-ledger]] — The EPIC-8 run: elegant transcript rendering (EV-33/34/35/36, four gated merges) — the taste request resolved to a parser-fidelity fix first, every child escalated, the one-row R3 projection, third epic-card closure at v0.18.0.
- [[2026-09-16-epic9-run-ledger]] — The EPIC-9 run: provider-error retry with exponential backoff (EV-37/38/39/40/41/42/43, seven gated merges) — all five merge criteria passed on a dead literal branch, four cards escalated, the first human-granted merge bypass, fourth epic-card closure at v0.18.0 (released as v0.19.0).
- [[2026-09-17-epic9-residual-run-ledger]] — The EPIC-9 residual run: nine promoted residuals (FLLWUP-40–45, 47–49) delivered (PRs #58–#66), two steward goal amendments, the step-12 record-push admin-bypass gap, and a mid-run `.council.json` drift.
- [[2026-09-03-po-ev16-grader-topology]] — Grader = harness-dispatched sibling, cellId linkage, three cost columns, no exclusion rule; Q1's repeat dimension superseded its first-write-wins clause.
- [[2026-09-03-po-ev19-resultrecord-key]] — O1: ResultRecord key (cellId, repeat, scoredUnder) by symmetric mirroring; silent loss of a re-grade rejected.
- [[2026-09-03-po-epic4-promotion-cadence]] — P1–P5: the automated Backlog→Ready chain for EPIC-4's children.
- [[2026-09-03-design-ev20]] — Designer r1 on /council-eval: three gulfs, TS-handler-not-procedure scope decision, echo as forcing function.
- [[2026-09-04-design-ev20-round2]] — Designer r2: matrix pseudo-row dropped (no second progress widget), transcript lines + echo-then-run stay, one shared pure renderer.
- [[2026-09-03-po-ev21-ruling]] — /council-leaderboard name; CONFIRM-2 fold-in; σ not VARIANCE; four-state empty spectrum; Phase-4 smoke mandatory; kind limitation accepted.

