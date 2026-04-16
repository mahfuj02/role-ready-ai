export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { scrapeJobUrl } from "@/lib/job-scraper";

export async function POST(req: Request) {
  let url: string;

  try {
    const body = await req.json() as { url?: unknown };
    url = typeof body.url === "string" ? body.url.trim() : "";
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request body." }, { status: 400 });
  }

  if (!url) {
    return NextResponse.json({ success: false, error: "URL is required." }, { status: 400 });
  }

  // Basic URL validation
  try {
    new URL(url);
  } catch {
    return NextResponse.json({ success: false, error: "Invalid URL format." }, { status: 400 });
  }

  const result = await scrapeJobUrl(url);
  if (result.success) {
    console.log("[fetch-job] strategy:", result.strategy);
    console.log("[fetch-job] description (first 300 chars):", result.job.description.slice(0, 300));
  } else {
    console.log("[fetch-job] failed:", result.error);
  }
  return NextResponse.json(result);
}
