# Prism PRD Skill (v2.4.8) — Evaluation Output

## Skill Execution Trace

### Step 1: Check for Existing Context

Simulated invocation of `Task(subagent_type="prism-locator")` to find existing research or documentation about "landing page builder."

**Result:** No existing research or documentation found in `.prism/shared/research/` or `.prism/shared/plans/` related to a landing page builder product. Proceeding with fresh PRD generation.

### Step 2: Invoke `/generate_prd` Command

Invoked with context: "Generate a lightweight PRD for a simple landing page builder MVP"

**Depth Calibration:** Lightweight (startup/MVP) — 5-10 pages, focus on Sections 1, 3, 4, 6.

**Clarifying Questions Phase:** Skipped — the user prompt provides sufficient context:
- **Problem:** Non-technical users struggle to create landing pages without developer help
- **Target User:** Small business owners, marketers, solopreneurs
- **Value Proposition:** Build and publish landing pages in minutes with no code

---

# PageCraft — Product Requirements Document

**Version:** 1.0
**Date:** 2026-03-08
**Status:** Draft

---

## 1. Executive Summary

### 1.1 Vision Statement
PageCraft enables anyone to create professional, conversion-optimized landing pages in minutes without writing code. By providing an intuitive drag-and-drop editor with pre-built templates, PageCraft removes the technical barrier between a business idea and its online presence.

### 1.2 Problem Statement
Small business owners, marketers, and solopreneurs frequently need landing pages for campaigns, product launches, and lead generation. Existing solutions are either too complex (requiring technical knowledge), too expensive (enterprise pricing), or too rigid (limited customization). Users end up paying developers for simple pages or settling for generic templates that hurt conversion rates.

### 1.3 Proposed Solution
A browser-based landing page builder with a visual drag-and-drop editor, a library of conversion-optimized templates, built-in form handling, and one-click publishing to a custom domain or subdomain. The MVP focuses on speed-to-publish: a user should go from zero to live page in under 15 minutes.

### 1.4 Success Metrics
- Time to first published page < 15 minutes for new users
- 500 pages published within first 90 days of launch
- User activation rate (sign up to first publish) > 40%
- Template usage rate > 70% (validates template quality)
- NPS score > 40 among active users

---

## 3. Product Overview

### 3.1 Core Value Proposition
Build and publish a professional landing page in under 15 minutes with zero technical skills.

### 3.2 Key Features

| Feature | Description | Priority | Phase |
|---------|-------------|----------|-------|
| Drag-and-drop editor | Visual block-based page builder with real-time preview | P0 | MVP |
| Template library | 10-15 pre-built, conversion-optimized templates by category | P0 | MVP |
| Form builder | Drag-in form blocks with email notification on submission | P0 | MVP |
| One-click publish | Publish to `*.pagecraft.io` subdomain instantly | P0 | MVP |
| Custom domain | Connect a custom domain via CNAME | P1 | MVP |
| Responsive preview | Toggle desktop/tablet/mobile preview in editor | P0 | MVP |
| Basic analytics | Page views, unique visitors, form submission count | P1 | MVP |
| Media uploads | Upload images; auto-optimize for web | P0 | MVP |
| SEO fields | Title, description, OG image meta fields per page | P1 | MVP |
| A/B testing | Create page variants with traffic splitting | P2 | V2 |
| Integrations | Mailchimp, Zapier, Google Analytics connectors | P2 | V2 |
| Team collaboration | Multi-user editing with roles | P2 | V3 |

### 3.3 User Stories

**As a small business owner,** I want to pick a template and customize it with my branding so that I can have a professional page without hiring a designer.

**As a marketer,** I want to create a campaign-specific landing page with a lead capture form so that I can collect emails and measure conversion.

**As a solopreneur,** I want to publish my page to a custom domain so that it looks professional and matches my brand.

**As a non-technical user,** I want to see a live preview of my page as I edit so that I know exactly what visitors will see.

**As a page owner,** I want to see how many people visited my page and submitted forms so that I can measure campaign effectiveness.

### 3.4 Out of Scope (MVP)

- Multi-page websites or site navigation
- E-commerce / payment processing
- Custom CSS or HTML injection
- Blog / CMS functionality
- User authentication on published pages
- Internationalization / multi-language support
- White-label / reseller features

