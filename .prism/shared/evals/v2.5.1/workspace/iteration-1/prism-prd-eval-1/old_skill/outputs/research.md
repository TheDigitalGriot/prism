# Prism PRD Skill (v2.4.8) — Evaluation Output

## Skill Execution Trace

**Skill:** `prism-prd` (v2.4.8)
**Task:** "Create a PRD for a task management app with kanban boards and team collaboration features"
**Date:** 2026-03-08
**Model:** opus (as specified in SKILL.md frontmatter)

---

## Step 1: Check for Existing Context

Simulated spawning `Task(subagent_type="prism-locator")` to find existing research or documentation about task management apps, kanban boards, or team collaboration.

**Result:** No existing research or documentation found in `.prism/shared/research/` or `.prism/shared/plans/` related to this topic. Proceeding with fresh PRD generation.

---

## Step 2: Invoke `/generate_prd` Command

### 2.1 Gather Context (Clarifying Questions Phase)

The command specifies asking 3-5 clarifying questions. Since the user provided a description ("task management app with kanban boards and team collaboration features"), some context is already available. The command would ask:

1. What specific problem does this solve beyond existing tools like Trello, Jira, or Asana?
2. Who is the primary target user — small teams, enterprise, freelancers?
3. What is the intended business model — SaaS subscription, freemium, open source?
4. Any technical constraints or platform preferences (web-only, mobile, desktop)?
5. Timeline expectations for MVP?

**Simulated user answers** (inferred from task description for eval purposes):
1. Simplified, developer-friendly task management that integrates kanban with real-time collaboration without Jira's complexity.
2. Small to mid-sized software teams (5-50 people).
3. Freemium SaaS with team-based pricing.
4. Web-first, responsive for mobile.
5. 3-month MVP timeline.

### 2.2 Research Phase

Web search availability: Not available in this eval context. Competitor analysis based on general knowledge.

### 2.3 Generated PRD Document

---

# TaskFlow — Product Requirements Document

**Version:** 1.0
**Date:** 2026-03-08
**Status:** Draft

---

## 1. Executive Summary

### 1.1 Vision Statement
TaskFlow is a modern task management platform that combines intuitive kanban boards with real-time team collaboration, designed for software teams who need the structure of project management without the overhead of enterprise tools. It prioritizes speed, simplicity, and seamless teamwork.

### 1.2 Problem Statement
Small to mid-sized software teams face a dilemma: lightweight tools like Trello lack workflow customization and team collaboration depth, while enterprise tools like Jira impose excessive configuration overhead and steep learning curves. Teams need a tool that is powerful enough for structured workflows but simple enough to adopt in minutes.

### 1.3 Proposed Solution
A web-based task management application featuring drag-and-drop kanban boards, customizable workflows, real-time collaboration (presence, comments, mentions), and lightweight integrations with developer tools (GitHub, Slack). The product prioritizes fast onboarding and minimal configuration.

### 1.4 Success Metrics
- **Adoption:** 1,000 active teams within 6 months of launch
- **Engagement:** 70% weekly active user retention (DAU/WAU)
- **Task throughput:** Average team completes 20+ tasks per week
- **Time to value:** New user creates first board and adds a task within 2 minutes
- **NPS:** Net Promoter Score of 40+ within first year

---

## 2. Market Analysis

### 2.1 Target Market
The project management software market is valued at approximately $6.7B (2025) with 13% CAGR. The segment of interest is small-to-mid-sized team collaboration tools, representing roughly $1.5B SAM. TaskFlow targets the underserved niche of developer-centric teams wanting kanban simplicity with collaboration depth.

- **TAM:** $6.7B (global project management software)
- **SAM:** $1.5B (SMB team collaboration tools)
- **SOM:** $15M (initial target within 3 years)

### 2.2 Target Users

**Persona 1: Team Lead / Engineering Manager**
- Demographics: 28-45, manages 5-15 engineers
- Needs: Sprint visibility, workload distribution, status reporting
- Pain points: Too much time configuring Jira, context-switching between tools

**Persona 2: Individual Contributor / Developer**
- Demographics: 22-40, writes code daily
- Needs: Quick task capture, clear priorities, minimal interruption
- Pain points: Overhead of updating task status, unclear priorities

**Persona 3: Product Manager**
- Demographics: 26-42, cross-functional collaborator
- Needs: Roadmap visibility, stakeholder updates, feature tracking
- Pain points: Separate tools for planning vs execution

### 2.3 Competitive Landscape

