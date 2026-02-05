import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Database service class
export class DatabaseService {
  // Test database connection
  static async testConnection() {
    try {
      const { data, error } = await supabase
        .from('shows')
        .select('count')
        .limit(1);
      
      if (error) throw error;
      
      console.log('✅ Database connection successful');
      return true;
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      return false;
    }
  }

  // Get popular shows
  static async getPopularShows(limit: number = 20) {
    try {
      const { data, error } = await supabase
        .from('shows')
        .select('*')
        .order('popularity', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching popular shows:', error);
      return [];
    }
  }

  // Search shows by title
  static async searchShows(query: string, limit: number = 20) {
    try {
      const { data, error } = await supabase
        .from('shows')
        .select('*')
        .ilike('title', `%${query}%`)
        .order('popularity', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching shows:', error);
      return [];
    }
  }

  // Get show by TMDB ID
  static async getShowByTmdbId(tmdbId: number) {
    try {
      const { data, error } = await supabase
        .from('shows')
        .select('*')
        .eq('tmdb_id', tmdbId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching show by TMDB ID:', error);
      return null;
    }
  }

  // Insert or update show
  static async upsertShow(showData: any) {
    try {
      console.log('Attempting to upsert show:', { tmdb_id: showData.tmdb_id, title: showData.title });
      
      const { data, error } = await supabase
        .from('shows')
        .upsert(showData, { onConflict: 'tmdb_id' })
        .select()
        .single();

      if (error) {
        console.error('Supabase upsert error:', error);
        throw error;
      }
      
      console.log('Show upserted successfully:', { id: data.id, title: data.title });
      return data;
    } catch (error) {
      console.error('Error upserting show:', error);
      return null;
    }
  }

  // Get user's followed shows
  static async getUserShows(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_shows')
        .select(`
          *,
          shows (*)
        `)
        .eq('user_id', userId)
        .eq('is_following', true);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user shows:', error);
      return [];
    }
  }

  // Follow a show
  static async followShow(userId: string, showId: string) {
    try {
      console.log('Attempting to follow show:', { userId, showId });
      
      const { data, error } = await supabase
        .from('user_shows')
        .upsert({
          user_id: userId,
          show_id: showId,
          is_following: true,
          watch_status: 'want_to_watch'
        }, { onConflict: 'user_id,show_id' })
        .select()
        .single();

      if (error) {
        console.error('Supabase follow show error:', error);
        throw error;
      }
      
      console.log('Show followed successfully:', { id: data.id });
      return data;
    } catch (error) {
      console.error('Error following show:', error);
      return null;
    }
  }

  // Unfollow a show
  static async unfollowShow(userId: string, showId: string) {
    try {
      const { error } = await supabase
        .from('user_shows')
        .delete()
        .eq('user_id', userId)
        .eq('show_id', showId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error unfollowing show:', error);
      return false;
    }
  }

  // ===== WATCHLIST MANAGEMENT METHODS =====

  // Get user's watchlist with show details
  static async getUserWatchlist(userId: string, status?: string, page: number = 1, limit: number = 50) {
    try {
      let query = supabase
        .from('user_shows')
        .select(`
          *,
          shows (
            id,
            tmdb_id,
            title,
            overview,
            poster_path,
            backdrop_path,
            first_air_date,
            last_air_date,
            status,
            type,
            genres,
            rating,
            popularity
          )
        `)
        .eq('user_id', userId)
        .eq('is_following', true);

      // Only filter by status if the column exists and status is not 'all'
      if (status && status !== 'all') {
        query = query.eq('watch_status', status);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (error) {
        console.error('Supabase getUserWatchlist error:', error);
        throw error;
      }

      // Add default values for missing columns
      const processedData = (data || []).map(item => ({
        ...item,
        watch_status: item.watch_status || 'want_to_watch',
        current_season: item.current_season || 1,
        current_episode: item.current_episode || 1,
        notes: item.notes || null,
        updated_at: item.updated_at || item.created_at
      }));

      return processedData;
    } catch (error) {
      console.error('Error fetching user watchlist:', error);
      return [];
    }
  }

  // Update show status in watchlist
  static async updateShowStatus(userId: string, showId: string, updateData: {
    status?: string;
    currentSeason?: number;
    currentEpisode?: number;
    notes?: string;
  }) {
    try {
      // Build update object dynamically to avoid setting undefined values
      const updateFields: any = {
        updated_at: new Date().toISOString()
      };

      // Only include fields that are actually provided
      if (updateData.status !== undefined) {
        updateFields.watch_status = updateData.status;
      }
      if (updateData.currentSeason !== undefined) {
        updateFields.current_season = updateData.currentSeason;
      }
      if (updateData.currentEpisode !== undefined) {
        updateFields.current_episode = updateData.currentEpisode;
      }
      if (updateData.notes !== undefined) {
        updateFields.notes = updateData.notes;
      }

      const { data, error } = await supabase
        .from('user_shows')
        .update(updateFields)
        .eq('user_id', userId)
        .eq('show_id', showId)
        .select()
        .single();

      if (error) {
        console.error('Supabase updateShowStatus error:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error updating show status:', error);
      return null;
    }
  }

  // Remove show from watchlist (soft delete with timestamp)
  static async removeFromWatchlist(userId: string, showId: string) {
    try {
      const { data, error } = await supabase
        .from('user_shows')
        .update({ 
          is_following: false,
          deleted_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('show_id', showId)
        .select()
        .single();

      if (error) {
        console.error('Supabase removeFromWatchlist error:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error removing show from watchlist:', error);
      return null;
    }
  }

  // Bulk update status
  static async bulkUpdateStatus(userId: string, showIds: string[], status: string) {
    try {
      const { data, error } = await supabase
        .from('user_shows')
        .update({
          watch_status: status,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .in('show_id', showIds)
        .select();

      if (error) {
        console.error('Supabase bulkUpdateStatus error:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error bulk updating status:', error);
      return [];
    }
  }

  // Bulk remove from watchlist
  static async bulkRemoveFromWatchlist(userId: string, showIds: string[]) {
    try {
      const { data, error } = await supabase
        .from('user_shows')
        .update({ is_following: false })
        .eq('user_id', userId)
        .in('show_id', showIds)
        .select();

      if (error) {
        console.error('Supabase bulkRemoveFromWatchlist error:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error bulk removing from watchlist:', error);
      return [];
    }
  }

  // ===== NOTIFICATION SYSTEM METHODS =====

  // ----- Episode Cache Methods -----

  // Get cached episodes for a show
  static async getEpisodeCache(showId: string) {
    try {
      const { data, error } = await supabase
        .from('episode_cache')
        .select('*')
        .eq('show_id', showId)
        .order('season_number', { ascending: true })
        .order('episode_number', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching episode cache:', error);
      return [];
    }
  }

  // Upsert episodes to cache (returns newly inserted episodes)
  static async upsertEpisodeCache(episodes: {
    show_id: string;
    tmdb_id: number;
    season_number: number;
    episode_number: number;
    title?: string;
    air_date?: string;
  }[]) {
    try {
      if (episodes.length === 0) return { inserted: [], existing: [] };

      // First, get existing episodes for comparison
      const showId = episodes[0].show_id;
      const existing = await this.getEpisodeCache(showId);
      const existingKeys = new Set(
        existing.map(e => `${e.season_number}-${e.episode_number}`)
      );

      // Split into new and existing
      const newEpisodes = episodes.filter(
        e => !existingKeys.has(`${e.season_number}-${e.episode_number}`)
      );

      if (newEpisodes.length === 0) {
        return { inserted: [], existing };
      }

      // Insert new episodes
      const { data, error } = await supabase
        .from('episode_cache')
        .insert(newEpisodes)
        .select();

      if (error) throw error;

      return { inserted: data || [], existing };
    } catch (error) {
      console.error('Error upserting episode cache:', error);
      return { inserted: [], existing: [] };
    }
  }

  // ----- Notification Log Methods -----

  // Check if notification already sent
  static async hasNotificationBeenSent(
    userId: string,
    showId: string,
    notificationType: 'new_episode' | 'season_premiere',
    seasonNumber?: number,
    episodeNumber?: number
  ) {
    try {
      let query = supabase
        .from('notification_log')
        .select('id')
        .eq('user_id', userId)
        .eq('show_id', showId)
        .eq('notification_type', notificationType);

      if (seasonNumber !== undefined) {
        query = query.eq('season_number', seasonNumber);
      }
      if (episodeNumber !== undefined) {
        query = query.eq('episode_number', episodeNumber);
      }

      const { data, error } = await query.limit(1);

      if (error) throw error;
      return (data && data.length > 0);
    } catch (error) {
      console.error('Error checking notification log:', error);
      return false;
    }
  }

  // Log a sent notification
  static async logNotification(
    userId: string,
    showId: string,
    notificationType: 'new_episode' | 'season_premiere',
    seasonNumber?: number,
    episodeNumber?: number,
    resendMessageId?: string
  ) {
    try {
      const { data, error } = await supabase
        .from('notification_log')
        .insert({
          user_id: userId,
          show_id: showId,
          notification_type: notificationType,
          season_number: seasonNumber,
          episode_number: episodeNumber,
          resend_message_id: resendMessageId
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error logging notification:', error);
      return null;
    }
  }

  // Get user's notification history
  static async getUserNotificationHistory(userId: string, limit: number = 50) {
    try {
      const { data, error } = await supabase
        .from('notification_log')
        .select(`
          *,
          shows (title, poster_path)
        `)
        .eq('user_id', userId)
        .order('email_sent_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching notification history:', error);
      return [];
    }
  }

  // ----- Episode Poll Status Methods -----

  // Get shows due for polling
  static async getShowsDueForPolling(limit: number = 30) {
    try {
      const { data, error } = await supabase
        .from('episode_poll_status')
        .select(`
          *,
          shows (id, tmdb_id, title, status)
        `)
        .lte('next_poll_at', new Date().toISOString())
        .order('next_poll_at', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching shows due for polling:', error);
      return [];
    }
  }

  // Update poll status after polling
  static async updatePollStatus(
    showId: string,
    lastKnownSeason: number,
    lastKnownEpisode: number,
    errorMessage?: string
  ) {
    try {
      const now = new Date();
      // Schedule next poll: 6 hours if no error, 1 hour if error (retry sooner)
      const nextPollHours = errorMessage ? 1 : 6;
      const nextPoll = new Date(now.getTime() + nextPollHours * 60 * 60 * 1000);

      const updateData: any = {
        last_polled_at: now.toISOString(),
        next_poll_at: nextPoll.toISOString(),
        last_known_season: lastKnownSeason,
        last_known_episode: lastKnownEpisode
      };

      if (errorMessage) {
        updateData.last_error = errorMessage;
        // Increment error count (for backoff logic if needed)
        const { data: current } = await supabase
          .from('episode_poll_status')
          .select('error_count')
          .eq('show_id', showId)
          .single();
        updateData.error_count = (current?.error_count || 0) + 1;
      } else {
        updateData.error_count = 0;
        updateData.last_error = null;
      }

      const { data, error } = await supabase
        .from('episode_poll_status')
        .update(updateData)
        .eq('show_id', showId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating poll status:', error);
      return null;
    }
  }

  // Initialize poll status for a show (when user starts tracking)
  static async initializePollStatus(showId: string, tmdbId: number) {
    try {
      const { data, error } = await supabase
        .from('episode_poll_status')
        .upsert({
          show_id: showId,
          tmdb_id: tmdbId,
          next_poll_at: new Date().toISOString()
        }, { onConflict: 'show_id' })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error initializing poll status:', error);
      return null;
    }
  }

  // ----- User Email Verification Methods -----

  // Set email verification token
  static async setEmailVerificationToken(userId: string, token: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          email_verification_token: token,
          email_verification_sent_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error setting verification token:', error);
      return null;
    }
  }

  // Verify email with token
  static async verifyEmail(token: string) {
    try {
      // Find user with this token
      const { data: user, error: findError } = await supabase
        .from('users')
        .select('id, email, email_verified')
        .eq('email_verification_token', token)
        .single();

      if (findError || !user) {
        return { success: false, error: 'Invalid or expired verification token' };
      }

      if (user.email_verified) {
        return { success: true, message: 'You can now receive email notifications from Scout', user };
      }

      // Update user as verified (keep token so re-clicks still work)
      const { data, error } = await supabase
        .from('users')
        .update({
          email_verified: true
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      return { success: true, message: 'You can now receive email notifications from Scout', user: data };
    } catch (error) {
      console.error('Error verifying email:', error);
      return { success: false, error: 'Failed to verify email' };
    }
  }

  // Get user email verification status
  static async getUserEmailStatus(userId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('email, email_verified, email_verification_sent_at')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user email status:', error);
      return null;
    }
  }

  // ----- User Show Notification Toggle Methods -----

  // Toggle notifications for a specific show
  static async toggleShowNotifications(userId: string, showId: string, enabled: boolean) {
    try {
      const { data, error } = await supabase
        .from('user_shows')
        .update({ notifications_enabled: enabled })
        .eq('user_id', userId)
        .eq('show_id', showId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error toggling show notifications:', error);
      return null;
    }
  }

  // Get users to notify for a show (verified email, notifications enabled)
  static async getUsersToNotifyForShow(showId: string) {
    try {
      const { data, error } = await supabase
        .from('user_shows')
        .select(`
          user_id,
          notifications_enabled,
          users (
            id,
            email,
            name,
            email_verified,
            notification_preferences
          )
        `)
        .eq('show_id', showId)
        .eq('is_following', true)
        .eq('notifications_enabled', true);

      if (error) throw error;

      // Filter for verified users with new episodes enabled
      const usersToNotify = (data || [])
        .filter(item => {
          const user = item.users as any;
          return (
            user &&
            user.email_verified &&
            user.notification_preferences?.newEpisodes !== false
          );
        })
        .map(item => item.users);

      return usersToNotify;
    } catch (error) {
      console.error('Error fetching users to notify:', error);
      return [];
    }
  }

  // Get all shows being tracked by any user (for polling)
  static async getTrackedShows() {
    try {
      const { data, error } = await supabase
        .from('user_shows')
        .select(`
          show_id,
          shows (id, tmdb_id, title, status)
        `)
        .eq('is_following', true)
        .not('shows', 'is', null);

      if (error) throw error;

      // Get unique shows
      const showsMap = new Map();
      (data || []).forEach(item => {
        if (item.shows && !showsMap.has(item.show_id)) {
          showsMap.set(item.show_id, item.shows);
        }
      });

      return Array.from(showsMap.values());
    } catch (error) {
      console.error('Error fetching tracked shows:', error);
      return [];
    }
  }

  // ----- Password Reset Methods -----

  // Set password reset token for a user by email
  static async setPasswordResetToken(email: string, token: string, expiresAt: Date) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          password_reset_token: token,
          password_reset_expires_at: expiresAt.toISOString()
        })
        .eq('email', email)
        .select('id, email, name')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error setting password reset token:', error);
      return null;
    }
  }

  // Get user by valid (non-expired) password reset token
  static async getUserByResetToken(token: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, name, password_reset_expires_at')
        .eq('password_reset_token', token)
        .single();

      if (error || !data) {
        return null;
      }

      // Check if token is expired
      if (data.password_reset_expires_at) {
        const expiresAt = new Date(data.password_reset_expires_at);
        if (expiresAt < new Date()) {
          return null; // Token expired
        }
      }

      return data;
    } catch (error) {
      console.error('Error getting user by reset token:', error);
      return null;
    }
  }

  // Clear password reset token after use
  static async clearPasswordResetToken(userId: string) {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          password_reset_token: null,
          password_reset_expires_at: null
        })
        .eq('id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error clearing password reset token:', error);
      return false;
    }
  }

  // Update user password
  static async updatePassword(userId: string, passwordHash: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          password_hash: passwordHash,
          password_reset_token: null,
          password_reset_expires_at: null
        })
        .eq('id', userId)
        .select('id, email')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating password:', error);
      return null;
    }
  }

  // Check if user exists by email (for forgot password - don't reveal if exists)
  static async getUserByEmail(email: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, name')
        .eq('email', email)
        .single();

      if (error) return null;
      return data;
    } catch (error) {
      return null;
    }
  }

  // ----- Daily Digest Methods -----

  // Insert a single pending notification event (ON CONFLICT DO NOTHING)
  static async insertPendingEvent(event: {
    user_id: string;
    show_id: string;
    event_type: string;
    season_number?: number;
    episode_number?: number;
    episode_title?: string;
    air_date?: string;
    poster_path?: string;
    show_title: string;
  }) {
    try {
      const { data, error } = await supabase
        .from('pending_notification_events')
        .upsert(event, {
          onConflict: 'user_id,show_id,event_type,season_number,episode_number',
          ignoreDuplicates: true
        })
        .select()
        .single();

      if (error && error.code !== '23505') throw error; // Ignore unique constraint violations
      return data;
    } catch (error) {
      console.error('Error inserting pending event:', error);
      return null;
    }
  }

  // Batch insert pending notification events
  static async bulkInsertPendingEvents(events: Array<{
    user_id: string;
    show_id: string;
    event_type: string;
    season_number?: number;
    episode_number?: number;
    episode_title?: string;
    air_date?: string;
    poster_path?: string;
    show_title: string;
  }>) {
    try {
      if (events.length === 0) return { inserted: 0 };

      const { data, error } = await supabase
        .from('pending_notification_events')
        .upsert(events, {
          onConflict: 'user_id,show_id,event_type,season_number,episode_number',
          ignoreDuplicates: true
        })
        .select();

      if (error) throw error;
      return { inserted: data?.length || 0 };
    } catch (error) {
      console.error('Error bulk inserting pending events:', error);
      return { inserted: 0 };
    }
  }

  // Get all users who have unprocessed pending events
  static async getUsersWithPendingEvents() {
    try {
      const { data, error } = await supabase
        .from('pending_notification_events')
        .select('user_id')
        .is('processed_at', null);

      if (error) throw error;

      // Get unique user IDs
      const userIds = [...new Set((data || []).map(item => item.user_id))];
      if (userIds.length === 0) return [];

      // Fetch user details
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email, name, email_verified, notification_preferences')
        .in('id', userIds);

      if (usersError) throw usersError;
      return users || [];
    } catch (error) {
      console.error('Error fetching users with pending events:', error);
      return [];
    }
  }

  // Get all unprocessed pending events for a specific user
  static async getPendingEventsForUser(userId: string) {
    try {
      const { data, error } = await supabase
        .from('pending_notification_events')
        .select('*')
        .eq('user_id', userId)
        .is('processed_at', null)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching pending events for user:', error);
      return [];
    }
  }

  // Mark pending events as processed
  static async markEventsProcessed(eventIds: string[], digestId: string) {
    try {
      if (eventIds.length === 0) return true;

      const { error } = await supabase
        .from('pending_notification_events')
        .update({
          processed_at: new Date().toISOString(),
          digest_id: digestId
        })
        .in('id', eventIds);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking events as processed:', error);
      return false;
    }
  }

  // Log a digest email sent to a user
  static async logDigest(userId: string, digestDate: string, eventCount: number, resendMessageId?: string) {
    try {
      const { data, error } = await supabase
        .from('digest_log')
        .upsert({
          user_id: userId,
          digest_date: digestDate,
          event_count: eventCount,
          resend_message_id: resendMessageId
        }, {
          onConflict: 'user_id,digest_date'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error logging digest:', error);
      return null;
    }
  }

  // Check if a digest has already been sent to a user for a given date
  static async hasDigestBeenSent(userId: string, digestDate: string) {
    try {
      const { data, error } = await supabase
        .from('digest_log')
        .select('id')
        .eq('user_id', userId)
        .eq('digest_date', digestDate)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
      return !!data;
    } catch (error) {
      return false;
    }
  }

  // Get upcoming episodes from episode_cache (air_date within next N days, not yet aired)
  static async getUpcomingEpisodes(daysAhead: number = 14) {
    try {
      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysAhead);

      const todayStr = now.toISOString().split('T')[0];
      const futureStr = futureDate.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('episode_cache')
        .select(`
          *,
          shows (id, title, poster_path, tmdb_id)
        `)
        .gt('air_date', todayStr)
        .lte('air_date', futureStr)
        .order('air_date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching upcoming episodes:', error);
      return [];
    }
  }
}




