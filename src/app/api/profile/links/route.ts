import { handle, created, parseJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { createLink } from "@/modules/profile/service";
import { profileLinkInputSchema } from "@/schemas/profile";

export const POST = handle(async (req) => {
  const user = await requireUser();
  const input = await parseJson(req, profileLinkInputSchema);
  return created(await createLink(user.id, input));
});
