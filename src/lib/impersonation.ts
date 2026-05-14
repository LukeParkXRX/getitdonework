import crypto from "crypto";

const SECRET =
  process.env.IMPERSONATION_SECRET ??
  process.env.UNSUBSCRIBE_SECRET ??
  "default-not-secure";

export type ImpersonationPayload = {
  adminId: string;
  targetUserId: string;
  expiresAt: number; // unix ms
  sessionId: string;
};

export function createImpersonationToken(
  payload: ImpersonationPayload
): string {
  const data = JSON.stringify(payload);
  const hmac = crypto
    .createHmac("sha256", SECRET)
    .update(data)
    .digest("hex");
  return Buffer.from(`${data}.${hmac}`).toString("base64url");
}

export function verifyImpersonationToken(
  token: string
): ImpersonationPayload | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const idx = decoded.lastIndexOf(".");
    if (idx < 0) return null;
    const data = decoded.slice(0, idx);
    const hmac = decoded.slice(idx + 1);
    const expected = crypto
      .createHmac("sha256", SECRET)
      .update(data)
      .digest("hex");
    if (expected !== hmac) return null;
    const payload = JSON.parse(data) as ImpersonationPayload;
    if (payload.expiresAt < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
