# toon vs json — an honest benchmark

L7 of the Code-Intel Three-Way's Phase C (`.prism/shared/handoffs/2026-09-30T00-23-48Z_code-intel-three-way-exploration.md`).
`search_graph`/`trace_path`'s own tool schema claims `format=toon` gives "~60% fewer
tokens" than `format=json`, with nothing in this repo or cmm's own docs backing that
number — unlike gortex's GCX1 wire format, which ships `bench/wire-format/` (20
fixtures, tiktoken, a checked-in scorecard, -27.4% median, reproducible via `make`).
This is that same harness, aimed at our own claim instead of theirs.

## Run it

```bash
pip install tiktoken
python score.py
```

Prints the scorecard and writes `scorecard.md` (checked in).

## What it found (2026-09-30, 3 real fixture pairs)

**Measured savings fall well short of the claim.** On the two like-for-like cases,
toon used 33.0% and 18.1% fewer tokens than json — median **-25.5%**, not ~60%. The
third fixture (`03_search_fields`) is excluded from that median and reported
separately: it turned out `format=json`'s "legacy verbose objects" mode ignores the
`fields` filter entirely and dumps every computed property per node (complexity,
loop metrics, a structural fingerprint hash, a serialized AST token stream), while
`format=toon` honors `fields` and emits only what was asked for — so that pair's
-80.9% measures a filter bug's side effect, not wire-format efficiency on an equal
payload. Flagging it rather than folding it into an inflated headline is the entire
point of doing this measurement instead of reciting the claim.

## Fixtures

`fixtures/<name>.toon.txt` / `fixtures/<name>.json.txt` — raw, unedited tool
responses captured live against this repo's own codebase-memory-mcp index this
session. Not synthetic (gortex's own maturity audit flagged its GCX1 fixtures as
"self-authored synthetic tool-response shapes, not captured real-world MCP
traffic" as a real limitation on its own -27.4% number — this harness starts from
real traffic instead).

## Honest gaps (say what would falsify this, not just what it found)

- **Sample size is 3, not 20.** Extend by capturing more real `toon`/`json` pairs
  into `fixtures/` and re-running — never hand-author a fixture.
- **Round-trip integrity is not machine-checked.** gortex's harness parses both
  formats back to a canonical structure and diffs them (20/20 confirmed). This one
  only asserts the result/row counts match by reading the two files side by side.
  A real follow-up: write that parser and diff for toon's own grammar.
- **Only `search_graph` and `trace_path` were sampled.** cmm exposes 14 tools total;
  whether `format` exists elsewhere, and whether the ~60% claim was ever meant to
  generalize beyond these two, was not checked.
- **One machine, one repo, one session.** Same single-corpus caveat gortex's own
  token-efficiency claim carries (`BENCHMARK.md`, 8 queries against its own repo) —
  noted there as a real limitation, not waived here because it is inconvenient.
