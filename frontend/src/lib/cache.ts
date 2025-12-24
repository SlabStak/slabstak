/**
 * Client-side in-memory cache with TTL support
 * Used for caching API responses, market data, and other frequently accessed data
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class Cache<T> {
  private storage: Map<string, CacheEntry<T>> = new Map();
  private defaultTTL: number; // in milliseconds

  constructor(defaultTTLSeconds: number = 15 * 60) {
    // 15 minutes default
    this.defaultTTL = defaultTTLSeconds * 1000;
  }

  /**
   * Get value from cache if it exists and hasn't expired
   */
  get(key: string): T | null {
    const entry = this.storage.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.storage.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set value in cache with optional custom TTL
   */
  set(key: string, data: T, ttlSeconds?: number): void {
    const ttl = ttlSeconds ? ttlSeconds * 1000 : this.defaultTTL;
    const expiresAt = Date.now() + ttl;

    this.storage.set(key, { data, expiresAt });
  }

  /**
   * Check if key exists and hasn't expired
   */
  has(key: string): boolean {
    const entry = this.storage.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expiresAt) {
      this.storage.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Remove specific key from cache
   */
  delete(key: string): void {
    this.storage.delete(key);
  }

  /**
   * Clear all expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.storage.entries()) {
      if (now > entry.expiresAt) {
        this.storage.delete(key);
      }
    }
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.storage.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.storage.size;
  }
}

// Create singleton cache instances for different data types
export const marketDataCache = new Cache(15 * 60); // 15 minutes for market data
export const playerDataCache = new Cache(30 * 60); // 30 minutes for player data
export const ebayDataCache = new Cache(15 * 60); // 15 minutes for eBay API responses
export const analyticsCache = new Cache(5 * 60); // 5 minutes for analytics data

export default Cache;
