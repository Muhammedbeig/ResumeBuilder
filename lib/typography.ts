const BASE_FONT_SIZE_PX = 16;
const PRESET_SIZES: Record<string, number> = {
  sm: 14,
  md: 16,
  lg: 18,
};

export function resolveFontSizePx(fontSize?: string): number | null {
  if (!fontSize) return null;
  if (fontSize in PRESET_SIZES) return PRESET_SIZES[fontSize];
  const parsed = Number(String(fontSize).replace(/[^\d.]/g, ""));
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

export function getFontScale(fontSize?: string): number {
  const px = resolveFontSizePx(fontSize);
  if (!px) return 1;
  return px / BASE_FONT_SIZE_PX;
}

export function normalizeFontSizeValue(fontSize?: string): string {
  const px = resolveFontSizePx(fontSize);
  return px ? String(px) : "";
}
