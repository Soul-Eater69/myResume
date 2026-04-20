import { handle, created, parseJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { createEducation } from "@/modules/profile/service";
import { educationInputSchema } from "@/schemas/profile";

export const POST = handle(async (req) => {
  const user = await requireUser();
  const input = await parseJson(req, educationInputSchema);
  return created(await createEducation(user.id, input));
});
