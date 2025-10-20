"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Search, Star, Plus, Filter, Globe, Clock } from 'lucide-react';
import Link from 'next/link';
import { getPrimaryProviders, getOtherProviders, getProviderName } from '@/utils/providerMapping';
import { searchService } from '@/services/searchService';
import { autocompleteService, AutocompleteItem } from '@/services/autocompleteService';
import { getPopularCountries } from '@/utils/countries';

type SearchItem = {
  tmdb_id: number;
  title: string;
  overview?: string;
  poster_path?: string;
  first_air_date?: string;
  rating?: number;
  totalSeasons?: number;
  providers?: { id: number; name: string; logo_path?: string }[];
  availability?: Record<string, { id: number; name: string; logo_path?: string }[]>;
};

export default function SearchPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [country, setCountry] = useState("US");
  const [selectedProviders, setSelectedProviders] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<AutocompleteItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState<any[]>([]);
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [showCountrySelector, setShowCountrySelector] = useState(false);
  const [showOtherPlatforms, setShowOtherPlatforms] = useState(false);
  const [selectedOtherProviders, setSelectedOtherProviders] = useState<number[]>([]);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const primaryProviders = getPrimaryProviders();
  const otherProviders = getOtherProviders();
  const popularCountries = getPopularCountries();

  // Debounced search
  const debouncedSearch = useCallback(() => {
    searchService.debouncedSearch(async () => {
      if (searchQuery.trim().length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const providers = [...selectedProviders, ...selectedOtherProviders];
        const params = new URLSearchParams({
          q: searchQuery,
          country: country,
          subscription: 'any',
          ...(providers.length > 0 && { providers: providers.join(',') }),
          ...(showOnlyAvailable && { available_only: 'true' }),
        });

        const response = await fetch(`http://localhost:5001/api/shows/universal-search?${params}`);
        
        if (!response.ok) {
          throw new Error(`Search failed: ${response.status}`);
        }

        const data = await response.json();
        setResults(data.shows || []);
        
        // Cache results
        searchService.setCachedResults(searchQuery, country, 'any', providers, data);
        
        // Add to search history
        searchService.addToHistory(searchQuery, data.shows?.length || 0);
        setSearchHistory(searchService.getSearchHistory());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
        setResults([]);
      } finally {
        setLoading(false);
      }
    });
  }, [searchQuery, country, selectedProviders, selectedOtherProviders, showOnlyAvailable]);

  // Handle search input
  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
    
    if (value.trim().length >= 2) {
      setShowSuggestions(true);
      autocompleteService.getSuggestions(value).then(setSuggestions);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  };

  // Quick Add function
  const quickAdd = async (show: SearchItem) => {
    if (!user) {
      alert('Please log in to add shows to your watchlist');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5001/api/shows/${show.tmdb_id}/quick-add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('streamtrack_token')}`,
        },
        body: JSON.stringify({
          title: show.title,
          overview: show.overview,
          poster_path: show.poster_path,
          first_air_date: show.first_air_date,
          vote_average: show.rating,
          number_of_seasons: show.totalSeasons,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add show');
      }

      alert(`${show.title} added to your watchlist!`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add show to watchlist');
    }
  };

  // Load search history on mount
  useEffect(() => {
    setSearchHistory(searchService.getSearchHistory());
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100">
      {/* Navigation */}
      <nav className="flex items-center justify-between p-6">
        <div className="flex items-center space-x-2">
          <Link href="/" className="flex items-center space-x-2 text-orange-600 hover:text-orange-700">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-lg font-medium">Back to Home</span>
          </Link>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
            <Search className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold text-orange-600">WallyWatch</span>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/profile">
            <Button variant="ghost" className="text-gray-700 hover:text-orange-600">
              My Watchlist
            </Button>
          </Link>
          {user ? (
            <span className="text-sm text-gray-600">{user.name || user.email}</span>
          ) : (
            <Link href="/auth">
              <Button className="bg-orange-600 hover:bg-orange-700">
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Find Your Next Favorite Show
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Search across all streaming platforms and discover shows you'll love.
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-orange-100 mb-8">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Search Input */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="w-4 h-4 inline mr-2" />
                Search for Shows
              </label>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchInput(e.target.value)}
                placeholder="e.g. Stranger Things, The Office..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              />
              
              {/* Autocomplete Suggestions */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {suggestions.map((suggestion) => (
                    <div
                      key={suggestion.id}
                      onClick={() => {
                        setSearchQuery(suggestion.title);
                        setShowSuggestions(false);
                        debouncedSearch();
                      }}
                      className="flex items-center space-x-3 p-3 hover:bg-orange-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      {suggestion.poster_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w92${suggestion.poster_path}`}
                          alt={suggestion.title}
                          className="w-12 h-16 object-cover rounded"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-12 h-16 bg-gray-200 rounded flex items-center justify-center">
                          <span className="text-gray-400 text-xs">📺</span>
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-gray-900">{suggestion.title}</div>
                        <div className="text-sm text-gray-500">
                          {suggestion.year || 'N/A'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Country Selector */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Globe className="w-4 h-4 inline mr-2" />
                Country
              </label>
              <button
                onClick={() => setShowCountrySelector(!showCountrySelector)}
                className="w-full flex items-center justify-between px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">
                    {popularCountries.find(c => c.code === country)?.flag || '🌍'}
                  </span>
                  <span className="text-gray-900">
                    {popularCountries.find(c => c.code === country)?.name || country}
                  </span>
                </div>
                <span className="text-gray-400">▼</span>
              </button>
              
              {showCountrySelector && (
                <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {popularCountries.map((countryItem) => (
                    <button
                      key={countryItem.code}
                      onClick={() => {
                        setCountry(countryItem.code);
                        setShowCountrySelector(false);
                      }}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-orange-50 text-left border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{countryItem.flag}</span>
                        <span className="text-gray-900">{countryItem.name}</span>
                      </div>
                      {countryItem.popular && <span className="text-yellow-500">★</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Platform Filters */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <Filter className="w-4 h-4 inline mr-2" />
              Streaming Platforms
            </label>
            
            {/* Primary Platforms */}
            <div className="mb-4">
              <div className="text-xs text-gray-500 mb-2">Primary Platforms</div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {primaryProviders.map((provider) => (
                  <label key={provider.id} className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-orange-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedProviders.includes(provider.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProviders([...selectedProviders, provider.id]);
                        } else {
                          setSelectedProviders(selectedProviders.filter(id => id !== provider.id));
                        }
                      }}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-lg">{provider.logo}</span>
                    <span className="text-sm text-gray-700">{provider.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Other Platforms */}
            <div className="relative">
              <button
                onClick={() => setShowOtherPlatforms(!showOtherPlatforms)}
                className="w-full flex items-center justify-between px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
              >
                <span className="text-gray-700">
                  Other Platforms {selectedOtherProviders.length > 0 && `(${selectedOtherProviders.length})`}
                </span>
                <span className="text-gray-400">{showOtherPlatforms ? '▲' : '▼'}</span>
              </button>
              
              {showOtherPlatforms && (
                <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  <div className="p-3">
                    <div className="text-xs text-gray-500 mb-2">Additional Platforms</div>
                    <div className="space-y-2">
                      {otherProviders.map((provider) => (
                        <label key={provider.id} className="flex items-center space-x-2 p-2 hover:bg-orange-50 cursor-pointer rounded">
                          <input
                            type="checkbox"
                            checked={selectedOtherProviders.includes(provider.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedOtherProviders([...selectedOtherProviders, provider.id]);
                              } else {
                                setSelectedOtherProviders(selectedOtherProviders.filter(id => id !== provider.id));
                              }
                            }}
                            className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                          />
                          <span className="text-lg">{provider.logo}</span>
                          <span className="text-sm text-gray-700">{provider.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Search Actions */}
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                onClick={debouncedSearch}
                disabled={loading}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <Search className="w-4 h-4 mr-2" />
                {loading ? 'Searching...' : 'Search'}
              </Button>
              
              <label className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOnlyAvailable}
                  onChange={(e) => setShowOnlyAvailable(e.target.checked)}
                  className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
                <span>Only show available content</span>
              </label>
            </div>
            
            <div className="text-sm">
              {user ? (
                <span className="text-green-600">✓ Signed in as {user.name || user.email}</span>
              ) : (
                <span className="text-yellow-600">⚠ Sign in to use Quick Add feature</span>
              )}
            </div>
          </div>
        </div>

        {/* Search History */}
        {searchHistory.length > 0 && !loading && results.length === 0 && (
          <div className="bg-white rounded-xl p-6 shadow-lg border border-orange-100 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Recent Searches
            </h3>
            <div className="flex flex-wrap gap-2">
              {searchHistory.slice(0, 8).map((item, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery(item.query);
                    debouncedSearch();
                  }}
                  className="bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200"
                >
                  {item.query} ({item.resultCount} results)
                </Button>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                searchService.clearHistory();
                setSearchHistory([]);
              }}
              className="mt-3 text-xs text-gray-500 hover:text-gray-700"
            >
              Clear History
            </Button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-orange-50 border border-orange-200 text-orange-700 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2">
              <div className="animate-spin w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full"></div>
              <span>Searching and fetching season data... This may take a moment.</span>
            </div>
          </div>
        )}

        {/* Search Results */}
        {results.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg border border-orange-100 overflow-hidden">
            <div className="px-6 py-4 bg-orange-50 border-b border-orange-100">
              <h2 className="text-xl font-semibold text-gray-800">
                Search Results ({results.length})
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Poster</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Title</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Seasons</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Rating</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Available On</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {results.map((show) => (
                    <tr key={show.tmdb_id} className="hover:bg-orange-50">
                      <td className="px-6 py-4">
                        {show.poster_path ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w185${show.poster_path}`}
                            alt={show.title}
                            className="w-16 h-24 object-cover rounded"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-16 h-24 bg-gray-200 rounded flex items-center justify-center">
                            <span className="text-gray-400 text-xs">📺</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-semibold text-gray-900">{show.title}</div>
                          <div className="text-sm text-gray-500">
                            {show.first_air_date ? new Date(show.first_air_date).getFullYear() : 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm">
                          {show.totalSeasons || 'N/A'} seasons
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="font-medium">{show.rating?.toFixed(1) || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {show.providers && show.providers.length > 0 ? (
                            show.providers
                              .filter(provider => 
                                primaryProviders.some(p => p.id === provider.id)
                              )
                              .map((provider) => (
                                <span key={provider.id} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                  {provider.name}
                                </span>
                              ))
                          ) : (
                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
                              Not Available to Stream
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {user && (
                          <Button
                            onClick={() => quickAdd(show)}
                            size="sm"
                            className="bg-orange-600 hover:bg-orange-700"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Quick Add
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && results.length === 0 && searchQuery && (
          <div className="bg-white rounded-xl p-12 shadow-lg border border-orange-100 text-center">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No results found</h3>
            <p className="text-gray-600">
              Try adjusting your search terms or filters to find what you're looking for.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}