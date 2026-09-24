#!/usr/bin/env bash
# FLLWUP-114 phase 7 — the backgrounded real parent turn (container-only).
#
# A real `pi -p` session whose model dispatches the council-runner for the
# epic fixture card EPIC-1, then waits briefly and stops. The waiter
# (smoke/phase7-dispatch.ts) bounds the turn; driver.sh kills this PID at the
# ceiling and sweeps the run substrate. The runner's own turn is REAL (the
# fixture .council.json pins every seat to the flash model) — a scripted
# runner turn would make the startup assertions vacuous, which is exactly
# what the card exists to prevent.
#
# FLLWUP-119: the EV-2 workaround is REMOVED. FLLWUP-114 dispatched EV-2
# because EPIC-1's face carried `epic: null` (predating the frontmatter-
# scoped epic parse) and cardEpicKey fail-loud refused it; the face now
# carries `epic: EPIC-1` (repaired to the EV-1/EV-2/EV-3 sibling shape), so
# the phase dispatches the epic card itself — no workaround card.
#
# The dispatch INPUT is startup-bounded and names the runner's role
# explicitly. Two live runs against the repaired face (smoke/.artifacts
# 20260924-183638, 20260924-184623) red the same way: the flash runner read
# "Deliver card EPIC-1" + an orchestrator-addressed overlay as a mandate to
# run the WHOLE epic and spent its window exploring /pkg (its own spawn
# scripts included) without ever making its first seat dispatch. The task
# text now bounds the runner to its seat body's startup contract (seat
# resolution check, then the first owner dispatch) — the transcript stays
# fully model-generated and the reader's anchors + AC2/AC3 stay active, so
# nothing is scripted or vacuous.
set -u

cd "${SMOKE_WORK:?SMOKE_WORK not set}" || exit 2

exec pi --approve --model "${SMOKE_FLASH:?SMOKE_FLASH not set}" -p 'Call the council_dispatch tool now with seat "council-runner", card_id "EPIC-1", input "You are the per-card council-runner for card EPIC-1 — one runner, one card. You are NOT the epic orchestrator: no orchestrator is dispatched in this phase, so do not simulate one, do not deliver the epic, and do not act on any card other than EPIC-1. Follow your seat body startup contract now: run your seat_resolution_check, then immediately make your first seat dispatch with the council_dispatch tool — seat "owner", card_id "EPIC-1", the card itself as the input — per council.md step 2. Do not read anything under /pkg, never read under council/procedures/ from disk, do not run epic Phase 0 or Phase 1 preflight (the orchestrator already cleared them), and do not dispatch any seat other than owner yourself.", timeout_minutes 12, stall_minutes 8. Then call the council_wait tool on the returned job id with timeout_minutes 12 — the wait MUST still be open when the driver tears the phase down. Your turn must never end while the runner lives: a turn that ends early disposes this session, and a later runner settle then fires into the dead context and crashes the process (the FLLWUP-56 in-turn rule). If the wait returns a report, print DONE and end your turn. Do not dispatch any other seat yourself and do not do the runner'"'"'s work.'
