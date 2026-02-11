import "server-only";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";

let cachedKey: string | undefined;
let cachedClient: GoogleGenerativeAI | null = null;
let cachedAt = 0;

const KEY_CACHE_TTL_MS = 60_000;

async function getKeyFromSettings(): Promise<string | null> {
  try {
    const rows = await prisma.$queryRaw<Array<{ value: string | null }>>`
      SELECT value FROM settings WHERE name = 'gemini_api_key' LIMIT 1
    `;
    const value = rows?.[0]?.value ?? null;
    return value ? String(value).trim() : null;
  } catch {
    return null;
  }
}

async function resolveApiKey(): Promise<string> {
  const now = Date.now();
  if (cachedKey && now - cachedAt < KEY_CACHE_TTL_MS) {
    return cachedKey;
  }

  const dbKey = await getKeyFromSettings();
  const envKey = process.env.GEMINI_API_KEY?.trim();
  const apiKey = dbKey || envKey;

  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY (panel setting or environment variable)");
  }

  cachedKey = apiKey;
  cachedAt = now;
  return apiKey;
}

async function getClient(): Promise<GoogleGenerativeAI> {
  const apiKey = await resolveApiKey();
  if (!cachedClient || cachedKey !== apiKey) {
    cachedKey = apiKey;
    cachedClient = new GoogleGenerativeAI(apiKey);
  }
  return cachedClient;
}

export async function getGeminiModel(model: string = "gemini-2.5-flash") {
  const client = await getClient();
  return client.getGenerativeModel({ model });
}
