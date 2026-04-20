import { handle, ok, parseJson } from "@/lib/api";
import { loginSchema } from "@/schemas/auth";
import { login } from "@/modules/auth/service";

export const POST = handle(async (req) => {
  const input = await parseJson(req, loginSchema);
  const user = await login(input);
  return ok(user);
});
