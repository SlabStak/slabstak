"""
AI Listing Generator Service

Generates optimized marketplace listings for trading cards using OpenAI GPT-4.
Supports multiple platforms with customizable tones.
"""

import os
import logging
from typing import Optional, Dict, Any
from pydantic import BaseModel
from openai import OpenAI

logger = logging.getLogger(__name__)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


class ListingRequest(BaseModel):
    """Request for generating a listing"""
    player: str
    set_name: str
    year: Optional[int] = None
    grade: Optional[str] = None
    condition: Optional[str] = None
    serial_number: Optional[str] = None
    parallel: Optional[str] = None
    platform: str = "ebay"  # ebay, pwcc, whatnot, comc
    tone: str = "professional"  # professional, casual, enthusiastic
    include_price: bool = True
    estimated_value: Optional[float] = None


class ListingResponse(BaseModel):
    """Generated listing"""
    title: str
    description: str
    keywords: list[str]
    platform: str
    character_counts: Dict[str, int]


class ListingGenerator:
    """Generates optimized marketplace listings using AI"""

    PLATFORM_SPECS = {
        "ebay": {
            "title_max": 80,
            "description_format": "html",
            "emphasis": "SEO keywords, condition details, buyer protection",
        },
        "pwcc": {
            "title_max": 100,
            "description_format": "markdown",
            "emphasis": "Investment potential, grading details, provenance",
        },
        "whatnot": {
            "title_max": 60,
            "description_format": "text",
            "emphasis": "Excitement, rarity, collectibility",
        },
        "comc": {
            "title_max": 75,
            "description_format": "text",
            "emphasis": "Condition, authenticity, shipping details",
        },
    }

    TONE_STYLES = {
        "professional": "formal, detailed, emphasizes authenticity and investment value",
        "casual": "friendly, conversational, emphasizes fun and collectibility",
        "enthusiastic": "exciting, passionate, emphasizes rarity and desirability",
    }

    def _build_system_prompt(self, platform: str, tone: str) -> str:
        """Build system prompt based on platform and tone"""
        platform_spec = self.PLATFORM_SPECS.get(platform, self.PLATFORM_SPECS["ebay"])
        tone_style = self.TONE_STYLES.get(tone, self.TONE_STYLES["professional"])

        return f"""You are an expert trading card marketplace listing writer with 10+ years of experience selling high-value sports cards and collectibles.

Platform: {platform.upper()}
Platform Requirements:
- Title max length: {platform_spec['title_max']} characters
- Description format: {platform_spec['description_format']}
- Focus on: {platform_spec['emphasis']}

Writing Style: {tone_style}

Your goal is to create compelling, SEO-optimized listings that:
1. Accurately describe the card
2. Highlight key selling points
3. Build buyer confidence
4. Maximize visibility in search results
5. Follow platform best practices

IMPORTANT:
- Be honest and accurate (no misleading claims)
- Use proper grading terminology
- Include relevant keywords naturally
- Structure information clearly
- Create urgency without being pushy
"""

    def _build_user_prompt(self, req: ListingRequest) -> str:
        """Build user prompt with card details"""
        card_details = [
            f"Player: {req.player}",
            f"Set: {req.set_name}",
        ]

        if req.year:
            card_details.append(f"Year: {req.year}")
        if req.grade:
            card_details.append(f"Grade: {req.grade}")
        if req.condition:
            card_details.append(f"Condition: {req.condition}")
        if req.serial_number:
            card_details.append(f"Serial #: {req.serial_number}")
        if req.parallel:
            card_details.append(f"Parallel: {req.parallel}")
        if req.estimated_value and req.include_price:
            card_details.append(f"Estimated Value: ${req.estimated_value:,.2f}")

        platform_spec = self.PLATFORM_SPECS.get(req.platform, self.PLATFORM_SPECS["ebay"])

        prompt = f"""Create an optimized {req.platform.upper()} listing for this card:

{chr(10).join(card_details)}

Generate:
1. TITLE: Compelling, keyword-rich title (max {platform_spec['title_max']} characters)
2. DESCRIPTION: Detailed, persuasive description ({platform_spec['description_format']} format)
3. KEYWORDS: 10-15 relevant search keywords

Format your response as JSON:
{{
  "title": "...",
  "description": "...",
  "keywords": ["keyword1", "keyword2", ...]
}}

Make it compelling, accurate, and optimized for {req.platform}!
"""
        return prompt

    async def generate_listing(self, req: ListingRequest) -> ListingResponse:
        """
        Generate optimized listing using GPT-4

        Args:
            req: Listing request with card details

        Returns:
            Complete listing with title, description, keywords
        """
        logger.info(f"Generating {req.platform} listing for {req.player}")

        try:
            system_prompt = self._build_system_prompt(req.platform, req.tone)
            user_prompt = self._build_user_prompt(req)

            response = client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.7,
                max_tokens=1500,
                response_format={"type": "json_object"},
            )

            content = response.choices[0].message.content
            import json
            data = json.loads(content)

            title = data.get("title", "").strip()
            description = data.get("description", "").strip()
            keywords = data.get("keywords", [])

            # Validate title length
            platform_spec = self.PLATFORM_SPECS.get(req.platform, self.PLATFORM_SPECS["ebay"])
            if len(title) > platform_spec["title_max"]:
                logger.warning(f"Title exceeds max length, truncating: {len(title)} > {platform_spec['title_max']}")
                title = title[:platform_spec["title_max"] - 3] + "..."

            response = ListingResponse(
                title=title,
                description=description,
                keywords=keywords,
                platform=req.platform,
                character_counts={
                    "title": len(title),
                    "description": len(description),
                    "title_max": platform_spec["title_max"],
                }
            )

            logger.info(f"Successfully generated listing: {len(title)} chars title, {len(description)} chars description")
            return response

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI response: {e}")
            raise Exception("AI returned invalid format")
        except Exception as e:
            logger.error(f"Listing generation failed: {e}")
            raise Exception(f"Failed to generate listing: {str(e)}")

    def generate_quick_description(
        self,
        player: str,
        set_name: str,
        year: Optional[int] = None,
        grade: Optional[str] = None,
    ) -> str:
        """
        Generate a quick, simple description without full AI call.
        Useful for bulk operations or when AI is unavailable.
        """
        parts = []

        if year:
            parts.append(f"{year}")
        parts.append(set_name)
        parts.append(player)

        if grade:
            parts.append(f"- Graded {grade}")

        description = " ".join(parts)
        description += "\n\nAuthentic trading card in excellent condition."
        description += "\nShips securely in protective sleeve."
        description += "\nSame-day shipping on purchases before 2pm EST."
        description += "\n\nBuy with confidence!"

        return description


# Global instance
listing_generator = ListingGenerator()
