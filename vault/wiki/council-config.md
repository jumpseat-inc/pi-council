---
title: Council Config
type: concept
summary: The committed `.council.json` at the repo root — a per-seat `council` block overriding model/thinking, PLUS a sibling top-level `theme` section giving per-repo control of the council palette. Frontmatter and shipped palette stay the defaults; the file shadows both. Seeded non-clobberingly by /council-init.
aliases: [.council.json, council.json, agent overrides, seat model override, seat config]
tags: [pi-council/concept]
sources: ["[[2026-08-23-council-json-override]]", "[[2026-08-25-design-ev3]]", "[[2026-08-25-design-ev3-round2]]"]
created: 2026-08-23
updated: 2026-09-04
---

# Council Config

> ⚠️ **Superseded in part (2026-09-04, EPIC-5):** this page described
> `.council.json` as a read/parse-only surface — loaders, precedence,
> scaffolding. It now also has a **write path**: [[council config writer]]
> (`writeSeatOverride`), the first code that mutates the file. The read-path
> facts below stand unchanged; the write side is new since EV-24.

`council-config` is the committed per-repository tuning file introduced in
v0.7.0. Unlike filename shadowing ([[override-resolution]]) — where a repo file
replaces a packaged one wholesale — `.council.json` overrides **individual
fields** of a seat and **merges** with the rest: each seat keeps its
frontmatter `tools`, `spawns`, `mcp`, and body; only `model` and/or `thinking`
are shadowed.

Since EPIC-1, `.council.json` also carries a **`theme` section** — a top-level
sibling of `council` that recolors the council palette per-repo (see
[[council-theme]]). The two siblings parse through separate loaders; `theme`
is a reserved key, never a per-seat override.

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

## The `theme` section (EPIC-1 sibling)

The `council` block is keyed by seat name; the shared file also holds a
**top-level `theme` key**, a sibling of `council`, parsed by `loadThemeConfig`
and **skipped as a reserved key in the `loadCouncilConfig` loop** (without the
guard, a `council.theme` entry would parse as a phantom seat override).

```json
{
  "council": { "<seat>": { "model"?, "thinking"? }, ... },
  "theme": {
    "enabled": true,
    "variant": "auto",
    "dark":  { "vars": { "<varName>": "<value>" }, "colors": { "<tokenName>": "<value>" } },
    "light": { "vars": { "<varName>": "<value>" }, "colors": { "<tokenName>": "<value>" } }
  }
}
```

- `variant` ∈ `auto | dark | light` (auto follows terminal background).
- Per-variant `vars`/`colors` overrides merge over the shipped omp palette base
  ([[council-theme]]); `vars` keys must be declared vars of that variant,
  `colors` keys are pi token names.
- `enabled: false` (or a falsy/non-object `theme`) is the **off switch**.
- Validation is fail-fast, message naming the file — same discipline as the
  seat overrides.

See [[council-theme]] for the full activation four-state table, name
namespace, and token-only drawing rule.

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

## The write path (EPIC-5)

Since EV-24 the file is writable: [[council config writer]] performs a
field-level merge of one seat's `council.<seat>` object — **absent keys
mean preserve** (a model-only write keeps an existing `thinking`), the
write is a byte-region splice that leaves the `theme` section, other
seats, unknown keys, and indentation byte-identical, and validation is
gate-parity-strict ([[gate parity]]): model-presence in the catalogue
plus `THINKING_LEVELS` grammar, nothing more — capability is the
picker's job ([[council models picker]]). Clearing an override is a
distinct affordance (FLLWUP-9), not silent absence. Known seam: the
writer's `existingThinking` misses an object-form `model` `:suffix`
(FLLWUP-10, tracked).

## Relation to other mechanisms

| Mechanism | Granularity | Merge? |
|---|---|---|
| Filename shadowing (`<repo>/.pi/agents/*.md`) | whole seat file | no — first hit wins |
| **`.council.json` field override** | `model`, `thinking` per seat | yes — independent fallback |
| **`.council.json` theme section** | `vars`/`colors` per variant | yes — over shipped palette base |
| Model output floors (`model-floors.json`) | token ceilings per model | yes (merge) |

The mechanisms compose: path shadowing picks which seat body runs, then the
config field-overrides its model/thinking; the theme section (when present)
recolors the palette the seat UI draws. See [[override-resolution]] for the
canonical precedence list.

## Scaffolding

`/council-init` seeds `council/scaffold/.council.json` with every seat's
frontmatter-derived defaults (model + thinking split out) **and** a `theme`
section defaulting to the shipped omp palette (documenting the per-variant
`vars`/`colors` override surface), non-clobbering — re-runs never overwrite a
consumer's edits ([[non-clobbering-scaffold]]).

## Related

- [[council config writer]] — the write path (EV-24, EPIC-5)
- [[council models picker]] — the surface that writes it
- [[gate parity]] — the writer's validation boundary
- [[council-theme]] — the palette subsystem the `theme` section drives
- [[seats]] — the schema fields the config overrides
- [[override-resolution]] — filename shadowing, the sibling mechanism
- [[non-clobbering-scaffold]], [[model-output-floors]]
- [[2026-08-23-council-json-override]] — the source ingest
- [[2026-09-04-epic5-run-ledger]] — the run that added the writer

## Sources

- `extensions/seats.ts` (`loadCouncilConfig`, `applySeatOverride`,
  `loadThemeConfig`)
- `extensions/council-config-writer.ts` (EV-24)
- `council/scaffold/.council.json`
- [[2026-08-23-council-json-override]]
- [[2026-08-25-design-ev3]], [[2026-08-25-design-ev3-round2]]
- [[2026-09-04-epic5-run-ledger]]