# RoleReady Product Spec (V1)

## Product Vision

RoleReady helps job seekers practice interviews using their resume and a target job description.

The app generates role-specific questions, evaluates answers, and builds STAR method habits over time.

## V1 Goals

1. Enable fast, repeatable interview practice sessions.
2. Give useful and specific AI feedback, not generic advice.
3. Build measurable STAR method consistency for behavioral questions.

## Target User

1. Job seekers applying to specific roles.
2. Users who want personalized practice from real job descriptions.
3. Users who need structured feedback before interviews.

## Core User Flow

1. Sign in with Google.
2. Paste resume.
3. Paste job description.
4. Start a practice session.
5. Answer generated questions.
6. Receive score, STAR analysis, and improvement tips.
7. Review progress history.

## V1 Features

### 1) Authentication

- Google-only login.
- No email/password in V1.

### 2) Setup Input

- Resume input (paste text in V1).
- Job description input (paste text in V1).
- Target role and seniority selection.

### 3) Question Generation

- Create 10 questions per session.
- Mix behavioral and technical questions.
- Mark each question with metadata:
  - Type: behavioral or technical
  - Difficulty: easy, medium, hard
  - STAR recommended: true or false

### 4) Practice and Answer Submission

- Text answers only in V1.
- Question navigation with progress indicator.

### 5) AI Feedback and Scoring

Per answer, return:

1. Relevance score (0-5)
2. Clarity score (0-5)
3. Depth score (0-5)
4. Communication score (0-5)
5. Short reason for each score
6. Two concrete improvement tips
7. Improved answer sample

### 6) STAR Habit Tracking

For behavioral questions:

1. Situation detected: yes or no
2. Task detected: yes or no
3. Action detected: yes or no
4. Result detected: yes or no

Track:

- Per-answer STAR completeness
- Per-session STAR completion rate
- Trend over time

## Non-Goals for V1

1. Voice input
2. Live mock interviewer avatar
3. Multi-provider auth
4. Team or coach accounts
5. Advanced analytics exports

## Page List (V1)

1. Landing page
2. Setup page
3. Practice page
4. Feedback page
5. Dashboard page
6. Settings page

## Design Direction

1. Professional, calm, and confidence-focused.
2. Primary palette:
   - Navy for trust
   - Teal for coaching and action
   - Amber for highlights
3. Keep screens uncluttered and readable.

## Success Metrics

1. Session completion rate
2. Average answer score trend
3. STAR completeness trend
4. Return usage (weekly active users)

## Risks and Mitigation

1. AI feedback quality inconsistency
   - Use strict prompt templates and schema validation.
2. API reliability or rate limits (free tier)
   - Add retry and fallback behavior.
3. Resume data sensitivity
   - Minimize stored data, document deletion flow.

## V1 Release Criteria

1. User can complete full flow from setup to feedback.
2. Every behavioral answer gets STAR analysis.
3. Dashboard shows at least 5 latest session summaries.
4. Basic error handling exists for AI failures.
