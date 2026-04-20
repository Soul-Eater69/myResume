import { handle, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { getCurrentUser } from "@/modules/auth/service";

export const GET = handle(async () => {
  const user = await requireUser();
  return ok(await getCurrentUser(user.id));
});
