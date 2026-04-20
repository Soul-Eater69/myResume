import { handle, created, parseJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { createSkill } from "@/modules/profile/service";
import { skillInputSchema } from "@/schemas/profile";

export const POST = handle(async (req) => {
  const user = await requireUser();
  const input = await parseJson(req, skillInputSchema);
  return created(await createSkill(user.id, input));
});
