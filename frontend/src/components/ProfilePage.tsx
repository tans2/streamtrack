import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Skeleton } from "./ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Settings, Search, Star, Play, Calendar, Loader2, Bell, BellOff, LogOut, Users } from "lucide-react";
import { staggerContainer, fadeInUp, cardHover } from '@/lib/animations';
import { SkeletonGrid } from './ui/skeleton-card';
import { NavBar } from './ui/nav-bar';
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { watchlistService, WatchlistItem } from '@/services/watchlistService';
import { showService, Show } from '@/services/showService';
import { notificationService } from '@/services/notificationService';
import { watchGroupService, WatchGroup } from '@/services/watchGroupService';
import { toast } from 'sonner';
import ShowDetailsModal from './ShowDetailsModal';
import CreateGroupDialog from './CreateGroupDialog';
import { Switch } from "./ui/switch";

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
  
  // Modal state for show details
  const [selectedShow, setSelectedShow] = useState<Show | null>(null);
  const [selectedShowSeason, setSelectedShowSeason] = useState<number>(1);
  const [showModalOverview, setShowModalOverview] = useState<boolean>(false);
  const [notificationToggles, setNotificationToggles] = useState<Record<string, boolean>>({});
  const [togglingNotification, setTogglingNotification] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'watching' | 'completed' | 'want_to_watch'>('all');
  const [myGroups, setMyGroups] = useState<WatchGroup[]>([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  const { user, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    loadWatchlist();
    loadGroups();
  }, []);

  // Handle deep links from digest email CTAs
  useEffect(() => {
    if (!watchlist.length || loading) return;

    const showId = searchParams.get('showId');
    const action = searchParams.get('action');
    const season = searchParams.get('season');
    const episode = searchParams.get('episode');

    if (showId) {
      // Find and scroll to the show card
      const element = document.getElementById(`show-${showId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
        setTimeout(() => {
          element.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
        }, 3000);
      }

      // Auto-update episode progress when action=update with season/episode
      if (action === 'update' && season && episode) {
        const seasonNum = parseInt(season, 10);
        const episodeNum = parseInt(episode, 10);
        const item = watchlist.find(w => w.show_id === showId);
        if (item && !isNaN(seasonNum) && !isNaN(episodeNum)) {
          // Only update if the deep link episode is ahead of current progress
          const isAhead = seasonNum > (item.current_season || 1) ||
            (seasonNum === (item.current_season || 1) && episodeNum > (item.current_episode || 1));
          if (isAhead) {
            handleProgressUpdate(item, seasonNum, episodeNum);
          }
        }
        // Clear the query params to prevent re-triggering
        router.replace('/profile', { scroll: false });
      }
    }
  }, [watchlist, loading, searchParams]);

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

      // Initialize notification toggles from watchlist data
      const toggles: Record<string, boolean> = {};
      normalizedData.forEach(item => {
        // Default to true if not set (notifications_enabled field from backend)
        toggles[item.show_id] = (item as any).notifications_enabled !== false;
      });
      setNotificationToggles(toggles);
    } catch (error: any) {
      console.error('Error loading watchlist:', error);
      toast.error(error.message || 'Failed to load watchlist');
    } finally {
      setLoading(false);
    }
  };

  const loadGroups = async () => {
    try {
      const groups = await watchGroupService.getMyGroups();
      setMyGroups(groups);
    } catch (error) {
      console.error('Error loading groups:', error);
    }
  };

  const handleNotificationToggle = async (showId: string, enabled: boolean) => {
    setTogglingNotification(showId);
    // Optimistic update
    setNotificationToggles(prev => ({ ...prev, [showId]: enabled }));

    try {
      await notificationService.toggleShowNotifications(showId, enabled);
      toast.success(enabled ? 'Notifications enabled for this show' : 'Notifications disabled for this show');
    } catch (error: any) {
      // Revert on error
      setNotificationToggles(prev => ({ ...prev, [showId]: !enabled }));
      toast.error('Failed to update notification preference');
    } finally {
      setTogglingNotification(null);
    }
  };

  const handleStatusUpdate = async (showId: string, newStatus: string) => {
    setUpdatingStatus(showId);
    try {
      await watchlistService.updateShowStatus(showId, { status: newStatus as any });
      toast.success('Status updated successfully');
      setWatchlist(prev =>
        prev.map(item =>
          item.show_id === showId
            ? {
                ...item,
                watch_status: newStatus as any
              }
            : item
        )
      );
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

  // Handle clicking on a show to view details (for Currently Watching - hide overview)
  const handleShowClick = async (item: WatchlistItem, showFullDetails: boolean = false) => {
    // Set the season immediately for responsive UI
    setSelectedShowSeason(item.current_season || 1);
    setShowModalOverview(showFullDetails);
    
    try {
      // Use search API to get full show details including season availability
      const searchResults = await showService.searchShows(item.shows.title, {
        country: 'US',
        limit: 5,
        seasonMode: 'compact',
      });
      
      // Find the matching show by tmdb_id
      const matchingShow = searchResults.find(show => show.tmdb_id === item.shows.tmdb_id);
      
      if (matchingShow) {
        setSelectedShow(matchingShow);
      } else if (searchResults.length > 0) {
        // If exact match not found, use first result (likely the same show)
        setSelectedShow(searchResults[0]);
      } else {
        // Fallback to basic show details
        const showDetails = await showService.getShowDetails(item.shows.tmdb_id);
        setSelectedShow(showDetails);
      }
    } catch (error: any) {
      console.error('Error fetching show details:', error);
      // Fallback: create a basic Show object from the watchlist item
      const basicShow: Show = {
        id: item.shows.id,
        tmdb_id: item.shows.tmdb_id,
        title: item.shows.title,
        overview: item.shows.overview || '',
        poster_path: item.shows.poster_path,
        backdrop_path: item.shows.backdrop_path,
        first_air_date: item.shows.first_air_date,
        status: item.shows.status || 'Unknown',
        type: item.shows.type || 'tv',
        genres: item.shows.genres || [],
        rating: item.shows.rating || 0,
        popularity: item.shows.popularity || 0,
        totalSeasons: (item.shows as any).total_seasons,
      };
      setSelectedShow(basicShow);
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
  const filteredAllShows = activeFilter === 'completed'
    ? completedShows
    : activeFilter === 'want_to_watch'
      ? planToWatchShows
      : watchlist;

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
      <div className="min-h-screen text-foreground pb-20 md:pb-0">
        <NavBar
          variant="authenticated"
          pageTitle="My Watchlist"
          actions={
            <>
              <Button variant="ghost" className="text-primary hover:text-primary hover:bg-primary/10" onClick={() => router.push('/search')}>
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">Search Shows</span>
              </Button>
              <Button variant="ghost" className="text-primary hover:text-primary hover:bg-primary/10" onClick={() => router.push('/settings')}>
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Settings</span>
              </Button>
              <Button variant="ghost" className="text-primary hover:text-primary hover:bg-primary/10" onClick={() => logout()}>
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </>
          }
        />
        <div className="container mx-auto px-3 sm:px-6 py-4 sm:py-8">
          <div className="mb-8">
            <div className="w-64 h-8 bg-muted rounded animate-pulse mb-4" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
          <div className="w-48 h-8 bg-muted rounded animate-pulse mb-4" />
          <SkeletonGrid count={8} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-foreground pb-20 md:pb-0">
      <NavBar
        variant="authenticated"
        pageTitle="My Watchlist"
        actions={
          <>
            <Button variant="ghost" className="text-primary hover:text-primary hover:bg-primary/10" onClick={() => router.push('/search')}>
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Search Shows</span>
            </Button>
            <Button variant="ghost" className="text-primary hover:text-primary hover:bg-primary/10" onClick={() => router.push('/settings')}>
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </Button>
            <Button variant="ghost" className="text-primary hover:text-primary hover:bg-primary/10" onClick={() => logout()}>
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </>
        }
      />

      <div className="container mx-auto px-3 sm:px-6 py-4 sm:py-8">
        {/* User Stats */}
        <div className="mb-8">
          <h2 className="text-xl sm:text-2xl md:text-3xl mb-4 text-foreground">
            Welcome back, {user?.name || 'User'}! 👋
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className="text-left"
            >
              <Card className={`border-border shadow-lg transition-colors ${activeFilter === 'all' ? 'bg-primary/10 border-primary' : 'bg-card hover:border-primary'}`}>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl mb-1 text-primary">{watchlist.length}</div>
                  <div className="text-muted-foreground">Total Shows</div>
                </CardContent>
              </Card>
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('watching')}
              className="text-left"
            >
              <Card className={`border-green-200 shadow-lg transition-colors ${activeFilter === 'watching' ? 'bg-green-100 border-green-400' : 'bg-green-50 hover:border-green-300'}`}>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl mb-1 text-green-700">{watchingShows.length}</div>
                  <div className="text-green-600">Currently Watching</div>
                </CardContent>
              </Card>
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('completed')}
              className="text-left"
            >
              <Card className={`border-blue-200 shadow-lg transition-colors ${activeFilter === 'completed' ? 'bg-blue-100 border-blue-400' : 'bg-blue-50 hover:border-blue-300'}`}>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl mb-1 text-blue-700">{completedShows.length}</div>
                  <div className="text-blue-600">Completed</div>
                </CardContent>
              </Card>
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('want_to_watch')}
              className="text-left"
            >
              <Card className={`border-yellow-200 shadow-lg transition-colors ${activeFilter === 'want_to_watch' ? 'bg-yellow-100 border-yellow-400' : 'bg-yellow-50 hover:border-yellow-300'}`}>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl mb-1 text-yellow-700">{planToWatchShows.length}</div>
                  <div className="text-yellow-600">Plan to Watch</div>
                </CardContent>
              </Card>
            </button>
          </div>
        </div>

        {/* My Watch Groups */}
        {myGroups.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl sm:text-2xl mb-4 text-foreground">Watch Groups</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {myGroups.map(group => {
                const posterUrl = group.shows?.poster_path
                  ? `https://image.tmdb.org/t/p/w200${group.shows.poster_path}`
                  : null;
                return (
                  <Card
                    key={group.id}
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => router.push(`/groups/${group.id}`)}
                  >
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-center gap-3">
                        {posterUrl && (
                          <div className="w-10 flex-shrink-0">
                            <ImageWithFallback
                              src={posterUrl}
                              alt={group.shows?.title || ''}
                              width={40}
                              height={60}
                              className="rounded w-full"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{group.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{group.shows?.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            <Users className="w-3 h-3 inline mr-1" />
                            {group.member_count} member{group.member_count !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Currently Watching */}
        {(activeFilter === 'all' || activeFilter === 'watching') && watchingShows.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl sm:text-2xl text-foreground">Currently Watching</h3>
              <Button
                variant="outline"
                size="sm"
                className="text-sm"
                onClick={() => setShowCreateGroup(true)}
              >
                <Users className="w-4 h-4 mr-1" />
                Create Watch Group
              </Button>
            </div>
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6"
              variants={staggerContainer}
              initial="hidden"
              animate="show"
            >
              {watchingShows.map(item => (
                <motion.div key={item.id} variants={fadeInUp} {...cardHover}>
                <Card id={`show-${item.show_id}`} className="bg-card border-border hover:border-primary transition-colors shadow-lg h-auto">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex gap-3 sm:gap-4">
                      <div
                        className="w-20 sm:w-24 flex-shrink-0 cursor-pointer group"
                        onClick={() => handleShowClick(item, false)}
                      >
                        <div className="aspect-[2/3] rounded-lg overflow-hidden bg-muted relative">
                          <ImageWithFallback 
                            src={getPosterUrl(item.shows.poster_path)}
                            alt={item.shows.title}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <Search className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col">
                        <h4 
                          className="text-card-foreground font-medium mb-2 truncate cursor-pointer hover:text-primary transition-colors"
                          onClick={() => handleShowClick(item, false)}
                        >
                          {item.shows.title}
                        </h4>
                        <div className="space-y-3 flex-1">
                          <StatusBadge status={item.watch_status} />
                          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                            <span className="text-sm text-muted-foreground whitespace-nowrap"><span className="sm:hidden">S</span><span className="hidden sm:inline">Season</span></span>
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
                              <SelectTrigger className="w-16 sm:w-20 h-9 sm:h-8 text-sm">
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
                            <span className="text-sm text-muted-foreground whitespace-nowrap"><span className="sm:hidden">E</span><span className="hidden sm:inline">Episode</span></span>
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
                              <SelectTrigger className="w-16 sm:w-20 h-9 sm:h-8 text-sm">
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
                          <div className="flex items-center">
                            <Star className="w-4 h-4 text-yellow-600 mr-1" />
                            <span className="text-sm text-muted-foreground">{item.shows.rating?.toFixed(1) || 'N/A'}</span>
                          </div>
                          <div className="flex gap-2 flex-wrap mt-auto pt-2">
                            <Select
                              value={item.watch_status}
                              onValueChange={(newStatus) => handleStatusUpdate(item.show_id, newStatus)}
                              disabled={updatingStatus === item.show_id}
                            >
                              <SelectTrigger className="w-24 sm:w-28 h-9 sm:h-8 text-sm">
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
                              className="h-9 sm:h-8 text-sm hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                              onClick={() => handleRemoveFromWatchlist(item.show_id, item.shows.title)}
                            >
                              Remove
                            </Button>
                          </div>
                          {/* Notification Toggle & Create Group */}
                          <div className="flex items-center justify-between pt-2 border-t border-border mt-2">
                            <div className="flex items-center gap-2">
                              {notificationToggles[item.show_id] ? (
                                <Bell className="w-4 h-4 text-primary" />
                              ) : (
                                <BellOff className="w-4 h-4 text-muted-foreground" />
                              )}
                              <span className="text-xs text-muted-foreground">Notifications</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={notificationToggles[item.show_id] ?? true}
                                onCheckedChange={(checked) => handleNotificationToggle(item.show_id, checked)}
                                disabled={togglingNotification === item.show_id}
                                className=""
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        )}

        {/* All Shows */}
        {(activeFilter === 'all' || activeFilter === 'completed' || activeFilter === 'want_to_watch') && (
          <div>
            <h3 className="text-xl sm:text-2xl mb-4 text-foreground">
              {activeFilter === 'completed' ? 'Completed' : activeFilter === 'want_to_watch' ? 'Plan to Watch' : 'All Shows'}
            </h3>
            {filteredAllShows.length > 0 ? (
            <motion.div
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 sm:gap-4"
              variants={staggerContainer}
              initial="hidden"
              animate="show"
            >
              {filteredAllShows.map(item => (
                <motion.div key={item.id} variants={fadeInUp} {...cardHover}>
                <Card id={`show-${item.show_id}`} className="bg-card border-border hover:border-primary transition-colors group cursor-pointer shadow-lg">
                  <CardContent className="p-2 sm:p-3">
                    <div 
                      className="aspect-[2/3] mb-3 rounded-lg overflow-hidden bg-muted relative cursor-pointer"
                      onClick={() => handleShowClick(item, true)}
                    >
                      <ImageWithFallback 
                        src={getPosterUrl(item.shows.poster_path)}
                        alt={item.shows.title}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Search className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    <h4 
                      className="text-card-foreground text-sm mb-2 truncate cursor-pointer hover:text-primary transition-colors" 
                      title={item.shows.title}
                      onClick={() => handleShowClick(item, true)}
                    >
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
                          <SelectTrigger className="w-full h-9 sm:h-7 text-xs">
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
                          className="text-xs px-2 py-2 sm:py-1 h-auto w-full hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                          onClick={() => handleRemoveFromWatchlist(item.show_id, item.shows.title)}
                        >
                          Remove
                        </Button>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-border mt-2">
                        <div className="flex items-center gap-2">
                          {notificationToggles[item.show_id] ? (
                            <Bell className="w-4 h-4 text-primary" />
                          ) : (
                            <BellOff className="w-4 h-4 text-muted-foreground" />
                          )}
                          <span className="text-xs text-muted-foreground">Notifications</span>
                        </div>
                        <Switch
                          checked={notificationToggles[item.show_id] ?? true}
                          onCheckedChange={(checked) => handleNotificationToggle(item.show_id, checked)}
                          disabled={togglingNotification === item.show_id}
                          className=""
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                </motion.div>
              ))}
            </motion.div>
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
        )}
      </div>
      
      {/* Show Details Modal */}
      <ShowDetailsModal
        show={selectedShow}
        isOpen={!!selectedShow}
        onClose={() => setSelectedShow(null)}
        isInWatchlist={true}  // Always true since we're viewing from watchlist
        defaultSeason={selectedShowSeason}
        hideOverview={!showModalOverview}  // Show overview for "All Shows", hide for "Currently Watching"
        hideWatchlistButton={true}  // Hide watchlist button since already in watchlist
      />

      {/* Create Group Dialog */}
      <CreateGroupDialog
        open={showCreateGroup}
        onOpenChange={setShowCreateGroup}
        watchlist={watchingShows}
        onCreated={() => loadGroups()}
      />
    </div>
  );
}