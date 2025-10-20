import axios from 'axios';
import { NetflixDatabaseService } from './netflix-database';

export interface NetflixShow {
  netflixId: string;
  title: string;
  currentSeason: number;
  currentEpisode: number;
  totalSeasons: number;
  totalEpisodes: number;
  lastWatched: string;
  nextEpisodeDate?: string;
  isCompleted: boolean;
}

export interface NetflixUser {
  id: string;
  email: string;
  displayName: string;
  profileName: string;
  avatarUrl?: string;
  connectedAt: string;
  lastSyncAt?: string;
  isActive: boolean;
}

export class NetflixService {
  private static readonly UNOGS_API_BASE = 'https://unogs-unogs-v1.p.rapidapi.com';
  private static readonly REELGOOD_API_BASE = 'https://reelgood.com/api/v2';
  private static readonly UNOGS_API_KEY = process.env.UNOGS_API_KEY;
  private static readonly REELGOOD_API_KEY = process.env.REELGOOD_API_KEY;
  
  // Rate limiting for uNoGS API (99 calls per day)
  private static readonly UNOGS_DAILY_LIMIT = 99;
  private static readonly UNOGS_RESET_TIME = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  private static apiCallCount = 0;
  private static lastResetTime = Date.now();

  // Check if we can make an API call
  private static canMakeApiCall(): boolean {
    const now = Date.now();
    
    // Reset counter if 24 hours have passed
    if (now - this.lastResetTime >= this.UNOGS_RESET_TIME) {
      this.apiCallCount = 0;
      this.lastResetTime = now;
    }
    
    return this.apiCallCount < this.UNOGS_DAILY_LIMIT;
  }

  // Increment API call counter
  private static incrementApiCallCount(): void {
    this.apiCallCount++;
  }

  // Get remaining API calls for today
  static getRemainingApiCalls(): number {
    const now = Date.now();
    
    // Reset counter if 24 hours have passed
    if (now - this.lastResetTime >= this.UNOGS_RESET_TIME) {
      this.apiCallCount = 0;
      this.lastResetTime = now;
    }
    
    return Math.max(0, this.UNOGS_DAILY_LIMIT - this.apiCallCount);
  }

  // Simulate Netflix OAuth flow (since real OAuth isn't available)
  static async initiateAuth(userId: string): Promise<{ authUrl: string; state: string }> {
    const state = `netflix_${userId}_${Date.now()}`;
    
    // In a real implementation, this would redirect to Netflix OAuth
    // For now, we'll simulate the flow
    const authUrl = `https://www.netflix.com/login?redirect_url=${encodeURIComponent(
      `${process.env.FRONTEND_URL}/auth/netflix/callback?state=${state}`
    )}`;
    
    return { authUrl, state };
  }

  // Simulate getting user profile after "OAuth" callback
  static async getUserProfile(authCode: string, state: string): Promise<NetflixUser> {
    // In a real implementation, this would exchange auth code for access token
    // For now, we'll simulate a successful connection
    
    const userId = state.split('_')[1];
    
    const connectionData = {
      user_id: userId,
      netflix_id: `netflix_${userId}`,
      email: `user${userId}@netflix.com`,
      display_name: 'Netflix User',
      profile_name: 'Main Profile',
      is_active: true,
      connected_at: new Date().toISOString()
    };

    // Save to database
    const connection = await NetflixDatabaseService.createConnection(connectionData);
    
    return {
      id: connection?.netflix_id || `netflix_${userId}`,
      email: connection?.email || `user${userId}@netflix.com`,
      displayName: connection?.display_name || 'Netflix User',
      profileName: connection?.profile_name || 'Main Profile',
      connectedAt: connection?.connected_at || new Date().toISOString(),
      isActive: connection?.is_active || true
    };
  }

