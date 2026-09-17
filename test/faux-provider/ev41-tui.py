#!/usr/bin/env python3
"""EV-41 TUI falsifier (pty, python3 stdlib ONLY).

Scenario runner over the shared pty substrate (`pty_kit.py` in this
directory — FLLWUP-49; the screen/session model was deduplicated from the
family's copies, provenance in council/cards/EV-43.md). P6 machinery
dropped — no council_dispatch tool call, no inline-tree assertions. Drives
the REAL installed pi TUI (24x80, TERM=xterm-256color, scratch HOME/cwd,
`--offline`, faux provider `ev40`) with the REAL council extension
(`extensions/index.ts`) so COUNCIL's parent-turn retry mechanism is the only
continuation mechanism under test. Both arms inject the same failure class:
the WITH-COLON literal `Provider finish_reason: error` (byte-equal to
PROVIDER_FINISH_REASON_ERROR, O3) as the first provider response's
errorMessage — NOT the classify-negative colon-less EV-43 spelling, and NOT
pi-retryable (pi's own auto-retry therefore cannot produce the second
message).

  treatment  — scratch `.council.json` retry policy ENABLED
               (maxAttempts=3, baseDelayMs=4000, jitter=false): the engine's
               agent_settled handler must arm the backoff (countdown line on
               the screen), re-send the original prompt, and the second
               assistant message must render (EV40-SECOND-RESPONSE).
  control    — identical provider behavior, retry policy DISABLED: no
               mechanism, therefore no countdown line and no second
               assistant message (EV-43 attribution discipline: a control
               with no mechanism shows no continuation).

The runner exits 0 iff BOTH verdicts hold; it prints its per-gate answers
either way (EV41-TUI-VERDICT: GREEN/RED).

Expects env: NODE_BIN, CLI_PATH, EXT_PATH (harness ext), COUNCIL_EXT.
Args: artifact dir.
"""

import json
import os
import sys

from pty_kit import K_CR, Session, read_sequences


def run_arm(outdir, name, retry_policy):
    """One 24x80 pty session: real pi TUI + real council extension + faux
    provider failing once with the with-colon literal. Returns the verdict
    dict; countdown/second-response are read off the SCREEN, the chain off
    the session JSONL."""
    work_dir = os.path.join(outdir, name, "cwd")
    home = os.path.join(outdir, name, "home")
    sessions = os.path.join(outdir, name, "sessions")
    for d in (work_dir, home, sessions, os.path.join(home, ".pi", "agent")):
        os.makedirs(d, exist_ok=True)
    with open(os.path.join(home, ".pi", "agent", "settings.json"), "w") as f:
        f.write('{"defaultProjectTrust":"always"}')
    with open(os.path.join(work_dir, ".council.json"), "w") as f:
        json.dump({"retry": retry_policy}, f)

    argv = [
        os.environ["NODE_BIN"],
        os.environ["CLI_PATH"],
        "-e", os.environ["EXT_PATH"],
        "-e", os.environ["COUNCIL_EXT"],
        "--offline",
        "--provider", "ev40",
        "--model", "ev40/ev40-model",
        "--session-dir", sessions,
        "--no-builtin-tools",
    ]
    settle_log = os.path.join(outdir, name, "settle.log")
    env_extra = {
        "EV40_FAILS": "1",
        "EV40_ARM": "none",
        "EV40_PARTIAL": "0",
        "EV40_SETTLE_LOG": settle_log,
    }

    result = {
        "name": name,
        "countdown_rendered": False,
        "second_rendered": False,
        "chain_error_assistant": False,
        "chain_error_message": None,
        "chain_second_assistant": False,
        "chain_two_user_sends": False,
        "screen_final": "",
    }
    session = Session(argv, work_dir, home, env_extra, os.path.join(outdir, name, "bytes.log"))
    try:
        session.drain(6.0)
        session.respond_queries()
        session.drain(1.0)
        session.wait_stable()

        session.send(b"start")
        session.send(K_CR)

        # Treatment: the engine's countdown line must render while the backoff
        # ticks (the mechanism observable on the real TUI). Control: this must
        # NOT appear; give the errored turn time to land, then assert absence.
        if retry_policy.get("enabled"):
            result["countdown_rendered"] = session.wait_for("Retrying in", ceiling=20.0)
            result["countdown_rows"] = [line for line in session.screen.lines() if "Retrying in" in line]
            result["countdown_is_attempt2"] = any("(attempt 2 of 3)" in line for line in result["countdown_rows"])
            # The backoff re-send: the second assistant message renders.
            result["second_rendered"] = session.wait_for("EV40-SECOND-RESPONSE", ceiling=30.0)
        else:
            session.drain(10.0)
            session.wait_stable()
        session.drain(1.0)
        result["screen_final"] = session.screen.text()
    finally:
        session.kill()

    result["sequence"] = read_sequences(sessions)
    with open(os.path.join(outdir, name, "sequence.json"), "w") as f:
        json.dump(result["sequence"], f, indent=2)
    with open(os.path.join(outdir, name, "screen-final.txt"), "w") as f:
        f.write(result["screen_final"] + "\n")
    errored = [m for m in result["sequence"] if m["role"] == "assistant" and m["stopReason"] == "error"]
    seconds = [m for m in result["sequence"] if m["role"] == "assistant" and "EV40-SECOND-RESPONSE" in m["text"]]
    users = [m for m in result["sequence"] if m["role"] == "user"]
    result["chain_error_assistant"] = any(
        m["errorMessage"] == "Provider finish_reason: error" for m in errored
    )
    result["chain_error_message"] = errored[0]["errorMessage"] if errored else None
    result["chain_second_assistant"] = len(seconds) >= 1
    result["chain_two_user_sends"] = len(users) >= 2
    return result


