import { getJob, computeMatches } from "@/modules/jobs/service";
import { extractJsonBlock, isLlmAvailableFor, llmJson } from "@/modules/ai/provider";
import { z } from "zod";

export const interviewPrepSchema = z.object({
  companyIntel: z.string(),
  questions: z.array(z.string()),
  technicalPrep: z.string(),
});

export type InterviewPrep = z.infer<typeof interviewPrepSchema>;

const INTERVIEW_PREP_PROMPT = `You generate interview preparation materials for a specific job.

Based on the job description and company, provide:
- Company intel: A concise brief grounded only in the provided job description, company name, and extracted signals. Do not invent outside research or recent news.
- Questions: 10-15 common interview questions for this role, tailored to the JD.
- Technical prep: Checklists or topics to study, based on required skills.

Output JSON:
{
  "companyIntel": "string",
  "questions": ["string"],
  "technicalPrep": "string"
}`;

export async function generateInterviewPrep(
  userId: string,
  jobId: string
): Promise<InterviewPrep> {
  const job = await getJob(userId, jobId);
  const matches = await computeMatches(userId, jobId);

  const prompt = `Job: ${job.title} at ${job.company}
Job description:
${job.jdText}

Signals: ${JSON.stringify(matches.signals, null, 2)}`;

  if (!(await isLlmAvailableFor(userId))) {
    return buildRuleBasedInterviewPrep(job, matches.signals);
  }

  const result = await llmJson({
    system: INTERVIEW_PREP_PROMPT,
    user: prompt,
    parse: (raw) =>
      interviewPrepSchema.parse(JSON.parse(extractJsonBlock(raw))),
    maxTokens: 2000,
    userId,
  });

  if (result.ok) return result.data;
  return buildRuleBasedInterviewPrep(job, matches.signals);
}

function buildRuleBasedInterviewPrep(
  job: Awaited<ReturnType<typeof getJob>>,
  signals: Awaited<ReturnType<typeof computeMatches>>["signals"]
): InterviewPrep {
  const company = job.company ?? "the company";
  const role = job.title ?? "this role";
  const archetype = signals.archetype ?? "Software Engineer";
  const focusAreas = [
    ...signals.requiredSkills.slice(0, 4),
    ...signals.preferredSkills.slice(0, 2),
  ];

  const companyIntel = [
    `${company} is hiring for ${role}.`,
    signals.summary ? `Job summary: ${signals.summary}` : null,
    `The role reads like a ${archetype} position.`,
    focusAreas.length
      ? `Core areas to expect in interviews: ${focusAreas.join(", ")}.`
      : null,
  ]
    .filter(Boolean)
    .join(" ");

  const questions = dedupeOrdered([
    `Walk me through why you are interested in ${role} at ${company}.`,
    `Which parts of your background best match this ${archetype} role?`,
    ...signals.requiredSkills.slice(0, 6).map(
      (skill) => `Tell me about a project where you used ${skill}.`
    ),
    ...signals.preferredSkills.slice(0, 3).map(
      (skill) => `How much hands-on experience do you have with ${skill}?`
    ),
    `What tradeoffs would you expect to handle in this role?`,
    `How would you ramp up quickly in your first 30 days?`,
  ]).slice(0, 12);

  const technicalPrep = [
    focusAreas.length
      ? `Review these areas first: ${focusAreas.join(", ")}.`
      : "Review the core skills and workflows mentioned in the job description.",
    signals.keywords.length
      ? `Practice speaking clearly about these topics: ${signals.keywords
          .slice(0, 8)
          .join(", ")}.`
      : null,
    "Prepare 2-3 concrete stories with context, decisions, tradeoffs, and measurable outcomes.",
  ]
    .filter(Boolean)
    .join(" ");

  return interviewPrepSchema.parse({
    companyIntel,
    questions,
    technicalPrep,
  });
}

function dedupeOrdered(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const key = item.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(item);
    }
  }
  return out;
}
