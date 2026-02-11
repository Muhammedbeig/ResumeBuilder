import { json } from "@/lib/json";
import { BANK_TRANSFER_ADMIN_EMAIL } from "@/lib/bank-transfer";
import { getBankTransferAdminEmail, getBankTransferSettings } from "@/lib/bank-transfer-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const bankTransfer = await getBankTransferSettings();
  const adminEmail = (await getBankTransferAdminEmail()) || BANK_TRANSFER_ADMIN_EMAIL;
  return json({
    bankTransfer,
    adminEmail,
  });
}
