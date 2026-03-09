# Prism Iterate Eval Transcript

**Date**: 2026-03-08
**Skill**: prism-iterate (v2.5.2)
**Task**: "Iterate on the plan. Phase 7 needs a new sub-phase 7.5 to handle database migration that was discovered during implementation. The new phase requires understanding the existing ORM setup."

---

## Workflow Execution

### Step 1: Assess Current State

**Plan identified**: `.prism/shared/plans/2026-03-07-neo4j-eval-dashboard.md`
- This is the active plan with a Phase 7 (Anomaly Detection) that involves Neo4j database work.
- **Status**: All 8 phases are "Not started" per the Progress Log.
- **No validation report exists** (`.prism/shared/validation/` is empty).
- **User feedback**: Phase 7 needs a new sub-phase 7.5 for database migration, discovered during implementation. Requires understanding existing ORM setup.

**Key observation**: The plan uses Neo4j (a graph database) with a raw `neo4j-driver` — there is no ORM in the project. Phase 1 defines `Neo4jService.ts` with raw Cypher queries and `initSchema()` for indexes/constraints. The import script (`neo4j-import.py`) uses `MERGE` statements directly. This is relevant because the user asks about "existing ORM setup" — the answer is that there is no ORM; the project uses raw Cypher via `neo4j-driver`.

**Research conducted**:
- Searched codebase for ORM-related patterns (`typeorm`, `prisma`, `knex`, `sequelize`, `drizzle`, `migration`) — no ORM found in any `.ts`, `.js`, or `.py` files.
- Searched for `Neo4jService` and `initSchema` — no implementation exists yet (plan not started).
- The schema initialization is handled by `Neo4jService.initSchema()` (Phase 1), which creates indexes and constraints on first connect — but there is no versioned migration system.

### Step 2: Identify Changes Needed

Following the skill's template:

```markdown
## Iteration Needed

**Trigger**: Implementation of Phase 7 (Anomaly Detection) revealed that the Neo4j schema
needs migration support. Phase 1's `initSchema()` creates the initial schema but has no
mechanism for evolving it (adding new node types, properties, or indexes) between versions.
Phase 7 adds anomaly detection queries that may need new indexes or properties on existing
nodes (e.g., `anomaly_score` on Trial nodes, composite indexes for percentile queries).
Without a migration system, schema changes would require manual intervention or data loss
(drop + recreate).

**Current State**:
- Phase 7 (Anomaly Detection) in progress
- Phase 7 adds new queries against existing nodes but may need schema evolution

**Changes Required**:
1. Add Phase 7.5: "Neo4j Schema Migration System" between Phase 7 and Phase 8
2. Update Phase 1's `Neo4jService.ts` description to note that `initSchema()` handles
   v1 only and migrations handle subsequent versions
3. Update risk table to note that schema migration is now addressed

**Impact**:
- Phases affected: Phase 1 (minor note), new Phase 7.5, Phase 8 (renumber not needed,
  7.5 is a sub-phase)
- Success criteria changes: Add automated verification for migration idempotency
```

### Step 3: Update Plan Document (Simulated)

**Note**: Per eval instructions, no actual file modifications are made. The following documents the exact changes that would be applied.

#### Change 1: Add Iteration Log section before "Session Notes"

The following would be appended to the plan before the "Session Notes" section:

```markdown
## Iteration Log

### 2026-03-08 - Iteration 1
**Reason**: Implementation of Phase 7 revealed that the Neo4j schema needs a versioned
migration system. Phase 1's `initSchema()` creates indexes and constraints but has no
mechanism for evolving the schema across versions. As new phases add node properties
(e.g., anomaly scores) and new indexes (e.g., composite indexes for percentile queries),
a migration system is needed to avoid manual intervention or data loss.

**Research findings**: No ORM exists in the project. The codebase uses raw `neo4j-driver`
with direct Cypher queries. Schema is managed by `Neo4jService.initSchema()` which runs
CREATE INDEX/CONSTRAINT statements. There is no migration versioning.

**Changes**:
- Added Phase 7.5: Neo4j Schema Migration System
- Updated Phase 1 description: noted that `initSchema()` handles v1 schema only
- Added automated success criterion for migration idempotency
- Updated Risks table: "Graph schema evolution" now references Phase 7.5 as mitigation

**Approved by**: User (pending)
```

#### Change 2: Add Phase 7.5 after Phase 7's checkpoint

The following new phase would be inserted between Phase 7 and Phase 8:

