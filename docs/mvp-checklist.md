# RoleReady MVP Checklist

Use this checklist to build V1 in a controlled order.

## Phase 1: Project Baseline

- [ ] Confirm project naming and branding (RoleReady)
- [ ] Add docs folder with core spec files
- [ ] Configure environment variables file template
- [ ] Confirm lint and type-check scripts run clean

## Phase 2: Authentication

- [ ] Add NextAuth (or Auth.js) with Google provider
- [ ] Protect app routes (setup, practice, feedback, dashboard, settings)
- [ ] Add sign-in and sign-out UI
- [ ] Store basic user profile data

## Phase 3: Setup Flow

- [ ] Create setup page form
- [ ] Add resume text input
- [ ] Add job description text input
- [ ] Add target role and level fields
- [ ] Save setup payload to database

## Phase 4: AI Question Generation

- [ ] Create AI service interface
- [ ] Add Gemini adapter implementation
- [ ] Build generate questions endpoint
- [ ] Enforce strict response schema
- [ ] Save generated questions to database

## Phase 5: Practice Session

- [ ] Build question display component
- [ ] Build text answer input
- [ ] Add answer submit endpoint
- [ ] Persist answer and timing metadata
- [ ] Add session progress indicator

## Phase 6: Feedback Engine

- [ ] Build evaluate answer endpoint
- [ ] Return rubric scores (relevance, clarity, depth, communication)
- [ ] Return explanation and improvement tips
- [ ] Return improved answer sample
- [ ] Save feedback report in database

## Phase 7: STAR Tracking

- [ ] Detect Situation
- [ ] Detect Task
- [ ] Detect Action
- [ ] Detect Result
- [ ] Show missing STAR parts in UI
- [ ] Track STAR completion per session
- [ ] Track STAR trend in dashboard

## Phase 8: Dashboard and History

- [ ] Build session history list
- [ ] Show average score trend
- [ ] Show STAR completion trend
- [ ] Show top weak scoring category

## Phase 9: Quality and Safety

- [ ] Add API error handling and retries
- [ ] Add rate limit guard
- [ ] Add data deletion action
- [ ] Add loading and empty states
- [ ] Add basic tests for core flows

## Definition of Done (MVP)

- [ ] User can log in with Google
- [ ] User can run one full practice session
- [ ] User gets AI feedback for all answers
- [ ] Behavioral answers get STAR analysis
- [ ] Dashboard shows progress from stored sessions
