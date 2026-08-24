---
title: Ask User Question
type: concept
summary: The rpiv-ask-user-question extension — a human-in-the-loop question tool for the parent/facilitator session; pinned project-locally and enforced by preflight.
aliases: [ask-user-question, rpiv-ask-user-question]
tags: [pi-council/concept]
sources: ["[[2026-08-24-ask-user-question]]"]
created: 2026-08-24
updated: 2026-08-24
---

# Ask User Question

> ⚠️ Derived from `extensions/dependencies.ts`, `council/scaffold/council/preflight.sh`,
> `council/procedures/features-new.md` (captured 2026-08-24). Verify against the
> extension package itself for the tool's exact name.

`rpiv-ask-user-question` (`npm:@juicesharp/rpiv-ask-user-question`) is the
council's second project-local dependency (see [[council-dependencies]]). It
provides a human-in-the-loop question tool: the parent/facilitator session
(running `/council`, `/features-deliver`, `/features-new`) can interrupt to ask
the human a question and wait for the answer. It runs in the **parent**
session — the seat children are headless and cannot use it.

- Installed project-locally by `/council-init` under
  `$CONFIG_DIR_NAME/npm/node_modules/@juicesharp/rpiv-ask-user-question`.
- Asserted by [[preflight]] (clone dir or `$CONFIG_DIR_NAME/settings.json` pin).
- The source is listed in `COUNCIL_DEPENDENCIES`; adding it required no new
  engine code paths beyond the generalization to a list (see
  [[council-dependencies]]).

## Related

- [[council-dependencies]], [[preflight]], [[council-loop]]

## Sources

- `extensions/dependencies.ts`
- `council/scaffold/council/preflight.sh`