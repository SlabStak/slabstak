-- SlabStak Database Migration
-- 007: User-to-User Marketplace
-- Enables users to list, browse, and purchase cards from each other

-- Listings table (user cards for sale)
CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Listing basics
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
  catalog_card_id UUID REFERENCES card_catalog(id),

  -- Listing status
  status TEXT NOT NULL DEFAULT 'active', -- active, sold, delisted

  -- Pricing
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2), -- what seller paid

  -- Card details (denormalized for fast search)
  player_name TEXT NOT NULL,
  set_name TEXT NOT NULL,
  card_number TEXT,
  year INTEGER,
  sport TEXT,
  condition TEXT, -- poor, fair, good, very good, near mint, mint
  grade TEXT, -- PSA 8, PSA 9, PSA 10, raw, etc

  -- Shipping details
  shipping_method TEXT, -- standard, priority, express, local_pickup
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  ships_to_countries TEXT[] DEFAULT ARRAY['US'], -- ISO country codes

  -- Description & images
  description TEXT,
  image_url TEXT, -- primary listing image
  additional_images TEXT[], -- array of image URLs

  -- Seller info (denormalized)
  seller_name TEXT,
  seller_rating DECIMAL(3,2),

  -- Activity tracking
  views_count INTEGER DEFAULT 0,
  favorites_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- auto-delist after X days

  -- For indexing
  search_vector TSVECTOR
);

-- Orders table (purchase history)
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Related entities
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending', -- pending, paid, shipped, delivered, completed, cancelled, disputed

  -- Pricing breakdown
  item_price DECIMAL(10,2) NOT NULL,
  shipping_cost DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2) NOT NULL DEFAULT 0, -- 10% fee
  taxes DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,

  -- Stripe payment info
  stripe_payment_intent_id TEXT UNIQUE,
  payment_status TEXT, -- unpaid, paid, refunded

  -- Escrow status
  escrow_status TEXT DEFAULT 'pending', -- pending, held, released, refunded
  escrow_released_at TIMESTAMPTZ,

  -- Shipping
  tracking_number TEXT,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Order messages (buyer-seller communication)
CREATE TABLE IF NOT EXISTS order_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relationships
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Message content
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'text', -- text, image, shipping_update

  -- Metadata
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Transactions table (payment ledger)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Related entities
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Transaction details
  transaction_type TEXT NOT NULL, -- sale, refund, fee, payout
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, failed

  -- Stripe reference
  stripe_transaction_id TEXT,

  -- Metadata
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Ratings & reviews
CREATE TABLE IF NOT EXISTS user_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relationship
  order_id UUID UNIQUE NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  rater_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rated_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Rating details
  rating DECIMAL(3,2) NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,

  -- Rating aspects
  communication_rating DECIMAL(3,2),
  shipping_rating DECIMAL(3,2),
  accuracy_rating DECIMAL(3,2),

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Favorites/Watchlist
CREATE TABLE IF NOT EXISTS listing_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relationship
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, listing_id)
);

-- Seller profiles (extended seller info)
CREATE TABLE IF NOT EXISTS seller_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relationship
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Seller info
  business_name TEXT,
  bio TEXT,
  profile_image_url TEXT,
  response_time TEXT, -- fast, moderate, slow
  response_rate DECIMAL(3,2), -- 0-100%

  -- Stats (denormalized from orders)
  total_sales INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2),
  lifetime_sales_volume DECIMAL(12,2) DEFAULT 0,

  -- Settings
  auto_accept_offers BOOLEAN DEFAULT FALSE,
  accept_returns BOOLEAN DEFAULT TRUE,
  return_window_days INTEGER DEFAULT 14,

  -- Verification
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_listings_seller_id ON listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_player_name ON listings(player_name);
CREATE INDEX IF NOT EXISTS idx_listings_set_name ON listings(set_name);
CREATE INDEX IF NOT EXISTS idx_listings_price ON listings(price);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_sport ON listings(sport);
CREATE INDEX IF NOT EXISTS idx_listings_condition ON listings(condition);
CREATE INDEX IF NOT EXISTS idx_listings_search ON listings USING GIN(search_vector);

CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_listing_id ON orders(listing_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_messages_order_id ON order_messages(order_id);
CREATE INDEX IF NOT EXISTS idx_order_messages_sender_id ON order_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_order_messages_is_read ON order_messages(is_read);

CREATE INDEX IF NOT EXISTS idx_user_ratings_order_id ON user_ratings(order_id);
CREATE INDEX IF NOT EXISTS idx_user_ratings_rated_user_id ON user_ratings(rated_user_id);
CREATE INDEX IF NOT EXISTS idx_user_ratings_rater_id ON user_ratings(rater_id);

CREATE INDEX IF NOT EXISTS idx_listing_favorites_user_id ON listing_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_listing_favorites_listing_id ON listing_favorites(listing_id);

CREATE INDEX IF NOT EXISTS idx_seller_profiles_verified ON seller_profiles(verified);

-- Create full-text search index for listings
CREATE INDEX IF NOT EXISTS idx_listings_search_vector ON listings USING GIN (
  to_tsvector('english',
    COALESCE(player_name, '') || ' ' ||
    COALESCE(set_name, '') || ' ' ||
    COALESCE(condition, '')
  )
);

-- Update triggers for updated_at
CREATE OR REPLACE FUNCTION update_listings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON listings
FOR EACH ROW EXECUTE FUNCTION update_listings_updated_at();

CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION update_orders_updated_at();

-- Row-level security
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Listings (public readable, user can edit own)
CREATE POLICY listings_select ON listings FOR SELECT USING (true);
CREATE POLICY listings_insert ON listings FOR INSERT WITH CHECK (seller_id = auth.uid());
CREATE POLICY listings_update ON listings FOR UPDATE USING (seller_id = auth.uid());
CREATE POLICY listings_delete ON listings FOR DELETE USING (seller_id = auth.uid());

-- RLS Policies - Orders (users can view own orders)
CREATE POLICY orders_select ON orders FOR SELECT USING (
  buyer_id = auth.uid() OR seller_id = auth.uid()
);
CREATE POLICY orders_insert ON orders FOR INSERT WITH CHECK (buyer_id = auth.uid());
CREATE POLICY orders_update ON orders FOR UPDATE USING (buyer_id = auth.uid() OR seller_id = auth.uid());

-- RLS Policies - Order Messages
CREATE POLICY order_messages_select ON order_messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_messages.order_id
    AND (orders.buyer_id = auth.uid() OR orders.seller_id = auth.uid())
  )
);
CREATE POLICY order_messages_insert ON order_messages FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_messages.order_id
    AND (orders.buyer_id = auth.uid() OR orders.seller_id = auth.uid())
  )
);

-- RLS Policies - User Ratings
CREATE POLICY user_ratings_select ON user_ratings FOR SELECT USING (true);
CREATE POLICY user_ratings_insert ON user_ratings FOR INSERT WITH CHECK (rater_id = auth.uid());

-- RLS Policies - Seller Profiles
CREATE POLICY seller_profiles_select ON seller_profiles FOR SELECT USING (true);
CREATE POLICY seller_profiles_update ON seller_profiles FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY seller_profiles_insert ON seller_profiles FOR INSERT WITH CHECK (user_id = auth.uid());

-- RLS Policies - Listing Favorites
CREATE POLICY listing_favorites_select ON listing_favorites FOR SELECT USING (user_id = auth.uid());
CREATE POLICY listing_favorites_insert ON listing_favorites FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY listing_favorites_delete ON listing_favorites FOR DELETE USING (user_id = auth.uid());
