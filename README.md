# SlabStak

AI-powered trading card intelligence platform for collectors, flippers, and dealers.

## Overview

SlabStak uses computer vision and AI to help you:
- Identify and grade trading cards instantly
- Get real-time market valuations
- Track your collection's value
- Make data-driven flip/hold/grade decisions
- Manage inventory for dealers

## Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Supabase Auth
- Stripe

**Backend:**
- FastAPI (Python)
- OpenAI GPT-4 (Assistants API)
- Pytesseract OCR
- Pillow

**Infrastructure:**
- Supabase (PostgreSQL + Auth + Storage)
- Vercel (Frontend hosting)
- Docker (Backend deployment)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.9+
- Tesseract OCR installed
- Supabase account
- Stripe account
- OpenAI API key

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.local
# Fill in your environment variables
npm run dev
```

Frontend runs at http://localhost:3000

### Backend Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Fill in your environment variables
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend runs at http://localhost:8000

### Database Setup

1. Create a Supabase project at https://supabase.com
2. Run the migrations in `database/migrations/` in order
3. Configure Row Level Security policies
4. Set up Storage bucket for card images

See `database/README.md` for detailed instructions.

## Environment Variables

### Frontend (.env.local)

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_BACKEND_SCAN_URL=http://localhost:8000
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Backend (.env)

```
OPENAI_API_KEY=sk-...
ASSISTANT_ID=asst_...
ALLOWED_ORIGIN=http://localhost:3000
```

## Project Structure

```
slabstak/
├── frontend/           # Next.js application
│   ├── src/
│   │   ├── app/       # Pages and API routes
│   │   ├── components/ # React components
│   │   └── lib/       # Utilities and services
│   └── public/        # Static assets
├── backend/           # FastAPI application
│   ├── main.py        # API endpoints
│   └── services/      # Business logic
├── database/          # Database schema and migrations
└── docs/             # Documentation
```

## Features

### Core Features (v1)
- ✅ Card scanning and AI recognition
- ✅ Market valuation engine
- ✅ Collection vault
- ✅ User authentication
- ✅ Subscription tiers (Free/Pro)
- ✅ Image storage

### Dealer Tools
- ✅ Show management
- ✅ Inventory tracking
- ✅ P&L reports
- ✅ Bulk operations

### Coming Soon
- Real-time market data integration (eBay API)
- Mobile app
- Portfolio analytics
- Alert system for price movements
- Marketplace listing generation

## Deployment

### Frontend (Vercel)

```bash
cd frontend
vercel deploy --prod
```

### Backend (Docker)

```bash
cd backend
docker build -t slabstak-backend .
docker run -p 8000:8000 --env-file .env slabstak-backend
```

See `docs/deployment.md` for production deployment guides.

## Contributing

This is a private commercial project. For questions, contact the development team.

## License

Proprietary - All rights reserved

## Support

For issues or questions, contact support@slabstak.com
