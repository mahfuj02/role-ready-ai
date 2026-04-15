import type { ScrapedJob } from "../types";

const TIMEOUT = 15_000;

export async function scrapeViaJina(url: string): Promise<ScrapedJob | null> {
  const res = await fetch(`https://r.jina.ai/${url}`, {
    headers: {
      "Accept": "text/plain",
      "X-Return-Format": "text",
      "User-Agent": "Mozilla/5.0 (compatible; RoleReady/1.0)",
    },
    signal: AbortSignal.timeout(TIMEOUT),
  });

  if (!res.ok) return null;

  const text = await res.text();
  if (text.length < 200) return null;

  // Try to pull a title from the first markdown heading
  const titleMatch = text.match(/^#+\s+(.+)$/m);
  const title = titleMatch?.[1]?.replace(/[*_`]/g, "").trim() ?? "";

  return {
    title,
    company:     "",
    location:    "",
    description: text,
  };
}
