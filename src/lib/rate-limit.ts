import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ── Upstash Redis (환경변수 있을 때만 활성) ───────────────────────────────

const redisUrl   = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = redisUrl && redisToken
  ? new Redis({ url: redisUrl, token: redisToken })
  : null;

const limiters = new Map<string, Ratelimit>();

function getLimiter(prefix: string, max: number, windowMs: number): Ratelimit | null {
  if (!redis) return null;
  const key = `${prefix}:${max}:${windowMs}`;
  if (!limiters.has(key)) {
    limiters.set(
      key,
      new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(max, `${Math.ceil(windowMs / 1000)} s`),
        prefix,
        analytics: true,
      })
    );
  }
  return limiters.get(key)!;
}

// ── In-memory fallback (기존 코드 유지) ──────────────────────────────────

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

// ── 공개 API (sync → async) ───────────────────────────────────────────────

export async function rateLimit(
  key: string,
  options: { max: number; windowMs: number; prefix?: string }
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const limiter = getLimiter(options.prefix ?? "rl", options.max, options.windowMs);

  if (limiter) {
    const result = await limiter.limit(key);
    return {
      allowed:   result.success,
      remaining: result.remaining,
      resetAt:   result.reset,
    };
  }

  // in-memory fallback
  const now    = Date.now();
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
  const ip  = fwd ? fwd.split(",")[0].trim() : (req.headers.get("x-real-ip") ?? "unknown");
  return ip;
}
