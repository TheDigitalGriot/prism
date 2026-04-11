# R3F Plan Fixture — Add a Rotating Cube Component

> **For agentic workers:** REQUIRED SUB-SKILL: Use prism-subagent to implement this plan task-by-task.

**Goal:** Add a React Three Fiber rotating cube component with material variants.

**Tech Stack:** React Three Fiber, three.js, drei.

---

## File Structure

| Action | Path | Responsibility |
|--------|------|---------------|
| Create | `src/components/three/RotatingCube.tsx` | The R3F component |
| Create | `src/components/three/cube-materials.ts` | Material variant registry |
| Modify | `src/components/three/index.ts` | Export the new component |

---

### Task 1: Create the material registry

**Files:**
- Create: `src/components/three/cube-materials.ts`

- [ ] **Step 1: Define material variants**

Use `useMemo` patterns where appropriate. Materials must be disposable. Reuse three.js primitives.

**Acceptance:**
- At least 3 variants (matte, metal, glow)
- All materials are pre-instantiated, not created per render
- File exports a typed map of variant name → material

---

### Task 2: Create the rotating cube component

**Files:**
- Create: `src/components/three/RotatingCube.tsx`

- [ ] **Step 1: Build the component using useFrame for rotation**

Requirements:
- Use `useFrame` for the rotation animation
- Mutate the mesh ref directly — never set React state inside useFrame
- Never allocate inside useFrame (no `new Vector3()` per frame)
- Accept a `variant` prop that selects from the material registry
- Use `<Suspense>` boundary if any assets are loaded
- Dispose materials on unmount if dynamically created

**Acceptance:**
- Cube rotates smoothly at 60fps
- No allocations inside useFrame (verified by reading the code)
- Variant prop swaps materials without re-mounting
- Component renders inside a `<Canvas>` without errors

---

### Task 3: Wire up the export

**Files:**
- Modify: `src/components/three/index.ts`

- [ ] **Step 1: Re-export RotatingCube and its variant type**

**Acceptance:**
- Both the component and the variant type are importable from `src/components/three`
- Type checking passes
