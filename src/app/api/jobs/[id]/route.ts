import { handle, ok, noContent, parseJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { deleteJob, getJob, patchJob } from "@/modules/jobs/service";
import { jobPatchSchema } from "@/schemas/job";

export const GET = handle(async (_req, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await params;
  return ok(await getJob(user.id, id));
});

export const PATCH = handle(async (req, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await params;
  const input = await parseJson(req, jobPatchSchema);
  return ok(await patchJob(user.id, id, input));
});

export const DELETE = handle(async (_req, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await params;
  await deleteJob(user.id, id);
  return noContent();
});
