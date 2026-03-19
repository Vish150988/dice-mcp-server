import axios from "axios";
import { REQUEST_HEADERS, DICE_JOB_DETAIL_BASE } from "../constants.js";
import type { DiceJob } from "../types.js";

// ---------------------------------------------------------------------------
// Dice job detail page scraper
// Fetches the full job description by scraping the Dice job detail page
// ---------------------------------------------------------------------------

const scrapeClient = axios.create({
  timeout: 15000,
  headers: {
    ...REQUEST_HEADERS,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  },
});

/**
 * Extract a field value from markdown-style scraped content
 * e.g. extractField(text, "Company") => "SAIC"
 */
function extractField(text: string, label: string): string | undefined {
  const regex = new RegExp(`\\*\\*${label}\\*\\*[:\\s]+([^\\n*]+)`, "i");
  const match = text.match(regex);
  return match?.[1]?.trim();
}

/**
 * Extract skills list from the Skills section
 */
function extractSkills(text: string): string[] {
  const skillsIdx = text.indexOf("### Skills");
  const endIdx = text.indexOf("---", skillsIdx);
  if (skillsIdx === -1) return [];
  const skillsBlock = text.slice(skillsIdx, endIdx === -1 ? skillsIdx + 2000 : endIdx);
  return skillsBlock
    .split("\n")
    .filter((l) => l.trim().startsWith("*"))
    .map((l) => l.replace(/^\*\s*/, "").trim())
    .filter(Boolean);
}

/**
 * Extract salary from the page text
 * Handles formats like: "USD $160,001.00 - 200,000.00 per year" or "$80 - $100 an hour"
 */
function extractSalary(text: string): string | undefined {
  const salaryMatch = text.match(
    /(USD\s*\$?[\d,.]+ ?[-–] ?[\d,.]+\s*per\s*\w+|\$[\d,.]+ ?[-–] ?\$?[\d,.]+\s*(an?\s*hour|per\s*\w+|hourly)?)/i
  );
  return salaryMatch?.[0]?.trim();
}

/**
 * Extract the main job description block (everything after "Description" heading)
 */
function extractDescription(text: string): string | undefined {
  // Try to find the description block
  const markers = ["**Description**", "### Summary", "Job Description", "## Description"];
  for (const marker of markers) {
    const idx = text.indexOf(marker);
    if (idx !== -1) {
      const descText = text.slice(idx + marker.length, idx + 6000).trim();
      // Strip trailing nav/footer content
      const cutoffs = ["Apply Now", "Similar Jobs", "Related Jobs", "About the Company", "Report this job"];
      let end = descText.length;
      for (const cutoff of cutoffs) {
        const cutIdx = descText.indexOf(cutoff);
        if (cutIdx !== -1 && cutIdx < end) end = cutIdx;
      }
      return descText.slice(0, end).trim();
    }
  }
  return undefined;
}

/**
 * Extract employment type from page text
 */
function extractEmploymentType(text: string): string | undefined {
  const types = ["Full Time", "Part Time", "Contract", "Third Party", "Temporary"];
  for (const t of types) {
    if (text.includes(t)) return t;
  }
  return undefined;
}

/**
 * Extract workplace type from page text
 */
function extractWorkplaceType(text: string): string[] {
  const types: string[] = [];
  if (text.match(/\bRemote\b/i)) types.push("Remote");
  if (text.match(/\bHybrid\b/i)) types.push("Hybrid");
  if (text.match(/\bOn-?[Ss]ite\b/i)) types.push("On-Site");
  return types;
}

// ---------------------------------------------------------------------------
// Main export: scrape full job detail from Dice page
// ---------------------------------------------------------------------------
export async function scrapeJobDetail(jobIdOrUrl: string): Promise<DiceJob | null> {
  // Normalize to a full URL
  const jobId = jobIdOrUrl.startsWith("http")
    ? jobIdOrUrl.split("/job-detail/")[1]?.split("?")[0]
    : jobIdOrUrl;

  if (!jobId) throw new Error("Invalid job ID or URL provided.");

  const url = `${DICE_JOB_DETAIL_BASE}/${jobId}`;

  let html: string;
  try {
    const response = await scrapeClient.get<string>(url);
    html = response.data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      if (status === 404) throw new Error(`Job not found: ${url}`);
      throw new Error(`Failed to fetch job page (HTTP ${status ?? "unknown"})`);
    }
    throw new Error(`Unexpected error fetching job page: ${String(err)}`);
  }

  // Convert HTML to plain text by stripping tags
  // Dice renders job content in the HTML — we extract key sections
  const text = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s{3,}/g, "\n\n")
    .trim();

  // Extract title — it's always the largest heading on the page
  const titleMatch = text.match(/^\s*([A-Z][^\n]{5,80})\s*\n/m);
  const title = titleMatch?.[1]?.trim() ?? "Job Details";

  // Extract company name — appears right after or near the title
  const companyMatch = text.match(/\n([A-Z][A-Za-z0-9 &.,'-]{2,50})\n.*(?:Washington|New York|Remote|Austin|Chicago|Dallas|Atlanta)/s);
  const companyName = companyMatch?.[1]?.trim();

  // Extract location — city, state pattern
  const locationMatch = text.match(/([A-Z][a-zA-Z\s]+,\s*[A-Z]{2}(?:,\s*US)?)\s*[•·]/);
  const location = locationMatch?.[1]?.trim();

  // Extract posted date
  const postedMatch = text.match(/Posted\s+(\d+\s+(?:day|hour|week|month)s?\s+ago)/i);
  const postedDate = postedMatch?.[1] ?? undefined;

  // Build the structured job object
  const job: DiceJob = {
    id: jobId,
    title,
    companyName,
    location,
    salary: extractSalary(text),
    employmentType: extractEmploymentType(text),
    workplaceTypes: extractWorkplaceType(text),
    skills: extractSkills(text),
    description: extractDescription(text),
    detailsPageUrl: url,
    applyUrl: url,
  };

  return job;
}
