# Portfolio question: where does the convention live?

AGENTS.md convention 5 currently documents repo-local shadowing for agents
and procedures by `$CONFIG_DIR_NAME`. The EV-18 card introduces eval fixtures
as a new resource type with a packaged default at `council/fixtures/<task>/`.

A future resource card will need the same answer this card needs today: does
the convention write the packaged path, the override path, or both, and is a
consumer allowed to shadow a single file or only a whole task dir?

Question for the ruling seat: what one convention line should AGENTS.md
carry, and what happens to a repo-local fixture dir that is missing its own
rubric.json?
