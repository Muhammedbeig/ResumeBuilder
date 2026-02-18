const ORIGIN_ENV_KEYS = [
  "NEXT_PUBLIC_APP_URL",
  "NEXTAUTH_URL",
  "NEXT_PUBLIC_SITE_URL",
] as const;

function firstHeaderValue(value: string | null): string {
  if (!value) return "";
  return value.split(",")[0]?.trim() ?? "";
}

function normalizeOrigin(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;

  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return null;
  }
}

function isPrivateIpv4(hostname: string): boolean {
  const parts = hostname.split(".");
  if (parts.length !== 4) return false;

  const octets = parts.map((part) => Number.parseInt(part, 10));
  if (octets.some((octet) => Number.isNaN(octet) || octet < 0 || octet > 255))
    return false;

  const [a, b] = octets;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;

  return false;
}

function isUnsafeHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (!host) return true;
  if (host === "localhost" || host === "0.0.0.0") return true;
  if (host === "::1" || host === "[::1]") return true;
  if (host.endsWith(".local")) return true;
  if (isPrivateIpv4(host)) return true;
  return false;
}

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

function resolveOriginFromEnv(): string | null {
  for (const key of ORIGIN_ENV_KEYS) {
    const value = process.env[key];
    if (!value) continue;
    const origin = normalizeOrigin(value);
    if (origin) return origin;
  }
  return null;
}

function resolveOriginFromRequest(request: Request): string | null {
  try {
    const reqUrl = new URL(request.url);
    const forwardedHost = firstHeaderValue(request.headers.get("x-forwarded-host"));
    const host = forwardedHost || firstHeaderValue(request.headers.get("host")) || reqUrl.host;
    if (!host) return null;

    const hostname = (() => {
      try {
        return new URL(`http://${host}`).hostname.toLowerCase();
      } catch {
        return "";
      }
    })();

    if (isProduction() && isUnsafeHost(hostname)) return null;

    const forwardedProto = firstHeaderValue(request.headers.get("x-forwarded-proto")).toLowerCase();
    const protocol =
      forwardedProto === "https" || forwardedProto === "http"
        ? forwardedProto
        : reqUrl.protocol === "https:"
          ? "https"
          : reqUrl.protocol === "http:"
            ? "http"
            : "https";

    return normalizeOrigin(`${protocol}://${host}`);
  } catch {
    return null;
  }
}

export function resolveAppOrigin(request: Request): string | null {
  const envOrigin = resolveOriginFromEnv();
  if (envOrigin) return envOrigin;

  const requestOrigin = resolveOriginFromRequest(request);
  if (requestOrigin) return requestOrigin;

  const fallbackOrigin = normalizeOrigin(request.url);
  if (!fallbackOrigin) return null;

  if (isProduction()) {
    try {
      const hostname = new URL(fallbackOrigin).hostname.toLowerCase();
      if (isUnsafeHost(hostname)) return null;
    } catch {
      return null;
    }
  }

  return fallbackOrigin;
}
