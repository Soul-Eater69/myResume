import { handle, noContent } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { deleteEducation } from "@/modules/profile/service";

export const DELETE = handle(async (_req, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await params;
  await deleteEducation(user.id, id);
  return noContent();
});
