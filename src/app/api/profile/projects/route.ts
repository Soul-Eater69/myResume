import { handle, created, parseJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { createProject } from "@/modules/profile/service";
import { projectInputSchema } from "@/schemas/profile";

export const POST = handle(async (req) => {
  const user = await requireUser();
  const input = await parseJson(req, projectInputSchema);
  return created(await createProject(user.id, input));
});
