import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Play, Star, Loader2, Bell, BellOff, Users, Trash2, Plus, ArrowRight, Settings, MoreHorizontal, Sparkles, Copy, Check, Gift } from "lucide-react";
import { staggerContainer, fadeInUp } from '@/lib/animations';
import { NavBar } from './ui/nav-bar';
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { watchlistService, WatchlistItem } from '@/services/watchlistService';
import { showService, Show } from '@/services/showService';
import { notificationService } from '@/services/notificationService';
import { watchGroupService, WatchGroup } from '@/services/watchGroupService';
import { picksService, Pick } from '@/services/picksService';
import { authService } from '@/services/authService';
import { toast } from 'sonner';
import ShowDetailsModal from './ShowDetailsModal';
import CreateGroupDialog from './CreateGroupDialog';
import { Switch } from "./ui/switch";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter,
  AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel,
} from "./ui/alert-dialog";

interface ProfilePageProps {
  onNavigate: (page: string) => void;
}

interface SeasonData {
  totalSeasons: number;
  episodeCounts: Record<number, number>;
  loading: boolean;
  error: string | null;
}

export default function ProfilePage({ onNavigate }: ProfilePageProps) {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [seasonDataCache, setSeasonDataCache] = useState<Record<string, SeasonData>>({});
  const [savingProgress, setSavingProgress] = useState<Record<string, boolean>>({});

  const [selectedShow, setSelectedShow] = useState<Show | null>(null);
  const [selectedShowSeason, setSelectedShowSeason] = useState<number>(1);
  const [showModalOverview, setShowModalOverview] = useState<boolean>(false);
  const [notificationToggles, setNotificationToggles] = useState<Record<string, boolean>>({});
  const [togglingNotification, setTogglingNotification] = useState<string | null>(null);
  const [activeBottomTab, setActiveBottomTab] = useState<'completed' | 'not_started' | 'dropped'>('completed');
  const [myGroups, setMyGroups] = useState<WatchGroup[]>([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [removeConfirm, setRemoveConfirm] = useState<{ showId: string; title: string } | null>(null);
  const [openCardMenuId, setOpenCardMenuId] = useState<string | null>(null);
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);
  const [referralData, setReferralData] = useState<{ referral_code: string | null; referrals: { name: string; joined_at: string }[]; count: number } | null>(null);
  const [copiedReferral, setCopiedReferral] = useState(false);
  const [myPickShowIds, setMyPickShowIds] = useState<Set<string>>(new Set());
  const [myPicksList, setMyPicksList] = useState<Pick[]>([]);
  const [pickNoteInputs, setPickNoteInputs] = useState<Record<string, string>>({});
  const [pickPanelOpen, setPickPanelOpen] = useState<string | null>(null);
  const [addingPick, setAddingPick] = useState<string | null>(null);

  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    loadWatchlist();
    loadGroups();
    loadEmailVerification();
    loadMyPicks();
    loadReferrals();
  }, []);

  const loadReferrals = async () => {
    try {
      const data = await authService.getReferrals();
      setReferralData(data);
    } catch (err) {
      console.error('[Scout] loadReferrals failed:', err);
    }
  };

  const handleCopyReferralCode = async () => {
    if (!referralData?.referral_code) return;
    await navigator.clipboard.writeText(referralData.referral_code);
    setCopiedReferral(true);
    setTimeout(() => setCopiedReferral(false), 2000);
  };

  const loadMyPicks = async () => {
    try {
      const picks = await picksService.getMyPicks();
      setMyPickShowIds(new Set(picks.map((p) => p.show_id)));
      setMyPicksList(picks);
    } catch (err) {
      console.error('[Scout] loadMyPicks failed:', err);
    }
  };

  const handleTogglePick = async (showId: string, showTitle: string) => {
    if (myPickShowIds.has(showId)) {
      try {
        await picksService.removePick(showId);
        setMyPickShowIds(prev => { const s = new Set(prev); s.delete(showId); return s; });
        setMyPicksList(prev => prev.filter(p => p.show_id !== showId));
        toast.success(`Removed "${showTitle}" from your Picks`);
      } catch {
        toast.error('Failed to remove pick');
      }
      setPickPanelOpen(null);
      return;
    }
    setPickPanelOpen(showId);
  };

  const handleConfirmPick = async (showId: string, showTitle: string) => {
    setAddingPick(showId);
    try {
      const note = pickNoteInputs[showId] || undefined;
      const newPick = await picksService.addPick(showId, note);
      setMyPickShowIds(prev => new Set(Array.from(prev).concat(showId)));
      if (newPick) setMyPicksList(prev => [newPick, ...prev]);
      toast.success(`Added "${showTitle}" to your Picks!`);
      setPickPanelOpen(null);
      setPickNoteInputs(prev => { const n = { ...prev }; delete n[showId]; return n; });
    } catch {
      toast.error('Failed to add pick');
    } finally {
      setAddingPick(null);
    }
  };

  const loadEmailVerification = async () => {
    try {
      const prefs = await notificationService.getPreferences();
      setEmailVerified(prefs.emailVerified);
    } catch {
      // silently fail
    }
  };

  // Handle deep links from digest email CTAs
  useEffect(() => {
    if (!watchlist.length || loading) return;

    const showId = searchParams.get('showId');
    const action = searchParams.get('action');
    const season = searchParams.get('season');
    const episode = searchParams.get('episode');

    if (showId) {
      const element = document.getElementById(`show-${showId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
        setTimeout(() => {
          element.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
        }, 3000);
      }

      if (action === 'update' && season && episode) {
        const seasonNum = parseInt(season, 10);
        const episodeNum = parseInt(episode, 10);
        const item = watchlist.find(w => w.show_id === showId);
        if (item && !isNaN(seasonNum) && !isNaN(episodeNum)) {
          const isAhead = seasonNum > (item.current_season || 1) ||
            (seasonNum === (item.current_season || 1) && episodeNum > (item.current_episode || 1));
          if (isAhead) {
            handleProgressUpdate(item, seasonNum, episodeNum);
          }
        }
        router.replace('/profile', { scroll: false });
      }
    }
  }, [watchlist, loading, searchParams]);

  // Auto-load season data for watching shows (for progress bars)
  useEffect(() => {
    if (!loading && watchlist.length > 0) {
      const watching = watchlist.filter(item => item.watch_status === 'watching');
      watching.forEach(item => {
        if (!seasonDataCache[item.show_id]) {
          loadSeasonData(item);
        }
      });
    }
  }, [loading, watchlist.length]);

  const loadWatchlist = async () => {
    setLoading(true);
    try {
      const data = await watchlistService.getWatchlist();
      const normalizedData = data.map(item => ({
        ...item,
        current_season: (item.current_season && item.current_season > 0) ? item.current_season : 1,
        current_episode: (item.current_episode && item.current_episode > 0) ? item.current_episode : 1
      }));
      setWatchlist(normalizedData);

      const toggles: Record<string, boolean> = {};
      normalizedData.forEach(item => {
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
    setNotificationToggles(prev => ({ ...prev, [showId]: enabled }));

    try {
      await notificationService.toggleShowNotifications(showId, enabled);
      toast.success(enabled ? 'Notifications enabled for this show' : 'Notifications disabled for this show');
    } catch (error: any) {
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
            ? { ...item, watch_status: newStatus as any }
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
      loadWatchlist();
    } catch (error: any) {
      console.error('Error removing from watchlist:', error);
      toast.error(error.message || 'Failed to remove from watchlist');
    }
  };

  const handleShowClick = async (item: WatchlistItem, showFullDetails: boolean = false) => {
    setSelectedShowSeason(item.current_season || 1);
    setShowModalOverview(showFullDetails);

    try {
      const searchResults = await showService.searchShows(item.shows.title, {
        country: 'US',
        limit: 5,
        seasonMode: 'compact',
      });

      const matchingShow = searchResults.find(show => show.tmdb_id === item.shows.tmdb_id);

      if (matchingShow) {
        setSelectedShow(matchingShow);
      } else if (searchResults.length > 0) {
        setSelectedShow(searchResults[0]);
      } else {
        const showDetails = await showService.getShowDetails(item.shows.tmdb_id);
        setSelectedShow(showDetails);
      }
    } catch (error: any) {
      console.error('Error fetching show details:', error);
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

  const loadSeasonData = async (item: WatchlistItem) => {
    const showId = item.show_id;
    const tmdbId = item.shows.tmdb_id;

    if (seasonDataCache[showId] && !seasonDataCache[showId].loading) {
      return;
    }

    setSeasonDataCache(prev => ({
      ...prev,
      [showId]: { totalSeasons: 0, episodeCounts: {}, loading: true, error: null }
    }));

    try {
      const seasonInfo = await showService.getSeasonInfo(tmdbId);

      const seasonData: SeasonData = {
        totalSeasons: seasonInfo.total_seasons || 0,
        episodeCounts: {},
        loading: false,
        error: null
      };

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

      setSeasonDataCache(prev => ({ ...prev, [showId]: seasonData }));
    } catch (error: any) {
      console.error('Error loading season data:', error);
      const errorMessage = error.message || 'Unable to fetch data, please try again';
      setSeasonDataCache(prev => ({
        ...prev,
        [showId]: { totalSeasons: 0, episodeCounts: {}, loading: false, error: errorMessage }
      }));
      toast.error(errorMessage);
    }
  };

  const getEpisodeCount = async (item: WatchlistItem, seasonNumber: number): Promise<number> => {
    const showId = item.show_id;
    const cached = seasonDataCache[showId];

    if (cached?.episodeCounts[seasonNumber]) {
      return cached.episodeCounts[seasonNumber];
    }

    try {
      const seasonInfo = await showService.getSeasonInfo(item.shows.tmdb_id, seasonNumber);
      if (seasonInfo.season) {
        const episodeCount = seasonInfo.season.episode_count;
        setSeasonDataCache(prev => ({
          ...prev,
          [showId]: {
            ...prev[showId],
            episodeCounts: { ...prev[showId]?.episodeCounts, [seasonNumber]: episodeCount }
          }
        }));
        return episodeCount;
      }
    } catch (error: any) {
      console.error(`Error fetching episode count for season ${seasonNumber}:`, error);
      if (error.message?.includes('not yet released')) {
        toast.error(error.message);
        throw error;
      }
      toast.error('Unable to fetch data, please try again');
    }
    return 0;
  };

  const handleSeasonChange = async (item: WatchlistItem, newSeason: number) => {
    const showId = item.show_id;
    const cached = seasonDataCache[showId];

    if (!cached?.episodeCounts[newSeason]) {
      try {
        await getEpisodeCount(item, newSeason);
      } catch (error) {
        return;
      }
    }

    await handleProgressUpdate(item, newSeason, 1);
  };

  const handleEpisodeChange = async (item: WatchlistItem, newEpisode: number) => {
    await handleProgressUpdate(item, item.current_season, newEpisode);
  };

  const handleProgressUpdate = async (item: WatchlistItem, season: number, episode: number) => {
    const showId = item.show_id;

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

      setWatchlist(prev => prev.map(show =>
        show.show_id === showId
          ? { ...show, current_season: season, current_episode: episode }
          : show
      ));

      toast.success(`Progress updated to Season ${season}, Episode ${episode}`);
    } catch (error: any) {
      console.error('Error updating progress:', error);
      const errorMessage = error.message || 'Failed to update progress';

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

  const watchingShows = watchlist
    .filter(item => item.watch_status === 'watching')
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  const completedShows = watchlist.filter(item => item.watch_status === 'completed');
  const planToWatchShows = watchlist.filter(item => item.watch_status === 'want_to_watch');
  const droppedShows = watchlist.filter(item => item.watch_status === 'dropped');

  const activeBottomShows = activeBottomTab === 'completed'
    ? completedShows
    : activeBottomTab === 'not_started'
      ? planToWatchShows
      : droppedShows;

  const getProgressPercent = (item: WatchlistItem): number => {
    const cached = seasonDataCache[item.show_id];
    const episodeCount = cached?.episodeCounts[item.current_season];
    if (!episodeCount) return 0;
    return Math.round(((item.current_episode || 1) / episodeCount) * 100);
  };

  const getCountdownLabel = (nextAirDate?: string | null): string | null => {
    if (!nextAirDate) return null;
    const days = Math.round((new Date(nextAirDate).getTime() - Date.now()) / 86400000);
    if (days === 0) return "Airing today!";
    if (days > 0) return `Next ep in ${days}d`;
    return null;
  };

  const getPosterUrl = (posterPath?: string) => {
    if (!posterPath) return '';
    return `https://image.tmdb.org/t/p/w300${posterPath}`;
  };

  const bottomTabs = [
    { key: 'completed' as const, label: 'Completed', count: completedShows.length },
    { key: 'not_started' as const, label: 'Not Started', count: planToWatchShows.length },
    { key: 'dropped' as const, label: 'Dropped', count: droppedShows.length },
  ];

  if (loading) {
    return (
      <div className="min-h-screen text-foreground pb-20 md:pb-0">
        <NavBar
          variant="authenticated"
        />
        <div className="max-w-[1400px] mx-auto px-3 sm:px-6 md:px-10 py-6">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-16 h-16 rounded-full bg-muted animate-pulse" />
            <div>
              <div className="w-40 h-7 bg-muted rounded animate-pulse mb-2" />
              <div className="w-28 h-4 bg-muted rounded animate-pulse" />
            </div>
          </div>
          <div className="w-48 h-6 bg-muted rounded animate-pulse mb-4" />
          <div className="flex gap-4 overflow-hidden">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="w-36 sm:w-44 md:w-52 flex-shrink-0">
                <div className="aspect-[2/3] rounded-2xl bg-muted animate-pulse mb-2" />
                <div className="w-24 h-4 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-foreground pb-20 md:pb-0">
      <NavBar
        variant="authenticated"
      />

      <div className="max-w-[1400px] mx-auto px-3 sm:px-6 md:px-10 py-6">
        {/* Profile Header */}
        <div className="flex items-center justify-between gap-4 mb-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-card border-2 border-border overflow-hidden flex items-center justify-center flex-shrink-0">
              <img src="/logo.png" alt="Avatar" className="w-12 h-12" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{user?.name || 'User'}</h1>
              <div className="flex gap-6 mt-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-bold text-foreground">{watchlist.length}</span>
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">Shows</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-bold text-foreground">{myGroups.length}</span>
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">Groups</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Inline referral card — md+ only */}
            {referralData?.referral_code && (
              <div className="hidden md:flex items-center gap-3 p-3 rounded-2xl bg-card border border-border">
                <Gift className="w-4 h-4 text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-primary leading-none mb-0.5">Your Referral Code</p>
                  <p className="text-base font-bold tracking-widest text-foreground leading-none">{referralData.referral_code}</p>
                  {referralData.count > 0 && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {referralData.count} {referralData.count === 1 ? 'person' : 'people'} joined
                      {referralData.count <= 2 && ` — ${referralData.referrals.map((r: any) => r.name).join(', ')}`}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleCopyReferralCode}
                  className="p-1.5 rounded-full hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
                  aria-label="Copy referral code"
                >
                  {copiedReferral ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
            <button
              onClick={() => router.push('/settings')}
              className="relative p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              aria-label="Settings"
            >
              <Settings className="w-5 h-5" />
              {emailVerified === false && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-background" />
              )}
            </button>
          </div>
        </div>

        {/* Referral Code Card — mobile only (md+ shows inline in header) */}
        {referralData?.referral_code && (
          <div className="md:hidden mb-8 p-4 rounded-2xl bg-card border border-border">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <Gift className="w-5 h-5 text-primary flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-0.5">Your Referral Code</p>
                  <p className="text-xl font-bold tracking-widest text-foreground">{referralData.referral_code}</p>
                  {referralData.count > 0 && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {referralData.count} {referralData.count === 1 ? 'person' : 'people'} joined
                      {referralData.count <= 2 && ` — ${referralData.referrals.map((r: any) => r.name).join(', ')}`}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={handleCopyReferralCode}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-border text-sm font-medium hover:bg-muted/50 transition-colors flex-shrink-0"
              >
                {copiedReferral ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                {copiedReferral ? 'Copied!' : 'Copy Code'}
              </button>
            </div>
          </div>
        )}

        {/* Currently Watching */}
        <div className="mb-10">
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-4 text-foreground">
            <Play className="w-5 h-5 text-primary fill-primary" />
            Currently Watching
          </h2>

          {watchingShows.length === 0 && (
            <div className="flex items-center gap-4 py-6 px-4 rounded-2xl bg-card/50 border border-dashed border-border/60 mb-2">
              <img src="/logo.png" alt="Scout" className="w-12 h-12 opacity-40 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Nothing playing yet</p>
                <p className="text-xs text-muted-foreground mt-0.5">Add a show and mark it as watching to see it here.</p>
              </div>
              <button
                onClick={() => router.push('/search')}
                className="ml-auto text-xs text-primary hover:text-primary/80 font-medium flex-shrink-0"
              >
                Browse Shows →
              </button>
            </div>
          )}

          <div className="-mx-3 sm:mx-0 px-3 sm:px-0 flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {watchingShows.map(item => (
              <div
                key={item.id}
                id={`show-${item.show_id}`}
                className="w-36 sm:w-44 md:w-52 flex-shrink-0 snap-start"
              >
                {/* Poster */}
                <div className="relative mb-2">
                  <div
                    className="aspect-[2/3] rounded-2xl overflow-hidden bg-muted cursor-pointer group relative"
                    onClick={() => handleShowClick(item, false)}
                  >
                    <ImageWithFallback
                      src={getPosterUrl(item.shows.poster_path)}
                      alt={item.shows.title}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  </div>
                  {/* ⋯ menu button */}
                  <button
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                    onClick={(e) => { e.stopPropagation(); setOpenCardMenuId(openCardMenuId === item.show_id ? null : item.show_id); }}
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                  {/* Dropdown menu */}
                  {openCardMenuId === item.show_id && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setOpenCardMenuId(null)} />
                      <div className="absolute top-10 right-2 z-20 bg-card border border-border rounded-xl shadow-lg py-1 min-w-[140px]">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest px-3 pt-1.5 pb-1">Change Status</p>
                        {(['completed', 'want_to_watch', 'dropped'] as const).map(status => (
                          <button
                            key={status}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-muted/60 transition-colors"
                            onClick={() => { handleStatusUpdate(item.show_id, status); setOpenCardMenuId(null); }}
                          >
                            {status === 'completed' ? 'Completed' : status === 'want_to_watch' ? 'Not Started' : 'Dropped'}
                          </button>
                        ))}
                        {(item.current_season || 1) >= 2 && (
                          <>
                            <div className="border-t border-border my-1" />
                            <button
                              className="w-full text-left px-3 py-2 text-sm hover:bg-muted/60 transition-colors flex items-center gap-2"
                              onClick={() => { handleTogglePick(item.show_id, item.shows.title); setOpenCardMenuId(null); }}
                            >
                              <Sparkles className={`w-3.5 h-3.5 ${myPickShowIds.has(item.show_id) ? 'text-primary fill-primary' : 'text-muted-foreground'}`} />
                              {myPickShowIds.has(item.show_id) ? 'Remove Pick' : 'Pick this show'}
                            </button>
                          </>
                        )}
                        <div className="border-t border-border my-1" />
                        <button
                          className="w-full text-left px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                          onClick={() => { setRemoveConfirm({ showId: item.show_id, title: item.shows.title }); setOpenCardMenuId(null); }}
                        >
                          Remove
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Title */}
                <h3
                  className="text-sm font-medium text-foreground truncate mb-2 cursor-pointer hover:text-primary transition-colors"
                  onClick={() => handleShowClick(item, false)}
                  title={item.shows.title}
                >
                  {item.shows.title}
                </h3>

                {/* Season + Episode dropdowns */}
                <div className="flex items-center gap-1.5 text-xs mb-2">
                  <span className="text-muted-foreground font-medium">S</span>
                  <Select
                    value={(item.current_season || 1).toString()}
                    onValueChange={(value) => handleSeasonChange(item, parseInt(value))}
                    onOpenChange={(open) => {
                      if (open && !seasonDataCache[item.show_id]) {
                        loadSeasonData(item);
                      }
                    }}
                    disabled={savingProgress[item.show_id] || seasonDataCache[item.show_id]?.loading}
                  >
                    <SelectTrigger className="h-7 w-14 text-xs">
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
                        if (totalSeasons === 0) {
                          const minSeason = Math.max(1, currentSeason - 2);
                          const maxSeason = currentSeason + 10;
                          return Array.from({ length: maxSeason - minSeason + 1 }, (_, i) => minSeason + i).map(s => (
                            <SelectItem key={s} value={s.toString()}>{s}</SelectItem>
                          ));
                        }
                        return Array.from({ length: totalSeasons }, (_, i) => i + 1).map(s => (
                          <SelectItem key={s} value={s.toString()}>{s}</SelectItem>
                        ));
                      })()}
                    </SelectContent>
                  </Select>
                  <span className="text-muted-foreground font-medium">E</span>
                  <Select
                    value={(item.current_episode || 1).toString()}
                    onValueChange={(value) => handleEpisodeChange(item, parseInt(value))}
                    onOpenChange={async (open) => {
                      if (open) {
                        if (!seasonDataCache[item.show_id]) {
                          await loadSeasonData(item);
                        }
                        const cached = seasonDataCache[item.show_id];
                        if (cached && !cached.episodeCounts[item.current_season]) {
                          await getEpisodeCount(item, item.current_season);
                        }
                      }
                    }}
                    disabled={savingProgress[item.show_id] || seasonDataCache[item.show_id]?.loading}
                  >
                    <SelectTrigger className="h-7 w-14 text-xs">
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
                        if (cached?.loading || (episodeCount === undefined && cached)) {
                          return <div className="p-2 text-sm text-muted-foreground">Loading...</div>;
                        }
                        if (cached?.error) {
                          return <div className="p-2 text-sm text-red-500">{cached.error}</div>;
                        }
                        if (episodeCount && episodeCount > 0) {
                          return Array.from({ length: episodeCount }, (_, i) => i + 1).map(ep => (
                            <SelectItem key={ep} value={ep.toString()}>{ep}</SelectItem>
                          ));
                        }
                        const currentEpisode = item.current_episode || 1;
                        const maxEpisode = Math.max(currentEpisode + 10, 15);
                        return Array.from({ length: maxEpisode }, (_, i) => i + 1).map(ep => (
                          <SelectItem key={ep} value={ep.toString()}>{ep}</SelectItem>
                        ));
                      })()}
                    </SelectContent>
                  </Select>
                </div>

                {/* Progress bar */}
                <Progress value={getProgressPercent(item)} className="h-1.5" />
                {/* Next episode countdown badge */}
                {(() => {
                  const label = getCountdownLabel(item.shows.next_air_date);
                  if (!label) return null;
                  const days = item.shows.next_air_date
                    ? Math.round((new Date(item.shows.next_air_date).getTime() - Date.now()) / 86400000)
                    : null;
                  const isClose = days !== null && days <= 7;
                  return (
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${isClose ? 'bg-green-500/15 text-green-600' : 'bg-muted text-muted-foreground'}`}>
                      {label}
                    </span>
                  );
                })()}
              </div>
            ))}

            {/* Add to Watchlist placeholder card */}
            <div className="w-36 sm:w-44 md:w-52 flex-shrink-0 snap-start">
              <div
                className="aspect-[2/3] rounded-2xl border-2 border-dashed border-border/60 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                onClick={() => router.push('/search')}
              >
                <Plus className="w-8 h-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground font-medium">Add Show</span>
              </div>
            </div>
          </div>

          {/* Pick note panel — for Currently Watching shows (appears below carousel) */}
          {pickPanelOpen && watchingShows.some(s => s.show_id === pickPanelOpen) && (() => {
            const show = watchingShows.find(s => s.show_id === pickPanelOpen)!;
            return (
              <div className="mt-3 p-4 rounded-2xl border border-primary/30 bg-card space-y-2">
                <p className="text-sm font-medium text-foreground">
                  Pick "{show.shows.title}"
                </p>
                <textarea
                  className="w-full text-xs rounded-lg border border-border bg-muted/50 px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                  rows={2}
                  maxLength={200}
                  placeholder="Add a note (optional) — e.g. 'Perfect for a rainy day'"
                  value={pickNoteInputs[pickPanelOpen] || ''}
                  onChange={e => setPickNoteInputs(prev => ({ ...prev, [pickPanelOpen!]: e.target.value }))}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="h-7 text-xs rounded-full px-4"
                    onClick={() => handleConfirmPick(pickPanelOpen, show.shows.title)}
                    disabled={addingPick === pickPanelOpen}
                  >
                    {addingPick === pickPanelOpen ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Pick it'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs rounded-full px-3"
                    onClick={() => { setPickPanelOpen(null); setPickNoteInputs(prev => { const n = { ...prev }; delete n[pickPanelOpen!]; return n; }); }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Bottom Section — Two Columns */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Column: Status Tabs */}
          <div>
            <div className="flex gap-3 sm:gap-6 border-b border-border mb-4">
              {bottomTabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveBottomTab(tab.key)}
                  className={`pb-3 text-xs sm:text-sm font-medium transition-colors relative whitespace-nowrap ${
                    activeBottomTab === tab.key
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                  <span className="ml-1 sm:ml-1.5 text-[10px] sm:text-xs text-muted-foreground">({tab.count})</span>
                  {activeBottomTab === tab.key && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                  )}
                </button>
              ))}
            </div>

            {activeBottomShows.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-sm text-muted-foreground">
                  No {activeBottomTab === 'completed' ? 'completed' : activeBottomTab === 'not_started' ? 'not started' : 'dropped'} shows yet
                </p>
              </div>
            ) : (
              <motion.div
                className="space-y-3"
                variants={staggerContainer}
                initial="hidden"
                animate="show"
                key={activeBottomTab}
              >
                {activeBottomShows.map(item => (
                  <motion.div
                    key={item.id}
                    variants={fadeInUp}
                    id={`show-${item.show_id}`}
                    className="p-2.5 sm:p-3 rounded-2xl bg-card border border-border hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      {/* Poster */}
                      <div
                        className="w-10 sm:w-12 flex-shrink-0 cursor-pointer"
                        onClick={() => handleShowClick(item, true)}
                      >
                        <div className="aspect-[2/3] rounded-lg overflow-hidden bg-muted">
                          <ImageWithFallback
                            src={getPosterUrl(item.shows.poster_path)}
                            alt={item.shows.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                      {/* Title + Rating */}
                      <div className="flex-1 min-w-0">
                        <h4
                          className="text-sm font-medium text-foreground truncate cursor-pointer hover:text-primary transition-colors"
                          onClick={() => handleShowClick(item, true)}
                        >
                          {item.shows.title}
                        </h4>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                          <span className="text-xs text-muted-foreground">{item.shows.rating?.toFixed(1) || 'N/A'}</span>
                        </div>
                      </div>
                      {/* Actions — visible on md+ */}
                      <div className="hidden md:flex items-center gap-2 flex-shrink-0">
                        <Select
                          value={item.watch_status}
                          onValueChange={(newStatus) => handleStatusUpdate(item.show_id, newStatus)}
                          disabled={updatingStatus === item.show_id}
                        >
                          <SelectTrigger className="h-7 w-[110px] text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="watching">Watching</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="want_to_watch">Not Started</SelectItem>
                            <SelectItem value="dropped">Dropped</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="flex items-center gap-1">
                          {notificationToggles[item.show_id] ? (
                            <Bell className="w-3.5 h-3.5 text-primary" />
                          ) : (
                            <BellOff className="w-3.5 h-3.5 text-muted-foreground" />
                          )}
                          <Switch
                            checked={notificationToggles[item.show_id] ?? true}
                            onCheckedChange={(checked) => handleNotificationToggle(item.show_id, checked)}
                            disabled={togglingNotification === item.show_id}
                          />
                        </div>
                        {(item.watch_status === 'completed' || (item.current_season ?? 1) >= 2) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            title={myPickShowIds.has(item.show_id) ? 'Remove Pick' : 'Pick this show'}
                            className={`h-7 w-7 p-0 transition-colors ${myPickShowIds.has(item.show_id) ? 'text-primary hover:text-primary/70' : 'text-muted-foreground hover:text-primary'}`}
                            onClick={() => handleTogglePick(item.show_id, item.shows.title)}
                          >
                            <Sparkles className={`w-3.5 h-3.5 ${myPickShowIds.has(item.show_id) ? 'fill-primary' : ''}`} />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                          onClick={() => setRemoveConfirm({ showId: item.show_id, title: item.shows.title })}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                    {/* Actions — mobile only, stacked below */}
                    <div className="flex md:hidden items-center gap-1.5 mt-2 pt-2 border-t border-border/50">
                      <Select
                        value={item.watch_status}
                        onValueChange={(newStatus) => handleStatusUpdate(item.show_id, newStatus)}
                        disabled={updatingStatus === item.show_id}
                      >
                        <SelectTrigger className="h-8 w-[105px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="watching">Watching</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="want_to_watch">Not Started</SelectItem>
                          <SelectItem value="dropped">Dropped</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex items-center gap-1 ml-auto">
                        {notificationToggles[item.show_id] ? (
                          <Bell className="w-3.5 h-3.5 text-primary" />
                        ) : (
                          <BellOff className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                        <Switch
                          checked={notificationToggles[item.show_id] ?? true}
                          onCheckedChange={(checked) => handleNotificationToggle(item.show_id, checked)}
                          disabled={togglingNotification === item.show_id}
                        />
                      </div>
                      {(item.watch_status === 'completed' || (item.current_season ?? 1) >= 2) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          title={myPickShowIds.has(item.show_id) ? 'Remove Pick' : 'Pick this show'}
                          className={`h-8 w-8 p-0 transition-colors ${myPickShowIds.has(item.show_id) ? 'text-primary hover:text-primary/70' : 'text-muted-foreground hover:text-primary'}`}
                          onClick={() => handleTogglePick(item.show_id, item.shows.title)}
                        >
                          <Sparkles className={`w-3.5 h-3.5 ${myPickShowIds.has(item.show_id) ? 'fill-primary' : ''}`} />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                        onClick={() => setRemoveConfirm({ showId: item.show_id, title: item.shows.title })}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    {/* Pick note panel — shown when user clicks Sparkles to add a new pick */}
                    {pickPanelOpen === item.show_id && (
                      <div className="mt-2 pt-2 border-t border-border/50 space-y-2">
                        <textarea
                          className="w-full text-xs rounded-lg border border-border bg-muted/50 px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                          rows={2}
                          maxLength={200}
                          placeholder="Add a note (optional) — e.g. 'Perfect for a rainy day'"
                          value={pickNoteInputs[item.show_id] || ''}
                          onChange={e => setPickNoteInputs(prev => ({ ...prev, [item.show_id]: e.target.value }))}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="h-7 text-xs rounded-full px-4"
                            onClick={() => handleConfirmPick(item.show_id, item.shows.title)}
                            disabled={addingPick === item.show_id}
                          >
                            {addingPick === item.show_id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Pick it'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs rounded-full px-3"
                            onClick={() => { setPickPanelOpen(null); setPickNoteInputs(prev => { const n = { ...prev }; delete n[item.show_id]; return n; }); }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>

          {/* Right Column: Watch Groups + Picks previews — desktop only */}
          <div className="hidden md:block space-y-6">

            {/* Watch Groups */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold tracking-widest text-primary uppercase flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  Watch Groups
                </h3>
                <button
                  onClick={() => setShowCreateGroup(true)}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> New Group
                </button>
              </div>

              {myGroups.length === 0 ? (
                <div className="text-center py-8 bg-card/50 rounded-2xl border border-border/50">
                  <Users className="w-7 h-7 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No groups yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {myGroups.slice(0, 3).map(group => {
                    const posterUrl = group.shows?.poster_path
                      ? `https://image.tmdb.org/t/p/w200${group.shows.poster_path}`
                      : null;
                    return (
                      <div
                        key={group.id}
                        className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border hover:border-primary/50 transition-colors cursor-pointer"
                        onClick={() => router.push(`/groups/${group.id}`)}
                      >
                        {posterUrl && (
                          <div className="w-9 flex-shrink-0">
                            <ImageWithFallback
                              src={posterUrl}
                              alt={group.shows?.title || ''}
                              width={36}
                              height={54}
                              className="rounded-lg w-full"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{group.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{group.shows?.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            <Users className="w-3 h-3 inline mr-1" />
                            {group.member_count} member{group.member_count !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      </div>
                    );
                  })}
                </div>
              )}

              {myGroups.length > 3 && (
                <button
                  onClick={() => router.push('/groups')}
                  className="mt-2 text-xs text-primary hover:underline flex items-center gap-1"
                >
                  See all {myGroups.length} groups <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Your Picks */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold tracking-widest text-primary uppercase flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Your Picks
                </h3>
                {myPicksList.length > 3 && (
                  <button
                    onClick={() => router.push('/picks')}
                    className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                  >
                    See all <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              {myPicksList.length === 0 ? (
                <div className="text-center py-8 rounded-2xl border border-dashed border-border/50">
                  <Sparkles className="w-5 h-5 text-muted-foreground mx-auto mb-1.5" />
                  <p className="text-xs text-muted-foreground">No picks yet</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Complete a season to start picking</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {myPicksList.slice(0, 3).map(pick => (
                    <div
                      key={pick.id}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors cursor-pointer"
                      onClick={() => router.push('/picks')}
                    >
                      <div className="w-8 flex-shrink-0">
                        <div className="aspect-[2/3] rounded-md overflow-hidden bg-muted">
                          <ImageWithFallback
                            src={getPosterUrl(pick.shows?.poster_path ?? undefined)}
                            alt={pick.shows?.title || ''}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{pick.shows?.title}</p>
                        {pick.note && (
                          <p className="text-[10px] text-muted-foreground italic truncate">"{pick.note}"</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {myPicksList.length <= 3 && (
                    <button
                      onClick={() => router.push('/picks')}
                      className="mt-1 text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      See all Picks <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Show Details Modal */}
      <ShowDetailsModal
        show={selectedShow}
        isOpen={!!selectedShow}
        onClose={() => setSelectedShow(null)}
        isInWatchlist={true}
        defaultSeason={selectedShowSeason}
        hideOverview={!showModalOverview}
        hideWatchlistButton={true}
      />

      {/* Create Group Dialog */}
      <CreateGroupDialog
        open={showCreateGroup}
        onOpenChange={setShowCreateGroup}
        watchlist={watchingShows}
        onCreated={() => loadGroups()}
      />

      {/* Remove Show Confirmation */}
      <AlertDialog open={!!removeConfirm} onOpenChange={(open) => !open && setRemoveConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from watchlist?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove &ldquo;{removeConfirm?.title}&rdquo; from your watchlist?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 text-white hover:bg-red-600"
              onClick={() => {
                if (removeConfirm) {
                  handleRemoveFromWatchlist(removeConfirm.showId, removeConfirm.title);
                }
                setRemoveConfirm(null);
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
