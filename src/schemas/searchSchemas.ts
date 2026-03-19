import { z } from "zod";
import { EMPLOYMENT_TYPES, POSTED_DATE_FILTERS, WORKPLACE_TYPES } from "../constants.js";

export const SearchJobsSchema = z.object({
  query: z
    .string()
    .min(2, "Search query must be at least 2 characters")
    .max(200, "Search query must not exceed 200 characters")
    .describe("Job title or keywords to search for. E.g. 'Data Architect', 'BI Engineer Snowflake'"),

  location: z
    .string()
    .optional()
    .describe("City and state e.g. 'Austin, TX', or 'remote' for remote-only jobs"),

  radius: z
    .number()
    .int()
    .min(5)
    .max(100)
    .default(30)
    .describe("Search radius in miles from the location (default: 30)"),

  employmentType: z
    .enum([
      EMPLOYMENT_TYPES.FULLTIME,
      EMPLOYMENT_TYPES.PARTTIME,
      EMPLOYMENT_TYPES.CONTRACT,
      EMPLOYMENT_TYPES.THIRD_PARTY,
    ])
    .optional()
    .describe("Filter by employment type: FULLTIME, PARTTIME, CONTRACTS, or THIRD_PARTY (C2C)"),

  workplaceType: z
    .enum([
      WORKPLACE_TYPES.REMOTE,
      WORKPLACE_TYPES.ONSITE,
      WORKPLACE_TYPES.HYBRID,
    ])
    .optional()
    .describe("Filter by workplace type: Remote, On-Site, or Hybrid"),

  postedDate: z
    .enum([
      POSTED_DATE_FILTERS.ONE,
      POSTED_DATE_FILTERS.THREE,
      POSTED_DATE_FILTERS.SEVEN,
      POSTED_DATE_FILTERS.THIRTY,
    ])
    .optional()
    .describe("Filter by how recently the job was posted: ONE (1 day), THREE (3 days), SEVEN (7 days), THIRTY (30 days)"),

  page: z
    .number()
    .int()
    .min(1)
    .default(1)
    .describe("Page number for paginated results (default: 1)"),

  pageSize: z
    .number()
    .int()
    .min(1)
    .max(50)
    .default(10)
    .describe("Number of results per page, 1–50 (default: 10)"),
}).strict();

export const ContractC2CSearchSchema = z.object({
  query: z
    .string()
    .min(2, "Search query must be at least 2 characters")
    .max(200, "Search query must not exceed 200 characters")
    .describe("Job title or keywords. E.g. 'Data Architect', 'Lead BI Engineer Snowflake Power BI'"),

  location: z
    .string()
    .optional()
    .describe("City and state e.g. 'New York, NY', or omit for remote-only results"),

  postedDate: z
    .enum([
      POSTED_DATE_FILTERS.ONE,
      POSTED_DATE_FILTERS.THREE,
      POSTED_DATE_FILTERS.SEVEN,
      POSTED_DATE_FILTERS.THIRTY,
    ])
    .optional()
    .describe("Filter by recency: ONE (1 day), THREE (3 days), SEVEN (7 days), THIRTY (30 days)"),

  page: z
    .number()
    .int()
    .min(1)
    .default(1)
    .describe("Page number (default: 1)"),

  pageSize: z
    .number()
    .int()
    .min(1)
    .max(50)
    .default(10)
    .describe("Results per page, 1–50 (default: 10)"),
}).strict();

export const GetJobDetailSchema = z.object({
  jobId: z
    .string()
    .min(1, "Job ID cannot be empty")
    .describe("The Dice job ID or full Dice job detail URL (e.g. 'https://www.dice.com/job-detail/abc-123')"),
}).strict();

export type SearchJobsInput = z.infer<typeof SearchJobsSchema>;
export type ContractC2CSearchInput = z.infer<typeof ContractC2CSearchSchema>;
export type GetJobDetailInput = z.infer<typeof GetJobDetailSchema>;
