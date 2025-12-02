"""
Market Data Service - Abstraction layer for multiple market data providers

Supports:
- eBay (completed listings)
- Simulated data (fallback)
- Future: TCGPlayer, 130point, etc.
"""

import os
import logging
from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import httpx
from pydantic import BaseModel

logger = logging.getLogger(__name__)


class CompData(BaseModel):
    """Individual comparable sale"""
    title: str
    price: float
    sold_date: datetime
    condition: Optional[str] = None
    grade: Optional[str] = None
    url: Optional[str] = None
    source: str = "unknown"


class MarketSnapshot(BaseModel):
    """Aggregated market data for a card"""
    source: str
    currency: str = "USD"
    floor: float
    average: float
    ceiling: float
    listings_count: int
    comps: List[CompData] = []
    last_updated: datetime
    confidence: str = "medium"  # low, medium, high


class MarketDataProvider(ABC):
    """Abstract base class for market data providers"""

    @abstractmethod
    async def fetch_comps(
        self,
        player: str,
        set_name: str,
        year: Optional[int] = None,
        grade: Optional[str] = None,
        limit: int = 50
    ) -> List[CompData]:
        """Fetch comparable sales"""
        pass

    @abstractmethod
    async def get_snapshot(
        self,
        player: str,
        set_name: str,
        year: Optional[int] = None,
        grade: Optional[str] = None
    ) -> MarketSnapshot:
        """Get aggregated market snapshot"""
        pass


