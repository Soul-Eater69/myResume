import { handle, ok, parseJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { generateInterviewPrep } from "@/modules/interview/service";
import { z } from "zod";

const interviewPrepInputSchema = z.object({
  jobId: z.string().uuid(),
});

export const POST = handle(async (req) => {
  const user = await requireUser();
  const input = await parseJson(req, interviewPrepInputSchema);
  return ok(await generateInterviewPrep(user.id, input.jobId));
});
