"""
Tests for Listing Generator Service

Run with: pytest tests/test_listing_generator.py
"""

import pytest
from services.listing_generator import (
    ListingGenerator,
    ListingRequest,
    ListingResponse
)


class TestListingGenerator:
    """Test the AI listing generator"""

    def setup_method(self):
        """Set up test fixtures"""
        self.generator = ListingGenerator()

    def test_platform_specs(self):
        """Test platform specifications are defined"""
        assert "ebay" in self.generator.PLATFORM_SPECS
        assert "pwcc" in self.generator.PLATFORM_SPECS
        assert "whatnot" in self.generator.PLATFORM_SPECS
        assert "comc" in self.generator.PLATFORM_SPECS

        ebay_spec = self.generator.PLATFORM_SPECS["ebay"]
        assert ebay_spec["title_max"] == 80
        assert ebay_spec["description_format"] == "html"

    def test_tone_styles(self):
        """Test tone styles are defined"""
        assert "professional" in self.generator.TONE_STYLES
        assert "casual" in self.generator.TONE_STYLES
        assert "enthusiastic" in self.generator.TONE_STYLES

    def test_build_system_prompt(self):
        """Test system prompt generation"""
        prompt = self.generator._build_system_prompt("ebay", "professional")

        assert "eBay" in prompt or "EBAY" in prompt
        assert "80" in prompt  # eBay title max
        assert "formal" in prompt.lower()  # Professional tone becomes "formal" in the description
        assert len(prompt) > 100  # Should be substantial

    def test_build_user_prompt(self):
        """Test user prompt generation"""
        req = ListingRequest(
            player="Mike Trout",
            set_name="2011 Topps Update",
            year=2011,
            grade="PSA 10",
            platform="ebay",
            tone="professional"
        )

        prompt = self.generator._build_user_prompt(req)

        assert "Mike Trout" in prompt
        assert "2011 Topps Update" in prompt
        assert "2011" in prompt
        assert "PSA 10" in prompt
        assert "JSON" in prompt

    def test_quick_description(self):
        """Test quick description generation"""
        description = self.generator.generate_quick_description(
            player="Shohei Ohtani",
            set_name="2018 Topps Chrome",
            year=2018,
            grade="PSA 9"
        )

        assert "Shohei Ohtani" in description
        assert "2018" in description
        assert "2018 Topps Chrome" in description
        assert "PSA 9" in description
        assert len(description) > 50

    @pytest.mark.asyncio
    @pytest.mark.ai
    async def test_generate_listing_ebay(self):
        """Test full listing generation for eBay (requires API key)"""
        req = ListingRequest(
            player="Mike Trout",
            set_name="2011 Topps Update",
            year=2011,
            grade="PSA 10",
            platform="ebay",
            tone="professional",
            include_price=True,
            estimated_value=250.00
        )

        listing = await self.generator.generate_listing(req)

        assert isinstance(listing, ListingResponse)
        assert len(listing.title) > 0
        assert len(listing.title) <= 80  # eBay max
        assert len(listing.description) > 50
        assert len(listing.keywords) >= 5
        assert listing.platform == "ebay"

    @pytest.mark.asyncio
    @pytest.mark.ai
    async def test_generate_listing_pwcc(self):
        """Test full listing generation for PWCC (requires API key)"""
        req = ListingRequest(
            player="LeBron James",
            set_name="2003 Topps Chrome",
            year=2003,
            grade="BGS 9.5",
            platform="pwcc",
            tone="enthusiastic",
            include_price=False
        )

        listing = await self.generator.generate_listing(req)

        assert isinstance(listing, ListingResponse)
        assert len(listing.title) > 0
        assert len(listing.title) <= 100  # PWCC max
        assert listing.platform == "pwcc"
