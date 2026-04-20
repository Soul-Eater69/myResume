import { handle, ok, created, parseJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { createJob, listJobs } from "@/modules/jobs/service";
import { jobInputSchema } from "@/schemas/job";

export const GET = handle(async () => {
  const user = await requireUser();
  return ok(await listJobs(user.id));
});

export const POST = handle(async (req) => {
  const user = await requireUser();
  const input = await parseJson(req, jobInputSchema);
  return created(await createJob(user.id, input));
});
