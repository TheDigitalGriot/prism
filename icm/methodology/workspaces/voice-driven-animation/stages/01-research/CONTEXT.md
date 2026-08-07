# Stage 01: Research

Take a topic and produce a verified content brief. The brief feeds Stage 02 (script writing). The brief is a plan; the cited sources are the authority.

## Inputs

| Source | File/Location | Section/Scope | Why |
|--------|--------------|---------------|-----|
| User | (conversation) | Topic and any source pointers | The starting point |
| Brand vault | `../../brand-vault/identity.md` | "Audience" and "Content Mission" | Know what the audience already knows; avoid restating |
| Reference | `references/source-types.md` | Full file | What counts as a verified source |
| Reference | `references/citation-format.md` | Full file | How to record sources in the brief |

## Process

1. Restate the topic in one sentence so the user can confirm scope before you start gathering sources.
2. Identify 3-7 primary sources (peer-reviewed papers, company case studies, official documentation, named individuals quoted in reputable outlets). Skip vague secondary sources (top-N listicles, AI-generated blogs).
3. Pull the specific claims you intend to use. Each claim gets a source link and a verbatim quote if it is a number or a direct argument. Numbers especially need exact citations.
4. Note any conflicting sources. If two reputable sources disagree on a number, flag it. The script cannot pretend the disagreement does not exist.
5. Draft the brief: one paragraph summary, the claims you will use (with citations), the angle (what is the takeaway), and any open questions for the human.
6. Save to `output/[topic-slug]-brief.md`.

## Checkpoints

| After Step | Agent Presents | Human Decides |
|------------|---------------|---------------|
| 1 | Restated topic in one sentence | Confirm or redirect |
| 5 | Draft brief with claims and citations | Approve, request more sources, or change angle |

## Audit

| Check | Pass Condition |
|-------|---------------|
| Source quality | Every claim has a primary or reputable secondary source. No "according to some studies" without a citation. |
| Number accuracy | Every quantitative claim is a direct quote or computed value from a named source. |
| Audience fit | The brief assumes only what `identity.md` Audience section says they already know. |
| Conflict surfacing | If sources disagree, the disagreement is in the brief, not buried. |

## Outputs

| Artifact | Location | Format |
|----------|----------|--------|
| Content brief | `output/[topic-slug]-brief.md` | Markdown with Summary / Claims / Angle / Open Questions sections |

Stage 02 reads from `output/`. If the human edits the brief between stages, the script writer picks up the edits.
