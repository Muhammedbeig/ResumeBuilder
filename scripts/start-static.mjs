import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import process from "node:process";

function normalizeOrigin(raw) {
  const value = String(raw ?? "").trim();
  if (!value) return "";
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return "";
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return "";
  }
}

function canonicalWebsiteOrigin(env) {
  const candidates = [
    env.WEBSITE_URL,
    env.NEXT_PUBLIC_APP_URL,
    env.NEXT_PUBLIC_WEBSITE_URL,
    env.NEXTAUTH_URL,
  ];
  for (const candidate of candidates) {
    const normalized = normalizeOrigin(candidate);
    if (normalized) return normalized;
  }
  return "";
}

function applyWebsiteUrlDefaults(env) {
  const canonical = canonicalWebsiteOrigin(env);
  if (!canonical) return env;

  env.WEBSITE_URL = canonical;
  env.NEXT_PUBLIC_APP_URL = canonical;
  env.NEXT_PUBLIC_WEBSITE_URL = canonical;
  env.NEXTAUTH_URL = canonical;

  if (!normalizeOrigin(env.RESUME_BUILDER_EXPORT_URL)) {
    env.RESUME_BUILDER_EXPORT_URL = canonical;
  }

  return env;
}

applyWebsiteUrlDefaults(process.env);

const publicPort = Number.parseInt(process.env.PORT || "3000", 10);
const publicHost = process.env.HOST || "0.0.0.0";

const staticHost = process.env.STATIC_INTERNAL_HOST || "127.0.0.1";
const staticPort = Number.parseInt(process.env.STATIC_INTERNAL_PORT || "4173", 10);

const workerHost = process.env.RB_EXPORT_WORKER_HOST || "127.0.0.1";
const workerPort = Number.parseInt(process.env.RB_EXPORT_WORKER_PORT || "3101", 10);
const workerAutoStart = !["0", "false", "no", "off"].includes(
  String(process.env.RB_EXPORT_WORKER_AUTOSTART || "true").trim().toLowerCase(),
);

const serveBin = path.join(process.cwd(), "node_modules", "serve", "build", "main.js");
const outServeConfig = path.join(process.cwd(), "out", "serve.json");
const rootServeConfig = path.join(process.cwd(), "serve.json");
const serveConfig = existsSync(outServeConfig) ? outServeConfig : rootServeConfig;

let shuttingDown = false;
const children = [];

function spawnStaticServer() {
  const child = spawn(
    process.execPath,
    [
      serveBin,
      "out",
      "-l",
      `tcp://${staticHost}:${staticPort}`,
      "--config",
      serveConfig,
      "--no-port-switching",
    ],
    {
      stdio: "inherit",
      shell: false,
    },
  );

  child.on("exit", (code, signal) => {
    if (shuttingDown) return;
    process.stderr.write(
      `Static child exited unexpectedly (code=${code ?? "null"}, signal=${signal ?? "null"}).\n`,
    );
    shutdown(1);
  });

  children.push(child);
}

function spawnExportWorker() {
  if (!workerAutoStart) return;

  const tsxCli = path.join(process.cwd(), "node_modules", "tsx", "dist", "cli.mjs");
  const child = spawn(process.execPath, [tsxCli, "scripts/export-worker.ts"], {
    stdio: "inherit",
    shell: false,
    env: {
      ...process.env,
      RB_EXPORT_WORKER_HOST: workerHost,
      RB_EXPORT_WORKER_PORT: String(workerPort),
    },
  });

  child.on("exit", (code, signal) => {
    if (shuttingDown) return;
    process.stderr.write(
      `Export worker exited unexpectedly (code=${code ?? "null"}, signal=${signal ?? "null"}).\n`,
    );
    shutdown(1);
  });

  children.push(child);
}

function toHeaders(nodeHeaders) {
  const headers = new Headers();
  for (const [key, value] of Object.entries(nodeHeaders)) {
    if (typeof value === "undefined") continue;
    if (Array.isArray(value)) {
      headers.set(key, value.join(", "));
    } else {
      headers.set(key, String(value));
    }
  }
  return headers;
}

async function proxyRequest(req, res, targetBase) {
  try {
    const targetUrl = new URL(req.url || "/", targetBase);
    const method = (req.method || "GET").toUpperCase();
    const headers = toHeaders(req.headers);
    headers.set("host", targetUrl.host);

    const requestInit = {
      method,
      headers,
    };

    if (method !== "GET" && method !== "HEAD") {
      requestInit.body = req;
      requestInit.duplex = "half";
    }

    const upstream = await fetch(targetUrl, requestInit);
    res.statusCode = upstream.status;
    upstream.headers.forEach((value, key) => {
      if (key.toLowerCase() === "transfer-encoding") return;
      res.setHeader(key, value);
    });

    const body = Buffer.from(await upstream.arrayBuffer());
    res.end(body);
  } catch {
    res.statusCode = 502;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ error: "Upstream proxy failed" }));
  }
}

function routeTarget(urlPath) {
  if (urlPath === "/extract-pdf-text") {
    return `http://${workerHost}:${workerPort}`;
  }
  if (urlPath === "/generate-pdf") {
    return `http://${workerHost}:${workerPort}`;
  }
  if (urlPath === "/health") {
    return `http://${workerHost}:${workerPort}`;
  }
  return `http://${staticHost}:${staticPort}`;
}

const proxyServer = createServer((req, res) => {
  const parsed = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const targetBase = routeTarget(parsed.pathname);
  void proxyRequest(req, res, targetBase);
});

function shutdown(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;

  proxyServer.close(() => {
    for (const child of children) {
      if (!child.killed) {
        child.kill("SIGTERM");
      }
    }
    process.exit(exitCode);
  });
}

spawnStaticServer();
spawnExportWorker();

proxyServer.listen(publicPort, publicHost, () => {
  process.stdout.write(
    `Static gateway listening on http://${publicHost}:${publicPort} (static: ${staticHost}:${staticPort}, worker: ${workerHost}:${workerPort})\n`,
  );
});

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
