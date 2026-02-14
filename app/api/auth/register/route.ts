import { json } from "@/lib/json";
import { getEmailAuthEnabled } from "@/lib/auth";
import {
  getPasswordPolicyError,
  isValidEmail,
  normalizeEmail,
  normalizeName,
} from "@/lib/auth-validation";
import { RATE_LIMITS, rateLimit } from "@/lib/rate-limit";
import { panelInternalPost, PanelInternalApiError } from "@/lib/panel-internal-api";

export async function POST(request: Request) {
  const limited = rateLimit(request, {
    prefix: "auth:register",
    limit: 6,
    windowMs: RATE_LIMITS.windowMs,
    message: "Too many sign-up attempts. Please try again in a minute.",
  });
  if (limited) {
    return limited;
  }

  const emailAuthEnabled = await getEmailAuthEnabled();
  if (!emailAuthEnabled) {
    return json({ error: "Email sign-up is currently disabled." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const name = normalizeName(body?.name);
  const email = normalizeEmail(body?.email);
  const password = String(body?.password || "");

  if (!name || name.length < 2 || name.length > 80) {
    return json({ error: "Please enter your full name (2-80 characters)." }, { status: 400 });
  }

  if (!email || !isValidEmail(email)) {
    return json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const passwordError = getPasswordPolicyError(password);
  if (passwordError) {
    return json({ error: passwordError }, { status: 400 });
  }

  try {
    const data = await panelInternalPost<{ id: string }>("auth/register", {
      body: { name, email, password },
    });
    return json({ id: data.id });
  } catch (error) {
    if (error instanceof PanelInternalApiError) {
      const payload = error.payload as { message?: string } | null;
      const message = payload?.message || "Registration failed";
      return json({ error: message }, { status: error.status || 500 });
    }
    return json({ error: "Registration failed" }, { status: 500 });
  }
}
