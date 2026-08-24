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
- [[steward]] — Portfolio-levamped authority; the product-owner's escalation target.
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
- [[superpowers-dependency]] — The skills package pin /council run/refuses the council without it.
- [[hub-job-supervision]] — The job table + spawn/monitor/stall-kill engine and 3 council tools.
- [[mcp-support]] — Model Context Protocol servers, auth, and seat grants (tools only).
- [[preflight]] — The card-aware, fail-fast shell+script gate before every run.
- [[llm-wiki]] — The persistent, compounding knowledge base (sources → wiki → schema).
- [[council-config]] — The committed `.council.json`; field-level per-seat model/thinking override, scaffold-seeded.

## Comparisons

_(none yet)_

## Sources

- [[2026-08-23-readme]] — README: makes the author's "prompted instead of prompting" project.
- [[2026-08-23-agents]] — AGENTS.md: the 11 hard conventions + repo operating rules.
- [[2026-08-23-pi-council-design-spec]] — Design of the pi-council package.
- [[2026-08-23-mcp-support-design-spec]] — Design of the MCP subsystem (v0.2.0).
- [[2026-08-23-pi-council-implementation-plan]] — V0.1.0 build-out runbook.
- [[2026-08-23-mcp-implementation-plan]] — V0.2.0 MCP build-out runbook.
- [[2026-08-23-context7-preflight-plan]] — V0.3.0 Context7-by-default + preflight plan.
- [[2026-08-23-council-json-override]] — V0.7.0: the committed .council.json field-level seat override layer.

