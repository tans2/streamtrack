import { useState, useEffect } from 'react';
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Skeleton } from "./ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { ArrowLeft, Settings, Search, Star, Play, Calendar, Loader2 } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { watchlistService, WatchlistItem } from '@/services/watchlistService';
import { showService } from '@/services/showService';
import { toast } from 'sonner';

interface ProfilePageProps {
  onNavigate: (page: string) => void;
}

interface SeasonData {
  totalSeasons: number;
  episodeCounts: Record<number, number>; // season number -> episode count
  loading: boolean;
  error: string | null;
}

export default function ProfilePage({ onNavigate }: ProfilePageProps) {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [seasonDataCache, setSeasonDataCache] = useState<Record<string, SeasonData>>({}); // show_id -> SeasonData
  const [savingProgress, setSavingProgress] = useState<Record<string, boolean>>({}); // show_id -> isSaving

  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    loadWatchlist();
  }, []);

  const loadWatchlist = async () => {
    setLoading(true);
    try {
      const data = await watchlistService.getWatchlist();
      // Normalize season/episode defaults to 1 if missing, null, undefined, or 0
      const normalizedData = data.map(item => ({
        ...item,
        current_season: (item.current_season && item.current_season > 0) ? item.current_season : 1,
        current_episode: (item.current_episode && item.current_episode > 0) ? item.current_episode : 1
      }));
      setWatchlist(normalizedData);
    } catch (error: any) {
      console.error('Error loading watchlist:', error);
      toast.error(error.message || 'Failed to load watchlist');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (showId: string, newStatus: string) => {
    setUpdatingStatus(showId);
    try {
      await watchlistService.updateShowStatus(showId, { status: newStatus as any });
      toast.success('Status updated successfully');
      loadWatchlist(); // Reload to get updated data
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error(error.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleRemoveFromWatchlist = async (showId: string, title: string) => {
    try {
      await watchlistService.removeFromWatchlist(showId);
      toast.success(`"${title}" removed from watchlist`);
      loadWatchlist(); // Reload to get updated data
    } catch (error: any) {
      console.error('Error removing from watchlist:', error);
      toast.error(error.message || 'Failed to remove from watchlist');
    }
  };

  // Load season data for a show (lazy loading - only when dropdown opens)
  const loadSeasonData = async (item: WatchlistItem) => {
    const showId = item.show_id;
    const tmdbId = item.shows.tmdb_id;

    // Check if already cached
    if (seasonDataCache[showId] && !seasonDataCache[showId].loading) {
      return;
    }

    // Set loading state
    setSeasonDataCache(prev => ({
      ...prev,
      [showId]: {
        totalSeasons: 0,
        episodeCounts: {},
        loading: true,
        error: null
      }
    }));

    try {
      // Fetch total seasons
      const seasonInfo = await showService.getSeasonInfo(tmdbId);
      
      const seasonData: SeasonData = {
        totalSeasons: seasonInfo.total_seasons || 0,
        episodeCounts: {},
        loading: false,
        error: null
      };

      // Pre-fetch episode count for current season
      if (item.current_season && seasonInfo.total_seasons) {
        try {
          const currentSeasonInfo = await showService.getSeasonInfo(tmdbId, item.current_season);
          if (currentSeasonInfo.season) {
            seasonData.episodeCounts[item.current_season] = currentSeasonInfo.season.episode_count;
          }
        } catch (err) {
          console.warn(`Failed to fetch episode count for season ${item.current_season}:`, err);
        }
      }

      setSeasonDataCache(prev => ({
        ...prev,
        [showId]: seasonData
      }));
    } catch (error: any) {
      console.error('Error loading season data:', error);
      const errorMessage = error.message || 'Unable to fetch data, please try again';
      setSeasonDataCache(prev => ({
        ...prev,
        [showId]: {
          totalSeasons: 0,
          episodeCounts: {},
          loading: false,
          error: errorMessage
        }
      }));
      toast.error(errorMessage);
    }
  };

  // Get episode count for a season (with caching)
  const getEpisodeCount = async (item: WatchlistItem, seasonNumber: number): Promise<number> => {
    const showId = item.show_id;
    const cached = seasonDataCache[showId];

    // If already cached, return it
    if (cached?.episodeCounts[seasonNumber]) {
      return cached.episodeCounts[seasonNumber];
    }

    // If not cached, fetch it
    try {
      const seasonInfo = await showService.getSeasonInfo(item.shows.tmdb_id, seasonNumber);
      if (seasonInfo.season) {
        const episodeCount = seasonInfo.season.episode_count;
        // Update cache
        setSeasonDataCache(prev => ({
          ...prev,
          [showId]: {
            ...prev[showId],
            episodeCounts: {
              ...prev[showId]?.episodeCounts,
              [seasonNumber]: episodeCount
            }
          }
        }));
        return episodeCount;
      }
    } catch (error: any) {
      console.error(`Error fetching episode count for season ${seasonNumber}:`, error);
      // Check if it's a "season not released" error
      if (error.message?.includes('not yet released')) {
        toast.error(error.message);
        throw error;
      }
      toast.error('Unable to fetch data, please try again');
    }
    return 0;
  };

  // Handle season change
  const handleSeasonChange = async (item: WatchlistItem, newSeason: number) => {
    // Ensure episode count is loaded for the new season before saving
    const showId = item.show_id;
    const cached = seasonDataCache[showId];
    
    // If episode count not cached, fetch it first
    if (!cached?.episodeCounts[newSeason]) {
      try {
        await getEpisodeCount(item, newSeason);
      } catch (error) {
        // Error already handled in getEpisodeCount
        return;
      }
    }
    
    // Reset episode to 1 when season changes
    await handleProgressUpdate(item, newSeason, 1);
  };

  // Handle episode change
  const handleEpisodeChange = async (item: WatchlistItem, newEpisode: number) => {
    await handleProgressUpdate(item, item.current_season, newEpisode);
  };

  // Update progress (season/episode)
  const handleProgressUpdate = async (item: WatchlistItem, season: number, episode: number) => {
    const showId = item.show_id;
    
    // Validate season is available
    const cached = seasonDataCache[showId];
    if (cached && cached.totalSeasons > 0 && season > cached.totalSeasons) {
      toast.error('Season not yet released, please sign up for release notifications');
      return;
    }

    setSavingProgress(prev => ({ ...prev, [showId]: true }));

    try {
      await watchlistService.updateShowStatus(showId, {
        status: 'watching',
        currentSeason: season,
        currentEpisode: episode
      });
      
      // Update local state instead of reloading
      setWatchlist(prev => prev.map(show => 
        show.show_id === showId 
          ? { ...show, current_season: season, current_episode: episode }
          : show
      ));
      
      toast.success(`Progress updated to Season ${season}, Episode ${episode}`);
    } catch (error: any) {
      console.error('Error updating progress:', error);
      const errorMessage = error.message || 'Failed to update progress';
      
      // Check for specific error messages from backend
      if (errorMessage.includes('not yet released')) {
        toast.error('Season not yet released, please sign up for release notifications');
      } else if (errorMessage.includes('Unable to fetch')) {
        toast.error('Unable to fetch data, please try again');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setSavingProgress(prev => ({ ...prev, [showId]: false }));
    }
  };

  const watchingShows = watchlist.filter(item => item.watch_status === 'watching');
  const completedShows = watchlist.filter(item => item.watch_status === 'completed');
  const planToWatchShows = watchlist.filter(item => item.watch_status === 'want_to_watch');

  const calculateProgress = (current: number, total: number) => {
    return Math.round((current / total) * 100);
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const colors = {
      watching: "bg-green-600",
      completed: "bg-blue-600", 
      want_to_watch: "bg-yellow-600",
      dropped: "bg-red-600"
    };
    
    const labels = {
      watching: "Watching",
      completed: "Completed",
      want_to_watch: "Plan to Watch",
      dropped: "Dropped"
    };
    
    return (
      <Badge className={`${colors[status as keyof typeof colors]} text-white border-0`}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const getPosterUrl = (posterPath?: string) => {
    if (!posterPath) return '';
    return `https://image.tmdb.org/t/p/w300${posterPath}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen text-foreground">
        <div className="border-b border-border bg-card/50">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Skeleton className="h-8 w-20 mr-4" />
                <Skeleton className="h-8 w-32" />
              </div>
              <div className="flex items-center space-x-4">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-6 py-8">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[2/3] w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

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
              <h1 className="text-2xl text-foreground">My Watchlist</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                className="text-primary hover:text-primary hover:bg-primary/10"
                onClick={() => router.push('/search')}
              >
                <Search className="w-4 h-4 mr-2" />
                Search Shows
              </Button>
              <Button 
                variant="ghost" 
                className="text-primary hover:text-primary hover:bg-primary/10"
                onClick={() => router.push('/settings')}
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* User Stats */}
        <div className="mb-8">
          <h2 className="text-3xl mb-4 text-foreground">
            Welcome back, {user?.name || 'User'}! 👋
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-card border-border shadow-lg">
              <CardContent className="p-4 text-center">
                <div className="text-2xl mb-1 text-primary">{watchlist.length}</div>
                <div className="text-muted-foreground">Total Shows</div>
              </CardContent>
            </Card>
            <Card className="bg-green-50 border-green-200 shadow-lg">
              <CardContent className="p-4 text-center">
                <div className="text-2xl mb-1 text-green-700">{watchingShows.length}</div>
                <div className="text-green-600">Currently Watching</div>
              </CardContent>
            </Card>
            <Card className="bg-blue-50 border-blue-200 shadow-lg">
              <CardContent className="p-4 text-center">
                <div className="text-2xl mb-1 text-blue-700">{completedShows.length}</div>
                <div className="text-blue-600">Completed</div>
              </CardContent>
            </Card>
            <Card className="bg-yellow-50 border-yellow-200 shadow-lg">
              <CardContent className="p-4 text-center">
                <div className="text-2xl mb-1 text-yellow-700">{planToWatchShows.length}</div>
                <div className="text-yellow-600">Plan to Watch</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Currently Watching */}
        {watchingShows.length > 0 && (
          <div className="mb-8">
            <h3 className="text-2xl mb-4 text-foreground">Currently Watching</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {watchingShows.map(item => (
                <Card key={item.id} className="bg-card border-border hover:border-primary transition-colors shadow-lg">
                  <CardContent className="p-4">
                    <div className="flex space-x-4">
                      <div className="w-20 h-28 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        <ImageWithFallback 
                          src={getPosterUrl(item.shows.poster_path)}
                          alt={item.shows.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-card-foreground mb-2 truncate">{item.shows.title}</h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between mb-2">
                            <StatusBadge status={item.watch_status} />
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm text-muted-foreground whitespace-nowrap">Season</span>
                            <Select
                              value={(item.current_season || 1).toString()}
                              onValueChange={(value) => handleSeasonChange(item, parseInt(value))}
                              onOpenChange={(open) => {
                                if (open && !seasonDataCache[item.show_id]) {
                                  loadSeasonData(item);
                                }
                              }}
                              disabled={savingProgress[item.show_id] || (seasonDataCache[item.show_id]?.loading)}
                            >
                              <SelectTrigger className="w-20 h-8 text-sm">
                                {seasonDataCache[item.show_id]?.loading ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <SelectValue />
                                )}
                              </SelectTrigger>
                              <SelectContent className="!max-h-[400px]">
                                {seasonDataCache[item.show_id]?.error ? (
                                  <div className="p-2 text-sm text-red-500">{seasonDataCache[item.show_id].error}</div>
                                ) : (() => {
                                  const totalSeasons = seasonDataCache[item.show_id]?.totalSeasons || 0;
                                  const currentSeason = item.current_season || 1;
                                  
                                  // If data hasn't loaded yet, at least show the current season and a few surrounding ones
                                  if (totalSeasons === 0) {
                                    const minSeason = Math.max(1, currentSeason - 2);
                                    const maxSeason = currentSeason + 10; // Show some padding
                                    return Array.from({ length: maxSeason - minSeason + 1 }, (_, i) => minSeason + i).map(seasonNum => (
                                      <SelectItem key={seasonNum} value={seasonNum.toString()}>
                                        {seasonNum}
                                      </SelectItem>
                                    ));
                                  }
                                  
                                  // Otherwise show all available seasons
                                  return Array.from({ length: totalSeasons }, (_, i) => i + 1).map(seasonNum => (
                                    <SelectItem key={seasonNum} value={seasonNum.toString()}>
                                      {seasonNum}
                                    </SelectItem>
                                  ));
                                })()}
                              </SelectContent>
                            </Select>
                            <span className="text-sm text-muted-foreground whitespace-nowrap">Episode</span>
                            <Select
                              value={(item.current_episode || 1).toString()}
                              onValueChange={(value) => handleEpisodeChange(item, parseInt(value))}
                              onOpenChange={async (open) => {
                                if (open) {
                                  // Ensure season data is loaded
                                  if (!seasonDataCache[item.show_id]) {
                                    await loadSeasonData(item);
                                  }
                                  // Ensure episode count for current season is loaded
                                  const cached = seasonDataCache[item.show_id];
                                  if (cached && !cached.episodeCounts[item.current_season]) {
                                    await getEpisodeCount(item, item.current_season);
                                  }
                                }
                              }}
                              disabled={savingProgress[item.show_id] || (seasonDataCache[item.show_id]?.loading)}
                            >
                              <SelectTrigger className="w-20 h-8 text-sm">
                                {savingProgress[item.show_id] ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <SelectValue />
                                )}
                              </SelectTrigger>
                              <SelectContent className="!max-h-[400px]">
                                {(() => {
                                  const cached = seasonDataCache[item.show_id];
                                  const currentSeason = item.current_season || 1;
                                  const episodeCount = cached?.episodeCounts[currentSeason];
                                  
                                  // If loading, show loading message
                                  if (cached?.loading || (episodeCount === undefined && cached)) {
                                    return <div className="p-2 text-sm text-muted-foreground">Loading...</div>;
                                  }
                                  
                                  // If error, show error message
                                  if (cached?.error) {
                                    return <div className="p-2 text-sm text-red-500">{cached.error}</div>;
                                  }
                                  
                                  // If we have episode count, show episodes
                                  if (episodeCount && episodeCount > 0) {
                                    return Array.from({ length: episodeCount }, (_, i) => i + 1).map(epNum => (
                                      <SelectItem key={epNum} value={epNum.toString()}>
                                        {epNum}
                                      </SelectItem>
                                    ));
                                  }
                                  
                                  // Fallback: show at least current episode and some surrounding ones
                                  const currentEpisode = item.current_episode || 1;
                                  const minEpisode = Math.max(1, currentEpisode - 2);
                                  const maxEpisode = Math.max(currentEpisode + 10, 15); // Show padding, min 15 episodes
                                  return Array.from({ length: maxEpisode - minEpisode + 1 }, (_, i) => minEpisode + i).map(epNum => (
                                    <SelectItem key={epNum} value={epNum.toString()}>
                                      {epNum}
                                    </SelectItem>
                                  ));
                                })()}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <Star className="w-4 h-4 text-yellow-600 mr-1" />
                              <span className="text-muted-foreground">{item.shows.rating?.toFixed(1) || 'N/A'}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Select
                              value={item.watch_status}
                              onValueChange={(newStatus) => handleStatusUpdate(item.show_id, newStatus)}
                              disabled={updatingStatus === item.show_id}
                            >
                              <SelectTrigger className="w-36 h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="watching">Watching</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="want_to_watch">Plan to Watch</SelectItem>
                                <SelectItem value="dropped">Dropped</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRemoveFromWatchlist(item.show_id, item.shows.title)}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* All Shows */}
        <div>
          <h3 className="text-2xl mb-4 text-foreground">All Shows</h3>
          {watchlist.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {watchlist.map(item => (
                <Card key={item.id} className="bg-card border-border hover:border-primary transition-colors group cursor-pointer shadow-lg">
                  <CardContent className="p-3">
                    <div className="aspect-[2/3] mb-3 rounded-lg overflow-hidden bg-muted relative">
                      <ImageWithFallback 
                        src={getPosterUrl(item.shows.poster_path)}
                        alt={item.shows.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    <h4 className="text-card-foreground text-sm mb-2 truncate" title={item.shows.title}>
                      {item.shows.title}
                    </h4>
                    <div className="space-y-2">
                      <StatusBadge status={item.watch_status} />
                      <div className="text-xs text-muted-foreground">
                        {item.shows.rating?.toFixed(1) || 'N/A'} rating
                      </div>
                      <div className="space-y-1">
                        <Select
                          value={item.watch_status}
                          onValueChange={(newStatus) => handleStatusUpdate(item.show_id, newStatus)}
                          disabled={updatingStatus === item.show_id}
                        >
                          <SelectTrigger className="w-full h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="watching">Watching</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="want_to_watch">Plan to Watch</SelectItem>
                            <SelectItem value="dropped">Dropped</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs px-2 py-1 h-auto w-full"
                          onClick={() => handleRemoveFromWatchlist(item.show_id, item.shows.title)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg mb-4">
                Your watchlist is empty. Start adding shows!
              </p>
              <Button onClick={() => router.push('/search')}>
                <Search className="w-4 h-4 mr-2" />
                Search Shows
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}