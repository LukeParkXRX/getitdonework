import { describe, expect, test } from "bun:test";
import {
  findSensitivePaymentSetupInput,
  looksLikeSensitiveBankInfo,
} from "@/lib/security/sensitive-input";

describe("looksLikeSensitiveBankInfo", () => {
  test("allows normal bank status notes", () => {
    expect(looksLikeSensitiveBankInfo("Chase account is being prepared")).toBe(false);
    expect(looksLikeSensitiveBankInfo("Need to open a US bank account")).toBe(false);
  });

  test("blocks account and routing number style input", () => {
    expect(looksLikeSensitiveBankInfo("routing number 123456789")).toBe(true);
    expect(looksLikeSensitiveBankInfo("account number 123456789012")).toBe(true);
    expect(looksLikeSensitiveBankInfo("1234-5678-9012")).toBe(true);
  });
});

describe("findSensitivePaymentSetupInput", () => {
  test("blocks Stripe secrets in additional notes", () => {
    expect(
      findSensitivePaymentSetupInput({
        bankInfo: "Chase pending",
        additionalNotes: "sk_live_1234567890abcdef",
      }),
    ).toEqual({ field: "additionalNotes", reason: "Stripe secret key" });
  });

  test("blocks webhook secrets", () => {
    expect(
      findSensitivePaymentSetupInput({
        bankInfo: "",
        additionalNotes: "whsec_1234567890abcdef",
      }),
    ).toEqual({ field: "additionalNotes", reason: "Stripe webhook secret" });
  });
});