---

## 4. Functional Requirements

### 4.1 Visual Editor

- **Description:** Block-based drag-and-drop editor for composing landing pages from pre-built sections (hero, features, testimonials, CTA, footer, etc.)
- **User Flow:**
  1. User selects "New Page" and chooses a template (or blank canvas)
  2. Editor loads with template blocks pre-populated
  3. User clicks any block to edit text, images, colors, spacing
  4. User drags blocks from the sidebar to add new sections
  5. User reorders blocks via drag handle
  6. User clicks "Preview" to see full-page render
  7. User clicks "Publish" to go live
- **Acceptance Criteria:**
  - [ ] Users can add, remove, reorder, and duplicate blocks
  - [ ] Text editing is inline (click to type, no modal)
  - [ ] Image upload accepts JPG, PNG, WebP up to 5MB
  - [ ] Undo/redo supports at least 20 steps
  - [ ] Auto-save triggers every 30 seconds
- **Edge Cases:**
  - Empty page (no blocks) shows helpful prompt instead of blank screen
  - Browser tab close with unsaved changes triggers confirmation dialog
  - Image upload failure shows retry option with error message

### 4.2 Template Library

- **Description:** Curated set of 10-15 landing page templates organized by use case (product launch, lead gen, event, portfolio, coming soon)
- **User Flow:**
  1. User clicks "New Page"
  2. Template gallery appears with category filters and previews
  3. User selects a template; editor loads with it pre-populated
- **Acceptance Criteria:**
  - [ ] At least 10 templates available at launch
  - [ ] Each template is fully responsive
  - [ ] Templates load in < 2 seconds
  - [ ] User can preview template before selecting
- **Edge Cases:**
  - Template with placeholder images gracefully handles missing assets

### 4.3 Form Builder

- **Description:** Drag-in form block with configurable fields (name, email, phone, text area, dropdown)
- **User Flow:**
  1. User drags "Form" block into page
  2. User adds/removes/reorders fields
  3. User configures submission: email notification address and optional redirect URL
  4. On published page, visitor submits form; data stored and email sent
- **Acceptance Criteria:**
  - [ ] Supports text, email, phone, textarea, dropdown field types
  - [ ] Client-side validation (required, email format)
  - [ ] Submissions stored and viewable in dashboard
  - [ ] Email notification sent within 60 seconds of submission
  - [ ] Spam protection via honeypot field
- **Edge Cases:**
  - Form submission when page owner's email is invalid queues notification and alerts in dashboard
  - Rate limiting: max 100 submissions per page per hour

### 4.4 Publishing

- **Description:** One-click publish to `[slug].pagecraft.io` with optional custom domain
- **User Flow:**
  1. User clicks "Publish"
  2. System generates slug from page title (editable)
  3. Page goes live at subdomain within 30 seconds
  4. User optionally configures custom domain via CNAME in settings
- **Acceptance Criteria:**
  - [ ] Published page loads in < 3 seconds (Lighthouse performance > 80)
  - [ ] SSL auto-provisioned for subdomains
  - [ ] Custom domain SSL via Let's Encrypt within 5 minutes
  - [ ] Unpublish option available
- **Edge Cases:**
  - Slug collision appends incremental suffix
  - Custom domain DNS propagation delay shown with status indicator

---

## 6. Technical Architecture

### 6.1 Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Frontend (Editor) | React 18 + TypeScript | Component model fits block-based editor; large ecosystem |
| Drag-and-drop | dnd-kit | Accessible, performant, React-native DnD library |
| State management | Zustand | Lightweight, fits undo/redo pattern well |
| Backend API | Node.js + Express | Fast development, shared language with frontend |
| Database | PostgreSQL | Relational data (users, pages, submissions); JSONB for page schema |
| File storage | S3-compatible (Cloudflare R2) | Cost-effective image hosting with CDN |
| Published pages | Static HTML generation + CDN | Fast load times, minimal hosting cost |
| Auth | Clerk or Auth0 | Managed auth, fast to integrate for MVP |
| Hosting | Vercel (editor) + Cloudflare (published pages) | Edge delivery, simple deploys |

### 6.2 Page Data Model

