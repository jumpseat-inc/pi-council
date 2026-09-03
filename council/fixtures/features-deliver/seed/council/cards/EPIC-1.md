---
id: EPIC-1
title: Links CLI output modes
state: Backlog
owner: null
epic: null
goal: The links CLI gains three output improvements delivered as one epic.
---

## Intent

The consumer repo is a small markdown link-extraction CLI. This epic adds
machine-readable output (`--json`), image-skipping control (`--skip-images`),
and a summary `count` subcommand, delivered unattended by the council-runner
under the recorded delivery rulings.

## Acceptance

- Every child card runs to Done through the full council loop, unattended.
- Per-child local gates re-run green before merge (see DELIVERY-RULINGS.md).
