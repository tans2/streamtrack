// Platform logo service for fetching and caching actual platform logos
interface PlatformLogo {
  id: number;
  name: string;
  logo_path: string;
  origin_country: string;
}

interface LogoCache {
  [key: number]: {
    logo: PlatformLogo;
    timestamp: number;
    expiresAt: number;
  };
}

class PlatformLogoService {
  private cache: LogoCache = {};
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private readonly TMDB_LOGO_BASE = 'https://image.tmdb.org/t/p/w92';

  // Check if cache entry is valid
  private isCacheValid(cacheEntry: { timestamp: number; expiresAt: number }): boolean {
    return Date.now() < cacheEntry.expiresAt;
  }

  // Get cached logo
  private getCachedLogo(providerId: number): PlatformLogo | null {
    const cached = this.cache[providerId];
    if (cached && this.isCacheValid(cached)) {
      return cached.logo;
    }
    
    // Remove expired cache entry
    if (cached) {
      delete this.cache[providerId];
    }
    
    return null;
  }

  // Cache logo
  private setCachedLogo(providerId: number, logo: PlatformLogo): void {
    const now = Date.now();
    this.cache[providerId] = {
      logo,
      timestamp: now,
      expiresAt: now + this.CACHE_DURATION
    };
  }

  // Fetch platform logo from TMDB
  async getPlatformLogo(providerId: number): Promise<PlatformLogo | null> {
    // Check cache first
    const cached = this.getCachedLogo(providerId);
    if (cached) {
      return cached;
    }

    // For now, return null to use emoji fallbacks until backend is properly set up
    // This prevents the service from making failed API calls
    console.log(`Platform logo service: Using emoji fallback for provider ${providerId}`);
    return null;
  }

  // Get logo URL for display
  getLogoUrl(logoPath: string, size: 'small' | 'medium' | 'large' = 'medium'): string {
    const sizeMap = {
      small: 'w45',
      medium: 'w92',
      large: 'w185'
    };
    
    return `${this.TMDB_LOGO_BASE.replace('w92', sizeMap[size])}${logoPath}`;
  }

  // Get multiple platform logos
  async getPlatformLogos(providerIds: number[]): Promise<Map<number, PlatformLogo>> {
    const logos = new Map<number, PlatformLogo>();
    
    // Process in parallel
    const promises = providerIds.map(async (id) => {
      const logo = await this.getPlatformLogo(id);
      if (logo) {
        logos.set(id, logo);
      }
    });
    
    await Promise.all(promises);
    
    return logos;
  }

  // Clear cache
  clearCache(): void {
    this.cache = {};
  }

  // Get cache statistics
  getCacheStats(): { size: number; entries: number[] } {
    return {
      size: Object.keys(this.cache).length,
      entries: Object.keys(this.cache).map(Number)
    };
  }
}

// Export singleton instance
export const platformLogoService = new PlatformLogoService();
export default platformLogoService;

