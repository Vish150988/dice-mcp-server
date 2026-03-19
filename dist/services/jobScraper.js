import axios from "axios";
import { REQUEST_HEADERS, DICE_JOB_DETAIL_BASE } from "../constants.js";

const scrapeClient = axios.create({
    timeout: 15000,
    headers: { ...REQUEST_HEADERS, "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" },
});

function extractField(text, label) {
    const regex = new RegExp(`\\*\\*${label}\\*\\*[:\\s]+([^\\n*]+)`, "i");
    return text.match(regex)?.[1]?.trim();
}

function extractSkills(text) {
    const skillsIdx = text.indexOf("### Skills");
    const endIdx = text.indexOf("---", skillsIdx);
    if (skillsIdx === -1) return [];
    const skillsBlock = text.slice(skillsIdx, endIdx === -1 ? skillsIdx + 2000 : endIdx);
    return skillsBlock.split("\n").filter((l) => l.trim().startsWith("*")).map((l) => l.replace(/^\*\s*/, "").trim()).filter(Boolean);
}

function extractSalary(text) {
    return text.match(/(USD\s*\$?[\d,.]+ ?[-–] ?[\d,.]+\s*per\s*\w+|\$[\d,.]+ ?[-–] ?\$?[\d,.]+\s*(an?\s*hour|per\s*\w+|hourly)?)/i)?.[0]?.trim();
}

function extractDescription(text) {
    const markers = ["**Description**", "### Summary", "Job Description", "## Description"];
    for (const marker of markers) {
        const idx = text.indexOf(marker);
        if (idx !== -1) {
            const descText = text.slice(idx + marker.length, idx + 6000).trim();
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

function extractEmploymentType(text) {
    for (const t of ["Full Time", "Part Time", "Contract", "Third Party", "Temporary"]) {
        if (text.includes(t)) return t;
    }
    return undefined;
}

function extractWorkplaceType(text) {
    const types = [];
    if (text.match(/\bRemote\b/i)) types.push("Remote");
    if (text.match(/\bHybrid\b/i)) types.push("Hybrid");
    if (text.match(/\bOn-?[Ss]ite\b/i)) types.push("On-Site");
    return types;
}

export async function scrapeJobDetail(jobIdOrUrl) {
    const jobId = jobIdOrUrl.startsWith("http")
        ? jobIdOrUrl.split("/job-detail/")[1]?.split("?")[0]
        : jobIdOrUrl;
    if (!jobId) throw new Error("Invalid job ID or URL provided.");
    const url = `${DICE_JOB_DETAIL_BASE}/${jobId}`;
    let html;
    try {
        const response = await scrapeClient.get(url);
        html = response.data;
    } catch (err) {
        if (axios.isAxiosError(err)) {
            const status = err.response?.status;
            if (status === 404) throw new Error(`Job not found: ${url}`);
            throw new Error(`Failed to fetch job page (HTTP ${status ?? "unknown"})`);
        }
        throw new Error(`Unexpected error fetching job page: ${String(err)}`);
    }

    const text = html
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
        .replace(/&nbsp;/g, " ").replace(/&#39;/g, "'").replace(/&quot;/g, '"')
        .replace(/\s{3,}/g, "\n\n").trim();

    const titleMatch = text.match(/^\s*([A-Z][^\n]{5,80})\s*\n/m);
    const title = titleMatch?.[1]?.trim() ?? "Job Details";
    const companyMatch = text.match(/\n([A-Z][A-Za-z0-9 &.,'-]{2,50})\n.*(?:Washington|New York|Remote|Austin|Chicago|Dallas|Atlanta)/s);
    const companyName = companyMatch?.[1]?.trim();
    const locationMatch = text.match(/([A-Z][a-zA-Z\s]+,\s*[A-Z]{2}(?:,\s*US)?)\s*[•·]/);
    const location = locationMatch?.[1]?.trim();
    const postedMatch = text.match(/Posted\s+(\d+\s+(?:day|hour|week|month)s?\s+ago)/i);
    const postedDate = postedMatch?.[1] ?? undefined;

    return {
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
}
//# sourceMappingURL=jobScraper.js.map
