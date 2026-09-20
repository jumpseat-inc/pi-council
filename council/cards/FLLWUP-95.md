---
id: FLLWUP-95
title: Cut the EPIC-14 release — bump `package.json` past 0.28.0, tag, and move `latest`
state: Backlog
owner: null
epic: EPIC-14
goal: The EPIC-14 engine changes ship as a tagged release — `package.json` is bumped past 0.28.0 (the semver level is the human's call; the steward's reading is minor, 0.28.0 → 0.29.0, because the consumer-visible change is the removal of legacy `policy.json` `mode` and its migration FAIL), committed, tagged `vX.Y.Z`, `main` and the tag pushed, and the moving `latest` tag force-moved to the new version per the release protocol; the untagged backlog (v0.20.0, v0.21.0–v0.28.0, and EPIC-14's changes) is swept into the release record.
---

## Intent

Filed by the EPIC-14 closure ruling (steward, job-10, run
`2026-09-20T08-59-16-719Z-259999-vjf6un`). EPIC-14 changed engine behavior —
a new `/council-gate` command (EV-74), a new run-start preflight tool (EV-76),
gate enablement relocated from `council/gate/policy.json` to `.council.json`
(EV-73), and a legacy-`mode` migration FAIL (EV-75) — but no EPIC-14 PR bumped
`package.json`, which stands at `0.28.0` (EPIC-13's release). AGENTS.md:
"Bump `version` in `package.json` in the same PR as the behavior change" and
"Bump `version` in `package.json` when the payload or engine behavior changes."

The steward ruled this is **not** a closure condition (the EPIC-7 precedent:
closure at an unchanged version; the release act is the human's) but it is a
recorded residual — a Backlog item executed by the human via `/bump`. The
semver level stays the human's call; `/bump` states "Never guess a bump level —
it is a semver contract, not a convenience."

Material fact surfaced by the closure: the moving `latest` tag is a full epic
behind `main` — `latest` is at v0.19.0 while v0.20.0 and v0.21.0–v0.28.0 are
untagged. This card resolves that.

## Acceptance

- `package.json` carries a version past 0.28.0, committed on `main` in the
  release commit.
- `git tag vX.Y.Z` is created and pushed; `git tag -f latest vX.Y.Z` is
  force-moved and pushed, per AGENTS.md's release protocol.
- The release notes name the EPIC-14 consumer-visible changes (the legacy
  `policy.json` `mode` migration FAIL, the `/council-gate` command, the
  run-start preflight line, the `.council.json` `gate` section).
- The release record accounts for the prior untagged versions.