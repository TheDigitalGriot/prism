# Stage 02: Curriculum

Organize extracted content into a structured course plan with modules, sessions, and learning objectives.

## Inputs

| Source | File/Location | Section/Scope | Why |
|--------|--------------|---------------|-----|
| Previous stage | `../01-extraction/output/[course-slug]-extraction.md` | Full file | Content to organize into sessions |
| Previous stage | `../01-extraction/output/[course-slug]-meta.md` | Full file | Course name, audience, session count target |
| Shared | `../../shared/producer-identity.md` | Full file | Producer name |
| Template | `../../shared/course-meta.md` | Full file | Template for collecting course details (if entering here) |
| Reference | `references/curriculum-format.md` | Full file | What a well-formed curriculum looks like |

## Process

1. If this is the entry stage (no Stage 01 output exists), collect course metadata from the user and write it to `output/[course-slug]-meta.md`. Otherwise, copy the metadata forward from Stage 01 output.
2. Read the extracted content (or user-provided notes if entering at Stage 02)
3. Group content chunks into logical modules (by topic clusters)
4. Order modules by pedagogical progression -- foundations before applications
5. Break each module into individual sessions (target the session count from the metadata)
6. Write 2-3 learning objectives per session (what the learner will be able to do after)
7. Allocate specific content chunks to each session
8. Estimate time per session based on content density
9. **[Checkpoint]** -- Present the curriculum structure to the user. Ask: Does the progression make sense? Any sessions to add, remove, or reorder?
10. Run the audit checks below. If any fail, revise before saving.
11. Save the curriculum document

## Checkpoints

| After Step | Agent Presents | Human Decides |
|------------|---------------|---------------|
| 8 | Full curriculum: modules, sessions, objectives, content allocation, time estimates | Whether the structure, progression, and session balance are right |

## Audit

| Check | Pass Condition |
|-------|---------------|
| Pedagogical order | Foundational concepts appear before concepts that depend on them |
| Session balance | No session has fewer than 3 or more than 7 content chunks allocated |
| Objective clarity | Every learning objective starts with an action verb and describes a measurable outcome |
| Content coverage | Every extracted chunk is allocated to at least one session |

## Outputs

| Artifact | Location | Format |
|----------|----------|--------|
| Course metadata | `output/[course-slug]-meta.md` | Carried forward or newly collected |
| Curriculum | `output/[course-slug]-curriculum.md` | Markdown: modules, sessions, objectives, content allocation |
