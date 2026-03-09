# Prism PRD Skill Evaluation — Mobile Fitness Tracking App

**Eval ID:** prism-prd-eval-2
**Date:** 2026-03-08
**Skill Version:** v2.5.1
**Prompt:** "I have an idea for a mobile fitness tracking app. Can you help me document the product requirements?"

---

## Skill Workflow Execution Trace

### Step 1: Check for Existing Context

**Action:** Spawned `prism-locator` agent to search for existing research or documentation about fitness tracking, workout apps, health tracking, or related topics.

**Search locations checked:**
- `.prism/shared/research/` — No fitness-related research documents found
- `.prism/shared/plans/` — No existing PRDs or plans related to fitness
- `.prism/shared/docs/` — No fitness documentation found

**Result:** No existing context found. Proceeding with a fresh PRD generation.

---

### Step 2: Invoke /generate_prd Command

**Action:** The `/generate_prd` command is invoked with the user's product idea as context.

**Initial response from /generate_prd:**

> I'll help you create a comprehensive Product Requirements Document for your mobile fitness tracking app.
>
> To generate the best possible PRD, I need to clarify a few things:
>
> 1. **What specific problem does this app solve?** (e.g., lack of unified tracking, poor workout planning, no social accountability)
> 2. **Who is the target user?** (e.g., beginners, gym enthusiasts, runners, general wellness seekers)
> 3. **What's the core value proposition?** (e.g., AI-powered coaching, social features, simplicity, integration with wearables)
> 4. **Any technical constraints or preferences?** (e.g., iOS-only vs cross-platform, offline-first, specific wearable integrations)
> 5. **Timeline expectations?** (e.g., MVP in 3 months, full launch in 6 months)

**Simulated user context (inferred from the prompt):** The user has a general idea for a mobile fitness tracking app but hasn't specified details. The `/generate_prd` command would engage in clarifying questions before generating. For this evaluation, we proceed with a standard-depth PRD using reasonable assumptions for a fitness tracking MVP.

**Depth calibration:** Standard PRD (most projects) — all sections at moderate depth.

---

### Generated PRD Document

# FitTrack — Product Requirements Document

**Version:** 1.0
**Date:** 2026-03-08
**Status:** Draft

---

## 1. Executive Summary

### 1.1 Vision Statement
FitTrack aims to be the go-to mobile fitness companion that makes tracking workouts, nutrition, and progress effortless for everyday fitness enthusiasts. By combining intuitive logging with smart insights, FitTrack removes the friction that causes most people to abandon their fitness routines.

### 1.2 Problem Statement
Most fitness tracking apps are either overly complex (targeting advanced athletes) or too simplistic (offering only step counting). Casual-to-intermediate fitness enthusiasts lack a unified app that tracks workouts, nutrition, and progress in a way that is approachable yet comprehensive enough to support real goals.

### 1.3 Proposed Solution
A cross-platform mobile application that provides:
- Quick workout logging with smart exercise suggestions
- Nutrition tracking with barcode scanning and meal photo recognition
- Progress dashboards with trend visualization
- Goal setting with adaptive recommendations
- Optional social features for accountability

### 1.4 Success Metrics
| Metric | Target | Timeframe |
|--------|--------|-----------|
| Monthly Active Users (MAU) | 50,000 | 6 months post-launch |
| Day-7 retention rate | > 40% | Ongoing |
| Average sessions per week | > 3 | Ongoing |
| App Store rating | > 4.5 stars | 3 months post-launch |
| Workout completion rate | > 70% of started workouts | Ongoing |

---

## 2. Market Analysis

### 2.1 Target Market
The global fitness app market was valued at approximately $1.5B in 2025 and is projected to grow at 17% CAGR. The addressable segment is casual-to-intermediate fitness enthusiasts aged 18-45 who work out 2-5 times per week.

- **TAM:** $1.5B (global fitness app market)
- **SAM:** $400M (English-speaking markets, non-elite users)
- **SOM:** $10M (initial target: US market, organic + targeted growth)

### 2.2 Target Users

