import type { DiceJob, JobSearchResult } from "../types.js";
import { MAX_RESPONSE_CHARS } from "../constants.js";

// ---------------------------------------------------------------------------
// Single job formatter
// ---------------------------------------------------------------------------
export function formatJob(job: DiceJob, index?: number): string {
  const lines: string[] = [];

  const prefix = index !== undefined ? `**${index + 1}.` : "**";
  lines.push(`${prefix} ${job.title ?? "Unknown Title"}**`);

  if (job.companyName) lines.push(`   🏢 Company: ${job.companyName}`);
  if (job.location) lines.push(`   📍 Location: ${job.location}`);
  if (job.workplaceTypes?.length) lines.push(`   🏠 Workplace: ${job.workplaceTypes.join(", ")}`);
  if (job.salary) lines.push(`   💰 Salary: ${job.salary}`);
  if (job.employmentType) lines.push(`   💼 Type: ${job.employmentType}`);
  if (job.postedDate) {
    const posted = new Date(job.postedDate);
    const daysAgo = Math.floor((Date.now() - posted.getTime()) / (1000 * 60 * 60 * 24));
    const label = daysAgo === 0 ? "Today" : daysAgo === 1 ? "Yesterday" : `${daysAgo} days ago`;
    lines.push(`   📅 Posted: ${label}`);
  }
  if (job.skills?.length) {
    const topSkills = job.skills.slice(0, 8).join(", ");
    lines.push(`   🛠️  Skills: ${topSkills}`);
  }
  if (job.summary) {
    const snippet = job.summary.slice(0, 200).replace(/\n/g, " ");
    lines.push(`   📝 Summary: ${snippet}${job.summary.length > 200 ? "..." : ""}`);
  }
  if (job.detailsPageUrl) lines.push(`   🔗 View Job: ${job.detailsPageUrl}`);

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Full job detail formatter (for get_job_detail)
// ---------------------------------------------------------------------------
export function formatJobDetail(job: DiceJob): string {
  const lines: string[] = [];

  lines.push(`# ${job.title ?? "Job Details"}`);
  lines.push("");

  if (job.companyName) lines.push(`**Company:** ${job.companyName}`);
  if (job.location) lines.push(`**Location:** ${job.location}`);
  if (job.workplaceTypes?.length) lines.push(`**Workplace:** ${job.workplaceTypes.join(", ")}`);
  if (job.salary) lines.push(`**Salary:** ${job.salary}`);
  if (job.employmentType) lines.push(`**Employment Type:** ${job.employmentType}`);
  if (job.postedDate) lines.push(`**Posted:** ${new Date(job.postedDate).toLocaleDateString()}`);
  if (job.detailsPageUrl) lines.push(`**Job URL:** ${job.detailsPageUrl}`);
  if (job.applyUrl) lines.push(`**Apply URL:** ${job.applyUrl}`);

  if (job.skills?.length) {
    lines.push("");
    lines.push(`**Skills:** ${job.skills.join(", ")}`);
  }

  if (job.description) {
    lines.push("");
    lines.push("## Job Description");
    lines.push("");
    // Trim to avoid huge responses
    const desc = job.description.slice(0, 3000);
    lines.push(desc + (job.description.length > 3000 ? "\n\n*(description truncated — view full job at the link above)*" : ""));
  } else if (job.summary) {
    lines.push("");
    lines.push("## Summary");
    lines.push(job.summary);
  }

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Search results list formatter
// ---------------------------------------------------------------------------
export function formatSearchResults(result: JobSearchResult, searchLabel: string): string {
  if (result.jobs.length === 0) {
    return `No jobs found for "${searchLabel}". Try broadening your search or changing filters.`;
  }

  const lines: string[] = [];
  lines.push(`## 🎯 Dice.com Results: "${searchLabel}"`);
  lines.push(`Found **${result.totalCount.toLocaleString()} total jobs** · Showing page ${result.page} (${result.jobs.length} results)\n`);

  for (let i = 0; i < result.jobs.length; i++) {
    lines.push(formatJob(result.jobs[i], i));
    lines.push("");
  }

  if (result.hasMore) {
    lines.push(`---`);
    lines.push(`📄 *Page ${result.page} of ${Math.ceil(result.totalCount / result.pageSize)} — request page ${result.page + 1} for more results.*`);
  }

  const output = lines.join("\n");
  // Truncate if too large
  if (output.length > MAX_RESPONSE_CHARS) {
    return output.slice(0, MAX_RESPONSE_CHARS) + "\n\n*(response truncated — request fewer results or a specific page)*";
  }
  return output;
}
