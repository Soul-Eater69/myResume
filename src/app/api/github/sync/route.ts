import { handle, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { syncRepos } from "@/modules/github/service";

export const POST = handle(async () => {
  const user = await requireUser();
  return ok(await syncRepos(user.id));
});
