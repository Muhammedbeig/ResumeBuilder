import type { NextConfig } from "next";

const isStaticExport = process.env.NEXT_STATIC_EXPORT === "1";

function normalizePanelRbBase(raw?: string | null): string | null {
  if (!raw) return null;
  const value = raw.trim();
  if (!value) return null;

  try {
    const parsed = new URL(value);
    const pathname = parsed.pathname.replace(/\/+$/, "");
    let nextPath = pathname;
    if (nextPath.endsWith("/api/rb")) {
      // already normalized
    } else if (nextPath.endsWith("/api")) {
      nextPath = `${nextPath}/rb`;
    } else {
      nextPath = `${nextPath}/api/rb`;
    }
    parsed.pathname = nextPath;
    parsed.search = "";
    parsed.hash = "";
    return parsed.toString().replace(/\/+$/, "");
  } catch {
    return null;
  }
}

const panelRbBase =
  normalizePanelRbBase(process.env.NEXT_PUBLIC_API_BASE_URL) ??
  normalizePanelRbBase(process.env.NEXT_PUBLIC_API_URL) ??
  normalizePanelRbBase(process.env.PANEL_API_BASE_URL);

const nextConfig: NextConfig = {
  ...(isStaticExport ? { output: "export" as const } : {}),
  productionBrowserSourceMaps: false,
  ...(isStaticExport || !panelRbBase
    ? {}
    : {
        async rewrites() {
          return [
            {
              source: "/api/:path*",
              destination: `${panelRbBase}/:path*`,
            },
          ];
        },
      }),
  experimental: {
    // Build-time pressure controls for constrained shared hosting.
    webpackMemoryOptimizations: true,
    cpus: 1,
    staticGenerationRetryCount: 1,
    staticGenerationMaxConcurrency: 1,
    staticGenerationMinPagesPerWorker: 1000,
  },
};

export default nextConfig;
