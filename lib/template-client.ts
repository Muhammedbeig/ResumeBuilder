import type { PanelTemplate, PanelTemplateCategory, TemplateType } from "@/lib/panel-templates";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Request failed (${res.status})`);
  }
  const data = (await res.json()) as T;
  return data;
}

export async function fetchTemplateCategories(type: TemplateType): Promise<PanelTemplateCategory[]> {
  try {
    const res = await fetchJson<{ data?: PanelTemplateCategory[] }>(
      `/api/templates/categories?type=${encodeURIComponent(type)}`
    );
    return Array.isArray(res.data) ? res.data : [];
  } catch {
    return [];
  }
}

export async function fetchTemplates(
  type: TemplateType,
  params?: { category?: string; premium?: boolean; active?: boolean }
): Promise<PanelTemplate[]> {
  const search = new URLSearchParams();
  search.set("type", type);
  if (params?.category) search.set("category", params.category);
  if (params?.premium !== undefined) search.set("premium", params.premium ? "1" : "0");
  if (params?.active !== undefined) search.set("active", params.active ? "1" : "0");

  try {
    const res = await fetchJson<{ data?: PanelTemplate[] }>(`/api/templates/list?${search.toString()}`);
    return Array.isArray(res.data) ? res.data : [];
  } catch {
    return [];
  }
}

export async function fetchTemplateById(
  type: TemplateType,
  templateId: string
): Promise<PanelTemplate | null> {
  try {
    const res = await fetchJson<{ data?: PanelTemplate }>(
      `/api/templates/${encodeURIComponent(templateId)}?type=${encodeURIComponent(type)}`
    );
    return res.data ?? null;
  } catch {
    return null;
  }
}