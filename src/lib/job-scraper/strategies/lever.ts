import type { ScrapedJob } from "../types";
import { stripHtml } from "../html";

const TIMEOUT = 8_000;

export async function scrapeLever(url: string): Promise<ScrapedJob | null> {
  // e.g. https://jobs.lever.co/company/uuid
  //      https://app.lever.co/jobs/company/uuid
  const match = url.match(/lever\.co\/([^/?#]+)\/([a-f0-9-]{36})/i);
  if (!match) return null;

  const [, company, jobId] = match;

  const res = await fetch(
    `https://api.lever.co/v0/postings/${company}/${jobId}`,
    { signal: AbortSignal.timeout(TIMEOUT) },
  );
  if (!res.ok) return null;

  const data = await res.json() as {
    text?: string;
    description?: string;
    descriptionPlain?: string;
    additional?: string;
    additionalPlain?: string;
    lists?: { text: string; content: string }[];
    categories?: { location?: string; team?: string };
    workplaceType?: string;
  };

  const parts = [
    data.descriptionPlain || stripHtml(data.description ?? ""),
    ...(data.lists ?? []).map((l) => `${l.text}:\n${stripHtml(l.content)}`),
    data.additionalPlain || stripHtml(data.additional ?? ""),
  ].filter(Boolean);

  const description = parts.join("\n\n");
  if (description.length < 100) return null;

  return {
    title:    data.text ?? "",
    company,
    location: data.categories?.location ?? data.workplaceType ?? "",
    description,
  };
}
