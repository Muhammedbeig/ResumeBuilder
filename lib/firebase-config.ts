import "server-only";

import { panelInternalPost } from "@/lib/panel-internal-api";

const CACHE_TTL_MS = 60_000;

const SETTINGS_KEYS = [
  "apiKey",
  "authDomain",
  "projectId",
  "storageBucket",
  "messagingSenderId",
  "appId",
  "measurementId",
  "firebase_project_id",
] as const;

export type FirebaseWebConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId: string;
};

let cached: FirebaseWebConfig | null = null;
let cachedAt = 0;

function normalize(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

function readFirstEnvValue(names: string[]): string {
  for (const name of names) {
    const value = normalize(process.env[name]);
    if (value) return value;
  }
  return "";
}

function readFirebaseConfigFromEnv(): FirebaseWebConfig {
  const projectId = readFirstEnvValue(["NEXT_PUBLIC_FIREBASE_PROJECT_ID", "FIREBASE_PROJECT_ID"]);
  return {
    apiKey: readFirstEnvValue(["NEXT_PUBLIC_FIREBASE_API_KEY", "FIREBASE_API_KEY"]),
    authDomain: readFirstEnvValue(["NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", "FIREBASE_AUTH_DOMAIN"]),
    projectId,
    storageBucket: readFirstEnvValue(["NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET", "FIREBASE_STORAGE_BUCKET"]),
    messagingSenderId: readFirstEnvValue([
      "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
      "FIREBASE_MESSAGING_SENDER_ID",
    ]),
    appId: readFirstEnvValue(["NEXT_PUBLIC_FIREBASE_APP_ID", "FIREBASE_APP_ID"]),
    measurementId: readFirstEnvValue(["NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID", "FIREBASE_MEASUREMENT_ID"]),
  };
}

async function readFirebaseConfigFromPanel(): Promise<Record<string, string>> {
  const data = await panelInternalPost<{ settings: Record<string, string | null> }>("settings/batch", {
    body: { keys: [...SETTINGS_KEYS] },
  });

  const map: Record<string, string> = {};
  for (const [key, value] of Object.entries(data.settings ?? {})) {
    map[key] = value ? String(value).trim() : "";
  }
  return map;
}

export function isFirebaseWebConfigComplete(config: FirebaseWebConfig): boolean {
  return Boolean(
    config.apiKey &&
      config.authDomain &&
      config.projectId &&
      config.storageBucket &&
      config.messagingSenderId &&
      config.appId
  );
}

export async function getFirebaseWebConfig(): Promise<FirebaseWebConfig> {
  const now = Date.now();
  if (cached && now - cachedAt < CACHE_TTL_MS) {
    return cached;
  }

  let panelSettings: Record<string, string> | null = null;
  try {
    panelSettings = await readFirebaseConfigFromPanel();
  } catch {
    panelSettings = null;
  }

  const envConfig = readFirebaseConfigFromEnv();

  const resolved: FirebaseWebConfig = {
    apiKey: normalize(panelSettings?.apiKey) || envConfig.apiKey,
    authDomain: normalize(panelSettings?.authDomain) || envConfig.authDomain,
    projectId: normalize(panelSettings?.projectId) || normalize(panelSettings?.firebase_project_id) || envConfig.projectId,
    storageBucket: normalize(panelSettings?.storageBucket) || envConfig.storageBucket,
    messagingSenderId: normalize(panelSettings?.messagingSenderId) || envConfig.messagingSenderId,
    appId: normalize(panelSettings?.appId) || envConfig.appId,
    measurementId: normalize(panelSettings?.measurementId) || envConfig.measurementId,
  };

  cached = resolved;
  cachedAt = now;
  return resolved;
}

