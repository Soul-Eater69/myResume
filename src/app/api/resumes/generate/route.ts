import { handle, ok, parseJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { generateResume, generateSchema } from "@/modules/resumes/service";

export const POST = handle(async (req) => {
  const user = await requireUser();
  const input = await parseJson(req, generateSchema);
  return ok(await generateResume(user.id, input));
});
