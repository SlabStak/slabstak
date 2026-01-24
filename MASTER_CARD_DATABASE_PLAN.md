# 🎯 Master Card Database Implementation Plan

**Objective:** Build a comprehensive sports card catalog that enables card matching, searching, browsing, and comparison.

**Priority:** ⭐⭐⭐⭐⭐ (MVP Blocker)

**Timeline Estimate:** 4-6 weeks

---

## 📋 PHASE 1: Database Schema Design

### 1.1 New Tables Required

```sql
-- Master card catalog (immutable reference data)
CREATE TABLE card_catalog (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Card identification
  player_name TEXT NOT NULL,
  set_name TEXT NOT NULL,
  card_number TEXT NOT NULL,

  -- Card metadata
  year INTEGER,
  sport TEXT NOT NULL, -- 'basketball', 'baseball', 'football', 'hockey', 'soccer'
  manufacturer TEXT, -- 'Topps', 'Panini', 'Leaf', etc

  -- Player info
  team TEXT,
  position TEXT,
  player_id TEXT, -- Reference to external sports database

  -- Card details
  card_type TEXT, -- 'base', 'rookie', 'parallel', 'insert', 'autograph', 'game-used'
  print_run INTEGER, -- Limited edition count
  is_parallel BOOLEAN DEFAULT FALSE,
  parallel_type TEXT, -- 'chrome', 'refractor', 'gold', etc

  -- Descriptions
  description TEXT,
  image_url TEXT, -- Official card image

  -- Unique identification
  unique_key TEXT NOT NULL UNIQUE, -- 'Topps-2003-LeBron-James-221'

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Indexes
  INDEX idx_player_name (player_name),
  INDEX idx_set_name (set_name),
  INDEX idx_year (year),
  INDEX idx_sport (sport),
  INDEX idx_manufacturer (manufacturer),
  INDEX idx_unique_key (unique_key),
  INDEX idx_full_text ON (player_name, set_name, team) -- For full-text search
);

-- Card value history (track price changes over time)
CREATE TABLE card_values_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id UUID NOT NULL REFERENCES card_catalog(id),

  -- Value data
  psa_10_value DECIMAL(10,2), -- Perfect grade value
  psa_9_value DECIMAL(10,2),
  psa_8_value DECIMAL(10,2),
  raw_value DECIMAL(10,2), -- Ungraded value

  -- Market data source
  source TEXT, -- 'ebay', 'tcgplayer', 'pwcc', 'cardmarket'

  -- Timestamp
  recorded_at TIMESTAMPTZ DEFAULT NOW(),

  INDEX idx_card_id (card_id),
  INDEX idx_recorded_at (recorded_at DESC)
);

-- Card sets (groupings of cards)
CREATE TABLE card_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  set_name TEXT NOT NULL UNIQUE,
  manufacturer TEXT NOT NULL,
  year INTEGER NOT NULL,
  sport TEXT NOT NULL,

  total_cards INTEGER, -- How many cards in the set
  description TEXT,
  image_url TEXT, -- Set logo/image

  created_at TIMESTAMPTZ DEFAULT NOW(),

  INDEX idx_set_name (set_name),
  INDEX idx_year (year),
  INDEX idx_sport (sport)
);

-- User card matches (links user cards to catalog)
CREATE TABLE user_card_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  catalog_card_id UUID NOT NULL REFERENCES card_catalog(id),

  match_confidence DECIMAL(3,2), -- 0.0 - 1.0 confidence score
  matched_by TEXT, -- 'ai', 'user', 'admin'
  matched_at TIMESTAMPTZ DEFAULT NOW(),
  verified_by UUID REFERENCES auth.users(id), -- Admin verification

  INDEX idx_user_card_id (user_card_id),
  INDEX idx_catalog_card_id (catalog_card_id),
  INDEX idx_match_confidence (match_confidence DESC)
);
```

### 1.2 Schema Architecture

```
┌─────────────────────────────────────────┐
│      card_catalog (Master DB)           │
│  ├─ card_number                         │
│  ├─ player_name                         │
│  ├─ set_name                            │
│  ├─ year, sport, manufacturer           │
│  └─ unique_key                          │
└────────┬────────────────────────────────┘
         │ REFERENCES
         │
┌────────▼────────────────────────────────┐
│   user_card_matches (Link Table)        │
│  ├─ user_card_id → cards(id)           │
│  ├─ catalog_card_id → card_catalog(id) │
│  ├─ match_confidence (0.0-1.0)         │
│  └─ verified_by (admin)                │
└──────────────────────────────────────────┘
         │ REFERENCES
         │
┌────────▼────────────────────────────────┐
│      cards (User Vault) - EXISTING     │
│  ├─ player                              │
│  ├─ set_name                            │
│  └─ image_url                           │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│    card_values_history (Price Tracking) │
│  ├─ card_id → card_catalog(id)         │
│  ├─ psa_10_value, psa_9_value, etc     │
│  └─ recorded_at (historical)           │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│       card_sets (Organization)          │
│  ├─ set_name                            │
│  ├─ year, manufacturer, sport           │
│  └─ total_cards                         │
└──────────────────────────────────────────┘
```

