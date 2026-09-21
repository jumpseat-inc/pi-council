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