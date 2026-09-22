# FLLWUP-105 — Name the remediation route for a stale copied usages skill — settled design

Status: settled by deliberation (steps 2–6) and the product-owner ruling of
2026-09-24 (Q1–Q3, appended verbatim to `council/cards/FLLWUP-105.md`). This
spec records the settled design; it does not reopen anything the Council
closed or the ruling fixed. The owner reads this file (plus the card's
`Intent`) without memory of the deliberation and reaches exactly one design.

## What ships

Three artifacts on one feature branch:

1. **The remediation sentence** in `council/procedures/usages.md`'s
   `**Report.**` section, **exactly this text** (PO ruling Q1, verbatim):

   > If the tool's stderr contains the literal `usages: could not write cache:`, surface that line to the user verbatim (no prefix, no rewording); explain the fix ships in a newer package version but does not reach the skill already copied into this repo, so — after updating the pi-council package — run `rm -rf .pi/skills/usages/` and then `/council-init` to recopy the fixed tool; the report itself still ships.

   Placement: in the `**Report.**` section, after the existing paragraph. It
   is conditional (keyed to the exact stderr literal), it names the update
   step before the two commands (three-step ordering is load-bearing — a
   delete-recopy from a stale installed package loops the bug back), the
   commands are copy-pasteable in execution order, and the close is
   non-fatal ("the report itself still ships"). The procedure file speaks
   literal `.pi/` paths — no `$CONFIG_DIR_NAME` or `@CONFIG_DIR@` token
   anywhere in it (`renderProcedure` substitutes only `$COUNCIL_PROCEDURES`
   and `$ARGUMENTS`; an unrendered config-dir token would ship as dead
   prose).

2. **The mechanical pin**, `test/usages-procedure.test.ts` (new file; never
   `council/validate.py` per the docs-card rule; not an edit to
   `test/scaffold.test.ts`):

   - Reads `path.join(PKG_ROOT, "council", "procedures", "usages.md")`,
     with `PKG_ROOT` imported from `extensions/seats.ts` (hard convention 4
     — never construct the package path by hand). Asserts the file text
     **contains** the three literals: `usages: could not write cache:`,
     `skills/usages/`, `/council-init`.
   - Containment only. Exactly these three assertions — **no 4th literal, no
     negative assertions, no section anchor, no ordering assertions, no
     full-sentence match**. Measured basis (skeptic battery): a repo-wide
     scan is satisfied by `usages.py`/`index.ts`/`scaffold.ts` (false-green);
     a 4th lexical literal reds on a claim-preserving rewording that keeps
     all four bullet-1 elements; both command literals already live in the
     file's `**Run.**` section, so the pin catches only wholesale-removal
     and trigger-reword classes — the command-drop / update-step-drop gap is
     the measured boundary the ruling routes to a follow-up card (Q2).
   - T-USK1 in `test/scaffold.test.ts` stays green and unedited.

3. **The `vault/raw/` note**,
   `vault/raw/2026-09-24-fllwup-105-stale-usages-skill-recopy.md`, recording
   that an already-initialized consumer reaches the fixed tool only via
   delete-and-recopy; names the package-update-first precondition (the
   repo's own `.pi/skills/usages/scripts/usages.py` is the pre-BUG-2 tool —
   delete-recopy without the update loops the bug back); names the ingest
   correction target: `vault/wiki/non-clobbering-scaffold.md:72-76` says
   "refreshing means delete-and-re-run-`/council-init`" — directionally
   correct but incomplete (re-run alone is a no-op per T-USK1; the re-copied
   tool comes from the installed package, so it must be updated first).
   `vault/wiki/usages-report.md` needs no correction. (`vault/` is otherwise
   untouched — the note goes in `vault/raw/`, hand-writing wiki pages is not
   this card's act.)

## Boundaries (settled; do not widen)

- No `TOOLING_FILES` widening; `/council-update` does not take on refresh of
  `/council-init`-copied payloads outside `council/scaffold/` (R3).
- The sentence authorizes surfacing **one exact literal** verbatim; it does
  not license framing around any other stderr line (FLLWUP-106 boundary).
- Non-fatal: the remediation must not read as a second STOP next to the
  preflight hard gate — the report still ships.
- The `**Report.**` placement is a prose-review item, not a mechanical pin.

## Gate set

`bunx tsc --noEmit`, `bun test` (full suite), `python3 council/validate.py`
— via the `gates` workflow on the PR; owner also runs `council/preflight.sh`
locally and gets them green in full before reporting. Pin gate demonstrably
reds: the skeptic matrix observed red arms (sentence removed → 3 fail;
reworded trigger → fail). New test file runs under the default `bun test`
glob.
