import { useState, useEffect } from 'react';
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Skeleton } from "./ui/skeleton";
import { ArrowLeft, Settings, Search, Star, Play, Calendar, Loader2 } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { watchlistService, WatchlistItem } from '@/services/watchlistService';
import { toast } from 'sonner';

interface ProfilePageProps {
  onNavigate: (page: string) => void;
}

export default function ProfilePage({ onNavigate }: ProfilePageProps) {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    loadWatchlist();
  }, []);

  const loadWatchlist = async () => {
    setLoading(true);
    try {
      const data = await watchlistService.getWatchlist();
      setWatchlist(data);
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
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">
                              Season {item.current_season}, Episode {item.current_episode}
                            </span>
                            <StatusBadge status={item.watch_status} />
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <Star className="w-4 h-4 text-yellow-600 mr-1" />
                              <span className="text-muted-foreground">{item.shows.rating?.toFixed(1) || 'N/A'}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusUpdate(item.show_id, 'completed')}
                              disabled={updatingStatus === item.show_id}
                            >
                              {updatingStatus === item.show_id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                'Mark Complete'
                              )}
                            </Button>
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
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs px-2 py-1 h-auto"
                          onClick={() => handleStatusUpdate(item.show_id, 'watching')}
                          disabled={updatingStatus === item.show_id}
                        >
                          {updatingStatus === item.show_id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            'Watch'
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs px-2 py-1 h-auto"
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