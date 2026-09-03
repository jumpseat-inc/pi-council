---
title: links
type: concept
summary: markdown link extraction in the links-cli consumer repo.
tags: [links-cli]
---

The links-cli CLI extracts markdown links with a single regex matching
`[text](url)` and `[text](url "title")` forms. Image syntax `![alt](src)` is
skipped via a negative lookbehind, so `extractLinks` never returns image
links. Output is one `text <url>` line per link by default.

## Related

- [[models]]
