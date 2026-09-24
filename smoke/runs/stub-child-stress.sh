#!/usr/bin/env bash
# FLLWUP-121 — stress harness for test/stub-child.test.ts's one observed
# judge-run failure (head 4515efe, 1253 pass / 1 fail in this file; 5x solo
# reruns + one full-suite rerun green). Runs the file repeatedly, solo and in
# N-way parallel batches (the judge's full-suite run has the whole suite in
# parallel around it; parallel batches approximate that scheduling pressure).
# Every failing batch leaves its raw runner output under smoke/runs/ (dot-dir
# not needed — smoke/runs/ is consumed only by this harness; bun test never
# discovers it because it contains no *.test.ts files).
set -u
cd "$(git rev-parse --show-toplevel 2>/dev/null || echo .)" || exit 2
SOLO_ROUNDS="${1:-40}"
PAR_BATCHES="${2:-10}"
PAR_WIDE="${3:-8}"
FAILS=0
echo "== solo rounds: $SOLO_ROUNDS =="
for i in $(seq 1 "$SOLO_ROUNDS"); do
  out="$(timeout 120 bun test test/stub-child.test.ts 2>&1)"
  if [ $? -ne 0 ] || ! echo "$out" | tail -4 | grep -q " 0 fail"; then
    FAILS=$((FAILS+1))
    echo "$out" > "smoke/runs/stub-child-solo-fail-$i.log"
    echo "ROUND $i: FAIL (saved smoke/runs/stub-child-solo-fail-$i.log)"
  fi
done
echo "solo: $SOLO_ROUNDS rounds, $FAILS failures"
echo "== parallel batches: $PAR_BATCHES x $PAR_WIDE concurrent =="
PFAILS=0
for b in $(seq 1 "$PAR_BATCHES"); do
  for w in $(seq 1 "$PAR_WIDE"); do
    ( timeout 120 bun test test/stub-child.test.ts > "smoke/runs/.par-$b-$w.out" 2>&1; echo $? > "smoke/runs/.par-$b-$w.rc" ) &
  done
  wait
  for w in $(seq 1 "$PAR_WIDE"); do
    rc="$(cat "smoke/runs/.par-$b-$w.rc")"
    if [ "$rc" -ne 0 ]; then
      PFAILS=$((PFAILS+1))
      mv "smoke/runs/.par-$b-$w.out" "smoke/runs/stub-child-par-fail-$b-$w.log"
      echo "BATCH $b worker $w: FAIL (saved)"
    fi
    rm -f "smoke/runs/.par-$b-$w.rc"
  done
  rm -f "smoke/runs/.par-"*.out
done
echo "parallel: $((PAR_BATCHES*PAR_WIDE)) runs, $PFAILS failures"
echo "== total: $((SOLO_ROUNDS + PAR_BATCHES*PAR_WIDE)) runs, $((FAILS+PFAILS)) failures =="
[ $((FAILS+PFAILS)) -eq 0 ]
