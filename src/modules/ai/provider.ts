import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { decryptSecret } from "@/lib/crypto";

export type AiProvider = "anthropic" | "openai";

export type AiContext = {
  provider: AiProvider;
  model: string;
  apiKey: string | null;
  source: "user" | "env" | "none";
};

export type LlmResult<T> =
  | { ok: true; data: T; raw: string; model: string; provider: AiProvider }
  | { ok: false; reason: string };

const DEFAULT_ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
const DEFAULT_OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

export const SUPPORTED_MODELS: Record<AiProvider, string[]> = {
  anthropic: [
    "claude-opus-4-7",
    "claude-sonnet-4-6",
    "claude-haiku-4-5-20251001",
  ],
  openai: [
    "gpt-4o",
    "gpt-4o-mini",
    "gpt-4.1",
    "gpt-4.1-mini",
  ],
};

export function envProvider(): AiProvider {
  const raw = (process.env.AI_PROVIDER || "").toLowerCase();
  if (raw === "openai") return "openai";
  if (raw === "anthropic") return "anthropic";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.OPENAI_API_KEY) return "openai";
  return "anthropic";
}

function envKey(provider: AiProvider): string | null {
  return provider === "openai"
    ? process.env.OPENAI_API_KEY || null
    : process.env.ANTHROPIC_API_KEY || null;
}

function envModel(provider: AiProvider): string {
  return provider === "openai" ? DEFAULT_OPENAI_MODEL : DEFAULT_ANTHROPIC_MODEL;
}

export async function resolveAiContext(userId?: string | null): Promise<AiContext> {
  if (userId) {
    const setting = await db.aiSetting.findUnique({ where: { userId } }).catch(() => null);
    if (setting) {
      const provider = (setting.provider as AiProvider) || "anthropic";
      const userKey =
        provider === "openai" ? setting.openaiKeyEncrypted : setting.anthropicKeyEncrypted;
      const userModel =
        provider === "openai" ? setting.openaiModel : setting.anthropicModel;
      if (userKey) {
        try {
          return {
            provider,
            model: userModel || envModel(provider),
            apiKey: decryptSecret(userKey),
            source: "user",
          };
        } catch (err) {
          logger.warn("ai_key_decrypt_failed", {
            message: err instanceof Error ? err.message : String(err),
          });
        }
      }
      const fallbackKey = envKey(provider);
      if (fallbackKey) {
        return {
          provider,
          model: userModel || envModel(provider),
          apiKey: fallbackKey,
          source: "env",
        };
      }
    }
  }
  const provider = envProvider();
  const apiKey = envKey(provider);
  return {
    provider,
    model: envModel(provider),
    apiKey,
    source: apiKey ? "env" : "none",
  };
}

export async function isLlmAvailableFor(userId?: string | null): Promise<boolean> {
  const ctx = await resolveAiContext(userId);
  return Boolean(ctx.apiKey);
}

export function isLlmAvailable(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY);
}

export async function llmJson<T>(opts: {
  system: string;
  user: string;
  parse: (raw: string) => T;
  maxTokens?: number;
  userId?: string | null;
}): Promise<LlmResult<T>> {
  const ctx = await resolveAiContext(opts.userId);
  if (!ctx.apiKey) return { ok: false, reason: "no_api_key" };

  try {
    const raw =
      ctx.provider === "openai"
        ? await callOpenAI({
            apiKey: ctx.apiKey,
            model: ctx.model,
            system: opts.system,
            user: opts.user,
            maxTokens: opts.maxTokens ?? 2000,
          })
        : await callAnthropic({
            apiKey: ctx.apiKey,
            model: ctx.model,
            system: opts.system,
            user: opts.user,
            maxTokens: opts.maxTokens ?? 2000,
          });
    const data = opts.parse(raw);
    return { ok: true, data, raw, model: ctx.model, provider: ctx.provider };
  } catch (err) {
    logger.warn("llm_call_failed", {
      provider: ctx.provider,
      model: ctx.model,
      message: err instanceof Error ? err.message : String(err),
    });
    return { ok: false, reason: "llm_error" };
  }
}

async function callAnthropic(o: {
  apiKey: string;
  model: string;
  system: string;
  user: string;
  maxTokens: number;
}): Promise<string> {
  const client = new Anthropic({ apiKey: o.apiKey });
  const resp = await client.messages.create({
    model: o.model,
    max_tokens: o.maxTokens,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    system: [{ type: "text", text: o.system, cache_control: { type: "ephemeral" } }] as any,
    messages: [{ role: "user", content: o.user }],
  });
  const block = resp.content.find((b) => b.type === "text");
  return block && "text" in block ? block.text : "";
}

async function callOpenAI(o: {
  apiKey: string;
  model: string;
  system: string;
  user: string;
  maxTokens: number;
}): Promise<string> {
  const client = new OpenAI({ apiKey: o.apiKey });
  const resp = await client.chat.completions.create({
    model: o.model,
    max_tokens: o.maxTokens,
    messages: [
      { role: "system", content: o.system },
      { role: "user", content: o.user },
    ],
  });
  return resp.choices[0]?.message?.content ?? "";
}

export function extractJsonBlock(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start >= 0 && end > start) return raw.slice(start, end + 1);
  return raw.trim();
}
