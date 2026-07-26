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

# Activation & engagement snapshot (signups, funnel, groups, retention proxy)
npx ts-node src/scripts/stats.ts
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

**Add to Watchlist Button (SearchPage):**
- Restored below each search result card alongside the hover quick-add overlay
- Opens a modal with status, season, and episode selectors (`openAddModal`)
- When already in watchlist: button replaced with "✓ In Watchlist" indicator
- Hover quick-add (`+` overlay on poster) still present for fast adds

### 12. Bug Fix — Group Digest Showing "Unknown Show" (Completed)
**Problem**: Daily digest group activity entries were all titled "Unknown Show" instead of the watch group name.

**Root cause**: `updateShowStatus` in `database.ts` used `.select()` without joining `shows`, so `updated.shows?.title` was always `undefined`, falling back to `'Unknown Show'`.

**Fix (`backend/src/routes/shows.ts`):**
- `show_title` in queued `group_progress_update` events now uses `group.name` (the watch group name, e.g. "Game of Thrones Fan Club")
- Show title moved into `episode_title` subtitle: `"${user} updated to S1E2 on ${show.title}"`
- `updateShowStatus` select updated to `'*, shows(title)'` so show title is available for the subtitle

### 13. Landing Page Feature Cards Updated (Completed)
**Purpose**: Replace placeholder feature copy with accurate product descriptions.

**Updated features (`frontend/src/app/page.tsx`):**
- **My Watchlist** (List icon): "Save shows you love, track where you left off, and pick back up anytime across every platform."
- **Universal Search** (Search icon): "Find any show and see exactly where to watch it, which seasons are available, and on what platform."
- **Drop Alerts** (Bell icon): "Get notified when new episodes and seasons drop so you're never the last to know."
- **Watch Groups** (Users icon): "Track shows with friends and know exactly where everyone's at, even from miles apart."
- Replaced `TrendingUp` + `Calendar` icons with `List` + `Search`

### 14. Private Beta Landing Page (Completed — waitlist CLOSED April 2026)
**Purpose**: Separate marketing page, hosted as a third Vercel project. Originally collected waitlist signups; the public form was **removed in April 2026** (see section 20) — the page now markets Scout and directs visitors to invite-only signup at `https://tvscout.vercel.app/auth` via referral codes.

**Location:** `beta-landing/` — separate Next.js app, deployed independently from `frontend/`

**Design:**
- Be Vietnam Pro font, Scout orange color tokens matching main app
- Fox mascot logo (`w-32`) + "Meet Scout, your TV sidekick" hero
- Two-column layout: 4 feature cards left, sticky signup card right
- Features match main app: My Watchlist, Universal Search, Drop Alerts, Watch Groups
- Platforms strip at bottom, fox logo in nav + footer
- Favicon + apple-icon copied from main frontend (auto-detected by Next.js App Router)
- OG image (`src/app/opengraph-image.tsx`): 1200×630 ImageResponse with fox logo + "Scout" + "Your TV Sidekick" + "PRIVATE BETA" badge

**Signup flow:**
- Form: name + email → `POST /api/signup` → inserts into `beta_signups` Supabase table
- Duplicate email returns 409 with friendly error
- Live signup count: `GET /api/signup-count` fetches count, displays "Join X others on the waitlist" when count > 0
- Hero subtext: "Spots are limited. Sign up for early access and we'll reach out when you're in."

**Database (`beta_signups` table):**
- Original migration SQL: `beta-landing/supabase-migration.sql`
- Columns: `id, name, email, signed_up_at, notes, invited, invited_at`
- **Security update (migration 009)**: RLS is now ENABLED with zero policies and anon/authenticated grants revoked — service-role only. The old state (RLS off + `GRANT SELECT TO anon`) let anyone with the public anon key read all waitlist names/emails via PostgREST.
- Existing rows retained as the seed list for referral-code invite emails
- View signups: Supabase Table Editor → `beta_signups` (service role), or SQL Editor

