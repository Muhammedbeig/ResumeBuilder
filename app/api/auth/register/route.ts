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
  
  if (existingUser && existingUser.passwordHash) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);

  if (existingUser) {
    // Update existing OAuth user with a password
    await prisma.user.update({
      where: { id: existingUser.id },
      data: { passwordHash, name: name || existingUser.name }
    });
    return NextResponse.json({ id: existingUser.id });
  }

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
