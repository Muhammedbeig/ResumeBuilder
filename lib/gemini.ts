import "server-only";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { panelInternalPost } from "@/lib/panel-internal-api";

type AiProvider = "gemini" | "groq";

type SettingsMap = Record<string, string | null>;

type ResolvedProviderConfig = {
  provider: AiProvider;
  geminiApiKey: string | null;
  groqApiKey: string | null;
  groqModel: string;
};

type TextResponse = {
  text(): string;
};

type ModelResult = {
  response: TextResponse | PromiseLike<TextResponse>;
};

type ModelAdapter = {
  generateContent(prompt: string): Promise<ModelResult>;
};

type GroqChoice = {
  message?: {
    content?:
      | string
      | Array<{
          type?: string;
          text?: string;
        }>;
  };
};

type GroqResponse = {
  choices?: GroqChoice[];
  error?: { message?: string };
  message?: string;
};

let cachedResolvedConfig: ResolvedProviderConfig | null = null;
let cachedAt = 0;

let cachedGeminiClient: GoogleGenerativeAI | null = null;
let cachedGeminiKey: string | undefined;

let cachedGroqModel: GroqGenerativeModel | null = null;
let cachedGroqFingerprint: string | undefined;

const DEFAULT_CACHE_TTL_MS = 60_000;
const WORKER_CACHE_TTL_MS = 5_000;
const DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile";

function getProviderCacheTtlMs(): number {
  const configured = Number.parseInt(process.env.AI_SETTINGS_CACHE_MS ?? "", 10);
  if (Number.isFinite(configured) && configured >= 0) {
    return configured;
  }
  return process.env.RB_WORKER_MODE?.trim() === "1"
    ? WORKER_CACHE_TTL_MS
    : DEFAULT_CACHE_TTL_MS;
}

class GroqGenerativeModel implements ModelAdapter {
  constructor(
    private readonly apiKey: string,
    private readonly model: string,
  ) {}

  async generateContent(prompt: string): Promise<ModelResult> {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const payload = (await response.json().catch(() => null)) as
      | GroqResponse
      | null;

    if (!response.ok) {
      const message =
        payload?.error?.message ||
        payload?.message ||
        `Groq request failed with status ${response.status}`;
      throw new Error(message);
    }

    const firstChoice = payload?.choices?.[0];
    const content = firstChoice?.message?.content;
    const text =
      typeof content === "string"
        ? content
        : Array.isArray(content)
          ? content.map((item) => item.text ?? "").join("")
          : "";

    if (!text.trim()) {
      throw new Error("Groq returned an empty response");
    }

    return {
      response: {
        text: () => text,
      },
    };
  }
}

function normalizeProvider(value: string | null | undefined): AiProvider | null {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "groq") return "groq";
  if (normalized === "gemini") return "gemini";
  return null;
}

function isTruthyFlag(value: string | null | undefined): boolean {
  const normalized = value?.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

function clean(value: string | null | undefined): string | null {
  const normalized = value?.trim() ?? "";
  return normalized.length > 0 ? normalized : null;
}

async function getAiSettingsFromPanel(): Promise<SettingsMap | null> {
  try {
    const data = await panelInternalPost<{
      settings: Record<string, string | null>;
    }>("settings/batch", {
      body: {
        keys: [
          "gemini_api_key",
          "groq_api_key",
          "groq_model",
          "groq_enabled",
          "ai_engine",
        ],
      },
    });
    return data.settings ?? null;
  } catch {
    return null;
  }
}

async function resolveProviderConfig(): Promise<ResolvedProviderConfig> {
  const now = Date.now();
  if (cachedResolvedConfig && now - cachedAt < getProviderCacheTtlMs()) {
    return cachedResolvedConfig;
  }

  const panelSettings = await getAiSettingsFromPanel();

  const panelProviderFromEngine = normalizeProvider(panelSettings?.ai_engine);
  const hasPanelGroqToggle =
    panelSettings !== null &&
    Object.prototype.hasOwnProperty.call(panelSettings, "groq_enabled");
  const panelProviderFromToggle = hasPanelGroqToggle
    ? (isTruthyFlag(panelSettings?.groq_enabled) ? "groq" : "gemini")
    : null;
  const panelProvider =
    panelProviderFromEngine &&
    panelProviderFromToggle &&
    panelProviderFromEngine !== panelProviderFromToggle
      ? panelProviderFromToggle
      : panelProviderFromEngine || panelProviderFromToggle;
  const envProvider =
    normalizeProvider(process.env.AI_ENGINE) ||
    (isTruthyFlag(process.env.GROQ_ENABLED) ? "groq" : null);
  let provider: AiProvider = panelProvider || envProvider || "gemini";

  const geminiApiKey =
    clean(panelSettings?.gemini_api_key) || clean(process.env.GEMINI_API_KEY);
  const groqApiKey =
    clean(panelSettings?.groq_api_key) || clean(process.env.GROQ_API_KEY);

  // Keep provider switching resilient: if selected provider has no key,
  // transparently fall back to the other configured provider.
  if (provider === "groq" && !groqApiKey && geminiApiKey) {
    provider = "gemini";
  } else if (provider === "gemini" && !geminiApiKey && groqApiKey) {
    provider = "groq";
  }

  const resolved: ResolvedProviderConfig = {
    provider,
    geminiApiKey,
    groqApiKey,
    groqModel:
      clean(panelSettings?.groq_model) || clean(process.env.GROQ_MODEL) || DEFAULT_GROQ_MODEL,
  };

  if (provider === "groq" && !resolved.groqApiKey) {
    throw new Error("Missing GROQ_API_KEY (panel setting or environment variable)");
  }

  if (provider === "gemini" && !resolved.geminiApiKey) {
    throw new Error(
      "Missing GEMINI_API_KEY (panel setting or environment variable)",
    );
  }

  cachedResolvedConfig = resolved;
  cachedAt = now;
  return resolved;
}

async function getGeminiClient(apiKey: string): Promise<GoogleGenerativeAI> {
  if (!cachedGeminiClient || cachedGeminiKey !== apiKey) {
    cachedGeminiClient = new GoogleGenerativeAI(apiKey);
    cachedGeminiKey = apiKey;
  }
  return cachedGeminiClient;
}

export async function getGeminiModel(
  model: string = "gemini-2.5-flash",
): Promise<ModelAdapter> {
  const config = await resolveProviderConfig();

  if (config.provider === "groq") {
    const fingerprint = `${config.groqApiKey}|${config.groqModel}`;
    if (!cachedGroqModel || cachedGroqFingerprint !== fingerprint) {
      cachedGroqModel = new GroqGenerativeModel(
        config.groqApiKey as string,
        config.groqModel,
      );
      cachedGroqFingerprint = fingerprint;
    }
    return cachedGroqModel;
  }

  const client = await getGeminiClient(config.geminiApiKey as string);
  return client.getGenerativeModel({ model }) as unknown as ModelAdapter;
}