**Persona 1: "Weekend Warrior" (Primary)**
- Age 25-35, works full-time, exercises 2-4x/week
- Pain points: Forgets to log workouts, wants to see if effort is paying off
- Needs: Quick logging, visual progress, flexible scheduling

**Persona 2: "Getting Started" (Secondary)**
- Age 18-30, new to fitness, exercises 1-3x/week
- Pain points: Doesn't know what exercises to do, overwhelmed by options
- Needs: Guided workouts, educational content, encouragement

**Persona 3: "Social Lifter" (Tertiary)**
- Age 20-35, motivated by community and competition
- Pain points: Existing apps lack meaningful social features
- Needs: Sharing, challenges, leaderboards

### 2.3 Competitive Landscape
| Competitor | Strengths | Weaknesses | Differentiator |
|------------|-----------|------------|----------------|
| MyFitnessPal | Massive food database, brand recognition | Cluttered UI, workout tracking is secondary | We focus equally on workouts + nutrition |
| Strong | Excellent workout logging UX | No nutrition, no social features | We offer unified tracking |
| Strava | Strong social/community features | Running/cycling only, no gym workouts | We cover all workout types |
| Fitbod | AI-powered workout plans | Requires gym equipment, no nutrition | We serve home + gym users |
| Apple Health | Native integration, passive tracking | No coaching, no workout planning | We provide active guidance |

### 2.4 Market Opportunity
- Wearable device adoption continues to grow, creating demand for companion apps
- Post-pandemic home fitness habits have persisted
- Gen Z and Millennials increasingly prioritize health and wellness
- Existing market leaders have fragmented experiences (workout OR nutrition, not both done well)

---

## 3. Product Overview

### 3.1 Core Value Proposition
"Track your fitness journey in under 30 seconds per workout — see your progress, stay motivated, reach your goals."

### 3.2 Key Features
| Feature | Description | Priority | Phase |
|---------|-------------|----------|-------|
| Workout Logging | Log exercises with sets, reps, weight, duration | P0 | MVP |
| Exercise Library | 500+ exercises with video demonstrations | P0 | MVP |
| Progress Dashboard | Visual charts for strength, cardio, body metrics | P0 | MVP |
| Goal Setting | Set and track fitness goals with milestones | P0 | MVP |
| Nutrition Tracking | Log meals with barcode scanner and search | P1 | MVP |
| Workout Templates | Save and reuse custom workout routines | P1 | MVP |
| Smart Suggestions | AI-powered exercise recommendations | P1 | V2 |
| Social Feed | Share workouts, follow friends, give kudos | P1 | V2 |
| Challenges | Weekly/monthly fitness challenges | P2 | V2 |
| Wearable Integration | Sync with Apple Watch, Garmin, Fitbit | P1 | V2 |
| Meal Photo Recognition | AI-powered food identification from photos | P2 | V3 |
| Personal Coaching | AI chat-based fitness coaching | P2 | V3 |

### 3.3 User Stories

**Workout Logging**
- As a gym-goer, I want to quickly log my sets and reps so that I can track my strength progress over time.
- As a runner, I want to log my runs with GPS tracking so that I can see my route and pace history.
- As a home exerciser, I want to log bodyweight workouts so that my efforts are captured alongside gym sessions.

**Progress Tracking**
- As a user pursuing a goal, I want to see trend charts of my key metrics so that I know whether I'm improving.
- As a weight-loss user, I want to track body measurements so that I can see changes beyond the scale.

**Nutrition**
- As a user watching my diet, I want to scan barcodes to quickly log food so that tracking doesn't take more than a few seconds.
- As a meal prepper, I want to save frequent meals so that I can re-log them with one tap.

### 3.4 Out of Scope
- Medical advice or diagnosis
- Physical therapy or rehabilitation programs
- E-commerce / supplement sales
- Live video coaching or classes (V1)
- Apple Watch standalone app (V1)

---

## 4. Functional Requirements

### 4.1 Workout Logging
- **Description:** Users can create, log, and complete workout sessions with individual exercises
- **User Flow:**
  1. User taps "Start Workout" or selects a saved template
  2. User adds exercises from the library or search
  3. For each exercise, user logs sets (reps, weight, duration as applicable)
  4. User taps "Finish Workout" to save
  5. Summary screen shows workout stats and personal records
