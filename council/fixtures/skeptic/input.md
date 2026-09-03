Claim: "The links CLI trims whitespace from link text when printing."

You are the skeptic. Verify the claim the only way that counts — re-run
reality, never trust prose:

1. Inspect `test/probe.sh` — a deterministic probe for exactly this behavior.
   It runs `src/cli.ts` against `test/fixtures/probe-input.md` (a link whose
   text is ` spaced `, wrapped in spaces) and exits non-zero when the link
   text is printed untrimmed — i.e. when the claimed trimming behavior is
   ABSENT.
2. Run `bash test/probe.sh` yourself and read the exit code. (You may also
   run `bun src/cli.ts test/fixtures/probe-input.md` and inspect the output
   directly.)
3. Write your verdict to `skeptic-findings.md` at the repo root. The first
   line MUST be exactly `VERDICT: FALSE` or `VERDICT: TRUE`.
4. Below the verdict line, show the counter-example: the probe's non-zero
   exit and the untrimmed output line as evidence.
5. Do NOT modify `src/`, `test/`, or `test/probe.sh` — the probe is the
   evidence, not a fix.

Deliver the verdict file and a short closing summary of what you proved.