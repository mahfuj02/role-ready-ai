import { GoogleGenAI } from "@google/genai";

export const GEMINI_DEFAULT_MODEL = "gemini-2.5-flash";

export function getGeminiModel(): string {
  return process.env.GEMINI_MODEL?.trim() || GEMINI_DEFAULT_MODEL;
}

export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    return null;
  }

  return new GoogleGenAI({ apiKey });
}

export function extractJsonPayload(text: string): string {
  const trimmed = text.trim();

  if (trimmed.startsWith("```") && trimmed.endsWith("```")) {
    return trimmed
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/, "")
      .trim();
  }

  return trimmed;
}
