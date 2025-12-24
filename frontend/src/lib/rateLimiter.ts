/**
 * Client-side rate limiting utility
 */

interface RateLimitEntry {
  timestamps: number[];
}

class ClientRateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private maxRequests: number;
  private windowSeconds: number;

  constructor(maxRequests: number = 10, windowSeconds: number = 60) {
    this.maxRequests = maxRequests;
    this.windowSeconds = windowSeconds;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowSeconds * 1000;

    if (!this.limits.has(key)) {
      this.limits.set(key, { timestamps: [now] });
      return true;
    }

    const entry = this.limits.get(key)!;
    entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);

    if (entry.timestamps.length >= this.maxRequests) {
      return false;
    }

    entry.timestamps.push(now);
    return true;
  }

  getRemainingRequests(key: string): number {
    const now = Date.now();
    const windowStart = now - this.windowSeconds * 1000;

    const entry = this.limits.get(key);
    if (!entry) return this.maxRequests;

    const remaining = entry.timestamps.filter((ts) => ts > windowStart).length;
    return Math.max(0, this.maxRequests - remaining);
  }

  reset(key: string): void {
    this.limits.delete(key);
  }

  resetAll(): void {
    this.limits.clear();
  }
}

// Create singleton instances for different endpoints
export const analyticsRateLimiter = new ClientRateLimiter(5, 60); // 5 per minute
export const scanRateLimiter = new ClientRateLimiter(10, 60); // 10 per minute
export const marketRateLimiter = new ClientRateLimiter(20, 60); // 20 per minute

export default ClientRateLimiter;
