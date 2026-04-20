import { handle, created, parseJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { createCertification } from "@/modules/profile/service";
import { certificationInputSchema } from "@/schemas/profile";

export const POST = handle(async (req) => {
  const user = await requireUser();
  const input = await parseJson(req, certificationInputSchema);
  return created(await createCertification(user.id, input));
});
