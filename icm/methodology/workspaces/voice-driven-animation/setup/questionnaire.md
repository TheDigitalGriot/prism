# Onboarding Questionnaire: Voice-Driven Animation

Read this file when the user types "setup". Ask ALL questions below in a single conversational pass. The user should be able to answer everything in one message. These configure the production system, not a specific video. Per-video topics are provided at the start of each pipeline run.

After answers come back, replace `{{PLACEHOLDERS}}` across the workspace, then present derived voice rules for human review (the two-pass process at the bottom of this file).

Never write a real API key, voice id, or password into any committed file. Those go in `.env`, which `.gitignore` should already exclude. `shared/env-template.md` shows the variables and how to populate them locally.

---

### Q1: What is your brand or project name?
- Placeholder: `{{BRAND_NAME}}`
- Files: `brand-vault/identity.md`, `brand-vault/voice-rules.md`, `stages/02-script/references/script-template.md`
- Type: free text

### Q2: Give me 2-3 sentences that sound exactly like your brand.
- Placeholders: `{{VOICE_RIGHT_EXAMPLE_1}}`, `{{VOICE_RIGHT_EXAMPLE_2}}`
- Files: `brand-vault/voice-rules.md`
- Type: free text
- Note: These become the positive examples in the Sentence Rules table.

### Q3: Give me 2-3 sentences your brand would never say.
- Placeholders: `{{VOICE_WRONG_EXAMPLE_1}}`, `{{VOICE_WRONG_EXAMPLE_2}}`
- Files: `brand-vault/voice-rules.md`
- Type: free text
- Note: These become the negative examples in the Sentence Rules table.

### Q4: List things that are always errors in your content. Patterns, phrases, or habits to avoid.
- Placeholders: `{{VOICE_HARD_CONSTRAINT_1}}`, `{{VOICE_HARD_CONSTRAINT_2}}`, `{{VOICE_HARD_CONSTRAINT_3}}`
- Files: `brand-vault/voice-rules.md`
- Type: free text
- Note: Become the numbered error list in Hard Constraints. If the user gives fewer than 3, derive from Q2/Q3 examples.

### Q5: How should your content sound? (2-3 adjectives)
- Placeholder: `{{VOICE_ADJECTIVES}}`
- Files: `brand-vault/voice-rules.md`
- Type: free text
- Note: Supplementary to Q2-Q4. Concrete examples are primary. Derive `{{VOICE_PACING_DESCRIPTION}}`, `{{VOICE_ANTI_PATTERN}}`, `{{VOICE_ANTI_PATTERN_DESCRIPTION}}` from this plus Q2-Q4.

### Q6: Who is your audience, what do they care about, and what do they already know?
- Placeholders: `{{TARGET_AUDIENCE}}`, `{{AUDIENCE_CARES_ABOUT}}`, `{{AUDIENCE_KNOWLEDGE_LEVEL}}`
- Files: `brand-vault/identity.md`, `brand-vault/voice-rules.md`
- Type: free text

### Q7: What does your brand do, in one sentence?
- Placeholder: `{{BRAND_MISSION}}`
- Files: `brand-vault/identity.md`
- Type: free text
- Derive `{{BRAND_POSITIONING}}` and `{{CONTENT_MISSION}}` from Q1 + Q6 + Q7.

### Q8: What are your content pillars? (3-5 recurring themes)
- Placeholders: `{{CONTENT_PILLAR_1}}` through `{{CONTENT_PILLAR_5}}`
- Files: `stages/01-research/references/source-types.md`
- Type: free text (comma-separated)

### Q9: Default tone tags you want ElevenLabs to honor.
- Placeholder: `{{TONE_TAG_VOCABULARY}}`
- Files: `stages/02-script/references/beat-markers.md`, `skills/elevenlabs-narration/rules/tone-tags.md`
- Type: free text (comma-separated)
- Example: matter-of-fact, wry, pointed, warm, thoughtful

### Q10: Target platform and runtime?
- Placeholders: `{{PRIMARY_PLATFORM}}`, `{{TARGET_DURATION}}`
- Files: `shared/platform-specs.md`, `stages/02-script/CONTEXT.md`
- Type: free text
- Example: YouTube, 2-3 minutes