def main() -> int:
    outdir = sys.argv[1] if len(sys.argv) > 1 else "ev41-tui-artifacts"
    os.makedirs(outdir, exist_ok=True)

    treatment = run_arm(outdir, "treatment", {
        "enabled": True, "maxAttempts": 3, "baseDelayMs": 4000, "maxDelayMs": 30000, "jitter": False,
    })
    control = run_arm(outdir, "control", {
        "enabled": False, "maxAttempts": 3, "baseDelayMs": 4000, "maxDelayMs": 30000, "jitter": False,
    })

    print("===== EV-41 TUI falsifier (24x80, real council extension, offline faux provider) =====")
    print(f"[treatment] countdown line rendered: {treatment['countdown_rendered']}")
    print(f"[treatment] countdown rows: {treatment.get('countdown_rows', [])}")
    print(f"[treatment] countdown names attempt 2 of 3: {treatment.get('countdown_is_attempt2')}")
    print(f"[treatment] EV40-SECOND-RESPONSE rendered: {treatment['second_rendered']}")
    print(f"[treatment] JSONL errored assistant carries the with-colon literal: {treatment['chain_error_assistant']}"
          f" (errorMessage={treatment['chain_error_message']!r})")
    print(f"[treatment] JSONL second assistant present: {treatment['chain_second_assistant']}")
    print(f"[treatment] JSONL >=2 user sends (original + retry resend): {treatment['chain_two_user_sends']}")
    print("[control] countdown line rendered (must be False): "
          f"{'Retrying in' in control['screen_final']}")
    print("[control] EV40-SECOND-RESPONSE rendered (must be False): "
          f"{'EV40-SECOND-RESPONSE' in control['screen_final']}")
    print(f"[control] JSONL errored assistant carries the with-colon literal: {control['chain_error_assistant']}")
    print(f"[control] JSONL second assistant absent (must be True): {not control['chain_second_assistant']}")
    print(f"[control] JSONL single user send (must be True): {not control['chain_two_user_sends']}")

    treatment_green = (
        treatment["countdown_rendered"]
        and treatment.get("countdown_is_attempt2")
        and treatment["second_rendered"]
        and treatment["chain_error_assistant"]
        and treatment["chain_second_assistant"]
        and treatment["chain_two_user_sends"]
    )
    control_green = (
        "Retrying in" not in control["screen_final"]
        and "EV40-SECOND-RESPONSE" not in control["screen_final"]
        and control["chain_error_assistant"]
        and not control["chain_second_assistant"]
        and not control["chain_two_user_sends"]
    )
    verdict = "GREEN" if (treatment_green and control_green) else "RED"
    print("===== VERDICT (TUI) =====")
    print(f"EV41-TUI-TREATMENT: {'GREEN' if treatment_green else 'RED'}")
    print(f"EV41-TUI-CONTROL (no mechanism => no continuation): {'GREEN' if control_green else 'RED'}")
    print(f"EV41-TUI-VERDICT: {verdict}")
    return 0 if verdict == "GREEN" else 1


if __name__ == "__main__":
    sys.exit(main())
