"""
In-memory caching utilities for backend API responses
Used for caching market data, API responses, and other expensive operations
"""

import time
from typing import Any, Optional, Dict
from datetime import datetime, timedelta


class CacheEntry:
    """Represents a single cache entry with TTL"""

    def __init__(self, data: Any, ttl_seconds: int):
        self.data = data
        self.created_at = time.time()
        self.ttl_seconds = ttl_seconds

    def is_expired(self) -> bool:
        """Check if the cache entry has expired"""
        elapsed = time.time() - self.created_at
        return elapsed > self.ttl_seconds

    def get_remaining_ttl(self) -> int:
        """Get remaining TTL in seconds"""
        elapsed = int(time.time() - self.created_at)
        return max(0, self.ttl_seconds - elapsed)


class Cache:
    """Simple in-memory cache with TTL support"""

    def __init__(self, default_ttl_seconds: int = 900):  # 15 minutes default
        self.storage: Dict[str, CacheEntry] = {}
        self.default_ttl = default_ttl_seconds
        self.hits = 0
        self.misses = 0

    def get(self, key: str) -> Optional[Any]:
        """Get value from cache if it exists and hasn't expired"""
        if key not in self.storage:
            self.misses += 1
            return None

        entry = self.storage[key]
        if entry.is_expired():
            del self.storage[key]
            self.misses += 1
            return None

        self.hits += 1
        return entry.data

    def set(self, key: str, data: Any, ttl_seconds: Optional[int] = None) -> None:
        """Set value in cache with optional custom TTL"""
        ttl = ttl_seconds or self.default_ttl
        self.storage[key] = CacheEntry(data, ttl)

    def has(self, key: str) -> bool:
        """Check if key exists and hasn't expired"""
        return self.get(key) is not None

    def delete(self, key: str) -> None:
        """Remove specific key from cache"""
        self.storage.pop(key, None)

    def cleanup(self) -> int:
        """Remove all expired entries. Returns count of removed entries"""
        expired_keys = [key for key, entry in self.storage.items() if entry.is_expired()]
        for key in expired_keys:
            del self.storage[key]
        return len(expired_keys)

    def clear(self) -> None:
        """Clear entire cache"""
        self.storage.clear()
        self.hits = 0
        self.misses = 0

    def size(self) -> int:
        """Get cache size"""
        return len(self.storage)

    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        total_requests = self.hits + self.misses
        hit_rate = (self.hits / total_requests * 100) if total_requests > 0 else 0

        return {
            "size": self.size(),
            "hits": self.hits,
            "misses": self.misses,
            "total_requests": total_requests,
            "hit_rate": f"{hit_rate:.2f}%",
        }


# Create singleton cache instances for different data types
market_data_cache = Cache(ttl_seconds=15 * 60)  # 15 minutes for market data
ebay_data_cache = Cache(ttl_seconds=15 * 60)  # 15 minutes for eBay API responses
player_data_cache = Cache(ttl_seconds=30 * 60)  # 30 minutes for player data


def cached(cache: Cache, ttl_seconds: Optional[int] = None):
    """
    Decorator for caching function results
    Usage: @cached(market_data_cache, ttl_seconds=900)
    """

    def decorator(func):
        def wrapper(*args, **kwargs):
            # Create cache key from function name and arguments
            cache_key = f"{func.__name__}:{str(args)}:{str(kwargs)}"

            # Try to get from cache
            result = cache.get(cache_key)
            if result is not None:
                return result

            # Call function and cache result
            result = func(*args, **kwargs)
            cache.set(cache_key, result, ttl_seconds)
            return result

        return wrapper

    return decorator
