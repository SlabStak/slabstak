# SlabStak Frontend

Next.js 14 + Supabase + Stripe frontend for SlabStak.

- Pages: landing, scan, vault, pricing, account
- API routes: /api/me, /api/cards, /api/stripe/create-checkout
- Expects a FastAPI backend at NEXT_PUBLIC_BACKEND_SCAN_URL with POST /scan.

Run dev:

```bash
npm install
npm run dev
```
