# Prism Visual Docs Eval — OLD Skill (v2.4.8) Execution Log

**Skill:** `prism-visual-docs` (v2.4.8 snapshot)
**Task:** "Create user flows and wireframes for the e-commerce checkout experience based on our PRD"
**Date:** 2026-03-08

---

## Workflow Execution Trace

### Step 1: Locate the PRD

**Action:** Skill instructs to spawn a `prism-locator` agent to find the PRD.

```
Task(subagent_type="prism-locator")
"Find the PRD or product requirements for e-commerce checkout"
```

**Simulated Result:** The prism-locator agent would search `.prism/shared/plans/` and `.prism/shared/docs/` for files matching PRD patterns (e.g., `*-PRD.md`, `*-prd.md`, `*checkout*`).

**Outcome:** No PRD file was found in the repository. The skill does NOT have a fallback for missing PRDs — it assumes one exists and says "Read the PRD FULLY before proceeding."

**Issue Identified:** The skill provides no guidance for when the PRD is missing. The workflow stalls at Step 1. There is no instruction to ask the user for a PRD path, create a PRD first, or proceed without one. The only implicit fallback is in the `/generate_user_flows` command itself (Step 2), which has a "no parameters provided" branch that asks the user for product info — but the skill orchestration layer never routes to that branch explicitly when the locator fails.

### Step 2: Invoke /generate_user_flows Command

**Action:** Skill instructs to run:
```
/generate_user_flows .prism/shared/plans/[PRD-file].md
```

**Simulated Result:** Since no PRD was located, the command would either:
- (a) Be invoked with a nonexistent path and fail, or
- (b) Fall back to the "no parameters provided" branch asking clarifying questions

**The command's clarifying questions would be:**
1. What are the main user types/roles?
2. What are the 3-5 primary tasks users need to accomplish?
3. Is there an existing PRD or feature list?
4. Any design system or UI framework preferences?
5. Mobile-first or desktop-first?
6. Any accessibility requirements?

**Issue Identified:** The skill has a gap between its Step 1 (locate PRD) and Step 2 (invoke command with PRD path). When the locator fails to find a PRD, there is no conditional logic to handle this — the skill template uses a placeholder `[PRD-file].md` that would remain unresolved.

### Step 3: Simulated Output Generation (Assuming PRD context was gathered)

Assuming the user provided product context or a PRD was found, the `/generate_user_flows` command would generate a document following its output template. For an e-commerce checkout, the simulated output structure would be:

**File:** `.prism/shared/plans/2026-03-08-ecommerce-checkout-USER-FLOWS.md`

**Sections generated:**
1. Overview with User Personas (Shopper, Returning Customer, Guest)
2. Information Architecture (site map)
3. User Flows (Cart Review, Checkout, Payment, Order Confirmation, Guest vs Auth flows)
4. Screen Inventory (Cart, Shipping, Payment, Review, Confirmation, etc.)
5. Screen Specifications with ASCII Wireframes
6. Component Library (Button, Input, Card, Modal, etc.)
7. Interaction Patterns (form handling, navigation, destructive actions)
8. Responsive Design (breakpoints, mobile adaptations)
9. Accessibility (WCAG 2.1 AA)

### Step 4: Save to Prism Directory

**Action:** Save to `.prism/shared/plans/2026-03-08-ecommerce-checkout-USER-FLOWS.md`

**Issue Identified:** The save path is correct per the template. No issues here.

### Step 5: Offer Next Steps

**Action:** Skill would output:
```
Visual documentation saved to .prism/shared/plans/2026-03-08-ecommerce-checkout-USER-FLOWS.md

Related documents:
- PRD: [not found]

Next steps in the prism workflow:
1. /prism-plan — Create implementation plan using these screens
2. /prism-implement — Begin building with wireframes as reference
3. /generate_pricing — Create pricing proposal (if client-facing)
```

**Issue Identified:** The next-steps template is static/hardcoded. It always offers the same three options regardless of context. It also references `/generate_pricing` which may not be relevant to all projects.

### Step 6: Track with TodoWrite

**Action:** Skill instructs to add items to TodoWrite:
```
- [ ] Visual: Define user personas
- [ ] Visual: Map primary user flows
- [ ] Visual: Create screen inventory
- [ ] Visual: Design key wireframes
- [ ] Visual: Document component library
- [ ] Visual: Specify responsive breakpoints
```

**Issue Identified:** TodoWrite tracking is listed as a step but there is no conditional logic — it adds the same items regardless of what was actually generated. The items are also generic and not tailored to the specific product (e-commerce checkout).

---

## Quality Gates Assessment

The skill defines these quality gates:

| Gate | Would Pass? | Notes |
|------|-------------|-------|
| All user personas defined | Depends | Only if PRD was found or user provided context |
| Primary user flows documented (5-10 flows) | Depends | Command template produces flows but count depends on input |
| Screen inventory complete with priorities | Depends | Template includes priority column |
| Key screens have wireframes | Yes | Command template generates ASCII wireframes |
| Component library documented | Yes | Template includes component table |
| Responsive breakpoints specified | Yes | Template includes breakpoint table |
| Accessibility requirements noted | Yes | Template includes accessibility section |
| States covered (empty, loading, error, success) | Partial | Template shows states per screen but doesn't enforce all four |

---

## Summary of v2.4.8 Skill Behavior

### What Works Well
1. **Clear linear workflow** — Steps 1-6 are well-ordered and logical
2. **Comprehensive output template** — The `/generate_user_flows` command template covers all major UX documentation areas
3. **ASCII wireframes** — Practical for markdown-based documentation
4. **Quality gates** — Checklist provides verification criteria
5. **Workflow integration** — Clear positioning between PRD and Plan phases

### Issues and Gaps
1. **No PRD-not-found fallback** — Step 1 assumes the PRD exists; no error handling or alternative path
2. **Placeholder-based invocation** — Step 2 uses `[PRD-file].md` placeholder with no resolution mechanism
3. **No interactive clarification at skill level** — The command has clarifying questions, but the skill layer doesn't surface them or handle the "no PRD" case
4. **Static next-steps** — Always offers the same three options regardless of context
5. **Generic TodoWrite items** — Not tailored to the specific product being documented
6. **No depth calibration prompt** — The skill documents depth options (low/medium/high fidelity) but never asks the user which they want
7. **Step 3 (tech spec) is "optional" with no trigger** — No guidance on when to generate tech spec vs skip it
8. **No validation of output completeness** — Quality gates are listed but there is no step that checks them programmatically
