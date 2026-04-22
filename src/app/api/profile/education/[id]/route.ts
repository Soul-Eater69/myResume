import { handle, ok, noContent, parseJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { deleteEducation, updateEducation } from "@/modules/profile/service";
import { educationInputSchema } from "@/schemas/profile";

export const PATCH = handle(async (req, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await params;
  const input = await parseJson(req, educationInputSchema.partial());
  return ok(await updateEducation(user.id, id, input));
});

export const DELETE = handle(async (_req, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await params;
  await deleteEducation(user.id, id);
  return noContent();
});
