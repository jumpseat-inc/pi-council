#!/usr/bin/env bash
# Smoke assertion helpers. Every function returns 0 on pass, non-zero on fail.

# assert_card_state <root> <card-id> <want> — card frontmatter state equals <want>.
assert_card_state() {
	local root="$1" id="$2" want="$3" got
	got="$(sed -n 's/^state: *//p' "$root/council/cards/$id.md" | head -1)"
	if [ "$got" != "$want" ]; then
		echo "assert_card_state: $id state is '$got', want '$want'" >&2
		return 1
	fi
}

# assert_board_column <root> <card-id> <want> — the board line for <card-id>
# sits under the ## <want> column (validate.py's column rules).
assert_board_column() {
	local root="$1" id="$2" want="$3"
	python3 - "$root/council/board.md" "$id" "$want" <<'PY'
import re, sys
text, cid, want = open(sys.argv[1]).read(), sys.argv[2], sys.argv[3]
cur = None
for line in text.splitlines():
    if line.startswith("## "):
        cur = line[3:].strip()
    elif re.match(rf"^- {re.escape(cid)} — ", line.strip()):
        if cur != want:
            print(f"assert_board_column: {cid} under {cur!r}, want {want!r}", file=sys.stderr)
            sys.exit(1)
        sys.exit(0)
print(f"assert_board_column: no board line for {cid}", file=sys.stderr)
sys.exit(1)
PY
}

# move_board_line <root> <card-id> <to-column> — move the board line
# `- <ID> — <Title>` under the ## <to-column> section (validate.py's rules).
move_board_line() {
	local root="$1" id="$2" col="$3"
	python3 - "$root/council/board.md" "$id" "$col" <<'PY'
import re, sys, pathlib
p, cid, col = sys.argv[1], sys.argv[2], sys.argv[3]
text = pathlib.Path(p).read_text()
lines = text.splitlines()
out = []
line = None
for ln in lines:
    if re.match(rf"^- {re.escape(cid)} — ", ln.strip()):
        line = ln
        continue
    out.append(ln)
if line is None:
    print(f"move_board_line: no line for {cid}", file=sys.stderr)
    sys.exit(1)
res = []
inserted = False
for ln in out:
    res.append(ln)
    if ln.startswith(f"## {col}"):
        res.append(line)
        inserted = True
if not inserted:
    print(f"move_board_line: no ## {col} section", file=sys.stderr)
    sys.exit(1)
pathlib.Path(p).write_text("\n".join(res) + "\n")
PY
}

# assert_json_links <json> — parse <json> and compare against the exact
# expected extraction of test/fixtures/sample.md in document order.
assert_json_links() {
	python3 - "$1" <<'PY'
import json, sys
got = json.loads(sys.argv[1])
want = [
    {"text": "pi homepage", "url": "https://pi.dev"},
    {"text": "council README", "url": "https://example.com/readme"},
    {"text": "installation notes", "url": "https://example.com/install"},
]
if got != want:
    print(f"assert_json_links: got {got!r}", file=sys.stderr)
    sys.exit(1)
PY
}

# assert_images_output <string> — exact expected --images output for sample.md.
assert_images_output() {
	local want="logo <https://example.com/logo.png>
banner <https://example.com/banner.png>"
	if [ "$1" != "$want" ]; then
		echo "assert_images_output: got '$1'" >&2
		return 1
	fi
}
