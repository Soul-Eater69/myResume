import { handle, ok, created, parseJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { applicationInputSchema } from "@/schemas/application";
import {
  createApplication,
  listApplications,
} from "@/modules/applications/service";

export const GET = handle(async () => {
  const user = await requireUser();
  return ok(await listApplications(user.id));
});

export const POST = handle(async (req) => {
  const user = await requireUser();
  const input = await parseJson(req, applicationInputSchema);
  return created(await createApplication(user.id, input));
});
