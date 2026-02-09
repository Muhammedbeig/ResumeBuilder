import { json } from "@/lib/json";
import { panelPost } from "@/lib/panel-api";

function isValidEmail(value: string) {
  // Basic sanity check; Panel will validate strictly too.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  const name = String(body?.name ?? "").trim();
  const email = String(body?.email ?? "").trim();
  const subject = String(body?.subject ?? "").trim();
  const message = String(body?.message ?? "").trim();

  if (!name) return json({ error: "Name is required" }, { status: 400 });
  if (!email || !isValidEmail(email)) return json({ error: "Valid email is required" }, { status: 400 });
  if (!subject) return json({ error: "Subject is required" }, { status: 400 });
  if (!message) return json({ error: "Message is required" }, { status: 400 });

  try {
    await panelPost("contact-us", { name, email, subject, message });
    return json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send message";
    return json({ error: message }, { status: 502 });
  }
}

