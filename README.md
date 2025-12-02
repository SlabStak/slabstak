# SlabStak ⚡

**AI-powered trading card intelligence platform for collectors, flippers, and dealers.**

[![CI](https://github.com/SlabStak/slabstak/actions/workflows/ci.yml/badge.svg)](https://github.com/SlabStak/slabstak/actions/workflows/ci.yml)

---

## 🚀 Status: v1 Build Complete

**All core features implemented, tested, and production-ready.**

See [BUILD_COMPLETE.md](BUILD_COMPLETE.md) for full details.

---

## ✨ Features

### Core Functionality
- 🔍 **AI Card Scanning** - Upload images, get instant identification and valuation
- 💎 **Digital Vault** - Organize and track your collection
- 📊 **Market Data** - Real-time pricing via eBay API + manual tracking
- 🤖 **AI Listing Generator** - Create optimized listings for eBay, PWCC, WhatNot, COMC
- 📈 **Dealer Tools** - Show tracking, P&L calculations, inventory management
- 📥 **CSV Import/Export** - Bulk import existing collections

### Platform Features
- 🔐 Authentication & user profiles
- 💳 Stripe subscription billing (Free + Pro tiers)
- 📧 Email notifications (welcome, confirmations, summaries)
- 📊 Analytics & event tracking
- 👨‍💼 Admin dashboard with user/card moderation
- 🏥 System health monitoring

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 14.2.33** (App Router) with React 18 & TypeScript
- **Tailwind CSS** for styling
- **Supabase** for auth, database, storage
- **Stripe** for payments
- **Jest** + React Testing Library

### Backend
- **FastAPI** (Python 3.9+) with async/await
- **OpenAI GPT-4** for AI card identification & listing generation
- **Pytesseract** for OCR text extraction
- **Resend** for email delivery
- **eBay Finding API** for market data
- **pytest** with asyncio support

### Infrastructure
- **Database:** Supabase (PostgreSQL) with Row Level Security
- **Storage:** Supabase Storage for card images
- **CI/CD:** GitHub Actions
- **Deployment:** Vercel (frontend) + Railway/Docker (backend)

---

## 🚀 Quick Start

### Option 1: View UI Only (No Setup)

```bash
cd frontend
npm install
npm run dev
```

Visit **http://localhost:3000** to see the interface.

*(Features requiring backend/database won't work yet)*

### Option 2: Full Setup

See [QUICKSTART.md](QUICKSTART.md) for a 3-step local setup guide.

For complete instructions: [docs/SETUP_GUIDE.md](docs/SETUP_GUIDE.md)

---

## 📁 Project Structure

```
slabstak/
├── backend/              # FastAPI backend
│   ├── main.py          # API endpoints
│   ├── services/        # Business logic (market data, AI, email)
│   └── tests/           # pytest test suite
├── frontend/            # Next.js frontend
│   └── src/
│       ├── app/         # Pages & API routes
│       ├── components/  # React components
│       └── lib/         # Utilities
├── database/            # SQL migrations
├── docs/                # Documentation
└── .github/workflows/   # CI/CD
```

---

## 📖 Documentation

- **[QUICKSTART.md](QUICKSTART.md)** - Get running in 3 steps
- **[docs/SETUP_GUIDE.md](docs/SETUP_GUIDE.md)** - Complete setup from scratch
- **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Production deployment
- **[docs/EBAY_API_SETUP.md](docs/EBAY_API_SETUP.md)** - eBay API configuration
- **[TESTING_COMPLETE.md](TESTING_COMPLETE.md)** - Testing infrastructure
- **[BUILD_COMPLETE.md](BUILD_COMPLETE.md)** - Full feature list & specs

---

## 🧪 Testing

### Backend
```bash
cd backend
pytest tests/ -v -m "not ai"        # Run all tests except AI tests
pytest tests/ --cov=services         # With coverage
```

### Frontend
```bash
cd frontend
npm test                             # Run all tests
npm run test:coverage                # With coverage
```

**Current Coverage:** 55% backend services, 100% frontend components tested

---

## 💰 Subscription Tiers

### Free
- 10 card vault limit
- Basic scanning & valuation
- Manual market data entry

### Pro ($29.99/month)
- Unlimited vault storage
- AI listing generator (all platforms)
- Dealer show tracking
- CSV import/export
- Priority support

---

## 🔐 Environment Variables

### Backend (.env)
```bash
OPENAI_API_KEY=sk-...
ASSISTANT_ID=asst_...
RESEND_API_KEY=re_...
EBAY_APP_ID=...
ALLOWED_ORIGIN=http://localhost:3000
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://....supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_BACKEND_SCAN_URL=http://localhost:8000/scan
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

See `.env.example` files for complete configuration.

---

## 🤝 Contributing

This is a production SaaS application. Contributions should:
- Include tests
- Follow existing code style
- Update documentation
- Pass CI/CD checks

---

## 📄 License

Proprietary - All rights reserved

---

## 🎯 Roadmap

**v1.0 (COMPLETE)** ✅
- Core scanning & valuation
- Collection management
- AI listing generator
- Dealer tools
- Subscriptions
- Admin dashboard
- Email notifications
- Analytics
- CSV import/export

**v1.1 (Future)**
- Advanced analytics dashboard with charts
- Additional marketplace integrations (TCGPlayer, 130point)
- Mobile app (React Native)
- Social features (profile sharing, trades)

---

## 🙏 Acknowledgments

- OpenAI for GPT-4 API
- Supabase for backend infrastructure
- Stripe for payment processing
- Vercel for hosting

---

**Built with [Claude Code](https://claude.com/claude-code)**

For support: [GitHub Issues](https://github.com/SlabStak/slabstak/issues)
