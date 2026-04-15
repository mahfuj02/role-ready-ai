import type { ScrapeOutcome, ScrapedJob } from "./types";
import { scrapeGreenhouse } from "./strategies/greenhouse";
import { scrapeLever }      from "./strategies/lever";
import { scrapeAshby }      from "./strategies/ashby";
import { scrapeViaJina }    from "./strategies/jina";

// ── Strategy registry ────────────────────────────────────────────────────────

interface Strategy {
  name: string;
  /** Return null to signal "not applicable or failed — try next" */
  run: (url: string) => Promise<ScrapedJob | null>;
}

const STRATEGIES: Strategy[] = [
  { name: "Greenhouse API", run: scrapeGreenhouse },
  { name: "Lever API",      run: scrapeLever      },
  { name: "Ashby API",      run: scrapeAshby      },
  { name: "Jina Reader",    run: scrapeViaJina    },
];

// ── Validation ────────────────────────────────────────────────────────────────

function isValid(job: ScrapedJob): boolean {
  return job.description.trim().length >= 200;
}

// ── Orchestrator ──────────────────────────────────────────────────────────────

export async function scrapeJobUrl(url: string): Promise<ScrapeOutcome> {
  const tried: string[] = [];

  for (const strategy of STRATEGIES) {
    tried.push(strategy.name);
    try {
      const result = await strategy.run(url);
      if (result && isValid(result)) {
        return { success: true, job: result, strategy: strategy.name };
      }
    } catch {
      // swallow and try next strategy
    }
  }

  return {
    success: false,
    error: "Could not extract job details from this URL. Try pasting the description manually.",
    triedStrategies: tried,
  };
}
