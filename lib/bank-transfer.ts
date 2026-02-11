export const BANK_TRANSFER_DETAILS = {
  bankName: "Mock National Bank",
  accountName: "ResuPro LLC",
  accountNumber: "1234567890",
  iban: "PK00MOCK0000000000000000",
  swift: "MOCKPK01",
  branch: "Main Branch",
  country: "Pakistan",
  currency: "USD",
};

export const BANK_TRANSFER_ADMIN_EMAIL = "abcdef@gmail.com";

export type BankTransferSettings = {
  enabled: boolean;
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscSwiftCode: string;
};

export type BankTransferSettingsResponse = {
  bankTransfer?: BankTransferSettings | null;
  adminEmail?: string | null;
};
