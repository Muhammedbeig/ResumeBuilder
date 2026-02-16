const HTML_TAG_PATTERN = /<[^>]+>/;

function escapeHtml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function normalizeRichContent(raw: string | null | undefined) {
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!value) return "";
  if (HTML_TAG_PATTERN.test(value)) return value;

  const paragraphs = value
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, "<br />")}</p>`);

  return paragraphs.join("");
}
