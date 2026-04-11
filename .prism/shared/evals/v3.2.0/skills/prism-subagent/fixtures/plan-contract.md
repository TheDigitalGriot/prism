# Contract Plan Fixture — Add User Profile Endpoint

> **For agentic workers:** REQUIRED SUB-SKILL: Use prism-subagent to implement this plan task-by-task.

**Goal:** Add a `GET /api/users/:id/profile` endpoint with shared types between API and web.

**Tech Stack:** Full-stack TypeScript, tRPC, React Query.

---

## File Structure

| Action | Path | Responsibility |
|--------|------|---------------|
| Create | `.prism/shared/contracts/user-profile.ts` | Shared zod schema + inferred types |
| Modify | `apps/api/src/routers/users.ts` | Add the profile procedure |
| Modify | `apps/web/src/hooks/use-user-profile.ts` | Add the React Query hook |

---

### Task 1: Define the shared contract

**Files:**
- Create: `.prism/shared/contracts/user-profile.ts`

- [ ] **Step 1: Define the zod schema and inferred types**

```typescript
import { z } from "zod";

export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  displayName: z.string(),
  bio: z.string().nullable(),
  avatarUrl: z.string().url().nullable(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;
```

**Acceptance:**
- Schema is exported
- Type is inferred (not duplicated)
- File is in the contracts directory so both apps can import it

---

### Task 2: Add the API procedure

**Files:**
- Modify: `apps/api/src/routers/users.ts`

- [ ] **Step 1: Add a getProfile procedure**

The procedure must:
- Take a user ID as input
- Look up the user in the database
- Return data validated against UserProfileSchema
- Return 404 if the user doesn't exist

**Acceptance:**
- Procedure is registered in the users router
- Input is validated
- Output is validated against UserProfileSchema before returning
- 404 path is tested

---

### Task 3: Add the client hook

**Files:**
- Modify: `apps/web/src/hooks/use-user-profile.ts`

- [ ] **Step 1: Add a React Query hook wrapping the procedure**

The hook must:
- Call the tRPC procedure
- Use the UserProfile type from the contract
- Cache by user ID
- Invalidate on user mutation

**Acceptance:**
- Hook returns typed data
- Types come from the contract, not redefined
- TypeScript passes on both apps
