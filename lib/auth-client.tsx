"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { resolveApiUrl } from "@/lib/client-api";

type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  subscription?: string | null;
  subscriptionPlanId?: string | null;
  hasPassword?: boolean;
  authProvider?: string | null;
};

type SessionData = {
  user: SessionUser;
  expires?: string;
} | null;

type SessionStatus = "loading" | "authenticated" | "unauthenticated";

type SignInResponse = {
  error?: string | null;
  status?: number;
  ok?: boolean;
  url?: string | null;
};

type SignOutResponse = {
  url?: string | null;
};

type ProvidersMap = Record<
  string,
  {
    id: string;
    name: string;
    type: string;
    signinUrl?: string;
    callbackUrl?: string;
  }
>;

type SessionContextValue = {
  data: SessionData;
  status: SessionStatus;
  refresh: () => Promise<SessionData>;
  update: (data?: Partial<SessionUser>) => Promise<SessionData>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

function normalizeSessionPayload(payload: unknown): SessionData {
  if (!payload || typeof payload !== "object") return null;
  const candidate = payload as Record<string, unknown>;
  if (!candidate.user || typeof candidate.user !== "object") return null;
  const user = candidate.user as Record<string, unknown>;
  if (typeof user.id !== "string" || user.id.trim() === "") return null;
  return {
    user: {
      ...(user as SessionUser),
      id: user.id,
    },
    expires:
      typeof candidate.expires === "string" ? candidate.expires : undefined,
  };
}

async function fetchSessionFromApi(): Promise<SessionData> {
  const response = await fetch(resolveApiUrl("/api/auth/session"), {
    cache: "no-store",
    credentials: "include",
  });
  if (!response.ok) return null;
  const payload = await response.json().catch(() => null);
  return normalizeSessionPayload(payload);
}

export function SessionProvider({
  children,
}: {
  children: ReactNode;
  basePath?: string;
}) {
  const [data, setData] = useState<SessionData>(null);
  const [status, setStatus] = useState<SessionStatus>("loading");

  const refresh = useCallback(async () => {
    try {
      const next = await fetchSessionFromApi();
      setData(next);
      setStatus(next ? "authenticated" : "unauthenticated");
      return next;
    } catch {
      setData(null);
      setStatus("unauthenticated");
      return null;
    }
  }, []);

  const update = useCallback(
    async (patch?: Partial<SessionUser>) => {
      if (!patch) {
        return refresh();
      }

      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          user: {
            ...prev.user,
            ...patch,
          },
        };
      });

      return fetchSessionFromApi().then((next) => {
        if (next) {
          setData(next);
          setStatus("authenticated");
          return next;
        }
        setStatus("unauthenticated");
        return null;
      });
    },
    [refresh],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const handleAuthChanged = () => {
      void refresh();
    };
    window.addEventListener("resupro-auth-changed", handleAuthChanged);
    return () => {
      window.removeEventListener("resupro-auth-changed", handleAuthChanged);
    };
  }, [refresh]);

  const value = useMemo<SessionContextValue>(
    () => ({
      data,
      status,
      refresh,
      update,
    }),
    [data, status, refresh, update],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within SessionProvider");
  }

  return {
    data: context.data,
    status: context.status,
    update: context.update,
    refresh: context.refresh,
  };
}

export async function getProviders(): Promise<ProvidersMap | null> {
  const response = await fetch(resolveApiUrl("/api/auth/providers"), {
    cache: "no-store",
    credentials: "include",
  }).catch(() => null);
  if (!response || !response.ok) return null;
  return (await response.json().catch(() => null)) as ProvidersMap | null;
}

export async function signIn(
  provider?: string,
  options?: Record<string, unknown>,
): Promise<SignInResponse | undefined> {
  const callbackUrl =
    typeof options?.callbackUrl === "string" ? options.callbackUrl : undefined;
  const redirect = options?.redirect !== false;

  if (provider === "credentials") {
    const response = await fetch(resolveApiUrl("/api/auth/callback/credentials"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        email: options?.email,
        password: options?.password,
        callbackUrl,
      }),
    }).catch(() => null);

    if (!response) {
      return {
        ok: false,
        status: 500,
        error: "Network error",
        url: null,
      };
    }

    const payload = (await response.json().catch(() => null)) as
      | Record<string, unknown>
      | null;
    const result: SignInResponse = {
      ok: response.ok,
      status: response.status,
      error:
        typeof payload?.error === "string"
          ? payload.error
          : response.ok
            ? null
            : "Sign in failed",
      url: typeof payload?.url === "string" ? payload.url : callbackUrl ?? null,
    };

    if (result.ok) {
      window.dispatchEvent(new Event("resupro-auth-changed"));
    }

    if (redirect && result.ok && result.url) {
      window.location.assign(result.url);
      return undefined;
    }

    return result;
  }

  if (provider === "google") {
    const startUrl = new URL(
      resolveApiUrl("/api/auth/google/start"),
      window.location.origin,
    );
    if (callbackUrl) {
      startUrl.searchParams.set("callbackUrl", callbackUrl);
    }

    if (redirect) {
      window.location.assign(startUrl.toString());
      return undefined;
    }

    return { ok: true, status: 200, error: null, url: startUrl.toString() };
  }

  return {
    ok: false,
    status: 400,
    error: "Unsupported provider",
    url: null,
  };
}

export async function signOut(
  options?: Record<string, unknown>,
): Promise<SignOutResponse | undefined> {
  const callbackUrl =
    typeof options?.callbackUrl === "string" ? options.callbackUrl : "/";
  const redirect = options?.redirect !== false;

  const response = await fetch(resolveApiUrl("/api/auth/signout"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ callbackUrl }),
  }).catch(() => null);

  const payload = response
    ? ((await response.json().catch(() => null)) as Record<string, unknown> | null)
    : null;
  const target =
    typeof payload?.url === "string" && payload.url.trim() !== ""
      ? payload.url
      : callbackUrl;

  window.dispatchEvent(new Event("resupro-auth-changed"));

  if (redirect) {
    window.location.assign(target);
    return undefined;
  }

  return { url: target };
}
