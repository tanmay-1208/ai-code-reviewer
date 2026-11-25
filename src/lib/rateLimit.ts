// Simple fixed-window, in-memory rate limiter. On Vercel each serverless
// instance keeps its own counters, so this is best-effort protection for the
// free Groq quota, not a hard guarantee.

export interface RateLimitOptions {
  limit: number; // max requests per window
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
}

const hits = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  { limit, windowMs }: RateLimitOptions,
  now: number = Date.now()
): RateLimitResult {
  // Drop expired entries so the map cannot grow without bound.
  if (hits.size > 500) {
    hits.forEach((v, k) => {
      if (v.resetAt <= now) hits.delete(k);
    });
  }

  const entry = hits.get(key);
  if (!entry || entry.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSec: 0 };
  }

  if (entry.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  entry.count++;
  return { allowed: true, remaining: limit - entry.count, retryAfterSec: 0 };
}

export function resetRateLimits(): void {
  hits.clear();
}