-- SlabStak Database Schema
-- Migration 001: Initial schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Cards table: stores all scanned/saved cards
CREATE TABLE IF NOT EXISTS cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT,
  player TEXT NOT NULL,
  team TEXT,
  sport TEXT,
  set_name TEXT NOT NULL,
  year INTEGER,
  card_number TEXT,
  parallel TEXT,
  grade_estimate TEXT,
  grading_company TEXT,
  serial_number TEXT,
  estimated_low NUMERIC NOT NULL DEFAULT 0,
  estimated_high NUMERIC NOT NULL DEFAULT 0,
  recommendation TEXT NOT NULL,
  purchase_price NUMERIC,
  purchase_date DATE,
  purchase_source TEXT,
  sold_price NUMERIC,
  sold_date DATE,
  sold_platform TEXT,
  status TEXT NOT NULL DEFAULT 'holding',
  notes TEXT,
  raw_ocr TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Subscriptions table: tracks user subscription status
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  plan TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Dealer shows table: tracks card shows/events for dealers
CREATE TABLE IF NOT EXISTS dealer_shows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT,
  start_date DATE,
  end_date DATE,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'upcoming',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Dealer show cards table: tracks individual cards at shows
CREATE TABLE IF NOT EXISTS dealer_show_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  show_id UUID NOT NULL REFERENCES dealer_shows(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id UUID REFERENCES cards(id) ON DELETE SET NULL,
  acquisition_type TEXT NOT NULL DEFAULT 'inventory',
  buy_price NUMERIC,
  asking_price NUMERIC,
  sale_price NUMERIC,
  sale_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'holding',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Card valuations history: track value changes over time
CREATE TABLE IF NOT EXISTS card_valuations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  estimated_low NUMERIC NOT NULL,
  estimated_high NUMERIC NOT NULL,
  estimated_mid NUMERIC NOT NULL,
  comp_count INTEGER,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User profiles: extended user information
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user',
  display_name TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cards_user_id ON cards(user_id);
CREATE INDEX IF NOT EXISTS idx_cards_created_at ON cards(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cards_player ON cards(player);
CREATE INDEX IF NOT EXISTS idx_cards_status ON cards(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_dealer_shows_user_id ON dealer_shows(user_id);
CREATE INDEX IF NOT EXISTS idx_dealer_show_cards_show_id ON dealer_show_cards(show_id);
CREATE INDEX IF NOT EXISTS idx_dealer_show_cards_user_id ON dealer_show_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_card_valuations_card_id ON card_valuations(card_id);
CREATE INDEX IF NOT EXISTS idx_card_valuations_created_at ON card_valuations(created_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_cards_updated_at BEFORE UPDATE ON cards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dealer_shows_updated_at BEFORE UPDATE ON dealer_shows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dealer_show_cards_updated_at BEFORE UPDATE ON dealer_show_cards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
