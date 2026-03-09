# Prism Visual Docs Evaluation — OLD Skill (v2.4.8)

**Task:** "Design low-fidelity wireframes for our dashboard MVP, we also need a tech spec"
**Skill Version:** v2.4.8 (`prism-visual-docs`)
**Date:** 2026-03-08

---

## Workflow Execution Trace

### Step 1: Locate the PRD

**Action:** Attempted to locate a PRD via `Task(subagent_type="prism-locator")`.

**Result:** No explicit PRD was provided by the user. No PRD file was found that directly matches "dashboard MVP." Related files exist (e.g., `2026-03-07-prism-eval-admin-dashboard.md`) but no canonical PRD for this task.

**Skill behavior:** The skill instructs to "Read the PRD FULLY before proceeding." Without a PRD, the workflow stalls at Step 1. The skill does not provide a fallback path for when no PRD exists. It only says in the comparison table: "Use commands directly when: No PRD exists yet."

**Observation:** The v2.4.8 skill has a hard dependency on a PRD existing. If no PRD is found, the orchestrator has no explicit instructions for how to proceed. The user would need to either create a PRD first (via `prism-prd`) or fall back to using the commands directly, bypassing this skill entirely.

### Step 2: Invoke `/generate_user_flows`

**Simulated invocation:** `/generate_user_flows` with depth calibration "low-fidelity (MVP)" as specified in the skill.

Since no PRD was provided, the command's initial response template would trigger clarifying questions:

```
I'll help you create comprehensive User Flows and UX documentation.

Please provide:
1. The PRD or product description
2. Main user types/roles
3. The 3-5 primary tasks users need to accomplish
```

**Simulated user answers (for evaluation purposes):**
1. Product: Dashboard MVP for monitoring and managing workflows
2. User types: Admin, Developer
3. Primary tasks: View status overview, drill into details, manage settings, view reports, search/filter data

**Simulated low-fidelity output:**

---

# Dashboard MVP — User Flows & UX Specification

**Version:** 1.0
**Date:** 2026-03-08
**Depth:** Low-fidelity (MVP)

---

## 1. Overview

### 1.1 User Personas

#### Persona 1: Alex — Admin
| Attribute | Details |
|-----------|---------|
| **Demographics** | 30-45, operations manager, high tech comfort |
| **Goals** | Monitor system health, manage team access |
| **Pain Points** | No centralized view of status |
| **Key Tasks** | View dashboard, manage users, review reports |

#### Persona 2: Jordan — Developer
| Attribute | Details |
|-----------|---------|
| **Demographics** | 25-40, software engineer, very high tech comfort |
| **Goals** | Check build/deploy status, debug issues quickly |
| **Pain Points** | Switching between multiple tools |
| **Key Tasks** | View status, drill into logs, search/filter |

### 1.2 Design Principles
1. **Glanceable** — Key metrics visible without interaction
2. **Progressive Disclosure** — Summary first, details on demand

---

## 2. Information Architecture

### 2.1 Site Map
```
Dashboard MVP
├── Login
├── Dashboard (Home)
│   ├── Status Overview
│   ├── Recent Activity
│   └── Quick Actions
├── Details View
│   ├── Item Detail
│   └── Logs/History
├── Reports
│   └── Summary Report
└── Settings
    ├── Profile
    └── Preferences
```

---

## 3. User Flows

### 3.1 View Dashboard Overview

**Trigger:** User logs in or navigates to home
**Goal:** See current system status at a glance

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Login     │     │  Dashboard  │     │   Detail    │
│   Page      │────>│  Overview   │────>│   View      │
└─────────────┘     └─────────────┘     └─────────────┘
```

**Steps:**
1. **Login** — Enter credentials → Redirect to dashboard
2. **Dashboard** — Scan status cards → Click card for details
3. **Detail View** — Review item details → Return to dashboard

### 3.2 Search and Filter

**Trigger:** User needs to find specific items
**Goal:** Locate items matching criteria

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Dashboard  │     │  Search     │     │  Filtered   │
│  (any page) │────>│  Input      │────>│  Results    │
└─────────────┘     └─────────────┘     └─────────────┘
```

