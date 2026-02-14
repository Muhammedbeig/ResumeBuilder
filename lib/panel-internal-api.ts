import "server-only";

type PanelInternalSuccess<T> = {
  error: false;
  message?: string;
  data: T;
  code?: number;
} & Record<string, unknown>;

type PanelInternalErrorPayload = {
  error: true;
  message?: string;
  data?: unknown;
  code?: number | string;
  details?: string;
} & Record<string, unknown>;

export class PanelInternalApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "PanelInternalApiError";
    this.status = status;
    this.payload = payload;
  }
}

function panelApiBaseUrl() {
  const explicit = process.env.PANEL_API_BASE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");

  const legacy = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (legacy) return `${legacy.replace(/\/+$/, "")}/api`;

  throw new Error("Missing PANEL_API_BASE_URL (or NEXT_PUBLIC_API_URL)");
}

function resolveInternalUrl(path: string) {
  const cleaned = path.replace(/^\/+/, "");
  return `${panelApiBaseUrl()}/internal/${cleaned}`;
}

function internalKey() {
  const key = process.env.RESUPRO_INTERNAL_API_KEY?.trim();
  if (!key) {
    throw new Error("Missing RESUPRO_INTERNAL_API_KEY");
  }
  return key;
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

export async function panelInternalRequest<T>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  options?: {
    userId?: string | null;
    body?: unknown;
    headers?: HeadersInit;
    timeoutMs?: number;
  }
): Promise<T> {
  const url = resolveInternalUrl(path);
  const timeoutMs = options?.timeoutMs ?? 30_000;

  const headers = new Headers(options?.headers);
  headers.set("Accept", "application/json");
  headers.set("X-ResuPro-Internal-Key", internalKey());
  if (options?.userId) {
    headers.set("X-ResuPro-User-Id", options.userId);
  }

  let body: BodyInit | undefined;
  if (options && "body" in options) {
    const rawBody = options.body;
    if (rawBody instanceof FormData) {
      body = rawBody;
    } else if (rawBody !== undefined) {
      if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json; charset=utf-8");
      }
      body = JSON.stringify(rawBody);
    }
  }

  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        method,
        headers,
        body,
        cache: "no-store",
        signal: controller.signal,
      });

      const payload = (await res.json().catch(() => null)) as
        | PanelInternalSuccess<T>
        | PanelInternalErrorPayload
        | null;

      const fallbackStatus = res.ok ? 500 : res.status;

      if (!payload || typeof payload !== "object") {
        throw new PanelInternalApiError(
          `Invalid JSON response from Panel internal API (${method} ${path})`,
          fallbackStatus,
          payload
        );
      }

      if ("error" in payload && payload.error) {
        const status = parseStatusFromPayload(payload, fallbackStatus);
        const message =
          typeof payload.message === "string" && payload.message.trim()
            ? payload.message
            : `Panel internal API error (${method} ${path})`;
        throw new PanelInternalApiError(message, status, payload);
      }

      return (payload as PanelInternalSuccess<T>).data;
    } catch (error) {
      const normalizedError =
        error instanceof PanelInternalApiError
          ? error
          : error instanceof Error && error.name === "AbortError"
          ? new PanelInternalApiError(`Panel internal API timeout (${method} ${path})`, 504, null)
          : new PanelInternalApiError(
              `Panel internal API request failed (${method} ${path})`,
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

  throw new PanelInternalApiError(`Panel internal API request failed (${method} ${path})`, 502, null);
}

export function panelInternalGet<T>(path: string, options?: { userId?: string | null; timeoutMs?: number }) {
  return panelInternalRequest<T>("GET", path, options);
}

export function panelInternalPost<T>(
  path: string,
  options?: { userId?: string | null; body?: unknown; headers?: HeadersInit; timeoutMs?: number }
) {
  return panelInternalRequest<T>("POST", path, options);
}

export function panelInternalPut<T>(
  path: string,
  options?: { userId?: string | null; body?: unknown; headers?: HeadersInit; timeoutMs?: number }
) {
  return panelInternalRequest<T>("PUT", path, options);
}

export function panelInternalPatch<T>(
  path: string,
  options?: { userId?: string | null; body?: unknown; headers?: HeadersInit; timeoutMs?: number }
) {
  return panelInternalRequest<T>("PATCH", path, options);
}

export function panelInternalDelete<T>(
  path: string,
  options?: { userId?: string | null; body?: unknown; headers?: HeadersInit; timeoutMs?: number }
) {
  return panelInternalRequest<T>("DELETE", path, options);
}
