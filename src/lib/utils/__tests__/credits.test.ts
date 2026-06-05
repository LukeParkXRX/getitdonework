import { describe, expect, test } from "bun:test";
import {
  creditsToUsd,
  usdToCredits,
  calculateBalance,
  canBook,
  sessionCost,
  CREDIT_USD_PRICE,
  type CreditTransaction,
} from "@/lib/utils/credits";

describe("credits <-> usd", () => {
  test("1 credit = $100", () => {
    expect(CREDIT_USD_PRICE).toBe(100);
    expect(creditsToUsd(1)).toBe(100);
    expect(usdToCredits(100)).toBe(1);
  });

  test("roundtrip", () => {
    expect(usdToCredits(creditsToUsd(5))).toBe(5);
  });

  test("rejects negative", () => {
    expect(() => creditsToUsd(-1)).toThrow();
    expect(() => usdToCredits(-1)).toThrow();
  });

  test("rejects non-multiple usd", () => {
    expect(() => usdToCredits(150)).toThrow();
  });
});

describe("calculateBalance", () => {
  const mkTx = (
    type: CreditTransaction["type"],
    amount: number,
    expiresAt?: string,
  ): CreditTransaction => ({
    id: `t${Math.random()}`,
    type,
    amount,
    createdAt: "2026-01-01T00:00:00Z",
    expiresAt,
  });

  test("sums all amounts", () => {
    const txs = [mkTx("purchase", 10), mkTx("use", -2), mkTx("refund", 1)];
    expect(calculateBalance(txs)).toBe(9);
  });

  test("excludes expired", () => {
    const now = new Date("2026-06-01");
    const txs = [
      mkTx("purchase", 10, "2026-03-01"),
      mkTx("purchase", 5, "2026-12-01"),
    ];
    expect(calculateBalance(txs, now)).toBe(5);
  });

  test("returns 0 for empty", () => {
    expect(calculateBalance([])).toBe(0);
  });
});

describe("canBook", () => {
  test("true when cost is 0 (chemistry)", () => {
    expect(canBook([], 0)).toBe(true);
  });

  test("true when balance sufficient", () => {
    const txs: CreditTransaction[] = [
      {
        id: "t1",
        type: "purchase",
        amount: 5,
        createdAt: "2026-01-01",
      },
    ];
    expect(canBook(txs, 3)).toBe(true);
  });

  test("false when insufficient", () => {
    const txs: CreditTransaction[] = [
      {
        id: "t1",
        type: "purchase",
        amount: 2,
        createdAt: "2026-01-01",
      },
    ];
    expect(canBook(txs, 3)).toBe(false);
  });
});

describe("sessionCost", () => {
  test("chemistry is free", () => {
    expect(sessionCost("chemistry", 3)).toBe(0);
  });

  test("standard uses current per-session price", () => {
    expect(sessionCost("standard", 3)).toBe(1);
  });

  test("project uses current default per-session price", () => {
    expect(sessionCost("project", 5)).toBe(1);
  });
});
