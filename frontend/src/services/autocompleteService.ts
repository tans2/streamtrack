// Auto-complete service for search suggestions
export interface AutocompleteItem {
  id: number;
  title: string;
  year?: string;
  type: 'show' | 'movie';
  poster_path?: string;
  popularity: number;
}

interface AutocompleteCache {
  [key: string]: {
    data: AutocompleteItem[];
    timestamp: number;
    expiresAt: number;
  };
}

class AutocompleteService {
  private cache: AutocompleteCache = {};
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
  private readonly MIN_QUERY_LENGTH = 2;
  private readonly MAX_SUGGESTIONS = 8;

  // Generate cache key
  private generateCacheKey(query: string): string {
    return query.toLowerCase().trim();
  }

  // Check if cache entry is valid
  private isCacheValid(cacheEntry: { timestamp: number; expiresAt: number }): boolean {
    return Date.now() < cacheEntry.expiresAt;
  }

  // Get suggestions from cache
  private getCachedSuggestions(query: string): AutocompleteItem[] | null {
    const cacheKey = this.generateCacheKey(query);
    const cached = this.cache[cacheKey];
    
    if (cached && this.isCacheValid(cached)) {
      return cached.data;
    }
    
    // Remove expired cache entry
    if (cached) {
      delete this.cache[cacheKey];
    }
    
    return null;
  }

  // Cache suggestions
  private setCachedSuggestions(query: string, data: AutocompleteItem[]): void {
    const cacheKey = this.generateCacheKey(query);
    const now = Date.now();
    
    this.cache[cacheKey] = {
      data,
      timestamp: now,
      expiresAt: now + this.CACHE_DURATION
    };
  }

  // Get autocomplete suggestions
  async getSuggestions(query: string): Promise<AutocompleteItem[]> {
    // Return empty array for short queries
    if (query.length < this.MIN_QUERY_LENGTH) {
      return [];
    }

    // Check cache first
    const cached = this.getCachedSuggestions(query);
    if (cached) {
      return cached;
    }

    try {
      // Fetch from our backend API instead of directly calling TMDB
      const response = await fetch(
        `http://localhost:5001/api/shows/search?q=${encodeURIComponent(query)}&page=1`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch suggestions');
      }

      const data = await response.json();
      
      // Transform and filter results
      const suggestions: AutocompleteItem[] = data.results
        .slice(0, this.MAX_SUGGESTIONS)
        .map((item: any) => ({
          id: item.id,
          title: item.name,
          year: item.first_air_date ? new Date(item.first_air_date).getFullYear().toString() : undefined,
          type: 'show' as const,
          poster_path: item.poster_path,
          popularity: item.popularity
        }))
        .sort((a: AutocompleteItem, b: AutocompleteItem) => b.popularity - a.popularity);

      // Cache the results
      this.setCachedSuggestions(query, suggestions);

      return suggestions;
    } catch (error) {
      console.error('Error fetching autocomplete suggestions:', error);
      return [];
    }
  }

  // Get popular shows for initial suggestions
  async getPopularSuggestions(): Promise<AutocompleteItem[]> {
    const cacheKey = 'popular_shows';
    const cached = this.cache[cacheKey];
    
    if (cached && this.isCacheValid(cached)) {
      return cached.data;
    }

    try {
      const response = await fetch(
        `http://localhost:5001/api/shows/popular?page=1`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch popular shows');
      }

      const data = await response.json();
      
      const suggestions: AutocompleteItem[] = data.results
        .slice(0, this.MAX_SUGGESTIONS)
        .map((item: any) => ({
          id: item.id,
          title: item.name,
          year: item.first_air_date ? new Date(item.first_air_date).getFullYear().toString() : undefined,
          type: 'show' as const,
          poster_path: item.poster_path,
          popularity: item.popularity
        }));

      // Cache popular shows for longer
      const now = Date.now();
      this.cache[cacheKey] = {
        data: suggestions,
        timestamp: now,
        expiresAt: now + (30 * 60 * 1000) // 30 minutes
      };

      return suggestions;
    } catch (error) {
      console.error('Error fetching popular suggestions:', error);
      return [];
    }
  }

  // Clear cache
  clearCache(): void {
    this.cache = {};
  }

  // Get cache statistics
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: Object.keys(this.cache).length,
      entries: Object.keys(this.cache)
    };
  }
}

// Export singleton instance
export const autocompleteService = new AutocompleteService();
export default autocompleteService;
