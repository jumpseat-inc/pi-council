# Wiki Index

Catalog of every wiki page. On a query, read this first, then drill into the
relevant pages. Each entry: link + one-line summary (+ optional metadata).

## Overviews

- [[pi-council-overview]] — Pi-council as an installable package: the Council
  + wiki workflow, two engine halves, the loop, and the release version arc
  (through v0.33.0, untagged; latest release v0.19.0, several epics behind. EPIC-6/7/8/9/13/14
  closed Done; EPIC-13 shipped metered deliberation routing at v0.21.0–v0.28.0,
  EPIC-14 re-homed gate enablement to `.council.json`, and EPIC-10 closed Done at
  v0.33.0 shipping the typed follow-up review (File/Merge/Drop); EPIC-11/12 remain Backlog).

## Entities

- [[owner]] — Engineering voice + single implementing owner; four gates to a PR.
- [[skeptic]] — Council's formal adversary; every claim is broken until a test proves it.
- [[judge]] — Fresh-context PASS/REJECT evaluator against the card's goal.
- [[principal]] — Cross-cutting seam-reframer; never implements.
- [[designer]] — Human-centered design seat (Don Norman tradition).
- [[consolidator]] — Synthesis voice; names disagreement, never resolves it.
- [[product-owner]] — Card-level product judgment; escalates to steward.
- [[steward]] — Portfolio-level authority; the product-owner's escalation target (EPIC-14 closure ruled the version bump not a closure condition).
- [[council-runner]] — Autonomous per-card execution container for features-deliver; carries main-repo immutability + pinned verification subjects (v0.18.0). EPIC-15 restored orchestrator-executed merges and found the follow-up review tool absent in-container.
- [[council models picker]] — /council-models surface: command, resolver, token-only modal, the `/`-triggered model-name search input (two-bit focus machine, ruled search copy), complete as of v0.18.0 (backspace, pre-press hint, exit hint, frame fit, kitty smoke).
- [[council config writer]] — the .council.json write path (EV-24): byte-region splice, field-level merge, atomic, gate-parity validation; FLLWUP-10 fixed the `:suffix` seam, FLLWUP-9 added `clearSeatOverride`.

## Concepts

