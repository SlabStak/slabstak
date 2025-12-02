-- SlabStak Database Schema
-- Migration 002: Row Level Security (RLS) policies
-- Run this after 001_initial_schema.sql

-- Enable RLS on all tables
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE dealer_shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE dealer_show_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_valuations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Cards policies: users can only access their own cards
CREATE POLICY "Users can view own cards"
  ON cards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cards"
  ON cards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cards"
  ON cards FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own cards"
  ON cards FOR DELETE
  USING (auth.uid() = user_id);

-- Subscriptions policies
CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription"
  ON subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
  ON subscriptions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Dealer shows policies
CREATE POLICY "Users can view own shows"
  ON dealer_shows FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own shows"
  ON dealer_shows FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shows"
  ON dealer_shows FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own shows"
  ON dealer_shows FOR DELETE
  USING (auth.uid() = user_id);

-- Dealer show cards policies
CREATE POLICY "Users can view own show cards"
  ON dealer_show_cards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own show cards"
  ON dealer_show_cards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own show cards"
  ON dealer_show_cards FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own show cards"
  ON dealer_show_cards FOR DELETE
  USING (auth.uid() = user_id);

-- Card valuations policies: users can view valuations for their cards
CREATE POLICY "Users can view valuations for own cards"
  ON card_valuations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM cards WHERE cards.id = card_valuations.card_id AND cards.user_id = auth.uid()
  ));

CREATE POLICY "System can insert valuations"
  ON card_valuations FOR INSERT
  WITH CHECK (true);

-- User profiles policies
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admin policies (for users with role='admin' in user_profiles)
CREATE POLICY "Admins can view all cards"
  ON cards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can view all subscriptions"
  ON subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'
    )
  );
