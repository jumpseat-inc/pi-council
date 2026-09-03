#!/usr/bin/env bash
# Skeptic probe for the planted-defect claim. The claim under test: "the
# links CLI trims whitespace from link text when printing."
#
# A run against probe-input.md must print the link text verbatim, spaces
# included -- so a line starting with a space-ridden text proves the claim
# FALSE. The probe exits 1 exactly when the claimed behavior is absent (the
# defect is present), which is the deterministic counter-example the skeptic
# needs.
set -euo pipefail

out="$(bun src/cli.ts test/fixtures/probe-input.md)"
if printf '%s\n' "$out" | grep -q '^ spaced  <'; then
  echo "BUG PRESENT: link text printed untrimmed (' spaced ' verbatim)"
  exit 1
fi
echo "claim holds"
exit 0
