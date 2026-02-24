"use client";

const API_PREFIX = "/api";
const RB_PREFIX = "/rb";

function parseDirectModeEnabled(raw: string | undefined): boolean {
  const value = (raw ?? "").trim().toLowerCase();
  // Default ON for static deployments where host rewrites may not be available.
  if (value === "") return true;
  return !["0", "false", "off", "no"].includes(value);
}

const DIRECT_MODE_ENABLED = parseDirectModeEnabled(
  process.env.NEXT_PUBLIC_API_DIRECT_MODE,
);

const API_ROOT_CANDIDATES = [
  process.env.NEXT_PUBLIC_API_BASE_URL ?? null,
  process.env.NEXT_PUBLIC_API_URL ?? null,
] as const;

function normalizeApiRoot(value?: string | null): string | null {
  if (!value) return null;

  const raw = value.trim();
  if (!raw) return null;

  try {
    const parsed = new URL(raw);
    const trimmedPath = parsed.pathname.replace(/\/+$/, "");
    let apiPath = trimmedPath;
    if (apiPath.endsWith("/api/rb")) {
      // already normalized
    } else if (apiPath.endsWith("/api")) {
      apiPath = `${apiPath}${RB_PREFIX}`;
    } else {
      apiPath = `${apiPath}/api${RB_PREFIX}`;
    }
    return `${parsed.origin}${apiPath.replace(/\/{2,}/g, "/")}`;
  } catch {
    return null;
  }
}

function isLocalHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host === "::1"
  );
}

function inferPanelApiRootFromLocation(): string | null {
  if (typeof window === "undefined") return null;
  const host = window.location.hostname.toLowerCase();
  if (isLocalHost(host)) return null;

  const parts = host.split(".").filter(Boolean);
  if (parts.length < 2) return null;

  const registrable = parts.slice(-2).join(".");
  const panelHost = host.startsWith("panel.") ? host : `panel.${registrable}`;
  return normalizeApiRoot(
    `${window.location.protocol}//${panelHost}/public/api`,
  );
}

function getConfiguredApiRoot(): string | null {
  const browserHost =
    typeof window !== "undefined"
      ? window.location.hostname.toLowerCase()
      : null;

  for (const candidate of API_ROOT_CANDIDATES) {
    const normalized = normalizeApiRoot(candidate);
    if (!normalized) continue;

    if (browserHost) {
      try {
        const configuredHost = new URL(normalized).hostname.toLowerCase();
        if (isLocalHost(configuredHost) && !isLocalHost(browserHost)) {
          continue;
        }
      } catch {
        continue;
      }
    }

    return normalized;
  }

  return inferPanelApiRootFromLocation();
}

function isApiPath(pathname: string) {
  return pathname === API_PREFIX || pathname.startsWith(`${API_PREFIX}/`);
}

function toApiTail(pathname: string) {
  if (pathname === API_PREFIX) return "";
  if (pathname.startsWith(`${API_PREFIX}/`))
    return pathname.slice(API_PREFIX.length);
  return pathname;
}

function buildTargetUrl(input: URL, apiRoot: string) {
  const target = new URL(apiRoot);
  const rootPath = target.pathname.replace(/\/+$/, "");
  target.pathname = `${rootPath}${toApiTail(input.pathname)}`;
  target.search = input.search;
  target.hash = input.hash;
  return target.toString();
}

export function resolveApiUrl(input: string): string {
  if (typeof window === "undefined") return input;

  let parsed: URL;
  try {
    parsed = new URL(input, window.location.origin);
  } catch {
    return input;
  }

  if (!isApiPath(parsed.pathname)) return input;

  const isLocalRelative = parsed.origin === window.location.origin;
  // Rewrite-first mode: keep relative /api calls so host/Next rewrites handle routing.
  // This avoids CORS/cookie issues when Panel is on a different origin.
  if (isLocalRelative && !DIRECT_MODE_ENABLED) {
    return input;
  }

  const configuredApiRoot = getConfiguredApiRoot();
  if (!configuredApiRoot) return input;

  const configuredOrigin = new URL(configuredApiRoot).origin;
  const isAlreadyConfiguredOrigin = parsed.origin === configuredOrigin;
  if (!isLocalRelative && !isAlreadyConfiguredOrigin) {
    return input;
  }

  return buildTargetUrl(parsed, configuredApiRoot);
}

export function resolveAuthBasePath(): string {
  return "/api/auth";
}

let fetchInterceptorInstalled = false;

export function installApiFetchInterceptor() {
  if (fetchInterceptorInstalled) return;
  if (typeof window === "undefined") return;

  const originalFetch = window.fetch.bind(window);

  window.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const configuredApiRoot = getConfiguredApiRoot();
    const configuredOrigin = configuredApiRoot
      ? new URL(configuredApiRoot).origin
      : null;

    let rawUrl: string | null = null;
    if (typeof input === "string") rawUrl = input;
    else if (input instanceof URL) rawUrl = input.toString();
    else if (input instanceof Request) rawUrl = input.url;

    if (!rawUrl) {
      return originalFetch(input, init);
    }

    const rewrittenUrl = resolveApiUrl(rawUrl);
    const originalResolved = new URL(rawUrl, window.location.origin);
    const rewrittenResolved = new URL(rewrittenUrl, window.location.origin);
    const effectiveResolved =
      rewrittenUrl === rawUrl ? originalResolved : rewrittenResolved;

    const shouldIncludeCredentials = Boolean(
      configuredOrigin &&
        configuredOrigin !== window.location.origin &&
        effectiveResolved.origin === configuredOrigin,
    );

    const nextInit: RequestInit | undefined = shouldIncludeCredentials
      ? { ...init, credentials: init?.credentials ?? "include" }
      : init;

    if (rewrittenUrl === rawUrl) {
      return originalFetch(input, nextInit);
    }

    if (input instanceof Request) {
      const rewrittenRequest = new Request(rewrittenUrl, input);
      return originalFetch(rewrittenRequest, nextInit);
    }

    return originalFetch(rewrittenUrl, nextInit);
  }) as typeof window.fetch;

  fetchInterceptorInstalled = true;
}