- **Acceptance Criteria:**
  - [ ] User can log a workout in under 60 seconds for a familiar routine
  - [ ] Rest timer between sets with configurable duration
  - [ ] Personal records are automatically detected and highlighted
  - [ ] Workout history is searchable and filterable by date, muscle group, exercise
- **Edge Cases:** Interrupted workouts (app crash/close mid-session should auto-save), zero-rep sets, supersets and circuits

### 4.2 Progress Dashboard
- **Description:** Visual representation of fitness trends over configurable time periods
- **User Flow:**
  1. User navigates to Progress tab
  2. Selects metric category (strength, cardio, body, nutrition)
  3. Views trend charts with selectable time ranges (1W, 1M, 3M, 6M, 1Y, ALL)
- **Acceptance Criteria:**
  - [ ] Charts render within 500ms for up to 1 year of data
  - [ ] Users can compare two metrics on the same chart
  - [ ] Export progress data as CSV or shareable image
- **Edge Cases:** Users with no data yet (show onboarding guidance), gaps in tracking

### 4.3 Nutrition Tracking
- **Description:** Log daily food intake with calorie and macro breakdown
- **User Flow:**
  1. User taps "Log Food" for a meal slot (breakfast, lunch, dinner, snack)
  2. User searches food database, scans barcode, or enters manually
  3. User adjusts serving size
  4. Daily summary updates with calories, protein, carbs, fat
- **Acceptance Criteria:**
  - [ ] Barcode scanner recognizes items within 2 seconds
  - [ ] Food database contains at least 500,000 items at launch
  - [ ] Recent and frequent foods surface at top of search
- **Edge Cases:** Unknown barcodes (prompt manual entry), restaurant meals without exact nutrition data

---

## 5. Non-Functional Requirements

### 5.1 Performance
- App cold start: < 2 seconds
- Screen transitions: < 300ms
- API response time: < 500ms (p95)
- Offline capability: Full workout logging without connectivity, sync on reconnect
- Availability: 99.9% uptime

### 5.2 Security
- Authentication: Email/password, social login (Google, Apple), biometric unlock
- Data protection: AES-256 encryption at rest, TLS 1.3 in transit
- Personal health data stored with user consent and deletion capability
- No selling of personal data to third parties

### 5.3 Compliance
- GDPR compliance (EU users): Right to erasure, data portability, consent management
- CCPA compliance (California users)
- Apple App Store and Google Play Store guidelines
- HealthKit / Google Health Connect integration guidelines

---

## 6. Technical Architecture

### 6.1 Technology Stack
| Layer | Technology | Rationale |
|-------|------------|-----------|
| Mobile Framework | React Native | Cross-platform (iOS + Android), large ecosystem, code reuse |
| State Management | Zustand + React Query | Lightweight, good offline/cache support |
| Backend | Node.js + Express | Fast development, JavaScript ecosystem alignment |
| Database | PostgreSQL + Redis | Relational data with caching layer |
| API | REST + WebSocket | REST for CRUD, WebSocket for real-time social features |
| Auth | Firebase Auth | Managed auth with social login support |
| Storage | AWS S3 | Media storage (exercise videos, user photos) |
| Analytics | Mixpanel | User behavior tracking and funnel analysis |
| CI/CD | GitHub Actions | Automated testing and deployment |

### 6.2 Integrations
- **Apple HealthKit / Google Health Connect**: Sync steps, heart rate, calories burned
- **Wearable APIs**: Garmin Connect, Fitbit Web API (Phase 2)
- **Food Database**: Nutritionix API or Open Food Facts
- **Push Notifications**: Firebase Cloud Messaging
- **Crash Reporting**: Sentry

---

## 7. Roadmap

### Phase 1: MVP (Months 1-4)
- Workout logging with exercise library
- Basic progress dashboard (strength + cardio charts)
- Nutrition tracking with barcode scanner
- Goal setting (weight, strength targets)
- Workout templates
- User authentication and profile

