import { handle, ok, noContent, parseJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { deleteProject, updateProject } from "@/modules/profile/service";
import { projectInputSchema } from "@/schemas/profile";

export const PATCH = handle(async (req, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await params;
  const input = await parseJson(req, projectInputSchema.partial());
  return ok(await updateProject(user.id, id, input));
});

export const DELETE = handle(async (_req, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await params;
  await deleteProject(user.id, id);
  return noContent();
});
