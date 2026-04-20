import { handle, ok, parseJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { getFullProfile, updateProfile } from "@/modules/profile/service";
import { profileUpdateSchema } from "@/schemas/profile";

export const GET = handle(async () => {
  const user = await requireUser();
  return ok(await getFullProfile(user.id));
});

export const PATCH = handle(async (req) => {
  const user = await requireUser();
  const input = await parseJson(req, profileUpdateSchema);
  return ok(await updateProfile(user.id, input));
});
