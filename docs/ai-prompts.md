# RoleReady AI Prompt Templates (V1)

These templates are starter prompts for Gemini integration.

Keep prompts versioned when changes are made.

## General Rules for All AI Calls

1. Return valid JSON only.
2. Do not include markdown fences.
3. Keep language clear and concise.
4. Feedback must be specific to the role context.

## 1) Question Generation Prompt

### Purpose

Generate interview questions based on resume and job description.

### Input

- roleTitle
- seniority
- resumeText
- jobDescriptionText
- totalQuestions (default 10)
- behavioralRatio (default 0.6)

### Prompt Template

You are an expert interview coach.
Generate role-specific interview questions from the candidate resume and target job description.

Requirements:
1. Return exactly {{totalQuestions}} questions.
2. Use behavioral ratio close to {{behavioralRatio}}.
3. Each question must include:
   - id
   - question
   - type (behavioral or technical)
   - difficulty (easy, medium, hard)
   - starRecommended (boolean)
4. Questions must be realistic and non-repetitive.
5. Match expected responsibilities and skills from the job description.

Candidate resume:
{{resumeText}}

Target job description:
{{jobDescriptionText}}

Return JSON only with this schema:
{
  "questions": [
    {
      "id": "q1",
      "question": "...",
      "type": "behavioral",
      "difficulty": "medium",
      "starRecommended": true
    }
  ]
}

## 2) Answer Evaluation Prompt

### Purpose

Score and coach an answer for one question.

### Input

- roleTitle
- question
- questionType
- answerText
- resumeText
- jobDescriptionText

### Prompt Template

You are a strict but supportive interview evaluator.
Evaluate the candidate answer for this target role.

Scoring rubric (0 to 5):
1. relevance
2. clarity
3. depth
4. communication

Return:
1. score object
2. short rationale per score
3. two concrete improvement tips
4. one improved sample answer

Context:
Role: {{roleTitle}}
Question type: {{questionType}}
Question: {{question}}
Candidate answer: {{answerText}}
Resume: {{resumeText}}
Job description: {{jobDescriptionText}}

Return JSON only with this schema:
{
  "scores": {
    "relevance": 0,
    "clarity": 0,
    "depth": 0,
    "communication": 0
  },
  "reasons": {
    "relevance": "...",
    "clarity": "...",
    "depth": "...",
    "communication": "..."
  },
  "improvementTips": ["...", "..."],
  "improvedAnswer": "..."
}

## 3) STAR Detection Prompt

### Purpose

Detect STAR components for behavioral answers.

### Input

- question
- answerText

### Prompt Template

You are an interview coach checking STAR structure.
Analyze if the answer includes the STAR components.

Definitions:
- Situation: context and background
- Task: responsibility or challenge
- Action: what candidate did
- Result: measurable or clear outcome

Question: {{question}}
Answer: {{answerText}}

Return JSON only with this schema:
{
  "situation": {
    "present": true,
    "evidence": "..."
  },
  "task": {
    "present": false,
    "evidence": ""
  },
  "action": {
    "present": true,
    "evidence": "..."
  },
  "result": {
    "present": false,
    "evidence": ""
  },
  "missingParts": ["task", "result"],
  "coachTip": "..."
}

## 4) Validation and Fallback Rules

1. If JSON parse fails, retry once with a repair prompt.
2. If retry fails, return safe fallback response:
   - neutral score values
   - generic improvement suggestions
   - non-blocking UX message
3. Log prompt version and model name for each response.

## 5) Versioning

Use a version tag format:

- questionPromptVersion: qg-v1
- answerPromptVersion: eval-v1
- starPromptVersion: star-v1

Update version tags on every prompt change.
