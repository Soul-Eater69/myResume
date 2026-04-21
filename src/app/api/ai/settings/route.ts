import { handle, ok, parseJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { aiSettingSchema, getAiSetting, updateAiSetting } from "@/modules/ai/settings";

export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  const user = await requireUser();
  return ok(await getAiSetting(user.id));
});

export const PUT = handle(async (req) => {
  const user = await requireUser();
  const input = await parseJson(req, aiSettingSchema);
  return ok(await updateAiSetting(user.id, input));
});
