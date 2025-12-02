# SlabStak Complete Setup Guide

This guide will walk you through setting up SlabStak from scratch. Follow each step carefully to get your development environment running.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Supabase Setup](#supabase-setup)
3. [Stripe Setup](#stripe-setup)
4. [OpenAI Setup](#openai-setup)
5. [Backend Setup](#backend-setup)
6. [Frontend Setup](#frontend-setup)
7. [Testing](#testing)
8. [Deployment](#deployment)

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 18+** and npm
- **Python 3.9+**
- **Git**
- **Tesseract OCR**
  - macOS: `brew install tesseract`
  - Ubuntu: `sudo apt-get install tesseract-ocr`
  - Windows: Download from https://github.com/UB-Mannheim/tesseract/wiki

### Verify installations:

```bash
node --version  # Should be 18 or higher
python3 --version  # Should be 3.9 or higher
tesseract --version  # Should show version info
git --version  # Should show version info
```

---

## Supabase Setup

### 1. Create Supabase Project

1. Go to https://supabase.com
2. Sign up or log in
3. Click "New Project"
4. Configure:
   - **Name**: slabstak
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to your users
5. Click "Create new project" and wait for it to initialize (~2 minutes)

### 2. Run Database Migrations

Once your project is ready:

1. In Supabase dashboard, go to **SQL Editor**
2. Create a new query
3. Copy and paste the content from `database/migrations/001_initial_schema.sql`
4. Click **Run**
5. Repeat for `002_row_level_security.sql`
6. Repeat for `003_storage_setup.sql`

### 3. Create Storage Bucket

1. Go to **Storage** > **Buckets**
2. Click **New bucket**
3. Configure:
   - **Name**: `card-images`
   - **Public bucket**: Yes (checked)
   - **File size limit**: 5 MB
   - **Allowed MIME types**: Leave empty for all images
4. Click **Save**

### 4. Get API Credentials

1. Go to **Settings** > **API**
2. Copy these values (you'll need them later):
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key
   - **service_role** key (keep this secret!)

### 5. Configure Authentication

1. Go to **Authentication** > **Providers**
2. Ensure **Email** is enabled
3. Go to **URL Configuration**:
   - **Site URL**: `http://localhost:3000` (for development)
   - **Redirect URLs**: Add `http://localhost:3000/**`
4. For production, add your production domain later

---

## Stripe Setup

### 1. Create Stripe Account

1. Go to https://stripe.com
2. Sign up for an account
3. Complete verification (for production) or use test mode

### 2. Create Products and Prices

1. Go to **Products** > **Add product**
2. Create "Pro Monthly" product:
   - **Name**: SlabStak Pro Monthly
   - **Description**: Unlimited card scans and vault
   - **Pricing**: Recurring
   - **Price**: $9.99/month (or your preferred pricing)
   - **Billing period**: Monthly
3. Save and copy the **Price ID** (starts with `price_`)
4. Repeat for annual plan if desired

### 3. Get API Keys

1. Go to **Developers** > **API keys**
2. Copy:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`)
3. Keep these secure!

### 4. Set Up Webhook

1. Go to **Developers** > **Webhooks**
2. Click **Add endpoint**
3. Configure:
   - **Endpoint URL**: `http://localhost:3000/api/stripe/webhooks` (for local testing, use Stripe CLI)
   - For production: `https://yourdomain.com/api/stripe/webhooks`
   - **Events to listen to**: Select these events:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
4. Save and copy the **Webhook signing secret** (starts with `whsec_`)

### 5. Install Stripe CLI (for local testing)

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Other platforms: https://stripe.com/docs/stripe-cli
```

Login to Stripe CLI:
```bash
stripe login
```

---

## OpenAI Setup

### 1. Create OpenAI Account

1. Go to https://platform.openai.com
2. Sign up or log in
3. Add payment method in **Billing**
4. Set usage limits if desired

### 2. Get API Key

1. Go to **API keys**
2. Click **Create new secret key**
3. Name it "SlabStak"
4. Copy the key (starts with `sk-proj-` or `sk-`)
5. **Save this securely** - you won't see it again!

### 3. Create Assistant

1. Go to https://platform.openai.com/assistants
2. Click **Create**
3. Configure:
   - **Name**: SlabStak Card Identifier
   - **Model**: gpt-4-turbo-preview or gpt-4
   - **Instructions**:
     ```
     You are a professional sports card grader and market analyst.
     When given OCR text from a trading card, identify the card and provide valuation.
     Always return responses in strict JSON format with no markdown or extra commentary.
     Be accurate and conservative with valuations.
     ```
   - **Tools**: None
   - **Files**: None
4. Save and copy the **Assistant ID** (starts with `asst_`)

---

## Backend Setup

### 1. Navigate to Backend Directory

```bash
cd backend
```

### 2. Create Virtual Environment

```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your values:
```env
OPENAI_API_KEY=sk-your-key-here
ASSISTANT_ID=asst_your-assistant-id-here
ALLOWED_ORIGIN=http://localhost:3000
TESSERACT_CMD=/opt/homebrew/bin/tesseract  # Update for your system
ENVIRONMENT=development
```

### 5. Test Backend

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Visit http://localhost:8000/health - you should see:
```json
{
  "status": "ok",
  "environment": "development",
  "tesseract_configured": true,
  "openai_configured": true
}
```

If successful, stop the server (Ctrl+C) for now.

---

## Frontend Setup

### 1. Navigate to Frontend Directory

```bash
cd ../frontend  # If coming from backend
# OR
cd frontend  # If from root
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your values:
```env
# Supabase (from Supabase setup)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Backend API
NEXT_PUBLIC_BACKEND_SCAN_URL=http://localhost:8000/scan

# Stripe (from Stripe setup)
STRIPE_SECRET_KEY=sk_test_your-secret-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your-publishable-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Stripe Price IDs
NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID=price_your-monthly-price-id

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=SlabStak
```

### 4. Test Frontend

```bash
npm run dev
```

Visit http://localhost:3000 - you should see the SlabStak landing page.

---

## Testing

### 1. Start All Services

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Terminal 3 - Stripe Webhooks (for local testing):**
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhooks
```

### 2. Test User Flow

1. Visit http://localhost:3000
2. Click "Sign up" (if navigation exists) or go to http://localhost:3000/api/auth/signup
3. Create an account with email/password
4. Go to http://localhost:3000/scan
5. Upload a card image (test with any sports card photo)
6. Verify scan completes and returns data
7. Click "Save to vault"
8. Go to http://localhost:3000/vault
9. Verify card appears in vault

### 3. Test Subscription Flow

1. Go to http://localhost:3000/pricing
2. Click upgrade to Pro
3. Complete checkout with Stripe test card: `4242 4242 4242 4242`
4. Expiry: any future date
5. CVC: any 3 digits
6. ZIP: any 5 digits
7. Complete purchase
8. Verify redirect to account page
9. Check Supabase database - subscriptions table should have new row

### 4. Verify Database

In Supabase SQL Editor:
```sql
-- Check users
SELECT email FROM auth.users;

-- Check cards
SELECT player, set_name, created_at FROM cards;

-- Check subscriptions
SELECT u.email, s.plan, s.status
FROM subscriptions s
JOIN auth.users u ON u.id = s.user_id;
```

---

## Deployment

### Production Checklist

Before deploying to production:

- [ ] Update all environment variables to production values
- [ ] Change Stripe to live mode (remove `_test_` from keys)
- [ ] Update OpenAI to use production API key
- [ ] Set Supabase redirect URLs to production domain
- [ ] Update Stripe webhook endpoint to production URL
- [ ] Enable Supabase RLS policies
- [ ] Set up monitoring (Sentry, LogRocket, etc.)
- [ ] Configure custom domain
- [ ] Set up SSL/TLS certificates
- [ ] Test all flows in production environment

### Recommended Deployment Stack

- **Frontend**: Vercel (easiest for Next.js)
- **Backend**: Railway, Render, or Fly.io
- **Database**: Supabase (already set up)
- **Monitoring**: Sentry for errors, Plausible for analytics

### Frontend Deployment (Vercel)

```bash
cd frontend
npm install -g vercel
vercel login
vercel deploy --prod
```

Add all environment variables in Vercel dashboard.

### Backend Deployment

See backend README for Docker deployment instructions.

---

## Troubleshooting

### Backend won't start
- Check Python version: `python3 --version`
- Verify virtual environment is activated
- Check `.env` file has all required variables
- Test Tesseract: `tesseract --version`

### Frontend won't start
- Check Node version: `node --version`
- Delete `node_modules` and `package-lock.json`, run `npm install`
- Check `.env.local` file exists and has correct values
- Clear Next.js cache: `rm -rf .next`

### Scan fails
- Check backend is running on port 8000
- Verify `NEXT_PUBLIC_BACKEND_SCAN_URL` points to correct backend
- Check browser console for CORS errors
- Verify OpenAI API key is valid and has credits

### Image upload fails
- Check Supabase storage bucket exists and is public
- Verify bucket name is `card-images`
- Check user is authenticated
- Review browser console for errors

### Stripe webhook not working
- Verify Stripe CLI is running: `stripe listen --forward-to localhost:3000/api/stripe/webhooks`
- Check webhook secret is correct in `.env.local`
- Review Stripe dashboard > Developers > Webhooks > Events log

### Database connection issues
- Verify Supabase project is running (not paused)
- Check Supabase URL and anon key are correct
- Test connection in Supabase dashboard > API > URL & Keys
- Ensure RLS policies are set up correctly

---

## Need Help?

- Check the main README.md
- Review backend/README.md for backend-specific issues
- Review database/README.md for database issues
- Check Supabase logs in dashboard
- Check Vercel logs for frontend issues
- Review Stripe webhook events in dashboard

---

## Next Steps

Once everything is working:

1. Create your first admin user (see database/README.md)
2. Customize landing page copy and branding
3. Set up custom domain
4. Configure email templates in Supabase
5. Add analytics (Plausible, PostHog)
6. Set up error tracking (Sentry)
7. Plan your marketing and launch!

Good luck with SlabStak! 🚀
