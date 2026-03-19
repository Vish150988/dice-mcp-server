import axios, { AxiosInstance } from "axios";
import {
  DICE_API_BASE,
  DICE_JOB_DETAIL_BASE,
  REQUEST_HEADERS,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from "../constants.js";
import type {
  DiceJob,
  DiceRawJob,
  DiceSearchResponse,
  SearchParams,
  JobSearchResult,
} from "../types.js";

// ---------------------------------------------------------------------------
// HTTP client
// ---------------------------------------------------------------------------
const httpClient: AxiosInstance = axios.create({
  timeout: 15000,
  headers: REQUEST_HEADERS,
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function normalizeJob(raw: DiceRawJob): DiceJob {
  return {
    id: raw.id,
    title: raw.title ?? "Unknown Title",
    companyName: raw.companyName,
    companyPageUrl: raw.companyPageUrl,
    location: raw.location,
    salary: raw.salary,
    employmentType: raw.employmentType?.join(", "),
    workplaceTypes: raw.workplaceTypes,
    postedDate: raw.postedDate,
    detailsPageUrl: raw.detailsPageUrl ?? `${DICE_JOB_DETAIL_BASE}/${raw.id}`,
    summary: raw.summary,
    description: raw.description,
    applyUrl: raw.applyUrl,
    skills: raw.skills,
  };
}

function buildQueryParams(params: SearchParams): Record<string, string | number> {
  const qs: Record<string, string | number> = {
    q: params.query,
    countryCode: "US",
    radius: params.radius ?? 30,
    radiusUnit: "mi",
    pageSize: Math.min(params.pageSize ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE),
    pageNum: params.page ?? 1,
    language: "en",
    ite: "true", // Include third-party employer results
  };

  if (params.location) qs["location"] = params.location;
  if (params.employmentType) qs["filters.employmentType"] = params.employmentType;
  if (params.workplaceType) qs["filters.workplaceTypes"] = params.workplaceType;
  if (params.postedDate) qs["filters.postedDate"] = params.postedDate;

  return qs;
}

// ---------------------------------------------------------------------------
// Public API functions
// ---------------------------------------------------------------------------

/**
 * Search Dice.com for jobs matching the given criteria.
 */
export async function searchJobs(params: SearchParams): Promise<JobSearchResult> {
  const queryParams = buildQueryParams(params);

  let response;
  try {
    response = await httpClient.get<DiceSearchResponse>(DICE_API_BASE, {
      params: queryParams,
    });
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      if (status === 429) throw new Error("Rate limit exceeded. Please wait a moment before searching again.");
      if (status === 403) throw new Error("Access denied by Dice.com. The API key may need refreshing.");
      throw new Error(`Dice API error (HTTP ${status ?? "unknown"}): ${err.message}`);
    }
    throw new Error(`Unexpected error while calling Dice API: ${String(err)}`);
  }

  const total = response.data?.count ?? 0;
  const rawJobs: DiceRawJob[] = response.data?.data ?? [];
  const page = params.page ?? 1;
  const pageSize = Math.min(params.pageSize ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);

  return {
    totalCount: total,
    page,
    pageSize,
    jobs: rawJobs.map(normalizeJob),
    hasMore: page * pageSize < total,
  };
}

/**
 * Get detailed information about a specific job by its Dice job ID or detail URL.
 */
export async function getJobDetail(jobIdOrUrl: string): Promise<DiceJob | null> {
  // Extract the job ID from a full URL if provided
  const jobId = jobIdOrUrl.startsWith("http")
    ? jobIdOrUrl.split("/job-detail/")[1]?.split("?")[0]
    : jobIdOrUrl;

  if (!jobId) throw new Error("Invalid job ID or URL provided.");

  // We use the search API with a specific ID query since Dice doesn't expose
  // a public single-job endpoint
  const detailUrl = `${DICE_JOB_DETAIL_BASE}/${jobId}`;

  try {
    // Fetch the job detail page and extract structured data
    const result = await searchJobs({ query: jobId, pageSize: 5 });
    const match = result.jobs.find(
      (j) => j.id === jobId || j.detailsPageUrl?.includes(jobId)
    );

    if (match) return match;

    // Return a minimal record with the URL if no match found in search
    return {
      id: jobId,
      title: "Job Details",
      detailsPageUrl: detailUrl,
    };
  } catch {
    return { id: jobId, title: "Job Details", detailsPageUrl: detailUrl };
  }
}
