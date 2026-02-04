const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const applyInlineFormatting = (value: string) => {
  let next = value;
  next = next.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  next = next.replace(/__(.+?)__/g, "<u>$1</u>");
  next = next.replace(/\*(.+?)\*/g, "<em>$1</em>");
  next = next.replace(/_(.+?)_/g, "<em>$1</em>");
  return next;
};

export function toInlineHtml(value: string): string {
  if (!value) return "";
  const escaped = escapeHtml(value);
  return applyInlineFormatting(escaped);
}

export function toBlockHtml(value: string): string {
  if (!value) return "";
  const lines = value.split(/\r?\n/);
  let html = "";
  let inList = false;

  const closeList = () => {
    if (inList) {
      html += "</ul>";
      inList = false;
    }
  };

  for (const line of lines) {
    const bulletMatch = /^\s*[-*]\s+(.*)$/.exec(line);
    if (bulletMatch) {
      if (!inList) {
        html += "<ul>";
        inList = true;
      }
      const content = applyInlineFormatting(escapeHtml(bulletMatch[1] || ""));
      html += `<li>${content}</li>`;
      continue;
    }

    closeList();

    if (!line.trim()) {
      html += "<br />";
      continue;
    }

    const content = applyInlineFormatting(escapeHtml(line));
    html += `<p>${content}</p>`;
  }

  closeList();

  return html;
}
