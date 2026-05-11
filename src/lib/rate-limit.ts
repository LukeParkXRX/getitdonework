type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function rateLimit(
  key: string,
  options: { max: number; windowMs: number }
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    const newBucket = { count: 1, resetAt: now + options.windowMs };
    buckets.set(key, newBucket);
    return { allowed: true, remaining: options.max - 1, resetAt: newBucket.resetAt };
  }

  if (bucket.count >= options.max) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
  }

  bucket.count++;
  return { allowed: true, remaining: options.max - bucket.count, resetAt: bucket.resetAt };
}

export function getClientKey(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  const ip = fwd ? fwd.split(",")[0].trim() : (req.headers.get("x-real-ip") ?? "unknown");
  return ip;
}
