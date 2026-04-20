"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Radio } from "@/components/ui/input";
import { Badge, StatusDot } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";

type Provider = "anthropic" | "openai";

export type AiSettingView = {
  provider: Provider;
  anthropicModel: string | null;
  openaiModel: string | null;
  hasAnthropicKey: boolean;
  hasOpenaiKey: boolean;
  envHasAnthropicKey: boolean;
  envHasOpenaiKey: boolean;
  supportedModels: Record<Provider, string[]>;
};

export function AiSettingsForm({ initial }: { initial: AiSettingView }) {
  const router = useRouter();
  const toast = useToast();
  const [provider, setProvider] = useState<Provider>(initial.provider);
  const [anthropicModel, setAnthropicModel] = useState(
    initial.anthropicModel || initial.supportedModels.anthropic[0]
  );
  const [openaiModel, setOpenaiModel] = useState(
    initial.openaiModel || initial.supportedModels.openai[0]
  );
  const [anthropicKey, setAnthropicKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [hasAnthropicKey, setHasAnthropicKey] = useState(initial.hasAnthropicKey);
  const [hasOpenaiKey, setHasOpenaiKey] = useState(initial.hasOpenaiKey);
  const [saving, setSaving] = useState(false);

  const keyEnabled =
    provider === "openai"
      ? hasOpenaiKey || initial.envHasOpenaiKey
      : hasAnthropicKey || initial.envHasAnthropicKey;

  async function save() {
    setSaving(true);
    const body: Record<string, unknown> = {
      provider,
      anthropicModel,
      openaiModel,
    };
    if (anthropicKey) body.anthropicApiKey = anthropicKey;
    if (openaiKey) body.openaiApiKey = openaiKey;
    const res = await fetch("/api/ai/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error("Could not save settings", data.message || "Try again.");
      return;
    }
    const data = (await res.json()) as AiSettingView;
    setHasAnthropicKey(data.hasAnthropicKey);
    setHasOpenaiKey(data.hasOpenaiKey);
    setAnthropicKey("");
    setOpenaiKey("");
    toast.success(
      "AI settings saved",
      `${data.provider === "openai" ? "OpenAI" : "Anthropic Claude"} is now active.`
    );
    router.refresh();
  }

  async function clearKey(which: "anthropic" | "openai") {
    setSaving(true);
    const res = await fetch("/api/ai/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider,
        anthropicModel,
        openaiModel,
        clearAnthropicKey: which === "anthropic",
        clearOpenaiKey: which === "openai",
      }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error("Could not clear key");
      return;
    }
    const data = (await res.json()) as AiSettingView;
    setHasAnthropicKey(data.hasAnthropicKey);
    setHasOpenaiKey(data.hasOpenaiKey);
    toast.success("Key cleared");
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="text-xs font-medium uppercase tracking-wider text-fg-muted mb-2">
          Provider
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <ProviderTile
            active={provider === "anthropic"}
            onClick={() => setProvider("anthropic")}
            name="Anthropic Claude"
            model={anthropicModel}
            connected={hasAnthropicKey || initial.envHasAnthropicKey}
            source={
              hasAnthropicKey
                ? "Your key"
                : initial.envHasAnthropicKey
                ? "Env key"
                : "No key"
            }
          />
          <ProviderTile
            active={provider === "openai"}
            onClick={() => setProvider("openai")}
            name="OpenAI GPT"
            model={openaiModel}
            connected={hasOpenaiKey || initial.envHasOpenaiKey}
            source={
              hasOpenaiKey
                ? "Your key"
                : initial.envHasOpenaiKey
                ? "Env key"
                : "No key"
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Claude model">
          <Select
            value={anthropicModel}
            onChange={(e) => setAnthropicModel(e.target.value)}
          >
            {initial.supportedModels.anthropic.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </Select>
        </Field>
        <Field label="OpenAI model">
          <Select
            value={openaiModel}
            onChange={(e) => setOpenaiModel(e.target.value)}
          >
            {initial.supportedModels.openai.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="space-y-3">
        <KeyField
          label="Anthropic API key"
          placeholder="sk-ant-…"
          value={anthropicKey}
          onChange={setAnthropicKey}
          hasSaved={hasAnthropicKey}
          envFallback={initial.envHasAnthropicKey}
          onClear={() => clearKey("anthropic")}
          saving={saving}
        />
        <KeyField
          label="OpenAI API key"
          placeholder="sk-…"
          value={openaiKey}
          onChange={setOpenaiKey}
          hasSaved={hasOpenaiKey}
          envFallback={initial.envHasOpenaiKey}
          onClear={() => clearKey("openai")}
          saving={saving}
        />
      </div>

      <div className="pt-3 border-t border-border-subtle flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-fg-muted">
          <StatusDot status={keyEnabled ? "success" : "warning"} />
          {keyEnabled
            ? `Using ${provider === "openai" ? "OpenAI" : "Anthropic"} for AI flows.`
            : "No key available — deterministic fallback will be used."}
        </div>
        <Button
          onClick={save}
          loading={saving}
          loadingText="Saving…"
          leftIcon={<Icon.Check className="h-4 w-4" />}
        >
          Save settings
        </Button>
      </div>
    </div>
  );
}

function ProviderTile({
  active,
  onClick,
  name,
  model,
  connected,
  source,
}: {
  active: boolean;
  onClick: () => void;
  name: string;
  model: string;
  connected: boolean;
  source: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "text-left rounded-md border px-3 py-3 transition-colors " +
        (active
          ? "border-brand-400 bg-brand-50 ring-2 ring-brand-100"
          : "border-border-subtle bg-white hover:bg-surface-muted/60")
      }
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Radio checked={active} readOnly />
          <span className="text-sm font-semibold text-fg">{name}</span>
        </div>
        {connected ? (
          <Badge variant="verified">Ready</Badge>
        ) : (
          <Badge variant="review">No key</Badge>
        )}
      </div>
      <div className="mt-2 text-xs text-fg-muted flex items-center justify-between">
        <code className="text-[11px]">{model}</code>
        <span className="text-2xs text-fg-subtle">{source}</span>
      </div>
    </button>
  );
}

function KeyField({
  label,
  placeholder,
  value,
  onChange,
  hasSaved,
  envFallback,
  onClear,
  saving,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  hasSaved: boolean;
  envFallback: boolean;
  onClear: () => void;
  saving: boolean;
}) {
  return (
    <Field
      label={label}
      hint={
        hasSaved
          ? "A key is saved. Enter a new one to replace it."
          : envFallback
          ? "Using the server environment key. Provide your own to override."
          : "Provide a key to enable this provider."
      }
    >
      <div className="flex gap-2">
        <Input
          type="password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
        {hasSaved ? (
          <Button
            variant="outline"
            onClick={onClear}
            loading={saving}
            leftIcon={<Icon.Trash className="h-3.5 w-3.5" />}
          >
            Clear
          </Button>
        ) : null}
      </div>
    </Field>
  );
}
