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

export class PanelApiRequestError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "PanelApiRequestError";
    this.status = status;
    this.payload = payload;
  }
}

function panelApiBaseUrl() {
  const explicit = process.env.PANEL_API_BASE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");

  // Backward-compatible: allow configuring just the Panel base URL and we add `/api`.
  const legacyBase = process.env.NEXT_PUBLIC_API_URL;
  if (legacyBase) return `${legacyBase.replace(/\/+$/, "")}/api`;

  throw new Error("Missing PANEL_API_BASE_URL (or NEXT_PUBLIC_API_URL)");
}

function withLeadingSlash(path: string) {
  return path.startsWith("/") ? path : `/${path}`;
}

function parseStatusFromPayload(payload: unknown, fallback: number): number {
  if (!payload || typeof payload !== "object") return fallback;
  const code = (payload as { code?: unknown }).code;
  const asNumber = typeof code === "string" ? Number.parseInt(code, 10) : code;
  if (typeof asNumber === "number" && Number.isFinite(asNumber) && asNumber >= 100 && asNumber <= 599) {
    return asNumber;
  }
  return fallback;
}

function isRetryableStatus(status: number): boolean {
  return status >= 500 || status === 429;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

  const timeoutMs = 30_000;
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        ...init,
        method,
        headers,
        body,
        cache: "no-store",
        signal: controller.signal,
      });

      const payload = (await res.json().catch(() => null)) as unknown;
      const fallbackStatus = res.ok ? 500 : res.status;

      if (!payload || typeof payload !== "object") {
        throw new PanelApiRequestError(
          `Invalid JSON response from Panel API for ${url.toString()}`,
          fallbackStatus,
          payload
        );
      }

      const json = payload as PanelApiSuccess<T> | PanelApiError;

      if (!res.ok || ("error" in json && json.error)) {
        const status = parseStatusFromPayload(json, fallbackStatus);
        const message =
          typeof json.message === "string" && json.message.trim()
            ? json.message
            : `Panel API error (${status}) for ${url.toString()}`;
        throw new PanelApiRequestError(message, status, json);
      }

      return json as PanelApiSuccess<T>;
    } catch (error) {
      const normalizedError =
        error instanceof PanelApiRequestError
          ? error
          : error instanceof Error && error.name === "AbortError"
          ? new PanelApiRequestError(`Panel API timeout for ${url.toString()}`, 504, null)
          : new PanelApiRequestError(
              `Panel API request failed for ${url.toString()}`,
              502,
              error instanceof Error ? error.message : error
            );

      const canRetry = attempt < maxAttempts && isRetryableStatus(normalizedError.status);
      if (!canRetry) {
        throw normalizedError;
      }

      await delay(200 * attempt);
    } finally {
      clearTimeout(timer);
    }
  }

  throw new PanelApiRequestError(`Panel API request failed for ${url.toString()}`, 502, null);
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
