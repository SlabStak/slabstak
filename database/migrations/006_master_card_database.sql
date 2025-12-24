-- SlabStak Database Migration
-- 006: Master Card Database
-- Adds comprehensive card catalog and search capabilities

-- Card catalog table (immutable master reference)
CREATE TABLE IF NOT EXISTS card_catalog (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Card identification
  player_name TEXT NOT NULL,
  set_name TEXT NOT NULL,
  card_number TEXT NOT NULL,

  -- Card metadata
  year INTEGER,
  sport TEXT NOT NULL DEFAULT 'basketball', -- basketball, baseball, football, hockey, soccer
  manufacturer TEXT, -- Topps, Panini, Leaf, etc

  -- Player info
  team TEXT,
  position TEXT,
  player_id TEXT,

  -- Card details
  card_type TEXT DEFAULT 'base', -- base, rookie, parallel, insert, autograph, game-used
  print_run INTEGER,
  is_parallel BOOLEAN DEFAULT FALSE,
  parallel_type TEXT, -- chrome, refractor, gold, etc

  -- Descriptions
  description TEXT,
  image_url TEXT,

  -- Unique identification
  unique_key TEXT NOT NULL UNIQUE,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Card sets (groupings)
CREATE TABLE IF NOT EXISTS card_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  set_name TEXT NOT NULL UNIQUE,
  manufacturer TEXT NOT NULL,
  year INTEGER NOT NULL,
  sport TEXT NOT NULL,
  total_cards INTEGER,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Card value history (price tracking over time)
CREATE TABLE IF NOT EXISTS card_values_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id UUID NOT NULL REFERENCES card_catalog(id) ON DELETE CASCADE,

  -- Value data by grade
  psa_10_value DECIMAL(10,2),
  psa_9_value DECIMAL(10,2),
  psa_8_value DECIMAL(10,2),
  psa_7_value DECIMAL(10,2),
  raw_value DECIMAL(10,2),

  -- Market source
  source TEXT, -- ebay, tcgplayer, pwcc, cardmarket

  -- Timestamp
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User card to catalog matches (links)
CREATE TABLE IF NOT EXISTS user_card_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  catalog_card_id UUID NOT NULL REFERENCES card_catalog(id) ON DELETE CASCADE,

  -- Match data
  match_confidence DECIMAL(3,2), -- 0.0 - 1.0
  matched_by TEXT, -- ai, user, admin
  matched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verified_by UUID REFERENCES auth.users(id),

  UNIQUE(user_card_id, catalog_card_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_card_catalog_player_name ON card_catalog(player_name);
CREATE INDEX IF NOT EXISTS idx_card_catalog_set_name ON card_catalog(set_name);
CREATE INDEX IF NOT EXISTS idx_card_catalog_year ON card_catalog(year);
CREATE INDEX IF NOT EXISTS idx_card_catalog_sport ON card_catalog(sport);
CREATE INDEX IF NOT EXISTS idx_card_catalog_manufacturer ON card_catalog(manufacturer);
CREATE INDEX IF NOT EXISTS idx_card_catalog_unique_key ON card_catalog(unique_key);
CREATE INDEX IF NOT EXISTS idx_card_catalog_team ON card_catalog(team);

CREATE INDEX IF NOT EXISTS idx_card_sets_year ON card_sets(year);
CREATE INDEX IF NOT EXISTS idx_card_sets_sport ON card_sets(sport);
CREATE INDEX IF NOT EXISTS idx_card_sets_manufacturer ON card_sets(manufacturer);

CREATE INDEX IF NOT EXISTS idx_card_values_card_id ON card_values_history(card_id);
CREATE INDEX IF NOT EXISTS idx_card_values_recorded_at ON card_values_history(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_card_values_source ON card_values_history(source);

CREATE INDEX IF NOT EXISTS idx_user_card_matches_user_card_id ON user_card_matches(user_card_id);
CREATE INDEX IF NOT EXISTS idx_user_card_matches_catalog_card_id ON user_card_matches(catalog_card_id);
CREATE INDEX IF NOT EXISTS idx_user_card_matches_confidence ON user_card_matches(match_confidence DESC);

-- Create full-text search index
CREATE INDEX IF NOT EXISTS idx_card_catalog_search ON card_catalog
USING GIN (
  to_tsvector('english',
    COALESCE(player_name, '') || ' ' ||
    COALESCE(set_name, '') || ' ' ||
    COALESCE(team, '')
  )
);

-- Update trigger for card_catalog
CREATE OR REPLACE FUNCTION update_card_catalog_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_card_catalog_updated_at BEFORE UPDATE ON card_catalog
FOR EACH ROW EXECUTE FUNCTION update_card_catalog_updated_at();

-- Update trigger for card_sets
CREATE TRIGGER update_card_sets_updated_at BEFORE UPDATE ON card_sets
FOR EACH ROW EXECUTE FUNCTION update_card_catalog_updated_at();

-- Enable row-level security
ALTER TABLE card_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_values_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_card_matches ENABLE ROW LEVEL SECURITY;

-- RLS Policies - card_catalog is public readable
CREATE POLICY card_catalog_select ON card_catalog
  FOR SELECT USING (true);

CREATE POLICY card_catalog_insert ON card_catalog
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- RLS Policies - card_values_history public readable
CREATE POLICY card_values_select ON card_values_history
  FOR SELECT USING (true);

-- RLS Policies - user_card_matches
CREATE POLICY user_card_matches_select ON user_card_matches
  FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM cards WHERE id = user_card_id)
    OR auth.role() = 'authenticated'
  );

CREATE POLICY user_card_matches_insert ON user_card_matches
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT user_id FROM cards WHERE id = user_card_id)
  );
