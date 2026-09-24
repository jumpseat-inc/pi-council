#!/usr/bin/env bash
# FLLWUP-114 phase 7 — the backgrounded real parent turn (container-only).
#
# A real `pi -p` session whose model dispatches the council-runner for the
# dispatchable fixture card EV-2 (skeptic O1: EPIC-1's own face is epic:null
# and cardEpicKey fail-loud refuses it — never dispatch EPIC-1 here), then
# waits briefly and stops. The waiter (smoke/phase7-dispatch.ts) bounds the
# turn; driver.sh kills this PID at the ceiling and sweeps the run substrate.
# The runner's own turn is REAL (the fixture .council.json pins every seat to
# the flash model) — a scripted runner turn would make the startup assertions
# vacuous, which is exactly what the card exists to prevent.
set -u

cd "${SMOKE_WORK:?SMOKE_WORK not set}" || exit 2

exec pi --approve --model "${SMOKE_FLASH:?SMOKE_FLASH not set}" -p 'Call the council_dispatch tool now with seat "council-runner", card_id "EV-2", input "Deliver card EV-2 by following your council procedure and its features-deliver overlay.", timeout_minutes 12, stall_minutes 8. Then call the council_wait tool on the returned job id with timeout_minutes 5. When the wait returns, print DONE and end your turn — do not dispatch any other seat yourself and do not do the runner'"'"'s work.'
