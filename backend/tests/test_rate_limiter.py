"""Tests for rate limiting functionality"""

import time
import pytest
from unittest.mock import Mock
from main import RateLimiter


class TestRateLimiter:
    """Test suite for RateLimiter class"""

    def test_rate_limiter_allows_initial_requests(self):
        """Test that initial requests are allowed within limits"""
        limiter = RateLimiter(max_requests=5, window_seconds=60)

        for i in range(5):
            allowed, _ = limiter.is_allowed("test_client")
            assert allowed is True

    def test_rate_limiter_blocks_excess_requests(self):
        """Test that requests beyond limit are blocked"""
        limiter = RateLimiter(max_requests=3, window_seconds=60)

        # Use up the limit
        for i in range(3):
            limiter.is_allowed("test_client")

        # Next request should be blocked
        allowed, retry_after = limiter.is_allowed("test_client")
        assert allowed is False
        assert isinstance(retry_after, int)
        assert retry_after > 0

    def test_rate_limiter_respects_window(self):
        """Test that rate limiter respects the time window"""
        limiter = RateLimiter(max_requests=2, window_seconds=1)

        # Use up the limit
        limiter.is_allowed("test_client")
        limiter.is_allowed("test_client")

        # Should be blocked
        allowed, _ = limiter.is_allowed("test_client")
        assert allowed is False

        # Wait for window to reset
        time.sleep(1.1)

        # Should be allowed again
        allowed, _ = limiter.is_allowed("test_client")
        assert allowed is True

    def test_rate_limiter_tracks_multiple_clients(self):
        """Test that rate limiter tracks different clients separately"""
        limiter = RateLimiter(max_requests=2, window_seconds=60)

        # Client 1 uses its limit
        limiter.is_allowed("client_1")
        limiter.is_allowed("client_1")

        # Client 1 is blocked
        allowed, _ = limiter.is_allowed("client_1")
        assert allowed is False

        # Client 2 should still be allowed
        allowed, _ = limiter.is_allowed("client_2")
        assert allowed is True

    def test_get_remaining_requests(self):
        """Test getting remaining request count"""
        limiter = RateLimiter(max_requests=5, window_seconds=60)

        # Initially 5 remaining
        remaining = limiter.get_remaining("test_client")
        assert remaining == 5

        # Make 2 requests
        limiter.is_allowed("test_client")
        limiter.is_allowed("test_client")

        # Should have 3 remaining
        remaining = limiter.get_remaining("test_client")
        assert remaining == 3
