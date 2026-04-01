export type RateLimitDecision = {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
  resetAtEpochSeconds: number;
};

type RateBucket = {
  count: number;
  resetAt: number;
  touchedAt: number;
};

type RateLimitInput = {
  scope: string;
  key: string;
  windowMs: number;
  max: number;
};

type RateStore = Map<string, RateBucket>;

const getRateStore = (): RateStore => {
  const root = globalThis as typeof globalThis & { __chronicleRateStore?: RateStore };
  if (!root.__chronicleRateStore) {
    root.__chronicleRateStore = new Map<string, RateBucket>();
  }
  return root.__chronicleRateStore;
};

const cleanupExpiredBuckets = (store: RateStore, now: number) => {
  if (store.size < 1024) return;
  for (const [bucketKey, bucket] of store.entries()) {
    if (bucket.resetAt <= now) {
      store.delete(bucketKey);
    }
  }
};

export const checkRateLimit = ({ scope, key, windowMs, max }: RateLimitInput): RateLimitDecision => {
  const now = Date.now();
  const store = getRateStore();
  cleanupExpiredBuckets(store, now);

  const bucketKey = `${scope}:${key}`;
  const current = store.get(bucketKey);

  if (!current || current.resetAt <= now) {
    const resetAt = now + windowMs;
    store.set(bucketKey, { count: 1, resetAt, touchedAt: now });
    return {
      allowed: true,
      limit: max,
      remaining: Math.max(0, max - 1),
      retryAfterSeconds: 0,
      resetAtEpochSeconds: Math.ceil(resetAt / 1000),
    };
  }

  if (current.count >= max) {
    const retryAfterMs = Math.max(0, current.resetAt - now);
    return {
      allowed: false,
      limit: max,
      remaining: 0,
      retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
      resetAtEpochSeconds: Math.ceil(current.resetAt / 1000),
    };
  }

  current.count += 1;
  current.touchedAt = now;
  store.set(bucketKey, current);

  return {
    allowed: true,
    limit: max,
    remaining: Math.max(0, max - current.count),
    retryAfterSeconds: 0,
    resetAtEpochSeconds: Math.ceil(current.resetAt / 1000),
  };
};

export const getRateLimitHeaders = (decision: RateLimitDecision): Record<string, string> => ({
  "X-RateLimit-Limit": String(decision.limit),
  "X-RateLimit-Remaining": String(decision.remaining),
  "X-RateLimit-Reset": String(decision.resetAtEpochSeconds),
  ...(decision.allowed ? {} : { "Retry-After": String(decision.retryAfterSeconds) }),
});
