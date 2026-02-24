import NextAuth from "next-auth";
import type { NextRequest } from "next/server";
import { buildAuthOptions } from "@/lib/auth";

export async function GET(req: NextRequest, context: any) {
  const options = await buildAuthOptions();
  return NextAuth(req, context, options);
}

export async function POST(req: NextRequest, context: any) {
  const options = await buildAuthOptions();
  return NextAuth(req, context, options);
}
