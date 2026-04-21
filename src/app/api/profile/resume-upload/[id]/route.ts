import { handle, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { getUploadStatus } from "@/modules/profile/upload";

export const runtime = "nodejs";

export const GET = handle(async (_req, ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  return ok(await getUploadStatus(user.id, id));
});
