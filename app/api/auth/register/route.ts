import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const name = String(body?.name || "");
  const email = String(body?.email || "").toLowerCase();
  const password = String(body?.password || "");

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      name: name || null,
      email,
      passwordHash,
      subscription: "free",
    },
  });

  return NextResponse.json({ id: user.id });
}
