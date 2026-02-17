# Scout Product Roadmap & Feature Ideas

This document captures product direction, feature ideas, and learnings from development sessions.

---

## Product Context

### Target User: Power Streamers
- Heavy users with 5+ streaming subscriptions
- Juggling many shows simultaneously
- Need centralized tracking across Netflix, Hulu, Disney+, Prime Video, HBO Max, etc.
- Secondary audience: Cord-cutters transitioning from cable

### Business Model: Free with Ads
- Core features remain free
- Ad-supported model for sustainability
- Potential premium tier later for advanced features

### Primary Problem Solved: Tracking
- Never lose track of where you left off
- Know which platform has which show
- Get notified when new episodes drop

---

## Competitor Analysis

### Quick Comparison

| Feature | **Scout** | **Trakt** | **TV Time** | **Simkl** | **Queue** |
|---------|-----------|-----------|-------------|-----------|-----------|
| **Primary Platform** | Web | Web + Apps | Mobile-first | Web + Apps | iOS |
| **Data Source** | TMDB | Own DB + TMDB | Own DB | TMDB + others | TMDB |
| **TV Shows** | Yes | Yes | Yes | Yes | Yes |
| **Movies** | No | Yes | Yes | Yes | Yes |
| **Anime** | Limited | Limited | No | Strong | No |
| **Episode Tracking** | Season-level | Episode-level | Episode-level | Episode-level | Episode-level |
| **Notifications** | Email | Limited | Push | Email | Push |
| **Social Features** | No | Yes | Yes (strong) | Yes | Minimal |
| **Scrobbling** | No | Yes (Plex/Kodi) | No | Yes | No |
| **Calendar View** | No (planned) | Yes | Yes | Yes | Yes |
| **Statistics** | No | Yes (detailed) | Yes | Yes | Minimal |
| **Price** | Free | Free + VIP ($30/yr) | Free + Premium | Free + Premium | Free + Premium |

### Competitor Deep Dive

**Trakt.tv** - The power user's choice
- Most feature-rich, established since ~2010
- Excellent API (many third-party integrations)
- Scrobbling from Plex/Kodi - automatic tracking for media center users
- Can be overwhelming; UI feels dated
- *Who uses it:* Cord-cutters with Plex setups, data nerds

**TV Time** - The social app
- Very polished mobile apps, mobile-first
- Social-first: reactions, comments per episode, friends
- Large casual user base
- Web experience is secondary; ads can be intrusive
- *Who uses it:* Casual viewers who want to chat about shows

**Simkl** - The Trakt alternative
- Strong anime support (MAL integration)
- Good API, scrobbling support
- Smaller community but loyal
- *Who uses it:* Anime fans, people who find Trakt too complex

**Queue** - The design-focused indie
- Beautiful, minimal iOS design
- Uses TMDB (same data source as Scout)
- iOS only, single developer, fewer features
- *Who uses it:* iOS users who value aesthetics over features

### Streaming Platform API Reality
**None of the major streaming platforms provide APIs for user data:**
- Netflix shut down public API in 2014
- Amazon Prime Video, Disney+, Hulu, HBO Max, Apple TV+ - no public APIs
- Direct integration is not possible; all trackers rely on manual entry or scrobbling