- [[seats]] — The seat abstraction; frontmatter schema, tool-grants, child sandboxing.
- [[facilitator]] — The routing-and-bookkeeping role that runs the loop and decides nothing.
- [[council-loop]] — The facilitator-run deliberation → implement → verify → judge loop.
- [[engineering-board]] — The card board + cards under council/; validate.py discipline, and the fold-in test (a work item belongs to a live card iff needed to meet its goal as written).
- [[procedure-commands]] — The scanned, override-aware slash-command set + the 8 procedures (incl. `/usages`).
- [[repository-grounding]] — The engine-appended prompt block that grounds seats in the wiki/code.
- [[override-resolution]] — Repo-local resources shadow packaged ones by filename.
- [[non-clobbering-scaffold]] — /council-init; creates files without ever overwriting. The usages skill is copied outside the scaffold tree; a stale copy is refreshed only by package-update → delete → re-init (EPIC-15).
- [[model-output-floors]] — Data-driven min-token floors for models with wrong catalogue ceilings.
- [[council-dependencies]] — The packages /council-init pins project-locally and preflight enforces (superpowers + ask-user-question).
- [[ask-user-question]] — The rpiv-ask-user-question extension: a human-in-the-loop question tool for the parent session.
- [[hub-job-supervision]] — The job table + spawn/monitor/stall-kill engine and 3 council tools.
- [[mcp-support]] — Model Context Protocol servers, auth (loopback or copy-paste remote login), and seat grants (tools only).
- [[remote-oauth-login]] — The copy-paste OAuth pattern for headless/remote agents: print the URL, paste the redirect back, PKCE makes it safe without tunnels.
- [[preflight]] — The card-aware, fail-fast shell+script gate before every run, now hosting the lock-drift tripwire; since EPIC-14 preceded by the packaged `council_preflight` run-start credential check.
- [[lock-drift tripwire]] — Local gates refuse to run when installed deps drift from bun.lock; the named FAIL fires before the frozen-lockfile self-heal.
- [[llm-wiki]] — The persistent, compounding knowledge base (sources → wiki → schema).
- [[council-config]] — The committed `.council.json`; field-level per-seat model/thinking override PLUS top-level `theme`, `retry`, and `gate` sections, scaffold-seeded.
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
- [[deterministic-merge-check]] — The features-deliver merge gate: five mechanical criteria observed directly, keyed since EPIC-13 by the card's recorded execution mode (Direct = 1/2/5; no recorded mode = HALT), merged --match-head-commit, Done only after gates green on the merged SHA. EPIC-15 restored orchestrator-executed merges.
- [[record-push-discipline]] — The step-12 direct-to-main record push is a privileged write the authority map does not re-home; **closed by FLLWUP-60** (`aa1923fe`, 2026-09-18) — the procedure names a run-scoped authorization and fences an unauthorized push as a HALT.
- [[run-config-stability]] — A mid-run `.council.json` seat-model change silently alters which models later dispatches use; scope-pure commits + a Phase-0 stability check.
- [[two-bit-focus-machine]] — The modal key-handling pattern from EV-27: searchActive × inputFocused, Esc routed on inputFocused, Down as the focus-out edge; ▌ signifier + capture-by-construction trigger; backspace-as-delete added by BUG-1.
- [[env-split contract]] — The parent/child mode split is keyed on COUNCIL_SEAT and version-independent; two-pole verified; the "0.85.0 regression" was probe contamination; the fallthrough-to-model-dispatch hazard documented.
- [[main-repo immutability]] — No checkout/switch/reset against the main repo path, worktree-only, enforced on runner + working seats + dispatch inputs after two record-corruption incidents.
- [[verification-subject pinning]] — Judge/skeptic dispatch inputs name the PR head SHA + head worktree path and the loop frame; wrong-tree verdicts eliminated.
- [[union-merge-reconcile]] — The diverged-main repair after squash merges fold a runner's board commits: union-keep both record sides, validate.py as the net, sweep for conflict markers; push records as you go to avoid it. EPIC-15 added the untracked-worktree-file ff abort (compare-then-remove).
- [[gate-parity]] — A write/validation layer may be stricter than the runtime only where an existing gate is also that strict; capability lives at selection, not persistence.
- [[echo-then-run]] — The house confirm pattern: quote the exact resolved selection via the same function the write uses; echo == write by construction; never assert state the screen cannot compute.
- [[chain-promotion]] — Dependent child chains promote Backlog→Ready automatically as each predecessor's merge lands; ruled once, executed without re-asking.
- [[procedures-vs-commands]] — Markdown procedures (LLM judgment is the feature) vs TS commands (LLM obedience is required); the rule of thumb from EPIC-4.
- [[usage-accounting]] — The EPIC-7 subsystem: the full flat token/cost tuple with `costBasis`/`usageSource` provenance, captured at the hub, recorded, stored, and reported.
- [[spend-record]] — Invocation-scoped two halves (`ownSession` session-enumeration + `subtree` stream projection), each with its own basis; unresolvable boundary zeroes both.
- [[usage-store]] — The durable store at `getAgentDir()/council/usage/`: one record per invocation, schema v2, `pointerSurvivable` + `ResolveOutcome`, surviving run pruning; siblings `provider`, `gate`, and (2026-09-21) per-seat `seats[]`.
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
- [[test-suite-budget]] — the measured default-`bun test` wall-clock envelope (≈101s → ≈110s at 1286 tests post-EPIC-14): per-file live-arm table, ceiling-vs-budget distinction, 180s drift threshold (not a budget), the FLLWUP-58 CI-timeout backstop, the FLLWUP-56 header rule, the 2026-09-20 census correction (true floor 52), and the EPIC-14 rule that docs cards ship pins in `test/`, not `validate.py`.
- [[retired-path-tokens]] — FLLWUP-59's derived token set: test 6's list comes from git HEAD ancestry (never hand-maintained), pinned emission/matching rules, composed shallow+canary loud-fail, three owned narrowings, red-base falsifier at `323abdc`.
- [[red-base evidence]] — The convention fixing what a falsifier's red-at-base evidence record must contain (seven fields) and how records compare (comparison triple; skeptic-derived two-class mechanism-absent boundary; head half green).
- [[council-update]] — FLLWUP-50's consent-gated refresh path for packaged council tooling (`/council-update`, the `scaffold.json` provenance record, the session-start drift notice).
- [[council-setup]] — EPIC-11 (Backlog, unbuilt): grounded, interview-driven `/council-setup`; the 2026-09-22 Jev recut adds a third gate domain (seat composition, `Default` fail-safe) and a `<seat_emphasis>` persona note, still under wave-2 designer attack.
- [[version-on-first-run]] — EPIC-12 (Backlog): show the pi-council version + latest git hash on the first pi run.
- [[metered-deliberation-routing]] — EPIC-13 (shipped v0.28.0): a typed System One gate routes each card to Deliberate/Verify/Direct; **`off` routes every card to the full Deliberate panel** (maximum scrutiny); enablement lives in `.council.json`'s top-level `gate` section — packaged default `mode: "off"`. EPIC-10 (2026-09-22) found the shipped gate inert in production (noul wire-shape drift, dead recorded-decision fast path; FLLWUP-99/100/104); EPIC-15 confirmed both gate domains inert and the run on the Deliberate fallback.
- [[followup-decision-gate]] — EPIC-10 (shipped v0.33.0): the follow-up review's typed File/Merge/Drop decision, a sibling of the card gate sharing one `gate.mode`; a failed decision falls back to the human and may never Drop or auto-Merge. EPIC-15: the review tool is absent in-container, so candidates are held and seat-ruled.
- [[inert-gate-fallback]] — An enabled decision gate whose live call fails is inert, not blocking: the fallback is the safe lane (Deliberate / human review) and the run's mode comes from the run substrate. EPIC-15 evidence.
- [[confirmation-authority]] — Under `active`, a recorded decision is the disposition SOURCE, never the human confirmation; a runner escalates each candidate for ratification by a ruling seat before any write.
- [[step-13-followup-surface]] — EV-82's step-13 surface: the one-line disposition render, four unavailable-state literals, the unconditional dedup pass, and the hard pre-write pin.
- [[followup-merge-and-auto-ingest]] — SUPERSEDED (2026-09-22): the pre-cut EPIC-10 plan (merge-before-draft + autonomous ingest); replaced by [[followup-decision-gate]].
- [[usages-report]] — `/usages <time_range>`: a packaged procedure + `/council-init`-copied tool reporting one repo's per-seat / main-agent token+dollar usage, cross-matched to OpenRouter as JSON + Markdown under `.pi/council/usages/`. EPIC-15 fixed the cache-before-mkdir ordering and added the stale-copy remediation route.
- [[openrouter-analytics-surface]] — OpenRouter's three cost surfaces (account-wide daily `/activity`, per-generation `/generation`, batch `/analytics/query`), their caps, and why `generation_id` is the only reliable join key.

