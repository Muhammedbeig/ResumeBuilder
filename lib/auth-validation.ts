const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const PASSWORD_POLICY_TEXT =
  "8-72 characters, with uppercase, lowercase, number, and special character.";

export function normalizeEmail(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFKC");
}

export function normalizeName(value: unknown): string {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .normalize("NFKC");
}

export function isValidEmail(value: string): boolean {
  if (!value || value.length > 254) return false;
  return EMAIL_REGEX.test(value);
}

export function getPasswordPolicyError(password: string): string | null {
  if (!password) return "Password is required.";

  const length = password.length;
  if (length < 8) return "Password must be at least 8 characters long.";

  const bytes = new TextEncoder().encode(password).length;
  if (bytes > 72) return "Password is too long. Maximum supported length is 72 characters.";

  if (!/[a-z]/.test(password)) return "Password must include at least one lowercase letter.";
  if (!/[A-Z]/.test(password)) return "Password must include at least one uppercase letter.";
  if (!/\d/.test(password)) return "Password must include at least one number.";
  if (!/[^\p{L}\p{N}]/u.test(password)) {
    return "Password must include at least one special character.";
  }

  return null;
}
