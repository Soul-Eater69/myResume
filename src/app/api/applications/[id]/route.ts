import { handle, ok, noContent, parseJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { applicationPatchSchema } from "@/schemas/application";
import {
  deleteApplication,
  getApplication,
  patchApplication,
} from "@/modules/applications/service";

export const GET = handle(async (_req, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await params;
  return ok(await getApplication(user.id, id));
});

export const PATCH = handle(async (req, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await params;
  const input = await parseJson(req, applicationPatchSchema);
  return ok(await patchApplication(user.id, id, input));
});

export const DELETE = handle(async (_req, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await params;
  await deleteApplication(user.id, id);
  return noContent();
});
