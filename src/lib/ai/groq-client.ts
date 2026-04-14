import Groq from "groq-sdk";

export const GROQ_DEFAULT_MODEL = "llama-3.3-70b-versatile";

export function getGroqModel(): string {
  return process.env.GROQ_MODEL?.trim() || GROQ_DEFAULT_MODEL;
}

export function getGroqClient(): Groq | null {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) return null;
  return new Groq({ apiKey });
}

/** Call Groq and return parsed JSON, with json_object mode enforced. */
export async function groqJson<T>(prompt: string): Promise<T> {
  const client = getGroqClient();
  if (!client) throw new Error("GROQ_API_KEY is not configured.");

  const response = await client.chat.completions.create({
    model: getGroqModel(),
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  const content = response.choices[0]?.message?.content ?? "";
  return JSON.parse(content) as T;
}
