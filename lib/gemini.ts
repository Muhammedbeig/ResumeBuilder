import "server-only";

import { GoogleGenerativeAI } from "@google/generative-ai";

let cachedKey: string | undefined;
let cachedClient: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY environment variable");
  }
  if (!cachedClient || cachedKey !== apiKey) {
    cachedKey = apiKey;
    cachedClient = new GoogleGenerativeAI(apiKey);
  }
  return cachedClient;
}

export function getGeminiModel(model: string = "gemini-2.5-flash") {
  return getClient().getGenerativeModel({ model });
}
