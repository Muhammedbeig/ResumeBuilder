import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

import { isValidEmail, normalizeEmail } from "@/lib/auth-validation";
import { panelInternalPost } from "@/lib/panel-internal-api";
import { parseUserIdBigInt } from "@/lib/user-id";

const AUTH_SETTINGS_TTL_MS = 60_000;

type AuthSettings = {
  googleClientId: string;
  googleClientSecret: string;
  googleEnabled: boolean;
  emailEnabled: boolean;
};

type InternalAuthUser = {
  id: string;
  email: string;
  name: string;
  image: string | null;
  subscription: "free" | "pro" | "business";
  subscriptionPlanId: "weekly" | "monthly" | "annual" | null;
};

let cachedAuthSettings: AuthSettings | null = null;
let cachedAuthSettingsAt = 0;
const loginAttemptStore = new Map<string, { count: number; resetAt: number }>();
const LOGIN_RATE_LIMIT_WINDOW_MS = 60_000;
const LOGIN_RATE_LIMIT_MAX = 10;

function readHeaderValue(headers: unknown, headerName: string): string | null {
  if (!headers) return null;
  if (typeof Headers !== "undefined" && headers instanceof Headers) {
    return headers.get(headerName) ?? null;
  }
  if (typeof headers !== "object") return null;
  const map = headers as Record<string, string | string[] | undefined>;
  const direct = map[headerName] ?? map[headerName.toLowerCase()] ?? map[headerName.toUpperCase()];
  if (!direct) return null;
  if (Array.isArray(direct)) return direct[0] ?? null;
  return direct;
}

function getClientIpFromHeaders(headers: unknown): string {
  const forwarded = readHeaderValue(headers, "x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = readHeaderValue(headers, "x-real-ip");
  if (realIp) return realIp.trim();
  const cfIp = readHeaderValue(headers, "cf-connecting-ip");
  if (cfIp) return cfIp.trim();
  return "unknown";
}

function isLoginRateLimited(key: string): boolean {
  const now = Date.now();
  let entry = loginAttemptStore.get(key);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + LOGIN_RATE_LIMIT_WINDOW_MS };
    loginAttemptStore.set(key, entry);
  }

  entry.count += 1;
  return entry.count > LOGIN_RATE_LIMIT_MAX;
}

function clearLoginRateLimit(key: string) {
  loginAttemptStore.delete(key);
}

function parseToggle(value?: string | null): boolean | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  if (["1", "true", "yes", "on", "enabled"].includes(normalized)) return true;
  if (["0", "false", "no", "off", "disabled"].includes(normalized)) return false;
  return null;
}

async function getAuthSettingsFromPanel(): Promise<Record<string, string | null>> {
  const data = await panelInternalPost<{ settings: Record<string, string | null> }>("settings/batch", {
    body: {
      keys: ["google_client_id", "google_client_secret", "google_authentication", "email_authentication"],
    },
  });
  return data.settings ?? {};
}

async function getAuthSettings(): Promise<AuthSettings> {
  const now = Date.now();
  if (cachedAuthSettings && now - cachedAuthSettingsAt < AUTH_SETTINGS_TTL_MS) {
    return cachedAuthSettings;
  }

  let panelSettings: Record<string, string | null> | null = null;
  try {
    panelSettings = await getAuthSettingsFromPanel();
  } catch {
    panelSettings = null;
  }

  const envClientId = process.env.GOOGLE_CLIENT_ID?.trim() ?? "";
  const envClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim() ?? "";

  const googleClientId = (panelSettings?.google_client_id ?? "").trim() || envClientId;
  const googleClientSecret = (panelSettings?.google_client_secret ?? "").trim() || envClientSecret;

  const googleEnabledFromSetting = parseToggle(panelSettings?.google_authentication ?? null);
  const googleEnabled = googleEnabledFromSetting ?? true;

  const emailEnabledFromSetting = parseToggle(panelSettings?.email_authentication ?? null);
  const emailEnabled = emailEnabledFromSetting ?? true;

  cachedAuthSettings = {
    googleClientId,
    googleClientSecret,
    googleEnabled,
    emailEnabled,
  };
  cachedAuthSettingsAt = now;
  return cachedAuthSettings;
}

