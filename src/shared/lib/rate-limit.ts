import "server-only";

type Bucket = {
  count: number;
  resetAt: number;
};

/**
 * Fixed-window in-memory rate limiter.
 *
 * Per-process, so it bounds abuse on a single node rather than across a
 * cluster. It is a speed bump in front of expensive endpoints (playback
 * authorization, chunk uploads), not the authorization check itself — those
 * always run regardless.
 */
export class RateLimiter {
  private readonly buckets = new Map<string, Bucket>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
  ) {}

  /** True when the call is allowed; false when the caller is over budget. */
  check(key: string, now: number = Date.now()): boolean {
    this.sweep(now);

    const bucket = this.buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + this.windowMs });
      return true;
    }

    if (bucket.count >= this.limit) return false;

    bucket.count += 1;
    return true;
  }

  retryAfterSeconds(key: string, now: number = Date.now()): number {
    const bucket = this.buckets.get(key);
    if (!bucket) return 0;
    return Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
  }

  private sweep(now: number): void {
    if (this.buckets.size < 5000) return;
    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAt <= now) this.buckets.delete(key);
    }
  }
}
