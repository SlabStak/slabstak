-- SlabStak Database Schema
-- Migration 005: Add card flagging system
-- Adds moderation flags to cards table

-- Add flagging columns to cards table
ALTER TABLE cards ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT FALSE;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS flagged_reason TEXT;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS flagged_at TIMESTAMPTZ;

-- Create index for flagged cards
CREATE INDEX IF NOT EXISTS idx_cards_is_flagged ON cards(is_flagged);
CREATE INDEX IF NOT EXISTS idx_cards_flagged_at ON cards(flagged_at DESC);

-- Create audit trigger function for flag changes
CREATE OR REPLACE FUNCTION log_card_flag_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_flagged IS DISTINCT FROM OLD.is_flagged THEN
    -- Log flag changes if needed
    NEW.updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for flag changes
DROP TRIGGER IF EXISTS log_card_flagging_changes ON cards;
CREATE TRIGGER log_card_flagging_changes BEFORE UPDATE ON cards
  FOR EACH ROW
  WHEN (NEW.is_flagged IS DISTINCT FROM OLD.is_flagged)
  EXECUTE FUNCTION log_card_flag_changes();
