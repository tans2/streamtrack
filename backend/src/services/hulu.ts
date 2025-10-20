import axios from 'axios';
import { HuluDatabaseService } from './hulu-database';

export interface HuluUser {
  id: string;
  email: string;
  displayName: string;
  profileName: string;
  connectedAt: string;
  lastSyncAt?: string;
  isActive: boolean;
}

export interface HuluShow {
  huluId: string;
  title: string;
  currentSeason: number;
  currentEpisode: number;
  totalSeasons: number;
  totalEpisodes: number;
  lastWatched: string;
  nextEpisodeDate?: string;
  isCompleted: boolean;
  progressPercentage: number;
}

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

export class HuluService {
  private static readonly TMDB_API_BASE = 'https://api.themoviedb.org/3';
  private static readonly TMDB_API_KEY = process.env.TMDB_API_KEY;
  
  // Rate limiting for TMDB API (1000 calls per day)
  private static readonly TMDB_DAILY_LIMIT = 1000;
  private static readonly TMDB_RESET_TIME = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  private static apiCallCount = 0;
  private static lastResetTime = Date.now();

  // Check if we can make an API call
  private static canMakeApiCall(): boolean {
    const now = Date.now();
    
    // Reset counter if 24 hours have passed
    if (now - this.lastResetTime >= this.TMDB_RESET_TIME) {
      this.apiCallCount = 0;
      this.lastResetTime = now;
    }
    
    return this.apiCallCount < this.TMDB_DAILY_LIMIT;
  }

  // Increment API call counter
  private static incrementApiCallCount(): void {
    this.apiCallCount++;
  }

  // Get remaining API calls for today
  static getRemainingApiCalls(): number {
    const now = Date.now();
    
    // Reset counter if 24 hours have passed
    if (now - this.lastResetTime >= this.TMDB_RESET_TIME) {
      this.apiCallCount = 0;
      this.lastResetTime = now;
    }
    
    return Math.max(0, this.TMDB_DAILY_LIMIT - this.apiCallCount);
  }

  // Simulate Hulu OAuth flow (since real OAuth isn't available)
  static async initiateAuth(userId: string): Promise<{ authUrl: string; state: string }> {
    const state = `hulu_${userId}_${Date.now()}`;
    
    // In a real implementation, this would redirect to Hulu OAuth
    // For now, we'll simulate the flow
    const authUrl = `https://auth.hulu.com/oauth/authorize?client_id=${process.env.HULU_CLIENT_ID}&redirect_uri=${process.env.FRONTEND_URL}/hulu/callback&response_type=code&state=${state}&scope=profile,watchlist,progress`;
    
    return { authUrl, state };
  }

  // Simulate getting user profile after "OAuth" callback
  static async getUserProfile(authCode: string, state: string): Promise<HuluUser> {
    // In a real implementation, this would exchange auth code for access token
    // For now, we'll simulate a successful connection
    
    const userId = state.split('_')[1];
    
    const connectionData = {
      user_id: userId,
      hulu_id: `hulu_${userId}`,
      email: `user${userId}@hulu.com`,
      display_name: 'Hulu User',
      profile_name: 'Main Profile',
      is_active: true,
      connected_at: new Date().toISOString()
    };

    // Save to database
    const connection = await HuluDatabaseService.createConnection(connectionData);
    
    return {
      id: connection?.hulu_id || `hulu_${userId}`,
      email: connection?.email || `user${userId}@hulu.com`,
      displayName: connection?.display_name || 'Hulu User',
      profileName: connection?.profile_name || 'Main Profile',
      connectedAt: connection?.connected_at || new Date().toISOString(),
      isActive: connection?.is_active || true
    };
  }

