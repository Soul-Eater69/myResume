import { handle, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { listRepos } from "@/modules/github/service";

export const GET = handle(async () => {
  const user = await requireUser();
  return ok(await listRepos(user.id));
});
