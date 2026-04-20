import { handle, created, parseJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { createExperience } from "@/modules/profile/service";
import { experienceInputSchema } from "@/schemas/profile";

export const POST = handle(async (req) => {
  const user = await requireUser();
  const input = await parseJson(req, experienceInputSchema);
  return created(await createExperience(user.id, input));
});
