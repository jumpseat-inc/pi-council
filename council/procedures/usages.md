---
description: Report per-seat and main-agent token/dollar usage for a time range, cross-matched against OpenRouter billed activity.
argument-hint: [time_range]
---

You are running the `/usages` report for `$ARGUMENTS` (default `last 30 days`).

**Preflight — hard gate.** Verify `OPENROUTER_MANAGEMENT_KEY` is set and
non-empty (`printenv OPENROUTER_MANAGEMENT_KEY`). If it is missing, STOP now:
run nothing and write nothing. Tell the user to mint a *provisioning* key at
OpenRouter → Settings → Keys → "Provisioning key", then
`export OPENROUTER_MANAGEMENT_KEY=sk-or-…` in the environment that launches pi,
and retry. Never use `OPENROUTER_API_KEY` for this report.

**Run.** Read `.pi/skills/usages/SKILL.md` — if it is absent, tell the user to
run `/council-init`, then stop. Otherwise follow it: run

```bash
python3 .pi/skills/usages/scripts/usages.py --range "$ARGUMENTS"
```

**Report.** Surface the tool's printed summary verbatim; never re-derive or
paraphrase dollar figures. Point the user at the JSON and Markdown files the
tool wrote under `.pi/council/usages/`, and repeat any `!` limitation lines.

If the tool's stderr contains the literal `usages: could not write cache:`,
surface that line to the user verbatim (no prefix, no rewording); explain the
fix ships in a newer package version but does not reach the skill already
copied into this repo, so — after updating the pi-council package — run
`rm -rf .pi/skills/usages/` and then `/council-init` to recopy the fixed tool;
the report itself still ships.

**Stderr discipline.** Every non-empty stderr line the tool prints is quoted
verbatim, exactly as printed: no added prefix of any kind — do not add a ⚠️ or
! to a line that does not itself carry one — and no invented cause,
consequence, or non-fatal-issue count beyond what the line itself reports.
System-status lines are uninterpreted tool output: surface them as printed,
without explanation. Worked example from this procedure's own intake: a seat
wrapped `usages: could not write cache:` in `⚠️ One non-fatal issue:` and
appended an invented likelihood — that framing is exactly what this rule
forbids. (The remediation route for that specific line, above, is unchanged.)
