import { handle, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { getJob, runExtraction } from "@/modules/jobs/service";

export const POST = handle(async (_req, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await params;
  await getJob(user.id, id);
  const signals = await runExtraction(id);
  return ok({ jobId: id, signals });
});
