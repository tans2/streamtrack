// Country data for regional content selection
export interface Country {
  code: string;
  name: string;
  flag: string;
  region: string;
  popular: boolean;
}

export const COUNTRIES: Country[] = [
  // Popular countries (most common for streaming)
  { code: 'US', name: 'United States', flag: '🇺🇸', region: 'North America', popular: true },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', region: 'Europe', popular: true },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', region: 'North America', popular: true },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', region: 'Oceania', popular: true },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', region: 'Europe', popular: true },
  { code: 'FR', name: 'France', flag: '🇫🇷', region: 'Europe', popular: true },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', region: 'Asia', popular: true },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷', region: 'Asia', popular: true },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', region: 'South America', popular: true },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽', region: 'North America', popular: true },
  
  // Additional countries by region
  { code: 'AR', name: 'Argentina', flag: '🇦🇷', region: 'South America', popular: false },
  { code: 'AT', name: 'Austria', flag: '🇦🇹', region: 'Europe', popular: false },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪', region: 'Europe', popular: false },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭', region: 'Europe', popular: false },
  { code: 'CL', name: 'Chile', flag: '🇨🇱', region: 'South America', popular: false },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴', region: 'South America', popular: false },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰', region: 'Europe', popular: false },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', region: 'Europe', popular: false },
  { code: 'FI', name: 'Finland', flag: '🇫🇮', region: 'Europe', popular: false },
  { code: 'IN', name: 'India', flag: '🇮🇳', region: 'Asia', popular: false },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', region: 'Europe', popular: false },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱', region: 'Europe', popular: false },
  { code: 'NO', name: 'Norway', flag: '🇳🇴', region: 'Europe', popular: false },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿', region: 'Oceania', popular: false },
  { code: 'PL', name: 'Poland', flag: '🇵🇱', region: 'Europe', popular: false },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹', region: 'Europe', popular: false },
  { code: 'RU', name: 'Russia', flag: '🇷🇺', region: 'Europe', popular: false },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪', region: 'Europe', popular: false },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷', region: 'Europe', popular: false },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', region: 'Africa', popular: false },
];

// Get country by code
export const getCountryByCode = (code: string): Country | undefined => {
  return COUNTRIES.find(country => country.code === code);
};

// Get popular countries
export const getPopularCountries = (): Country[] => {
  return COUNTRIES.filter(country => country.popular);
};

// Get countries by region
export const getCountriesByRegion = (region: string): Country[] => {
  return COUNTRIES.filter(country => country.region === region);
};

// Get all regions
export const getRegions = (): string[] => {
  const regions = new Set(COUNTRIES.map(country => country.region));
  return Array.from(regions).sort();
};
