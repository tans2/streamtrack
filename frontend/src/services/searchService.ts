// Search service with caching and debouncing
interface SearchCache {
  [key: string]: {
    data: any;
    timestamp: number;
    expiresAt: number;
  };
}

interface SearchHistoryItem {
  query: string;
  timestamp: number;
  resultCount: number;
}

class SearchService {
  private cache: SearchCache = {};
  private searchHistory: SearchHistoryItem[] = [];
  private debounceTimer: NodeJS.Timeout | null = null;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_HISTORY = 20;
  private readonly DEBOUNCE_DELAY = 300; // 300ms

  // Generate cache key from search parameters
  private generateCacheKey(query: string, country: string, subscription: string, providers: number[]): string {
    const sortedProviders = [...providers].sort().join(',');
    return `${query.toLowerCase()}_${country}_${subscription}_${sortedProviders}`;
  }

  // Check if cache entry is still valid
  private isCacheValid(cacheEntry: { timestamp: number; expiresAt: number }): boolean {
    return Date.now() < cacheEntry.expiresAt;
  }

  // Get cached search results
  getCachedResults(query: string, country: string, subscription: string, providers: number[]): any | null {
    const cacheKey = this.generateCacheKey(query, country, subscription, providers);
    const cached = this.cache[cacheKey];
    
    if (cached && this.isCacheValid(cached)) {
      console.log('Returning cached search results for:', query);
      return cached.data;
    }
    
    // Remove expired cache entry
    if (cached) {
      delete this.cache[cacheKey];
    }
    
    return null;
  }

  // Cache search results
  setCachedResults(query: string, country: string, subscription: string, providers: number[], data: any): void {
    const cacheKey = this.generateCacheKey(query, country, subscription, providers);
    const now = Date.now();
    
    this.cache[cacheKey] = {
      data,
      timestamp: now,
      expiresAt: now + this.CACHE_DURATION
    };
    
    console.log('Cached search results for:', query);
  }

  // Add search to history
  addToHistory(query: string, resultCount: number): void {
    // Remove existing entry if it exists
    this.searchHistory = this.searchHistory.filter(item => item.query !== query);
    
    // Add new entry at the beginning
    this.searchHistory.unshift({
      query,
      timestamp: Date.now(),
      resultCount
    });
    
    // Keep only the most recent searches
    if (this.searchHistory.length > this.MAX_HISTORY) {
      this.searchHistory = this.searchHistory.slice(0, this.MAX_HISTORY);
    }
    
    // Save to localStorage
    this.saveHistoryToStorage();
  }

  // Get search history
  getSearchHistory(): SearchHistoryItem[] {
    return this.searchHistory;
  }

  // Clear search history
  clearHistory(): void {
    this.searchHistory = [];
    this.saveHistoryToStorage();
  }

  // Save history to localStorage
  private saveHistoryToStorage(): void {
    try {
      localStorage.setItem('streamtrack_search_history', JSON.stringify(this.searchHistory));
    } catch (error) {
      console.warn('Failed to save search history to localStorage:', error);
    }
  }

  // Load history from localStorage
  loadHistoryFromStorage(): void {
    try {
      const stored = localStorage.getItem('streamtrack_search_history');
      if (stored) {
        this.searchHistory = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load search history from localStorage:', error);
      this.searchHistory = [];
    }
  }

  // Debounced search function
  debouncedSearch(
    searchFn: () => Promise<void>,
    delay: number = this.DEBOUNCE_DELAY
  ): void {
    // Clear existing timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    // Set new timer
    this.debounceTimer = setTimeout(() => {
      searchFn();
    }, delay);
  }

  // Cancel debounced search
  cancelDebouncedSearch(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  // Get cache statistics
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: Object.keys(this.cache).length,
      entries: Object.keys(this.cache)
    };
  }

  // Clear cache
  clearCache(): void {
    this.cache = {};
    console.log('Search cache cleared');
  }

  // Clear expired cache entries
  clearExpiredCache(): void {
    const now = Date.now();
    let clearedCount = 0;
    
    Object.keys(this.cache).forEach(key => {
      if (!this.isCacheValid(this.cache[key])) {
        delete this.cache[key];
        clearedCount++;
      }
    });
    
    if (clearedCount > 0) {
      console.log(`Cleared ${clearedCount} expired cache entries`);
    }
  }
}

// Export singleton instance
export const searchService = new SearchService();

// Auto-clear expired cache every 10 minutes
setInterval(() => {
  searchService.clearExpiredCache();
}, 10 * 60 * 1000);

export default searchService;

