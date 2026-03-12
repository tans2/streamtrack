# Scout (StreamTrack) - Development Context

## Project Overview
Scout is a TV show tracking application that helps users manage their watchlist across streaming platforms. Users can track shows, monitor watch progress, and receive notifications for new episodes.

**Tech Stack:**
- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Express.js, TypeScript, Node.js
- **Database**: Supabase (PostgreSQL)
- **Email**: Resend
- **Deployment**: Vercel (separate projects for frontend and backend)

---

## Repository Structure
```
streamtrack/
├── frontend/          # Next.js frontend app
├── backend/           # Express.js API backend
├── beta-landing/      # Marketing landing page for beta signups
└── node_modules/      # Root dependencies (concurrently for dev)
```

---

## Recently Implemented Features

### 1. Email Notification System (Completed)
**Purpose**: Notify users when new episodes or seasons are released for shows they're tracking.

**Components:**
- `backend/src/services/email.ts` - Resend SDK integration
- `backend/src/services/notification.ts` - Episode detection logic
- `backend/src/routes/notifications.ts` - API endpoints
- `backend/api/cron/poll-episodes.ts` - Vercel cron function (every 6 hours)
- `frontend/src/services/notificationService.ts` - Frontend API client
- `frontend/src/app/verify-email/page.tsx` - Email verification page

**Database Tables Created:**
- `episode_cache` - Tracks known episodes to detect new ones
- `notification_log` - Prevents duplicate notifications
- `episode_poll_status` - Tracks TMDB polling per show

**User Columns Added:**
- `users.email_verified` - Boolean
- `users.email_verification_token` - Token for verification
- `user_shows.notifications_enabled` - Per-show toggle

**Environment Variables Required:**
```
RESEND_API_KEY=re_xxxxxxxxxx
CRON_SECRET=<random-secret>
EMAIL_FROM=Scout <onboarding@resend.dev>
```

### 1b. Daily Digest Notifications (Completed)
**Purpose**: Aggregate notification events and send a single daily digest email to users.

**How It Works:**
1. Episode polling detects new episodes and queues events in `pending_notification_events`
2. GitHub Actions cron job runs daily at 1 PM UTC
3. Backend aggregates unprocessed events per user and sends a digest email
4. Events are marked as processed and logged in `digest_log`

**Components:**
- `backend/api/cron/send-digest.ts` - Digest endpoint (triggered by GitHub Actions)
- `.github/workflows/cron-send-digest.yml` - GitHub Actions cron (daily at 1 PM UTC)
- `backend/supabase/migrations/002_daily_digest.sql` - Database migration

**Database Tables Created:**
- `pending_notification_events` - Queues notification events for digest aggregation
- `digest_log` - Tracks daily digest emails sent per user

**Event Types Supported:**
- `new_episode` - New episode released
- `season_premiere` - First episode of a new season
- `show_premiere` - First episode of a new show
- `upcoming_release` - Upcoming episode reminder

**Streaming Provider Information:**
- Digest emails include "Available on: [platform names]" for each episode
- Provider data fetched from TMDB Watch Providers API during episode detection
- Shows up to 3 platforms (e.g., "Netflix, Hulu, Max")
- Stored in `pending_notification_events.providers` column

**Episode Grouping:**
- Multiple episodes of the same show are consolidated into a single entry per show
- Uses range notation for consecutive episodes (e.g., "S2 E7-9" instead of listing each separately)
- Non-consecutive episodes shown individually (e.g., "S2 E1, E3, E5")
- Deduplication: same episode from both `new_episode` and moved `upcoming_release` events is deduplicated before building ranges

**"Update Status" Deep Link:**
- Each show in the digest has an "Update Status" button linking to `/profile?action=update&showId=X&season=S&episode=E`
- ProfilePage.tsx reads these params and auto-updates the user's watch progress via `watchlistService.updateShowStatus()`
- Only updates if the linked episode is ahead of the user's current progress (prevents downgrading)
- Query params are cleared after update to prevent re-triggering