  // Get Hulu catalog for a show using TMDB API
  static async getHuluCatalog(tmdbId: number, country: string = 'US'): Promise<any> {
    try {
      console.log(`Fetching Hulu catalog for TMDB ID: ${tmdbId} in ${country}`);
      
      if (!this.TMDB_API_KEY) {
        console.warn('TMDB_API_KEY not found, using mock data');
        return {
          huluId: `hulu_${tmdbId}`,
          isAvailable: Math.random() > 0.4, // 60% chance of being available
          seasons: Math.floor(Math.random() * 5) + 1,
          episodes: Math.floor(Math.random() * 20) + 10,
          releaseDate: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        };
      }

      // Check rate limit
      if (!this.canMakeApiCall()) {
        console.warn(`TMDB API daily limit reached (${this.TMDB_DAILY_LIMIT} calls). Using cached data or mock data.`);
        return {
          huluId: `hulu_${tmdbId}`,
          isAvailable: false,
          seasons: 0,
          episodes: 0,
          releaseDate: null,
          lastUpdated: new Date().toISOString(),
          rateLimited: true
        };
      }

      // Get show details from TMDB
      const showResponse = await axios.get(`${this.TMDB_API_BASE}/tv/${tmdbId}`, {
        params: { api_key: this.TMDB_API_KEY }
      });

      // Get watch providers from TMDB
      const providersResponse = await axios.get(`${this.TMDB_API_BASE}/tv/${tmdbId}/watch/providers`, {
        params: { api_key: this.TMDB_API_KEY }
      });

      // Increment API call counter (2 calls made)
      this.incrementApiCallCount();
      this.incrementApiCallCount();

      const show = showResponse.data;
      const providers = providersResponse.data.results?.[country] || {};

      // Check if Hulu is available
      const huluProviders = [
        ...(providers.flatrate || []),
        ...(providers.free || []),
        ...(providers.ads || [])
      ].filter(provider => 
        provider.provider_name?.toLowerCase().includes('hulu') ||
        provider.provider_id === 15 // Hulu's TMDB provider ID
      );

      const isAvailable = huluProviders.length > 0;

      return {
        huluId: `hulu_${tmdbId}`,
        isAvailable,
        seasons: show.number_of_seasons || 1,
        episodes: show.number_of_episodes || 10,
        releaseDate: show.first_air_date,
        lastUpdated: new Date().toISOString(),
        title: show.name,
        synopsis: show.overview,
        rating: show.vote_average,
        year: new Date(show.first_air_date).getFullYear(),
        providers: huluProviders
      };
    } catch (error) {
      console.error('Error fetching Hulu catalog:', error);
      // Fallback to mock data on API error
      return {
        huluId: `hulu_${tmdbId}`,
        isAvailable: Math.random() > 0.4,
        seasons: Math.floor(Math.random() * 5) + 1,
        episodes: Math.floor(Math.random() * 20) + 10,
        releaseDate: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };
    }
  }

  // Get next episode release date for a show using TMDB API
  static async getNextEpisodeDate(tmdbId: number, currentSeason: number, currentEpisode: number): Promise<string | null> {
    try {
      console.log(`Getting next episode date for TMDB ${tmdbId}, S${currentSeason}E${currentEpisode}`);
      
      const tmdbApiKey = process.env.TMDB_API_KEY;
      if (!tmdbApiKey) {
        console.warn('TMDB_API_KEY not found, using mock data');
        const nextEpisodeDate = new Date();
        nextEpisodeDate.setDate(nextEpisodeDate.getDate() + 7);
        return nextEpisodeDate.toISOString();
      }

      // Get show details to find total seasons
      const showResponse = await axios.get(`https://api.themoviedb.org/3/tv/${tmdbId}`, {
        params: { api_key: tmdbApiKey }
      });

      const show = showResponse.data;
      const totalSeasons = show.number_of_seasons;

      // Check if there's a next episode in current season
      if (currentSeason <= totalSeasons) {
        const seasonResponse = await axios.get(`https://api.themoviedb.org/3/tv/${tmdbId}/season/${currentSeason}`, {
          params: { api_key: tmdbApiKey }
        });

        const season = seasonResponse.data;
        const totalEpisodes = season.episodes.length;

        // If there's a next episode in current season
        if (currentEpisode < totalEpisodes) {
          const nextEpisode = season.episodes[currentEpisode]; // 0-indexed
          if (nextEpisode.air_date) {
            return nextEpisode.air_date;
          }
        }

        // If we're at the end of current season, check next season
        if (currentSeason < totalSeasons) {
          const nextSeasonResponse = await axios.get(`https://api.themoviedb.org/3/tv/${tmdbId}/season/${currentSeason + 1}`, {
            params: { api_key: tmdbApiKey }
          });

          const nextSeason = nextSeasonResponse.data;
          if (nextSeason.episodes && nextSeason.episodes.length > 0) {
            const firstEpisode = nextSeason.episodes[0];
            if (firstEpisode.air_date) {
              return firstEpisode.air_date;
            }
          }
        }
      }

      // If no next episode found, return null
      return null;
    } catch (error) {
      console.error('Error getting next episode date:', error);
      return null;
    }
  }

