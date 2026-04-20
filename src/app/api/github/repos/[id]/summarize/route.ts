import { handle, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { summarizeRepoById } from "@/modules/github/service";

export const POST = handle(async (_req, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await params;
  return ok(await summarizeRepoById(user.id, id));
});
