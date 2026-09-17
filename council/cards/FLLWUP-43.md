---
id: FLLWUP-43
title: Make the goal field a lossless oracle for the judge
state: Backlog
owner: null
epic: EPIC-9
goal: A card goal can name an exact literal that contains a colon-space sequence without truncating, and the judge reads the same string the classification test asserts.
---

## Intent

`council/validate.py`'s colon-space rule and `_template.md`'s warning forbid
`: ` in a goal, so EV-37's goal spelled pi's emitted literal without its
colon and the judge — whose only input is the goal — passed a branch that
never matched pi's real message. The rule worked (it FAILs); the authoring
response made the goal a lossy oracle. Named by the steward closure ruling as
owed before the next autonomous run.
