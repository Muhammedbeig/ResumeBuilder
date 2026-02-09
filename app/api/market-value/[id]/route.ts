import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { json } from "@/lib/json";
import { parseUserIdBigInt } from "@/lib/user-id";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  const userId = parseUserIdBigInt(session?.user?.id);
  if (!userId) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const report = await prisma.marketValueReport.findFirst({
    where: { id, userId },
  });

  if (!report) {
    return json({ error: "Report not found" }, { status: 404 });
  }

  return json({ report });
}
