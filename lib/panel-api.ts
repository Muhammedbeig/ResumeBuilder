type PanelApiSuccess<T> = {
  error: false;
  message: string;
  data: T;
  code: number;
} & Record<string, unknown>;

type PanelApiError = {
  error: true;
  message?: string;
  data?: unknown;
  code?: number;
  details?: string;
} & Record<string, unknown>;

const DEFAULT_PANEL_API_BASE_URL = "http://localhost/Panel/public/api";

function panelApiBaseUrl() {
  const explicit = process.env.PANEL_API_BASE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");

  // Backward-compatible: allow configuring just the Panel base URL and we add `/api`.
  const legacyBase = process.env.NEXT_PUBLIC_API_URL;
  if (legacyBase) return `${legacyBase.replace(/\/+$/, "")}/api`;

  return DEFAULT_PANEL_API_BASE_URL.replace(/\/+$/, "");
}

function withLeadingSlash(path: string) {
  return path.startsWith("/") ? path : `/${path}`;
}

async function panelFetch<T>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  options?: {
    params?: Record<string, string | number | boolean | undefined | null>;
    body?: unknown;
    init?: RequestInit;
  }
): Promise<PanelApiSuccess<T>> {
  const url = new URL(panelApiBaseUrl() + withLeadingSlash(path));

  const params = options?.params;
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, String(value));
    }
  }

  const init = options?.init;
  const headers = new Headers(init?.headers);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  // Panel uses this header to choose translated_* fields.
  if (!headers.has("Content-Language")) headers.set("Content-Language", "en");

  let body: BodyInit | undefined = undefined;
  if (options && "body" in options) {
    const rawBody = options.body;
    if (rawBody instanceof FormData) {
      body = rawBody;
    } else if (rawBody !== undefined) {
      if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json; charset=utf-8");
      }
      const contentType = headers.get("Content-Type") ?? "";
      body = contentType.includes("application/json") ? JSON.stringify(rawBody) : (rawBody as BodyInit);
    }
  }

  const res = await fetch(url, {
    ...init,
    method,
    headers,
    body,
    // The Panel is the CMS. Always fetch latest to reflect admin changes immediately.
    cache: "no-store",
  });

  const payload = (await res.json().catch(() => null)) as unknown;
  if (!res.ok) {
    throw new Error(`Panel API error (${res.status}) for ${url.toString()}`);
  }
  if (!payload || typeof payload !== "object") {
    throw new Error(`Invalid JSON response from Panel API for ${url.toString()}`);
  }

  const json = payload as PanelApiSuccess<T> | PanelApiError;
  if ("error" in json && json.error) {
    throw new Error(typeof json.message === "string" ? json.message : "Panel API error");
  }

  return json as PanelApiSuccess<T>;
}

export async function panelGet<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined | null>,
  init?: RequestInit
): Promise<PanelApiSuccess<T>> {
  return panelFetch("GET", path, { params, init });
}

export async function panelPost<T>(
  path: string,
  body?: unknown,
  init?: RequestInit
): Promise<PanelApiSuccess<T>> {
  return panelFetch("POST", path, { body, init });
}
