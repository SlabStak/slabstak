# SlabStak Quick Start Guide

## Run Locally in 3 Steps

### Step 1: Set Up Environment Variables

You'll need to create `.env` files for both frontend and backend. Copy the example files:

```bash
cd /Users/mikemurphy/Downloads/slabstak

# Backend
cp backend/.env.example backend/.env

# Frontend  
cp frontend/.env.example frontend/.env.local
```

Then edit these files with your actual credentials (see SETUP_GUIDE.md for how to get these).

### Step 2: Start the Backend Server

In one terminal:

```bash
cd /Users/mikemurphy/Downloads/slabstak/backend
python3 -m uvicorn main:app --reload --port 8000
```

The backend API will be available at: **http://localhost:8000**

You can test it by visiting: **http://localhost:8000/health**

### Step 3: Start the Frontend Server

In another terminal:

```bash
cd /Users/mikemurphy/Downloads/slabstak/frontend
npm run dev
```

The frontend will be available at: **http://localhost:3000**

## Current Features You Can Test

### 1. Homepage (http://localhost:3000)
- Landing page with value proposition
- Login/signup buttons

### 2. Scan Page (http://localhost:3000/scan)
- Upload a card image
- AI-powered OCR extraction
- Card identification and grading
- Market value estimates
- Save to vault

### 3. Vault (http://localhost:3000/vault)
- View all saved cards
- Click on a card to see details
- Edit notes, purchase price, sold price
- Generate AI listings for multiple platforms
- Export cards to CSV

### 4. Dealer Dashboard (http://localhost:3000/dealer/dashboard)
- Create dealer shows
- Track inventory by show
- Calculate P&L
- Show summaries

### 5. Pricing Page (http://localhost:3000/pricing)
- View subscription tiers
- Stripe checkout integration (test mode)

## Required Environment Variables

### Backend (.env)
```
OPENAI_API_KEY=sk-...
ASSISTANT_ID=asst_...
ALLOWED_ORIGIN=http://localhost:3000
```

### Frontend (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_BACKEND_SCAN_URL=http://localhost:8000/scan
NEXT_PUBLIC_BACKEND_MARKET_URL=http://localhost:8000/market
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_PRO=price_...
```

## Troubleshooting

### Backend won't start
- Make sure Python dependencies are installed: `pip3 install -r backend/requirements.txt`
- Check that you have Tesseract OCR installed: `brew install tesseract`
- Verify OpenAI API key is set in backend/.env

### Frontend won't start
- Make sure dependencies are installed: `cd frontend && npm install`
- Check that Supabase credentials are set in frontend/.env.local
- Verify you're using Node.js 18+: `node --version`

### Can't upload images
- Check that Supabase storage bucket "card-images" exists
- Verify bucket is set to public in Supabase dashboard
- Check storage policies in 003_storage_setup.sql were applied

### Authentication not working
- Verify Supabase URL configuration includes http://localhost:3000 as allowed redirect
- Check that anon key is correctly set
- Make sure database migrations ran successfully

## Need Full Setup?

If you don't have API keys yet, see `docs/SETUP_GUIDE.md` for detailed instructions on:
- Creating Supabase project
- Setting up Stripe
- Getting OpenAI API access
- Running database migrations

## API Documentation

Backend API endpoints:
- `GET /health` - Health check
- `POST /scan` - Upload and scan card image
- `POST /market` - Get market data snapshot
- `POST /generate-listing` - Generate AI listing

Frontend API routes:
- `GET /api/me` - Get current user
- `GET /api/cards` - List user's cards
- `POST /api/cards` - Save new card
- `GET /api/cards/[id]` - Get card details
- `PATCH /api/cards/[id]` - Update card
- `DELETE /api/cards/[id]` - Delete card
- `POST /api/stripe/create-checkout` - Create Stripe checkout
- `POST /api/stripe/webhooks` - Stripe webhook handler

---

**Local Development URLs:**
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- Backend Health: http://localhost:8000/health
- Backend Docs: http://localhost:8000/docs (FastAPI auto-generated)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
