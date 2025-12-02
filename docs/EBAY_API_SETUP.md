# eBay API Setup Guide

This guide walks you through setting up eBay API access for real market data in SlabStak.

## Overview

SlabStak uses the eBay Finding API to fetch completed (sold) listings for market intelligence. This provides real-world pricing data based on actual transactions.

## Prerequisites

- eBay account (free to create)
- eBay Developer account (free)
- Basic understanding of API keys

## Step 1: Create eBay Developer Account

1. Go to https://developer.ebay.com/
2. Click "Register" in the top right
3. Sign in with your eBay account (or create one)
4. Accept the Terms of Use
5. Complete your developer profile

## Step 2: Create an Application

1. Go to https://developer.ebay.com/my/keys
2. Click "Create an App"
3. Configure your application:

   **Application Title**: SlabStak Market Data

   **Application Purpose**: Select "For personal use" or "For business use"

   **Description**:
   ```
   Trading card market intelligence platform that fetches completed
   listings data to provide accurate pricing information for collectors
   and dealers.
   ```

4. Click "Create Application"

## Step 3: Get Your API Credentials

After creating your app, you'll see your credentials:

### Production Keys

- **App ID (Client ID)**: Copy this →  `EBAY_APP_ID`
- **Cert ID (Client Secret)**: Copy this → `EBAY_CERT_ID`
- **Dev ID**: Copy this → `EBAY_DEV_ID` (optional for Finding API)

### Sandbox Keys (for testing)

eBay also provides sandbox credentials for testing. You can use these initially.

## Step 4: Configure SlabStak Backend

1. Open `backend/.env` (or create from `.env.example`)

2. Add your eBay credentials:
   ```env
   EBAY_APP_ID=YourAppId-SlabStak-PRD-xxxxxxxxx-xxxxxxxx
   EBAY_CERT_ID=PRD-xxxxxxxxxxxxxxxxx-xxxxxxxx
   EBAY_DEV_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   ```

3. Save the file

## Step 5: Test the Integration

1. Start the backend server:
   ```bash
   cd backend
   source venv/bin/activate
   uvicorn main:app --reload
   ```

2. Visit http://localhost:8000/docs

3. Test the `/market` endpoint with:
   ```json
   {
     "player": "Mike Trout",
     "set_name": "2011 Topps Update",
     "year": 2011,
     "grade_estimate": "PSA 10"
   }
   ```

4. You should see real eBay data if configured correctly!

## API Limits

### Free Tier (Default)
- **5,000 calls per day**
- Perfect for starting out

### Commercial Tier
- Higher limits available
- Apply at https://developer.ebay.com/api-access

For most SlabStak users, the free tier is more than sufficient.

## How It Works

SlabStak uses the eBay Finding API to:

1. **Search for completed listings** matching card criteria
2. **Filter to sold items only** (real market data)
3. **Extract pricing information** from recent sales
4. **Calculate statistics**:
   - Floor price (10th percentile)
   - Average price (mean)
   - Ceiling price (90th percentile)
   - Confidence score based on sample size

## Search Query Construction

SlabStak builds search queries like:
- "Mike Trout 2011 Topps Update PSA 10"
- "Shohei Ohtani 2018 Topps Chrome PSA 9"
- "LeBron James 2003 Topps Rookie"

The more specific the search, the better the results.

## Fallback Behavior

If eBay API is not configured or fails:
- SlabStak automatically falls back to **simulated data**
- No errors shown to users
- You can still test the application
- Simulated data is marked clearly in responses

## Troubleshooting

### "eBay provider not enabled"

**Cause**: `EBAY_APP_ID` not found in environment

**Solution**:
1. Check `.env` file exists
2. Verify `EBAY_APP_ID` is set
3. Restart backend server

### "eBay auth failed"

**Cause**: Invalid credentials

**Solution**:
1. Double-check App ID and Cert ID
2. Make sure you're using Production keys (not Sandbox)
3. Verify keys are copied exactly (no spaces)

### "No comps returned"

**Cause**: Search query too specific or no recent sales

**Solution**:
- Try broader search (e.g., remove grade)
- Check eBay directly to verify sales exist
- Ensure card details are accurate

### Rate Limit Errors

**Cause**: Exceeded 5,000 calls/day

**Solution**:
- Implement caching (see Phase 3)
- Apply for higher limits
- Optimize query patterns

## Best Practices

### 1. Cache Results

Cache market data for:
- Same card within 24 hours
- Avoid redundant API calls
- Faster response times

### 2. Handle Errors Gracefully

Always have a fallback:
```python
try:
    data = await ebay_provider.get_snapshot(...)
except:
    data = await simulated_provider.get_snapshot(...)
```

### 3. Monitor Usage

Track your API calls:
- eBay provides usage dashboards
- Set up alerts at 80% of limit
- Consider upgrading if consistently high

### 4. Optimize Queries

More specific = better results:
- Include year when possible
- Include grade for graded cards
- Use consistent naming (PSA 10, not Gem Mint 10)

## Advanced Features

### Multiple Providers

SlabStak supports multiple market data providers:
- eBay (implemented)
- TCGPlayer (future)
- 130point (future)
- PWCCMarketplace (future)

### Provider Selection

Users can request specific providers:
```json
{
  "player": "Mike Trout",
  "set_name": "2011 Topps",
  "provider": "ebay"
}
```

Or use automatic fallback:
```json
{
  "player": "Mike Trout",
  "set_name": "2011 Topps",
  "provider": "auto"
}
```

## Sample Response

```json
{
  "source": "ebay",
  "currency": "USD",
  "floor": 180.50,
  "average": 245.75,
  "ceiling": 325.00,
  "listings_count": 42,
  "confidence": "high",
  "last_updated": "2025-12-01T20:30:00Z",
  "comps": [
    {
      "title": "Mike Trout 2011 Topps Update PSA 10 Gem Mint",
      "price": 250.00,
      "sold_date": "2025-11-28T14:22:00Z",
      "condition": "New",
      "grade": "PSA 10",
      "url": "https://www.ebay.com/itm/...",
      "source": "ebay"
    }
    // ... more comps
  ]
}
```

## Resources

- **eBay Developer Portal**: https://developer.ebay.com/
- **API Documentation**: https://developer.ebay.com/DevZone/finding/Concepts/FindingAPIGuide.html
- **Support Forum**: https://community.ebay.com/t5/Developer-Forums/ct-p/developer
- **Rate Limits**: https://developer.ebay.com/support/kb-article?KBid=4969

## Security Notes

⚠️ **Never commit API keys to git**
✅ Always use environment variables
✅ Add `.env` to `.gitignore`
✅ Rotate keys if accidentally exposed
✅ Use different keys for dev/prod

## Next Steps

After setting up eBay:

1. **Test with various cards** to verify accuracy
2. **Implement caching** to reduce API calls (Phase 3)
3. **Add TCGPlayer** for trading card games (Phase 3)
4. **Monitor costs** and usage patterns
5. **Consider premium tier** if needed

---

**You're now ready to provide real market intelligence!** 🎉
