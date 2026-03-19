import { searchJobs, getJobDetail } from "../services/diceApi.js";
import { formatSearchResults, formatJobDetail } from "../services/formatter.js";
import { SearchJobsSchema, ContractC2CSearchSchema, GetJobDetailSchema, } from "../schemas/searchSchemas.js";
import { EMPLOYMENT_TYPES, WORKPLACE_TYPES } from "../constants.js";
export function registerTools(server) {
    // -------------------------------------------------------------------------
    // Tool 1: dice_search_jobs — general purpose search
    // -------------------------------------------------------------------------
    server.registerTool("dice_search_jobs", {
        title: "Search Dice.com Jobs",
        description: `Search Dice.com for tech job listings with full filter support.

Use this tool to find jobs on Dice.com by keywords, location, employment type, workplace preference, and posting recency.

Args:
  - query (string): Job title or keywords e.g. "Data Architect", "Lead BI Engineer Snowflake"
  - location (string, optional): City and state e.g. "Austin, TX" or "remote"
  - radius (number, optional): Search radius in miles (default: 30)
  - employmentType (string, optional): FULLTIME | PARTTIME | CONTRACTS | THIRD_PARTY
  - workplaceType (string, optional): Remote | On-Site | Hybrid
  - postedDate (string, optional): ONE | THREE | SEVEN | THIRTY (days since posted)
  - page (number, optional): Page number (default: 1)
  - pageSize (number, optional): Results per page, max 50 (default: 10)

Returns:
  Formatted list of matching jobs with title, company, location, salary, skills, and direct URL.

Examples:
  - "Find remote Senior Data Engineer jobs on Dice" → query="Senior Data Engineer", workplaceType="Remote"
  - "Search Dice for Power BI jobs posted this week" → query="Power BI", postedDate="SEVEN"
  - "Show contract Snowflake jobs in New York" → query="Snowflake", location="New York, NY", employmentType="CONTRACTS"`,
        inputSchema: SearchJobsSchema,
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
        },
    }, async (params) => {
        try {
            const result = await searchJobs(params);
            const label = params.location
                ? `${params.query} in ${params.location}`
                : params.query;
            const text = formatSearchResults(result, label);
            return {
                content: [{ type: "text", text }],
                structuredContent: result,
            };
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            return {
                content: [{ type: "text", text: `Error searching Dice.com: ${message}` }],
                isError: true,
            };
        }
    });
    // -------------------------------------------------------------------------
    // Tool 2: dice_search_contract_c2c — pre-filtered for contract / C2C roles
    // -------------------------------------------------------------------------
    server.registerTool("dice_search_contract_c2c", {
        title: "Search Dice.com Contract & C2C Jobs",
        description: `Search Dice.com specifically for CONTRACT and CORP-TO-CORP (C2C) tech roles — remote only.

This tool is pre-configured for C2C/contract job seekers. It automatically:
  - Searches BOTH "CONTRACTS" and "THIRD_PARTY" employment types (C2C roles appear under Third Party on Dice)
  - Defaults to Remote workplace
  - Returns only remote contract roles

Args:
  - query (string): Job title or keywords e.g. "Lead Data Architect", "BI Engineer Power BI Snowflake"
  - location (string, optional): Specific city e.g. "Chicago, IL" — defaults to remote if omitted
  - postedDate (string, optional): ONE | THREE | SEVEN | THIRTY (filter by recency)
  - page (number, optional): Page number (default: 1)
  - pageSize (number, optional): Results per page, max 50 (default: 10)

Returns:
  Formatted list of contract/C2C jobs with title, company, location, salary, type, skills, and direct URL.

Examples:
  - "Find C2C Data Architect contracts on Dice" → query="Data Architect"
  - "Show remote contract Power BI jobs posted this week" → query="Power BI", postedDate="SEVEN"
  - "Search Dice for Lead BI Engineer C2C roles" → query="Lead BI Engineer"`,
        inputSchema: ContractC2CSearchSchema,
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
        },
    }, async (params) => {
        try {
            // Run two parallel searches: CONTRACTS + THIRD_PARTY (C2C on Dice)
            const [contractResults, thirdPartyResults] = await Promise.all([
                searchJobs({
                    ...params,
                    location: params.location ?? "remote",
                    employmentType: EMPLOYMENT_TYPES.CONTRACT,
                    workplaceType: WORKPLACE_TYPES.REMOTE,
                }),
                searchJobs({
                    ...params,
                    location: params.location ?? "remote",
                    employmentType: EMPLOYMENT_TYPES.THIRD_PARTY,
                    workplaceType: WORKPLACE_TYPES.REMOTE,
                }),
            ]);
            // Merge and deduplicate by job ID
            const seenIds = new Set();
            const mergedJobs = [...contractResults.jobs, ...thirdPartyResults.jobs].filter((job) => {
                if (seenIds.has(job.id))
                    return false;
                seenIds.add(job.id);
                return true;
            });
            const combinedResult = {
                totalCount: contractResults.totalCount + thirdPartyResults.totalCount,
                page: params.page ?? 1,
                pageSize: params.pageSize ?? 10,
                jobs: mergedJobs.slice(0, params.pageSize ?? 10),
                hasMore: contractResults.hasMore || thirdPartyResults.hasMore,
            };
            const label = `${params.query} (Contract + C2C)`;
            const text = formatSearchResults(combinedResult, label);
            return {
                content: [{ type: "text", text }],
                structuredContent: combinedResult,
            };
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            return {
                content: [{ type: "text", text: `Error searching Dice.com for C2C roles: ${message}` }],
                isError: true,
            };
        }
    });
    // -------------------------------------------------------------------------
    // Tool 3: dice_get_job_detail — full job description
    // -------------------------------------------------------------------------
    server.registerTool("dice_get_job_detail", {
        title: "Get Dice.com Job Details",
        description: `Get the full details and description of a specific Dice.com job by its job ID or URL.

Use this after finding a job via dice_search_jobs or dice_search_contract_c2c to get the complete job description, requirements, and application details.

Args:
  - jobId (string): The Dice job ID or full URL e.g. "https://www.dice.com/job-detail/abc-123-def"

Returns:
  Full job details including title, company, location, salary, skills, complete description, and apply link.

Examples:
  - User clicks a job from search results → pass the job URL as jobId
  - "Get more details on that first job" → pass the ID from the search results`,
        inputSchema: GetJobDetailSchema,
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
        },
    }, async (params) => {
        try {
            const job = await getJobDetail(params.jobId);
            if (!job) {
                return {
                    content: [{ type: "text", text: `No job found for ID: ${params.jobId}` }],
                    isError: true,
                };
            }
            const text = formatJobDetail(job);
            return {
                content: [{ type: "text", text }],
                structuredContent: job,
            };
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            return {
                content: [{ type: "text", text: `Error fetching job details: ${message}` }],
                isError: true,
            };
        }
    });
}
//# sourceMappingURL=diceTools.js.map