---

## 📊 PHASE 2: Data Sourcing Strategy

### 2.1 Recommended Approach (Hybrid)

```
TIER 1: Licensed Data (Best)
├─ TCGPlayer API (basketball, baseball)
├─ Cost: $50-500/month (tiered)
├─ Coverage: 90%+ of modern cards
└─ Quality: Official, updated

TIER 2: Manual + Community (Free but slow)
├─ Start with specific popular sets
├─ User contributions
├─ Community verification
└─ Gradual expansion

TIER 3: Web Scraping (Legal Risk)
├─ Use where licensed data unavailable
├─ Respect robots.txt
├─ Cache aggressively
└─ Add attribution links

TIER 4: Sports Data APIs
├─ ESPN, NBA, MLB APIs for player info
├─ Link players to cards
└─ Auto-populate team/position
```

### 2.2 Phase 2A: Seed Data (Start Small)

**Start with highest-demand cards:**
- 1986-87 Fleer (Michael Jordan rookie)
- 2003-04 Topps (LeBron James rookie)
- 2020-21 Panini (Zion Williamson)
- Modern sets (last 5 years)

**Manual data entry approach:**
1. Create admin UI for data entry
2. Community sourcing via form
3. Admin verification workflow
4. ~1000 cards to start

**Estimated time:** 2-3 weeks

### 2.3 Phase 2B: API Integration

```python
# Pseudo code for data pipeline

async def import_from_tcgplayer():
    """Fetch card data from TCGPlayer API"""
    sets = await tcgplayer_api.get_sets()
    for set_id in sets:
        cards = await tcgplayer_api.get_cards(set_id)
        for card in cards:
            await save_to_card_catalog(
                player_name=card['playerName'],
                set_name=card['setName'],
                card_number=card['cardNumber'],
                year=card['year'],
                unique_key=f"{card['manufacturer']}-{card['year']}-{card['playerName']}-{card['cardNumber']}"
            )

async def sync_market_values():
    """Update card values from multiple sources"""
    cards = await card_catalog.get_all()
    for card in cards:
        ebay_value = await get_ebay_value(card)
        tcgplayer_value = await get_tcgplayer_value(card)

        await card_values_history.insert(
            card_id=card.id,
            source='ebay',
            raw_value=ebay_value
        )
```

---

## 🔍 PHASE 3: Search & Discovery

### 3.1 Full-Text Search Implementation

```sql
-- Add full-text search indexes
CREATE INDEX idx_card_search ON card_catalog
USING GIN (
  to_tsvector('english',
    player_name || ' ' ||
    set_name || ' ' ||
    COALESCE(team, '')
  )
);

-- Search query example
SELECT * FROM card_catalog
WHERE to_tsvector('english',
  player_name || ' ' || set_name
) @@ plainto_tsquery('english', 'jordan fleer');
```

### 3.2 Browse API Endpoints Needed

```typescript
// GET /api/catalog/search
// Query: ?q=LeBron&sport=basketball&year=2003

// GET /api/catalog/sets
// List all sets with filters

// GET /api/catalog/sets/:setId/cards
// Get all cards in a set

// GET /api/catalog/players/:playerName
// Get all cards for a player

// GET /api/catalog/card/:cardId
// Get single card details

// POST /api/catalog/match
// Match user card to catalog card
// Body: { userCardId, catalogCardId, confidence }
```

### 3.3 UI Components Needed

```
Pages:
├─ /catalog - Browse all cards
├─ /catalog/search - Search results
├─ /catalog/sets - Browse by set
├─ /catalog/players/:name - Player cards
├─ /catalog/card/:id - Card details
└─ /catalog/year/:year - Browse by year

Components:
├─ CardSearchBar
├─ CardFilters
├─ CardGrid (browse results)
├─ CardDetail (single card)
├─ SetBrowser
├─ CardComparison
└─ MatchSuggestions
```

---

## 🤖 PHASE 4: AI Card Matching

### 4.1 Matching Algorithm

```python
async def match_user_card_to_catalog(user_card_id: str):
    """
    Match a user's scanned card to the master catalog
    """
    user_card = await get_user_card(user_card_id)

    # Step 1: Extract info from scan
    ai_result = await ai_service.analyze_card(user_card.image_url)
    player_name = ai_result.player_name
    set_name = ai_result.set_name
    year = ai_result.year

    # Step 2: Search catalog
    candidates = await card_catalog.search(
        player_name=player_name,
        set_name=set_name,
        year=year,
        limit=10
    )

    if not candidates:
        return None

    # Step 3: Rank by confidence
    best_match = max(candidates,
        key=lambda c: calculate_match_score(ai_result, c)
    )

    # Step 4: Store match with confidence
    confidence = calculate_match_score(ai_result, best_match)

    await user_card_matches.insert(
        user_card_id=user_card_id,
        catalog_card_id=best_match.id,
        match_confidence=confidence,
        matched_by='ai'
    )

    return best_match

def calculate_match_score(ai_result, catalog_card) -> float:
    """Calculate confidence score 0.0 - 1.0"""
    score = 0.0

    # Player name match (40%)
    if ai_result.player_name.lower() == catalog_card.player_name.lower():
        score += 0.40
    elif levenshtein_distance(...) < 2:
        score += 0.30

    # Set name match (35%)
    if ai_result.set_name.lower() == catalog_card.set_name.lower():
        score += 0.35

    # Year match (15%)
    if ai_result.year == catalog_card.year:
        score += 0.15

    # Card number match (10%)
    if ai_result.card_number == catalog_card.card_number:
        score += 0.10

    return min(1.0, score)
```

