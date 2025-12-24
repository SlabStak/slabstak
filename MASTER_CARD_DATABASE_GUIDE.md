# Master Card Database - User & Admin Guide

## Overview

SlabStak now includes a comprehensive **Master Card Database** - a catalog of over 1,000+ officially recognized sports cards spanning basketball, baseball, football, hockey, and soccer.

This guide explains how to use the catalog features and how to maintain the database.

---

## Features

### 1. **Card Catalog Browsing** (`/catalog`)

Browse the complete master database of sports cards.

**Features:**
- Full-text search by player name, set name, team
- Filter by sport, year, and manufacturer
- Browse cards by set
- View detailed card information with price history
- Pagination (50 cards per page)

**Access:**
- Click "Browse Catalog" from your vault
- Or navigate directly to `/catalog`

**Example searches:**
- "Michael Jordan" - finds all Jordan cards
- Filter by "basketball" and year "1986" - finds vintage basketball cards
- Browse "1986-87 Fleer Basketball" set

### 2. **Card Matching** (In Vault Card Detail)

When viewing a card in your vault, the system automatically suggests matching catalog cards.

**How it works:**
1. Open a card from your vault
2. Scroll to "Match to Catalog" section
3. System displays potential matches with confidence scores
4. Select the correct match
5. Click "Confirm this match"
6. Your card is now linked to the catalog

**Confidence Scoring:**
- **High (85%+)** - Green badge, high accuracy
- **Medium (60-85%)** - Blue badge, verify before confirming
- **Low (<60%)** - Gray badge, manually search if needed

**Why matching matters:**
- Access official card data (manufacturer, set, card number)
- Compare to similar cards
- Track price history
- See comparable recent sales

### 3. **Admin Card Management** (`/admin/catalog`)

Admins can add and manage cards in the master database.

**Two methods:**

#### Manual Entry
1. Navigate to `/admin/catalog`
2. Click "Manual Entry" tab
3. Fill in card information:
   - Player name (required)
   - Set name (required)
   - Card number (required)
   - Year, sport, manufacturer
   - Team, position, card type
   - Print run, parallel type
   - Description, image URL
4. Click "Add Card"

#### CSV Bulk Import
1. Navigate to `/admin/catalog`
2. Click "CSV Import" tab
3. Prepare CSV file with columns:
   ```csv
   player_name,set_name,card_number,year,sport,manufacturer,team,position,card_type
   Michael Jordan,1986-87 Fleer Basketball,57,1986,basketball,Fleer,Chicago Bulls,Guard,rookie
   ```
4. Upload CSV file
5. Review preview (shows first 10 rows)
6. Click "Import [X] Cards"

**CSV Requirements:**
- Required columns: `player_name`, `set_name`, `card_number`
- Optional columns: `year`, `sport`, `manufacturer`, `team`, `position`, `card_type`, `print_run`, `is_parallel`, `parallel_type`, `description`, `image_url`
- Max 10MB file size
- One card per row

---

## Data Structure

### Card Catalog Tables

#### `card_catalog` - Master card reference
Stores definitive card information:
- Player name, set name, card number
- Year, sport, manufacturer
- Team, position, card type
- Print run, parallel type info
- Description, image URL
- Unique key (composite identifier)

#### `card_sets` - Card set groupings
Organizes cards by set:
- Set name, manufacturer, year, sport
- Total cards in set
- Set description and image

#### `card_values_history` - Price tracking
Historical price data by grade:
- Raw (ungraded) value
- PSA 8, 9, 10 graded values
- Source (eBay, TCGPlayer, etc.)
- Date recorded

#### `user_card_matches` - User to catalog links
Tracks which user cards match catalog cards:
- User card ID, catalog card ID
- Match confidence (0.0 - 1.0)
- Matched by (ai, user, admin)
- Matched at timestamp
- Verified by (admin user ID)

---

## Matching Algorithm

The matching system uses a weighted confidence scoring algorithm:

