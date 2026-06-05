type SensitiveMatch = {
  field: string;
  reason: string;
};

const SECRET_PATTERNS: Array<{ reason: string; pattern: RegExp }> = [
  {
    reason: "Stripe secret key",
    pattern: /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9_]{8,}\b/,
  },
  {
    reason: "Stripe webhook secret",
    pattern: /\bwhsec_[A-Za-z0-9_]{8,}\b/,
  },
  {
    reason: "private key",
    pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  },
];

const BANK_KEYWORD_PATTERN =
  /\b(routing|aba|account number|account no|acct no|계좌번호|라우팅)\b/i;

export function looksLikeSensitiveBankInfo(value: string): boolean {
  if (!value.trim()) return false;
  if (BANK_KEYWORD_PATTERN.test(value)) return true;

  // Bank names/status notes are ok. Long digit strings are likely account or routing numbers.
  const digitsOnly = value.replace(/\D/g, "");
  return digitsOnly.length >= 8;
}

export function findSensitivePaymentSetupInput(fields: Record<string, string>): SensitiveMatch | null {
  for (const [field, value] of Object.entries(fields)) {
    if (!value.trim()) continue;

    if (field === "bankInfo" && looksLikeSensitiveBankInfo(value)) {
      return { field, reason: "bank account or routing number" };
    }

    for (const item of SECRET_PATTERNS) {
      if (item.pattern.test(value)) {
        return { field, reason: item.reason };
      }
    }
  }

  return null;
}
