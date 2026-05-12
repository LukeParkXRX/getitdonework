import crypto from "crypto";

const SECRET = process.env.UNSUBSCRIBE_SECRET ?? "default-not-secure-change-me";

export function generateUnsubscribeToken(userId: string): string {
  const data = `${userId}:${Math.floor(Date.now() / (1000 * 60 * 60 * 24 * 30))}`; // 30일 round
  const hmac = crypto
    .createHmac("sha256", SECRET)
    .update(data)
    .digest("hex")
    .slice(0, 32);
  return Buffer.from(`${userId}.${hmac}`).toString("base64url");
}

export function verifyUnsubscribeToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const dotIndex = decoded.indexOf(".");
    if (dotIndex === -1) return null;
    const userId = decoded.slice(0, dotIndex);
    const hmac = decoded.slice(dotIndex + 1);
    if (!userId || !hmac) return null;

    const now = Math.floor(Date.now() / (1000 * 60 * 60 * 24 * 30));
    for (const offset of [0, -1]) {
      const data = `${userId}:${now + offset}`;
      const expected = crypto
        .createHmac("sha256", SECRET)
        .update(data)
        .digest("hex")
        .slice(0, 32);
      if (expected === hmac) return userId;
    }
    return null;
  } catch {
    return null;
  }
}
