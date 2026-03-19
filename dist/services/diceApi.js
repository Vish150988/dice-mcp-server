import axios from "axios";
import { DICE_API_BASE, DICE_JOB_DETAIL_BASE, REQUEST_HEADERS, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, } from "../constants.js";
// ---------------------------------------------------------------------------
// HTTP client
// ---------------------------------------------------------------------------
const httpClient = axios.create({
    timeout: 15000,
    headers: REQUEST_HEADERS,
});
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
/**
 * Safely normalize employmentType — Dice returns it as either a string or array
 */
function normalizeEmploymentType(raw) {
    if (!raw)
        return undefined;
    if (Array.isArray(raw))
        return raw.join(", ");
    return String(raw);
}
function normalizeJob(raw) {
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
function buildQueryParams(params) {
    const qs = {
        q: params.query,
        countryCode: "US",
        radius: params.radius ?? 30,
        radiusUnit: "mi",
        pageSize: Math.min(params.pageSize ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE),
        pageNum: params.page ?? 1,
        language: "en",
        ite: "true",
    };
    if (params.location)
        qs["location"] = params.location;
    if (params.employmentType)
        qs["filters.employmentType"] = params.employmentType;
    if (params.workplaceType)
        qs["filters.workplaceTypes"] = params.workplaceType;
    if (params.postedDate)
        qs["filters.postedDate"] = params.postedDate;
    return qs;
}
// ---------------------------------------------------------------------------
// Public API functions
// ---------------------------------------------------------------------------
export async function searchJobs(params) {
    const queryParams = buildQueryParams(params);
    let response;
    try {
        response = await httpClient.get(DICE_API_BASE, {
            params: queryParams,
        });
    }
    catch (err) {
        if (axios.isAxiosError(err)) {
            const status = err.response?.status;
            if (status === 429)
                throw new Error("Rate limit exceeded. Please wait a moment before searching again.");
            if (status === 403)
                throw new Error("Access denied by Dice.com. The API key may need refreshing.");
            throw new Error(`Dice API error (HTTP ${status ?? "unknown"}): ${err.message}`);
        }
        throw new Error(`Unexpected error while calling Dice API: ${String(err)}`);
    }
    const total = response.data?.count ?? 0;
    const rawJobs = response.data?.data ?? [];
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
export async function getJobDetail(jobIdOrUrl) {
    const jobId = jobIdOrUrl.startsWith("http")
        ? jobIdOrUrl.split("/job-detail/")[1]?.split("?")[0]
        : jobIdOrUrl;
    if (!jobId)
        throw new Error("Invalid job ID or URL provided.");
    const detailUrl = `${DICE_JOB_DETAIL_BASE}/${jobId}`;
    try {
        const result = await searchJobs({ query: jobId, pageSize: 5 });
        const match = result.jobs.find((j) => j.id === jobId || j.detailsPageUrl?.includes(jobId));
        if (match)
            return match;
        return { id: jobId, title: "Job Details", detailsPageUrl: detailUrl };
    }
    catch {
        return { id: jobId, title: "Job Details", detailsPageUrl: detailUrl };
    }
}
//# sourceMappingURL=diceApi.js.map