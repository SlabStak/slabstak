# SlabStak Database Setup

## Overview

SlabStak uses Supabase (PostgreSQL) for its database layer, providing:
- PostgreSQL database
- Authentication (via Supabase Auth)
- Storage (for card images)
- Row Level Security (RLS)
- Real-time subscriptions

## Setup Instructions

### 1. Create Supabase Project

1. Go to https://supabase.com
2. Sign up or log in
3. Click "New Project"
4. Choose your organization
5. Set project name: `slabstak`
6. Set a strong database password (save it securely)
7. Choose a region close to your users
8. Click "Create new project"

### 2. Run Migrations

Once your project is ready:

1. Go to the SQL Editor in Supabase dashboard
2. Run each migration file in order:
   - `migrations/001_initial_schema.sql`
   - `migrations/002_row_level_security.sql`
   - `migrations/003_storage_setup.sql`

3. Verify tables were created:
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public';
   ```

### 3. Configure Storage

#### Via Supabase Dashboard:
1. Go to Storage > Buckets
2. Create new bucket: `card-images`
3. Make it public
4. Set max file size to 5MB

#### Via SQL (Alternative):
The storage setup is included in `003_storage_setup.sql`

### 4. Get API Keys

1. Go to Settings > API
2. Copy the following:
   - Project URL (e.g., `https://xxxxx.supabase.co`)
   - `anon` public key
   - `service_role` secret key (keep secure!)

3. Add to your frontend `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   ```

### 5. Configure Authentication

1. Go to Authentication > Providers
2. Enable Email provider
3. Configure email templates (optional)
4. Set Site URL: `http://localhost:3000` (dev) or your production URL
5. Add redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `https://yourdomain.com/auth/callback` (production)

### 6. Create First Admin User

After setting up auth:

1. Sign up via your app
2. Get your user ID from Authentication > Users
3. Run in SQL Editor:
   ```sql
   INSERT INTO user_profiles (id, role, display_name)
   VALUES ('your-user-id-here', 'admin', 'Admin User');
   ```

## Schema Overview

### Tables

- **cards**: Stores all scanned/saved cards
- **subscriptions**: User subscription status (Stripe integration)
- **dealer_shows**: Card show/event tracking for dealers
- **dealer_show_cards**: Individual cards at shows
- **card_valuations**: Historical valuation data
- **user_profiles**: Extended user information and roles

### Row Level Security

All tables have RLS enabled with policies that ensure:
- Users can only see/modify their own data
- Admins can view all data
- System can insert valuations

### Storage

- **card-images**: Public bucket for uploaded card images
  - Images organized by user ID: `{user_id}/{filename}`
  - Max size: 5MB per file
  - Allowed formats: JPG, PNG, WEBP

## Maintenance

### Backup

Supabase provides automatic daily backups. For manual backup:

```bash
# Using Supabase CLI
supabase db dump -f backup.sql
```

### Migrations

When adding new migrations:

1. Create new file: `migrations/00X_description.sql`
2. Test in development first
3. Run in production during low-traffic period
4. Document in this README

### Monitoring

Monitor your database via:
- Supabase Dashboard > Database > Usage
- Check table sizes, query performance
- Monitor API requests

## Troubleshooting

### RLS Issues

If queries return empty when you expect data:

```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'cards';

-- Test as specific user
SET request.jwt.claim.sub = 'user-id-here';
SELECT * FROM cards;
```

### Storage Issues

If uploads fail:

1. Check bucket exists: Storage > Buckets
2. Verify bucket is public
3. Check storage policies in SQL Editor
4. Verify file size under limit

### Connection Issues

If frontend can't connect:

1. Verify Supabase URL and keys in `.env.local`
2. Check CORS settings in Supabase dashboard
3. Verify redirect URLs are configured

## Useful Queries

### Check card count by user
```sql
SELECT u.email, COUNT(c.id) as card_count
FROM auth.users u
LEFT JOIN cards c ON c.user_id = u.id
GROUP BY u.id, u.email
ORDER BY card_count DESC;
```

### Check subscription status
```sql
SELECT u.email, s.plan, s.status, s.current_period_end
FROM auth.users u
LEFT JOIN subscriptions s ON s.user_id = u.id;
```

### Total collection value by user
```sql
SELECT u.email,
       COUNT(c.id) as cards,
       SUM((c.estimated_low + c.estimated_high) / 2) as estimated_value
FROM auth.users u
LEFT JOIN cards c ON c.user_id = u.id
GROUP BY u.id, u.email
ORDER BY estimated_value DESC;
```
