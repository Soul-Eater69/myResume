import { handle, created, parseJson } from "@/lib/api";
import { signupSchema } from "@/schemas/auth";
import { signup } from "@/modules/auth/service";

export const POST = handle(async (req) => {
  const input = await parseJson(req, signupSchema);
  const user = await signup(input);
  return created(user);
});
