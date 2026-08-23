<!-- Append-only. Newest entries at top. Format: ## [YYYY-MM-DD] <op> | <title> -->

## [2026-08-23] ingest | Repo-doc seed (pi-council)
Seeded the wiki from this repo's own docs + git history + codebase via the
ingesting-repo-docs skill. Discussed plan with the human first; wrote 26 pages.
- **Created:** pi-council-overview, seats, council-loop,
  engineering-board, procedure-commands, repository-grounding, override-resolution,
  non-clobbering-scaffold, model-output-floors, superpowers-dependency,
  hub-job-supervision, mcp-support, preflight, llm-wiki + 9 seat entities
  (owner..council-runner) + 3 more concept pages.
- **Sources filed (7):** readme, agents, pi-council-design-spec,
  mcp-support-design-spec, pi-council-implementation-plan, mcp-implementation-plan,
  context7-preflight-plan.
- **Manifest:** vault/.repo-docs.tsv recorded -- 24 NEW doc files pinned to commit.
- **Key takeaway:** pi-council generalizes the ev-guide council + wiki into an
  installable, override-able package; the wiki + board are the durable product.

## [2026-08-23] query | Drop the git-history page
Removed `git-history-and-releases` after human review; its version-arc and
commit-discipline content was redistributed into [[pi-council-overview]],
[[preflight]], [[mcp-support]], [[superpowers-dependency]], and
[[model-output-floors]].

## [2026-08-22] scaffold | LLM Wiki initialized
Vault scaffolded; index.md and log.md created. No sources ingested yet.
