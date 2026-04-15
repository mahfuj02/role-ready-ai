export interface ScrapedJob {
  title: string;
  company: string;
  location: string;
  description: string;
}

export interface ScrapeResult {
  success: true;
  job: ScrapedJob;
  strategy: string;
}

export interface ScrapeFailure {
  success: false;
  error: string;
  triedStrategies: string[];
}

export type ScrapeOutcome = ScrapeResult | ScrapeFailure;
