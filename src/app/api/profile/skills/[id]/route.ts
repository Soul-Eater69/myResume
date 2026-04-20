import { handle, noContent } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { deleteSkill } from "@/modules/profile/service";

export const DELETE = handle(async (_req, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await params;
  await deleteSkill(user.id, id);
  return noContent();
});
