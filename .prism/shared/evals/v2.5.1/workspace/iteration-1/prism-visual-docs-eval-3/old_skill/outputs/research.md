# Prism Visual Docs — Eval Output (v2.4.8 Baseline)

**Task:** "Map out the user journeys for our mobile app"
**Skill Version:** v2.4.8 (`prism-visual-docs`)
**Date:** 2026-03-08

---

## Skill Execution Trace

### Step 1: Locate the PRD

**Action:** Simulated spawning `prism-locator` agent to find a PRD or product requirements for "mobile app."

**Result:** No PRD found in `.prism/shared/plans/`. The repository contains plans for VSCode extension, Electron app, CLI dashboard, installer wizard, and documentation site — but no mobile app PRD exists.

**Observation:** The skill workflow assumes a PRD exists (Step 1 says "Read the PRD FULLY before proceeding"). Without a PRD, the skill has no fallback guidance. It proceeds directly to Step 2 and relies on the `/generate_user_flows` command's "no parameters provided" path.

### Step 2: Invoke `/generate_user_flows`

**Action:** Since no PRD was found, the command's "no parameters" path activates. Per the command template, it would respond:

```
I'll help you create comprehensive User Flows and UX documentation.

Please provide:
1. The PRD or product description
2. Main user types/roles
3. The 3-5 primary tasks users need to accomplish

Tip: You can invoke with a PRD: `/generate_user_flows .prism/shared/plans/MY-PRODUCT-PRD.md`
```

**Observation:** The workflow stalls here. The user said "Map out the user journeys for our mobile app" but:
- No PRD exists to reference
- The skill does not prompt for clarifying details itself — it delegates entirely to the command
- The command asks for user types, primary tasks, and a PRD
- Without user interaction to answer these clarifying questions, the workflow cannot proceed to document generation

### Simulated Clarifying Questions Phase

To continue the evaluation, I simulate reasonable answers a user might provide:

| Question | Simulated Answer |
|----------|-----------------|
| Product description | A general-purpose mobile app (no further specifics available) |
| Main user types | New User, Returning User, Power User |
| Primary tasks | 1. Onboarding/Sign-up 2. Browse content 3. Complete a core action 4. Manage settings 5. Get help/support |
| Design preferences | Mobile-first (inherently) |
| Accessibility | WCAG 2.1 AA |

### Simulated Document Generation

Following the command's output template, the generated document would be saved to:

```
.prism/shared/plans/2026-03-08-mobile-app-USER-FLOWS.md
```

The document would follow the template structure from `/generate_user_flows`:

1. **Overview** — 3 user personas (New User, Returning User, Power User) with demographics, goals, pain points
2. **Information Architecture** — Site map of app screens
3. **User Flows** — 5 primary flows with ASCII diagrams:
   - Onboarding / Sign-up flow
   - Content browsing flow
   - Core action completion flow
   - Settings management flow
   - Help / Support flow
4. **Screen Inventory** — Table of all screens with routes, purposes, priorities
5. **Screen Specifications** — ASCII wireframes for key screens with states (empty, loading, error, success)
6. **Component Library** — Core mobile components (Button, Input, Card, Bottom Sheet, Tab Bar, etc.)
7. **Interaction Patterns** — Form handling, navigation (bottom tabs), gestures, destructive actions
8. **Responsive Design** — Breakpoints (though mobile-first, would still cover tablet/desktop)
9. **Accessibility** — WCAG 2.1 AA, touch targets, screen reader, contrast

### Step 3: Technical Spec (Optional)

**Action:** Not invoked — the task only asked for user journeys, not a technical spec.

### Step 4: Save to Prism Directory

**Simulated save path:** `.prism/shared/plans/2026-03-08-mobile-app-USER-FLOWS.md`

### Step 5: Offer Next Steps

