# Stage 01: Extraction

Pull structured teaching content from unstructured source material.

## Inputs

| Source | File/Location | Section/Scope | Why |
|--------|--------------|---------------|-----|
| User | (uploaded files or pasted text) | Full content | Raw PDFs, papers, notes, scripts to extract from |
| Shared | `../../shared/producer-identity.md` | Full file | Producer name, typical source types |
| Template | `../../shared/course-meta.md` | Full file | Template for collecting course details |
| Reference | `references/extraction-rules.md` | Full file | How to chunk, tag, and organize content |

## Process

1. If this is the entry stage for this course run, collect course metadata from the user: course name, description, target audience, session count, session duration. Write it to `output/[course-slug]-meta.md` using the template from `shared/course-meta.md`.
2. Read the user's source material
3. Identify key concepts, definitions, facts, examples, and teaching points
4. Tag each chunk with topic area and complexity level (intro, intermediate, advanced)
5. Group chunks by topic affinity
6. Add source citations where the material came from
7. **[Checkpoint]** -- Present the extracted content to the user for review. Ask: Is anything missing? Are tags accurate? Any content to remove?
8. Run the audit checks below. If any fail, revise before saving.
9. Save the structured extraction document

## Checkpoints

| After Step | Agent Presents | Human Decides |
|------------|---------------|---------------|
| 6 | Complete extraction with tagged, grouped chunks and source citations | Whether content is accurate, complete, and correctly categorized |

## Audit

| Check | Pass Condition |
|-------|---------------|
| Content coverage | Every major topic from the source material has at least one chunk |
| Tag accuracy | Each chunk's complexity tag (intro/intermediate/advanced) matches its content |
| Source citations | Every chunk traces back to a specific source document or section |
| Chunk granularity | No chunk covers more than one distinct concept |

## Outputs

| Artifact | Location | Format |
|----------|----------|--------|
| Course metadata | `output/[course-slug]-meta.md` | Course name, audience, session count, duration |
| Extracted content | `output/[course-slug]-extraction.md` | Markdown with tagged, grouped content chunks |
