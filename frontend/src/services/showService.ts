import apiClient, { handleApiResponse, handleApiError } from './api';
import { AxiosError } from 'axios';

export interface Show {
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
  year?: string;
  totalSeasons?: number;
  providers?: any[];
  availability?: {
    flatrate: any[];
    free: any[];
    ads: any[];
    rent: any[];
    buy: any[];
  };
  seasonAvailability?: {
    season: number;
    country: string;
    providers: {
      id: number;
      name: string;
      logo_path: string;
    }[];
    availability: {
      flatrate: any[];
      free: any[];
      ads: any[];
      rent: any[];
      buy: any[];
    };
  }[];
  matchesFilters?: boolean;
  titleMatchScore?: number;
}

export interface SearchFilters {
  country?: string;
  providers?: string[];
  subscription?: string;
  page?: number;
  limit?: number;
  seasonMode?: 'compact' | 'all' | 'none';
}

export interface SearchResponse {
  data: Show[];
  pagination: {
    page: number;
    total_pages: number;
    total_results: number;
  };
  searchInfo?: {
    originalQuery: string;
    searchTitle: string;
    searchYear?: string;
  };
}

class ShowService {
  // Search shows with filters
  async searchShows(query: string, filters: SearchFilters = {}): Promise<Show[]> {
    try {
      const params = new URLSearchParams({
        q: query,
        ...(filters.country && { country: filters.country }),
        ...(filters.providers && filters.providers.length > 0 && { providers: filters.providers.join(',') }),
        ...(filters.subscription && { subscription: filters.subscription }),
        ...(filters.page && { page: filters.page.toString() }),
        ...(filters.limit && { limit: filters.limit.toString() }),
        ...(filters.seasonMode && { seasonMode: filters.seasonMode }),
      });

      const response = await apiClient.get(`/api/shows/universal-search?${params}`);
      return handleApiResponse<Show[]>(response);
    } catch (error) {
      throw new Error(handleApiError(error as AxiosError));
    }
  }

  // Get popular shows
  async getPopularShows(page: number = 1, limit: number = 20): Promise<{ shows: Show[]; pagination: any }> {
    try {
      const response = await apiClient.get('/api/shows/popular', {
        params: { page, limit },
      });
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error as AxiosError));
    }
  }

  // Get show details by TMDB ID
  async getShowDetails(tmdbId: number): Promise<Show> {
    try {
      const response = await apiClient.get(`/api/shows/${tmdbId}`);
      return handleApiResponse<Show>(response);
    } catch (error) {
      throw new Error(handleApiError(error as AxiosError));
    }
  }

  // Get trending shows
  async getTrendingShows(limit: number = 20): Promise<Show[]> {
    try {
      const response = await apiClient.get('/api/shows/trending/daily', {
        params: { limit },
      });
      return handleApiResponse<Show[]>(response);
    } catch (error) {
      throw new Error(handleApiError(error as AxiosError));
    }
  }

  // Get shows by genre
  async getShowsByGenre(genreId: number, page: number = 1, limit: number = 20): Promise<{ shows: Show[]; pagination: any }> {
    try {
      const response = await apiClient.get(`/api/shows/genre/${genreId}`, {
        params: { page, limit },
      });
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error as AxiosError));
    }
  }

  // Simple search (fallback)
  async simpleSearch(query: string, page: number = 1, limit: number = 20): Promise<{ shows: Show[]; pagination: any }> {
    try {
      const response = await apiClient.get('/api/shows/search', {
        params: { q: query, page, limit },
      });
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error as AxiosError));
    }
  }
}

export const showService = new ShowService();
export default showService;