**Steps:**
1. **Dashboard** — Click search bar or use keyboard shortcut
2. **Search** — Type query, apply filters → Results update live
3. **Results** — Click item → Navigate to detail view

---

## 4. Screen Inventory

### 4.1 Screen List

| # | Screen Name | Route | Purpose | Priority |
|---|-------------|-------|---------|----------|
| 1 | Login | `/login` | Authentication | P0 |
| 2 | Dashboard | `/` | Status overview hub | P0 |
| 3 | Detail View | `/items/:id` | Item details | P0 |
| 4 | Reports | `/reports` | Summary reports | P1 |
| 5 | Settings | `/settings` | User preferences | P1 |

### 4.2 Screen Specifications

#### Screen: Dashboard (Home)

**Route:** `/`
**Purpose:** Central hub showing system status at a glance

**Wireframe:**
```
┌─────────────────────────────────────────────────────────┐
│  [Logo]                         [Search]  [User ▼]     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │ Metric 1 │  │ Metric 2 │  │ Metric 3 │  │Metric 4│ │
│  │  [##]    │  │  [##]    │  │  [##]    │  │  [##]  │ │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘ │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Recent Activity                                 │   │
│  │  ┌─────────────────────────────────────────┐    │   │
│  │  │ Item 1    [status]    [timestamp]        │    │   │
│  │  │ Item 2    [status]    [timestamp]        │    │   │
│  │  │ Item 3    [status]    [timestamp]        │    │   │
│  │  └─────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**States:**
- **Empty:** "No activity yet" message with getting-started prompt
- **Loading:** Skeleton cards and shimmer rows
- **Error:** Error banner with retry action

#### Screen: Detail View

**Route:** `/items/:id`
**Purpose:** Show full details for a selected item

**Wireframe:**
```
┌─────────────────────────────────────────────────────────┐
│  [< Back]  [Logo]                       [User ▼]       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [Item Title]                          [Status Badge]   │
│  [Subtitle / metadata]                                  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Key Details                                     │   │
│  │  Field 1: [value]                               │   │
│  │  Field 2: [value]                               │   │
│  │  Field 3: [value]                               │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  History / Logs                                  │   │
│  │  [timestamp]  [event description]               │   │
│  │  [timestamp]  [event description]               │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**States:**
- **Loading:** Skeleton layout
- **Error:** "Item not found" with link back to dashboard

---

## 5. Component Library

### 5.1 Core Components

| Component | Usage | Variants |
|-----------|-------|----------|
| Button | Primary actions | Primary, Secondary |
| Input | Search, forms | Text, Search |
| Card | Metric display | Stat Card, List Card |
| Badge | Status indicator | Success, Warning, Error, Neutral |
| Table Row | List items | Default, Clickable |

---

## 6. Interaction Patterns

### 6.1 Navigation
**Primary:** Top nav bar with logo, search, user menu
**Secondary:** Breadcrumbs on detail views

### 6.2 Search
- Global search in top nav
- Results update as user types (debounced)

### 6.3 Status Updates
- Cards show live status with color-coded badges
- Auto-refresh on configurable interval

---

## 7. Responsive Design

### 7.1 Breakpoints

| Name | Min Width | Changes |
|------|-----------|---------|
| Mobile | 0px | Single column, stacked cards |
| Tablet | 640px | Two-column metric cards |
| Desktop | 1024px | Full layout, four-column metrics |

### 7.2 Mobile Adaptations

| Desktop | Mobile |
|---------|--------|
| Top nav with search | Hamburger menu, search icon |
| 4-column metric cards | Stacked single column |
| Table rows | Compact cards |

---

## 8. Accessibility

- WCAG 2.1 AA compliance
- Keyboard navigation for all interactive elements
- Screen reader support with ARIA labels
- Color contrast >= 4.5:1
- Status communicated via text + color (not color alone)

---

## End of User Flows Document

---

### Step 3: Invoke `/generate_tech_spec`

**Simulated invocation:** `/generate_tech_spec` (user requested "we also need a tech spec").

**Simulated output:**

---

# Dashboard MVP — Technical Specification