### Q11: Brand colors? (primary, accent, background, text as hex)
- Placeholders: `{{PRIMARY_COLOR}}`, `{{ACCENT_COLOR}}`, `{{BACKGROUND_COLOR}}`, `{{TEXT_COLOR}}`
- Files: `stages/04-animate/references/scene-template.md`
- Type: free text

### Q12: Heading and body fonts?
- Placeholders: `{{HEADING_FONT}}`, `{{BODY_FONT}}`
- Files: `stages/04-animate/references/scene-template.md`
- Type: free text
- Default: Inter for body, a bold sans-serif for headings.

### Q13: ElevenLabs voice settings (the voice id stays in `.env`, never here).
- Placeholders: `{{ELEVEN_VOICE_LABEL}}`, `{{ELEVEN_MODEL_ID}}`, `{{ELEVEN_STABILITY}}`, `{{ELEVEN_SIMILARITY_BOOST}}`, `{{ELEVEN_SPEED}}`, `{{ELEVEN_OUTPUT_FORMAT}}`
- Files: `skills/elevenlabs-narration/SKILL.md`, `shared/env-template.md`
- Type: structured
- Example: voice label "Jake (Pro Voice Clone)", model `eleven_v3`, stability 0.5, similarity_boost 0.75, speed 1.0, output `mp3_44100_128`
- Note: `{{ELEVEN_VOICE_LABEL}}` is a human-readable name only. The actual id lives in `.env` under `ELEVEN_VOICE_ID`.

### Q14: Whisper transcription preference?
- Placeholder: `{{WHISPER_MODEL}}`
- Files: `skills/whisper-beat-finder/SKILL.md`, `stages/03-voice/references/audio-pipeline.md`
- Type: selection
- Options: `medium.en` on CPU (default -- safe across GPUs), `large-v3` on GPU (faster but can segfault on some CUDA drivers; fall back to medium.en on CPU if it crashes), `tiny.en` on CPU (drafts only)

### Q15: End-card lockup asset and website URL.
- Placeholders: `{{LOCKUP_PATH}}`, `{{WEBSITE_URL}}`
- Files: `skills/remotion-scene-anatomy/rules/end-card-pattern.md`, `stages/04-animate/references/scene-template.md`
- Type: free text
- Example: `public/brand/lockup.svg`, `yourcompany.com`
- Note: The end card is always lockup + website url, never a tagline overlay. If the brand previously used a tagline ("AI Realized.", etc.), that lives elsewhere -- not on the end card.

### Q16: Multi-video project, or single video at a time?
- Placeholder: `{{PROJECT_SHAPE}}`
- Files: `stages/02-script/CONTEXT.md`, `stages/04-animate/references/scene-template.md`
- Type: selection
- Options: single (one video per workspace run), series (multiple related videos sharing brand and scenes -- file names use `videoN.mp3`, `Video1.tsx`, etc.)

---

## After Onboarding (Two-Pass Process)

**Pass 1:** Collect all answers above and replace direct placeholders across the workspace.

**Pass 2 (Voice Review):** Present the generated `brand-vault/voice-rules.md` to the user:

"Here are the voice rules I derived from your examples. Read these and edit anything that does not match how you actually sound."

Show the populated Hard Constraints, Sentence Rules table, Pacing, and What the Voice Is NOT sections. The user edits before the rules are finalized. This catches misinterpretations early.

**After both passes:** Derive and fill remaining fields:
1. Pacing description and anti-patterns (from Q2-Q5)
2. Brand positioning and content mission (from Q1, Q6, Q7)
3. Pillar context entries (from Q8 + Q6)

Then scan every `.md` file for remaining `{{` patterns. If any remain, resolve them.

**Finally:** Remind the user to populate `.env` using `shared/env-template.md`. They paste their real `ELEVEN_API_KEY` and `ELEVEN_VOICE_ID` into that file locally. Do not write those values into any committed file.

Tell the user: "You are set up. To make a video, give me a topic and we will start at Stage 1."
