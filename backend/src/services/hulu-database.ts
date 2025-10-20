import { supabase } from './database';

export interface HuluConnection {
  id: string;
  user_id: string;
  hulu_id: string;
  email: string;
  display_name: string;
  profile_name: string;
  avatar_url?: string;
  is_active: boolean;
  connected_at: string;
  last_sync_at?: string;
  created_at: string;
  updated_at: string;
}

export interface HuluShowProgress {
  id: string;
  user_id: string;
  tmdb_id: number;
  hulu_id: string;
  title: string;
  current_season: number;
  current_episode: number;
  total_seasons: number;
  total_episodes: number;
  last_watched: string;
  next_episode_date?: string;
  is_completed: boolean;
  progress_percentage: number;
  last_synced_at: string;
  created_at: string;
  updated_at: string;
}

export interface HuluAvailability {
  id: string;
  tmdb_id: number;
  hulu_id: string;
  country_code: string;
  is_available: boolean;
  title?: string;
  synopsis?: string;
  rating?: number;
  year?: number;
  seasons?: number;
  episodes?: number;
  release_date?: string;
  last_checked: string;
  created_at: string;
  updated_at: string;
}

export class HuluDatabaseService {
  // ===== HULU CONNECTION METHODS =====

  static async createConnection(connectionData: Omit<HuluConnection, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await supabase
        .from('hulu_connections')
        .insert(connectionData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating Hulu connection:', error);
      return null;
    }
  }

  static async getConnection(userId: string): Promise<HuluConnection | null> {
    try {
      const { data, error } = await supabase
        .from('hulu_connections')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // No rows found
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error getting Hulu connection:', error);
      return null;
    }
  }

  static async updateConnection(userId: string, updateData: Partial<HuluConnection>) {
    try {
      const { data, error } = await supabase
        .from('hulu_connections')
        .update({ ...updateData, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating Hulu connection:', error);
      return null;
    }
  }

  static async deleteConnection(userId: string) {
    try {
      const { error } = await supabase
        .from('hulu_connections')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting Hulu connection:', error);
      return false;
    }
  }

  // ===== HULU SHOW PROGRESS METHODS =====

  static async upsertShowProgress(progressData: Omit<HuluShowProgress, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await supabase
        .from('hulu_show_progress')
        .upsert(progressData, { onConflict: 'user_id,tmdb_id' })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error upserting Hulu show progress:', error);
      return null;
    }
  }

  static async getShowProgress(userId: string, tmdbId?: number): Promise<HuluShowProgress | HuluShowProgress[] | null> {
    try {
      let query = supabase
        .from('hulu_show_progress')
        .select('*')
        .eq('user_id', userId);

      if (tmdbId) {
        query = query.eq('tmdb_id', tmdbId);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (tmdbId) {
        return data?.[0] || null;
      }
      return data || [];
    } catch (error) {
      console.error('Error getting Hulu show progress:', error);
      return null;
    }
  }

  static async updateShowProgress(userId: string, tmdbId: number, updateData: Partial<HuluShowProgress>) {
    try {
      const { data, error } = await supabase
        .from('hulu_show_progress')
        .update({ ...updateData, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('tmdb_id', tmdbId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating Hulu show progress:', error);
      return null;
    }
  }

  static async deleteShowProgress(userId: string, tmdbId: number) {
    try {
      const { error } = await supabase
        .from('hulu_show_progress')
        .delete()
        .eq('user_id', userId)
        .eq('tmdb_id', tmdbId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting Hulu show progress:', error);
      return false;
    }
  }

  // ===== HULU AVAILABILITY METHODS =====

  static async upsertAvailability(availabilityData: Omit<HuluAvailability, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await supabase
        .from('hulu_availability')
        .upsert(availabilityData, { onConflict: 'tmdb_id,country_code' })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error upserting Hulu availability:', error);
      return null;
    }
  }

  static async getAvailability(tmdbId: number, countryCode: string = 'US'): Promise<HuluAvailability | null> {
    try {
      const { data, error } = await supabase
        .from('hulu_availability')
        .select('*')
        .eq('tmdb_id', tmdbId)
        .eq('country_code', countryCode)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // No rows found
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error getting Hulu availability:', error);
      return null;
    }
  }

  static async getAvailableShows(countryCode: string = 'US', limit: number = 50): Promise<HuluAvailability[]> {
    try {
      const { data, error } = await supabase
        .from('hulu_availability')
        .select('*')
        .eq('country_code', countryCode)
        .eq('is_available', true)
        .order('last_checked', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting available shows:', error);
      return [];
    }
  }

  // ===== EPISODE NOTIFICATIONS METHODS =====

  static async createEpisodeNotification(notificationData: Omit<EpisodeNotification, 'id' | 'created_at'>) {
    try {
      const { data, error } = await supabase
        .from('episode_notifications')
        .insert(notificationData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating episode notification:', error);
      return null;
    }
  }

  static async getPendingNotifications(userId: string): Promise<EpisodeNotification[]> {
    try {
      const { data, error } = await supabase
        .from('episode_notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('notification_sent', false)
        .lte('air_date', new Date().toISOString())
        .order('air_date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting pending notifications:', error);
      return [];
    }
  }

  static async markNotificationSent(notificationId: string) {
    try {
      const { error } = await supabase
        .from('episode_notifications')
        .update({ 
          notification_sent: true, 
          notification_sent_at: new Date().toISOString() 
        })
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking notification as sent:', error);
      return false;
    }
  }
}

interface EpisodeNotification {
  id: string;
  user_id: string;
  tmdb_id: number;
  season_number: number;
  episode_number: number;
  episode_title?: string;
  air_date: string;
  notification_sent: boolean;
  notification_sent_at?: string;
  created_at: string;
}

export default HuluDatabaseService;

