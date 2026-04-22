'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { NavBar } from './ui/nav-bar';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { picksService, Pick } from '@/services/picksService';
import { watchlistService } from '@/services/watchlistService';
import { staggerContainer, fadeInUp } from '@/lib/animations';
import { Sparkles, Plus, Check, Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w200';

function getPosterUrl(posterPath?: string | null): string {
  if (!posterPath) return '/placeholder-poster.png';
  return `${TMDB_IMAGE_BASE}${posterPath}`;
}

interface PickCardProps {
  pick: Pick;
  isMine: boolean;
  isInWatchlist: boolean;
  onAddToWatchlist: (tmdbId: number) => void;
  onRemovePick?: (showId: string) => void;
  addingId: number | null;
}

function PickCard({ pick, isMine, isInWatchlist, onAddToWatchlist, onRemovePick, addingId }: PickCardProps) {
  return (
    <motion.div
      variants={fadeInUp}
      className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border hover:border-primary/30 transition-colors"
    >
      <div className="w-12 flex-shrink-0">
        <div className="aspect-[2/3] rounded-lg overflow-hidden bg-muted">
          <ImageWithFallback
            src={getPosterUrl(pick.shows?.poster_path)}
            alt={pick.shows?.title || ''}
            className="w-full h-full object-cover"
          />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{pick.shows?.title}</p>
        {!isMine && (
          <p className="text-xs text-muted-foreground mt-0.5">picked by {pick.picker_name}</p>
        )}
        {pick.note && (
          <p className="text-xs text-muted-foreground mt-1 italic line-clamp-2">"{pick.note}"</p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {!isMine && (
          isInWatchlist ? (
            <span className="text-[10px] font-medium text-green-600 bg-green-500/10 px-2 py-1 rounded-full flex items-center gap-1">
              <Check className="w-3 h-3" /> In List
            </span>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs rounded-full px-3"
              onClick={() => onAddToWatchlist(pick.shows.tmdb_id)}
              disabled={addingId === pick.shows.tmdb_id}
            >
              {addingId === pick.shows.tmdb_id ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <><Plus className="w-3 h-3 mr-1" /> Add</>
              )}
            </Button>
          )
        )}
        {isMine && onRemovePick && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs rounded-full px-3 text-muted-foreground hover:text-red-500"
            onClick={() => onRemovePick(pick.show_id)}
          >
            Remove
          </Button>
        )}
      </div>
    </motion.div>
  );
}

export default function PicksFeedPage() {
  const [feed, setFeed] = useState<Pick[]>([]);
  const [myPicks, setMyPicks] = useState<Pick[]>([]);
  const [watchlistTmdbIds, setWatchlistTmdbIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [hasConnections, setHasConnections] = useState(true);

  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [feedData, myPicksData, watchlist] = await Promise.all([
        picksService.getFeed(),
        picksService.getMyPicks(),
        watchlistService.getWatchlist('all'),
      ]);
      setFeed(feedData);
      setMyPicks(myPicksData);
      setWatchlistTmdbIds(new Set(watchlist.map(w => w.shows.tmdb_id)));
      // If feed is empty, we'll show the empty state — connections check is implicit
      if (feedData.length === 0 && myPicksData.length === 0) {
        setHasConnections(false);
      }
    } catch (error: any) {
      toast.error('Failed to load picks');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToWatchlist = async (tmdbId: number) => {
    setAddingId(tmdbId);
    try {
      await watchlistService.addToWatchlist(tmdbId);
      setWatchlistTmdbIds(prev => new Set(Array.from(prev).concat(tmdbId)));
      toast.success('Added to your watchlist!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add to watchlist');
    } finally {
      setAddingId(null);
    }
  };

  const handleRemovePick = async (showId: string) => {
    const pick = myPicks.find(p => p.show_id === showId);
    try {
      await picksService.removePick(showId);
      setMyPicks(prev => prev.filter(p => p.show_id !== showId));
      toast.success(`Removed "${pick?.shows?.title}" from your Picks`);
    } catch {
      toast.error('Failed to remove pick');
    }
  };

  const myPickShowIds = new Set(myPicks.map(p => p.show_id));

  return (
    <div className="min-h-screen bg-background pb-24">
      <NavBar
        variant="authenticated"
      />

      <div className="container mx-auto px-3 sm:px-6 py-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Picks</h1>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : feed.length === 0 && myPicks.length === 0 ? (
          /* Empty state */
          <div className="text-center py-16">
            <img src="/logo.png" alt="Scout" className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <h2 className="text-lg font-semibold text-foreground mb-2">No picks yet</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
              Your picks feed shows up once you're in a Watch Group with friends. Complete a show and pick it to share with your group!
            </p>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => router.push('/groups')}
            >
              <Users className="w-4 h-4 mr-2" />
              Create a Group
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Friends' picks feed */}
            {feed.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold tracking-widest text-primary uppercase mb-3">
                  From your groups
                </h2>
                <motion.div
                  className="space-y-2"
                  variants={staggerContainer}
                  initial="hidden"
                  animate="show"
                >
                  {feed.map(pick => (
                    <PickCard
                      key={pick.id}
                      pick={pick}
                      isMine={false}
                      isInWatchlist={watchlistTmdbIds.has(pick.shows?.tmdb_id)}
                      onAddToWatchlist={handleAddToWatchlist}
                      addingId={addingId}
                    />
                  ))}
                </motion.div>
              </section>
            )}

            {/* My picks */}
            {myPicks.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold tracking-widest text-primary uppercase mb-3">
                  Your picks
                </h2>
                <motion.div
                  className="space-y-2"
                  variants={staggerContainer}
                  initial="hidden"
                  animate="show"
                >
                  {myPicks.map(pick => (
                    <PickCard
                      key={pick.id}
                      pick={pick}
                      isMine={true}
                      isInWatchlist={false}
                      onAddToWatchlist={handleAddToWatchlist}
                      onRemovePick={handleRemovePick}
                      addingId={addingId}
                    />
                  ))}
                </motion.div>
                <p className="text-xs text-muted-foreground mt-3">
                  To add a pick, go to your <button className="underline text-primary" onClick={() => router.push('/profile')}>Watchlist</button> → Completed tab.
                </p>
              </section>
            )}

            {/* Prompt to pick if user has no picks yet */}
            {myPicks.length === 0 && feed.length > 0 && (
              <div className="text-center py-6 rounded-2xl border border-dashed border-border">
                <Sparkles className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-3">Share your favourite completed shows with your groups.</p>
                <Button variant="outline" size="sm" className="rounded-full" onClick={() => router.push('/profile')}>
                  Add your first Pick
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
