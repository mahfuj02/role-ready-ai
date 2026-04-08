import type { GenerateQuestionsInput, GeneratedQuestion } from "@/lib/ai/types";

const behavioralTemplates = [
  "Tell me about a time you handled conflicting priorities while delivering a {role} project.",
  "Describe a situation where you received critical feedback and how you responded.",
  "Share an example of a challenging collaboration and how you drove alignment.",
  "Tell me about a time you had to make a difficult trade-off under time pressure.",
  "Describe a moment you improved a process and the outcome it created.",
  "Give an example of leading without authority in a cross-functional context.",
];

const technicalTemplates = [
  "How would you design a robust architecture for a {role} feature with high traffic?",
  "Walk through how you debug and isolate a production issue end-to-end.",
  "How do you ensure code quality, reliability, and maintainability in your workflow?",
  "What metrics would you track to evaluate the success of this role's responsibilities?",
  "How would you prioritize technical debt versus feature delivery in this role?",
  "Explain your approach to security and data privacy decisions in implementation work.",
];

function injectRole(template: string, roleTitle: string): string {
  return template.replace("{role}", roleTitle.trim() || "software");
}

export function generateMockQuestions(input: GenerateQuestionsInput): GeneratedQuestion[] {
  const total = input.totalQuestions ?? 10;
  const behavioralCount = Math.round(total * 0.6);

  const questions: GeneratedQuestion[] = [];

  for (let i = 0; i < total; i += 1) {
    const isBehavioral = i < behavioralCount;
    const source = isBehavioral ? behavioralTemplates : technicalTemplates;
    const template = source[i % source.length] ?? source[0];

    questions.push({
      question: injectRole(template, input.roleTitle),
      type: isBehavioral ? "BEHAVIORAL" : "TECHNICAL",
      difficulty: i < 3 ? "EASY" : i < 7 ? "MEDIUM" : "HARD",
      starRecommended: isBehavioral,
    });
  }

  return questions;
}
