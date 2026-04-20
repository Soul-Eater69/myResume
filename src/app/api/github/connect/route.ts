import { z } from "zod";
import { handle, ok, parseJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { connectGithub, disconnectGithub } from "@/modules/github/service";

const connectSchema = z.object({ token: z.string().min(20) });

export const POST = handle(async (req) => {
  const user = await requireUser();
  const input = await parseJson(req, connectSchema);
  return ok(await connectGithub(user.id, input.token));
});

export const DELETE = handle(async () => {
  const user = await requireUser();
  await disconnectGithub(user.id);
  return ok({ status: "disconnected" });
});