| Competitor | Strengths | Weaknesses | Differentiator |
|------------|-----------|------------|----------------|
| Trello | Simple, visual, free tier | Limited workflow customization, weak reporting | TaskFlow offers customizable workflows + real-time collab |
| Jira | Powerful, enterprise-grade | Complex setup, slow UI, steep learning curve | TaskFlow is 10x simpler to configure |
| Linear | Fast, developer-focused | Limited collaboration, opinionated workflow | TaskFlow adds richer team collaboration features |
| Asana | Good for cross-functional teams | Less developer-focused, expensive at scale | TaskFlow is built for engineering teams specifically |
| Notion | Flexible, docs + tasks | Not purpose-built for task management, slow | TaskFlow is purpose-built and performant |

### 2.4 Market Opportunity
- Remote and hybrid work has increased demand for real-time collaboration tools
- Developer experience (DX) is a growing priority; teams reject tools with poor UX
- Consolidation fatigue: teams want fewer, better-integrated tools
- AI-assisted features (auto-categorization, smart assignments) are an emerging differentiator

---

## 3. Product Overview

### 3.1 Core Value Proposition
TaskFlow gives software teams kanban-based task management with real-time collaboration — powerful enough for structured workflows, simple enough to start in 2 minutes.

### 3.2 Key Features

| Feature | Description | Priority | Phase |
|---------|-------------|----------|-------|
| Kanban Boards | Drag-and-drop boards with customizable columns | P0 | MVP |
| Task Cards | Rich task cards with descriptions, labels, due dates, assignees | P0 | MVP |
| Real-time Collaboration | Live cursors, presence indicators, instant updates | P0 | MVP |
| Comments & Mentions | Threaded comments with @mentions and notifications | P0 | MVP |
| Team Workspaces | Multi-team support with role-based access | P0 | MVP |
| Custom Workflows | Configurable column states and transition rules | P1 | MVP |
| Filters & Search | Filter by assignee, label, due date; full-text search | P1 | MVP |
| GitHub Integration | Link PRs/commits to tasks, auto-update status | P1 | V2 |
| Slack Integration | Notifications, task creation from Slack | P1 | V2 |
| Reporting Dashboard | Velocity charts, cycle time, burndown | P1 | V2 |
| Automations | Rule-based triggers (e.g., move to Done when PR merged) | P2 | V2 |
| Mobile Responsive | Full functionality on mobile browsers | P2 | V2 |
| API & Webhooks | Public REST API for custom integrations | P2 | V3 |
| AI Task Suggestions | Smart assignment, duplicate detection, priority suggestions | P2 | V3 |

### 3.3 User Stories

**Board Management**
- As a team lead, I want to create multiple boards for different projects so that work is organized by context.
- As a team lead, I want to customize board columns so that they match our team's workflow stages.

**Task Management**
- As a developer, I want to drag tasks between columns so that I can quickly update status without forms.
- As a developer, I want to add labels and due dates to tasks so that I can prioritize my work.
- As a developer, I want to assign tasks to myself or teammates so that ownership is clear.

**Collaboration**
- As a team member, I want to see who is currently viewing the same board so that I know who is active.
- As a team member, I want to comment on tasks and mention colleagues so that discussions stay in context.
- As a PM, I want to receive notifications when tasks I watch are updated so that I stay informed without checking manually.

**Organization**
- As a team lead, I want to filter the board by assignee so that I can see individual workloads.
- As an admin, I want to invite team members and set roles so that access is controlled.

### 3.4 Out of Scope
- Native mobile apps (V2+ consideration)
- Time tracking / billing features
- Gantt charts or timeline views (V2+ consideration)
- Video/audio conferencing
- Document editing (wiki/docs)
- White-label / self-hosted deployment (V3+ consideration)

---

## 4. Functional Requirements

### 4.1 Kanban Board Engine
- **Description:** Core board system with drag-and-drop columns and cards
- **User Flow:**
  1. User creates a new board and names it
  2. Default columns appear (Backlog, To Do, In Progress, Review, Done)
  3. User customizes columns (add, remove, rename, reorder)
  4. User creates task cards within columns
  5. User drags cards between columns to update status
- **Acceptance Criteria:**
  - [ ] Boards load in under 500ms
  - [ ] Drag-and-drop works on desktop and tablet browsers
  - [ ] Column order persists across sessions
  - [ ] Board supports 500+ cards without performance degradation
  - [ ] Undo support for accidental moves (Ctrl+Z)
- **Edge Cases:**
  - Moving a card while another user is editing it
  - Deleting a column that contains cards (prompt to move or archive)
  - Board with 0 columns (require minimum 1)

