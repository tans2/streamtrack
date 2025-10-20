import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Play, Bell, Users, Star } from "lucide-react";

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

export default function LandingPage({
  onNavigate,
}: LandingPageProps) {
  const streamingPlatforms = [
    "Netflix",
    "Hulu",
    "Disney+",
    "Prime Video",
    "Paramount+",
    "Peacock",
    "HBO Max",
    "Apple TV+",
    "YouTube TV",
    "Fubo TV",
  ];

  return (
    <div className="min-h-screen text-foreground">
      {/* Navigation */}
      <nav className="flex items-center justify-between p-6">
        <div className="flex items-center space-x-2">
          <Play className="w-8 h-8 text-primary" />
          <span className="text-2xl font-bold text-primary">
            WallyWatch
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            className="text-foreground hover:text-primary hover:bg-primary/10"
            onClick={() => onNavigate("search")}
          >
            Search
          </Button>
          <Button
            variant="ghost"
            className="text-foreground hover:text-primary hover:bg-primary/10"
            onClick={() => onNavigate("profile")}
          >
            My Watchlist
          </Button>
          <Button
            variant="outline"
            className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            onClick={() => onNavigate("signup")}
          >
            Sign Up
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-6 py-20 text-center">
        <h1 className="text-6xl mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
          WallyWatch
        </h1>
        <p className="text-2xl mb-8 text-muted-foreground">
          Your streaming sidekick keeping you up to date
        </p>

        {/* Color Showcase Banner */}
        <div className="bg-secondary/20 border border-secondary/40 rounded-xl p-4 mb-8 max-w-md mx-auto">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-3 h-3 bg-primary rounded-full" />
            <div className="w-3 h-3 bg-secondary rounded-full" />
            <div className="w-3 h-3 bg-accent rounded-full" />
          </div>
          <p className="text-sm text-foreground/80">
            Updated with{" "}
            <span className="text-secondary font-medium">
              Soft Caramel
            </span>{" "}
            &{" "}
            <span className="text-accent font-medium">
              Forest Green
            </span>{" "}
            palette
          </p>
        </div>

        <div className="flex justify-center space-x-4 mb-16">
          <Button
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3"
            onClick={() => onNavigate("signup")}
          >
            Get Started
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-primary text-primary hover:bg-primary hover:text-primary-foreground px-8 py-3"
            onClick={() => onNavigate("search")}
          >
            Explore Shows
          </Button>
        </div>

        {/* Streaming Platforms */}
        <div className="mb-16">
          <p className="text-lg mb-8 text-muted-foreground">
            Track shows across all your favorite platforms
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {streamingPlatforms.map((platform) => (
              <Badge
                key={platform}
                variant="outline"
                className="border-secondary/60 text-foreground hover:border-secondary hover:bg-secondary/20 px-4 py-2"
              >
                {platform}
              </Badge>
            ))}
          </div>
        </div>

        {/* Coming Soon Features */}
        <div className="text-left max-w-4xl mx-auto">
          <h2 className="text-3xl mb-8 text-center text-primary">
            Coming Soon
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-card p-6 rounded-lg border border-border shadow-lg">
              <div className="flex items-center mb-4">
                <Bell className="w-6 h-6 text-accent mr-3" />
                <h3 className="text-xl text-card-foreground">
                  Smart Notifications
                </h3>
              </div>
              <p className="text-muted-foreground">
                Never miss a season premiere or new episode
                release. Get personalized notifications for all
                your tracked shows across every platform.
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg border border-border shadow-lg">
              <div className="flex items-center mb-4">
                <Users className="w-6 h-6 text-accent mr-3" />
                <h3 className="text-xl text-card-foreground">
                  Group Tracking
                </h3>
              </div>
              <p className="text-muted-foreground">
                Share watchlists with friends and family. See
                what everyone's watching, get recommendations,
                and never spoil anything again.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center text-muted-foreground">
        <div className="container mx-auto px-6">
          <p>
            &copy; 2025 WallyWatch. Your streaming sidekick.
          </p>
        </div>
      </footer>
    </div>
  );
}