**Upcoming Release Air Date Check:**
- `sendDailyDigests()` checks if `upcoming_release` events have already aired (air_date <= today)
- Aired events are moved to the New Episodes section instead of Coming Up

**Digest Email Branding:**
- Email titled "Watchlist Digest" (not "Daily")
- Scout logo displayed inline with "Scout" text in the email header (loaded from `${FRONTEND_URL}/logo.png`)

**Bug Fix: Future Episode Caching (Feb 2025)**
- **Issue**: Future episodes were cached on first poll, so when they aired they were already in cache and not detected as "new"
- **Root cause**: Initial polling cached ALL episodes from TMDB regardless of air date
- **Fix implemented**:
  1. Only cache episodes that have already aired (air_date <= today)
  2. Alternative detection: episodes newer than `last_known_episode` in `episode_poll_status` trigger notifications even if already in cache
- **Cleanup script**: `backend/src/scripts/cleanup-cache.ts` - removes future episodes from cache

**GitHub Secrets Required:**
```
BACKEND_DIGEST_CRON_URL=https://<backend-url>/api/cron/send-digest
CRON_SECRET=<same-as-vercel-env>
```

**Testing Locally:**
```bash
curl -X POST -H "Authorization: Bearer <CRON_SECRET>" http://localhost:5001/api/cron/send-digest
```

**Debug Scripts:**
```bash
# Manually run daily digest
npx ts-node src/scripts/run-digest.ts

# Manually run episode polling
npx ts-node src/scripts/run-poll.ts

# Debug specific show (searches TMDB, checks cache, poll status, events)
npx ts-node src/scripts/debug-digest.ts

# Test polling a single show by TMDB ID
npx ts-node src/scripts/test-poll-show.ts

# Clean up future episodes from cache
npx ts-node src/scripts/cleanup-cache.ts
```

### 2. Password Reset Feature (Completed)
**Purpose**: Allow users to reset forgotten passwords via email.

**Flow:**
1. User clicks "Forgot password?" on login page
2. Enters email → receives reset link
3. Clicks link → enters new password
4. Password updated, can login

**Files:**
- `backend/src/routes/auth.ts` - Added `/forgot-password` and `/reset-password` routes
- `frontend/src/app/forgot-password/page.tsx` - Request reset page
- `frontend/src/app/reset-password/page.tsx` - Set new password page

