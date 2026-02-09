import { NextResponse } from "next/server";

// NextResponse.json() uses JSON.stringify internally, which throws on BigInt values.
// Our shared user table uses BIGINT ids, so Prisma returns bigint in many places.
export function json(data: unknown, init?: ResponseInit) {
  const body = JSON.stringify(data, (_key, value) =>
    typeof value === "bigint" ? value.toString() : value
  );

  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json; charset=utf-8");
  }

  return new NextResponse(body, { ...init, headers });
}

