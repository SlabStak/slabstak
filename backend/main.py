import os
import json
import logging
from io import BytesIO
from typing import Optional
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image
import pytesseract
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
ASSISTANT_ID = os.getenv("ASSISTANT_ID")
ALLOWED_ORIGIN = os.getenv("ALLOWED_ORIGIN", "http://localhost:3000")
TESSERACT_CMD = os.getenv("TESSERACT_CMD", "/opt/homebrew/bin/tesseract")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

# Validate required environment variables
if not OPENAI_API_KEY:
    raise RuntimeError("Missing OPENAI_API_KEY environment variable")
if not ASSISTANT_ID:
    raise RuntimeError("Missing ASSISTANT_ID environment variable")

# Configure Tesseract
pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD

# Initialize OpenAI client
client = OpenAI(api_key=OPENAI_API_KEY)

logger.info(f"SlabStak Backend starting in {ENVIRONMENT} mode")
logger.info(f"Allowed origin: {ALLOWED_ORIGIN}")

app = FastAPI(
    title="SlabStak API",
    description="AI-powered trading card intelligence backend",
    version="1.0.0"
)

# Configure CORS
origins = ALLOWED_ORIGIN.split(",") if "," in ALLOWED_ORIGIN else [ALLOWED_ORIGIN]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ScanResponse(BaseModel):
    player: str
    set_name: str
    year: int | None = None
    grade_estimate: str | None = None
    estimated_low: float
    estimated_high: float
    recommendation: str
    raw_ocr: str

@app.get("/")
async def root():
    return {
        "service": "SlabStak API",
        "version": "1.0.0",
        "status": "running",
        "environment": ENVIRONMENT
    }

@app.get("/health")
async def health():
    """Health check endpoint for monitoring"""
    return {
        "status": "ok",
        "environment": ENVIRONMENT,
        "tesseract_configured": bool(TESSERACT_CMD),
        "openai_configured": bool(OPENAI_API_KEY)
    }

@app.post("/scan", response_model=ScanResponse)
async def scan_card(file: UploadFile = File(...)):
    """
    Scan a card image using OCR and AI identification.

    - Accepts image file (JPG, PNG, WEBP)
    - Returns card details and valuation
    """
    logger.info(f"Processing scan for file: {file.filename}")

    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    try:
        contents = await file.read()
        image = Image.open(BytesIO(contents)).convert("RGB")
    except Exception as e:
        logger.error(f"Failed to process image: {e}")
        raise HTTPException(status_code=400, detail="Invalid or corrupted image file")

    # Extract text via OCR
    try:
        raw_ocr = pytesseract.image_to_string(image)
        logger.info(f"OCR extracted {len(raw_ocr)} characters")
    except Exception as e:
        logger.error(f"OCR failed: {e}")
        raise HTTPException(status_code=500, detail="OCR processing failed")

    instructions = '''
You are a professional sports card grader and card market analyst.

Input: OCR text from the front of a trading card or slab.

Task: Return STRICT JSON with keys:
- player (string)
- set_name (string)
- year (integer or null)
- grade_estimate (string)
- estimated_low (float, USD)
- estimated_high (float, USD)
- recommendation (string: "flip" | "hold" | "grade" | "bundle")

No commentary, no markdown, no extra keys. JSON only.
'''

    # Call OpenAI Assistant
    try:
        thread = client.beta.threads.create(
            messages=[
                {
                    "role": "user",
                    "content": f"OCR text from card:\n{raw_ocr}\nReturn JSON only."
                }
            ]
        )

        logger.info(f"Created thread: {thread.id}")

        run = client.beta.threads.runs.create_and_poll(
            thread_id=thread.id,
            assistant_id=ASSISTANT_ID,
            instructions=instructions
        )

        logger.info(f"Run completed with status: {run.status}")

        if run.status != "completed":
            raise HTTPException(
                status_code=500,
                detail=f"AI processing failed with status: {run.status}"
            )

        messages = client.beta.threads.messages.list(thread_id=thread.id)
        latest = messages.data[0]
        content = latest.content[0].text.value

        # Parse JSON response
        data = json.loads(content)

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse AI response: {e}")
        logger.error(f"Content was: {content}")
        raise HTTPException(status_code=500, detail="AI returned invalid JSON format")
    except Exception as e:
        logger.error(f"AI processing error: {e}")
        raise HTTPException(status_code=500, detail=f"AI processing failed: {str(e)}")

    # Build response
    response = ScanResponse(
        player=data.get("player", "Unknown").strip(),
        set_name=data.get("set_name", "Unknown").strip(),
        year=data.get("year"),
        grade_estimate=data.get("grade_estimate"),
        estimated_low=float(data.get("estimated_low", 0)),
        estimated_high=float(data.get("estimated_high", 0)),
        recommendation=data.get("recommendation", "hold"),
        raw_ocr=raw_ocr,
    )

    logger.info(f"Successfully processed card: {response.player}")
    return response



class MarketRequest(BaseModel):
    player: str
    set_name: str
    year: int | None = None
    grade_estimate: str | None = None
    provider: str | None = "auto"


# Import market data service
from services.market_data import market_service, MarketSnapshot as MarketSnapshotModel


@app.post("/market")
async def get_market_snapshot(req: MarketRequest):
    """
    Get real market data for a card.

    Uses multiple providers (eBay, etc.) with automatic fallback.
    Returns comparable sales and pricing statistics.
    """
    logger.info(f"Market data request: {req.player} - {req.set_name}")

    try:
        snapshot = await market_service.get_market_data(
            player=req.player,
            set_name=req.set_name,
            year=req.year,
            grade=req.grade_estimate,
            provider=req.provider or "auto"
        )

        # Convert to response format
        response = {
            "source": snapshot.source,
            "currency": snapshot.currency,
            "floor": snapshot.floor,
            "average": snapshot.average,
            "ceiling": snapshot.ceiling,
            "listings_count": snapshot.listings_count,
            "confidence": snapshot.confidence,
            "last_updated": snapshot.last_updated.isoformat(),
            "comps": [
                {
                    "title": comp.title,
                    "price": comp.price,
                    "sold_date": comp.sold_date.isoformat(),
                    "condition": comp.condition,
                    "grade": comp.grade,
                    "url": comp.url,
                    "source": comp.source
                }
                for comp in snapshot.comps[:10]  # Return top 10 comps
            ]
        }

        logger.info(f"Market data returned: {snapshot.listings_count} listings from {snapshot.source}")
        return response

    except Exception as e:
        logger.error(f"Market data request failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch market data: {str(e)}")


# Import listing generator
from services.listing_generator import listing_generator, ListingRequest as ListingGenRequest


@app.post("/generate-listing")
async def generate_listing(req: ListingGenRequest):
    """
    Generate optimized marketplace listing using AI.

    Supports multiple platforms (eBay, PWCC, WhatNot, COMC) with
    customizable tone and formatting.
    """
    logger.info(f"Generating {req.platform} listing for {req.player}")

    try:
        listing = await listing_generator.generate_listing(req)

        response = {
            "title": listing.title,
            "description": listing.description,
            "keywords": listing.keywords,
            "platform": listing.platform,
            "character_counts": listing.character_counts,
        }

        logger.info(f"Listing generated successfully")
        return response

    except Exception as e:
        logger.error(f"Listing generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate listing: {str(e)}")
