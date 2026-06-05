import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import * as Sentry from "@sentry/nextjs";

// ── Upstash Redis (환경변수 있을 때만 활성) ───────────────────────────────

const redisUrl =
  process.env.UPSTASH_REDIS_REST_URL ??
  process.env.KV_REST_API_URL;
const redisToken =
  process.env.UPSTASH_REDIS_REST_TOKEN ??
  process.env.KV_REST_API_TOKEN;

const redis = redisUrl && redisToken
  ? new Redis({ url: redisUrl, token: redisToken })
  : null;

// prod에서 Upstash 미설정은 운영 사고. serverless 인스턴스별 in-memory는
// 사실상 rate limit 무력화. 부팅 시 1회 경고 + Sentry 알림.
const IS_PROD = process.env.NEXT_PUBLIC_VERCEL_ENV === "production";
if (IS_PROD && !redis) {
  const msg =
    "[rate-limit] CRITICAL: UPSTASH_REDIS_REST_URL/TOKEN or KV_REST_API_URL/TOKEN missing in prod — " +
    "in-memory fallback is per-instance and effectively disables rate limiting. " +
    "Configure Upstash immediately.";
  console.error(msg);
  try {
    Sentry.captureMessage(msg, { level: "error" });
  } catch {
    // Sentry 미초기화는 무시
  }
}

const fallbackWarnedKeys = new Set<string>();

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

  // in-memory fallback — prod에서 사용 시 prefix별 1회 경고
  if (IS_PROD) {
    const prefix = options.prefix ?? "rl";
    if (!fallbackWarnedKeys.has(prefix)) {
      fallbackWarnedKeys.add(prefix);
      console.error(
        `[rate-limit] fallback active for prefix="${prefix}" — per-instance counter, not safe in prod`
      );
    }
  }

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

/**
 * prod 운영 점검용. health endpoint나 부팅 스크립트에서 호출하여
 * Redis 사용 가능 여부를 외부로 노출한다.
 */
export function rateLimitBackend(): "upstash" | "in-memory" {
  return redis ? "upstash" : "in-memory";
}

export function getClientKey(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  const ip  = fwd ? fwd.split(",")[0].trim() : (req.headers.get("x-real-ip") ?? "unknown");
  return ip;
}
