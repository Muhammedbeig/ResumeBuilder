export function decodePathSegment(value: string | null | undefined): string {
  if (!value) return "";
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function getSlugFromPathname(
  pathname: string | null,
  routePrefix: string,
): string | null {
  if (!pathname) return null;

  const pathParts = pathname.split("/").filter(Boolean);
  const prefixParts = routePrefix.split("/").filter(Boolean);

  if (pathParts.length <= prefixParts.length) return null;
  for (let i = 0; i < prefixParts.length; i += 1) {
    if (pathParts[i] !== prefixParts[i]) return null;
  }

  return decodePathSegment(pathParts[prefixParts.length]);
}