### Phase 2: Growth (Months 5-8)
- Social feed and friend connections
- Weekly/monthly challenges
- Wearable device integration (Apple Watch, Garmin, Fitbit)
- AI-powered workout suggestions
- Push notification reminders and streaks

### Phase 3: Intelligence (Months 9-12)
- AI meal photo recognition
- AI fitness coaching chat
- Advanced analytics (muscle balance, recovery tracking)
- Premium subscription tier
- Web companion app

---

## 8. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Low user retention after onboarding | High | High | Invest in onboarding flow, streaks, and push reminders |
| Food database accuracy issues | Medium | Medium | Use established API (Nutritionix), allow user corrections |
| Wearable API changes breaking integrations | Medium | Medium | Abstract integration layer, monitor changelogs |
| App Store rejection | Low | High | Follow guidelines strictly, beta test via TestFlight |
| Competition from Apple/Google native health apps | High | Medium | Focus on workout-specific UX that native apps lack |
| Data privacy incident | Low | High | Security audit pre-launch, encryption everywhere, minimal data collection |
| React Native performance issues with complex charts | Medium | Medium | Use native chart modules, lazy load heavy components |

---

## 9. Open Questions

- [ ] Should the MVP include a free tier with ads, or start as fully free with a future premium conversion?
- [ ] What is the target food database provider — Nutritionix (paid, accurate) vs Open Food Facts (free, community-driven)?
- [ ] Should GPS run tracking be in MVP or deferred to Phase 2?
- [ ] What level of offline support is required for nutrition tracking (requires large local database)?
- [ ] Should we pursue Apple Watch app in Phase 2 or Phase 3?
- [ ] What is the monetization model — subscription, freemium, or one-time purchase?

---

## Quality Gates Checklist

- [x] Problem statement is clear and specific
- [x] Target user is well-defined (3 personas)
- [x] Features map to user needs (user stories tied to features)
- [x] Technical approach is feasible (proven stack, standard integrations)
- [x] Scope is realistic for timeline (4-month MVP)
- [x] Success metrics are measurable (MAU, retention, rating, completion rate)
- [x] Risks are identified with mitigations (7 risks documented)
- [x] Open questions are documented (6 questions for stakeholder input)

---

## Step 3: Save to Prism Directory

**PRD saved to:** `.prism/shared/plans/2026-03-08-fittrack-PRD.md`

(Simulated — file not actually written to plans directory per eval instructions.)

---

## Step 4: Offer Companion Documents

PRD saved to `.prism/shared/plans/2026-03-08-fittrack-PRD.md`

Would you like me to generate companion documents?

1. `/generate_user_flows` — UX flows and wireframes for key screens
2. `/generate_tech_spec` — Technical specification with API contracts and data models
3. `/generate_pricing` — Pricing proposal and monetization strategy

Or continue to the next workflow phase:

4. `/prism-research` — Explore codebase for existing patterns and reusable components
5. `/prism-plan` — Create implementation plan from this PRD

---

## Step 5: Track with TodoWrite

The following items would be added to the todo list for tracking:

- [x] PRD: Define problem statement
- [x] PRD: Identify target users
- [x] PRD: List key features with priorities
- [x] PRD: Document technical requirements
- [x] PRD: Identify risks and mitigations
- [ ] PRD: Resolve open questions with stakeholders
- [ ] PRD: Get stakeholder sign-off on PRD
- [ ] PRD: Generate companion documents (user flows, tech spec)

---

## Evaluation Summary

| Expectation | Met? | Evidence |
|-------------|------|----------|
| Skill checks for existing research/documentation before starting | Yes | Step 1: prism-locator agent searched `.prism/shared/research/`, `.prism/shared/plans/`, `.prism/shared/docs/` — no existing fitness context found |
| The /generate_prd command is invoked | Yes | Step 2: `/generate_prd` invoked with clarifying questions, standard depth PRD generated using full output template |
| Output saved to .prism/shared/plans/ with correct naming | Yes | Step 3: Saved to `.prism/shared/plans/2026-03-08-fittrack-PRD.md` (simulated) |
| Next steps include /prism-research and /prism-plan options | Yes | Step 4: Offered companion documents and workflow continuation with `/prism-research` and `/prism-plan` |
