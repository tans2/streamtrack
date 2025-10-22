"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Bell, Users, Star, LogOut } from "lucide-react";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function HomePage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  
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
            onClick={() => router.push('/search')}
          >
            Explore Shows
          </Button>
          <Button
            variant="ghost"
            className="text-foreground hover:text-primary hover:bg-primary/10"
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
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </>
            ) : (
              'Sign In'
            )}
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-foreground mb-6">
            🎬 WallyWatch
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Track your favorite shows across all streaming platforms. Never miss a new episode or season again.
          </p>
          
          <div className="space-y-6">
            <p className="text-lg text-muted-foreground">
              {user ? `Welcome back, ${user.name || user.email}!` : 'Sign up to start tracking your favorite shows'}
            </p>
            <div className="flex gap-4 justify-center">
              {!user ? (
                <>
                  <Button 
                    size="lg" 
                    className="bg-primary hover:bg-primary/90"
                    onClick={() => router.push('/signup')}
                  >
                    <Star className="w-5 h-5 mr-2" />
                    Get Started
                  </Button>
                  <Button 
                    size="lg" 
                    variant="secondary" 
                    className="bg-secondary hover:bg-secondary/80"
                    onClick={() => router.push('/search')}
                  >
                    <Users className="w-5 h-5 mr-2" />
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
                    <Star className="w-5 h-5 mr-2" />
                    View My Watchlist
                  </Button>
                  <Button 
                    size="lg" 
                    variant="secondary" 
                    className="bg-secondary hover:bg-secondary/80"
                    onClick={() => router.push('/search')}
                  >
                    <Users className="w-5 h-5 mr-2" />
                    Explore Shows
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Star className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-card-foreground mb-2">Universal Search</h3>
            <p className="text-muted-foreground">
              Find shows across Netflix, Hulu, Disney+, Prime Video, and more with our comprehensive search engine.
            </p>
          </div>
          
          <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Bell className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-card-foreground mb-2">Smart Watchlist</h3>
            <p className="text-muted-foreground">
              Track your progress, get notifications for new episodes, and never lose track of what you're watching.
            </p>
          </div>
          
          <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-card-foreground mb-2">Episode Alerts</h3>
            <p className="text-muted-foreground">
              Get notified when new episodes of your favorite shows are released on any platform.
            </p>
          </div>
        </div>

        {/* Streaming Platforms */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground mb-8">Supported Platforms</h2>
          <div className="flex flex-wrap justify-center gap-6">
            {streamingPlatforms.map((platform) => (
              <div key={platform} className="flex items-center space-x-2 bg-card px-4 py-2 rounded-lg shadow-sm border border-border">
                <span className="text-xl">📺</span>
                <span className="text-card-foreground font-medium">{platform}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}