**Security:**
- 32-byte random hex tokens
- 1-hour expiration
- Single-use tokens
- Generic response (doesn't reveal if email exists)

**Database Columns Added:**
- `users.password_reset_token`
- `users.password_reset_expires_at`

### 3. Fox Scout Logo & Branding (Completed)
**Purpose**: Consistent brand identity with custom fox mascot logo throughout the app.

**Logo Asset:**
- Source: `frontend/Fox Scout Logo.png` - Cute orange fox holding a TV, transparent background
- Colors match Scout brand (`#CC5500` orange tones)

**Logo Placements (via Shared NavBar):**
- **Favicon**: `frontend/src/app/icon.png` (auto-detected by Next.js App Router)
- **Main logo**: `frontend/public/logo.png` (used via NavBar component on all pages)
- **NavBar**: All pages use `<NavBar />` from `frontend/src/components/ui/nav-bar.tsx`
- **404 Page**: `frontend/src/app/not-found.tsx` - Fox logo with friendly message

### 4. Mobile Browser Optimization (Completed)
**Purpose**: Responsive design improvements for mobile devices.

**Changes:**
- Responsive padding and spacing throughout (`px-3 sm:px-6`, `py-4 sm:py-8`)
- Collapsible navigation buttons (icons on mobile, text on desktop)
- Touch-friendly button sizes (`h-9 sm:h-8`)
- Consistent Sign Out button across all authenticated pages

**Files Updated:**
- `frontend/src/components/ProfilePage.tsx`
- `frontend/src/components/SearchPage.tsx`
- `frontend/src/components/SettingsPage.tsx`
- `frontend/src/app/page.tsx`

### 5. Framer Motion & Animation System (Completed)
**Purpose**: Smooth animations throughout the app for a polished, modern feel.

**Dependencies Added:**
- `framer-motion` v12.33.0 - Animation library
- `geist` v1.7.0 - Vercel's Geist Sans font family

**Animation Presets (`frontend/src/lib/animations.ts`):**
- `staggerContainer` - Parent container that staggers children animations (0.05s gap)
- `fadeInUp` - Fade in from below with spring physics
- `scaleOnTap` - Button press/hover scale effect
- `cardHover` - Card lift on hover (y: -6)
- `successPop` - Scale pop for success indicators
- `fadeIn` - Simple opacity fade
- `slideInRight` - Slide from right for modals/panels
- `shimmer` - Looping opacity pulse for skeleton loaders

**Skeleton Loading Components (`frontend/src/components/ui/skeleton-card.tsx`):**
- `SkeletonCard` - Single skeleton card (poster or horizontal variant)
- `SkeletonGrid` - Grid of skeleton cards with shimmer animation

**Pages Using Animations:**
- `ProfilePage.tsx` - staggerContainer + fadeInUp for watchlist grids, cardHover on cards
- `SearchPage.tsx` - staggerContainer + fadeInUp for search results, cardHover on cards
- `page.tsx` (Landing) - fadeIn for hero, staggerContainer for features, viewport animations for platforms

**Geist Font Integration (since replaced):**
- Originally GeistSans; replaced by Be Vietnam Pro in Section 8 UI Overhaul

### 6. Shared NavBar Component (Completed)
**Purpose**: Consistent Scout logo and branding across all pages via a shared navigation component.

**Component:** `frontend/src/components/ui/nav-bar.tsx`

**Variants:**
- `landing` - Full-width, no border. Logo + "Scout" on left, custom actions on right.
- `auth` - Optional back button + Logo + "Scout" clickable to home.
- `authenticated` - Full-width with border-bottom and card background. Logo + "Scout" as home link, page title via `/` separator, custom actions on right.

**Props:**
- `variant`: `'landing' | 'auth' | 'authenticated'`
- `backHref?`: string - Auth variant back button destination
- `backLabel?`: string - Auth variant back button text
- `pageTitle?`: string - Authenticated variant page title after logo
- `actions?`: ReactNode - Right-side action buttons

**Files Using NavBar:**
- `frontend/src/app/page.tsx` (landing)
- `frontend/src/app/auth/page.tsx` (auth)
- `frontend/src/app/forgot-password/page.tsx` (auth)
- `frontend/src/app/reset-password/page.tsx` (auth)
- `frontend/src/app/verify-email/page.tsx` (auth)
- `frontend/src/components/SignUpPage.tsx` (auth)
- `frontend/src/components/ProfilePage.tsx` (authenticated)
- `frontend/src/components/SearchPage.tsx` (authenticated)
- `frontend/src/components/SettingsPage.tsx` (authenticated)

### 7. Landing Page Redesign (Completed)
**Purpose**: Modern, animated landing page with split hero layout.

**Layout:**
- NavBar (landing variant) with Explore Shows, My Watchlist, Sign In/Out
- Hero logo (96px mobile, 112px desktop) above headline in left column
- Two-column hero: "Meet Scout, your TV sidekick" headline on left (gradient text), stacked feature cards on right
- Stacks vertically on mobile
- Streaming platforms section with clean logos (no card/button styling), hover scale effects
- Footer with Scout logo (24px) + "Scout" text + "Track Your Shows" tagline
- CTA buttons only shown for unauthenticated users (nav handles authenticated navigation)

**Animations Used:**
- `fadeIn` for hero headline
- `staggerContainer` + `fadeInUp` for feature cards
- `fadeIn` with viewport trigger for platforms section
- `whileHover` scale on platform logos

### 8. UI Design Overhaul — Scout Design System (Completed)
**Purpose**: Unified visual language across all pages: dark card backgrounds, orange primary accents, Be Vietnam Pro typography.

**Font Change:**
- Replaced Geist Sans with **Be Vietnam Pro** (weights 400/500/600/700) via `next/font/google`
- Applied in `frontend/src/app/layout.tsx` and `frontend/tailwind.config.js`

**Color Tokens (`frontend/src/app/globals.css`):**
- `--primary: 24 91% 55%` (Scout orange)
- `--secondary: 102 36% 55%` (muted green)
- `--accent: 40 88% 60%` (warm yellow)
- Cleaner border, background, and card tokens

**Auth Pages Redesigned:**
- Scout fox logo above the auth card
- Login: "Ready to jump back in?" subheading, "Forgot Password?" inline with password label, "New to Scout? Create an Account" toggle
- Sign Up: "Join Scout" title, consistent rounded-full button
- Files: `frontend/src/app/auth/page.tsx`, `frontend/src/components/SignUpPage.tsx`

**NavBar (Authenticated variant) — Updated:**
- Added centered nav links: Home (`/`), Search (`/search`), Watchlist (`/profile`)
- Active link indicator: dot below active route (via `usePathname()`)
- Removed `pageTitle` prop slash-separator; group name now in page hero
- `frontend/src/components/ui/nav-bar.tsx`

**SignOutButton Component (New):**
- `frontend/src/components/ui/sign-out-button.tsx`
- Wraps logout in `AlertDialog` confirmation modal
- Accepts `variant` and `className` props for flexible styling
- Used in NavBar actions for all authenticated pages; removed all direct `logout()` calls

### 9. GroupDetailPage Redesign (Completed)
**Purpose**: Match Scout design system with hero banner + two-column layout.

**Hero Card:**
- Full-width, horizontal layout: show poster (w-48) + right column
- Right: "ACTIVE WATCH PARTY" label (orange, uppercase, small), group name `h1`, subtitle showing show title + member count
- Copy Invite Link button (rounded-full, primary) — keeps existing `handleCopyInvite`
- Group name moved here from NavBar (NavBar `pageTitle` removed)

**Two-column grid (`md:grid-cols-[1fr_2fr]`):**

Left column:
- **"Add New Scouts" card** (admin only): email input with Mail icon, full-width "Add" button (previously "Invite New Scouts" / "Send Invitation")
- **"About the Show" card**: show `overview` description + genre Badge pills (status removed)
  - Backend: added `overview` to `getGroupDetails` Supabase select query in `backend/src/services/database.ts`
  - Service: added `overview?: string` to `GroupDetail.show` interface in `watchGroupService.ts`
- **Delete/Leave group actions** at bottom (destructive, existing confirm pattern)

Right column:
- **"Sync Progress" card**: BarChart2 header, member avatar initials, `S{n} • Ep {n}` format, status badge spans
- Updated `getRelativeLabel` badge labels:
  - Ahead → `LEADING THE PACK` (green)
  - Same → `SAME PLACE` (blue)
  - N ep behind → `N EP BEHIND` (orange)
  - Season behind → `CATCHING UP` (muted)
- `showAllMembers` state: shows first 4, "View all N members" expands to all
- **Group Sync Banner**: 🎉 "Everyone's in sync!" banner when all members at same progress
  - `allSynced = sortedMembers.length > 1 && sortedMembers.every(m => progressValue === firstProgressValue)`

**File:** `frontend/src/components/GroupDetailPage.tsx`

### 10. SettingsPage Redesign (Completed)
**Purpose**: Section-label + icon-row card layout while preserving all existing functionality.

**Pattern:**
- `SectionLabel` helper: orange uppercase tracking-widest text
- `IconPill` helper: `bg-muted rounded-xl p-2` wrapping a lucide icon
- Card rows separated by `border-t border-border`

**Sections:**
1. **ACCOUNT**: Email Verification (Verified badge or Verify button), Full Name input, Change Password inputs, Region select, Save Changes button
2. **PREFERENCES**: Play/Calendar/Tv/PauseCircle/Users/BarChart2 icon rows for all notification toggles; non-pause rows wrapped in `opacity-50 pointer-events-none` when `pauseAll` is on; Friend Activity + Weekly Digest disabled (Coming Soon)
3. **STREAMING PLATFORMS**: Existing grid with `rounded-xl border` tiles, selected = `border-primary bg-primary/10`; Save button
4. **PREMIUM**: Icon pill + "Coming Soon" badge (preserved)
5. **PRIVACY & SECURITY**: Privacy Policy row (Lock icon + ChevronRight, non-functional) + existing 3 disabled switches

**No sign-out button at bottom** — `SignOutButton` in NavBar actions only.

**File:** `frontend/src/components/SettingsPage.tsx`

### 11. UX Improvements — Round 1 (Completed)
**Purpose**: Polish empty states, search UX, hover interactions, and progress feedback.

**Empty States (fox mascot):**
- SearchPage: pre-search state ("What are you looking for?") and no-results state ("No shows found for '...'") — fox logo at opacity-40, friendly copy, Browse link
- ProfilePage Currently Watching: "Nothing playing yet" + "Browse Shows →" link when watchlist is empty
- Files: `frontend/src/components/SearchPage.tsx`, `frontend/src/components/ProfilePage.tsx`

**Show Card Hover Quick-Add (SearchPage):**
- Poster div uses `group/card` Tailwind named group class
- On hover: dark overlay (`group-hover/card:opacity-100`) with centered `+` quick-add button (scale-90 → scale-100 transition)
- "In Watchlist" green badge overlaid on poster bottom edge when already added
- Removed always-visible action buttons below cards

**Debounced Search Autocomplete (SearchPage):**
- `useRef<NodeJS.Timeout>` debounce — 500ms delay, minimum 2 characters
- Input `onChange` clears timeout, sets new debounce if ≥2 chars, clears results if <2 chars
- Enter key clears timeout and fires search immediately
- Uses existing `/api/shows/search` endpoint (no new API needed)

**Notification Dot on Settings Gear (ProfilePage):**
- `emailVerified` state loaded via `notificationService.getPreferences()` on mount
- Red dot `<span>` rendered on gear icon when `emailVerified === false`
- Settings gear added to top-right of profile header (`router.push('/settings')`)

**Currently Watching Sort (ProfilePage):**
- Sorted by `updated_at` descending: `.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())`
- Most recently updated shows appear first

**Group Watch Status Banner (GroupDetailPage):**
- `allSynced` computed from `sortedMembers` — all members share the same progress value
- 🎉 banner displayed above Sync Progress card when synced, only when `sortedMembers.length > 1`

---

## Database Migrations

### Notifications Migration (`backend/supabase/migrations/001_notifications.sql`)
Run in Supabase SQL Editor to enable notifications feature.

### Daily Digest Migration (`backend/supabase/migrations/002_daily_digest.sql`)
Run in Supabase SQL Editor to enable daily digest notifications.
Creates tables: `pending_notification_events`, `digest_log`

### Providers Migration (`backend/supabase/migrations/003_add_providers_to_events.sql`)
Run in Supabase SQL Editor to add streaming provider info to notification events.
```sql
ALTER TABLE pending_notification_events
  ADD COLUMN IF NOT EXISTS providers TEXT;
```

### Password Reset Migration
```sql
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS password_reset_token TEXT,
  ADD COLUMN IF NOT EXISTS password_reset_expires_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON users(password_reset_token)
  WHERE password_reset_token IS NOT NULL;
```

---

## Deployment Configuration

### Vercel Setup
The project uses **separate Vercel projects** for frontend and backend:

**Frontend Project:**
- Root directory: `frontend/`
- Framework: Next.js
- Production branch: `main`

**Backend Project:**
- Root directory: `backend/`
- Framework: Other (Express)
- Production branch: `main`
- Build command: `npm run vercel-build`
- Output directory: `dist`

**Important:** Both projects need to be configured to deploy from `main` branch for production.

### Cron Jobs

**Vercel Cron (Episode Polling):**
Configured in `backend/vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/poll-episodes",
    "schedule": "0 */6 * * *"
  }]
}
```

**GitHub Actions Cron (Daily Digest):**
Configured in `.github/workflows/cron-send-digest.yml`:
- Schedule: Daily at 1 PM UTC (`0 13 * * *`)
- Endpoint: `POST /api/cron/send-digest`
- Requires GitHub secrets: `BACKEND_DIGEST_CRON_URL`, `CRON_SECRET`

---

## API Endpoints Summary

### Auth (`/api/auth`)
- `POST /register` - Create new account
- `POST /login` - Login
- `GET /me` - Get current user (requires auth)
- `PUT /preferences` - Update preferences (requires auth)
- `POST /forgot-password` - Request password reset
- `POST /reset-password` - Reset password with token

### Shows (`/api/shows`)
- `GET /popular` - Get popular shows
- `GET /search` - Search shows
- `GET /watchlist` - Get user's watchlist (requires auth)
- `PUT /watchlist/:showId/status` - Update show status (requires auth)
- `DELETE /watchlist/:showId` - Remove from watchlist (requires auth)
- `POST /:tmdbId/quick-add` - Add show to watchlist (requires auth)

### Notifications (`/api/notifications`)
- `GET /preferences` - Get notification preferences (requires auth)
- `PUT /preferences` - Update global preferences (requires auth)
- `PUT /preferences/:showId` - Toggle per-show notifications (requires auth)
- `POST /verify-email` - Send verification email (requires auth)
- `GET /verify/:token` - Verify email with token

### Cron Endpoints (`/api/cron`)
- `POST /poll-episodes` - Poll TMDB for new episodes (Vercel cron, requires CRON_SECRET)
- `POST /send-digest` - Send daily digest emails (GitHub Actions, requires CRON_SECRET)

### Debug Endpoints (`/api/notifications/debug`) — Development Only
- `GET /pending-events` - View all pending notification events (requires auth)
- `POST /poll-show` - Poll a specific show by TMDB ID (requires auth, body: `{ tmdbId: number }`)
- `POST /cleanup-cache` - Delete future episodes from cache (requires auth)

---

## Known Issues & Solutions

### Backend Not Auto-Deploying
**Issue:** Frontend deploys but backend doesn't when pushing to main.
**Solution:** Ensure backend Vercel project is configured:
1. Go to Vercel → Backend project → Settings → Git
2. Set Production Branch to `main`
3. Ensure "Auto-Deploy" is enabled

### Vercel Separate Projects (Avoid Root Build Issues)
**Goal:** Keep frontend and backend as separate Vercel projects without build confusion.

**Backend project settings (Vercel):**
1. Root Directory: `backend`
2. Build Command: `npm run build`
3. Install Command: `npm install`
4. Output Directory: *(empty)*

**Frontend project settings (Vercel):**
1. Root Directory: `frontend`
2. Build Command: `npm run build`
3. Install Command: `npm install`
4. Output Directory: `.next`

**Important deploy note:**
- If backend Root Directory is `backend`, do **not** run `vercel --prod` from inside `backend/`
  (it can resolve to `backend/backend` and fail).
- Deploy the backend from repo root or use the Vercel Dashboard redeploy.
- If a backend build log shows `npm run build:frontend` or `next build`,
  the backend project is building from repo root instead of `backend/`.

### Email Service Not Working
**Issue:** Emails not sending in production.
**Checklist:**
1. Verify `RESEND_API_KEY` is set in Vercel environment variables
2. Use `onboarding@resend.dev` for testing (no domain verification needed)
3. Check Resend dashboard for delivery status

---

## Future Feature Ideas

### High Priority
- [ ] Push notifications (web)
- [x] ~~Weekly digest email~~ → Daily digest implemented (see section 1b)
- [ ] Import watchlist from other services (Trakt, TV Time)

### Medium Priority
- [ ] Social features (friends, shared watchlists)
- [ ] Streaming platform availability by region
- [ ] Watch party scheduling
- [ ] Statistics/analytics dashboard

### Low Priority
- [ ] Mobile app (React Native)
- [ ] Browser extension for auto-detection
- [ ] Integration with calendar apps

---

## Development Commands

```bash
# Run both frontend and backend in development
npm run dev

# Run only frontend
cd frontend && npm run dev

# Run only backend
cd backend && npm run dev

# Type check backend
cd backend && npm run lint

# Build backend for production
cd backend && npm run build
```

---

## Code Patterns

### Backend Service Pattern
```typescript
export class ServiceName {
  static async methodName(params): Promise<ReturnType> {
    try {
      // Implementation
      return data;
    } catch (error) {
      console.error('Error message:', error);
      return defaultValue;
    }
  }
}
```

### Frontend Service Pattern
```typescript
class ServiceName {
  async methodName(params): Promise<ReturnType> {
    try {
      const response = await apiClient.METHOD(buildApiUrl('endpoint'), data);
      return handleApiResponse<ReturnType>(response);
    } catch (error) {
      throw new Error(handleApiError(error as AxiosError));
    }
  }
}
export const serviceName = new ServiceName();
```

### API Response Format
```typescript
{
  success: boolean;
  data: T;
  error?: string;
  message?: string;
}
```

---

## Environment Variables

### Backend (`backend/.env`)
```bash
# Server
PORT=5001
NODE_ENV=development
JWT_SECRET=<long-random-string>

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

# TMDB
TMDB_API_KEY=<tmdb-api-key>
TMDB_BASE_URL=https://api.themoviedb.org/3

# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxx
CRON_SECRET=<random-secret>
EMAIL_FROM=Scout <onboarding@resend.dev>

# URLs (FRONTEND_URL must be set in Vercel for digest email links)
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000
```

### Frontend
```bash
NEXT_PUBLIC_API_URL=http://localhost:5001  # or production backend URL
```

---

## Database Schema (Supabase)

### Core Tables
- **users** - User accounts with auth, preferences, subscription tier
- **shows** - TV show metadata from TMDB
- **user_shows** - User watchlist (many-to-many with progress tracking)

### Notification Tables
- **episode_cache** - Cached episode data for new episode detection
- **notification_log** - Sent notification history (prevents duplicates)
- **episode_poll_status** - TMDB polling schedule per show
- **pending_notification_events** - Queued events for daily digest aggregation
- **digest_log** - Tracks daily digest emails sent per user

### Beta Landing
- **beta_signups** - Email signups for beta access

---

## Authentication Flow
1. User registers with email/password
2. Password hashed with bcrypt (12 rounds)
3. JWT token generated (7-day expiry)
4. Token stored in localStorage
5. API requests include `Authorization: Bearer <token>`
6. Backend middleware validates token on protected routes

---

## Key Architecture Decisions

### Separate Frontend/Backend
- Allows independent scaling and deployment
- Backend can be used by future mobile apps
- Clear API contract between layers

### Supabase over Firebase
- PostgreSQL for relational data
- Built-in auth (though we use custom JWT)
- Row-level security for data protection

### Resend for Email
- Modern API, great developer experience
- 3,000 free emails/month (sufficient for MVP)
- Easy to switch to custom domain later

### TMDB for Show Data
- Comprehensive TV show database
- Free API tier with reasonable limits
- Real-time episode/season data

---

## Troubleshooting

### "Route not found" in production
1. Check if code is deployed (Vercel dashboard)
2. Verify the route exists in backend
3. Check if backend project auto-deploys from correct branch

### Email verification not working
1. Check RESEND_API_KEY in Vercel env vars
2. Verify email_verified column exists in users table
3. Check Resend dashboard for delivery logs

### CORS errors
1. Verify CORS_ORIGIN matches frontend URL
2. Check FRONTEND_URL is set correctly
3. Ensure backend allows the frontend domain

### Database connection issues
1. Verify SUPABASE_URL and keys are correct
2. Check Supabase dashboard for connection limits
3. Ensure service role key (not anon key) for backend

---

## Git Workflow
- **main** - Production branch, auto-deploys to Vercel
- **feat/*** - Feature branches, merge to main when ready
- Always test locally before merging to main

---

## Contact & Resources
- **GitHub**: https://github.com/tans2/streamtrack
- **TMDB API**: https://developer.themoviedb.org/docs
- **Resend**: https://resend.com (3,000 free emails/month)
- **Supabase**: https://supabase.com
- **Vercel**: https://vercel.com
