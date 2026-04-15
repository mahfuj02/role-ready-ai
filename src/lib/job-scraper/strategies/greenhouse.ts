import type { ScrapedJob } from "../types";
import { stripHtml } from "../html";

const TIMEOUT = 8_000;

/** Fetch a job from the Greenhouse public API given slug + job ID. */
async function fetchGreenhouseJob(slug: string, jobId: string): Promise<ScrapedJob | null> {
  const res = await fetch(
    `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs/${jobId}?questions=false`,
    { signal: AbortSignal.timeout(TIMEOUT) },
  );
  if (!res.ok) return null;

  const data = await res.json() as {
    title?: string;
    content?: string;
    location?: { name?: string };
    departments?: { name?: string }[];
  };

  const raw = data.content ?? "";
  // Remove leading image/banner blocks before stripping (common in Greenhouse job posts)
  const withoutBanners = raw.replace(/<(?:div|p)[^>]*>\s*<img[\s\S]*?<\/(?:div|p)>/gi, "");
  const description = stripHtml(withoutBanners);
  if (description.length < 100) return null;

  return {
    title:       data.title ?? "",
    company:     slug,
    location:    data.location?.name ?? "",
    description,
  };
}

/**
 * For embedded Greenhouse pages (e.g. company.com/jobs?gh_jid=12345),
 * fetch the page HTML and look for the Greenhouse board slug in the embed script.
 */
async function extractGreenhouseSlug(pageUrl: string): Promise<string | null> {
  try {
    const res = await fetch(pageUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; RoleReady/1.0)" },
      signal: AbortSignal.timeout(TIMEOUT),
    });
    const html = await res.text();

    // Pattern 1: ?for=slug in greenhouse script src
    const m1 = html.match(/greenhouse\.io[^"']*[?&]for=([a-z0-9_-]+)/i);
    if (m1) return m1[1];

    // Pattern 2: boards.greenhouse.io/slug (direct board embed)
    const m2 = html.match(/boards\.greenhouse\.io\/([a-z0-9_-]+)/i);
    if (m2) return m2[1];

    // Pattern 3: job-boards.greenhouse.io/slug
    const m3 = html.match(/job-boards\.greenhouse\.io\/([a-z0-9_-]+)/i);
    if (m3) return m3[1];

  } catch {
    // network error — return null
  }
  return null;
}

export async function scrapeGreenhouse(url: string): Promise<ScrapedJob | null> {
  // ── Direct Greenhouse board URL ──────────────────────────────────────────────
  // e.g. https://boards.greenhouse.io/atolls/jobs/7775717
  //      https://job-boards.greenhouse.io/atolls/jobs/7775717
  const directMatch = url.match(/greenhouse\.io\/([^/?#]+)\/jobs\/(\d+)/i);
  if (directMatch) {
    return fetchGreenhouseJob(directMatch[1], directMatch[2]);
  }

  // ── Embedded Greenhouse page (gh_jid query param) ────────────────────────────
  // e.g. https://atolls.com/careers/application/?gh_jid=7775717
  const ghJidMatch = url.match(/[?&]gh_jid=(\d+)/);
  if (!ghJidMatch) return null;

  const jobId = ghJidMatch[1];

  // Try to find slug from page source
  const slug = await extractGreenhouseSlug(url);
  if (!slug) return null;

  return fetchGreenhouseJob(slug, jobId);
}
