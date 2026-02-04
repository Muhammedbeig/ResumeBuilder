const BULLET_PREFIX = /^(?:\d+[\).:-]|[-*\u2022])\s+/;

export function parseSummarySuggestions(text: string): string[] {
  const cleaned = text.replace(/\r\n/g, "\n").trim();
  if (!cleaned) return [];

  const lines = cleaned
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const bulletLines = lines.filter((line) => BULLET_PREFIX.test(line));
  if (lines.length > 1 && bulletLines.length >= 2) {
    return lines
      .map((line) => line.replace(BULLET_PREFIX, "").trim())
      .filter(Boolean);
  }

  const inlineNumbered = cleaned
    .split(/(?:^|\s)\d+[\).:-]\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (inlineNumbered.length > 1) {
    return inlineNumbered;
  }

  const inlineBullets = cleaned
    .split(/(?:^|\s)[-*\u2022]\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (inlineBullets.length > 1) {
    return inlineBullets;
  }

  return [cleaned];
}

export function normalizeSummarySuggestions(items: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of items) {
    const trimmed = item.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }
  return result;
}

export function extractSummarySuggestions(input: unknown): string[] {
  if (Array.isArray(input)) {
    return normalizeSummarySuggestions(input.map((item) => String(item)));
  }

  if (typeof input === "string") {
    return normalizeSummarySuggestions(parseSummarySuggestions(input));
  }

  if (input && typeof input === "object") {
    const maybeSummaries = (input as { summaries?: unknown }).summaries;
    if (Array.isArray(maybeSummaries)) {
      return normalizeSummarySuggestions(maybeSummaries.map((item) => String(item)));
    }

    const maybeSummary = (input as { summary?: unknown }).summary;
    if (typeof maybeSummary === "string") {
      return normalizeSummarySuggestions(parseSummarySuggestions(maybeSummary));
    }
  }

  return [];
}
