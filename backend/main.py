import os
import json
import logging
import time
from collections import defaultdict
from io import BytesIO
from typing import Optional
from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image
import pytesseract
from openai import OpenAI
from dotenv import load_dotenv
from cache import market_data_cache, cached

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

# File upload limits
MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", "10"))
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
MAX_IMAGE_DIMENSION = int(os.getenv("MAX_IMAGE_DIMENSION", "8000"))

# Rate limiting configuration
RATE_LIMIT_REQUESTS = int(os.getenv("RATE_LIMIT_REQUESTS", "10"))  # requests per window
RATE_LIMIT_WINDOW = int(os.getenv("RATE_LIMIT_WINDOW", "60"))  # window in seconds


class RateLimiter:
    """Simple in-memory rate limiter using sliding window."""

    def __init__(self, max_requests: int, window_seconds: int):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests: dict[str, list[float]] = defaultdict(list)

    def is_allowed(self, client_id: str) -> tuple[bool, int]:
        """
        Check if request is allowed for client.

        Returns:
            Tuple of (allowed: bool, retry_after: int seconds)
        """
        now = time.time()
        window_start = now - self.window_seconds

        # Clean old requests
        self.requests[client_id] = [
            req_time for req_time in self.requests[client_id]
            if req_time > window_start
        ]

        if len(self.requests[client_id]) >= self.max_requests:
            # Calculate retry after
            oldest = min(self.requests[client_id])
            retry_after = int(oldest + self.window_seconds - now) + 1
            return False, retry_after

        # Allow request
        self.requests[client_id].append(now)
        return True, 0

    def get_remaining(self, client_id: str) -> int:
        """Get remaining requests for client."""
        now = time.time()
        window_start = now - self.window_seconds
        current = [r for r in self.requests.get(client_id, []) if r > window_start]
        return max(0, self.max_requests - len(current))


# Global rate limiter for AI endpoints
ai_rate_limiter = RateLimiter(RATE_LIMIT_REQUESTS, RATE_LIMIT_WINDOW)


def get_client_id(request: Request) -> str:
    """Get client identifier for rate limiting."""
    # Try to get user ID from header (set by authenticated frontend)
    user_id = request.headers.get("X-User-ID")
    if user_id:
        return f"user:{user_id}"

    # Fall back to IP address
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return f"ip:{forwarded.split(',')[0].strip()}"

    return f"ip:{request.client.host if request.client else 'unknown'}"


def check_rate_limit(request: Request, limiter: RateLimiter) -> None:
    """Check rate limit and raise HTTPException if exceeded."""
    client_id = get_client_id(request)
    allowed, retry_after = limiter.is_allowed(client_id)

    if not allowed:
        logger.warning(f"Rate limit exceeded for {client_id}")
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded. Try again in {retry_after} seconds.",
            headers={"Retry-After": str(retry_after)}
        )


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

# Import and include ML routes
try:
    from ml_routes import router as ml_router
    app.include_router(ml_router)
    logger.info("ML routes loaded successfully")
