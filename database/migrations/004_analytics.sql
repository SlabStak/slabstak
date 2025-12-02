-- Analytics Events Table
-- Stores user events for analytics and monitoring

CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL,
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for querying events
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at DESC);

-- RLS Policies
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Users can view their own events
CREATE POLICY analytics_events_select_own ON analytics_events
  FOR SELECT
  USING (auth.uid() = user_id);

-- Anyone can insert events (for anonymous tracking)
CREATE POLICY analytics_events_insert_all ON analytics_events
  FOR INSERT
  WITH CHECK (true);

-- Admins can view all events
CREATE POLICY analytics_events_select_admin ON analytics_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );
