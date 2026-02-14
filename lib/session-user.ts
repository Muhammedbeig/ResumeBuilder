import type { Session } from "next-auth";
import { parseUserIdBigInt } from "@/lib/user-id";

export function getSessionUserId(session: Session | null | undefined): string | null {
  const raw = session?.user?.id;
  const parsed = parseUserIdBigInt(raw ?? "");
  return parsed ? parsed.toString() : null;
}
