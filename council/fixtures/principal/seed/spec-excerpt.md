# Spec excerpt: cross-seam contract (EV-16 §4, verbatim)

"The override is a third layer above .council.json, applied only on the eval
dispatch path — never a mutate-then-restore of .council.json or seat
frontmatter. The canonical carrier is one env-carried key, COUNCIL_EVAL_MODEL,
carrying provider/id or provider/id:thinking (the same qualified-model +
optional :thinking-suffix grammar that .council.json and frontmatter share —
one parser, qualifiedOrThrow-style, not a second grammar)."

"Precedence, exactly: per-dispatch model/thinking param on council_dispatch >
COUNCIL_EVAL_MODEL env > .council.json override > seat frontmatter."
