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
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/lib/env.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "envBool",
    ()=>envBool,
    "envInt",
    ()=>envInt
]);
function envInt(name, fallback) {
    const raw = process.env[name];
    if (!raw) return fallback;
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : fallback;
}
function envBool(name, fallback) {
    const raw = process.env[name];
    if (raw === undefined) return fallback;
    const normalized = String(raw).trim().toLowerCase();
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
    return fallback;
}
}),
"[project]/lib/rate-limit.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "RATE_LIMITS",
    ()=>RATE_LIMITS,
    "rateLimit",
    ()=>rateLimit
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$env$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/env.ts [app-route] (ecmascript)");
;
;
const store = new Map();
const RATE_LIMITS = {
    windowMs: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$env$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["envInt"])("RATE_LIMIT_WINDOW_MS", 60_000),
    ai: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$env$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["envInt"])("RATE_LIMIT_AI", 20),
    aiHeavy: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$env$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["envInt"])("RATE_LIMIT_AI_HEAVY", 10),
    pdf: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$env$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["envInt"])("RATE_LIMIT_PDF", 20),
    pdfExport: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$env$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["envInt"])("RATE_LIMIT_PDF_EXPORT", 12)
};
function getClientIp(req) {
    const xForwardedFor = req.headers.get("x-forwarded-for");
    if (xForwardedFor) {
        const first = xForwardedFor.split(",")[0]?.trim();
        if (first) return first;
    }
    const xRealIp = req.headers.get("x-real-ip");
    if (xRealIp) return xRealIp.trim();
    const cfConnectingIp = req.headers.get("cf-connecting-ip");
    if (cfConnectingIp) return cfConnectingIp.trim();
    return "unknown";
}
function rateLimit(req, options) {
    const now = Date.now();
    const limit = options.limit;
    const windowMs = options.windowMs;
    const prefix = options.prefix ? `${options.prefix}:` : "";
    const baseKey = options.key ?? getClientIp(req);
    const key = `${prefix}${baseKey}`;
    let entry = store.get(key);
    if (!entry || now > entry.resetAt) {
        entry = {
            count: 0,
            resetAt: now + windowMs
        };
        store.set(key, entry);
    }
    entry.count += 1;
    const remaining = Math.max(0, limit - entry.count);
    if (entry.count > limit) {
        const retryAfterSec = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: options.message ?? "Too many requests. Please try again later."
        }, {
            status: 429,
            headers: {
                "Retry-After": String(retryAfterSec),
                "X-RateLimit-Limit": String(limit),
                "X-RateLimit-Remaining": String(remaining),
                "X-RateLimit-Reset": String(Math.ceil(entry.resetAt / 1000))
            }
        });
    }
    return null;
}
}),
"[project]/lib/limits.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AI_TEXT_LIMIT",
    ()=>AI_TEXT_LIMIT,
    "PDF_TEXT_LIMIT",
    ()=>PDF_TEXT_LIMIT,
    "truncateText",
    ()=>truncateText
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$env$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/env.ts [app-route] (ecmascript)");
;
const AI_TEXT_LIMIT = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$env$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["envInt"])("AI_TEXT_LIMIT", 20000);
const PDF_TEXT_LIMIT = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$env$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["envInt"])("PDF_TEXT_LIMIT", 20000);
function truncateText(text, limit = AI_TEXT_LIMIT) {
    if (!text) return "";
    if (text.length <= limit) return text;
    return text.slice(0, limit);
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
"[project]/lib/resource-settings.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getResourceSettings",
    ()=>getResourceSettings
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$server$2d$only$2f$empty$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/server-only/empty.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$env$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/env.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$panel$2d$internal$2d$api$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/panel-internal-api.ts [app-route] (ecmascript)");
;
;
;
const DEFAULT_CACHE_TTL_MS = 60_000;
const WORKER_CACHE_TTL_MS = 5_000;
const SETTINGS_KEYS = [
    "AI_TEXT_LIMIT",
    "ai_text_limit"
];
let cached = null;
let cachedAt = 0;
const DEFAULTS = {
    pdfRender: {
        concurrency: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$env$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["envInt"])("PDF_RENDER_CONCURRENCY", 2),
        timeoutMs: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$env$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["envInt"])("PDF_RENDER_TIMEOUT_MS", 45_000)
    },
    rateLimits: {
        windowMs: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$env$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["envInt"])("RATE_LIMIT_WINDOW_MS", 60_000),
        pdfExport: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$env$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["envInt"])("RATE_LIMIT_PDF_EXPORT", (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$env$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["envInt"])("RATE_LIMIT_PDF", 12)),
        pdf: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$env$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["envInt"])("RATE_LIMIT_PDF", 20),
        ai: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$env$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["envInt"])("RATE_LIMIT_AI", 20),
        aiHeavy: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$env$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["envInt"])("RATE_LIMIT_AI_HEAVY", 10)
    },
    limits: {
        aiText: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$env$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["envInt"])("AI_TEXT_LIMIT", 20_000),
        pdfText: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$env$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["envInt"])("PDF_TEXT_LIMIT", 20_000)
    }
};
function getResourceSettingsCacheTtlMs() {
    const configured = Number.parseInt(process.env.RESOURCE_SETTINGS_CACHE_MS ?? "", 10);
    if (Number.isFinite(configured) && configured >= 0) {
        return configured;
    }
    return process.env.RB_WORKER_MODE?.trim() === "1" ? WORKER_CACHE_TTL_MS : DEFAULT_CACHE_TTL_MS;
}
function parseIntValue(value, fallback, options) {
    const parsed = Number.parseInt(value ?? "", 10);
    if (!Number.isFinite(parsed)) return fallback;
    let next = parsed;
    if (options?.min !== undefined) next = Math.max(options.min, next);
    if (options?.max !== undefined) next = Math.min(options.max, next);
    return next;
}
function pickSetting(map, key) {
    if (key in map) return map[key];
    const lower = key.toLowerCase();
    if (lower in map) return map[lower];
    const upper = key.toUpperCase();
    if (upper in map) return map[upper];
    return undefined;
}
async function readSettings() {
    const data = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$panel$2d$internal$2d$api$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["panelInternalPost"])("settings/batch", {
        body: {
            keys: [
                ...SETTINGS_KEYS
            ]
        }
    });
    const map = {};
    for (const [key, value] of Object.entries(data.settings ?? {})){
        map[key] = value ? String(value) : "";
    }
    return map;
}
async function getResourceSettings() {
    const now = Date.now();
    if (cached && now - cachedAt < getResourceSettingsCacheTtlMs()) {
        return cached;
    }
    let settings = null;
    try {
        settings = await readSettings();
    } catch  {
        settings = null;
    }
    if (!settings) {
        cached = DEFAULTS;
        cachedAt = now;
        return DEFAULTS;
    }
    const aiTextLimit = parseIntValue(pickSetting(settings, "AI_TEXT_LIMIT"), DEFAULTS.limits.aiText, {
        min: 500
    });
    const pdfTextLimit = DEFAULTS.limits.pdfText;
    cached = {
        pdfRender: DEFAULTS.pdfRender,
        rateLimits: DEFAULTS.rateLimits,
        limits: {
            aiText: aiTextLimit,
            pdfText: pdfTextLimit
        }
    };
    cachedAt = now;
    return cached;
}
}),
"[project]/lib/pdf-text.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "extractPdfText",
    ()=>extractPdfText
]);
process.env.PDF2JSON_DISABLE_LOGS ??= "1";
const SUPPRESSED_WARNINGS = [
    "Setting up fake worker.",
    "Unsupported: field.type of Link",
    "NOT valid form element"
];
const shouldSuppressWarning = (value)=>{
    if (typeof value !== "string") return false;
    return SUPPRESSED_WARNINGS.some((snippet)=>value.includes(snippet));
};
const withSuppressedPdfWarnings = async (task)=>{
    const originalWarn = console.warn;
    console.warn = (...args)=>{
        const firstArg = args[0];
        if (shouldSuppressWarning(firstArg)) return;
        originalWarn(...args);
    };
    try {
        return await task();
    } finally{
        console.warn = originalWarn;
    }
};
const createPdfParser = async (rawTextMode)=>{
    const pdf2jsonModule = await __turbopack_context__.A("[project]/node_modules/pdf2json/dist/pdfparser.js [app-route] (ecmascript, async loader)");
    return new pdf2jsonModule.default(null, rawTextMode);
};
const extractPdfText = async (buffer, rawTextMode = true)=>{
    const parser = await createPdfParser(rawTextMode);
    return withSuppressedPdfWarnings(()=>new Promise((resolve, reject)=>{
            parser.on("pdfParser_dataError", (errData)=>reject(errData?.parserError ?? errData));
            parser.on("pdfParser_dataReady", ()=>{
                resolve(parser.getRawTextContent());
            });
            parser.parseBuffer(buffer);
        }));
};
}),
"[project]/worker/app/api/extract-pdf-text/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$rate$2d$limit$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/rate-limit.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$limits$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/limits.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$resource$2d$settings$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/resource-settings.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$pdf$2d$text$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/pdf-text.ts [app-route] (ecmascript)");
;
;
;
;
;
async function POST(request) {
    try {
        const resourceSettings = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$resource$2d$settings$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getResourceSettings"])();
        const rateLimitResponse = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$rate$2d$limit$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["rateLimit"])(request, {
            prefix: "extract-pdf-text",
            limit: resourceSettings.rateLimits.pdf,
            windowMs: resourceSettings.rateLimits.windowMs
        });
        if (rateLimitResponse) return rateLimitResponse;
        const formData = await request.formData();
        const file = formData.get("file");
        if (!file) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "No file provided"
            }, {
                status: 400
            });
        }
        const buffer = Buffer.from(await file.arrayBuffer());
        const text = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$pdf$2d$text$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["extractPdfText"])(buffer, true);
        const limitedText = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$limits$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["truncateText"])(text, resourceSettings.limits.pdfText);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            text: limitedText
        });
    } catch (error) {
        console.error("PDF extraction error:", error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Failed to extract text from PDF"
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__9dc7b438._.js.map