# Scout Beta Landing Page

A private beta signup page for Scout - the unified watchlist app.

## Setup

### 1. Install Dependencies

```bash
cd beta-landing
npm install
```

### 2. Create Supabase Table

Run the SQL migration in your Supabase SQL Editor:

```bash
# Copy contents of supabase-migration.sql and run in Supabase Dashboard > SQL Editor
```

### 3. Environment Variables

Create a `.env.local` file:

```bash
cp env.example .env.local
```

Then fill in your Supabase credentials:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon/public key

### 4. Run Locally

```bash
npm run dev
```

Visit http://localhost:3001

## Deploy to Vercel

### Option 1: Via Vercel Dashboard

1. Go to [Vercel](https://vercel.com)
2. Import your repository
3. Set **Root Directory** to `beta-landing`
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Deploy!

### Option 2: Via CLI

```bash
cd beta-landing
vercel
```

## Features

- ✨ Beautiful, minimal landing page matching Scout's design
- 📝 Email signup form with validation
- 🗄️ Stores signups in Supabase
- 🔒 Duplicate email prevention
- 📱 Fully responsive
- ⚡ Fast - built with Next.js

## Viewing Signups

Query your signups in Supabase:

```sql
SELECT * FROM beta_signups ORDER BY signed_up_at DESC;
```

Or use the Supabase Dashboard > Table Editor > beta_signups





