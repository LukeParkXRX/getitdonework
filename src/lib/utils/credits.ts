import type { CreditTransactionType } from "@/types";

export const CREDIT_USD_PRICE = 100;

export type CreditTransaction = {
  id: string;
  type: CreditTransactionType;
  amount: number;
  createdAt: string;
  expiresAt?: string;
};

export function creditsToUsd(credits: number): number {
  if (credits < 0) throw new Error("credits must be non-negative");
  return credits * CREDIT_USD_PRICE;
}

export function usdToCredits(usd: number): number {
  if (usd < 0) throw new Error("usd must be non-negative");
  if (usd % CREDIT_USD_PRICE !== 0) {
    throw new Error(`usd must be multiple of ${CREDIT_USD_PRICE}`);
  }
  return usd / CREDIT_USD_PRICE;
}

export function calculateBalance(
  transactions: CreditTransaction[],
  now: Date = new Date(),
): number {
  return transactions.reduce((sum, tx) => {
    if (tx.expiresAt && new Date(tx.expiresAt) <= now) return sum;
    return sum + tx.amount;
  }, 0);
}

export function canBook(
  transactions: CreditTransaction[],
  required: number,
  now?: Date,
): boolean {
  if (required <= 0) return true;
  return calculateBalance(transactions, now) >= required;
}

export function sessionCost(
  sessionType: "chemistry" | "standard" | "project",
  enablerCreditRate: number,
): number {
  if (sessionType === "chemistry") return 0;
  if (sessionType === "standard") return 1;
  if (sessionType === "project") return 1;
  return enablerCreditRate;
}
