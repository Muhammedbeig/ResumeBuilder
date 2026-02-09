import bcrypt from "bcryptjs";

export async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string) {
  // Laravel typically stores bcrypt hashes with `$2y$` prefix; bcryptjs expects `$2a$`/`$2b$`.
  // Normalize to avoid edge-case incompatibilities.
  const normalizedHash = hash?.startsWith("$2y$") ? `$2a$${hash.slice(4)}` : hash;
  return bcrypt.compare(password, normalizedHash);
}
