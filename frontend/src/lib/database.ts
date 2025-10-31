import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase client
// During build, use placeholder values to avoid errors
// In runtime, these will be validated and proper client will be created
const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key';

// Create client - will fail at runtime if env vars are missing, but allows build to succeed
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

  // Quick add to watchlist (with re-add logic)
  static async quickAddToWatchlist(userId: string, showId: string) {
    try {
      // Check if user already has this show in their watchlist
      const { data: existingFollow, error: fetchError } = await supabase
        .from('user_shows')
        .select('*')
        .eq('user_id', userId)
        .eq('show_id', showId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows found
        throw fetchError;
      }

      if (existingFollow) {
        if (!existingFollow.is_following) {
          // Check if it was deleted within the last day for recovery
          const deletedAt = existingFollow.deleted_at ? new Date(existingFollow.deleted_at) : null;
          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

          if (deletedAt && deletedAt > oneDayAgo) {
            // Restore with original status and data
            const { data, error } = await supabase
              .from('user_shows')
              .update({
                is_following: true,
                watch_status: existingFollow.watch_status || 'want_to_watch',
                current_season: existingFollow.current_season || 1,
                current_episode: existingFollow.current_episode || 1,
                notes: existingFollow.notes,
                deleted_at: null,
                updated_at: new Date().toISOString()
              })
              .eq('user_id', userId)
              .eq('show_id', showId)
              .select()
              .single();

            if (error) throw error;
            return data;
          } else {
            // Treat as new show
            const { data, error } = await supabase
              .from('user_shows')
              .update({
                is_following: true,
                watch_status: 'want_to_watch',
                current_season: 1,
                current_episode: 1,
                notes: null,
                deleted_at: null,
                updated_at: new Date().toISOString()
              })
              .eq('user_id', userId)
              .eq('show_id', showId)
              .select()
              .single();

            if (error) throw error;
            return data;
          }
        } else {
          // Already actively following
          throw new Error('Show is already in watchlist');
        }
      } else {
        // First time adding
        const { data, error } = await supabase
          .from('user_shows')
          .insert({
            user_id: userId,
            show_id: showId,
            is_following: true,
            watch_status: 'want_to_watch',
            current_season: 1,
            current_episode: 1,
            notes: null
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Error in quickAddToWatchlist:', error);
      throw error;
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
}