```markdown
### Phase 7.5: Neo4j Schema Migration System

**Goal**: Add a versioned schema migration system for Neo4j so that schema changes
(new indexes, properties, constraints, node types) can be applied incrementally without
data loss or manual intervention.

**Context**: Discovered during Phase 7 implementation that `initSchema()` from Phase 1
only handles the initial v1 schema. As new phases add properties and indexes, a migration
system is needed. No ORM exists in this project — the codebase uses raw `neo4j-driver`
with Cypher queries, so migrations must be implemented as versioned Cypher scripts.

**Files to create**:
| File | Purpose |
|------|---------|
| `prism-eval/src/services/Neo4jMigrationRunner.ts` | Migration runner that tracks applied versions and runs pending migrations |
| `prism-eval/src/migrations/001-initial-schema.ts` | Initial schema (extracted from `initSchema()`) — indexes and constraints |
| `prism-eval/src/migrations/002-anomaly-indexes.ts` | Composite indexes for anomaly detection percentile queries |

**Files to modify**:
| File | Change |
|------|--------|
| `prism-eval/src/services/Neo4jService.ts` | Replace `initSchema()` internals with call to `Neo4jMigrationRunner.runPending()` |

**Steps**:
1. [ ] Create `Neo4jMigrationRunner.ts` with:
   - A `(:SchemaMigration {version: int, name: string, appliedAt: datetime})` tracking node
   - `getAppliedVersions()` — queries for all applied migration versions
   - `runPending(migrations[])` — runs unapplied migrations in order, creates tracking nodes
   - Each migration is `{version: number, name: string, up: (session) => Promise<void>}`
   - Wraps each migration in a transaction; rolls back on failure
   - Idempotent: re-running skips already-applied migrations
2. [ ] Create `001-initial-schema.ts` — extract existing `initSchema()` content:
   - CREATE INDEX for Task.id, Trial.timestamp, EvalSuite.version
   - CREATE CONSTRAINT for unique Task.id, unique EvalSuite.version
3. [ ] Create `002-anomaly-indexes.ts` — add indexes needed by Phase 7 anomaly queries:
   - CREATE INDEX for Trial.token_count (used in percentile calculations)
   - CREATE INDEX for Trial.latency (used in outlier detection)
   - Add `anomaly_flagged: boolean` property convention (not enforced, just indexed)
4. [ ] Update `Neo4jService.initSchema()` to delegate to `Neo4jMigrationRunner.runPending()`
   passing the ordered list of migration modules
5. [ ] Add migration documentation to `docs/neo4j-setup.md` explaining how to add new
   migrations (create numbered file, add to migration list)

**Verification**:
```bash
cd prism-eval && npm run build  # Should succeed with new migration files
# Start Neo4j, run app — migrations apply automatically on connect
# Stop app, restart — migrations skip (already applied)
# Verify: MATCH (m:SchemaMigration) RETURN m ORDER BY m.version
```

**Checkpoint**: Phase 7.5 complete
```

#### Change 3: Update Phase 1 description

In Phase 1, step 3, the `initSchema()` bullet would be annotated:

```markdown
- Schema initialization: `initSchema()` creates indexes and constraints on first connect
  *(Note: Iteration 1 — this handles v1 schema only; Phase 7.5 adds versioned migrations)*
```

#### Change 4: Update Risks table

The existing risk row:
```
| Graph schema evolution as eval format changes | Medium | Medium | Version the schema in `initSchema()`; add migration scripts |
```
Would be updated to:
```
| Graph schema evolution as eval format changes | Medium | Medium | ~~Version the schema in `initSchema()`; add migration scripts~~ Addressed by Phase 7.5: Neo4j Schema Migration System with versioned Cypher scripts and tracking nodes |
```

#### Change 5: Update Success Criteria

Add to Automated Verification:
```markdown
- [ ] Neo4j migrations are idempotent — running `initSchema()` twice produces no errors and no duplicate SchemaMigration nodes
- [ ] New migrations apply automatically on app startup when Neo4j is available
```

#### Change 6: Update Progress Log

Add row after Phase 7:
```markdown
| Phase 7.5: Neo4j schema migration | Not started | | | Added in Iteration 1 (2026-03-08) |
```

### Step 4: Resume Implementation (Simulated)

Per the skill workflow, implementation would resume from Phase 7.5 using `/prism-implement`. Since this is a simulation, no implementation is performed. The implementation would:

1. Create `Neo4jMigrationRunner.ts` with version tracking via `(:SchemaMigration)` nodes
2. Extract `initSchema()` content into `001-initial-schema.ts`
3. Create `002-anomaly-indexes.ts` for Phase 7's anomaly detection queries
4. Update `Neo4jService.initSchema()` to delegate to the migration runner
5. Proceed to Phase 8 after Phase 7.5 verification passes

### Step 5: Re-validate if Needed

Significant structural change (new migration system affects Phase 1's `initSchema()` contract). Re-validation via `/prism-validate` would be recommended after Phase 7.5 implementation to verify:
- Existing Phase 1 behavior is preserved (schema still initializes correctly)
- Migration idempotency works
- Phase 7 anomaly queries still function with the new index structure

---

## Summary

**What was done**:
1. Assessed current plan state — identified `.prism/shared/plans/2026-03-07-neo4j-eval-dashboard.md` as the active plan
2. Researched existing ORM setup — found none; project uses raw `neo4j-driver` with Cypher queries
3. Identified the gap: `initSchema()` in Phase 1 has no versioned migration support
4. Drafted Phase 7.5: "Neo4j Schema Migration System" with 3 new files, 1 modified file, and 5 implementation steps
5. Documented all plan changes (6 change sets) following the skill's "preserve history" and "annotate changes" rules
6. Flagged that re-validation is recommended after implementation

**Key findings**:
- No ORM exists in this project — the "existing ORM setup" referenced in the task does not exist. The project uses raw Neo4j driver with direct Cypher queries.
- The migration system needs to be built from scratch as versioned Cypher scripts with `(:SchemaMigration)` tracking nodes.
- Phase 1's `initSchema()` is the only schema management mechanism and has no versioning.

**Questions that would be asked (interactive planning)**:
1. "There is no ORM in this project — it uses raw neo4j-driver. Should Phase 7.5 introduce an ORM, or should we build a lightweight migration runner with versioned Cypher scripts?" (Recommended: lightweight runner, consistent with existing patterns)
2. "Should existing Phase 1 `initSchema()` content be extracted into migration 001, or should it remain as-is with migrations starting at 002?" (Recommended: extract to 001 for consistency)
3. "Do you approve these plan changes before I proceed with implementation?"

**Approval status**: Pending user confirmation (per skill rule #3: "Get approval — User confirms plan changes")