except Exception as e:
    logger.warning(f"ML routes not loaded: {e}")

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
async def scan_card(request: Request, file: UploadFile = File(...)):
    """
    Scan a card image using OCR and AI identification.

    - Accepts image file (JPG, PNG, WEBP)
    - Max file size: 10MB (configurable via MAX_FILE_SIZE_MB)
    - Max dimensions: 8000x8000 (configurable via MAX_IMAGE_DIMENSION)
    - Rate limited: 10 requests per minute (configurable)
    - Returns card details and valuation
    """
    # Check rate limit before processing
    check_rate_limit(request, ai_rate_limiter)

    logger.info(f"Processing scan for file: {file.filename}")

    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    # Read file with size limit
    try:
        contents = await file.read()
        file_size = len(contents)

        if file_size > MAX_FILE_SIZE_BYTES:
            logger.warning(f"File too large: {file_size} bytes (max: {MAX_FILE_SIZE_BYTES})")
            raise HTTPException(
                status_code=413,
                detail=f"File size ({file_size // (1024*1024)}MB) exceeds maximum allowed ({MAX_FILE_SIZE_MB}MB)"
            )

        logger.info(f"File size: {file_size / 1024:.1f}KB")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to read file: {e}")
        raise HTTPException(status_code=400, detail="Failed to read uploaded file")

    try:
        image = Image.open(BytesIO(contents)).convert("RGB")

        # Validate image dimensions
        width, height = image.size
        if width > MAX_IMAGE_DIMENSION or height > MAX_IMAGE_DIMENSION:
            logger.warning(f"Image too large: {width}x{height} (max: {MAX_IMAGE_DIMENSION})")
            raise HTTPException(
                status_code=413,
                detail=f"Image dimensions ({width}x{height}) exceed maximum allowed ({MAX_IMAGE_DIMENSION}x{MAX_IMAGE_DIMENSION})"
            )

        logger.info(f"Image dimensions: {width}x{height}")
    except HTTPException:
        raise
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
    Responses are cached for 15 minutes to reduce API calls.
    """
    logger.info(f"Market data request: {req.player} - {req.set_name}")

    try:
        # Create cache key based on request parameters
        cache_key = f"{req.player}:{req.set_name}:{req.year}:{req.grade_estimate}"

        # Try to get from cache first
        cached_response = market_data_cache.get(cache_key)
        if cached_response:
            logger.info(f"Cache hit for market data: {cache_key}")
            return cached_response

        logger.info(f"Cache miss, fetching fresh data for: {cache_key}")

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
            ],
            "cached": False
        }

        # Cache the response for 15 minutes
        market_data_cache.set(cache_key, response, ttl_seconds=15 * 60)

        logger.info(f"Market data returned: {snapshot.listings_count} listings from {snapshot.source}")
        return response

    except Exception as e:
        logger.error(f"Market data request failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch market data: {str(e)}")


# Import listing generator
from services.listing_generator import listing_generator, ListingRequest as ListingGenRequest


@app.post("/generate-listing")
async def generate_listing(request: Request, req: ListingGenRequest):
    """
    Generate optimized marketplace listing using AI.

    Supports multiple platforms (eBay, PWCC, WhatNot, COMC) with
    customizable tone and formatting.
    Rate limited: 10 requests per minute (configurable)
    """
    # Check rate limit before processing
    check_rate_limit(request, ai_rate_limiter)

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


# Import email service
from services.email import email_service


class PaymentFailedRequest(BaseModel):
    email: str
    subscription_id: str
    user_name: Optional[str] = None


class SubscriptionCanceledRequest(BaseModel):
    email: str
    end_date: str
    user_name: Optional[str] = None


@app.post("/notify/payment-failed")
async def notify_payment_failed(req: PaymentFailedRequest):
    """
    Send payment failed notification email.

    Called by webhook handlers when a payment fails.
    """
    logger.info(f"Sending payment failed notification to {req.email}")

    try:
        success = await email_service.send_payment_failed_email(
            to=req.email,
            subscription_id=req.subscription_id,
            user_name=req.user_name
        )

        if success:
            logger.info(f"Payment failed notification sent to {req.email}")
            return {"status": "sent", "email": req.email}
        else:
            logger.warning(f"Payment failed notification not sent (email service disabled)")
            return {"status": "skipped", "reason": "email service not configured"}

    except Exception as e:
        logger.error(f"Failed to send payment failed notification: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to send notification: {str(e)}")


@app.post("/notify/subscription-canceled")
async def notify_subscription_canceled(req: SubscriptionCanceledRequest):
    """
    Send subscription canceled notification email.

    Called by webhook handlers when a subscription is canceled.
    """
    logger.info(f"Sending subscription canceled notification to {req.email}")

    try:
        success = await email_service.send_subscription_canceled_email(
            to=req.email,
            end_date=req.end_date,
            user_name=req.user_name
        )

        if success:
            logger.info(f"Subscription canceled notification sent to {req.email}")
            return {"status": "sent", "email": req.email}
        else:
            logger.warning(f"Subscription canceled notification not sent (email service disabled)")
            return {"status": "skipped", "reason": "email service not configured"}

    except Exception as e:
        logger.error(f"Failed to send subscription canceled notification: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to send notification: {str(e)}")
