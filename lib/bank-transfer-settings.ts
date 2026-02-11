import "server-only";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { BANK_TRANSFER_DETAILS } from "@/lib/bank-transfer";
import type { BankTransferSettings } from "@/lib/bank-transfer";

const CACHE_TTL_MS = 60_000;

const SETTINGS_KEYS = [
  "account_holder_name",
  "bank_name",
  "account_number",
  "ifsc_swift_code",
  "bank_transfer_status",
  "bank_transfer_admin_email",
  "company_email",
] as const;

type BankTransferSettingsBundle = {
  bankTransfer: BankTransferSettings;
  adminEmail: string;
};

let cached: BankTransferSettingsBundle | null = null;
let cachedAt = 0;

function normalize(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

function parseEnabled(value: string): boolean | null {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  if (["1", "true", "yes", "on", "enabled"].includes(normalized)) return true;
  if (["0", "false", "no", "off", "disabled"].includes(normalized)) return false;
  return null;
}

async function readSettings(): Promise<Record<string, string>> {
  const rows = await prisma.$queryRaw<Array<{ name: string; value: string | null }>>(
    Prisma.sql`SELECT name, value FROM settings WHERE name IN (${Prisma.join(SETTINGS_KEYS)})`
  );

  const map: Record<string, string> = {};
  for (const row of rows) {
    map[row.name] = row.value ? String(row.value) : "";
  }
  return map;
}

async function getBankTransferSettingsBundle(): Promise<BankTransferSettingsBundle> {
  const now = Date.now();
  if (cached && now - cachedAt < CACHE_TTL_MS) {
    return cached;
  }

  const fallbackBank: BankTransferSettings = {
    enabled: true,
    accountHolderName: BANK_TRANSFER_DETAILS.accountName,
    bankName: BANK_TRANSFER_DETAILS.bankName,
    accountNumber: BANK_TRANSFER_DETAILS.accountNumber,
    ifscSwiftCode: BANK_TRANSFER_DETAILS.swift || BANK_TRANSFER_DETAILS.iban || "",
  };

  let settings: Record<string, string> | null = null;
  try {
    settings = await readSettings();
  } catch {
    settings = null;
  }

  if (!settings) {
    cached = {
      bankTransfer: fallbackBank,
      adminEmail: "",
    };
    cachedAt = now;
    return cached;
  }

  const enabledValue = parseEnabled(normalize(settings.bank_transfer_status));

  const resolvedBank: BankTransferSettings = {
    enabled: enabledValue ?? true,
    accountHolderName: normalize(settings.account_holder_name),
    bankName: normalize(settings.bank_name),
    accountNumber: normalize(settings.account_number),
    ifscSwiftCode: normalize(settings.ifsc_swift_code),
  };

  const adminEmail =
    normalize(settings.bank_transfer_admin_email) || normalize(settings.company_email);

  cached = {
    bankTransfer: resolvedBank,
    adminEmail,
  };
  cachedAt = now;
  return cached;
}

export async function getBankTransferSettings(): Promise<BankTransferSettings> {
  const bundle = await getBankTransferSettingsBundle();
  return bundle.bankTransfer;
}

export async function getBankTransferAdminEmail(): Promise<string> {
  const bundle = await getBankTransferSettingsBundle();
  return bundle.adminEmail;
}