**Vercel deployment (third project):**
- Root directory: `beta-landing/`
- Framework: Next.js
- Env vars required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (same as main app)

### 15. Picks — Social Discovery Feature (Completed)
**Purpose**: Lightweight, privacy-respecting recommendations inside the existing watch-group social graph. Users "pick" shows they vouch for; anyone sharing a group with them sees those picks — without exposing full watchlists.

**Design decisions (confirmed with user — do not change without asking):**
- Social graph is derived from `watch_group_members` — no separate friends system
- **Eligibility rule**: a show can be picked if `watch_status === 'completed'` **OR** `current_season >= 2` (i.e., at least one season finished). Enforced server-side in `DatabaseService.isEligibleForPick()`; frontend mirrors the same condition to show/hide Sparkles buttons.
- Optional short note per pick (≤200 chars, enforced both ends)
- One row per (user, show); un-pick deletes, re-pick re-inserts (UNIQUE constraint)

**Backend:**
- `backend/src/routes/picks.ts` — `POST /` (add, validates eligibility), `DELETE /:showId`, `GET /mine`, `GET /feed`
- `DatabaseService` methods: `addPick`, `removePick`, `getUserPicks`, `getPicksFeed`, `isEligibleForPick`
- **CRITICAL — PostgREST schema cache**: all picks queries use *separate queries* (fetch picks → fetch shows by IDs → merge in JS), NOT PostgREST FK-join syntax (`shows(id, title)`). Joins fail on tables created via raw SQL until Supabase refreshes its schema cache. Keep this pattern for any new table.
- Feed query: picks from all users sharing any group with me, newest first, LIMIT 50, users/show data merged in

