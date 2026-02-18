import { json } from "@/lib/json";
import {
  getFirebaseWebConfig,
  isFirebaseWebConfigComplete,
} from "@/lib/firebase-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const config = await getFirebaseWebConfig();
  return json({
    configured: isFirebaseWebConfigComplete(config),
    ...config,
  });
}
