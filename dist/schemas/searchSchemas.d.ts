import { z } from "zod";
export declare const SearchJobsSchema: z.ZodObject<{
    query: z.ZodString;
    location: z.ZodOptional<z.ZodString>;
    radius: z.ZodDefault<z.ZodNumber>;
    employmentType: z.ZodOptional<z.ZodEnum<{
        FULLTIME: "FULLTIME";
        PARTTIME: "PARTTIME";
        CONTRACTS: "CONTRACTS";
        THIRD_PARTY: "THIRD_PARTY";
    }>>;
    workplaceType: z.ZodOptional<z.ZodEnum<{
        Remote: "Remote";
        "On-Site": "On-Site";
        Hybrid: "Hybrid";
    }>>;
    postedDate: z.ZodOptional<z.ZodEnum<{
        ONE: "ONE";
        THREE: "THREE";
        SEVEN: "SEVEN";
        THIRTY: "THIRTY";
    }>>;
    page: z.ZodDefault<z.ZodNumber>;
    pageSize: z.ZodDefault<z.ZodNumber>;
}, z.core.$strict>;
export declare const ContractC2CSearchSchema: z.ZodObject<{
    query: z.ZodString;
    location: z.ZodOptional<z.ZodString>;
    postedDate: z.ZodOptional<z.ZodEnum<{
        ONE: "ONE";
        THREE: "THREE";
        SEVEN: "SEVEN";
        THIRTY: "THIRTY";
    }>>;
    page: z.ZodDefault<z.ZodNumber>;
    pageSize: z.ZodDefault<z.ZodNumber>;
}, z.core.$strict>;
export declare const GetJobDetailSchema: z.ZodObject<{
    jobId: z.ZodString;
}, z.core.$strict>;
export type SearchJobsInput = z.infer<typeof SearchJobsSchema>;
export type ContractC2CSearchInput = z.infer<typeof ContractC2CSearchSchema>;
export type GetJobDetailInput = z.infer<typeof GetJobDetailSchema>;
//# sourceMappingURL=searchSchemas.d.ts.map