import apiClient, { handleApiResponse, handleApiError, buildApiUrl } from './api';
import { AxiosError } from 'axios';

export interface WatchlistItem {
  id: string;
  user_id: string;
  show_id: string;
  is_following: boolean;
  watch_status: 'want_to_watch' | 'watching' | 'completed' | 'dropped';
  current_season: number;
  current_episode: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  shows: {
    id: string;
    tmdb_id: number;
    title: string;
    overview: string;
    poster_path?: string;
    backdrop_path?: string;
    first_air_date?: string;
    last_air_date?: string;
    status: string;
    type: string;
    genres: any[];
    rating: number;
    popularity: number;
  };
}

export interface WatchlistResponse {
  data: WatchlistItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface UpdateStatusRequest {
  status?: 'want_to_watch' | 'watching' | 'completed' | 'dropped';
  currentSeason?: number;
  currentEpisode?: number;
  notes?: string;
}

export interface BulkUpdateRequest {
  action: 'update_status' | 'remove';
  showIds: string[];
  status?: 'want_to_watch' | 'watching' | 'completed' | 'dropped';
}

class WatchlistService {
  // Get user's watchlist
  async getWatchlist(
    status?: 'want_to_watch' | 'watching' | 'completed' | 'dropped' | 'all',
    page: number = 1,
    limit: number = 50
  ): Promise<WatchlistItem[]> {
    try {
      const params: any = { page, limit };
      if (status && status !== 'all') {
        params.status = status;
      }

      const response = await apiClient.get(buildApiUrl('shows/watchlist'), { params });
      return handleApiResponse<WatchlistItem[]>(response);
    } catch (error) {
      throw new Error(handleApiError(error as AxiosError));
    }
  }

  // Add show to watchlist by TMDB ID
  async addToWatchlist(tmdbId: number): Promise<{ show: any; followed: any }> {
    try {
      const response = await apiClient.post(`/api/shows/${tmdbId}/quick-add`);
      return handleApiResponse<{ show: any; followed: any }>(response);
    } catch (error) {
      throw new Error(handleApiError(error as AxiosError));
    }
  }

  // Update show status in watchlist
  async updateShowStatus(showId: string, updateData: UpdateStatusRequest): Promise<WatchlistItem> {
    try {
      const response = await apiClient.put(`/api/shows/watchlist/${showId}/status`, updateData);
      return handleApiResponse<WatchlistItem>(response);
    } catch (error) {
      throw new Error(handleApiError(error as AxiosError));
    }
  }

  // Remove show from watchlist
  async removeFromWatchlist(showId: string): Promise<void> {
    try {
      await apiClient.delete(`/api/shows/watchlist/${showId}`);
    } catch (error) {
      throw new Error(handleApiError(error as AxiosError));
    }
  }

  // Bulk update watchlist
  async bulkUpdate(bulkData: BulkUpdateRequest): Promise<any[]> {
    try {
      const response = await apiClient.put(buildApiUrl('shows/watchlist/bulk'), bulkData);
      return handleApiResponse<any[]>(response);
    } catch (error) {
      throw new Error(handleApiError(error as AxiosError));
    }
  }

  // Bulk update status
  async bulkUpdateStatus(showIds: string[], status: 'want_to_watch' | 'watching' | 'completed' | 'dropped'): Promise<any[]> {
    return this.bulkUpdate({
      action: 'update_status',
      showIds,
      status,
    });
  }

  // Bulk remove from watchlist
  async bulkRemoveFromWatchlist(showIds: string[]): Promise<any[]> {
    return this.bulkUpdate({
      action: 'remove',
      showIds,
    });
  }
}

export const watchlistService = new WatchlistService();
export default watchlistService;
