import Anthropic from "@anthropic-ai/sdk";
import { logger } from "@/lib/logger";

export type LlmResult<T> =
  | { ok: true; data: T; raw: string; model: string }
  | { ok: false; reason: string };

let client: Anthropic | null = null;

function getClient() {
  if (client) return client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  client = new Anthropic({ apiKey });
  return client;
}

export function isLlmAvailable() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

export async function llmJson<T>(opts: {
  system: string;
  user: string;
  parse: (raw: string) => T;
  maxTokens?: number;
  model?: string;
}): Promise<LlmResult<T>> {
  const c = getClient();
  if (!c) return { ok: false, reason: "no_api_key" };
  const model = opts.model || DEFAULT_MODEL;
  try {
    const resp = await c.messages.create({
      model,
      max_tokens: opts.maxTokens ?? 2000,
      system: opts.system,
      messages: [{ role: "user", content: opts.user }],
    });
    const block = resp.content.find((b) => b.type === "text");
    const raw = block && "text" in block ? block.text : "";
    const data = opts.parse(raw);
    return { ok: true, data, raw, model };
  } catch (err) {
    logger.warn("llm_call_failed", {
      message: err instanceof Error ? err.message : String(err),
    });
    return { ok: false, reason: "llm_error" };
  }
}

export function extractJsonBlock(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start >= 0 && end > start) return raw.slice(start, end + 1);
  return raw.trim();
}