function buildProviders(settings: AuthSettings) {
  const providers: NextAuthOptions["providers"] = [];

  if (settings.googleEnabled && settings.googleClientId && settings.googleClientSecret) {
    providers.push(
      GoogleProvider({
        clientId: settings.googleClientId,
        clientSecret: settings.googleClientSecret,
        allowDangerousEmailAccountLinking: true,
      })
    );
  }

  if (settings.emailEnabled) {
    providers.push(
      CredentialsProvider({
        name: "Credentials",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" },
        },
        async authorize(credentials, req) {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          const email = normalizeEmail(credentials.email);
          if (!isValidEmail(email)) {
            return null;
          }

          const password = String(credentials.password);
          if (!password || password.length > 1024) {
            return null;
          }

          const ip = getClientIpFromHeaders((req as { headers?: unknown } | undefined)?.headers);
          const rateKey = `${ip}:${email}`;
          if (isLoginRateLimited(rateKey)) {
            return null;
          }

          try {
            const data = await panelInternalPost<{ user: InternalAuthUser }>("auth/credentials", {
              body: {
                email,
                password,
              },
            });

            const user = data.user;
            if (!user?.id) return null;
            clearLoginRateLimit(rateKey);

            return {
              id: user.id,
              email: user.email,
              name: user.name,
              image: user.image,
              subscription: user.subscription ?? "free",
              subscriptionPlanId: user.subscriptionPlanId ?? null,
              hasPassword: true,
              authProvider: "credentials",
            };
          } catch {
            return null;
          }
        },
      })
    );
  }

  return providers;
}

function buildBaseAuthOptions(): Omit<NextAuthOptions, "providers"> {
  return {
    session: {
      strategy: "jwt",
    },
    callbacks: {
      async signIn({ user, account }: any) {
        if (account?.provider !== "google") {
          return true;
        }

        const email = normalizeEmail(typeof user?.email === "string" ? user.email : "");
        if (!isValidEmail(email)) return false;

        try {
          const data = await panelInternalPost<{ user: InternalAuthUser }>("auth/oauth/google", {
            body: {
              email,
              name: typeof user?.name === "string" ? user.name : null,
              image: typeof user?.image === "string" ? user.image : null,
              providerAccountId: String(account.providerAccountId ?? ""),
            },
          });
          const synced = data.user;
          if (!synced?.id) return false;

          user.id = synced.id;
          user.email = synced.email;
          user.name = synced.name;
          user.image = synced.image;
          user.subscription = synced.subscription ?? "free";
          user.subscriptionPlanId = synced.subscriptionPlanId ?? null;
          user.hasPassword = true;
          user.authProvider = "google";
          return true;
        } catch {
          return false;
        }
      },
      async jwt({ token, user, trigger, session }: any) {
        if (user) {
          const parsed = parseUserIdBigInt(String(user.id ?? ""));
          token.id = parsed ? parsed.toString() : null;
          if (typeof user.email === "string") {
            const normalized = normalizeEmail(user.email);
            token.email = isValidEmail(normalized) ? normalized : token.email;
          }
          token.name = user.name ?? token.name;
          token.picture = user.image ?? token.picture;
          token.subscription = user.subscription ?? token.subscription ?? "free";
          token.subscriptionPlanId = user.subscriptionPlanId ?? token.subscriptionPlanId ?? null;
          token.hasPassword = user.hasPassword ?? token.hasPassword ?? true;
          token.authProvider = user.authProvider ?? token.authProvider ?? "credentials";
        }

        if (trigger === "update" && session) {
          if (session?.name) token.name = session.name;
          if (session?.subscription) token.subscription = session.subscription;
          if (session?.subscriptionPlanId) token.subscriptionPlanId = session.subscriptionPlanId;
          if (session?.user?.subscription) token.subscription = session.user.subscription;
          if (session?.user?.subscriptionPlanId) token.subscriptionPlanId = session.user.subscriptionPlanId;
        }

        return token;
      },
      async session({ session, token }: any) {
        if (session.user) {
          session.user.id = token.id ?? null;
          if (token.email) session.user.email = token.email;
          if (token.name) session.user.name = token.name;
          if (token.picture) session.user.image = token.picture;
          session.user.subscription = token.subscription ?? "free";
          session.user.subscriptionPlanId = token.subscriptionPlanId ?? null;
          session.user.hasPassword = token.hasPassword ?? true;
          session.user.authProvider = token.authProvider ?? "credentials";
        }
        return session;
      },
    },
    pages: {
      signIn: "/login",
    },
    secret: process.env.NEXTAUTH_SECRET,
  };
}

export async function buildAuthOptions(): Promise<NextAuthOptions> {
  const settings = await getAuthSettings().catch(() => ({
    googleClientId: process.env.GOOGLE_CLIENT_ID || "",
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    googleEnabled: true,
    emailEnabled: true,
  }));

  return {
    ...buildBaseAuthOptions(),
    providers: buildProviders(settings),
  };
}

export async function getEmailAuthEnabled(): Promise<boolean> {
  const settings = await getAuthSettings().catch(() => ({
    googleClientId: process.env.GOOGLE_CLIENT_ID || "",
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    googleEnabled: true,
    emailEnabled: true,
  }));
  return settings.emailEnabled;
}

export const authOptions: NextAuthOptions = {
  ...buildBaseAuthOptions(),
  providers: buildProviders({
    googleClientId: process.env.GOOGLE_CLIENT_ID || "",
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    googleEnabled: true,
    emailEnabled: true,
  }),
};
