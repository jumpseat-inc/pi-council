---
title: 2026-08-23 committed .council.json override layer (v0.7.0)
type: source
summary: The v0.7.0 engine change that adds a committed, per-repo `.council.json` field-level override for seat model + thinking effort — frontmatter stays the default, the config shadows it, and /council-init seeds it.
aliases: [council.json override layer, v0.7.0]
tags: [pi-council/source]
sources: []
created: 2026-08-23
updated: 2026-08-23
---

> ⚠️ Derived from the v0.7.0 change to `extensions/seats.ts` (`loadCouncilConfig`,
> `applySeatOverride`), the scaffold asset `council/scaffold/.council.json`, and
> AGENTS.md convention #9.5 @ `fd280c6` (captured 2026-08-23). Verify against
> `extensions/seats.ts` for resolution details.

A committed JSON config at the repository root tunes which model and how much
thinking each seat uses. It is the **second** sanctioned override mechanism —
orthogonal to filename shadowing, and the first that is field-level + mergeable.

## Shape

```json
{
  "council": {
    "council-runner": { "model": "openrouter/...", "thinking": "medium" },
    "designer": "openrouter/minimax/minimax-m3:low"
  }
}
```

- **Object form** — `{ "model"? , "thinking"? }`; each key is optional and
  independently falls back to the seat's frontmatter.
- **String shorthand** — a bare model id, optionally with the same `:thinking`
  suffix that frontmatter `model` accepts (e.g. `"…:low"`).
- `model` values must be **qualified** (`provider/id`) or the config throws.
- `thinking` must be one of the fixed set
  (`off|minimal|low|medium|high|xhigh|max`) or the config throws.

## Resolution & precedence

`loadSeat` calls `loadCouncilConfig(repoRoot)` then `applySeatOverride(seat, cfg)`.
Inside an override the precedence is:

1. explicit `thinking` key — beats everything
2. inline `:suffix` on `model`
3. seat frontmatter (the default)

`model` and `thinking` are resolved independently, so a model-only override
keeps the seat's frontmatter thinking and vice versa.

Because application happens inside `loadSeat`, both dispatch sides — the
parent's catalogue check in `hub-tools.ts` and the child's
`--model`/`--thinking` argv, tool grants, and system prompt — see the same
resolved seat. Malformed JSON or invalid values throw loudly rather than
silently degrading.

## Scaffolding

`council/scaffold/.council.json` ships with every seat's **default**
model + thinking (split out of frontmatter), so `/council-init` gives a
consumer a version-controlled, discoverable tuning file. The write is
non-clobbering like every other scaffold file: a re-run on an initialized repo
leaves the consumer's edits byte-for-byte untouched.

## Related

- [[council-config]] — the concept page for the file
- [[override-resolution]] — how this composes with filename shadowing
- [[non-clobbering-scaffold]], [[seats]], [[model-output-floors]]

## Sources

- `extensions/seats.ts`, `council/scaffold/.council.json`, `AGENTS.md` @ `fd280c6`