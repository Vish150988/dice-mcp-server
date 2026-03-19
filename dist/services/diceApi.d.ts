import type { DiceJob, SearchParams, JobSearchResult } from "../types.js";
/**
 * Search Dice.com for jobs matching the given criteria.
 */
export declare function searchJobs(params: SearchParams): Promise<JobSearchResult>;
/**
 * Get detailed information about a specific job by its Dice job ID or detail URL.
 */
export declare function getJobDetail(jobIdOrUrl: string): Promise<DiceJob | null>;
//# sourceMappingURL=diceApi.d.ts.map