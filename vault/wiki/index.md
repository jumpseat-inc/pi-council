# Wiki Index

Catalog of every wiki page. On a query, read this first, then drill into the
relevant pages. Each entry: link + one-line summary (+ optional metadata).

## Overviews

- [[pi-council-overview]] — Pi-council as an installable package: the Council
  + wiki workflow, two engine halves, the loop, and the release version arc
  (through v0.14.0).

## Entities

- [[owner]] — Engineering voice + single implementing owner; four gates to a PR.
- [[skeptic]] — Council's formal adversary; every claim is broken until a test proves it.
- [[judge]] — Fresh-context PASS/REJECT evaluator against the card's goal.
- [[principal]] — Cross-cutting seam-reframer; never implements.
- [[designer]] — Human-centered design seat (Don Norman tradition).
- [[consolidator]] — Synthesis voice; names disagreement, never resolves it.
- [[product-owner]] — Card-level product judgment; escalates to steward.
- [[steward]] — Portfolio-level authority; the product-owner's escalation target.
- [[council-runner]] — Autonomous per-card execution container for features-deliver.

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
- [[preflight]] — The card-aware, fail-fast shell+script gate before every run.
- [[llm-wiki]] — The persistent, compounding knowledge base (sources → wiki → schema).
- [[council-config]] — The committed `.council.json`; field-level per-seat model/thinking override PLUS a top-level `theme` section, scaffold-seeded.
- [[council-theme]] — EPIC-1's omp-palette theme subsystem: pinned dark/light pair, `.council.json` recolor surface, four-state activation, token-only drawing + live repaint (v0.12.1: module located via `getPackageDir()`, not a bare-specifier).
- [[smoke-test]] — The definitive unattended end-to-end test: Phases 0–4 (council loop, epic, /council-eval matrix, /council-leaderboard) in an isolated container; standing discipline — the first Council command without an end-to-end falsifier is a defect.
- [[headless-pi]] — pi's non-interactive modes (-p/json/rpc): no trust prompt, single-shot teardown, stale ctx, and the waitForIdle pattern for command turns.
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
- [[chain-promotion]] — Dependent child chains promote Backlog→Ready automatically as each predecessor's merge lands; ruled once, executed without re-asking.
- [[procedures-vs-commands]] — Markdown procedures (LLM judgment is the feature) vs TS commands (LLM obedience is required); the rule of thumb from EPIC-4.

## Comparisons

_(none yet)_

## Sources

- [[2026-08-23-readme]] — README: makes the author's "prompted instead of prompting" project.
- [[2026-08-23-agents]] — AGENTS.md: the 12 hard conventions + repo operating rules.
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
- [[2026-09-03-po-ev16-grader-topology]] — Grader = harness-dispatched sibling, cellId linkage, three cost columns, no exclusion rule; Q1's repeat dimension superseded its first-write-wins clause.
- [[2026-09-03-po-ev19-resultrecord-key]] — O1: ResultRecord key (cellId, repeat, scoredUnder) by symmetric mirroring; silent loss of a re-grade rejected.
- [[2026-09-03-po-epic4-promotion-cadence]] — P1–P5: the automated Backlog→Ready chain for EPIC-4's children.
- [[2026-09-03-design-ev20]] — Designer r1 on /council-eval: three gulfs, TS-handler-not-procedure scope decision, echo as forcing function.
- [[2026-09-04-design-ev20-round2]] — Designer r2: matrix pseudo-row dropped (no second progress widget), transcript lines + echo-then-run stay, one shared pure renderer.
- [[2026-09-03-po-ev21-ruling]] — /council-leaderboard name; CONFIRM-2 fold-in; σ not VARIANCE; four-state empty spectrum; Phase-4 smoke mandatory; kind limitation accepted.