### 4.2 Manual Verification UI

```typescript
// Component for users/admins to verify/correct matches
<CardMatchVerification
  userCard={userCard}
  suggestedMatch={catalogCard}
  confidence={0.87}
  onConfirm={() => acceptMatch()}
  onReject={() => showAlternatives()}
  onManualSelect={() => openCatalogSearch()}
/>
```

---

## 📈 PHASE 5: Integration with Existing System

### 5.1 Changes to User Cards

When user uploads a card:

```
1. User scans card (existing)
   ↓
2. AI analyzes image (existing)
   ↓
3. NEW: Match to catalog
   ├─ Auto-match if confidence > 0.85
   ├─ Show suggestions if 0.60-0.85
   └─ Manual select if < 0.60
   ↓
4. NEW: Link user_card → catalog_card
   ├─ Store match_confidence
   ├─ Enable comparisons
   └─ Track match edits
   ↓
5. Show comparison to market data (existing)
```

### 5.2 Updated Card Detail View

```
BEFORE:
├─ Player: [AI guess]
├─ Set: [AI guess]
├─ Grade: [AI guess]
└─ Value: [eBay lookup]

AFTER:
├─ Player: [Catalog ✓]
├─ Set: [Catalog ✓]
├─ Card #: [Catalog ✓]
├─ Grade: [AI estimate]
├─ Condition: [User assessed]
├─ Market Values:
│  ├─ Raw: $50-100 (eBay average)
│  ├─ PSA 10: $500-1000 (from history)
│  ├─ PSA 9: $250-500
│  └─ PSA 8: $100-250
├─ Similar Sales:
│  ├─ PSA 9 sold for $480 on 12/15
│  ├─ Raw sold for $75 on 12/10
│  └─ PSA 10 sold for $950 on 12/05
└─ Comparisons:
   ├─ 5 other users have this card
   ├─ Average price paid: $60
   ├─ Your card estimated: $85
   └─ Market trend: ↑ +15% (6 months)
```

---

## 💾 IMPLEMENTATION ORDER

### Week 1: Database & Schema
- [ ] Create migration for new tables
- [ ] Create card_catalog table
- [ ] Create card_values_history table
- [ ] Create card_sets table
- [ ] Create user_card_matches table
- [ ] Add indexes
- [ ] Test schema

### Week 2: Seed Data & Admin UI
- [ ] Create admin data entry form
- [ ] Build CSV import tool
- [ ] Manually enter 500-1000 popular cards
- [ ] Create admin verification dashboard
- [ ] Test data integrity

### Week 3: Search & API
- [ ] Build search API endpoints
- [ ] Implement full-text search
- [ ] Create browse endpoints
- [ ] Add filtering/sorting
- [ ] Build search component

### Week 4: Card Matching
- [ ] Update card upload flow
- [ ] Implement matching algorithm
- [ ] Build match suggestion UI
- [ ] Manual verification UI
- [ ] Test matching accuracy

### Week 5: Integration & Polish
- [ ] Update card detail pages
- [ ] Add comparisons
- [ ] Integrate market data
- [ ] Performance optimization
- [ ] Bug fixes

### Week 6: Launch & Monitoring
- [ ] Beta testing
- [ ] User feedback collection
- [ ] Data cleanup
- [ ] Deploy to production
- [ ] Monitor usage

---

## ✅ Success Metrics

```
MVP Success:
✓ 1000+ cards in catalog
✓ 85%+ match accuracy
✓ Search returns results in <500ms
✓ Browse works across devices
✓ Users can link cards to catalog

Growth Metrics:
✓ 80%+ of scans matched to catalog
✓ 500+ sets available
✓ 10,000+ unique cards
✓ Historical pricing for 5000+ cards
✓ User satisfaction > 4.0/5.0
```

---

## 🚀 Ready to Start?

This plan is ready for implementation. Next steps:
1. Review schema design
2. Confirm data sourcing approach
3. Set up database migration
4. Begin Week 1 tasks

**Estimated Total Cost:**
- Time: 4-6 weeks (1 dev)
- TCGPlayer API: $50-100/month
- Storage: ~2GB images ($5-10/month)
- **Total: ~$60-110/month recurring**

---