**Version:** 1.0
**Date:** 2026-03-08
**Companion to:** Dashboard MVP User Flows v1.0

---

## 1. Overview

### 1.1 Purpose
Technical implementation specification for the Dashboard MVP application.

### 1.2 Scope
This document covers:
- Frontend SPA architecture
- API layer for dashboard data
- Data models for items, metrics, and user preferences
- Authentication and authorization

---

## 2. Architecture

### 2.1 System Overview

```
┌─────────────────────────────────────────────────────┐
│                    CLIENT                            │
│              React SPA (Vite)                        │
└──────────────────────┬──────────────────────────────┘
                       │ HTTPS
                       ▼
┌─────────────────────────────────────────────────────┐
│                   API SERVER                         │
│              Node.js / Express                       │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│                   DATA LAYER                         │
├──────────────────┬──────────────────────────────────┤
│   PostgreSQL     │     Redis (cache/sessions)       │
└──────────────────┴──────────────────────────────────┘
```

### 2.2 Technology Stack

| Layer | Technology | Version | Rationale |
|-------|------------|---------|-----------|
| Frontend | React + TypeScript | 18.x | Component model, ecosystem |
| Build | Vite | 5.x | Fast dev builds |
| Backend | Node.js + Express | 20.x LTS | JS full-stack consistency |
| Database | PostgreSQL | 16.x | Relational data, JSON support |
| Cache | Redis | 7.x | Session store, metric caching |

---

## 3. Data Model

### 3.1 Entity Relationship Diagram

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐
│  User    │────<│  Dashboard   │────<│  Item        │
│          │     │  Preference  │     │              │
└──────────┘     └──────────────┘     └──────┬───────┘
                                              │
                                      ┌───────┴───────┐
                                      │  Activity Log │
                                      └───────────────┘
```

### 3.2 Table Definitions

#### Table: `users`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Unique identifier |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | Login email |
| `role` | ENUM | NOT NULL | admin, developer |
| `created_at` | TIMESTAMP | NOT NULL | Account creation |

#### Table: `items`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Unique identifier |
| `title` | VARCHAR(255) | NOT NULL | Display name |
| `status` | ENUM | NOT NULL | pending, active, error, complete |
| `metadata` | JSONB | | Flexible key-value data |
| `created_at` | TIMESTAMP | NOT NULL | Creation time |
| `updated_at` | TIMESTAMP | NOT NULL | Last update |

#### Table: `activity_logs`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Unique identifier |
| `item_id` | UUID | FK -> items | Related item |
| `event` | VARCHAR(100) | NOT NULL | Event type |
| `detail` | TEXT | | Event description |
| `timestamp` | TIMESTAMP | NOT NULL | When it occurred |

---

## 4. API Specification

### 4.1 API Overview

**Base URL:** `/api/v1`
**Authentication:** Bearer token (JWT)

### 4.2 Endpoints

#### GET `/api/v1/dashboard/metrics`

**Response (200):**
```json
{
  "metrics": [
    { "key": "total_items", "value": 142, "trend": "up" },
    { "key": "active", "value": 38, "trend": "stable" },
    { "key": "errors", "value": 3, "trend": "down" },
    { "key": "completed_today", "value": 17, "trend": "up" }
  ]
}
```

#### GET `/api/v1/items?status=active&limit=20&offset=0`

**Response (200):**
```json
{
  "items": [
    { "id": "uuid", "title": "...", "status": "active", "updated_at": "..." }
  ],
  "total": 142,
  "limit": 20,
  "offset": 0
}
```

#### GET `/api/v1/items/:id`

**Response (200):**
```json
{
  "id": "uuid",
  "title": "...",
  "status": "active",
  "metadata": {},
  "activity": [
    { "event": "created", "timestamp": "...", "detail": "..." }
  ]
}
```

### 4.3 Errors

| HTTP | Code | Description |
|------|------|-------------|
| 400 | VALIDATION_ERROR | Invalid query params |
| 401 | UNAUTHORIZED | Missing or expired token |
| 404 | NOT_FOUND | Item not found |
| 500 | INTERNAL_ERROR | Server error |

---

## 5. Security

### 5.1 Authentication
- JWT tokens with 1-hour expiry
- Refresh token rotation

### 5.2 Authorization
- Role-based: admin (full access), developer (read-only on settings)

---

## 6. Performance

### 6.1 Targets

| Metric | Target |
|--------|--------|
| Dashboard load (p95) | < 800ms |
| API response (p95) | < 300ms |
| Availability | 99.5% |

### 6.2 Caching
- Dashboard metrics cached in Redis (30s TTL)
- Item list cached per query (15s TTL)

---

## End of Technical Specification

---

### Step 4: Save to Prism Directory

**Simulated save locations:**
- `.prism/shared/plans/2026-03-08-DASHBOARD-MVP-USER-FLOWS.md`
- `.prism/shared/plans/2026-03-08-DASHBOARD-MVP-TECHNICAL-SPEC.md`

(Not actually saved — evaluation simulation only.)

### Step 5: Offer Next Steps

```
Visual documentation saved to .prism/shared/plans/2026-03-08-DASHBOARD-MVP-USER-FLOWS.md
Technical specification saved to .prism/shared/plans/2026-03-08-DASHBOARD-MVP-TECHNICAL-SPEC.md