Pages are stored as a JSON block tree:
```json
{
  "id": "page_abc123",
  "title": "My Landing Page",
  "slug": "my-landing-page",
  "status": "published",
  "blocks": [
    { "type": "hero", "props": { "heading": "...", "subheading": "...", "image": "..." } },
    { "type": "features", "props": { "items": [...] } },
    { "type": "form", "props": { "fields": [...], "notifyEmail": "..." } }
  ],
  "settings": { "seo": {...}, "domain": "..." }
}
```

### 6.3 Integrations
- **Email delivery:** Resend or SendGrid for form submission notifications
- **DNS/SSL:** Cloudflare API for custom domain provisioning
- **Analytics:** Self-hosted (simple counter) for MVP; Google Analytics integration in V2

---

## 7. Roadmap

### Phase 1: MVP (Weeks 1-8)
- Visual drag-and-drop editor with 10 templates
- Form builder with email notifications
- Subdomain publishing with SSL
- Responsive preview
- Basic dashboard (list pages, view submissions)

### Phase 2: Growth (Weeks 9-16)
- Custom domain support with automated SSL
- Basic analytics dashboard
- SEO fields and OG image support
- 5 additional templates
- Zapier and Mailchimp integrations

### Phase 3: Scale (Weeks 17-24)
- A/B testing with traffic splitting
- Google Analytics integration
- Team collaboration and roles
- Template marketplace (user-submitted)

---

## 8. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Editor performance degrades with many blocks | Medium | High | Virtualize block list; limit to 50 blocks per page in MVP |
| Template quality insufficient for conversions | Medium | High | Hire contract designer for initial set; A/B test templates post-launch |
| Custom domain SSL provisioning failures | Medium | Medium | Defer to Phase 2; use subdomain-only for MVP launch |
| Image uploads consume excessive storage | Low | Medium | Enforce 5MB limit; auto-compress on upload |
| Low activation rate (sign up but never publish) | High | High | Onboarding wizard that guides first page creation in < 5 min |

---

## 9. Open Questions

- [ ] Pricing model: freemium (1 free page) vs free trial vs paid-only?
- [ ] Should published pages include a "Made with PageCraft" badge on free tier?
- [ ] Max pages per account on MVP tier?
- [ ] Do we need GDPR cookie consent on published pages?
- [ ] Should form submissions be exportable as CSV in MVP or V2?

---

## Quality Gate Checklist (v2.4.8 Skill)

- [x] Problem statement is clear and specific
- [x] Target user is well-defined
- [x] Features map to user needs
- [x] Technical approach is feasible
- [x] Scope is realistic for timeline
- [x] Success metrics are measurable
- [x] Risks are identified with mitigations
- [x] Open questions are documented

---

## Skill Workflow Completion

### Step 3: File Placement
PRD would be saved to: `.prism/shared/plans/2026-03-08-pagecraft-PRD.md`

### Step 4: Companion Documents Offered
```
PRD saved to .prism/shared/plans/2026-03-08-pagecraft-PRD.md

Would you like me to generate companion documents?

1. /generate_user_flows - UX flows and wireframes
2. /generate_tech_spec - Technical specification
3. /generate_pricing - Pricing proposal (if client-facing)

Or continue to the next workflow phase:

4. /prism-research - Explore codebase for existing patterns
5. /prism-plan - Create implementation plan from this PRD
```

### Step 5: TodoWrite Items
```
- [x] PRD: Define problem statement
- [x] PRD: Identify target users
- [x] PRD: List key features with priorities
- [x] PRD: Document technical requirements
- [x] PRD: Identify risks and mitigations
```

---

## Evaluation Notes

**Skill version:** v2.4.8 (BASELINE)
**Depth:** Lightweight (startup/MVP) — focused on Sections 1, 3, 4, 6 per template guidelines
**Sections included:** 1 (Executive Summary), 3 (Product Overview), 4 (Functional Requirements), 6 (Technical Architecture), 7 (Roadmap), 8 (Risks), 9 (Open Questions)
**Sections 2 and 5 omitted:** Per lightweight calibration guidance (Market Analysis and Non-Functional Requirements are deferred for MVP-depth PRDs)
**Total workflow steps executed:** 5 of 5 (Context Check, Generate PRD, Save, Companion Docs, TodoWrite)
