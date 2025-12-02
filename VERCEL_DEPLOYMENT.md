# Vercel Deployment Guide for SlabStak

## Current Deployment

**Vercel Project:** slabstak-5hs7
**Deployment URL:** https://vercel.com/slabstaks-projects/slabstak-5hs7/3Kp9H1m5pwdKc25dHZqRrs4a879U

---

## Required Environment Variables

You need to configure these in your Vercel project settings:

### 1. Supabase Configuration (REQUIRED)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**How to get these:**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to Settings → API
4. Copy the values

### 2. Stripe Configuration (REQUIRED for payments)

```bash
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID=price_xxx
NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID=price_xxx
```

**How to get these:**
1. Go to https://dashboard.stripe.com
2. Get API keys from Developers → API keys
3. Create webhook endpoint pointing to: `https://your-domain.vercel.app/api/webhooks/stripe`
4. Create subscription products and copy price IDs

### 3. Backend API Configuration (REQUIRED for AI features)

```bash
NEXT_PUBLIC_BACKEND_SCAN_URL=https://your-backend-url.railway.app
```

**Options:**
- Deploy backend to Railway (recommended)
- Deploy backend to Render, Fly.io, or Docker container
- See `DEPLOYMENT_SUMMARY.md` for backend deployment instructions

### 4. App Configuration

```bash
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NEXT_PUBLIC_APP_NAME=SlabStak
NEXT_PUBLIC_ENABLE_DEALER_TOOLS=true
NEXT_PUBLIC_FREE_VAULT_LIMIT=10
NEXT_PUBLIC_PRO_VAULT_LIMIT=unlimited
```

---

## Step-by-Step Deployment Instructions

### Step 1: Configure Environment Variables in Vercel

1. Go to your Vercel project dashboard: https://vercel.com/slabstaks-projects/slabstak-5hs7
2. Click **Settings** → **Environment Variables**
3. Add all variables from the sections above
4. Set **Environment** to "Production" (and optionally "Preview" and "Development")
5. Click **Save**

### Step 2: Set Up Supabase Database

1. Create Supabase project at https://supabase.com
2. Run the SQL migrations in order:
   ```bash
   database/migrations/001_initial_schema.sql
   database/migrations/002_row_level_security.sql
   database/migrations/003_storage_setup.sql
   database/migrations/004_analytics.sql
   ```
3. Copy the connection details to Vercel environment variables

### Step 3: Configure Stripe

1. Create Stripe account at https://stripe.com
2. Create two products:
   - Pro Monthly ($29.99/month)
   - Pro Yearly ($299/year - optional)
3. Copy the price IDs
4. Set up webhook endpoint:
   - URL: `https://your-domain.vercel.app/api/webhooks/stripe`
   - Events to select:
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
5. Copy webhook secret to environment variables

### Step 4: Deploy Backend (Required for AI Features)

**Option A: Railway (Recommended)**
```bash
cd backend
railway login
railway init
railway up
```

**Option B: Docker**
```bash
cd backend
docker build -t slabstak-backend .
# Deploy to your container platform
```

Copy the backend URL to `NEXT_PUBLIC_BACKEND_SCAN_URL` in Vercel.

### Step 5: Trigger Redeployment

1. Go to Vercel project dashboard
2. Click **Deployments**
3. Click **...** on the latest deployment
4. Click **Redeploy**

Or push a new commit to trigger automatic deployment:
```bash
git commit --allow-empty -m "chore: Trigger Vercel redeploy with env vars"
git push origin main
```

### Step 6: Verify Deployment

1. Visit your production URL (shown in Vercel dashboard)
2. Test these features:
   - ✅ Homepage loads
   - ✅ Sign up works (creates Supabase user)
   - ✅ Login works
   - ✅ Vault page loads
   - ✅ Scan page loads (requires backend)
   - ✅ Pricing page shows Stripe checkout

---

## Troubleshooting Common Issues

### Issue: "Environment variable not found"
**Solution:** Double-check all environment variables are set in Vercel settings and redeploy.

### Issue: "Failed to connect to Supabase"
**Solution:**
- Verify Supabase URL and keys are correct
- Check that migrations have been run
- Verify RLS policies are enabled

### Issue: "Stripe checkout not working"
**Solution:**
- Ensure you're using live keys (not test keys) in production
- Verify price IDs are correct
- Check webhook is configured and receiving events

### Issue: "Card scanning not working"
**Solution:**
- Verify backend is deployed and running
- Check `NEXT_PUBLIC_BACKEND_SCAN_URL` points to correct URL
- Verify backend has OpenAI API key configured

### Issue: Build fails with "Module not found"
**Solution:**
- Ensure latest code with tsconfig.json fix is deployed
- Check that all dependencies are in package.json
- Try clearing Vercel build cache

---

## Post-Deployment Checklist

- [ ] All environment variables configured
- [ ] Supabase database migrations run
- [ ] Stripe products created and price IDs added
- [ ] Stripe webhook configured and verified
- [ ] Backend deployed (Railway/Docker)
- [ ] Homepage loads successfully
- [ ] User signup/login works
- [ ] Stripe checkout works
- [ ] Card scanning works (if backend deployed)
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active (automatic with Vercel)

---

## Monitoring and Maintenance

### Check Deployment Status
- Vercel Dashboard: https://vercel.com/slabstaks-projects/slabstak-5hs7
- Runtime Logs: Available in Vercel dashboard under deployment
- Analytics: Available in Vercel dashboard

### Database Monitoring
- Supabase Dashboard: https://supabase.com/dashboard
- Check API usage, storage, and database health

### Payment Monitoring
- Stripe Dashboard: https://dashboard.stripe.com
- Monitor subscriptions, revenue, failed payments

---

## Cost Estimates

### Free Tier Usage
- **Vercel:** Free for hobby projects (100GB bandwidth/month)
- **Supabase:** Free tier (500MB database, 1GB storage, 2GB bandwidth)
- **Railway:** $5/month credit (may cover backend)

### Expected Monthly Costs (with users)
- **Vercel Pro:** $20/month (if needed for team features)
- **Supabase Pro:** $25/month (if exceeding free tier)
- **Railway:** $5-20/month (based on backend usage)
- **OpenAI API:** $10-50/month (based on scanning volume)
- **Stripe:** 2.9% + 30¢ per transaction

**Total estimated:** $60-115/month (can start with ~$5-10/month on free tiers)

---

## Next Steps

1. **Configure all environment variables** in Vercel (see Step 1 above)
2. **Run database migrations** in Supabase
3. **Set up Stripe** products and webhook
4. **Deploy backend** to Railway or Docker
5. **Trigger redeploy** in Vercel
6. **Test all features** on production URL
7. **Set up custom domain** (optional)

---

## Support Resources

- **Vercel Docs:** https://vercel.com/docs
- **Supabase Docs:** https://supabase.com/docs
- **Stripe Docs:** https://stripe.com/docs
- **Railway Docs:** https://docs.railway.app
- **SlabStak Docs:** See `docs/` directory in repository

---

Generated: December 2, 2024
Status: Production Deployment In Progress
