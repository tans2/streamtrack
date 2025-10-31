import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { ArrowLeft, Settings, Search, Star, Play, Calendar } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface ProfilePageProps {
  onNavigate: (page: string) => void;
}

// Mock user watchlist data
const userWatchlist = [
  {
    id: 1,
    title: "Stranger Things",
    poster: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=300&h=450&fit=crop",
    seasons: 4,
    currentSeason: 4,
    currentEpisode: 9,
    totalEpisodes: 34,
    rating: 8.7,
    platform: "Netflix",
    nextEpisode: null,
    status: "completed"
  },
  {
    id: 2,
    title: "The Mandalorian",
    poster: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=450&fit=crop",
    seasons: 3,
    currentSeason: 2,
    currentEpisode: 4,
    totalEpisodes: 24,
    rating: 8.8,
    platform: "Disney+",
    nextEpisode: "2025-01-15",
    status: "watching"
  },
  {
    id: 3,
    title: "House of the Dragon",
    poster: "https://images.unsplash.com/photo-1533613220915-609f661a6fe1?w=300&h=450&fit=crop",
    seasons: 2,
    currentSeason: 1,
    currentEpisode: 3,
    totalEpisodes: 18,
    rating: 8.2,
    platform: "HBO Max",
    nextEpisode: "2025-02-20",
    status: "watching"
  },
  {
    id: 4,
    title: "Ted Lasso",
    poster: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=450&fit=crop",
    seasons: 3,
    currentSeason: 3,
    currentEpisode: 12,
    totalEpisodes: 34,
    rating: 8.9,
    platform: "Apple TV+",
    nextEpisode: null,
    status: "completed"
  },
  {
    id: 5,
    title: "The Boys",
    poster: "https://images.unsplash.com/photo-1489599613113-21046ce2c11b?w=300&h=450&fit=crop",
    seasons: 4,
    currentSeason: 1,
    currentEpisode: 1,
    totalEpisodes: 32,
    rating: 8.4,
    platform: "Prime Video",
    nextEpisode: null,
    status: "plan to watch"
  },
  {
    id: 6,
    title: "Yellowstone",
    poster: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=300&h=450&fit=crop",
    seasons: 5,
    currentSeason: 2,
    currentEpisode: 8,
    totalEpisodes: 47,
    rating: 8.6,
    platform: "Paramount+",
    nextEpisode: "2025-01-28",
    status: "watching"
  }
];

export default function ProfilePage({ onNavigate }: ProfilePageProps) {
  const userName = "Alex Smith";
  const watchingShows = userWatchlist.filter(show => show.status === "watching");
  const completedShows = userWatchlist.filter(show => show.status === "completed");
  const planToWatchShows = userWatchlist.filter(show => show.status === "plan to watch");

  const calculateProgress = (current: number, total: number) => {
    return Math.round((current / total) * 100);
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const colors = {
      watching: "bg-green-600",
      completed: "bg-blue-600", 
      "plan to watch": "bg-yellow-600"
    };
    
    return (
      <Badge className={`${colors[status as keyof typeof colors]} text-white border-0`}>
        {status === "plan to watch" ? "Plan to Watch" : status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
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
                onClick={() => onNavigate('landing')}
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
                onClick={() => onNavigate('search')}
              >
                <Search className="w-4 h-4 mr-2" />
                Search Shows
              </Button>
              <Button 
                variant="ghost" 
                className="text-primary hover:text-primary hover:bg-primary/10"
                onClick={() => onNavigate('settings')}
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
          <h2 className="text-3xl mb-4 text-foreground">Welcome back, {userName}! 👋</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-card border-border shadow-lg">
              <CardContent className="p-4 text-center">
                <div className="text-2xl mb-1 text-primary">{userWatchlist.length}</div>
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
              {watchingShows.map(show => (
                <Card key={show.id} className="bg-card border-border hover:border-primary transition-colors shadow-lg">
                  <CardContent className="p-4">
                    <div className="flex space-x-4">
                      <div className="w-20 h-28 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        <ImageWithFallback 
                          src={show.poster}
                          alt={show.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-card-foreground mb-2 truncate">{show.title}</h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Season {show.currentSeason}, Episode {show.currentEpisode}</span>
                            <StatusBadge status={show.status} />
                          </div>
                          <Progress 
                            value={calculateProgress(show.currentEpisode + (show.currentSeason - 1) * 8, show.totalEpisodes)} 
                            className="w-full"
                          />
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <Star className="w-4 h-4 text-yellow-600 mr-1" />
                              <span className="text-muted-foreground">{show.rating}</span>
                            </div>
                            <Badge variant="outline" className="border-primary/50 text-foreground">
                              {show.platform}
                            </Badge>
                          </div>
                          {show.nextEpisode && (
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Calendar className="w-4 h-4 mr-1" />
                              Next: {new Date(show.nextEpisode).toLocaleDateString()}
                            </div>
                          )}
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {userWatchlist.map(show => (
              <Card key={show.id} className="bg-card border-border hover:border-primary transition-colors group cursor-pointer shadow-lg">
                <CardContent className="p-3">
                  <div className="aspect-[2/3] mb-3 rounded-lg overflow-hidden bg-muted relative">
                    <ImageWithFallback 
                      src={show.poster}
                      alt={show.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <h4 className="text-card-foreground text-sm mb-2 truncate" title={show.title}>{show.title}</h4>
                  <div className="space-y-2">
                    <StatusBadge status={show.status} />
                    <div className="text-xs text-muted-foreground">
                      {show.seasons} season{show.seasons !== 1 ? 's' : ''} • {show.platform}
                    </div>
                    {show.status !== "plan to watch" && (
                      <Progress 
                        value={calculateProgress(show.currentEpisode + (show.currentSeason - 1) * 8, show.totalEpisodes)} 
                        className="w-full h-1"
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}