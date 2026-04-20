import { z } from "zod";
import { db } from "@/lib/db";
import { encryptSecret } from "@/lib/crypto";
import { SUPPORTED_MODELS, type AiProvider } from "./provider";

export const aiSettingSchema = z.object({
  provider: z.enum(["anthropic", "openai"]),
  anthropicModel: z.string().optional().nullable(),
  openaiModel: z.string().optional().nullable(),
  anthropicApiKey: z.string().optional().nullable(),
  openaiApiKey: z.string().optional().nullable(),
  clearAnthropicKey: z.boolean().optional(),
  clearOpenaiKey: z.boolean().optional(),
});

export type AiSettingInput = z.infer<typeof aiSettingSchema>;

export async function getAiSetting(userId: string) {
  const row = await db.aiSetting.findUnique({ where: { userId } });
  return {
    provider: (row?.provider as AiProvider) || "anthropic",
    anthropicModel: row?.anthropicModel ?? null,
    openaiModel: row?.openaiModel ?? null,
    hasAnthropicKey: Boolean(row?.anthropicKeyEncrypted),
    hasOpenaiKey: Boolean(row?.openaiKeyEncrypted),
    envHasAnthropicKey: Boolean(process.env.ANTHROPIC_API_KEY),
    envHasOpenaiKey: Boolean(process.env.OPENAI_API_KEY),
    supportedModels: SUPPORTED_MODELS,
  };
}

export async function updateAiSetting(userId: string, input: AiSettingInput) {
  const data: {
    provider: string;
    anthropicModel?: string | null;
    openaiModel?: string | null;
    anthropicKeyEncrypted?: string | null;
    openaiKeyEncrypted?: string | null;
  } = {
    provider: input.provider,
  };
  if (input.anthropicModel !== undefined) data.anthropicModel = input.anthropicModel || null;
  if (input.openaiModel !== undefined) data.openaiModel = input.openaiModel || null;
  if (input.clearAnthropicKey) data.anthropicKeyEncrypted = null;
  else if (input.anthropicApiKey)
    data.anthropicKeyEncrypted = encryptSecret(input.anthropicApiKey.trim());
  if (input.clearOpenaiKey) data.openaiKeyEncrypted = null;
  else if (input.openaiApiKey)
    data.openaiKeyEncrypted = encryptSecret(input.openaiApiKey.trim());

  await db.aiSetting.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });
  return getAiSetting(userId);
}
