# Render Checklist

Pre-flight and post-render checks. Skip none of these on a final-cut render. Skip them all freely on a draft.

## Pre-Flight (Before Render)

- [ ] Studio preview plays end to end without console errors
- [ ] No black frames between beats (gap-fill sequencing engaged)
- [ ] Background `AbsoluteFill` is mounted at the master composition root
- [ ] Audio mounted once, plays for the whole composition
- [ ] All scenes register the correct `T` constants from the latest `beat-timings.md`
- [ ] End card shows lockup + `{{WEBSITE_URL}}`
- [ ] Fonts loaded (Google Fonts registered or local `@font-face` block present)
- [ ] Composition `width` x `height` x `fps` match the configured platform spec

## Render Command

For a single-video project:

```bash
npm run render
```

For series projects with multiple compositions:

```bash
npm run render:v1
npm run render:v2
# ...
```

Or render everything in sequence with whatever `render:all` script the project defines.

## Render Performance Notes

- A 2-minute video at 1920x1080/30fps typically renders in 1-3 minutes on a modern laptop.
- The first render of a session is slower (Remotion warms its bundle cache).
- Long videos with heavy compositing benefit from `--concurrency` set to (cores - 2).

## Post-Render

- [ ] Open the mp4 in the browser (HTML5 video) -- catches encoding issues that Quicktime hides
- [ ] Open the mp4 in VLC -- catches H.264 profile issues
- [ ] Watch the first 5 seconds and the last 10 seconds at full attention -- those frames are where rendering tends to drift
- [ ] Skim the middle at 2x speed for any obvious glitches
- [ ] Confirm runtime against the brief target (Stage 02 header)
- [ ] Confirm file size is reasonable for the resolution and length (1080p/30/2min should be 20-60 MB)

## Naming and Filing

- Save the deliverable as `output/[topic-slug]-final.mp4`
- Keep prior cuts under `output/archive/[topic-slug]-vN.mp4` if useful
- Write a one-page release note (`output/[topic-slug]-notes.md`) with render date, runtime, any open caveats

## What Counts As "Ship-Ready"

- All pre-flight items checked
- Render exit code 0
- Post-render checks pass
- Human reviewer has watched the full file once and approved

If any of those fail, do not deliver. Fix and re-render. The cost of a re-render is far smaller than the cost of shipping the wrong cut.