**Frontend:**
- `frontend/src/services/picksService.ts` — `Pick` interface + service (note: `Pick` shadows TS's utility type; also `poster_path` is `string | null | undefined`, coerce with `?? undefined` when passing to helpers typed `string | undefined`)
- `frontend/src/app/picks/page.tsx` + `frontend/src/components/PicksFeedPage.tsx` — feed page; `max-w-2xl md:max-w-5xl`, 2-column `md:grid-cols-[3fr_2fr]` when both feed and own picks exist; empty state with fox logo
- `ProfilePage.tsx` pick UX:
  - Completed/Dropped tabs: Sparkles button on each row when eligible
  - Currently Watching carousel: "Pick this show" entry in the ⋯ card menu when `current_season >= 2`; the **note panel renders below the whole carousel** (keyed by `pickPanelOpen` + `watchingShows` lookup) because the carousel cards have no room for an inline panel
  - State: `myPickShowIds: Set<string>` (membership checks) AND `myPicksList: Pick[]` (sidebar previews) — both kept in sync optimistically in `handleTogglePick`/`handleConfirmPick`
- Nav: Picks is in desktop NavBar links and mobile bottom tab bar (Sparkles icon)

### 16. Per-User Referral Codes (Completed — replaced admin beta_invites)
**Purpose**: Every user gets a shareable referral code; referrals are tracked. Replaces the earlier admin-generated `beta_invites` system (migration 005 still exists but the system is superseded).

**Backend (`backend/src/routes/auth.ts`):**
- `POST /register` accepts optional `inviteCode`; looks up `users.referral_code` (uppercased/trimmed) and sets `referred_by_user_id` on the new user
- `GET /referrals` (auth) returns `{ referral_code, referrals: [{name, joined_at}], count }`
- **On-the-fly backfill**: if the caller has no `referral_code`, the endpoint generates one via `AuthService.generateReferralCode()` and saves it — so existing accounts always get a code even if migration backfill was missed

**Frontend:**
- ProfilePage: full referral card on mobile (`md:hidden`); on desktop an inline compact card sits in the profile header next to the settings gear (`hidden md:flex`) — Gift icon, "Your Referral Code" label, code, icon-only copy button
- **Referred-names rule**: show joined names only when `count <= 2`; for 3+ show just "N people joined"
- SettingsPage also surfaces the referral code
- Migration: `008_referral_codes.sql` (adds `referral_code TEXT UNIQUE`, `referred_by_user_id`, backfills existing rows)

### 17. Beta-Readiness Features (Completed)
- **Account deletion**: `DELETE /api/auth/account` deletes user data in FK-safe order; SettingsPage DANGER ZONE section with AlertDialog confirm → logout → redirect home
- **Privacy Policy & Terms**: `frontend/src/app/privacy/page.tsx`, `frontend/src/app/terms/page.tsx`; linked from Settings row and landing footer
- **Onboarding modal**: `frontend/src/components/OnboardingModal.tsx` — 3 steps (name confirm, platform selection, email verification prompt) after first registration; gated by `localStorage['scout_onboarded_' + user.id]`
- **Group invite landing**: `GET /api/groups/public-preview/:inviteCode` (no auth) powers a personalized unauthenticated landing at `/groups/join` (show poster, group name, member count, Create Account / Sign In CTAs with redirect back to join flow)
- **Next-episode countdown**: `shows.next_air_date/next_episode_season/next_episode_number` (migration 006) updated during episode polling; ProfilePage shows "Next ep in Nd" / "Airing today!" badge (green when ≤7 days)
- **In-app bug report button**: `frontend/src/components/ui/bug-report-button.tsx` — files GitHub issues, auth-gated

### 18. Profile Page Desktop Sidebar — Groups + Picks Previews (Completed)
**Purpose**: Make ProfilePage the desktop hub. The right column (`hidden md:block`, so mobile is untouched) shows *previews* of both social features with links to full pages, instead of listing everything.

**Structure (right column, `space-y-6`):**
- **WATCH GROUPS** section: xs uppercase primary label + `+ New Group` text link (opens CreateGroupDialog); `myGroups.slice(0, 3)` cards; "See all N groups →" link to `/groups` only when >3
- **YOUR PICKS** section: same label style; "See all →" in header when >3; `myPicksList.slice(0, 3)` compact cards (w-8 poster, title, italic truncated note) each navigating to `/picks`; "See all Picks →" below cards when 1–3; dashed-border empty state ("Complete a season to start picking") when 0
- Section label pattern used app-wide: `text-xs font-semibold tracking-widest text-primary uppercase`

### 19. Responsive Layout Fixes (Completed)
- **NavBar centering**: authenticated variant uses `grid grid-cols-3 items-center` (logo | centered links | actions) — the right column div always renders even when `actions` is empty, so links never shift. Do NOT revert to `flex justify-between`.
- **GroupDetailPage**: plain `grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6` — main content (Sync Progress + Group Picks) first in DOM = left on desktop = top on mobile; sidebar (Add Scouts, About Show, Delete/Leave) second. No `flex-col-reverse` tricks. Hero poster `w-32 sm:w-48 lg:w-56`.
- **PicksFeedPage**: see section 15
- Desktop NavBar links: Search | Watchlist | Groups | Picks (all four exist — check before adding nav entries)

### 20. Beta Waitlist Closed → Referral-Only Signup (Completed April 2026)
**Trigger**: Supabase linter flagged `beta_signups` with RLS disabled; the `GRANT SELECT TO anon` also exposed all waitlist PII (names + emails) to anyone with the public anon key.

**Changes:**
- `beta-landing/src/app/page.tsx` rewritten as a static server component: signup form removed, replaced with an invite-only card ("Every Scout member has a referral code to share") + CTA to `https://tvscout.vercel.app/auth`. Hero/features/platforms marketing preserved.
- `beta-landing/src/app/api/` (signup + signup-count routes) deleted — no anon-key DB access remains in beta-landing; its `NEXT_PUBLIC_SUPABASE_*` env vars are no longer needed.
- Migration `009_beta_signups_rls.sql`: enables RLS (no policies = service-role only), revokes anon/authenticated grants, drops old permissive policies.
- Signup avenue is now referral codes (section 16) + group invite links (section 17). Existing `beta_signups` rows kept as the invite-wave seed list for `send-beta-invite.ts`.

### 21. Security Hardening + Phase 0 Instrumentation (Completed)
**Trigger**: A full-codebase audit ahead of putting Scout in front of strangers. Two findings converted a *missing env var* into a full auth bypass, and the app had no way to measure whether anyone was using it.

**Security fixes (all fail-closed now):**
- **JWT secret** (`backend/src/services/auth.ts`): previously `process.env.JWT_SECRET || 'your-secret-key-change-in-production'`. If the var were ever unset, tokens were signed with a public string and anyone could forge a session for any user. Now throws at startup. **The backend will not boot without `JWT_SECRET`** — this is intentional. Resolved via an IIFE so the type is a definite `string` (jsonwebtoken's overloads reject `string | undefined`).
- **CRON_SECRET** (`backend/src/utils/cron-auth.ts`, new): the old guard `if (cronSecret && header !== ...)` skipped entirely when the var was empty, silently making `/poll`, `/send-digests`, and three `/debug/*` endpoints public — including one returning other users' names and emails. New shared `verifyCronSecret()` fails closed (503) and uses `crypto.timingSafeEqual`. Applied to all 5 sites in `routes/notifications.ts`; the same logic is inlined in `api/cron/poll-episodes.ts` and `api/cron/send-digest.ts` (they load from `dist/` at runtime and can't import from `src/`). Those two also dropped their `NODE_ENV === 'production'` condition, which disabled auth entirely in dev.
- **CORS** (`backend/src/index.ts`): `origin.includes('.vercel.app')` trusted every other Vercel customer's deployment *and* any host merely containing the substring (`https://evil-vercel.app.attacker.com`), with `credentials: true`. Replaced with an exact regex plus an own-project prefix allowlist via `VERCEL_PREVIEW_PREFIXES`.
- **Auth rate limiting** (`backend/src/index.ts`): the only limiter was 100 req/15min across all of `/api/`. Added `credentialLimiter` (10/15min, `skipSuccessfulRequests` so legitimate users are never locked out) on login + reset-password, and `accountCreationLimiter` (10/hour, counts all outcomes) on register + forgot-password.

**Phase 0 instrumentation** — the app previously recorded *zero* activity: login performed no write, there were no sessions or pageviews, and `user_shows.updated_at` is overwritten in place. DAU/WAU and retention were unanswerable even from raw SQL.
- **`users.last_seen_at`** (migration 010) written on every `GET /api/auth/me`, which the frontend calls on app load — so it captures *passive* sessions (opening Scout just to look) that any write-based proxy misses. Awaited rather than fire-and-forget, because serverless functions can be frozen the instant a response is sent; a failure logs and never breaks the request.
- **PostHog** (`frontend/src/components/analytics-provider.tsx`): pageviews on pathname change, `identify()` on login, `reset()` on logout, plus an exported `trackEvent()` helper for future funnel events. **Completely inert without `NEXT_PUBLIC_POSTHOG_KEY`.** Deliberately avoids `useSearchParams()` — in the App Router that requires a Suspense boundary and fails the production build without one.
- **`backend/src/scripts/stats.ts`**: prints signups, the activation funnel (added a show / joined a group / made a pick), watch-group size distribution, `last_seen_at` engagement, referral share, and digest volume.

**Note:** historical activity cannot be backfilled — `last_seen_at` is seeded from `created_at` and only becomes meaningful after the app has been live with tracking for a week or so.

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

### Beta Invites Migration (`005_beta_invites.sql`) — SUPERSEDED
Creates `beta_invites` table. Superseded by per-user referral codes (008); kept for history.

### Next Air Date Migration (`006_next_air_date.sql`)
Adds `next_air_date`, `next_episode_season`, `next_episode_number` to `shows` for the countdown badge.

### Picks Migration (`007_picks.sql`)
Creates `picks` table: `id, user_id (FK users), show_id (FK shows), note, created_at`, UNIQUE `(user_id, show_id)`, indexes on both FKs.

### Referral Codes Migration (`008_referral_codes.sql`)
Adds `users.referral_code TEXT UNIQUE` + `users.referred_by_user_id UUID REFERENCES users(id)`; backfills existing users with random 8-char uppercase codes; indexes both columns.

### Last Seen Migration (`010_last_seen_at.sql`)
Adds `users.last_seen_at TIMESTAMP WITH TIME ZONE` + index, seeded from `created_at`. Written on every `GET /api/auth/me`. This is the only activity signal in the product — without it, DAU/WAU and retention are uncomputable.

### Beta Signups RLS Migration (`009_beta_signups_rls.sql`)
Security fix: enables RLS on `beta_signups` with no policies (service-role only), revokes anon/authenticated grants, drops old permissive policies. Ships together with the beta-landing waitlist form removal — running it while the old form was live would have broken signups.

**Reminder:** migrations are run manually in the Supabase SQL Editor — creating a migration file does nothing until the user runs it. When a feature depends on a new table/column, tell the user which migration(s) to run. New tables also hit the PostgREST schema-cache issue (see Known Issues).

---

## Deployment Configuration

### Vercel Setup
The project uses **three separate Vercel projects**:

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

**Beta Landing Project:**
- Root directory: `beta-landing/`
- Framework: Next.js
- Production branch: `main`
- Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Important:** All three projects need to be configured to deploy from `main` branch for production.

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
- `POST /register` - Create new account (optional `inviteCode` = a referral code; sets `referred_by_user_id`)
- `POST /login` - Login
- `GET /me` - Get current user (requires auth)
- `GET /referrals` - Get own referral code + referred users; generates a code on the fly if missing (requires auth)
- `PUT /preferences` - Update preferences (requires auth)
- `POST /forgot-password` - Request password reset
- `POST /reset-password` - Reset password with token
- `DELETE /account` - Delete account and all user data, FK-safe order (requires auth)

### Picks (`/api/picks`)
- `POST /` - Add a pick, body `{ showId, note? }`; 400 unless completed or season ≥ 2 (requires auth)
- `DELETE /:showId` - Remove a pick (requires auth)
- `GET /mine` - Own picks with show data (requires auth)
- `GET /feed` - Picks from users sharing any watch group, newest first (requires auth)

### Groups (`/api/groups`) — key routes
- `GET /public-preview/:inviteCode` - **No auth** — group name, show, member count for the invite landing page
- `GET /invite/:inviteCode` - Authenticated invite preview
- `POST /join`, `POST /`, `GET /`, `GET /:groupId`, `DELETE /:groupId`, `DELETE /:groupId/leave`, `POST /:groupId/add-member`

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

### New API Routes Return 404 in Production (READ THIS FIRST)
**Symptom:** Frontend console shows `Route /api/<new-thing> not found` from `streamtrack-backend.vercel.app` even though the code is committed and pushed.
**Root cause:** All three Vercel projects deploy production **from `main` only**. Code that exists only on a feature branch (e.g. `feat/steph`) is invisible to the production backend — the feature-branch frontend preview still calls the production backend. This burned an entire debugging session on the Picks launch: picks, referrals, and layout changes all "failed" until `feat/steph` was merged to `main`.
**Rule:** if a feature "doesn't work" in the deployed app, check `git log origin/main` FIRST — before touching code. If the commits aren't on `main`, that's the bug.

### PostgREST FK Joins Fail on Newly Created Tables
**Symptom:** Supabase queries using join syntax (`.select('*, shows(id, title)')`) error on a table created via raw SQL in the SQL Editor.
**Root cause:** PostgREST caches the schema and doesn't immediately learn new FK relationships.
**Rule:** for any new table, use separate queries and merge in JS (fetch rows → collect IDs → `.in('id', ids)` → build a map). See the picks methods in `backend/src/services/database.ts` for the canonical pattern.

### Silent Catch Blocks Hide Real Errors
Frontend loaders once used `catch { /* silently fail */ }`, which masked production 404s for days. Always `console.error('[Scout] <fn> failed:', err)` in catch blocks — the `[Scout]` prefix makes user-reported console dumps greppable.

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

# REQUIRED — the backend now REFUSES TO BOOT without this (no insecure fallback).
# Verify it is set in Vercel before deploying. openssl rand -hex 32
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

# Vercel preview origins allowed by CORS. Only "<prefix>.vercel.app" and
# "<prefix>-*.vercel.app" are accepted — other Vercel customers' deployments
# can no longer call this API with credentials.
VERCEL_PREVIEW_PREFIXES=tvscout,streamtrack,scout
```

See `backend/.env.example` for the full annotated list.

**CRON_SECRET is now mandatory** for the cron and debug endpoints — if unset they return 503 rather than running unauthenticated, which means episode polling and the daily digest stop. Local testing therefore requires it in `backend/.env`.

### Frontend
```bash
NEXT_PUBLIC_API_URL=http://localhost:5001  # or production backend URL

# Optional — analytics is completely inert without a key.
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

---

## Database Schema (Supabase)

### Core Tables
- **users** - User accounts with auth, preferences, subscription tier, `referral_code`, `referred_by_user_id`
- **shows** - TV show metadata from TMDB, incl. `next_air_date` / `next_episode_season` / `next_episode_number`
- **user_shows** - User watchlist; key fields: `watch_status` (`watching` | `completed` | `want_to_watch` | `dropped`), `current_season`, `current_episode`, `notifications_enabled`

### Social Tables
- **watch_groups** / **watch_group_members** - Watch parties around a show; membership defines the picks social graph
- **picks** - User show recommendations; UNIQUE `(user_id, show_id)`, optional `note`

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
- **main** - Production branch, auto-deploys all three Vercel projects
- **feat/steph** - The active staging branch. **User rule: ALL changes and new features land on `feat/steph` first, then merge to `main`.** Never commit directly to `main`.
- After merging, fast-forward `feat/steph` back to `main` (`git checkout feat/steph && git merge origin/main --ff-only && git push`) so the two branches stay identical between features — the user checks this.
- Vercel builds `feat/steph` as a preview; a preview build failure (type error etc.) is a real signal — fix it on `feat/steph` before merging.
- The frontend build runs `tsc` strictly: `string | null` is not assignable to `string | undefined` params (coerce with `?? undefined`), and ES5 target means no `Set` spread (use `Array.from(set)`)

## Working Style Notes (learned from sessions — follow these)
- **Verify root cause before writing code.** The biggest failures came from fixing symptoms (query syntax, CSS) when the real cause was deployment state. Check what's actually deployed, read the console errors literally, and confirm which branch serves production.
- **Frontend + backend must ship together.** A frontend calling a new endpoint is broken until the backend route is on `main`. Treat them as one unit when merging.
- **Mirror server rules in the UI.** Eligibility/validation rules (e.g., picks require a completed season) are enforced in the backend route AND replicated in frontend conditions that show/hide the affected controls. When changing a rule, update both and grep for every render site (desktop + mobile variants often duplicate the same condition).
- **Design system tokens**: Scout orange `--primary: 24 91% 55%`, cards `rounded-2xl bg-card border border-border`, section labels `text-xs font-semibold tracking-widest text-primary uppercase`, pill buttons `rounded-full`. Fox mascot for empty states. Match these instead of inventing new styles.
- **Mobile and desktop are separate JSX blocks** in most components (`hidden md:flex` / `md:hidden`). A change to one usually needs the same change in the other — search the file for the sibling block.
- **The user tests on real devices** (phone, iPad, large laptop) against deployed previews, not localhost. Breakpoint choices matter: `md:` = 768px is the mobile/desktop divide; verify layouts make sense at 768–1024 (iPad), not just at 1400px.

---

## Contact & Resources
- **GitHub**: https://github.com/tans2/streamtrack
- **TMDB API**: https://developer.themoviedb.org/docs
- **Resend**: https://resend.com (3,000 free emails/month)
- **Supabase**: https://supabase.com
- **Vercel**: https://vercel.com
