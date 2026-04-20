import { handle, ok, noContent, parseJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { deleteExperience, updateExperience } from "@/modules/profile/service";
import { experienceInputSchema } from "@/schemas/profile";

export const PATCH = handle(async (req, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await params;
  const input = await parseJson(req, experienceInputSchema.partial());
  return ok(await updateExperience(user.id, id, input));
});

export const DELETE = handle(async (_req, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await params;
  await deleteExperience(user.id, id);
  return noContent();
});
