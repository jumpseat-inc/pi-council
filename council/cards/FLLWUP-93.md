---
id: FLLWUP-93
title: Consumer-repo-safe protection for wiki-cited code paths (the T1-class check beyond this repo)
state: Backlog
owner: null
epic: EPIC-14
goal: Decide as tooling design — not as a docs fold-in — whether and how the T1-class protection EV-77 shipped in test/ev77-gate-docs.test.ts (every backticked code path cited in vault/wiki/*.md exists; every page is reached from the wiki index) can protect initialized consumer repos, where a legitimate wiki citation of package internals resolves under the install clone rather than the consumer root; the design must not hardcode this package's layout into council/validate.py (packaged tooling, TOOLING_FILES, consent-gated /council-update refresh), and if packaged tooling changes, the card carries the /council-update surface and semver implications.
---

## Intent

Filed from EV-77's step 13, per the product-owner ruling on J2 (recorded verbatim
on the EV-77 card face): "If consumer repos are also to be protected, that is a
SEPARATE tooling-class card with the layout-generalization decided as tooling
design — a step-13 candidate, not a fold-in (EV-77's goal is met without it)."

EV-77 proved the failure class is real (the Skeptic's failure injection: a
nonexistent-path citation in the wiki stayed green before the pin existed) and
shipped the fix for THIS repo only, as bun tests over the real `vault/wiki/*.md`.
The J2 ruling rejected `council/validate.py` as the home precisely because a
check keyed to `extensions/**` citations would hardcode this package's layout
into every consumer repo — the consumer's wiki would go red for doing nothing
wrong. The open question this card owns: what is the layout-general shape of
that protection for consumer repos, if any?

## Acceptance

- A design decision (tooling-class, full deliberation expected) covering at
  minimum: resolution root for package-internal citations in a consumer repo
  (install clone vs consumer root vs opt-in), where the check lives (packaged
  tooling via `TOOLING_FILES` / `/council-update` consent-gated refresh, or
  repo-local), and the no-op seam for repos without a wiki.
- If the design changes packaged tooling: `/council-update` surface, scaffold
  provenance record, and semver bump handled per the repo's hard conventions.
- Consumer repos with legitimate citations of package internals do not go red
  for doing nothing wrong.