### 4.2 Real-time Collaboration
- **Description:** Live presence and instant sync across all connected users
- **User Flow:**
  1. User opens a board
  2. Avatars of other active users appear in the header
  3. When another user moves a card, the change appears instantly
  4. When another user is typing a comment, a typing indicator shows
- **Acceptance Criteria:**
  - [ ] Changes propagate to all connected clients within 200ms
  - [ ] Presence indicators show/hide within 3 seconds of connect/disconnect
  - [ ] Conflict resolution handles simultaneous card moves gracefully
  - [ ] Works with up to 50 concurrent users per board
- **Edge Cases:**
  - Network disconnect and reconnect (queue changes, sync on reconnect)
  - Two users moving the same card simultaneously (last-write-wins with notification)

### 4.3 Team & Access Management
- **Description:** Workspace creation, team invitations, and role-based permissions
- **User Flow:**
  1. User creates a workspace and names it
  2. User invites team members via email
  3. User assigns roles (Admin, Member, Viewer)
  4. Permissions gate actions (Viewers cannot edit, Members cannot manage team)
- **Acceptance Criteria:**
  - [ ] Email invitations sent within 30 seconds
  - [ ] Role changes take effect immediately
  - [ ] Admins can transfer ownership
  - [ ] Users can belong to multiple workspaces
- **Edge Cases:**
  - Inviting a user who already has an account vs a new user
  - Removing the last admin (block action with warning)
  - Revoking access while user is actively viewing a board

### 4.4 Comments & Notifications
- **Description:** Threaded comments on task cards with @mention notifications
- **User Flow:**
  1. User opens a task card
  2. User writes a comment, optionally @mentioning teammates
  3. Mentioned users receive in-app and email notifications
  4. Users can reply to comments, creating threads
- **Acceptance Criteria:**
  - [ ] @mention autocomplete shows team members as user types
  - [ ] Notifications delivered within 5 seconds (in-app) and 60 seconds (email)
  - [ ] Comment history is preserved and paginated (load more)
  - [ ] Markdown formatting supported in comments
- **Edge Cases:**
  - Mentioning a user who has been removed from the workspace
  - Editing or deleting a comment after others have replied

---

## 5. Non-Functional Requirements

### 5.1 Performance
- Page load time: < 2 seconds (P95)
- Board interaction latency: < 100ms for local actions
- Real-time sync: < 200ms propagation
- API response time: < 300ms (P95)
- Availability: 99.9% uptime SLA

### 5.2 Security
- Authentication: Email/password + OAuth (Google, GitHub)
- Session management: JWT with refresh tokens, 30-day expiry
- Data protection: AES-256 encryption at rest, TLS 1.3 in transit
- RBAC: Role-based access control at workspace and board level
- Audit log: Track all permission changes and deletions

### 5.3 Compliance
- GDPR: Data export, right to deletion, consent management
- SOC 2 Type II: Target for Year 2
- CCPA: California consumer privacy compliance

### 5.4 Scalability
- Support 10,000 concurrent users at launch
- Horizontal scaling for real-time WebSocket connections
- Database sharding strategy for multi-tenant isolation

---

## 6. Technical Architecture

### 6.1 Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Frontend | React 19 + TypeScript | Component ecosystem, type safety, team familiarity |
| State Management | Zustand | Lightweight, minimal boilerplate |
| Real-time | WebSockets (Socket.IO) | Bidirectional real-time communication |
| Backend | Node.js + Express | JavaScript full-stack, async I/O for real-time |
| Database | PostgreSQL | Relational integrity for teams/permissions, JSONB for flexible card data |
| Cache | Redis | Session store, real-time presence, pub/sub |
| Search | PostgreSQL full-text (MVP), Elasticsearch (V2) | Start simple, scale when needed |
| Auth | Auth0 or Clerk | Managed auth reduces security risk |
| Hosting | AWS (ECS + RDS + ElastiCache) | Scalable, well-documented |
| CI/CD | GitHub Actions | Integrated with source control |

### 6.2 Integrations
- **GitHub:** OAuth app for PR/commit linking (V2)
- **Slack:** Slack app for notifications and slash commands (V2)
- **Email:** SendGrid or AWS SES for transactional emails
- **Webhooks:** Outbound webhooks for third-party automation (V3)

---

## 7. Roadmap

### Phase 1: MVP (Months 1-3)
- Kanban boards with drag-and-drop
- Task cards (title, description, assignee, labels, due dates)
- Real-time collaboration (presence, live updates)
- Comments with @mentions
- Team workspaces with invitations and roles
- Custom column workflows
- Filters and search
- Email/password and Google OAuth authentication