class EbayMarketProvider(MarketDataProvider):
    """
    eBay Market Data Provider using Finding API and Browse API

    Requires:
    - EBAY_APP_ID (Client ID)
    - EBAY_CERT_ID (Client Secret)
    - EBAY_DEV_ID (optional)
    """

    def __init__(self):
        self.app_id = os.getenv("EBAY_APP_ID")
        self.cert_id = os.getenv("EBAY_CERT_ID")
        self.dev_id = os.getenv("EBAY_DEV_ID")

        if not self.app_id:
            logger.warning("EBAY_APP_ID not configured - eBay provider disabled")
            self.enabled = False
        else:
            self.enabled = True

        self.base_url = "https://svcs.ebay.com/services/search/FindingService/v1"
        self.auth_url = "https://api.ebay.com/identity/v1/oauth2/token"
        self.access_token = None
        self.token_expires = None

    async def _get_access_token(self) -> str:
        """Get OAuth access token"""
        if self.access_token and self.token_expires and datetime.now() < self.token_expires:
            return self.access_token

        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.auth_url,
                headers={
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                auth=(self.app_id, self.cert_id),
                data={
                    "grant_type": "client_credentials",
                    "scope": "https://api.ebay.com/oauth/api_scope"
                }
            )

            if response.status_code != 200:
                logger.error(f"eBay auth failed: {response.text}")
                raise Exception("Failed to authenticate with eBay")

            data = response.json()
            self.access_token = data["access_token"]
            # Token expires in seconds, subtract 5 min buffer
            expires_in = data.get("expires_in", 7200) - 300
            self.token_expires = datetime.now() + timedelta(seconds=expires_in)

            return self.access_token

    def _build_search_query(
        self,
        player: str,
        set_name: str,
        year: Optional[int] = None,
        grade: Optional[str] = None
    ) -> str:
        """Build eBay search query"""
        parts = [player, set_name]

        if year:
            parts.append(str(year))

        if grade:
            # Normalize grade format
            if "PSA" in grade.upper():
                parts.append(grade)
            elif grade.isdigit():
                parts.append(f"PSA {grade}")

        query = " ".join(parts)
        logger.info(f"eBay search query: {query}")
        return query

    async def fetch_comps(
        self,
        player: str,
        set_name: str,
        year: Optional[int] = None,
        grade: Optional[str] = None,
        limit: int = 50
    ) -> List[CompData]:
        """Fetch sold listings from eBay"""
        if not self.enabled:
            logger.warning("eBay provider not enabled")
            return []

        query = self._build_search_query(player, set_name, year, grade)

        params = {
            "OPERATION-NAME": "findCompletedItems",
            "SERVICE-VERSION": "1.0.0",
            "SECURITY-APPNAME": self.app_id,
            "RESPONSE-DATA-FORMAT": "JSON",
            "REST-PAYLOAD": "",
            "keywords": query,
            "itemFilter(0).name": "SoldItemsOnly",
            "itemFilter(0).value": "true",
            "itemFilter(1).name": "ListingType",
            "itemFilter(1).value": "FixedPrice",
            "sortOrder": "EndTimeSoonest",
            "paginationInput.entriesPerPage": min(limit, 100),
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(self.base_url, params=params, timeout=30.0)

                if response.status_code != 200:
                    logger.error(f"eBay API error: {response.status_code}")
                    return []

                data = response.json()

                # Parse eBay response
                search_result = data.get("findCompletedItemsResponse", [{}])[0]
                items = search_result.get("searchResult", [{}])[0].get("item", [])

                comps = []
                for item in items:
                    try:
                        # Extract price
                        selling_status = item.get("sellingStatus", [{}])[0]
                        converted_price = selling_status.get("convertedCurrentPrice", [{}])[0]
                        price = float(converted_price.get("__value__", 0))

                        # Extract date
                        end_time = item.get("listingInfo", [{}])[0].get("endTime", [None])[0]
                        sold_date = datetime.fromisoformat(end_time.replace("Z", "+00:00")) if end_time else datetime.now()

                        # Extract title and URL
                        title = item.get("title", [None])[0] or "Unknown"
                        url = item.get("viewItemURL", [None])[0]

                        # Extract condition
                        condition_info = item.get("condition", [{}])[0]
                        condition = condition_info.get("conditionDisplayName", [None])[0]

                        comp = CompData(
                            title=title,
                            price=price,
                            sold_date=sold_date,
                            condition=condition,
                            grade=grade,
                            url=url,
                            source="ebay"
                        )
                        comps.append(comp)

                    except (KeyError, ValueError, IndexError) as e:
                        logger.warning(f"Failed to parse eBay item: {e}")
                        continue

                logger.info(f"Fetched {len(comps)} comps from eBay")
                return comps

        except Exception as e:
            logger.error(f"eBay API request failed: {e}")
            return []

    async def get_snapshot(
        self,
        player: str,
        set_name: str,
        year: Optional[int] = None,
        grade: Optional[str] = None
    ) -> MarketSnapshot:
        """Get market snapshot from eBay sold listings"""
        comps = await self.fetch_comps(player, set_name, year, grade, limit=50)

        if not comps:
            # Return minimal snapshot if no data
            return MarketSnapshot(
                source="ebay",
                floor=0.0,
                average=0.0,
                ceiling=0.0,
                listings_count=0,
                last_updated=datetime.now(),
                confidence="low"
            )

        prices = [comp.price for comp in comps if comp.price > 0]

        if not prices:
            return MarketSnapshot(
                source="ebay",
                floor=0.0,
                average=0.0,
                ceiling=0.0,
                listings_count=len(comps),
                comps=comps,
                last_updated=datetime.now(),
                confidence="low"
            )

        # Calculate statistics
        prices.sort()
        floor = prices[int(len(prices) * 0.1)]  # 10th percentile
        average = sum(prices) / len(prices)
        ceiling = prices[int(len(prices) * 0.9)]  # 90th percentile

        # Determine confidence based on sample size
        if len(comps) >= 30:
            confidence = "high"
        elif len(comps) >= 10:
            confidence = "medium"
        else:
            confidence = "low"

        return MarketSnapshot(
            source="ebay",
            floor=round(floor, 2),
            average=round(average, 2),
            ceiling=round(ceiling, 2),
            listings_count=len(comps),
            comps=comps[:20],  # Include top 20 comps
            last_updated=datetime.now(),
            confidence=confidence
        )


class SimulatedMarketProvider(MarketDataProvider):
    """Simulated market data for testing/fallback"""

    async def fetch_comps(
        self,
        player: str,
        set_name: str,
        year: Optional[int] = None,
        grade: Optional[str] = None,
        limit: int = 50
    ) -> List[CompData]:
        """Generate simulated comps"""
        import random

        base_price = 100.0
        if grade and "10" in grade:
            base_price = 250.0
        elif grade and "9" in grade:
            base_price = 140.0

        comps = []
        for i in range(min(limit, 20)):
            price = base_price * random.uniform(0.8, 1.2)
            days_ago = random.randint(1, 90)

            comp = CompData(
                title=f"{player} {set_name} {year or 'Vintage'}",
                price=round(price, 2),
                sold_date=datetime.now() - timedelta(days=days_ago),
                condition="Used",
                grade=grade,
                source="simulated"
            )
            comps.append(comp)

        return comps

    async def get_snapshot(
        self,
        player: str,
        set_name: str,
        year: Optional[int] = None,
        grade: Optional[str] = None
    ) -> MarketSnapshot:
        """Generate simulated snapshot"""
        comps = await self.fetch_comps(player, set_name, year, grade)
        prices = [comp.price for comp in comps]

        return MarketSnapshot(
            source="simulated",
            floor=round(min(prices) * 0.9, 2),
            average=round(sum(prices) / len(prices), 2),
            ceiling=round(max(prices) * 1.1, 2),
            listings_count=len(comps),
            comps=comps,
            last_updated=datetime.now(),
            confidence="low"
        )


class MarketDataService:
    """
    Main market data service - coordinates multiple providers
    """

    def __init__(self):
        self.providers: List[MarketDataProvider] = []

        # Initialize providers
        ebay_provider = EbayMarketProvider()
        if ebay_provider.enabled:
            self.providers.append(ebay_provider)
            logger.info("eBay market provider enabled")

        # Always add simulated as fallback
        self.providers.append(SimulatedMarketProvider())
        logger.info(f"Market data service initialized with {len(self.providers)} providers")

    async def get_market_data(
        self,
        player: str,
        set_name: str,
        year: Optional[int] = None,
        grade: Optional[str] = None,
        provider: str = "auto"
    ) -> MarketSnapshot:
        """
        Get market data, trying providers in order until success

        Args:
            player: Player name
            set_name: Card set name
            year: Card year
            grade: Grade (e.g., "PSA 10")
            provider: Specific provider or "auto" for fallback
        """
        for p in self.providers:
            try:
                # Match provider by class name (e.g., "simulated" matches "SimulatedMarketProvider")
                if provider != "auto":
                    class_name = p.__class__.__name__.lower()
                    if provider.lower() not in class_name:
                        continue

                logger.info(f"Fetching market data from {p.__class__.__name__}")
                snapshot = await p.get_snapshot(player, set_name, year, grade)

                if snapshot.listings_count > 0:
                    logger.info(f"Successfully fetched {snapshot.listings_count} comps")
                    return snapshot

            except Exception as e:
                logger.error(f"Provider {p.__class__.__name__} failed: {e}")
                continue

        # Return empty snapshot if all fail
        logger.warning("All market data providers failed")
        return MarketSnapshot(
            source="none",
            floor=0.0,
            average=0.0,
            ceiling=0.0,
            listings_count=0,
            last_updated=datetime.now(),
            confidence="low"
        )


# Global instance
market_service = MarketDataService()
