import { describe, expect, test } from "bun:test";
import {
  getAdminNotificationEmails,
  getPaymentSetupRecipientEmails,
} from "@/lib/admin-notifications";

const REQUIRED = [
  "admin@getitdonework.com",
  "luke@xrx.studio",
  "sson@xrx.studio",
];

function withEnv<T>(patch: Record<string, string | undefined>, fn: () => T): T {
  const old = Object.fromEntries(Object.keys(patch).map((key) => [key, process.env[key]]));
  try {
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
    return fn();
  } finally {
    for (const [key, value] of Object.entries(old)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

describe("admin notification recipients", () => {
  test("fallback includes all launch admin recipients", () => {
    const emails = withEnv(
      { ADMIN_EMAILS: undefined, ADMIN_EMAIL: undefined },
      () => getAdminNotificationEmails(),
    );
    expect(emails).toEqual(REQUIRED);
  });

  test("payment setup falls back to admin notifications", () => {
    const emails = withEnv(
      {
        ADMIN_EMAILS: REQUIRED.join(","),
        PAYMENT_SETUP_RECIPIENTS: undefined,
        PAYMENT_SETUP_RECIPIENT: undefined,
      },
      () => getPaymentSetupRecipientEmails(),
    );
    expect(emails).toEqual(REQUIRED);
  });

  test("invalid addresses are ignored", () => {
    const emails = withEnv(
      { ADMIN_EMAILS: `bad, ${REQUIRED[0]}, ${REQUIRED[1]}` },
      () => getAdminNotificationEmails(),
    );
    expect(emails).toEqual([REQUIRED[0], REQUIRED[1]]);
  });
});
