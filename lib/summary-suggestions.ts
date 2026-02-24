const BULLET_PREFIX = /^(?:\d+[\).:-]|[-*\u2022])\s+/;

function stripCodeFenceMarkers(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function extractFirstJsonObject(text: string): string | null {
  const start = text.indexOf("{");
  if (start < 0) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < text.length; index += 1) {
    const char = text[index];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === "\\") {
        escaped = true;
        continue;
      }
      if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === "{") {
      depth += 1;
      continue;
    }

    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return text.slice(start, index + 1);
      }
    }
  }

  return null;
}

function tryExtractJsonSummaries(text: string): string[] | null {
  const cleaned = stripCodeFenceMarkers(text);
  if (!cleaned) return null;

  const tryParse = (candidate: string): string[] | null => {
    try {
      const parsed = JSON.parse(candidate) as unknown;

      if (Array.isArray(parsed)) {
        const values = parsed
          .map((item) => String(item ?? "").trim())
          .filter(Boolean);
        return values.length > 0 ? values : null;
      }

      if (parsed && typeof parsed === "object") {
        const maybeSummaries = (parsed as { summaries?: unknown }).summaries;
        if (Array.isArray(maybeSummaries)) {
          const values = maybeSummaries
            .map((item) => String(item ?? "").trim())
            .filter(Boolean);
          return values.length > 0 ? values : null;
        }

        const maybeSummary = (parsed as { summary?: unknown }).summary;
        if (typeof maybeSummary === "string" && maybeSummary.trim()) {
          return [maybeSummary.trim()];
        }
      }
    } catch {
      return null;
    }

    return null;
  };

  const direct = tryParse(cleaned);
  if (direct) return direct;

  const embeddedObject = extractFirstJsonObject(cleaned);
  if (!embeddedObject) return null;
  return tryParse(embeddedObject);
}

function normalizeSuggestionLine(line: string): string {
  let value = stripCodeFenceMarkers(line);

  // Common wrappers from model outputs: `"text",`
  if (/^".*"\s*,?$/.test(value)) {
    try {
      const decoded = JSON.parse(value.replace(/,\s*$/, ""));
      if (typeof decoded === "string") {
        value = decoded;
      }
    } catch {
      value = value.replace(/^"\s*|\s*",?\s*$/g, "");
    }
  }

  value = value.replace(/,\s*$/, "").trim();
  return value;
}

function isJsonScaffoldLine(line: string): boolean {
  const value = line.trim().toLowerCase();
  if (!value) return true;
  if (value === "json" || value === "```" || value === "```json") return true;
  if (/^[\[\]{}:,]+$/.test(value)) return true;
  if (/^"?(summaries|summary)"?\s*:\s*\[?\s*$/.test(value)) return true;
  return false;
}

export function parseSummarySuggestions(text: string): string[] {
  const cleaned = text.replace(/\r\n/g, "\n").trim();
  if (!cleaned) return [];

  const parsedFromJson = tryExtractJsonSummaries(cleaned);
  if (parsedFromJson && parsedFromJson.length > 0) {
    return parsedFromJson;
  }

  const lines = cleaned
    .split("\n")
    .map((line) => normalizeSuggestionLine(line))
    .filter((line) => !isJsonScaffoldLine(line))
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
    const trimmed = normalizeSuggestionLine(item);
    if (isJsonScaffoldLine(trimmed)) continue;
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
      return normalizeSummarySuggestions(
        maybeSummaries.map((item) => String(item)),
      );
    }

    const maybeSummary = (input as { summary?: unknown }).summary;
    if (typeof maybeSummary === "string") {
      return normalizeSummarySuggestions(parseSummarySuggestions(maybeSummary));
    }
  }

  return [];
}