Related documents:
- PRD: (none found — consider creating one with /prism-prd)
- Tech Spec: .prism/shared/plans/2026-03-08-DASHBOARD-MVP-TECHNICAL-SPEC.md

Next steps in the prism workflow:

1. `/prism-plan` — Create implementation plan using these screens
2. `/prism-implement` — Begin building with wireframes as reference
3. `/generate_pricing` — Create pricing proposal (if client-facing)
```

### Step 6: Track with TodoWrite

**Simulated TodoWrite entries:**
- [x] Visual: Define user personas (2 personas created)
- [x] Visual: Map primary user flows (2 flows documented)
- [x] Visual: Create screen inventory (5 screens inventoried)
- [x] Visual: Design key wireframes (2 low-fi wireframes)
- [x] Visual: Document component library (5 components)
- [x] Visual: Specify responsive breakpoints (3 breakpoints)

---

## Quality Gates Assessment

| Gate | Status | Notes |
|------|--------|-------|
| All user personas defined | PASS | 2 personas (Admin, Developer) |
| Primary user flows documented (5-10 flows) | PARTIAL | Only 2 flows — low-fi MVP scope |
| Screen inventory complete with priorities | PASS | 5 screens with P0/P1 priorities |
| Key screens have wireframes | PASS | 2 wireframes (Dashboard, Detail) |
| Component library documented | PASS | 5 core components |
| Responsive breakpoints specified | PASS | 3 breakpoints |
| Accessibility requirements noted | PASS | WCAG 2.1 AA noted |
| States covered (empty, loading, error, success) | PASS | States listed per screen |

---

## Observations on v2.4.8 Skill Behavior

1. **PRD dependency is rigid.** Step 1 says "Read the PRD FULLY before proceeding" with no fallback when no PRD exists. The skill's own comparison table acknowledges "No PRD exists yet" as a reason to use commands directly, but the orchestrator workflow does not branch on this condition.

2. **Clarifying questions are delegated to commands.** The skill itself does not ask clarifying questions — it delegates entirely to `/generate_user_flows` and `/generate_tech_spec`. This means the skill adds little orchestration value beyond file naming and next-step suggestions.

3. **Depth calibration is a hint, not structured.** The skill mentions three depth levels (low, medium, high) as freeform text guidance but provides no structured parameters or templates per depth level. The commands themselves have a single template regardless of depth.

4. **No iterative feedback loop.** The workflow is linear: locate PRD, invoke command, save output, offer next steps. There is no checkpoint where the user reviews wireframes and iterates before finalizing.

5. **Tech spec integration is "optional."** Step 3 says "Optionally Add Technical Spec" but offers no guidance on when it should or should not be included. The user explicitly asked for one here, making it straightforward.

6. **TodoWrite step is disconnected.** Step 6 lists todo items but they are generic checklist items, not connected to actual progress tracking or the quality gates defined at the bottom of the skill.
