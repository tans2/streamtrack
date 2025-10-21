import { useState, useEffect } from 'react';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Skeleton } from "./ui/skeleton";
import { ArrowLeft, Search, Star, Plus, Loader2 } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { showService, Show } from '@/services/showService';
import { watchlistService } from '@/services/watchlistService';
import { toast } from 'sonner';

interface SearchPageProps {
  onNavigate: (page: string) => void;
}

const platforms = ['All Platforms', 'Netflix', 'Disney+', 'Prime Video', 'HBO Max', 'Apple TV+', 'Paramount+', 'Hulu', 'Peacock', 'YouTube TV', 'Fubo TV'];
const countries = ['US', 'UK', 'Canada', 'Australia', 'Germany', 'France'];
const tiers = ['any', 'subscription', 'free', 'with ads', 'rent', 'buy'];

export default function SearchPage({ onNavigate }: SearchPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('All Platforms');
  const [selectedCountry, setSelectedCountry] = useState('US');
  const [selectedTier, setSelectedTier] = useState('any');
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingToWatchlist, setAddingToWatchlist] = useState<number | null>(null);

  const { user } = useAuth();
  const router = useRouter();

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setLoading(true);
    try {
      const filters = {
        country: selectedCountry,
        subscription: selectedTier === 'any' ? undefined : selectedTier,
        limit: 20,
        seasonMode: 'compact' as const,
      };

      const result = await showService.searchShows(searchQuery, filters);
      // The service now returns Show[] directly
      const showsData = Array.isArray(result) ? result : [];
      setShows(showsData);
      
      if (showsData.length === 0) {
        toast.info('No shows found. Try a different search term.');
      }
    } catch (error: any) {
      console.error('Search error:', error);
      toast.error(error.message || 'Search failed');
      setShows([]); // Reset shows to empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleAddToWatchlist = async (tmdbId: number, title: string) => {
    if (!user) {
      toast.error('Please sign in to add shows to your watchlist');
      router.push('/auth');
      return;
    }

    setAddingToWatchlist(tmdbId);
    try {
      await watchlistService.addToWatchlist(tmdbId);
      toast.success(`"${title}" added to your watchlist!`);
    } catch (error: any) {
      console.error('Add to watchlist error:', error);
      toast.error(error.message || 'Failed to add to watchlist');
    } finally {
      setAddingToWatchlist(null);
    }
  };

  const getProviderNames = (show: Show) => {
    if (!show.providers || show.providers.length === 0) {
      return ['Unknown Platform'];
    }
    return show.providers.map(p => p.provider_name).slice(0, 3);
  };

  const getPosterUrl = (posterPath?: string) => {
    if (!posterPath) return '';
    return `https://image.tmdb.org/t/p/w300${posterPath}`;
  };

  return (
    <div className="min-h-screen text-foreground">
      {/* Header */}
      <div className="border-b border-border bg-card/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="sm"
                className="text-primary hover:text-primary hover:bg-primary/10 mr-4"
                onClick={() => router.push('/')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <h1 className="text-2xl text-foreground">Search Shows</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                className="text-primary hover:text-primary hover:bg-primary/10"
                onClick={() => router.push('/profile')}
              >
                My Watchlist
              </Button>
              <Button 
                variant="ghost" 
                className="text-primary hover:text-primary hover:bg-primary/10"
                onClick={() => router.push('/settings')}
              >
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Search Form */}
        <Card className="bg-card border-border shadow-lg mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="search" className="text-card-foreground">Search by Title</Label>
                <Input
                  id="search"
                  placeholder="Enter show title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-input-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-card-foreground">Platform</Label>
                <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                  <SelectTrigger className="bg-input-background border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {platforms.map(platform => (
                      <SelectItem key={platform} value={platform}>
                        {platform}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-card-foreground">Country</Label>
                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                  <SelectTrigger className="bg-input-background border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map(country => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-card-foreground">Subscription Tier</Label>
                <Select value={selectedTier} onValueChange={setSelectedTier}>
                  <SelectTrigger className="bg-input-background border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tiers.map(tier => (
                      <SelectItem key={tier} value={tier}>
                        {tier}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                onClick={handleSearch}
                disabled={loading}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Search className="w-4 h-4 mr-2" />
                )}
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div>
          <h2 className="text-xl mb-6 text-foreground">
            Search Results {shows && shows.length > 0 && `(${shows.length} shows found)`}
          </h2>
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="bg-card border-border shadow-lg">
                  <CardContent className="p-4">
                    <Skeleton className="aspect-[2/3] mb-4 rounded-lg" />
                    <Skeleton className="h-4 mb-2" />
                    <Skeleton className="h-3 w-1/2 mb-3" />
                    <Skeleton className="h-8 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : shows && shows.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {shows.map(show => (
                <Card key={show.tmdb_id} className="bg-card border-border hover:border-primary transition-colors shadow-lg">
                  <CardContent className="p-4">
                    <div className="aspect-[2/3] mb-4 rounded-lg overflow-hidden bg-muted">
                      <ImageWithFallback 
                        src={getPosterUrl(show.poster_path)}
                        alt={show.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="text-card-foreground mb-2 line-clamp-2">{show.title}</h3>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-600 mr-1" />
                        <span className="text-muted-foreground">{show.rating?.toFixed(1) || 'N/A'}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {getProviderNames(show).map((platform, index) => (
                          <Badge key={index} variant="outline" className="border-primary/50 text-foreground text-xs">
                            {platform}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button 
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                      size="sm"
                      onClick={() => handleAddToWatchlist(show.tmdb_id, show.title)}
                      disabled={addingToWatchlist === show.tmdb_id}
                    >
                      {addingToWatchlist === show.tmdb_id ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4 mr-2" />
                      )}
                      Add to Watchlist
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                {searchQuery ? 'No shows found. Try a different search term.' : 'Enter a search term to find shows.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}