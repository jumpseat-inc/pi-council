---
title: Repository Grounding
type: concept
summary: The engine appendixes a <repository_grounding> block to every seat prompt — seats consult the repo wiki before taking positions, or (no wiki) ground claims in the actual code.
aliases: [grounding block]
tags: [pi-council/concept]
sources: []
created: 2026-08-23
updated: 2026-08-23
---

> ⚠️ Derived from `extensions/seats.ts` @ `7fa6ec9` + `docs` spec (captured 2026-08-23). Verify against `seats.ts` (`buildSystemPrompt`, `groundingBlock`).

`groundingBlock` in `seats.ts` replaces the removed per-repo `autoloadSkills`
mechanism. `buildSystemPrompt` appends one of two variants to **every** seat
prompt (after the seat body and `<council_runtime>`):

**With a vault wiki present** (`<repo>/vault/wiki/index.md` exists):
> "This repository maintains an LLM wiki under `vault/`. Before taking positions
> on how this codebase works, read `vault/wiki/index.md` and drill into the
> relevant pages. Cite the pages you used. If the wiki does not cover something
> you would otherwise assume, say so."

**With no vault:**
> "No repository wiki found; ground claims in the actual code before asserting them."

This is deliberate design: seats are pointed at a **compiling knowledge store**
(the wiki) rather than a re-loaded skill mechanism. The wiki is itself
LLM-maintained; grounding flows through the ground shell and the wiki.

## Consequences

- Requires no new seat tool grants (seats already have `Read`/`Grep`).
- The wiki must exist for the strong form to apply; the schema ships the
  `/wiki-*` procedures so any consumer can build one.
- It is engine-owned: a seat body can not opt out, and a consumer cannot leave
  a bad fallback in place.

## Related

- [[seats]], [[llm-wiki]]
- [[2026-08-23-pi-council-design-spec]] (the "grounding model replaces autoloadSkills" section)

## Sources

- `extensions/seats.ts`
- `docs/superpowers/specs/2026-08-23-pi-council-design.md`
- `AGENTS.md` (convention 2)