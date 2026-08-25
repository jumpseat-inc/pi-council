# Wiki Index

Catalog of every wiki page. On a query, read this first, then drill into the
relevant pages. Each entry: link + one-line summary (+ optional metadata).

## Overviews

- [[pi-council-overview]] — Pi-council as an installable package: the Council
  + wiki workflow, two engine halves, the loop, and the release version arc.

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
- [[council-config]] — The committed `.council.json`; field-level per-seat model/thinking override, scaffold-seeded.
- [[smoke-test]] — The definitive unattended end-to-end test: isolated container drives a real /council loop + /features-deliver epic, asserts structure, re-runs gates itself; caught 3 production bugs.
- [[headless-pi]] — pi's non-interactive modes (-p/json/rpc): no trust prompt, single-shot teardown, stale ctx, and the waitForIdle pattern for command turns.
- [[run-transcripts]] — the on-disk run substrate: per-job manifests + session JSONL under .pi/council/runs/, the job forest, and the /council-tree live transcript viewer (ctrl+shift+t).

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

