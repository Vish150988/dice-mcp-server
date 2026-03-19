import axios, { AxiosInstance } from "axios";
import {
  DICE_API_BASE,
  DICE_JOB_DETAIL_BASE,
  REQUEST_HEADERS,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from "../constants.js";
import type { DiceJob, DiceRawJob, DiceSearchResponse, SearchParams, JobSearchResult } from "../types.js";
import { scrapeJobDetail } from "./jobScraper.js";

const httpClient: AxiosInstance = axios.create({ timeout: 15000, headers: REQUEST_HEADERS });

// ---------------------------------------------------------------------------
// Key Rotation Check
// ---------------------------------------------------------------------------
function handleApiError(err: unknown): never {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    if (status === 401 || status === 403) {
      throw new Error(
        `DICE API KEY EXPIRED OR INVALID (HTTP ${status})\n\n` +
        `The x-api-key in constants.ts needs to be refreshed.\n\n` +
        `HOW TO GET A NEW KEY:\n` +
        `1. Open Chrome → go to https://www.dice.com/jobs\n` +
        `2. Press F12 → Network tab\n` +
        `3. Search any job → find request to job-search-api.svc.dhigroupinc.com\n` +
        `4. Click it → Headers tab → copy x-api-key value\n` +
        `5. Paste into REQUEST_HEADERS in src/constants.ts\n` +
        `6. Run: npm run build → Restart Claude Desktop`
      );
    }
    if (status === 429) throw new Error(`RATE LIMITED (HTTP 429) — wait 30-60 seconds and try again.`);
    if (status === 400) throw new Error(`BAD REQUEST (HTTP 400) — check your query/filter values.`);
    throw new Error(`Dice API error (HTTP ${status ?? "unknown"}): ${err.message}`);
  }
  throw new Error(`Unexpected error calling Dice API: ${String(err)}`);
}


// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function normalizeEmploymentType(raw: string | string[] | undefined): string | undefined {
  if (!raw) return undefined;
  if (Array.isArray(raw)) return raw.join(", ");
  return String(raw);
}

function normalizeJob(raw: DiceRawJob): DiceJob {
  return {
    id: raw.id,
    title: raw.title ?? "Unknown Title",
    companyName: raw.companyName,
    companyPageUrl: raw.companyPageUrl,
    location: raw.location,
    salary: raw.salary,
    employmentType: normalizeEmploymentType(raw.employmentType),
    workplaceTypes: Array.isArray(raw.workplaceTypes) ? raw.workplaceTypes : raw.workplaceTypes ? [String(raw.workplaceTypes)] : undefined,
    postedDate: raw.postedDate,
    detailsPageUrl: raw.detailsPageUrl ?? `${DICE_JOB_DETAIL_BASE}/${raw.id}`,
    summary: raw.summary,
    description: raw.description,
    applyUrl: raw.applyUrl,
    skills: Array.isArray(raw.skills) ? raw.skills : raw.skills ? [String(raw.skills)] : undefined,
  };
}

function buildQueryParams(params: SearchParams): Record<string, string | number> {
  const qs: Record<string, string | number> = {
    q: params.query, countryCode: "US", radius: params.radius ?? 30,
    radiusUnit: "mi", pageSize: Math.min(params.pageSize ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE),
    pageNum: params.page ?? 1, language: "en", ite: "true",
  };
  if (params.location)       qs["location"]               = params.location;
  if (params.employmentType) qs["filters.employmentType"] = params.employmentType;
  if (params.workplaceType)  qs["filters.workplaceTypes"] = params.workplaceType;
  if (params.postedDate)     qs["filters.postedDate"]     = params.postedDate;
  return qs;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export async function searchJobs(params: SearchParams): Promise<JobSearchResult> {
  const queryParams = buildQueryParams(params);
  let response;
  try {
    response = await httpClient.get<DiceSearchResponse>(DICE_API_BASE, { params: queryParams });
  } catch (err: unknown) { handleApiError(err); }
  const total    = response.data?.count ?? 0;
  const rawJobs  = response.data?.data  ?? [];
  const page     = params.page ?? 1;
  const pageSize = Math.min(params.pageSize ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
  return { totalCount: total, page, pageSize, jobs: rawJobs.map(normalizeJob), hasMore: page * pageSize < total };
}

/**
 * Get full job details by scraping the Dice job detail page.
 * Returns complete description, skills, salary, company, and apply link.
 */
export async function getJobDetail(jobIdOrUrl: string): Promise<DiceJob | null> {
  try {
    return await scrapeJobDetail(jobIdOrUrl);
  } catch (err: unknown) {
    const jobId  = jobIdOrUrl.startsWith("http") ? jobIdOrUrl.split("/job-detail/")[1]?.split("?")[0] : jobIdOrUrl;
    const detailUrl = `${DICE_JOB_DETAIL_BASE}/${jobId}`;
    return { id: jobId ?? "unknown", title: "Job Details", detailsPageUrl: detailUrl };
  }
}