### Phase 2: Integrations & Insights (Months 4-6)
- GitHub integration (PR linking, auto-status)
- Slack integration (notifications, task creation)
- Reporting dashboard (velocity, cycle time, burndown)
- Rule-based automations
- Mobile-responsive design
- Board templates

### Phase 3: Platform & Intelligence (Months 7-12)
- Public REST API and webhooks
- AI-powered task suggestions and duplicate detection
- Advanced permissions (guest access, board-level roles)
- Timeline / Gantt view
- Data export (CSV, JSON)
- SOC 2 compliance

---

## 8. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Real-time sync complexity causes bugs | High | High | Use proven libraries (Socket.IO), invest in integration tests, implement optimistic UI with rollback |
| Market saturation (many competitors) | High | Medium | Differentiate on DX and speed; target developer-centric teams specifically |
| Slow adoption / low retention | Medium | High | Focus on time-to-value; onboarding flow should create first board in < 2 minutes |
| Security breach / data leak | Low | High | Use managed auth provider, encrypt all data, schedule penetration testing pre-launch |
| WebSocket scaling challenges | Medium | Medium | Redis pub/sub for horizontal scaling; load test with 10x expected users |
| Scope creep delays MVP | Medium | High | Strict P0-only scope for Phase 1; defer all P1+ features |
| Key personnel dependency | Medium | Medium | Document architecture decisions; pair programming on critical systems |

---

## 9. Open Questions

- [ ] Should we support SSO (SAML) in MVP or defer to V2?
- [ ] What is the free tier limit — number of boards, team members, or both?
- [ ] Should we build our own auth or use a managed provider (Auth0/Clerk)?
- [ ] Do we need offline support for the MVP?
- [ ] What analytics/telemetry tool should we integrate from day one?
- [ ] Should board data use a CRDT model for conflict resolution or simple last-write-wins?
- [ ] Is there a target price point for the paid tier?

---

## Step 3: File Placement

Per the v2.4.8 skill instructions, the PRD would be saved to:
```
.prism/shared/plans/2026-03-08-taskflow-PRD.md
```

(In this eval, the output is saved to the eval workspace instead.)

---

## Step 4: Companion Documents Offered

After PRD generation, the v2.4.8 skill presents the following options:

```
PRD saved to .prism/shared/plans/2026-03-08-taskflow-PRD.md

Would you like me to generate companion documents?

1. /generate_user_flows - UX flows and wireframes
2. /generate_tech_spec - Technical specification
3. /generate_pricing - Pricing proposal (if client-facing)

Or continue to the next workflow phase:

4. /prism-research - Explore codebase for existing patterns
5. /prism-plan - Create implementation plan from this PRD
```

---

## Step 5: TodoWrite Tracking

The skill specifies adding tracking items:

```
- [x] PRD: Define problem statement
- [x] PRD: Identify target users
- [x] PRD: List key features with priorities
- [x] PRD: Document technical requirements
- [x] PRD: Identify risks and mitigations
```

All quality gates passed.

---

## Quality Gates Verification

- [x] Problem statement is clear and specific
- [x] Target user is well-defined (3 personas)
- [x] Features map to user needs (user stories linked to features)
- [x] Technical approach is feasible (standard web stack)
- [x] Scope is realistic for timeline (3-month MVP)
- [x] Success metrics are measurable (5 KPIs with targets)
- [x] Risks are identified with mitigations (7 risks)
- [x] Open questions are documented (7 questions)

---

## Evaluation Notes

### What the v2.4.8 Skill Did Well
- Clear 5-step workflow with logical progression
- Integration with prism workflow (research -> plan pipeline)
- Quality gates provide a checklist for completeness
- Companion document suggestions add value
- Depth calibration (lightweight/standard/enterprise) is a useful knob

### Observations About v2.4.8 Behavior
- **Step 1** (prism-locator check) is useful but lightweight — it only checks for existing docs, no deeper analysis
- **Step 2** delegates entirely to `/generate_prd` command — the skill itself is thin orchestration
- **Step 3** specifies file placement convention clearly
- **Step 4** offers next steps but does not auto-execute anything
- **Step 5** references TodoWrite for tracking, which ties into session state management
- The skill assumes an interactive conversation (clarifying questions before generation), which in a non-interactive eval means simulating user responses
- The PRD template is comprehensive and well-structured with all standard sections
- No research agent integration beyond prism-locator — no codebase-analyzer or web-search-researcher spawning
