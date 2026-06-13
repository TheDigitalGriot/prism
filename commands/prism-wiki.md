# Prism Wiki — Graph → Architecture Wiki

Generate a living architecture wiki for the codebase **from the code knowledge graph**
(codebase-memory-mcp), not from hand-reading files. This is the code-intel layer's
"graph → generated docs" capability: structure is read from the indexed graph, so the wiki
stays grounded in what the code actually is.

## When to use

- Onboarding a new surface/contributor who needs a structural map fast.
- After a large feature lands (e.g. a new package), to regenerate the architecture overview.
- To produce a CLAUDE.md-injectable "live stats" block.

## Prerequisites

- `codebase-memory-mcp` available (graph tools). If a project isn't indexed, run
  `index_repository` first.

## Workflow

### 1. Orient on the graph

```
list_projects()                       # confirm the project + node/edge counts
get_graph_schema(project=<P>)         # node labels + edge types available
get_architecture(project=<P>)         # packages, services, label/edge histogram
```

If `list_projects()` does not include this repo, run `index_repository` and wait for it.

### 2. Enumerate the structural units

Pick the unit of the wiki — usually **package/folder**. For each:

```
search_graph(project=<P>, label="Class",     file_pattern="<pkg>/**", limit=0)
search_graph(project=<P>, label="Interface", file_pattern="<pkg>/**", limit=0)
search_graph(project=<P>, label="Function",  file_pattern="<pkg>/**", min_degree=2)   # the load-bearing ones
search_graph(project=<P>, label="Route",     file_pattern="<pkg>/**")                  # HTTP/RPC surface
```

Prefer `query=` (BM25) for natural-language discovery, `name_pattern=` for exact regex,
`semantic_query=[...]` to bridge vocabulary. Use `max_degree=0, exclude_entry_points=true`
to surface dead code worth noting.

### 3. Blast-radius the key symbols

For each high-degree function/class the wiki highlights:

```
trace_call_path(project=<P>, function_name="<name>", direction="inbound", depth=3)
```

Record direct + transitive caller counts so the wiki conveys *risk*, not just presence.

### 4. Generate the wiki

Write to `.prism/shared/docs/wiki/`:

- `index.md` — architecture overview: the `get_architecture` histogram, the package map,
  the dominant edge types (e.g. CALLS, IMPORTS), and a one-line role per package.
- `<package>.md` per major package — its classes/interfaces (with one-line purpose),
  its public routes, and its load-bearing functions with blast-radius notes.

Each page header records provenance: the project name, node/edge counts, and the date
(generation is graph-sourced, so note the index may lag uncommitted changes — run
`detect_changes` to check).

### 5. (Optional) Inject live stats into CLAUDE.md

Emit a compact block (node/edge counts, package count, route count, top-called functions)
suitable for a `<!-- prism-wiki:stats -->` fenced region in CLAUDE.md, so agents get the
live structural snapshot on every session.

## Rules

1. **Graph first** — read structure from the graph, not by globbing/reading files. Fall back to
   file reads only for prose (comments/docstrings) the graph doesn't carry.
2. **Cite counts** — every "load-bearing" claim is backed by a degree/caller count from the graph.
3. **Provenance** — every generated page records the project, counts, and date, and notes that the
   index may lag uncommitted work.
4. **Idempotent** — regenerating overwrites the wiki pages cleanly; don't append duplicates.
5. **No editorializing** — describe the structure the graph shows; this is a map, not a review.

## Output

`.prism/shared/docs/wiki/index.md` + one page per major package. Optionally a CLAUDE.md
stats block.
