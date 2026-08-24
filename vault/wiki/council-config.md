---
title: Council Config
type: concept
summary: The committed `.council.json` at the repo root — field-level, mergeable override of each seat's model and thinking effort. Frontmatter stays the default; the file shadows it. Seeded non-clobberingly by /council-init.
aliases: [.council.json, council.json, agent overrides, seat model override, seat config]
tags: [pi-council/concept]
sources: ["[[2026-08-23-council-json-override]]"]
created: 2026-08-23
updated: 2026-08-23
---

# Council Config

`council-config` is the committed per-repository tuning file introduced in
v0.7.0. Unlike filename shadowing ([[override-resolution]]) — where a repo file
replaces a packaged one wholesale — `.council.json` overrides **individual
fields** of a seat and **merges** with the rest: each seat keeps its
frontmatter `tools`, `spawns`, `mcp`, and body; only `model` and/or `thinking`
are shadowed.

## File & shape

Root of the repository (committed alongside the workflow data):

```json
{
  "council": {
    "council-runner": { "model": "openrouter/deepseek/deepseek-v4-flash-0731", "thinking": "medium" },
    "designer": "openrouter/minimax/minimax-m3:low"
  }
}
```

- `council` is keyed by seat name; unknown seat names are harmless no-ops.
- **Object form** — `{ "model"?, "thinking"? }`, each optional and independent.
- **String shorthand** — bare `model`, optionally with the `:thinking` suffix
  that frontmatter also accepts.
- Validation is fail-fast: malformed JSON, an unqualified model (no `/`), or a
  `thinking` value outside
  `off|minimal|low|medium|high|xhigh|max` throws rather than degrading.

## Precedence

Inside an override:

1. explicit **`thinking`** key
2. inline **`:suffix`** on `model`
3. seat **frontmatter** (the default)

`model` and `thinking` resolve independently, so a model-only override keeps the
seat's frontmatter thinking (and vice versa).

## Where it applies

`loadSeat` applies the override before returning, so the parent's catalogue
check, the child's `--model`/`--thinking` argv, tool grants, and system prompt
all agree. Both dispatch sides honor one resolved seat.

## Relation to other mechanisms

| Mechanism | Granularity | Merge? |
|---|---|---|
| Filename shadowing (`<repo>/.pi/agents/*.md`) | whole seat file | no — first hit wins |
| **`.council.json` field override** | `model`, `thinking` per seat | yes — independent fallback |
| Model output floors (`model-floors.json`) | token ceilings per model | yes (merge) |

The mechanisms compose: path shadowing picks which seat body runs, then the
config field-overrides its model/thinking. See [[override-resolution]] for the
canonical precedence list.

## Scaffolding

`/council-init` seeds `council/scaffold/.council.json` with every seat's
frontmatter-derived defaults (model + thinking split out), non-clobbering —
re-runs never overwrite a consumer's edits ([[non-clobbering-scaffold]]).

## Related

- [[seats]] — the schema fields the config overrides
- [[override-resolution]] — filename shadowing, the sibling mechanism
- [[non-clobbering-scaffold]], [[model-output-floors]]
- [[2026-08-23-council-json-override]] — the source ingest

## Sources

- `extensions/seats.ts` (`loadCouncilConfig`, `applySeatOverride`)
- `council/scaffold/.council.json`
- [[2026-08-23-council-json-override]]