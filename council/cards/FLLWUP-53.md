---
id: FLLWUP-53
title: De-repo-specific council.md step 8's gate-file reference and widen the prose guard
state: Backlog
owner: null
epic: EPIC-9
goal: council.md no longer hard-references a gate document path that does not exist in this repo, and the packaged-prose guard covers every shipped file that could reintroduce one.
---

## Intent

FLLWUP-47 step 4 objection O7 (`closed-green`) confirmed a live, unguarded
instance of the failure FLLWUP-47 exists to prevent: `council.md` step 8
(lines 237-238 today) states "`docs/gates/GATE-EVIDENCE.md` is the
authoritative record of what those gates are and how to run them" — a hard,
source-repo-specific path presented as fact in a procedure that ships to every
consumer repo. That path does not exist in this repo (`docs/` holds only
`superpowers/`). The existing guard (`test/prose.test.ts`, the "features-deliver
does not hard-reference the repo-specific gate file" test at :28-34) reads
`features-deliver.md` alone, so it does not catch a second naming — FLLWUP-47
was explicitly constrained not to fix this (its spec §6 names it as a
step-13 residual). `owner.md` inside `<owner_mode>` carries the same path, but
as an `e.g.` example, which is weaker. The card is: replace the hard reference
with consumer-neutral phrasing (the repo's own authoritative gate record, if it
keeps one) and widen the guard to all packaged seat + procedure prose, rewording
`owner.md`'s example in the same pass if the widened guard requires it.
