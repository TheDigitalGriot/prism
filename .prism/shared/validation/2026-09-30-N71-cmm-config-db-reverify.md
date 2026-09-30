# N71 re-verification — codebase-memory-mcp `_config.db`

**Date:** 2026-09-30, during the Code-Intel Three-Way exploration (Phase B).

## Original claim (N71, flagged-not-fixed)

> `list_projects` reports three stale project entries and misses six real ones, traced to a
> zero-byte `_config.db`. `index_status` and `search_graph` by project name both work correctly
> against the real indexes, so the defect is isolated to `list_projects`' own catalogue read, not
> the underlying index.

## Fresh measurement, this session

File size, direct:

```
$ ls -la ~/.cache/codebase-memory-mcp/_config.db
-rw-r--r-- 1 digit 197609 12288 Apr  8 08:04 /c/Users/digit/.cache/codebase-memory-mcp/_config.db
```

Not zero bytes. 12,288 bytes.

Live `list_projects` call, this session:

```json
{"projects":[
  {"name":"C-Users-digit-Developer-prism-plugin","root_path":"C:/Users/digit/Developer/prism-plugin","nodes":32748,"edges":48133},
  {"name":"C-Users-digit-GBFolio-gb-portfolio-strapi","root_path":"C:/Users/digit/GBFolio/gb-portfolio-strapi","nodes":544,"edges":516},
  {"name":"C-Users-digit-GriotApps-Prism-.prism-local-fts-test","root_path":"C:/Users/digit/GriotApps/Prism/.prism/local/fts-test","nodes":18,"edges":18},
  {"name":"C-Users-digit-GriotApps-Prism","root_path":"C:/Users/digit/GriotApps/Prism","nodes":95213,"edges":197540}
]}
```

`C-Users-digit-GriotApps-Prism` (the live repo this session is actually working in) is present,
correctly rooted, and its node/edge counts (95,213 / 197,540) match this session's own indexed
state as reported elsewhere (`gitnexus.json`, `list_graph_stats_tool`).

## Verdict

The specific symptom N71 named — three stale entries, six real ones missing, the live repo absent
or wrong — does **not** reproduce right now. Only one entry is genuinely stale
(`C-Users-digit-Developer-prism-plugin`, the pre-move ghost path this repo's own
`scripts/verify-code-intel.mjs` header comment already documents as a known three-month-old
address), and the repo actually in use is present and accurate.

**No code fix was applied.** The file's mtime (Apr 8) predates this session by months, so whatever
left it zero-byte either self-healed through ordinary `index_repository`/`index_status` traffic
across the intervening sessions, or the original observation caught a transient state (e.g.
mid-write, or just after a crash) that later writes overwrote cleanly. The root cause was never
identified in either the original finding or this re-verification.

**Disposition:** parked, not done. There is no current work to do against a symptom that is not
present, but nothing was engineered to guarantee it cannot recur — a durable fix (an integrity
check + auto-rebuild in `list_projects` itself, or in cmm's own startup path) is still a legitimate
future defensive improvement if N71's symptom is ever observed again.