  // Get Netflix catalog for a show using uNoGS API
  static async getNetflixCatalog(tmdbId: number, country: string = 'US'): Promise<any> {
    try {
      console.log(`Fetching Netflix catalog for TMDB ID: ${tmdbId} in ${country}`);
      
      if (!this.UNOGS_API_KEY) {
        console.warn('UNOGS_API_KEY not found, using mock data');
        return {
          netflixId: `nf_${tmdbId}`,
          isAvailable: Math.random() > 0.3,
          seasons: Math.floor(Math.random() * 5) + 1,
          episodes: Math.floor(Math.random() * 20) + 10,
          releaseDate: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        };
      }

      // Check rate limit
      if (!this.canMakeApiCall()) {
        console.warn(`uNoGS API daily limit reached (${this.UNOGS_DAILY_LIMIT} calls). Using cached data or mock data.`);
        return {
          netflixId: `nf_${tmdbId}`,
          isAvailable: false,
          seasons: 0,
          episodes: 0,
          releaseDate: null,
          lastUpdated: new Date().toISOString(),
          rateLimited: true
        };
      }

      // Real uNoGS API call
      const response = await axios.get(`${this.UNOGS_API_BASE}/search/titles`, {
        headers: {
          'X-RapidAPI-Key': this.UNOGS_API_KEY,
          'X-RapidAPI-Host': 'unogs-unogs-v1.p.rapidapi.com'
        },
        params: {
          query: tmdbId.toString(),
          country_list: country,
          order_by: 'date',
          type: 'series'
        }
      });

      // Increment API call counter
      this.incrementApiCallCount();

      const data = response.data;
      
      if (data.results && data.results.length > 0) {
        const show = data.results[0];
        return {
          netflixId: show.netflix_id,
          isAvailable: true,
          seasons: show.seasons || 1,
          episodes: show.episodes || 10,
          releaseDate: show.release_date,
          lastUpdated: new Date().toISOString(),
          title: show.title,
          synopsis: show.synopsis,
          rating: show.rating,
          year: show.year
        };
      }

      return {
        netflixId: `nf_${tmdbId}`,
        isAvailable: false,
        seasons: 0,
        episodes: 0,
        releaseDate: null,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching Netflix catalog:', error);
      // Fallback to mock data on API error
      return {
        netflixId: `nf_${tmdbId}`,
        isAvailable: Math.random() > 0.3,
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

  // Sync user's Netflix progress (manual input for now)
  static async syncProgress(
    userId: string, 
    tmdbId: number, 
    currentSeason: number, 
    currentEpisode: number
  ): Promise<NetflixShow | null> {
    try {
      console.log(`Syncing Netflix progress for user ${userId}, show ${tmdbId}, S${currentSeason}E${currentEpisode}`);
      
      // Get show details from TMDB
      const showDetails = await this.getNetflixCatalog(tmdbId);
      
      if (!showDetails || !showDetails.isAvailable) {
        return null;
      }

      const nextEpisodeDate = await this.getNextEpisodeDate(tmdbId, currentSeason, currentEpisode);
      
      return {
        netflixId: showDetails.netflixId,
        title: `Show ${tmdbId}`, // Would get from TMDB
        currentSeason,
        currentEpisode,
        totalSeasons: showDetails.seasons,
        totalEpisodes: showDetails.episodes,
        lastWatched: new Date().toISOString(),
        nextEpisodeDate: nextEpisodeDate || undefined,
        isCompleted: currentSeason >= showDetails.seasons && currentEpisode >= showDetails.episodes
      };
    } catch (error) {
      console.error('Error syncing Netflix progress:', error);
      return null;
    }
  }

  // Get user's Netflix watchlist
  static async getUserWatchlist(userId: string): Promise<NetflixShow[]> {
    try {
      console.log(`Getting Netflix watchlist for user ${userId}`);
      
      // In a real implementation, this would fetch from Netflix API
      // For now, return mock data
      return [
        {
          netflixId: 'nf_123',
          title: 'Stranger Things',
          currentSeason: 4,
          currentEpisode: 8,
          totalSeasons: 4,
          totalEpisodes: 34,
          lastWatched: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          nextEpisodeDate: undefined,
          isCompleted: true
        },
        {
          netflixId: 'nf_456',
          title: 'The Crown',
          currentSeason: 5,
          currentEpisode: 3,
          totalSeasons: 6,
          totalEpisodes: 60,
          lastWatched: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          nextEpisodeDate: new Date(Date.now() + 604800000).toISOString(), // 1 week from now
          isCompleted: false
        }
      ];
    } catch (error) {
      console.error('Error getting Netflix watchlist:', error);
      return [];
    }
  }

  // Disconnect Netflix account
  static async disconnectAccount(userId: string): Promise<boolean> {
    try {
      console.log(`Disconnecting Netflix account for user ${userId}`);
      
      // In a real implementation, this would revoke the access token
      // and remove the connection from the database
      
      return true;
    } catch (error) {
      console.error('Error disconnecting Netflix account:', error);
      return false;
    }
  }

  // Check if show is available on Netflix
  static async isShowAvailable(tmdbId: number, country: string = 'US'): Promise<boolean> {
    try {
      const catalog = await this.getNetflixCatalog(tmdbId, country);
      return catalog?.isAvailable || false;
    } catch (error) {
      console.error('Error checking Netflix availability:', error);
      return false;
    }
  }
}

export default NetflixService;
