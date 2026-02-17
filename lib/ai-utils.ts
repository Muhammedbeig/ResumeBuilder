import "server-only";

export function extractJson<T = unknown>(text: string): T {
  const trimmed = text.trim();
  const fencedMatch =
    trimmed.match(/```json([\s\S]*?)```/i) || trimmed.match(/```([\s\S]*?)```/i);
  const jsonString = fencedMatch ? fencedMatch[1].trim() : trimmed;
  return JSON.parse(jsonString) as T;
}
/** new method to extract json from text */