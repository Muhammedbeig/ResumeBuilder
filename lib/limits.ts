import { envInt } from "@/lib/env";

export const AI_TEXT_LIMIT = envInt("AI_TEXT_LIMIT", 20000);
export const PDF_TEXT_LIMIT = envInt("PDF_TEXT_LIMIT", 20000);

export function truncateText(text: string, limit: number = AI_TEXT_LIMIT): string {
  if (!text) return "";
  if (text.length <= limit) return text;
  return text.slice(0, limit);
}
