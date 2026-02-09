const DEFAULT_PANEL_BASE_URL = "http://localhost/Panel/public";

function panelBaseUrl() {
  // Prefer explicit base.
  const explicit = process.env.NEXT_PUBLIC_API_URL;
  if (explicit) return explicit.replace(/\/+$/, "");

  // If only the API base is configured, strip the `/api` suffix.
  const apiBase = process.env.PANEL_API_BASE_URL;
  if (apiBase) return apiBase.replace(/\/+$/, "").replace(/\/api$/, "");

  return DEFAULT_PANEL_BASE_URL.replace(/\/+$/, "");
}

export function resolvePanelAssetUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const raw = value.trim();

  // Panel stores `false` as `0` in some failure cases; treat as "no image".
  if (!raw || raw === "0") return null;

  if (/^https?:\/\//i.test(raw)) return raw;

  const base = panelBaseUrl();

  if (raw.startsWith("/")) {
    return `${base}${raw}`;
  }

  // Panel typically stores `blog/filename.ext` on the `public` disk.
  // The public URL becomes `/storage/blog/filename.ext`.
  if (raw.startsWith("storage/")) {
    return `${base}/${raw}`;
  }

  return `${base}/storage/${raw}`;
}

