// TMDB Provider ID to Platform Name Mapping
export const PROVIDER_MAPPING: Record<number, { name: string; logo: string; color: string; isPrimary: boolean }> = {
  // PRIMARY STREAMING PLATFORMS
  8: { name: 'Netflix', logo: '📺', color: '#E50914', isPrimary: true },
  9: { name: 'Prime Video', logo: '📦', color: '#00A8E1', isPrimary: true },
  119: { name: 'Amazon Prime Video', logo: '📦', color: '#00A8E1', isPrimary: true }, // Same as Prime Video
  15: { name: 'Hulu', logo: '🎬', color: '#1CE783', isPrimary: true },
  192: { name: 'YouTube', logo: '📺', color: '#FF0000', isPrimary: true },
  337: { name: 'Disney+', logo: '🏰', color: '#113CCF', isPrimary: true },
  350: { name: 'Apple TV+', logo: '🍎', color: '#000000', isPrimary: true },
  386: { name: 'Peacock', logo: '🦚', color: '#00A4E4', isPrimary: true },
  531: { name: 'Paramount+', logo: '⭐', color: '#0064FF', isPrimary: true },
  1899: { name: 'HBO Max', logo: '🎭', color: '#8B5CF6', isPrimary: true },
  
  // OTHER PLATFORMS
  3: { name: 'Google Play', logo: '📱', color: '#4285F4', isPrimary: false },
  2: { name: 'iTunes', logo: '🎵', color: '#FA243C', isPrimary: false },
  7: { name: 'Vudu', logo: '💿', color: '#1BA1E2', isPrimary: false },
  68: { name: 'Microsoft Store', logo: '🪟', color: '#00BCF2', isPrimary: false },
  73: { name: 'Tubi', logo: '🆓', color: '#FF6B35', isPrimary: false },
  12: { name: 'Crackle', logo: '🍿', color: '#FF6B35', isPrimary: false },
  232: { name: 'Freevee', logo: '🆓', color: '#00A4E4', isPrimary: false },
  283: { name: 'Crunchyroll', logo: '🍥', color: '#FF6500', isPrimary: false },
  269: { name: 'Funimation', logo: '🎌', color: '#FF6500', isPrimary: false },
  67: { name: 'Showtime', logo: '🎭', color: '#B20000', isPrimary: false },
  318: { name: 'Starz', logo: '⭐', color: '#000000', isPrimary: false },
  37: { name: 'Epix', logo: '🎬', color: '#000000', isPrimary: false },
  528: { name: 'AMC+', logo: '🎬', color: '#000000', isPrimary: false },
  88: { name: 'FX', logo: '📺', color: '#000000', isPrimary: false },
  41: { name: 'TNT', logo: '📺', color: '#000000', isPrimary: false },
  47: { name: 'Comedy Central', logo: '😂', color: '#000000', isPrimary: false },
  33: { name: 'MTV', logo: '🎵', color: '#000000', isPrimary: false },
  35: { name: 'VH1', logo: '🎵', color: '#000000', isPrimary: false },
  18: { name: 'BET', logo: '📺', color: '#000000', isPrimary: false },
  28: { name: 'OWN', logo: '📺', color: '#000000', isPrimary: false },
  34: { name: 'Lifetime', logo: '📺', color: '#000000', isPrimary: false },
  25: { name: 'History', logo: '📺', color: '#000000', isPrimary: false },
  64: { name: 'Discovery', logo: '📺', color: '#000000', isPrimary: false },
  43: { name: 'National Geographic', logo: '📺', color: '#000000', isPrimary: false },
  14: { name: 'PBS', logo: '📺', color: '#000000', isPrimary: false },
  13: { name: 'BBC', logo: '📺', color: '#000000', isPrimary: false },
  30: { name: 'Sky', logo: '📺', color: '#000000', isPrimary: false },
  38: { name: 'Channel 4', logo: '📺', color: '#000000', isPrimary: false },
  39: { name: 'BBC iPlayer', logo: '📺', color: '#000000', isPrimary: false },
  56: { name: 'Adult Swim', logo: '🌙', color: '#00FF00', isPrimary: false },
  384: { name: 'Hallmark', logo: '📺', color: '#000000', isPrimary: false }
};

// Get provider name by ID
export const getProviderName = (id: number): string => {
  return PROVIDER_MAPPING[id]?.name || `Provider ${id}`;
};

// Get provider info by ID
export const getProviderInfo = (id: number) => {
  return PROVIDER_MAPPING[id] || { name: `Provider ${id}`, logo: '📺', color: '#666666' };
};

// Get primary providers for main filtering
export const getPrimaryProviders = () => {
  return Object.entries(PROVIDER_MAPPING)
    .filter(([_, info]) => info.isPrimary)
    .map(([id, info]) => ({
      id: parseInt(id),
      name: info.name,
      logo: info.logo,
      color: info.color,
      isPrimary: info.isPrimary
    }));
};

// Get other providers for dropdown
export const getOtherProviders = () => {
  return Object.entries(PROVIDER_MAPPING)
    .filter(([_, info]) => !info.isPrimary)
    .map(([id, info]) => ({
      id: parseInt(id),
      name: info.name,
      logo: info.logo,
      color: info.color,
      isPrimary: info.isPrimary
    }));
};

// Get all available providers for filtering (backward compatibility)
export const getAvailableProviders = () => {
  return Object.entries(PROVIDER_MAPPING).map(([id, info]) => ({
    id: parseInt(id),
    name: info.name,
    logo: info.logo,
    color: info.color,
    isPrimary: info.isPrimary
  }));
};

// Get provider IDs by name (for reverse lookup)
export const getProviderIdsByName = (name: string): number[] => {
  return Object.entries(PROVIDER_MAPPING)
    .filter(([_, info]) => info.name.toLowerCase().includes(name.toLowerCase()))
    .map(([id, _]) => parseInt(id));
};