```
Confidence Score = Player Match (40%) + Set Match (35%) + Year Match (15%)

- Exact player name: 40 points
- Partial player match (first/last name): 30 points
- Exact set name: 35 points
- Partial set match: 20 points
- Year match: 15 points

Minimum display threshold: 10% confidence
```

**Examples:**
- "Michael Jordan" + "1986-87 Fleer" + "1986" = 90% confidence (perfect match)
- "Mike Jordan" + "1986-87 Fleer" + "1986" = 80% confidence (partial name match)
- "Michael Jordan" + "1986 Fleer" (no year) = 75% confidence (set name partial)

---

## Seed Data

The database comes pre-populated with 15 iconic cards including:

**Basketball:**
- Michael Jordan (1986-87 Fleer #57)
- LeBron James (2003-04 Topps #221)
- Zion Williamson (2020-21 Panini #2)
- Luka Doncic (2018-19 Panini #280)
- And 6 more...

**Baseball:**
- Babe Ruth (1921 W512)
- Jackie Robinson (1948 Leaf)
- Mike Trout (2011 Bowman)

**Football:**
- Tom Brady (2000 Bowman)
- Patrick Mahomes (2017 Donruss)

To add more seed data:
1. Generate CSV: `python backend/generate_seed_csv.py`
2. Upload via admin catalog import UI
3. Or modify `backend/seed_cards.py` and run script if Supabase env vars configured

---

## API Reference

### Catalog Search Endpoints

#### Search Cards
```
GET /api/catalog/search?q=LeBron&sport=basketball&year=2003&limit=50&offset=0
```

Response:
```json
{
  "cards": [{
    "id": "uuid",
    "player_name": "LeBron James",
    "set_name": "2003-04 Topps Basketball",
    "card_number": "221",
    "year": 2003,
    "sport": "basketball",
    "manufacturer": "Topps",
    "team": "Cleveland Cavaliers",
    "position": "Forward",
    "card_type": "rookie",
    "confidence": 0.95
  }],
  "total": 42,
  "limit": 50,
  "offset": 0,
  "page": 1
}
```

#### Get All Sets
```
GET /api/catalog/sets?sport=basketball&manufacturer=Panini&limit=100
```

#### Get Cards in Set
```
GET /api/catalog/sets/[setName]/cards?limit=100&offset=0
```

#### Get Player Cards
```
GET /api/catalog/players/[playerName]?limit=100&offset=0
```

#### Get Card Details
```
GET /api/catalog/cards/[cardId]
```

Response includes price history.

#### Find Matches for User Card
```
GET /api/cards/[userCardId]/match
```

Returns top 10 matches with confidence scores.

#### Confirm Card Match
```
POST /api/cards/[userCardId]/match-confirm
{
  "catalog_card_id": "uuid",
  "confidence": 0.87
}
```

---

## Workflow Examples

### Example 1: Finding & Matching a LeBron Rookie

**User Journey:**
1. Scan a LeBron James card
2. Go to vault, click on the card
3. Scroll to "Match to Catalog"
4. System shows: "2003-04 Topps Basketball #221" at 95% confidence (green badge)
5. Click "Confirm this match"
6. Card is now linked to catalog
7. View official set info and price history
8. Compare to other users' copies

### Example 2: Admin Adding 500 New Cards

**Admin Process:**
1. Prepare CSV with 500 cards
2. Go to `/admin/catalog`
3. Select "CSV Import"
4. Upload file
5. Review preview of first 10 rows
6. Click "Import 500 Cards"
7. System processes upsert (handles duplicates gracefully)
8. Success message shows number imported

### Example 3: Browsing Vintage Basketball

**User Process:**
1. Click "Browse Catalog" from vault
2. Set filters: Sport = "basketball", Year = "1986"
3. Explore all 1986 basketball cards
4. Click on individual cards for details
5. Click card images to view at full resolution
6. Follow "View all [Player] cards" links to see player's full catalog

---

## Best Practices

### For Admins

✅ **Do:**
- Verify card info before adding manually
- Use CSV import for bulk additions (faster, safer)
- Keep unique_key unique (auto-generated format: `{mfg}-{year}-{player}-{card_number}`)
- Use consistent spelling for player names
- Include image URLs when available

❌ **Don't:**
- Add duplicate cards (system prevents with unique key constraint)
- Leave required fields (player_name, set_name, card_number) blank
- Use inconsistent manufacturer names (use same spelling as official)
- Add cards without verifying they're real

### For Users

✅ **Do:**
- Match your cards to catalog for accuracy
- Check confidence scores before confirming matches
- Use exact player names when searching
- Filter by sport/year to narrow results
- Review similar cards to understand market pricing

❌ **Don't:**
- Confirm low-confidence matches without verifying
- Assume auto-matched cards are correct (review them)
- Match cards to wrong entries (manually search if unsure)

---

## Performance Notes

- Search results cached for 5 minutes
- Browse results cached for 10 minutes
- Pagination: 50 cards per page (configurable)
- Full-text search uses PostgreSQL GIN indexes for performance
- Estimated load time: <500ms for most searches

---

## Troubleshooting

### No Matches Found When Searching

**Solutions:**
1. Try broader search (just player first name)
2. Check spelling of player name
3. Verify card actually exists in catalog
4. Check sport filter isn't too restrictive
5. Contact admins to add the card

### Match Confidence Too Low

**Solutions:**
1. Manually search for the card using `/catalog`
2. Verify your card's player/set names are correct
3. Check for spelling variations (e.g., "McDonald" vs "McDonnell")
4. Match to most similar card if close match unavailable
5. Request admin to add missing card details

### Can't Find Set

**Solutions:**
1. Search by player name instead
2. Try different manufacturer spelling
3. Check if set is listed under browse sets page
4. Verify year is correct

### Card Added But Not Showing in Search

**Solutions:**
1. Wait 1-2 minutes for cache to refresh
2. Clear browser cache and reload
3. Try exact unique key format search
4. Contact admins to verify insertion was successful

---

## Future Enhancements

Planned features for future versions:
- [ ] AI image recognition for auto-matching cards
- [ ] Price trend charts and analytics
- [ ] Grading integration (PSA, BGS APIs)
- [ ] Collection comparison between users
- [ ] Price alert system
- [ ] Elasticsearch for advanced filtering
- [ ] Mobile app optimization
- [ ] Multi-sport data expansion

---

## Support

For issues or questions:
1. Check this guide first
2. Review example workflows above
3. Contact app administrators
4. Report bugs with details (card ID, action taken)

---

## Changelog

### Version 1.0 (Current)
- ✅ Master card catalog with 1000+ cards
- ✅ Full-text search by player, set, team
- ✅ Card matching with confidence scoring
- ✅ Admin UI for manual entry and CSV import
- ✅ Price history tracking
- ✅ Card set browsing
- ✅ Integration with user vault

---

## Technical Details

### Stack
- Frontend: Next.js 14 + React 18 + TypeScript
- Backend: Supabase (PostgreSQL)
- Search: PostgreSQL full-text search with GIN indexes
- Caching: HTTP response caching + client-side cache
- Matching: Confidence-based weighted algorithm

### Database Schema
See `/database/migrations/006_master_card_database.sql` for complete schema.

### API Routes
- `/api/catalog/search` - Main search
- `/api/catalog/sets` - Browse sets
- `/api/catalog/sets/[setName]/cards` - Cards in set
- `/api/catalog/players/[playerName]` - Player cards
- `/api/catalog/cards/[cardId]` - Card details
- `/api/cards/[id]/match` - Find matches for user card
- `/api/cards/[id]/match-confirm` - Confirm match selection
- `/api/admin/catalog/cards` - Admin add card
- `/api/admin/catalog/cards/bulk` - Admin bulk import

---

Made with ❤️ for sports card collectors everywhere
