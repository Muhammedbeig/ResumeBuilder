module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/util [external] (util, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("util", () => require("util"));

module.exports = mod;
}),
"[externals]/url [external] (url, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("url", () => require("url"));

module.exports = mod;
}),
"[externals]/http [external] (http, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("http", () => require("http"));

module.exports = mod;
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[externals]/assert [external] (assert, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("assert", () => require("assert"));

module.exports = mod;
}),
"[externals]/querystring [external] (querystring, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("querystring", () => require("querystring"));

module.exports = mod;
}),
"[externals]/buffer [external] (buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("buffer", () => require("buffer"));

module.exports = mod;
}),
"[externals]/zlib [external] (zlib, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("zlib", () => require("zlib"));

module.exports = mod;
}),
"[externals]/https [external] (https, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("https", () => require("https"));

module.exports = mod;
}),
"[externals]/events [external] (events, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("events", () => require("events"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/lib/auth-validation.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PASSWORD_POLICY_TEXT",
    ()=>PASSWORD_POLICY_TEXT,
    "getPasswordPolicyError",
    ()=>getPasswordPolicyError,
    "isValidEmail",
    ()=>isValidEmail,
    "normalizeEmail",
    ()=>normalizeEmail,
    "normalizeName",
    ()=>normalizeName
]);
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_POLICY_TEXT = "8-72 characters, with uppercase, lowercase, number, and special character.";
function normalizeEmail(value) {
    return String(value ?? "").trim().toLowerCase().normalize("NFKC");
}
function normalizeName(value) {
    return String(value ?? "").trim().replace(/\s+/g, " ").normalize("NFKC");
}
function isValidEmail(value) {
    if (!value || value.length > 254) return false;
    return EMAIL_REGEX.test(value);
}
function getPasswordPolicyError(password) {
    if (!password) return "Password is required.";
    const length = password.length;
    if (length < 8) return "Password must be at least 8 characters long.";
    const bytes = new TextEncoder().encode(password).length;
    if (bytes > 72) return "Password is too long. Maximum supported length is 72 characters.";
    if (!/[a-z]/.test(password)) return "Password must include at least one lowercase letter.";
    if (!/[A-Z]/.test(password)) return "Password must include at least one uppercase letter.";
    if (!/\d/.test(password)) return "Password must include at least one number.";
    if (!/[^\p{L}\p{N}]/u.test(password)) {
        return "Password must include at least one special character.";
    }
    return null;
}
}),
"[project]/lib/panel-internal-api.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PanelInternalApiError",
    ()=>PanelInternalApiError,
    "panelInternalDelete",
    ()=>panelInternalDelete,
    "panelInternalGet",
    ()=>panelInternalGet,
    "panelInternalPatch",
    ()=>panelInternalPatch,
    "panelInternalPost",
    ()=>panelInternalPost,
    "panelInternalPut",
    ()=>panelInternalPut,
    "panelInternalRequest",
    ()=>panelInternalRequest
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$server$2d$only$2f$empty$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/server-only/empty.js [app-route] (ecmascript)");
;
class PanelInternalApiError extends Error {
    status;
    payload;
    constructor(message, status, payload){
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
function resolveInternalUrl(path) {
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
function parseStatusFromPayload(payload, fallback) {
    if (!payload || typeof payload !== "object") return fallback;
    const code = payload.code;
    const asNumber = typeof code === "string" ? Number.parseInt(code, 10) : code;
    if (typeof asNumber === "number" && Number.isFinite(asNumber) && asNumber >= 100 && asNumber <= 599) {
        return asNumber;
    }
    return fallback;
}
function isRetryableStatus(status) {
    return status >= 500 || status === 429;
}
function delay(ms) {
    return new Promise((resolve)=>setTimeout(resolve, ms));
}
async function panelInternalRequest(method, path, options) {
    const url = resolveInternalUrl(path);
    const timeoutMs = options?.timeoutMs ?? 30_000;
    const headers = new Headers(options?.headers);
    headers.set("Accept", "application/json");
    headers.set("X-ResuPro-Internal-Key", internalKey());
    if (options?.userId) {
        headers.set("X-ResuPro-User-Id", options.userId);
    }
    let body;
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
    for(let attempt = 1; attempt <= maxAttempts; attempt += 1){
        const controller = new AbortController();
        const timer = setTimeout(()=>controller.abort(), timeoutMs);
        try {
            const res = await fetch(url, {
                method,
                headers,
                body,
                cache: "no-store",
                signal: controller.signal
            });
            const payload = await res.json().catch(()=>null);
            const fallbackStatus = res.ok ? 500 : res.status;
            if (!payload || typeof payload !== "object") {
                throw new PanelInternalApiError(`Invalid JSON response from Panel internal API (${method} ${path})`, fallbackStatus, payload);
            }
            if ("error" in payload && payload.error) {
                const status = parseStatusFromPayload(payload, fallbackStatus);
                const message = typeof payload.message === "string" && payload.message.trim() ? payload.message : `Panel internal API error (${method} ${path})`;
                throw new PanelInternalApiError(message, status, payload);
            }
            return payload.data;
        } catch (error) {
            const normalizedError = error instanceof PanelInternalApiError ? error : error instanceof Error && error.name === "AbortError" ? new PanelInternalApiError(`Panel internal API timeout (${method} ${path})`, 504, null) : new PanelInternalApiError(`Panel internal API request failed (${method} ${path})`, 502, error instanceof Error ? error.message : error);
            const canRetry = attempt < maxAttempts && isRetryableStatus(normalizedError.status);
            if (!canRetry) {
                throw normalizedError;
            }
            await delay(200 * attempt);
        } finally{
            clearTimeout(timer);
        }
    }
    throw new PanelInternalApiError(`Panel internal API request failed (${method} ${path})`, 502, null);
}
function panelInternalGet(path, options) {
    return panelInternalRequest("GET", path, options);
}
function panelInternalPost(path, options) {
    return panelInternalRequest("POST", path, options);
}
function panelInternalPut(path, options) {
    return panelInternalRequest("PUT", path, options);
}
function panelInternalPatch(path, options) {
    return panelInternalRequest("PATCH", path, options);
}
function panelInternalDelete(path, options) {
    return panelInternalRequest("DELETE", path, options);
}
}),
"[project]/lib/user-id.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "parseUserIdBigInt",
    ()=>parseUserIdBigInt
]);
function parseUserIdBigInt(value) {
    // MySQL UNSIGNED BIGINT max (Panel `users.id` type).
    const MAX_UNSIGNED_BIGINT = BigInt("18446744073709551615");
    if (typeof value === "bigint") return value;
    if (typeof value === "number" && Number.isInteger(value)) {
        const asBigInt = BigInt(value);
        return asBigInt <= MAX_UNSIGNED_BIGINT ? asBigInt : null;
    }
    if (typeof value !== "string") return null;
    // NextAuth stores ids as strings in the session/JWT.
    // Old cookies might still have a non-numeric id (previous cuid-based schema),
    // so we must handle conversion safely.
    if (!/^\d+$/.test(value)) return null;
    try {
        const asBigInt = BigInt(value);
        return asBigInt <= MAX_UNSIGNED_BIGINT ? asBigInt : null;
    } catch  {
        return null;
    }
}
}),
"[project]/lib/auth.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "authOptions",
    ()=>authOptions,
    "buildAuthOptions",
    ()=>buildAuthOptions,
    "getEmailAuthEnabled",
    ()=>getEmailAuthEnabled
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$providers$2f$google$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next-auth/providers/google.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$providers$2f$credentials$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next-auth/providers/credentials.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2d$validation$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/auth-validation.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$panel$2d$internal$2d$api$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/panel-internal-api.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$user$2d$id$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/user-id.ts [app-route] (ecmascript)");
;
;
;
;
;
const AUTH_SETTINGS_TTL_MS = 60_000;
let cachedAuthSettings = null;
let cachedAuthSettingsAt = 0;
const loginAttemptStore = new Map();
const LOGIN_RATE_LIMIT_WINDOW_MS = 60_000;
const LOGIN_RATE_LIMIT_MAX = 10;
function readHeaderValue(headers, headerName) {
    if (!headers) return null;
    if (typeof Headers !== "undefined" && headers instanceof Headers) {
        return headers.get(headerName) ?? null;
    }
    if (typeof headers !== "object") return null;
    const map = headers;
    const direct = map[headerName] ?? map[headerName.toLowerCase()] ?? map[headerName.toUpperCase()];
    if (!direct) return null;
    if (Array.isArray(direct)) return direct[0] ?? null;
    return direct;
}
function getClientIpFromHeaders(headers) {
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
function isLoginRateLimited(key) {
    const now = Date.now();
    let entry = loginAttemptStore.get(key);
    if (!entry || now > entry.resetAt) {
        entry = {
            count: 0,
            resetAt: now + LOGIN_RATE_LIMIT_WINDOW_MS
        };
        loginAttemptStore.set(key, entry);
    }
    entry.count += 1;
    return entry.count > LOGIN_RATE_LIMIT_MAX;
}
function clearLoginRateLimit(key) {
    loginAttemptStore.delete(key);
}
function parseToggle(value) {
    if (!value) return null;
    const normalized = value.trim().toLowerCase();
    if (!normalized) return null;
    if ([
        "1",
        "true",
        "yes",
        "on",
        "enabled"
    ].includes(normalized)) return true;
    if ([
        "0",
        "false",
        "no",
        "off",
        "disabled"
    ].includes(normalized)) return false;
    return null;
}
async function getAuthSettingsFromPanel() {
    const data = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$panel$2d$internal$2d$api$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["panelInternalPost"])("settings/batch", {
        body: {
            keys: [
                "google_client_id",
                "google_client_secret",
                "google_authentication",
                "email_authentication"
            ]
        }
    });
    return data.settings ?? {};
}
async function getAuthSettings() {
    const now = Date.now();
    if (cachedAuthSettings && now - cachedAuthSettingsAt < AUTH_SETTINGS_TTL_MS) {
        return cachedAuthSettings;
    }
    let panelSettings = null;
    try {
        panelSettings = await getAuthSettingsFromPanel();
    } catch  {
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
        emailEnabled
    };
    cachedAuthSettingsAt = now;
    return cachedAuthSettings;
}
function buildProviders(settings) {
    const providers = [];
    if (settings.googleEnabled && settings.googleClientId && settings.googleClientSecret) {
        providers.push((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$providers$2f$google$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"])({
            clientId: settings.googleClientId,
            clientSecret: settings.googleClientSecret,
            allowDangerousEmailAccountLinking: true
        }));
    }
    if (settings.emailEnabled) {
        providers.push((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$providers$2f$credentials$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"])({
            name: "Credentials",
            credentials: {
                email: {
                    label: "Email",
                    type: "email"
                },
                password: {
                    label: "Password",
                    type: "password"
                }
            },
            async authorize (credentials, req) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }
                const email = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2d$validation$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["normalizeEmail"])(credentials.email);
                if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2d$validation$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isValidEmail"])(email)) {
                    return null;
                }
                const password = String(credentials.password);
                if (!password || password.length > 1024) {
                    return null;
                }
                const ip = getClientIpFromHeaders(req?.headers);
                const rateKey = `${ip}:${email}`;
                if (isLoginRateLimited(rateKey)) {
                    return null;
                }
                try {
                    const data = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$panel$2d$internal$2d$api$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["panelInternalPost"])("auth/credentials", {
                        body: {
                            email,
                            password
                        }
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
                        authProvider: "credentials"
                    };
                } catch  {
                    return null;
                }
            }
        }));
    }
    return providers;
}
function buildBaseAuthOptions() {
    return {
        session: {
            strategy: "jwt"
        },
        callbacks: {
            async signIn ({ user, account }) {
                if (account?.provider !== "google") {
                    return true;
                }
                const email = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2d$validation$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["normalizeEmail"])(typeof user?.email === "string" ? user.email : "");
                if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2d$validation$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isValidEmail"])(email)) return false;
                try {
                    const data = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$panel$2d$internal$2d$api$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["panelInternalPost"])("auth/oauth/google", {
                        body: {
                            email,
                            name: typeof user?.name === "string" ? user.name : null,
                            image: typeof user?.image === "string" ? user.image : null,
                            providerAccountId: String(account.providerAccountId ?? "")
                        }
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
                } catch  {
                    return false;
                }
            },
            async jwt ({ token, user, trigger, session }) {
                if (user) {
                    const parsed = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$user$2d$id$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["parseUserIdBigInt"])(String(user.id ?? ""));
                    token.id = parsed ? parsed.toString() : null;
                    if (typeof user.email === "string") {
                        const normalized = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2d$validation$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["normalizeEmail"])(user.email);
                        token.email = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2d$validation$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isValidEmail"])(normalized) ? normalized : token.email;
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
            async session ({ session, token }) {
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
            }
        },
        pages: {
            signIn: "/login"
        },
        secret: process.env.NEXTAUTH_SECRET
    };
}
async function buildAuthOptions() {
    const settings = await getAuthSettings().catch(()=>({
            googleClientId: process.env.GOOGLE_CLIENT_ID || "",
            googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
            googleEnabled: true,
            emailEnabled: true
        }));
    return {
        ...buildBaseAuthOptions(),
        providers: buildProviders(settings)
    };
}
async function getEmailAuthEnabled() {
    const settings = await getAuthSettings().catch(()=>({
            googleClientId: process.env.GOOGLE_CLIENT_ID || "",
            googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
            googleEnabled: true,
            emailEnabled: true
        }));
    return settings.emailEnabled;
}
const authOptions = {
    ...buildBaseAuthOptions(),
    providers: buildProviders({
        googleClientId: process.env.GOOGLE_CLIENT_ID || "",
        googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        googleEnabled: true,
        emailEnabled: true
    })
};
}),
"[project]/worker/app/api/auth/[...nextauth]/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next-auth/index.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/auth.ts [app-route] (ecmascript)");
;
;
async function GET(req, context) {
    const options = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["buildAuthOptions"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"])(req, context, options);
}
async function POST(req, context) {
    const options = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["buildAuthOptions"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"])(req, context, options);
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__d09ba729._.js.map