### Scout's Positioning
**"Trakt's power with TV Time's simplicity"**
- Web-first for desktop users (unlike TV Time's mobile focus)
- Simpler than Trakt (less overwhelming)
- Cross-platform unlike Queue (iOS-only)
- Strong notifications focus (our differentiator)

---

## Completed Features

### Dark Mode Toggle (Feb 2026)
- Class-based dark mode with `next-themes`
- Modern neutral dark palette (cool grays, preserved orange accent)
- Icon button toggle (Sun/Moon) in navbar
- System preference detection
- LocalStorage persistence

### Email Notification System (Feb 2026)
- New episode notifications
- Season premiere notifications
- Email verification flow
- Per-show notification toggles
- Resend integration (3,000 free/month)
- Vercel cron job polling TMDB every 6 hours

### Password Reset (Feb 2026)
- Forgot password flow
- Secure tokens (32-byte, 1-hour expiry, single-use)
- Email-based reset link

---

## Feature Backlog (Prioritized)

### Tier 1: High Priority
These features would significantly improve the core value proposition.

#### 1. Air Dates & Calendar View
**Problem:** Users don't know when next episodes air.
**Solution:**
- Show next episode air date on watchlist cards
- Calendar view showing upcoming episodes by day/week
- "Airing today" quick filter

**Technical Notes:**
- TMDB provides `next_episode_to_air` in show details
- Could use existing episode polling infrastructure

#### 2. Episode-Level Tracking
**Problem:** Current tracking is season-level only. Power users want granular control.
**Solution:**
- Episode list with checkboxes
- Mark individual episodes as watched
- Progress bar showing episodes watched per season
- "Mark all as watched" for binge sessions

**Technical Notes:**
- New table: `user_episodes` (user_id, show_id, season_number, episode_number, watched_at)
- TMDB provides full episode lists per season

#### 3. Push Notifications (Web)
**Problem:** Email notifications may be missed or delayed.
**Solution:**
- Browser push notifications for new episodes
- Opt-in per device
- Same notification preferences apply

**Technical Notes:**
- Web Push API + Service Worker
- Store push subscriptions in database
- Consider web-push npm package

#### 4. Weekly Digest Email
**Problem:** Daily notifications can be overwhelming.
**Solution:**
- Weekly summary of upcoming episodes
- Recap of what aired this week
- Configurable day/time
- Option to replace individual notifications

---

### Tier 2: Medium Priority
Nice-to-have features that improve experience but aren't critical.

#### 5. Import from Other Services
**Problem:** Users switching from Trakt, TV Time, or Simkl have existing data.
**Solution:**
- Import wizard for popular services
- CSV upload option
- Match shows to TMDB IDs

#### 6. Streaming Platform Availability by Region
**Problem:** Shows available on different platforms in different countries.
**Solution:**
- Region selector in settings
- Show which platforms have the show in user's region
- TMDB provides this via watch providers API

#### 7. Statistics Dashboard
**Problem:** Power users love data about their viewing habits.
**Solution:**
- Total shows tracked
- Episodes watched this month/year
- Genres breakdown
- Time spent watching (estimated)
- Most active days

#### 8. Social Features
**Problem:** Watching TV is often social; people want to see what friends watch.
**Solution:**
- Friend system (follow/mutual)
- Friend activity feed
- Shared watchlists
- "X friends are watching this" on show cards

---

### Tier 3: Future Considerations
Long-term features that require more investment.

#### 9. Mobile App (React Native)
- Native iOS/Android experience
- Push notifications
- Offline access to watchlist
- Quick-add from streaming apps

#### 10. Browser Extension
- Auto-detect what user is watching on Netflix/etc.
- One-click add to watchlist
- Mark as watched automatically

#### 11. Calendar Integration
- Export to Google Calendar, Apple Calendar
- iCal feed for upcoming episodes

#### 12. Watch Party Scheduling
- Coordinate viewing times with friends
- Countdown to episode air
- Group chat integration

---

## Product Preferences & Guidelines

### Keep It Simple
- Start with v1 minimal implementation (e.g., email only before adding push)
- Avoid feature creep
- Ship, get feedback, iterate

### Security First
- Tokens should expire (1 hour for password reset, 24 hours for email verification)
- Single-use tokens where applicable
- Don't reveal if email exists in public endpoints
- Never store plaintext passwords (bcrypt with 12 rounds)

### User Experience
- Dark mode support for all new features
- Mobile-responsive design
- Toast notifications for user feedback (bottom-right position)
- Clear loading states

### Technical Decisions
- Separate frontend/backend deployments (allows independent scaling)
- Supabase for relational data (PostgreSQL)
- Resend for transactional email
- TMDB for show data (comprehensive, free tier)

---

## Engineering Learnings

### Vercel Deployment
- Frontend and backend are separate Vercel projects
- Both must be configured to auto-deploy from `main` branch
- Cron jobs require Pro plan for frequencies less than daily
- Empty commits can trigger redeployment: `git commit --allow-empty -m "Trigger deploy"`

### Email with Resend
- Can use `onboarding@resend.dev` for testing without domain verification
- 3,000 free emails/month is sufficient for MVP
- React Email templates work well but plain HTML is simpler to start

### TMDB API
- Rate limit: ~40 requests/second
- Batch polling: 30 shows per cron run to stay safe
- Episode data includes air dates, useful for notifications
- Watch providers vary by region

### Database Patterns
- Use indices on frequently queried columns (e.g., tokens)
- Partial indices for nullable columns (`WHERE column IS NOT NULL`)
- Timestamp columns for expiration logic

---

## Rejected/Deferred Ideas

### Real-time Notifications (WebSocket)
- Complexity not justified for MVP
- Email/push covers the use case
- Consider later for social features

### Multiple User Profiles per Account
- Adds significant complexity
- Users can create separate accounts
- Consider for family tier later

### Show Recommendations Engine
- Requires ML/collaborative filtering
- Third-party APIs exist but add cost
- Can revisit when user base grows

---

## Questions to Revisit

1. **Monetization timing**: When to introduce ads? After reaching X users?
2. **Premium features**: What would be worth paying for?
3. **Mobile priority**: Should mobile app come before web push?
4. **Social features**: How important vs. solo tracking experience?

---

## Changelog

- **2026-02-03**: Created roadmap document
- **2026-02-02**: Implemented email notifications, password reset, dark mode
