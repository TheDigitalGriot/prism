# Stage 04: Generation

Build .pptx files from session outlines using the html2pptx pipeline. One JS file per session.

## Inputs

| Source | File/Location | Section/Scope | Why |
|--------|--------------|---------------|-----|
| Previous stage | `../03-outline/output/[session-slug]-outline.md` | Full file | Slide content to generate |
| Design system | `../../design-system/CONTEXT.md` | Routes to palette, typography | Colors, fonts, spacing values |
| Skill | `../../skills/pptx/SKILL.md` | "Creating a new PowerPoint presentation without a template" section | html2pptx workflow, design principles |
| Skill | `../../skills/pptx/html2pptx.md` | Full file | HTML syntax, PptxGenJS API, chart/table examples |
| Skill | `../../skills/frontend-design/SKILL.md` | Full file | Design thinking, aesthetics, avoiding generic look |
| Reference | `references/build-conventions.md` | Full file | JS file structure and naming |

## Process

1. Read the session outline
2. Read `../../skills/pptx/SKILL.md` and `../../skills/pptx/html2pptx.md` in full
3. Read `../../skills/frontend-design/SKILL.md` for design direction
4. Load the design system (palette, typography)
5. If any slides need gradients or icons, rasterize them to PNG using Sharp first
6. Create one HTML file per slide in `output/[session-slug]/` (720pt x 405pt)
7. Follow all HTML rules: text in `<p>`/`<h1>`-`<h6>`/`<ul>`/`<ol>` only, no `<br>`, no CSS gradients, web-safe fonts only
8. Create one JS file (`output/[session-slug]/[session-slug].js`) that:
   - Creates a PptxGenJS presentation (LAYOUT_16x9)
   - Calls `html2pptx()` for each HTML slide (script at `../../skills/pptx/scripts/html2pptx.js`)
   - Adds charts/tables to placeholder areas using PptxGenJS API
   - Saves to `output/[session-slug]/[session-slug].pptx`
9. Run `node [session-slug].js` to generate the .pptx
10. Run the audit checks below. If any fail, fix and re-run the JS file.
11. Repeat for each session in the curriculum

## Audit

| Check | Pass Condition |
|-------|---------------|
| Render success | JS file runs without errors and produces a .pptx file |
| Slide count match | Generated .pptx has the same number of slides as the outline |
| File structure | Output folder contains: HTML files, JS file, images/ (if needed), .pptx |
| Font compliance | Only web-safe fonts used in HTML (no custom font references) |

## Outputs

| Artifact | Location | Format |
|----------|----------|--------|
| Session deck files | `output/[session-slug]/` | Folder: HTML files, JS file, images/, .pptx |
