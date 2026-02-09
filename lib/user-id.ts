export function parseUserIdBigInt(value: unknown): bigint | null {
  // MySQL UNSIGNED BIGINT max (Panel `users.id` type).
  const MAX_UNSIGNED_BIGINT = BigInt("18446744073709551615");

  if (typeof value === "bigint") return value;
  if (typeof value === "number" && Number.isInteger(value)) {
    const asBigInt = BigInt(value);
    return asBigInt <= MAX_UNSIGNED_BIGINT ? asBigInt : null;
  }
  if (typeof value !== "string") return null;

  // NextAuth stores ids as strings in the session/JWT.
  // Old cookies might still have a non-numeric id (previous cuid-based schema),
  // so we must handle conversion safely.
  if (!/^\d+$/.test(value)) return null;

  try {
    const asBigInt = BigInt(value);
    return asBigInt <= MAX_UNSIGNED_BIGINT ? asBigInt : null;
  } catch {
    return null;
  }
}
