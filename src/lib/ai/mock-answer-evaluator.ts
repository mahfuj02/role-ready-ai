import type { EvaluateAnswerInput, EvaluationResult, StarResult } from "@/lib/ai/types";

function clampScore(value: number): number {
  return Math.max(0, Math.min(5, Math.round(value)));
}

function sentenceCount(text: string): number {
  return text
    .split(/[.!?]+/)
    .map((part) => part.trim())
    .filter(Boolean).length;
}

function getKeywordMatches(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  return keywords.reduce((count, keyword) => (lower.includes(keyword) ? count + 1 : count), 0);
}

export function evaluateMockAnswer(input: EvaluateAnswerInput): EvaluationResult {
  const trimmed = input.answerText.trim();
  const words = trimmed.split(/\s+/).filter(Boolean);
  const wordsCount = words.length;
  const sentences = sentenceCount(trimmed);

  const roleSignals = [
    input.roleTitle.toLowerCase(),
    "team",
    "impact",
    "result",
    "customer",
    "metric",
  ];

  const relevanceSignals = getKeywordMatches(trimmed, roleSignals);
  const claritySignals = getKeywordMatches(trimmed, ["because", "therefore", "first", "then", "finally"]);
  const depthSignals = getKeywordMatches(trimmed, ["trade-off", "risk", "constraint", "decision", "measurement"]);
  const communicationSignals = getKeywordMatches(trimmed, ["collaborated", "explained", "aligned", "stakeholder"]);

  const relevance = clampScore(1 + relevanceSignals * 0.6 + wordsCount / 80);
  const clarity = clampScore(1 + claritySignals * 0.7 + sentences / 2);
  const depth = clampScore(1 + depthSignals * 0.7 + wordsCount / 100);
  const communication = clampScore(1 + communicationSignals * 0.8 + sentences / 3);

  const reasons = {
    relevance:
      relevance >= 4
        ? "The answer stays aligned with role expectations and addresses the question directly."
        : "The answer is partially aligned to role expectations but misses some role-specific detail.",
    clarity:
      clarity >= 4
        ? "The structure is easy to follow with clear progression from context to outcome."
        : "The response could be organized more clearly with a sharper sequence of points.",
    depth:
      depth >= 4
        ? "You include decision-making depth and meaningful implementation detail."
        : "Add more technical or situational depth, including constraints and trade-offs.",
    communication:
      communication >= 4
        ? "Tone and wording are professional and effective for interview communication."
        : "Improve communication by tightening wording and emphasizing impact.",
  };

  const improvementTips: [string, string] = [
    "Add one concrete metric or measurable result to strengthen credibility.",
    "Use a tighter structure: context, action, and impact in 3-4 concise sentences.",
  ];

  const improvedAnswer = `For this ${input.roleTitle} scenario, I focused on the highest-impact requirement first, clarified constraints with stakeholders, and delivered in staged milestones. I documented trade-offs, validated quality with measurable checks, and communicated progress proactively. As a result, the team shipped on time with fewer defects and stronger user outcomes.`;

  return {
    scores: { relevance, clarity, depth, communication },
    reasons,
    improvementTips,
    improvedAnswer,
  };
}

function detectPart(answerText: string, patterns: RegExp[]): { present: boolean; evidence: string } {
  const sentences = answerText
    .split(/[.!?]+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  const match = sentences.find((sentence) => patterns.some((pattern) => pattern.test(sentence.toLowerCase())));

  return {
    present: Boolean(match),
    evidence: match ?? "",
  };
}

export function detectMockStar(answerText: string): StarResult {
  const situation = detectPart(answerText, [/when/i, /at the time/i, /in my previous/i, /context/i]);
  const task = detectPart(answerText, [/my goal/i, /task/i, /responsible/i, /needed to/i]);
  const action = detectPart(answerText, [/i did/i, /i built/i, /i implemented/i, /i led/i]);
  const result = detectPart(answerText, [/result/i, /outcome/i, /improved/i, /reduced/i, /increased/i]);

  const missingParts: StarResult["missingParts"] = [];

  if (!situation.present) missingParts.push("situation");
  if (!task.present) missingParts.push("task");
  if (!action.present) missingParts.push("action");
  if (!result.present) missingParts.push("result");

  const coachTip =
    missingParts.length === 0
      ? "Strong STAR structure. Keep answers concise and add one metric when possible."
      : `To improve STAR completeness, add explicit ${missingParts.join(", ")} details in your next response.`;

  return {
    situation,
    task,
    action,
    result,
    missingParts,
    coachTip,
  };
}
