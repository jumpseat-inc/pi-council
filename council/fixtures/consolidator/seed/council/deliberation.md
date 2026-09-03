# Deliberation fragments (EV-18-style)

Two seat positions on the question "where should a fixture's seed live?" —
the fragments below are the only material the consolidator may use.

## Principal (job-7.9), verbatim excerpt

"Fixtures are consumer data that ships with a default, so the packaged
default lives at council/fixtures/<task>/ and the consumer's own copy wins
because it sits first in resolution. Shadowing is simply first-hit."

## Owner (job-7.10), verbatim excerpt

"Seeding 16 full trees into every consumer repo pins them to install-time
versions forever — the scaffold never overwrites. Packaged resolution gives
fresh-checkout runnability with zero setup; the consumer adds via the
override dir instead."

## Open dispute

The two positions agree on the resolution ORDER (override first, packaged
second) but disagree on whether the override dir is scaffold-seeded.
