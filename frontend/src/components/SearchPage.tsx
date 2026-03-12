import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Skeleton } from "./ui/skeleton";
import { Search, Star, Plus, Loader2, Check } from "lucide-react";
import { SignOutButton } from './ui/sign-out-button';
import { staggerContainer, fadeInUp, cardHover } from '@/lib/animations';
import { SkeletonGrid } from './ui/skeleton-card';
import { NavBar } from './ui/nav-bar';
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { showService, Show } from '@/services/showService';
import { watchlistService } from '@/services/watchlistService';
import { toast } from 'sonner';
import ShowDetailsModal from './ShowDetailsModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "./ui/dialog";

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
  const [recentlyAddedShows, setRecentlyAddedShows] = useState<Set<number>>(new Set());
  const [selectedShow, setSelectedShow] = useState<Show | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addModalShow, setAddModalShow] = useState<Show | null>(null);
  const [addModalStatus, setAddModalStatus] = useState<'want_to_watch' | 'watching' | 'completed'>('want_to_watch');
  const [addModalSeason, setAddModalSeason] = useState(1);
  const [addModalEpisode, setAddModalEpisode] = useState(1);
  const [submittingAddModal, setSubmittingAddModal] = useState(false);
  const [addModalTotalSeasons, setAddModalTotalSeasons] = useState(1);
  const [addModalEpisodeCounts, setAddModalEpisodeCounts] = useState<Record<number, number>>({});
  const [addModalLoadingSeasons, setAddModalLoadingSeasons] = useState(false);
  const [addModalLoadingEpisodes, setAddModalLoadingEpisodes] = useState(false);

  // Track watchlist tmdb_ids for O(1) lookup
  const [watchlistTmdbIds, setWatchlistTmdbIds] = useState<Set<number>>(new Set());
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { user } = useAuth();
  const router = useRouter();

  // Load user's watchlist on mount (for "In Watchlist" checking)
  useEffect(() => {
    const loadWatchlist = async () => {
      if (!user) {
        setWatchlistTmdbIds(new Set());
        return;
      }

      setWatchlistLoading(true);
      try {
        const watchlist = await watchlistService.getWatchlist();
        // Extract tmdb_ids into a Set for O(1) lookup
        const tmdbIds = new Set(watchlist.map(item => item.shows.tmdb_id));
        setWatchlistTmdbIds(tmdbIds);
      } catch (error) {
        console.error('Failed to load watchlist for comparison:', error);
        // Non-critical error - search still works
      } finally {
        setWatchlistLoading(false);
      }
    };

    loadWatchlist();
  }, [user]);

  // Memoized check if show is in watchlist (includes recently added)
  const isInWatchlist = useCallback((tmdbId: number): boolean => {
    return watchlistTmdbIds.has(tmdbId) || recentlyAddedShows.has(tmdbId);
  }, [watchlistTmdbIds, recentlyAddedShows]);

  const handleSearch = useCallback(async (overrideQuery?: string) => {
    const q = (overrideQuery ?? searchQuery).trim();
    if (!q) {
      setShows([]);
      setHasSearched(false);
      return;
    }

    setHasSearched(true);
    setLoading(true);
    try {
      const filters = {
        country: selectedCountry,
        subscription: selectedTier === 'any' ? undefined : selectedTier,
        limit: 20,
        seasonMode: 'compact' as const,
      };

      const result = await showService.searchShows(q, filters);
      const showsData = Array.isArray(result) ? result : [];
      setShows(showsData);
    } catch (error: any) {
      console.error('Search error:', error);
      toast.error(error.message || 'Search failed');
      setShows([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCountry, selectedTier]);

  const handleQuickAdd = useCallback(async (tmdbId: number, title: string) => {
    if (!user) {
      toast.error('Please sign in to add shows to your watchlist');
      router.push('/auth');
      return;
    }

    setAddingToWatchlist(tmdbId);
    try {
      const result = await watchlistService.addToWatchlist(tmdbId);
      const showId = result.show?.id || result.followed?.show_id;
      if (showId) {
        await watchlistService.updateShowStatus(showId, {
          status: 'want_to_watch',
          currentSeason: 1,
          currentEpisode: 1
        });
      }
      // Update both tracking sets for immediate UI feedback
      setRecentlyAddedShows(prev => new Set(prev).add(tmdbId));
      setWatchlistTmdbIds(prev => new Set(prev).add(tmdbId));
      toast.success(`"${title}" added to your watchlist!`);
    } catch (error: any) {
      console.error('Add to watchlist error:', error);
      toast.error(error.message || 'Failed to add to watchlist');
    } finally {
      setAddingToWatchlist(null);
    }
  }, [user, router]);

  const openAddModal = (show: Show) => {
    setAddModalShow(show);
    setAddModalStatus('want_to_watch');
    setAddModalSeason(1);
    setAddModalEpisode(1);
    setAddModalEpisodeCounts({});
    setAddModalOpen(true);
  };

  const loadAddModalSeasonInfo = async (show: Show) => {
    setAddModalLoadingSeasons(true);
    try {
      const seasonInfo = await showService.getSeasonInfo(show.tmdb_id);
      const totalSeasons = seasonInfo.total_seasons || show.totalSeasons || 1;
      setAddModalTotalSeasons(totalSeasons);
    } catch (error) {
      setAddModalTotalSeasons(show.totalSeasons || 1);
    } finally {
      setAddModalLoadingSeasons(false);
    }
  };

  const loadAddModalEpisodeCount = async (show: Show, seasonNumber: number) => {
    setAddModalLoadingEpisodes(true);
    try {
      const seasonInfo = await showService.getSeasonInfo(show.tmdb_id, seasonNumber);
      const episodeCount = seasonInfo.season?.episode_count || 1;
      setAddModalEpisodeCounts(prev => ({ ...prev, [seasonNumber]: episodeCount }));
    } catch (error) {
      setAddModalEpisodeCounts(prev => ({ ...prev, [seasonNumber]: prev[seasonNumber] || 1 }));
    } finally {
      setAddModalLoadingEpisodes(false);
    }
  };

  useEffect(() => {
    if (addModalOpen && addModalShow) {
      loadAddModalSeasonInfo(addModalShow);
      loadAddModalEpisodeCount(addModalShow, addModalSeason);
    }
  }, [addModalOpen, addModalShow]);

  const handleAddWithOptions = async () => {
    if (!user || !addModalShow) {
      toast.error('Please sign in to add shows to your watchlist');
      router.push('/auth');
      return;
    }

    setSubmittingAddModal(true);
    try {
      const result = await watchlistService.addToWatchlist(addModalShow.tmdb_id);
      const showId = result.show?.id || result.followed?.show_id;
      if (showId) {
        await watchlistService.updateShowStatus(showId, {
          status: addModalStatus,
          currentSeason: addModalSeason,
          currentEpisode: addModalEpisode
        });
      }
      setRecentlyAddedShows(prev => new Set(prev).add(addModalShow.tmdb_id));
      setWatchlistTmdbIds(prev => new Set(prev).add(addModalShow.tmdb_id));
      toast.success(`"${addModalShow.title}" added to your watchlist!`);
      setAddModalOpen(false);
    } catch (error: any) {
      console.error('Add to watchlist error:', error);
      toast.error(error.message || 'Failed to add to watchlist');
    } finally {
      setSubmittingAddModal(false);
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
    <div className="min-h-screen text-foreground pb-20 md:pb-0">
      <NavBar
        variant="authenticated"
        actions={
          <SignOutButton className="text-muted-foreground hover:text-foreground hover:bg-muted/50" />
        }
      />

      <div className="max-w-[1400px] mx-auto px-6 sm:px-10 py-8 sm:py-12">
        {/* Hero heading */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-8">
          <span className="text-foreground">What are you </span>
          <span className="text-primary">watching</span>
          <span className="text-foreground">?</span>
        </h1>

        {/* Search bar */}
        <div className="max-w-2xl mx-auto mb-4">
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-5 h-5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search for a show..."
              value={searchQuery}
              onChange={(e) => {
                const val = e.target.value;
                setSearchQuery(val);
                if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
                if (val.trim().length >= 2) {
                  searchTimeoutRef.current = setTimeout(() => handleSearch(val.trim()), 500);
                } else {
                  setShows([]);
                  setHasSearched(false);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
                  handleSearch();
                }
              }}
              className="pl-12 pr-28 h-12 rounded-full bg-card border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
            />
            <Button
              onClick={() => handleSearch()}
              disabled={loading}
              className="absolute right-1.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-5 h-9"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Search'
              )}
            </Button>
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
            <SelectTrigger className="w-auto min-w-[130px] h-8 rounded-full text-xs bg-card border-border">
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

          <Select value={selectedCountry} onValueChange={setSelectedCountry}>
            <SelectTrigger className="w-auto min-w-[80px] h-8 rounded-full text-xs bg-card border-border">
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

          <Select value={selectedTier} onValueChange={setSelectedTier}>
            <SelectTrigger className="w-auto min-w-[100px] h-8 rounded-full text-xs bg-card border-border">
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

        {/* Results */}
        <div>
          {hasSearched && (
            <h2 className="text-lg font-semibold mb-6 text-foreground">
              {shows.length > 0 ? `Search Results (${shows.length} shows found)` : 'Search Results'}
            </h2>
          )}

          {loading ? (
            <SkeletonGrid count={10} />
          ) : shows && shows.length > 0 ? (
            <motion.div
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5"
              variants={staggerContainer}
              initial="hidden"
              animate="show"
            >
              {shows.map(show => (
                <motion.div key={show.tmdb_id} variants={fadeInUp} {...cardHover}>
                  <div
                    className="group cursor-pointer"
                    onClick={() => setSelectedShow(show)}
                  >
                    {/* Poster with hover overlay */}
                    <div className="relative aspect-[2/3] mb-3 rounded-2xl overflow-hidden bg-muted group/card">
                      <ImageWithFallback
                        src={getPosterUrl(show.poster_path)}
                        alt={show.title}
                        className="w-full h-full object-cover transition-transform group-hover/card:scale-105"
                      />
                      {/* Star rating badge */}
                      {show.rating && (
                        <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-background/80 backdrop-blur-sm rounded-full px-2 py-0.5">
                          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                          <span className="text-xs font-semibold text-foreground">{show.rating.toFixed(1)}</span>
                        </div>
                      )}
                      {/* In Watchlist badge */}
                      {isInWatchlist(show.tmdb_id) && (
                        <div className="absolute bottom-0 left-0 right-0 bg-green-600/90 backdrop-blur-sm py-1.5 flex items-center justify-center gap-1.5 text-xs text-white font-medium">
                          <Check className="w-3.5 h-3.5" />
                          In Watchlist
                        </div>
                      )}
                      {/* Quick-add hover overlay */}
                      {!isInWatchlist(show.tmdb_id) && (
                        <div
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            className="bg-primary hover:bg-primary/90 text-white rounded-full p-3 scale-90 group-hover/card:scale-100 transition-transform disabled:opacity-60"
                            onClick={() => handleQuickAdd(show.tmdb_id, show.title)}
                            disabled={addingToWatchlist === show.tmdb_id}
                            title="Quick add to watchlist"
                          >
                            {addingToWatchlist === show.tmdb_id
                              ? <Loader2 className="w-5 h-5 animate-spin" />
                              : <Plus className="w-5 h-5" />
                            }
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="font-semibold text-sm text-foreground line-clamp-1 mb-1">{show.title}</h3>

                    {/* Platform badges */}
                    {show.providers && show.providers.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {show.providers.slice(0, 2).map((provider, idx) => (
                          <Badge key={idx} variant="outline" className="text-[10px] px-1.5 py-0 rounded-full">
                            {provider.provider_name}
                          </Badge>
                        ))}
                        {show.providers.length > 2 && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 rounded-full">
                            +{show.providers.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : !loading && hasSearched && shows.length === 0 ? (
            <div className="text-center py-16">
              <img src="/logo.png" alt="Scout" className="w-16 h-16 mx-auto mb-4 opacity-40" />
              <p className="text-lg font-medium text-foreground mb-1">No shows found</p>
              <p className="text-muted-foreground text-sm">Try a different search term or adjust your filters.</p>
            </div>
          ) : !loading && !hasSearched ? (
            <div className="text-center py-16">
              <img src="/logo.png" alt="Scout" className="w-16 h-16 mx-auto mb-4 opacity-40" />
              <p className="text-lg font-medium text-foreground mb-1">Find your next binge</p>
              <p className="text-muted-foreground text-sm">Type a show name and Scout will find it for you.</p>
            </div>
          ) : null}
        </div>
      </div>

      {/* Show Details Modal */}
      <ShowDetailsModal
        show={selectedShow}
        isOpen={!!selectedShow}
        onClose={() => setSelectedShow(null)}
        isInWatchlist={selectedShow ? isInWatchlist(selectedShow.tmdb_id) : false}
        onWatchlistChange={() => {
          // Update local state when show is added from modal
          if (selectedShow) {
            setRecentlyAddedShows(prev => new Set(prev).add(selectedShow.tmdb_id));
            setWatchlistTmdbIds(prev => new Set(prev).add(selectedShow.tmdb_id));
          }
        }}
      />

      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Add {addModalShow?.title ? `"${addModalShow.title}"` : 'show'} to Watchlist
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={addModalStatus} onValueChange={(value) => setAddModalStatus(value as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="want_to_watch">Plan to Watch</SelectItem>
                  <SelectItem value="watching">Watching</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Starting Season</Label>
                <Select
                  value={addModalSeason.toString()}
                  onValueChange={(value) => {
                    const nextSeason = Math.max(1, Number(value));
                    setAddModalSeason(nextSeason);
                    setAddModalEpisode(1);
                    if (addModalShow) {
                      loadAddModalEpisodeCount(addModalShow, nextSeason);
                    }
                  }}
                  disabled={addModalLoadingSeasons}
                >
                  <SelectTrigger>
                    {addModalLoadingSeasons ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <SelectValue />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: addModalTotalSeasons }, (_, i) => i + 1).map(seasonNum => (
                      <SelectItem key={seasonNum} value={seasonNum.toString()}>
                        Season {seasonNum}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Starting Episode</Label>
                <Select
                  value={addModalEpisode.toString()}
                  onValueChange={(value) => setAddModalEpisode(Math.max(1, Number(value)))}
                  disabled={addModalLoadingEpisodes}
                >
                  <SelectTrigger>
                    {addModalLoadingEpisodes ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <SelectValue />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(
                      { length: addModalEpisodeCounts[addModalSeason] || 1 },
                      (_, i) => i + 1
                    ).map(episodeNum => (
                      <SelectItem key={episodeNum} value={episodeNum.toString()}>
                        Episode {episodeNum}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="outline" disabled={submittingAddModal}>
                Cancel
              </Button>
            </DialogClose>
            <Button onClick={handleAddWithOptions} disabled={submittingAddModal}>
              {submittingAddModal ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add to Watchlist'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
