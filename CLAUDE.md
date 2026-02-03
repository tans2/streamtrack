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

---

## Database Migrations

### Notifications Migration (`backend/supabase/migrations/001_notifications.sql`)
Run in Supabase SQL Editor to enable notifications feature.

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
Configured in `backend/vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/poll-episodes",
    "schedule": "0 */6 * * *"
  }]
}
```

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

---

## Known Issues & Solutions

### Backend Not Auto-Deploying
**Issue:** Frontend deploys but backend doesn't when pushing to main.
**Solution:** Ensure backend Vercel project is configured:
1. Go to Vercel → Backend project → Settings → Git
2. Set Production Branch to `main`
3. Ensure "Auto-Deploy" is enabled

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
- [ ] Weekly digest email
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

## Contact & Resources
- **GitHub**: https://github.com/tans2/streamtrack
- **TMDB API**: Used for show data and episode information
- **Resend**: Email delivery service (3,000 free emails/month)
