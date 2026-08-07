# Stage 05: Render

Render the Remotion composition to mp4. Validate that the deliverable matches the brief and is ready to ship.

## Inputs

| Source | File/Location | Section/Scope | Why |
|--------|--------------|---------------|-----|
| Stage 04 | (Remotion project) | Compositions registered in `Root.tsx` | The compositions to render |
| Stage 02 | `../02-script/output/[topic-slug]-script.md` | Header only | Confirm working title and intended length |
| Reference | `references/render-checklist.md` | Full file | Pre-flight and post-render checks |
| Shared | `../../shared/platform-specs.md` | Configured platform row | Confirm resolution and fps match the target |

## Process

1. Run pre-flight: confirm studio preview is clean (no black frames, no missing audio, no Web font fallback flashes), no console errors, all beats present.
2. Render: `npm run render:v1` (or whichever script targets the composition for this video). Output goes to `remotion/out/videoN.mp4` by convention.
3. Open the rendered mp4 and watch it end to end. Look for: clipped first/last frames, audio drift after the halfway mark, font rendering vs studio, captions or text that overflow the safe area.
4. Compare runtime against the script header's stated length. Plus or minus 5% is fine. More than that means a beat re-time or a script trim is needed; loop back to Stage 02 or 04.
5. Save the final mp4 alongside any earlier cuts. Use `output/[topic-slug]-final.mp4` for the deliverable.
6. Write a short release note: render date, runtime, file size, any caveats (open questions from research that survived, optional regen recommended later).

## Checkpoints

| After Step | Agent Presents | Human Decides |
|------------|---------------|---------------|
| 1 | Pre-flight pass/fail summary | Proceed with render, or send back to Stage 04 |
| 4 | Render review notes (runtime, font, audio drift) | Accept the deliverable, or request a re-render after fixes |

## Audit

| Check | Pass Condition |
|-------|---------------|
| Pre-flight | Studio preview clean, no errors |
| Render exit code | 0 |
| Runtime | Within 5% of the script header target |
| Audio sync | No drift visible against scene reveals at the end of the video |
| Font rendering | Matches the studio preview |
| End card | Lockup + `{{WEBSITE_URL}}` visible and readable for at least 4 seconds |
| File integrity | mp4 plays in VLC and the browser; not just Quicktime |

## Outputs

| Artifact | Location | Format |
|----------|----------|--------|
| Final video | `output/[topic-slug]-final.mp4` | H.264 mp4 at the configured resolution |
| Release notes | `output/[topic-slug]-notes.md` | Short markdown |

## When to Loop Back

| Symptom | Loop back to |
|---------|--------------|
| Beat lands off-cue | Stage 04 (re-derive `T` from transcript) |
| Audio sounds wrong | Stage 03 (regenerate VO) |
| Script reads wrong | Stage 02 (rewrite, then 03, then 04) |
| Claim is unsupported | Stage 01 (cite or remove) |
