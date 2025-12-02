-- SlabStak Database Schema
-- Migration 003: Storage bucket setup
-- Run this after 002_row_level_security.sql

-- NOTE: This file documents the storage setup but must be done via Supabase UI or API
-- The SQL commands below are for reference only

-- Create storage bucket for card images
-- Run this in Supabase SQL editor:

INSERT INTO storage.buckets (id, name, public)
VALUES ('card-images', 'card-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for card images
CREATE POLICY "Users can upload card images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'card-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view own card images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'card-images' AND
  (
    auth.uid()::text = (storage.foldername(name))[1] OR
    true  -- Public bucket, anyone can view
  )
);

CREATE POLICY "Users can update own card images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'card-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own card images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'card-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Alternative: If you want to create the bucket via SQL (may require service role):
-- SELECT storage.create_bucket('card-images', true);
