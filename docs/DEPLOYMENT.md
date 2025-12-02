# SlabStak Deployment Guide

This guide covers deploying SlabStak to production.

## Overview

SlabStak consists of three main components:
1. **Frontend** (Next.js) → Vercel
2. **Backend** (FastAPI) → Railway/Render/Fly.io
3. **Database** (PostgreSQL) → Supabase

## Pre-Deployment Checklist

- [ ] All features tested locally
- [ ] Database migrations run on production Supabase
- [ ] Environment variables documented
- [ ] Stripe set to live mode
- [ ] OpenAI API budget limits set
- [ ] Custom domain configured (optional)
- [ ] SSL certificates ready
- [ ] Monitoring tools set up

---

## Frontend Deployment (Vercel)

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Login to Vercel

```bash
vercel login
```

### 3. Deploy from Frontend Directory

```bash
cd frontend
vercel deploy --prod
```

### 4. Configure Environment Variables

In Vercel Dashboard → Project → Settings → Environment Variables, add:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_BACKEND_SCAN_URL=https://your-backend.railway.app/scan
STRIPE_SECRET_KEY=sk_live_your_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret
NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID=price_live_your_id
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### 5. Configure Custom Domain (Optional)

1. Vercel Dashboard → Project → Settings → Domains
2. Add your domain (e.g., slabstak.com)
3. Follow DNS configuration instructions

### 6. Redeploy

```bash
vercel deploy --prod
```

---

## Backend Deployment (Railway)

### Using Railway (Recommended)

1. **Install Railway CLI:**
```bash
npm install -g @railway/cli
```

2. **Login:**
```bash
railway login
```

3. **Initialize Project:**
```bash
cd backend
railway init
```

4. **Add Environment Variables:**
```bash
railway variables set OPENAI_API_KEY=sk-your-key
railway variables set ASSISTANT_ID=asst_your-id
railway variables set ALLOWED_ORIGIN=https://yourdomain.com
railway variables set TESSERACT_CMD=/usr/bin/tesseract
railway variables set ENVIRONMENT=production
```

5. **Deploy:**
```bash
railway up
```

6. **Get URL:**
```bash
railway open
```

Copy the URL and update `NEXT_PUBLIC_BACKEND_SCAN_URL` in Vercel.

### Alternative: Docker Deployment

For Render, Fly.io, or any Docker host:

```bash
cd backend
docker build -t slabstak-backend .
docker run -p 8000:8000 --env-file .env slabstak-backend
```

---

## Database (Supabase)

### Production Database Setup

1. **Use the same Supabase project** (or create a separate production one)
2. **Run migrations** in production:
   - Go to Supabase SQL Editor
   - Run all migration files in order
3. **Configure Row Level Security**
4. **Set up Storage bucket** (card-images)
5. **Update Auth URLs:**
   - Site URL: `https://yourdomain.com`
   - Redirect URLs: `https://yourdomain.com/**`

---

## Stripe Production Setup

### 1. Switch to Live Mode

In Stripe Dashboard, toggle from Test to Live mode.

### 2. Create Live Products

Recreate your products and prices in live mode:
- SlabStak Pro Monthly: $9.99/month
- Copy the live Price IDs

### 3. Update Webhook

1. Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/stripe/webhooks`
3. Select events:
   - checkout.session.completed
   - customer.subscription.updated
   - customer.subscription.deleted
   - invoice.payment_succeeded
   - invoice.payment_failed
4. Copy new webhook secret
5. Update `STRIPE_WEBHOOK_SECRET` in Vercel

### 4. Update Environment Variables

Replace all test keys with live keys in Vercel:
- `STRIPE_SECRET_KEY=sk_live_...`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...`
- `STRIPE_WEBHOOK_SECRET=whsec_...`
- `NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID=price_live_...`

---

## Post-Deployment

### 1. Test Production Environment

- [ ] Visit production URL
- [ ] Sign up with real email
- [ ] Verify email confirmation works
- [ ] Upload and scan a card
- [ ] Save to vault
- [ ] Test subscription upgrade
- [ ] Complete real purchase with real card
- [ ] Verify webhook events in Stripe
- [ ] Test cancellation flow

### 2. Set Up Monitoring

**Sentry (Error Tracking):**
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

**Vercel Analytics:**
Already included, just enable in dashboard.

**Uptime Monitoring:**
- UptimeRobot (free)
- Pingdom
- Better Uptime

### 3. Configure Email

In Supabase:
1. Go to Authentication → Email Templates
2. Customize confirmation, password reset emails
3. Add your branding

For transactional emails, consider:
- Resend
- SendGrid
- Postmark

### 4. Set Up Backups

Supabase provides daily backups automatically. For extra safety:
```bash
# Manual backup
pg_dump your_connection_string > backup.sql
```

### 5. Performance Optimization

- Enable Vercel Edge Functions for faster responses
- Configure caching headers
- Optimize images with Next.js Image component
- Enable Redis for caching (future enhancement)

---

## Scaling Considerations

### When to Scale

Monitor these metrics:
- Response times > 2 seconds
- Error rates > 1%
- Database CPU > 80%
- OpenAI API costs

### Scaling Options

**Frontend:**
- Vercel automatically scales
- Consider Edge Functions for global performance

**Backend:**
- Railway: Increase instance size
- Add more workers: `--workers 4`
- Implement caching layer (Redis)

**Database:**
- Supabase: Upgrade plan for more resources
- Add read replicas if needed
- Optimize queries and add indexes

**OpenAI:**
- Implement caching for repeat cards
- Use GPT-3.5-turbo for initial scans, GPT-4 for edge cases
- Batch similar requests

---

## Cost Estimates

### Monthly Costs (100 active users)

| Service | Plan | Cost |
|---------|------|------|
| Vercel | Pro | $20 |
| Railway | Starter | $5-20 |
| Supabase | Pro | $25 |
| OpenAI | Pay-as-you-go | $50-200 |
| Stripe | Transaction fees | 2.9% + $0.30 per transaction |
| **Total** | | **~$100-265/month** |

### Revenue Breakeven

At $9.99/month per Pro user:
- Need ~10-27 paying subscribers to break even
- Target: 50+ paying users for profitability

---

## Troubleshooting Production Issues

### Frontend Issues

**Check Vercel Logs:**
```bash
vercel logs
```

**Common Issues:**
- Environment variables not set
- Build failures (check build logs)
- API route timeouts (increase timeout in vercel.json)

### Backend Issues

**Check Railway Logs:**
```bash
railway logs
```

**Common Issues:**
- Memory limits exceeded (increase instance size)
- Tesseract not found (install in Dockerfile)
- CORS errors (check ALLOWED_ORIGIN)

### Database Issues

**Check Supabase Logs:**
- Supabase Dashboard → Logs
- Monitor query performance
- Check connection pool limits

---

## Security Checklist

- [ ] All secrets in environment variables (not in code)
- [ ] Supabase RLS policies enabled
- [ ] CORS configured correctly
- [ ] Rate limiting enabled (if applicable)
- [ ] Webhook signatures verified
- [ ] User input validated
- [ ] SQL injection prevented (Supabase handles this)
- [ ] XSS prevented (React handles this)
- [ ] HTTPS only in production
- [ ] Security headers configured

---

## Rollback Plan

If deployment fails:

1. **Vercel:** Revert to previous deployment
   ```bash
   vercel rollback
   ```

2. **Railway:** Redeploy previous version
   ```bash
   railway up --previous
   ```

3. **Database:** Restore from backup (Supabase dashboard)

---

## Maintenance

### Weekly

- Check error logs in Sentry
- Monitor Stripe webhook events
- Review OpenAI API usage and costs

### Monthly

- Review Vercel/Railway usage and costs
- Check database size and performance
- Update dependencies:
  ```bash
  npm audit fix
  pip list --outdated
  ```

### Quarterly

- Security audit
- Performance review
- User feedback analysis
- Feature prioritization

---

## Support & Monitoring

### Dashboards to Monitor

- Vercel: https://vercel.com/dashboard
- Railway: https://railway.app
- Supabase: https://supabase.com/dashboard
- Stripe: https://dashboard.stripe.com
- OpenAI: https://platform.openai.com/usage

### Alerts to Configure

- Server errors (Sentry)
- Payment failures (Stripe webhooks)
- API rate limits (OpenAI)
- Database CPU > 80% (Supabase)
- Downtime (UptimeRobot)

---

## Launch Checklist

Before announcing publicly:

- [ ] All production tests passed
- [ ] Monitoring and alerts configured
- [ ] Legal pages (Privacy Policy, Terms of Service)
- [ ] Support email configured
- [ ] Social media accounts created
- [ ] Landing page optimized
- [ ] SEO meta tags added
- [ ] Analytics configured
- [ ] Backup strategy tested
- [ ] Rollback plan documented
- [ ] Customer support process defined

---

Ready to launch SlabStak! 🚀
