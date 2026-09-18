# Test Suite Budget

FLLWUP-48. The default `bun test` suite's measured wall-clock envelope, the
live-arm files that carry most of it, and the rules that keep the number
honest. **Document-only** — the live pty/`-p` falsifier arms are not gated
(PO ruling 3): they run within the envelope, and gating reopens only if a
re-measurement ever exceeds the drift threshold below.

## Measured envelope

- **Total wall clock:** ≈**101.2s** (935 tests across 81 files; 933 pass,
  2 skip, 0 fail).
- **Provenance:**
  - Machine: Linux 6.12.24-Unraid x86_64 (container)
  - Date: 2026-09-18 18:40 UTC
  - SHA: `ad96c4f` (FLLWUP-56 implementation commit — the seat-child live arm's
    own accounting, measured by the implementing pass)
  - Exact command (the `bun install` **first** — a tree whose `node_modules`
    predates `@modelcontextprotocol/sdk` is red until installed):
    ```bash
    bun install
    time bun test
    ```
- The figure is **descriptive, not normative**: one machine's measurement,
  with provenance so the next re-measurement can be compared. 180s is **the
  drift threshold, not the budget** (below).

## Per-file table (live arms)

The live spawning arm files, measured individually (same machine, same pass,
same provenance as above; command in the next section):

| File | Arm count | Measured wall |
|---|---|---|
| `test/ev41-retry-e2e.test.ts` | 5 | **38.0s** |
| `test/ev40-live-gates.test.ts` | 5 | **16.6s** |
| `test/ev40-headless.test.ts` | 3 | **12.9s** |
| `test/ev43-reachability.test.ts` | 2 | **4.9s** |
| `test/ev41-seat-child-live.test.ts` | 2 | **5.9s** |
| **Live-arm share** | 17 | **78.3s of 101.2s ≈ 77%** |

The other ~75 files sum to ≈23s. The suite is serial/additive
(`package.json`'s `test` script is bare `bun test` — no `--parallel`), so
per-file times sum to the suite total within run-to-run tolerance.

## Ceiling vs budget — they are not the same number

- **Per-arm enforced ceilings** (eleven sites: bun third positional args plus
  the `runHarnessArm`/`spawnSync` `timeoutMs` in
  `test/faux-provider/harness.ts`, default 120s) are **emergency bounds**,
  not budgets — e.g. the TUI pty arm's ceiling is `300_000`
  (`test/ev41-retry-e2e.test.ts:362`) against a ~32s actual. A tripped
  ceiling fails the test; a budget merely describes expected cost.
- **There is no suite-level ceiling** — and none is added (PO ruling 2: no
  `gates.yml` `timeout-minutes`; a budget-keyed step timeout would pre-empt
  the TUI arm's own 300s ceiling and mask attribution).
- **180s is the drift threshold, not the budget.** It is the maintained
  invariant the suite is tested against over time. Any re-measurement above
  180s reopens FLLWUP-48 or opens a new card — and that is the branch under
  which gating the live arms behind an opt-in reopens.

## Re-measure command

```bash
bun install
time bun test
```

Per-arm loop:

```bash
for f in ev41-retry-e2e ev40-live-gates ev40-headless ev43-reachability ev41-seat-child-live; do
  time bun test test/$f.test.ts
done
```

## Standing maintenance rules

1. **Any new live arm must state its expected wall clock and its ceiling in
   its test header.**
2. **The README/wiki figures are re-measured** when an arm changes, or when
   the drift threshold trips.
3. **`bun install` first** on any tree whose `node_modules` predates
   `@modelcontextprotocol/sdk` (it is in `package.json` but was missing from
   long-lived ancestor installs — the suite is red until installed).
4. **Budget ≠ ceiling:** the docs above keep the two numbers distinct; a new
   arm's ceiling is an emergency bound, never written into the envelope.
