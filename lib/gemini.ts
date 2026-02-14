import "server-only";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { panelInternalPost } from "@/lib/panel-internal-api";

let cachedResolvedKey: string | undefined;
let cachedClient: GoogleGenerativeAI | null = null;
let cachedClientKey: string | undefined;
let cachedAt = 0;

const KEY_CACHE_TTL_MS = 60_000;

async function getKeyFromSettings(): Promise<string | null> {
  try {
    const data = await panelInternalPost<{ settings: Record<string, string | null> }>("settings/batch", {
      body: { keys: ["gemini_api_key"] },
    });
    const value = data.settings?.gemini_api_key ?? null;
    return value ? String(value).trim() : null;
  } catch {
    return null;
  }
}

async function resolveApiKey(): Promise<string> {
  const now = Date.now();
  if (cachedResolvedKey && now - cachedAt < KEY_CACHE_TTL_MS) {
    return cachedResolvedKey;
  }

  const dbKey = await getKeyFromSettings();
  const envKey = process.env.GEMINI_API_KEY?.trim();
  const apiKey = dbKey || envKey;

  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY (panel setting or environment variable)");
  }

  cachedResolvedKey = apiKey;
  cachedAt = now;
  return apiKey;
}

async function getClient(): Promise<GoogleGenerativeAI> {
  const apiKey = await resolveApiKey();
  if (!cachedClient || cachedClientKey !== apiKey) {
    cachedClient = new GoogleGenerativeAI(apiKey);
    cachedClientKey = apiKey;
  }
  return cachedClient;
}

export async function getGeminiModel(model: string = "gemini-2.5-flash") {
  const client = await getClient();
  return client.getGenerativeModel({ model });
}
