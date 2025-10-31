import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// During build, use placeholder to avoid errors
// In runtime, actual API key will be used
const TMDB_API_KEY = process.env.TMDB_API_KEY || 'placeholder-key';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// TMDB API service class
export class TMDBService {
  private static api = axios.create({
    baseURL: TMDB_BASE_URL,
    params: {
      api_key: TMDB_API_KEY,
      language: 'en-US'
    }
  });

  // Helper to normalize a TMDB TV result into our canonical shape
  private static normalizeShowFromResult(show: any) {
    return {
      tmdb_id: show.id,
      title: show.name,
      overview: show.overview,
      poster_path: show.poster_path,
      backdrop_path: show.backdrop_path,
      first_air_date: show.first_air_date,
      last_air_date: show.last_air_date,
      status: show.status,
      type: 'tv',
      genres: show.genre_ids,
      rating: show.vote_average,
      popularity: show.popularity
    };
  }

  // Get popular TV shows
  static async getPopularShows(page: number = 1, limit: number = 20) {
    try {
      const response = await this.api.get('/tv/popular', {
        params: { page }
      });

      const shows = response.data.results
        .slice(0, limit)
        .map((show: any) => this.normalizeShowFromResult(show));

      return {
        shows,
        total_pages: response.data.total_pages,
        total_results: response.data.total_results,
        page: response.data.page
      };
    } catch (error) {
      console.error('Error fetching popular shows from TMDB:', error);
      return { shows: [], total_pages: 0, total_results: 0, page: 1 };
    }
  }

  // Search TV shows
  static async searchShows(query: string, page: number = 1, limit: number = 20) {
    try {
      const response = await this.api.get('/search/tv', {
        params: {
          query,
          page,
          include_adult: false
        }
      });

      const shows = response.data.results
        .slice(0, limit)
        .map((show: any) => this.normalizeShowFromResult(show));

      return {
        shows,
        total_pages: response.data.total_pages,
        total_results: response.data.total_results,
        page: response.data.page
      };
    } catch (error) {
      console.error('Error searching shows from TMDB:', error);
      return { shows: [], total_pages: 0, total_results: 0, page: 1 };
    }
  }

  // Get watch providers for a TV show (by country)
  static async getWatchProviders(tmdbId: number, countryCode: string = 'US') {
    try {
      const response = await this.api.get(`/tv/${tmdbId}/watch/providers`);
      const country = response.data.results?.[countryCode];
      if (!country) {
        return {
          country: countryCode,
          providers: [],
          availability: {
            flatrate: [],
            free: [],
            ads: [],
            rent: [],
            buy: []
          }
        };
      }

      const toSimple = (arr: any[] | undefined) =>
        (arr || []).map((p: any) => ({ id: p.provider_id, name: p.provider_name, logo_path: p.logo_path }));

      return {
        country: countryCode,
        providers: toSimple(country.flatrate)
          .concat(toSimple(country.free))
          .concat(toSimple(country.ads))
          .concat(toSimple(country.rent))
          .concat(toSimple(country.buy)),
        availability: {
          flatrate: toSimple(country.flatrate),
          free: toSimple(country.free),
          ads: toSimple(country.ads),
          rent: toSimple(country.rent),
          buy: toSimple(country.buy)
        }
      };
    } catch (error) {
      console.error(`Error fetching watch providers for ${tmdbId}:`, error);
      return {
        country: countryCode,
        providers: [],
        availability: { flatrate: [], free: [], ads: [], rent: [], buy: [] }
      };
    }
  }

  // Get watch providers for a specific season
  static async getSeasonWatchProviders(tmdbId: number, seasonNumber: number, countryCode: string = 'US') {
    try {
      const response = await this.api.get(`/tv/${tmdbId}/season/${seasonNumber}/watch/providers`);
      const country = response.data.results?.[countryCode];
      if (!country) {
        return {
          season: seasonNumber,
          country: countryCode,
          providers: [],
          availability: {
            flatrate: [],
            free: [],
            ads: [],
            rent: [],
            buy: []
          }
        };
      }

      const toSimple = (arr: any[] | undefined) =>
        (arr || []).map((p: any) => ({ id: p.provider_id, name: p.provider_name, logo_path: p.logo_path }));

      return {
        season: seasonNumber,
        country: countryCode,
        providers: toSimple(country.flatrate)
          .concat(toSimple(country.free))
          .concat(toSimple(country.ads))
          .concat(toSimple(country.rent))
          .concat(toSimple(country.buy)),
        availability: {
          flatrate: toSimple(country.flatrate),
          free: toSimple(country.free),
          ads: toSimple(country.ads),
          rent: toSimple(country.rent),
          buy: toSimple(country.buy)
        }
      };
    } catch (error) {
      console.error(`Error fetching season ${seasonNumber} watch providers for ${tmdbId}:`, error);
      return {
        season: seasonNumber,
        country: countryCode,
        providers: [],
        availability: { flatrate: [], free: [], ads: [], rent: [], buy: [] }
      };
    }
  }

