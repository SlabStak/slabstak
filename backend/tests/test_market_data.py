"""
Tests for Market Data Service

Run with: pytest tests/test_market_data.py
"""

import pytest
from datetime import datetime
from services.market_data import (
    SimulatedMarketProvider,
    MarketDataService,
    CompData,
    MarketSnapshot
)


class TestSimulatedMarketProvider:
    """Test the simulated market data provider"""

    @pytest.mark.asyncio
    async def test_fetch_comps(self):
        """Test fetching comparable sales"""
        provider = SimulatedMarketProvider()

        comps = await provider.fetch_comps(
            player="Mike Trout",
            set_name="2011 Topps Update",
            year=2011,
            grade="PSA 10",
            limit=20
        )

        assert len(comps) == 20
        assert all(isinstance(comp, CompData) for comp in comps)
        assert all(comp.source == "simulated" for comp in comps)
        assert all(comp.price > 0 for comp in comps)

    @pytest.mark.asyncio
    async def test_get_snapshot(self):
        """Test getting market snapshot"""
        provider = SimulatedMarketProvider()

        snapshot = await provider.get_snapshot(
            player="Shohei Ohtani",
            set_name="2018 Topps Chrome",
            year=2018,
            grade="PSA 9"
        )

        assert isinstance(snapshot, MarketSnapshot)
        assert snapshot.source == "simulated"
        assert snapshot.floor < snapshot.average < snapshot.ceiling
        assert snapshot.listings_count > 0
        assert len(snapshot.comps) > 0


class TestMarketDataService:
    """Test the market data service coordinator"""

    @pytest.mark.asyncio
    async def test_get_market_data_simulated(self):
        """Test getting market data with simulated provider"""
        service = MarketDataService()

        snapshot = await service.get_market_data(
            player="LeBron James",
            set_name="2003 Topps Chrome",
            year=2003,
            provider="simulated"
        )

        assert isinstance(snapshot, MarketSnapshot)
        assert snapshot.source == "simulated"
        assert snapshot.listings_count > 0

    @pytest.mark.asyncio
    async def test_get_market_data_auto_fallback(self):
        """Test automatic fallback to simulated data"""
        service = MarketDataService()

        # Without eBay configured, should fall back to simulated
        snapshot = await service.get_market_data(
            player="Unknown Player",
            set_name="Unknown Set",
            provider="auto"
        )

        assert isinstance(snapshot, MarketSnapshot)
        # Should return some data even for unknown cards
        assert snapshot.source in ["ebay", "simulated"]
