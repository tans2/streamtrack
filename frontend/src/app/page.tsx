"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Users, LogOut, ScanSearch, ListChecks, Star } from "lucide-react";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function HomePage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  
  const streamingPlatforms = [
    { name: "Netflix", icon: "/platforms/netflix.png" },
    { name: "Hulu", icon: "/platforms/hulu.svg" },
    { name: "Disney+", icon: "/platforms/disneyplus.svg" },
    { name: "Prime Video", icon: "/platforms/primevideo.svg" },
    { name: "Paramount+", icon: "/platforms/paramountplus.svg" },
    { name: "Peacock", icon: "/platforms/peacock.svg" },
    { name: "HBO Max", icon: "/platforms/hbomax.svg" },
    { name: "Apple TV+", icon: "/platforms/appletv.svg" },
    { name: "YouTube TV", icon: "/platforms/youtubetv.svg" },
    { name: "Fubo TV", icon: "/platforms/fubo.svg" },
  ];

  return (
    <div className="min-h-screen text-foreground">
      {/* Navigation */}
      <nav className="flex items-center justify-between p-3 sm:p-6">
        <div className="flex items-center space-x-2">
          <img src="/logo.png" alt="Scout" className="w-8 h-8" />
          <span className="text-xl sm:text-2xl font-bold text-primary">
            Scout
          </span>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-4">
          <Button
            variant="ghost"
            className="hidden sm:inline-flex text-foreground hover:text-primary hover:bg-primary/10"
            onClick={() => router.push('/search')}
          >
            Explore Shows
          </Button>
          <Button
            variant="ghost"
            className="hidden sm:inline-flex text-foreground hover:text-primary hover:bg-primary/10"
            onClick={() => router.push('/profile')}
          >
            My Watchlist
          </Button>
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => user ? logout() : router.push('/auth')}
          >
            {user ? (
              <>
                <LogOut className="w-4 h-4" />
                Sign Out
              </>
            ) : (
              'Sign In'
            )}
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-16">
        <div className="text-center mb-8 sm:mb-16">
          <img src="/logo.png" alt="" className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4" />
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground mb-4 sm:mb-6">
            Scout
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto">
            Track your favorite shows across all streaming platforms. Never miss a new episode or season again.
          </p>

          <div className="space-y-4 sm:space-y-6">
            <p className="text-base sm:text-lg text-muted-foreground">
              {user ? `Welcome back, ${user.name || user.email}!` : 'Sign up to start tracking your favorite shows'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              {!user ? (
                <>
                  <Button 
                    size="lg" 
                    className="bg-primary hover:bg-primary/90"
                    onClick={() => router.push('/signup')}
                  >
                    <Star className="w-5 h-5" />
                    Get Started
                  </Button>
                  <Button 
                    size="lg" 
                    variant="secondary" 
                    className="bg-secondary hover:bg-secondary/80"
                    onClick={() => router.push('/search')}
                  >
                    <Users className="w-5 h-5" />
                    Explore Shows
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    size="lg" 
                    className="bg-primary hover:bg-primary/90"
                    onClick={() => router.push('/profile')}
                  >
                    <Star className="w-5 h-5" />
                    View My Watchlist
                  </Button>
                  <Button 
                    size="lg" 
                    variant="secondary" 
                    className="bg-secondary hover:bg-secondary/80"
                    onClick={() => router.push('/search')}
                  >
                    <Users className="w-5 h-5" />
                    Explore Shows
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-4 md:gap-8 mb-8 sm:mb-16">
          <div className="bg-card rounded-xl p-4 sm:p-6 shadow-lg border border-border">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <ScanSearch className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-card-foreground mb-2">Universal Search</h3>
            <p className="text-muted-foreground">
              Search any show and instantly see where it's streaming. Filter results by the platforms you have.
            </p>
          </div>
          
          <div className="bg-card rounded-xl p-4 sm:p-6 shadow-lg border border-border">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <ListChecks className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-card-foreground mb-2">Single Watchlist</h3>
            <p className="text-muted-foreground">
              Keep a single watchlist across all services and never lose track of what you're watching.
            </p>
          </div>
          
          <div className="bg-card rounded-xl p-4 sm:p-6 shadow-lg border border-border">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Bell className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-card-foreground mb-2">Smart Alerts</h3>
            <p className="text-muted-foreground">
              Get alerts for new episodes, seasons, or when a show becomes available on your platforms.
            </p>
          </div>
        </div>

        {/* Streaming Platforms */}
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-6 sm:mb-8">Supported Platforms</h2>
          <div className="flex flex-wrap justify-center gap-3 sm:gap-6">
            {streamingPlatforms.map((platform) => (
              <div
                key={platform.name}
                className="flex items-center justify-center bg-card px-4 py-2 rounded-lg shadow-sm border border-border"
                title={platform.name}
              >
                <img
                  src={platform.icon}
                  alt={`${platform.name} logo`}
                  className="h-5 max-w-[80px] sm:h-6 w-auto sm:max-w-[112px] object-contain"
                />
                <span className="sr-only">{platform.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}