  // Get show details by TMDB ID
  static async getShowDetails(tmdbId: number) {
    try {
      const response = await this.api.get(`/tv/${tmdbId}`);
      const show = response.data;

      return {
        tmdb_id: show.id,
        title: show.name,
        overview: show.overview,
        poster_path: show.poster_path,
        backdrop_path: show.backdrop_path,
        first_air_date: show.first_air_date,
        last_air_date: show.last_air_date,
        status: show.status,
        type: 'tv',
        genres: show.genres?.map((g: any) => g.name) || [],
        rating: show.vote_average,
        popularity: show.popularity,
        episode_run_time: show.episode_run_time,
        number_of_seasons: show.number_of_seasons,
        number_of_episodes: show.number_of_episodes,
        in_production: show.in_production,
        networks: show.networks,
        production_companies: show.production_companies
      };
    } catch (error) {
      console.error(`Error fetching show details for TMDB ID ${tmdbId}:`, error);
      return null;
    }
  }

  // Get show seasons
  static async getShowSeasons(tmdbId: number, seasonNumber: number) {
    try {
      const response = await this.api.get(`/tv/${tmdbId}/season/${seasonNumber}`);
      const season = response.data;

      return {
        tmdb_show_id: tmdbId,
        season_number: season.season_number,
        name: season.name,
        overview: season.overview,
        poster_path: season.poster_path,
        air_date: season.air_date,
        episode_count: season.episodes?.length || 0,
        episodes: season.episodes?.map((episode: any) => ({
          episode_number: episode.episode_number,
          title: episode.name,
          overview: episode.overview,
          still_path: episode.still_path,
          air_date: episode.air_date,
          runtime: episode.runtime
        })) || []
      };
    } catch (error) {
      console.error(`Error fetching season ${seasonNumber} for show ${tmdbId}:`, error);
      return null;
    }
  }

  // Get trending shows (daily)
  static async getTrendingShows(limit: number = 20) {
    try {
      const response = await this.api.get('/trending/tv/day');

      const shows = response.data.results.slice(0, limit).map((show: any) => ({
        tmdb_id: show.id,
        title: show.name,
        overview: show.overview,
        poster_path: show.poster_path,
        backdrop_path: show.backdrop_path,
        first_air_date: show.first_air_date,
        last_air_date: show.last_air_date,
        status: show.status,
        type: 'tv',
        genres: show.genre_ids,
        rating: show.vote_average,
        popularity: show.popularity
      }));

      return shows;
    } catch (error) {
      console.error('Error fetching trending shows from TMDB:', error);
      return [];
    }
  }

  // Get shows by genre
  static async getShowsByGenre(genreId: number, page: number = 1, limit: number = 20) {
    try {
      const response = await this.api.get('/discover/tv', {
        params: {
          with_genres: genreId,
          page,
          sort_by: 'popularity.desc',
          include_adult: false
        }
      });

      const shows = response.data.results.slice(0, limit).map((show: any) => ({
        tmdb_id: show.id,
        title: show.name,
        overview: show.overview,
        poster_path: show.poster_path,
        backdrop_path: show.backdrop_path,
        first_air_date: show.first_air_date,
        last_air_date: show.last_air_date,
        status: show.status,
        type: 'tv',
        genres: show.genre_ids,
        rating: show.vote_average,
        popularity: show.popularity
      }));

      return {
        shows,
        total_pages: response.data.total_pages,
        total_results: response.data.total_results,
        page: response.data.page
      };
    } catch (error) {
      console.error(`Error fetching shows by genre ${genreId}:`, error);
      return { shows: [], total_pages: 0, total_results: 0, page: 1 };
    }
  }

  // Test TMDB API connection
  static async testConnection() {
    try {
      const response = await this.api.get('/tv/popular', { params: { page: 1 } });
      console.log('✅ TMDB API connection successful');
      return true;
    } catch (error) {
      console.error('❌ TMDB API connection failed:', error);
      return false;
    }
  }
}
