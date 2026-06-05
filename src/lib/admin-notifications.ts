const FALLBACK_ADMIN_EMAILS = [
  "admin@getitdonework.com",
  "luke@xrx.studio",
  "sson@xrx.studio",
];

function parseEmailList(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
}

export function getAdminNotificationEmails(): string[] {
  const explicit = parseEmailList(process.env.ADMIN_EMAILS);
  if (explicit.length > 0) return explicit;

  const legacy = parseEmailList(process.env.ADMIN_EMAIL);
  if (legacy.length > 0) return legacy;

  return FALLBACK_ADMIN_EMAILS;
}

export function getPaymentSetupRecipientEmails(): string[] {
  const explicit = parseEmailList(process.env.PAYMENT_SETUP_RECIPIENTS);
  if (explicit.length > 0) return explicit;

  const legacy = parseEmailList(process.env.PAYMENT_SETUP_RECIPIENT);
  if (legacy.length > 0) return legacy;

  return getAdminNotificationEmails();
}