**Simulated output:**
```
Visual documentation saved to .prism/shared/plans/2026-03-08-mobile-app-USER-FLOWS.md

Related documents:
- PRD: None found (recommend creating one with /prism-prd first)

Next steps in the prism workflow:

1. `/prism-plan` — Create implementation plan using these screens
2. `/prism-implement` — Begin building with wireframes as reference
3. `/generate_pricing` — Create pricing proposal (if client-facing)
```

### Step 6: Track with TodoWrite

**Simulated todo items:**
```
- [ ] Visual: Define user personas
- [ ] Visual: Map primary user flows
- [ ] Visual: Create screen inventory
- [ ] Visual: Design key wireframes
- [ ] Visual: Document component library
- [ ] Visual: Specify responsive breakpoints
```

---

## Quality Gate Assessment

| Gate | Status | Notes |
|------|--------|-------|
| All user personas defined | Partial | Generic personas only — no product-specific detail |
| Primary user flows documented (5-10) | Simulated 5 | Would need real product context for accuracy |
| Screen inventory complete | Not started | Blocked on product specifics |
| Key screens have wireframes | Not started | Blocked on screen inventory |
| Component library documented | Template-level | Generic mobile components only |
| Responsive breakpoints specified | Template-level | Standard mobile/tablet/desktop |
| Accessibility requirements noted | Yes | WCAG 2.1 AA baseline |
| States covered (empty, loading, error, success) | Template-level | Pattern documented, not per-screen |

---

## Observations & Findings

### What the v2.4.8 Skill Did Well

1. **Clear workflow sequence**: The 6-step orchestration (PRD lookup, command invocation, optional tech spec, save, next steps, todo tracking) provides a structured path.
2. **Good delegation model**: The skill correctly separates orchestration (SKILL.md) from generation (command), keeping responsibilities clean.
3. **Integration guidance**: The workflow diagram showing PRD -> visual-docs -> plan is helpful for understanding where this fits.
4. **Comprehensive template**: The `/generate_user_flows` command template covers all major UX documentation areas.

### Where the v2.4.8 Skill Fell Short

1. **Hard dependency on PRD**: Step 1 assumes a PRD exists. When none is found, there is no guidance for the skill to gather product context itself. The skill says "Read the PRD FULLY before proceeding" but has no alternative path.
2. **No inline context gathering**: The skill delegates ALL clarifying questions to the command. The skill itself does not ask any questions or gather context — it is purely a pass-through orchestrator.
3. **Vague task handling**: The user's request ("Map out the user journeys for our mobile app") is extremely vague. The skill does not attempt to disambiguate "our mobile app" — it does not search for existing mobile app code, check for related features, or ask which product is meant.
4. **No progressive elaboration**: The workflow is linear and all-or-nothing. There is no mechanism to start with a lightweight journey map and iterate. The template always produces a full UX specification.
5. **Depth calibration is passive**: The skill documents three depth levels (Low/Medium/High fidelity) but does not ask the user which depth they want. It is guidance for the human, not logic the skill executes.
6. **TodoWrite dependency**: Step 6 references TodoWrite, which is a tool that may or may not be available. No fallback is provided.
7. **No existing codebase analysis**: The skill does not attempt to discover existing screens, routes, or components in the codebase that could inform the user flows. This is a missed opportunity given that prism has codebase analysis agents available.

### Workflow Bottleneck

The critical bottleneck is the **PRD dependency in Step 1**. For a task like "map user journeys for our mobile app," the ideal workflow would:
1. Search the codebase for mobile app code/screens
2. Ask clarifying questions about what "our mobile app" refers to
3. Generate flows based on discovered code + user input

Instead, the v2.4.8 skill tries to find a PRD, fails, and then hands off to a command that asks for a PRD again.

### Token/Effort Estimate

- Skill orchestration overhead: ~500 tokens
- Prism-locator agent spawn (simulated): ~2,000 tokens
- Command clarifying questions: ~300 tokens (then blocks for user input)
- Full document generation (if unblocked): ~8,000-12,000 tokens
- **Total if workflow completes:** ~11,000-15,000 tokens
- **Total before blocking on user input:** ~2,800 tokens (then stalls)