## Comparisons

_(none yet)_

## Sources

- [[2026-09-24-epic15-run-ledger]] — The EPIC-15 run: the usages cache-write ordering bug fixed end to end (3 Deliberate merges, PRs #104–#106), the stale-copy remediation route, and the finding that an enabled-but-failing gate (noul drift in both domains) is inert rather than blocking.

- [[2026-09-22-fix-shape-witness-segment-liveness]] — The FLLWUP-59 derived-token witness's first failure on main was a **false positive**: retiring `.agents/skills/**` emitted dir token `skills/`, which prefix-only liveness kept although `skills/` is live as an interior segment under `.pi/skills/**`; the repair makes dir-token liveness segment-aware, and the over-emission class folds into [[retired-path-tokens]].
- [[2026-09-22-design-epic11-recut-surface]] — Wave-2 designer attack on the Jev-aware EPIC-11 recut: the setup (seat-composition) gate domain's surfaces name no screen/copy/state to the FLLWUP-75 / EV-82 bar; findings A–J plus four observational gaps, led by the first question's Jev-vs-profile provenance mis-attribution.
- [[2026-09-21-usages-design]] — The `/usages` design + build: a packaged procedure plus a `/council-init`-copied skill/tool reporting repo-scoped per-seat spend cross-matched to OpenRouter; the three-surface probe, the `generation_id` join trap, the `seats[]` durability sibling, and the dogfood learnings (end-day window, cache persistence, test-isolation).
- [[2026-09-22-epic10-run-ledger]] — The EPIC-10 run: the typed follow-up review (File/Merge/Drop) shipped end to end (7 Deliberate merges, PRs #97–#103, v0.28.0→v0.33.0), the confirmation-authority ruling (a recorded decision is the source, never the human confirmation), and the discovery that the shipped card gate is inert in production (noul wire-shape drift, dead recorded-decision fast path).
- [[2026-09-21-epic14-run-ledger]] — The EPIC-14 run: gate enablement re-homed to `.council.json`'s `gate` section, `/council-gate` shipped, the run-start credential check landed on a packaged path; five Deliberate merges (PRs #92–#96), two product-owner escalations, one steward closure, 15 follow-ups, and a release left pending.
- [[2026-09-21-po-ev73-step6-ruling]] — The fold-in test (the migration copy belongs to EV-75, not EV-73) and refusal class 4 scoped to `decision.json`'s three override strings.
- [[2026-09-21-po-ev77-j1-j2-ruling]] — The gateFail-tail sentence is in; docs cards ship mechanical pins in `test/`, never in `council/validate.py`.
- [[2026-09-20-po-epic13-promotion-ruling]] — EPIC-13's promotion ratification: EV-60 as chain head, chain-not-bulk cadence, EV-65/EV-68 inert.
- [[2026-09-20-po-ev64-budget-default-and-estimator-ruling]] — `gateStateBudgetTokens` required on gate-capable policies; the token estimator ships unprobed with a self-settling ledger trigger.
- [[2026-09-20-po-ev65-step6-ruling]] — The v2 call-line ledger bump (call-time union in one append) and the deferred `verify ≤ 0` loader guard.
- [[2026-09-20-po-ev66-step6-ruling]] — The pending line is EV-66's sole copy; `touchedFiles: []` is a no-claim; `/features-new` must draft `## Acceptance`.
- [[2026-09-20-po-ev67-step6-ruling]] — The approval-gate locator (heading, not ordinal), the fallback-cell bytes, the gate-enabled goal scoping, and the stale-Intent correction.
- [[2026-09-21-ev69-designer-loss-residual]] — The Verify designer-review gap: named, temporary, closed by `FLLWUP-71`.
- [[2026-09-21-po-ev69-step6-ruling]] — The re-route block resumes at step 3, the designer-loss residual is accepted provisionally, and the goal is conditioned on scripted execution.
- [[2026-09-21-po-ev71-step6-ruling]] — No `costBasis` field (a field needs a named consumer); "grammar unchanged" scopes to row grammar and state exclusivity.
- [[2026-09-21-epic13-run-ledger]] — The EPIC-13 run: metered deliberation routing shipped (13 gated merges, PRs #79–#91, v0.28.0); the System One gate, the mode-aware merge check, the eight rulings folded in, and the reset-vs-union + stall-window + heading-uniqueness lessons.
- [[2026-09-18-epic9-residual-run-2-ledger]] — The EPIC-9 residual run 2: the remaining eleven residuals (FLLWUP-50–60) delivered (PRs #67–#77) plus one R4 retirement; `goal:` made positional, the pre-write step-13 gate inversion corrected, the record-push gap closed, and two pi-runtime mechanism findings.
- [[2026-09-18-po-fllwup56-step13-ruling]] — PO drops both FLLWUP-56 drafts: the live-arm header rule, and two pi-runtime findings routed to [[headless-pi]] and [[council-theme]].
- [[2026-09-18-design-fllwup50-refresh-path]] — The designer's round-1 position on the packaged-tooling refresh path: three moments, two gulfs, five cold-read predictions, seven open mechanism choices.
- [[2026-09-19-po-fllwup59-step13-ruling]] — PO drops both FLLWUP-59 drafts: the retired-path caveat correction (and the spec-is-the-source-of-the-error warning), and the truncated-history residual with a re-card trigger.
- [[2026-09-19-po-fllwup50-step6-ruling]] — The ruling that settled the refresh mechanism: leg-B preserve-and-ask, `/council-update`, a committed scaffold.json record, `_template.md` v1-refreshed, seats fenced out.
- [[2026-09-19-po-fllwup48-test-suite-budget]] — The ruling that created [[test-suite-budget]]: the figure is a measurement with provenance, 180s is a drift threshold, document-only ratified.
- [[2026-09-20-po-fllwup58-gates-backstop]] — The CI-timeout policy ruling: strict/any-arm reading, one `timeout-minutes: 60` on the `bun test` step, never job-level.
- [[2026-09-20-po-fllwup58-step13-confirmation]] — The census re-derivation: 19 compact-form sites, true floor 52, ~1-minute headroom, merged into card FLLWUP-70.
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
- [[2026-design-ev10-round2]] — Designer r2 on EV-10: attribution on the step-3 gate presentation (never card files); generate-then-attack on seat-charter-fit grounds.
- [[2026-09-03-po-ev12-j1-ruling]] — EV-12 J1: reconciling the README "Prompt Then Get Prompted" prose is in scope, as a bounded framing correction.
- [[2026-09-04-po-epic5-ruling]] — EPIC-5 wave-3: EV-23's foreign-ANSI test, EV-25's TUI wiring proof, EV-22's data contract, echo-then-run over two-Enter, EV-24's byte/SHA contract, notify-only reload.
- [[2026-09-04-po-epic6-ruling]] — EPIC-6 wave-3: Esc clears the search text; input below the top row; `qualifiedId`-only substring; `/` typeable; no-match copy to Phase 1; FLLWUP-9/10/11 reassigned.
- [[2026-09-05-design-ev27-round2]] — Designer r2 on EV-27: filter at `currentRows()`, two-bit `(searchActive, inputFocused)` with Up/Down focus-out, superset cache key, Enter preserves the query, kitty-helper names fabricated.
- [[2026-09-15-design-ev36-round1]] — Designer r1 on EV-36: at one row the visible line is the focused unit's composed head; one slice-anchor branch.
- [[2026-09-15-po-epic8-ruling]] — EPIC-8 wave-3: EV-33 demoted to Backlog (single-accessor + out-of-order fixture), EV-34/35/36 ratified, the modal declared dead code.
- [[2026-09-16-design-ev42-partial-legend]] — Designer r1 on EV-42: retire `final-attempt-only` from display, one new literal, migrate legacy on read, grammar-identity preserved.
- [[2026-09-16-po-epic9-retry-ruling]] — EPIC-9 wave-3: pi's pattern misses the Intake's error; all six children demoted with quantified goals; EV-43 reachability falsifier added.
- [[2026-09-16-po-ev37-merge-gate-defect]] — EV-37 merge-gate: the colon-free literal branch is dead; the Intent binds the literal; owner-routable fold-in; no merge at `17b5a7f`.
- [[2026-09-16-po-ev39-step6-ruling]] — EV-39 step-6: inject the `RetryPolicy` snapshot, 2 s tick, escalate EV-42's premise + the final-attempt-only figure to steward; silent partial forbidden.
- [[2026-09-17-po-ev40-ruling]] — EV-40 Q1–Q6: input-bar `CustomEditor`, Enter re-arms, headless SIGINT, interactive backoff, exit 75; P1/D1 gate before implementation.
- [[2026-09-17-po-ev42-step6-ruling]] — EV-42 J1: `partial` is figure-scoped; the all-unaccounted shape carries no `partial`; `attempts-unaccounted`; legacy byte-identical.
- [[2026-09-17-po-fllwup43-step6-rulings]] — FLLWUP-43 step-6: retract the colon-space ban, document the wrap residual (gate-parity), drop the rephrase advice, single-cell eval smoke; three steward escalations.
- [[2026-09-19-po-epic11-decomposition-ruling]] — EPIC-11 wave-3: chain-promotion states, cost dropped from tier predicates, diversity floor 3, fail-loud tier parse, hasUI headless seam, `(Recommended)` grammar, EV-56 falsifier.
- [[2026-09-20-po-epic12-decomposition-ruling]] — EPIC-12 wave-3: once per process, literal identity line, one-shot notify when `hasUI`, no "compare to latest" child; EV-57/58/59 amended goals.