  // Sync user's Hulu progress (manual input for now)
  static async syncProgress(
    userId: string, 
    tmdbId: number, 
    currentSeason: number, 
    currentEpisode: number
  ): Promise<HuluShow | null> {
    try {
      console.log(`Syncing Hulu progress for user ${userId}, show ${tmdbId}, S${currentSeason}E${currentEpisode}`);
      
      // Check if show is available on Hulu
      const catalog = await this.getHuluCatalog(tmdbId);
      if (!catalog.isAvailable) {
        console.log(`Show ${tmdbId} not available on Hulu`);
        return null;
      }

      // Calculate progress
      const totalEpisodes = catalog.episodes || 10;
      const progressPercentage = Math.min(100, ((currentSeason - 1) * (totalEpisodes / catalog.seasons) + currentEpisode) / totalEpisodes * 100);
      
      const progressData = {
        user_id: userId,
        tmdb_id: tmdbId,
        hulu_id: catalog.huluId,
        title: catalog.title || `Show ${tmdbId}`,
        current_season: currentSeason,
        current_episode: currentEpisode,
        total_seasons: catalog.seasons || 1,
        total_episodes: totalEpisodes,
        last_watched: new Date().toISOString(),
        next_episode_date: (await this.getNextEpisodeDate(tmdbId, currentSeason, currentEpisode)) || undefined,
        is_completed: progressPercentage >= 100,
        progress_percentage: progressPercentage,
        last_synced_at: new Date().toISOString()
      };

      // Save to database
      const progress = await HuluDatabaseService.upsertShowProgress(progressData);
      
      if (!progress) {
        console.error('Failed to save Hulu progress to database');
        return null;
      }

      return {
        huluId: progress.hulu_id,
        title: progress.title,
        currentSeason: progress.current_season,
        currentEpisode: progress.current_episode,
        totalSeasons: progress.total_seasons,
        totalEpisodes: progress.total_episodes,
        lastWatched: progress.last_watched,
        nextEpisodeDate: progress.next_episode_date || undefined,
        isCompleted: progress.is_completed,
        progressPercentage: progress.progress_percentage
      };
    } catch (error) {
      console.error('Error syncing Hulu progress:', error);
      return null;
    }
  }

  // Get user's Hulu watchlist
  static async getUserWatchlist(userId: string): Promise<HuluShow[]> {
    try {
      console.log(`Getting Hulu watchlist for user ${userId}`);
      
      const progressList = await HuluDatabaseService.getShowProgress(userId);
      
      if (!Array.isArray(progressList)) {
        return [];
      }

      return progressList.map(progress => ({
        huluId: progress.hulu_id,
        title: progress.title,
        currentSeason: progress.current_season,
        currentEpisode: progress.current_episode,
        totalSeasons: progress.total_seasons,
        totalEpisodes: progress.total_episodes,
        lastWatched: progress.last_watched,
        nextEpisodeDate: progress.next_episode_date || undefined,
        isCompleted: progress.is_completed,
        progressPercentage: progress.progress_percentage
      }));
    } catch (error) {
      console.error('Error getting Hulu watchlist:', error);
      return [];
    }
  }

  // Check if a show is available on Hulu
  static async isShowAvailable(tmdbId: number, country: string = 'US'): Promise<boolean> {
    try {
      const catalog = await this.getHuluCatalog(tmdbId, country);
      return catalog.isAvailable;
    } catch (error) {
      console.error('Error checking Hulu availability:', error);
      return false;
    }
  }

  // Disconnect Hulu account
  static async disconnectAccount(userId: string): Promise<boolean> {
    try {
      console.log(`Disconnecting Hulu account for user ${userId}`);
      
      const success = await HuluDatabaseService.deleteConnection(userId);
      return success;
    } catch (error) {
      console.error('Error disconnecting Hulu account:', error);
      return false;
    }
  }
}

export default HuluService;
