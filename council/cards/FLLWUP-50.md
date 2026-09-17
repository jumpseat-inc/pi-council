---
id: FLLWUP-50
title: Supported refresh path for packaged council tooling in initialized consumer repos
state: Backlog
owner: null
epic: EPIC-9
goal: A consumer repo initialized against an earlier pi-council install can bring its packaged council tooling (council/validate.py, _template.md, the procedures, the docstrings) up to the currently installed package's version through a documented, supported path, without overwriting consumer-edited board, cards, or wiki.
---

## Intent

`scaffoldInto` is non-clobbering (AGENTS.md #6) and `council/validate.py` has no
override-resolution path (unlike seats, procedures, and fixtures). A consumer
repo initialized before FLLWUP-43 therefore keeps the old colon-space FAIL, the
`_template.md` warning sentence, the docstring, the `board-create-card.md`
paragraph, and the `features-new.md` bars indefinitely — unbounded, silent
skew. The steward ESC-3 disposition (recorded on `council/cards/FLLWUP-43.md`)
rules unbounded skew is not acceptable as a permanent state and cards this as
the mitigation; an override path alone is insufficient — this card must deliver
an adoptable path. Acceptance shape is steward-authored (the `goal` above); the
mechanism is this card's design.