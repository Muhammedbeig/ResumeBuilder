import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { json } from "@/lib/json";
import { getEmailAuthEnabled } from "@/lib/auth";

const MODEL_TYPE_USER = "App\\Models\\User";

async function assignUserRole(userId: bigint) {
  const roles = await prisma.$queryRaw<Array<{ id: bigint }>>`
    SELECT id FROM roles WHERE name = 'User' LIMIT 1
  `;
  const roleId = roles[0]?.id;
  if (!roleId) return;

  await prisma.$executeRaw`
    INSERT IGNORE INTO model_has_roles (role_id, model_type, model_id)
    VALUES (${roleId}, ${MODEL_TYPE_USER}, ${userId})
  `;
}

export async function POST(request: Request) {
  const emailAuthEnabled = await getEmailAuthEnabled();
  if (!emailAuthEnabled) {
    return json(
      { error: "Email sign-up is currently disabled." },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const name = String(body?.name || "");
  const email = String(body?.email || "").toLowerCase();
  const password = String(body?.password || "");

  if (!email || !password) {
    return json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    return json({ error: "Email already in use" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      name: name || email.split("@")[0] || "user",
      email,
      passwordHash,
      type: "email",
      fcmId: "",
      notification: true,
    },
  });

  await assignUserRole(user.id);

  return json({ id: user.id.toString() });
}
