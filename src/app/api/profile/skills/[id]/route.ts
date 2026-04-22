import { handle, ok, noContent, parseJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { deleteSkill, updateSkill } from "@/modules/profile/service";
import { skillInputSchema } from "@/schemas/profile";

export const PATCH = handle(async (req, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await params;
  const input = await parseJson(req, skillInputSchema.partial());
  return ok(await updateSkill(user.id, id, input));
});

export const DELETE = handle(async (_req, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await params;
  await deleteSkill(user.id, id);
  return noContent();
});
