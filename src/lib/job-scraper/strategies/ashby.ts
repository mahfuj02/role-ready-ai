import type { ScrapedJob } from "../types";
import { stripHtml } from "../html";

const TIMEOUT = 8_000;

export async function scrapeAshby(url: string): Promise<ScrapedJob | null> {
  // e.g. https://jobs.ashbyhq.com/company/uuid
  const match = url.match(/ashbyhq\.com\/([^/?#]+)\/([a-f0-9-]{36})/i);
  if (!match) return null;

  const [, , jobId] = match;

  const res = await fetch(
    `https://api.ashbyhq.com/jobPosting.info?jobPostingId=${jobId}`,
    { signal: AbortSignal.timeout(TIMEOUT) },
  );
  if (!res.ok) return null;

  const data = await res.json() as {
    results?: {
      title?: string;
      organizationName?: string;
      locationName?: string;
      descriptionHtml?: string;
      description?: string;
    };
  };

  const job = data.results;
  if (!job) return null;

  const description = stripHtml(job.descriptionHtml ?? job.description ?? "");
  if (description.length < 100) return null;

  return {
    title:    job.title ?? "",
    company:  job.organizationName ?? "",
    location: job.locationName ?? "",
    description,
  };
}
