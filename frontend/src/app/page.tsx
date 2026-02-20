"use client";

import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Bell, LogOut, ScanSearch, ListChecks, Star } from "lucide-react";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { NavBar } from '@/components/ui/nav-bar';
import { staggerContainer, fadeInUp, fadeIn } from '@/lib/animations';

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
      <NavBar
        variant="landing"
        actions={
          <>
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
          </>
        }
      />

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center mb-16 sm:mb-24">
          {/* Left column - Headline */}
          <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="show"
          >
            <img
              src="/logo.png"
              alt=""
              className="w-24 h-24 sm:w-28 sm:h-28 mb-4 sm:mb-5"
            />
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">
              <span className="text-foreground">Meet </span>
              <span className="text-primary">Scout</span>
              <br />
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                your TV sidekick
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mt-4 sm:mt-6 max-w-lg">
              Track your favorite shows across every streaming platform. Never miss a new episode again.
            </p>
            {!user && (
              <div className="flex flex-col sm:flex-row gap-3 mt-6 sm:mt-8">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={() => router.push('/signup')}
                >
                  <Star className="w-5 h-5" />
                  Get Started Free
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => router.push('/search')}
                >
                  Explore Shows
                </Button>
              </div>
            )}
          </motion.div>

          {/* Right column - Feature cards stacked */}
          <motion.div
            className="space-y-4"
            variants={staggerContainer}
            initial="hidden"
            animate="show"
          >
            <motion.div variants={fadeInUp}>
              <div className="flex items-start gap-4 p-4 sm:p-5 rounded-xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <ScanSearch className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground">Universal Search</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Search any show and instantly see where it's streaming.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <div className="flex items-start gap-4 p-4 sm:p-5 rounded-xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <ListChecks className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground">Single Watchlist</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    One list across all platforms. Track progress, status, and more.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <div className="flex items-start gap-4 p-4 sm:p-5 rounded-xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-secondary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-secondary" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground">Smart Alerts</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Daily digest emails when new episodes drop for your shows.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Streaming Platforms */}
        <motion.div
          className="text-center"
          variants={fadeIn}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-6 sm:mb-8">Supported Platforms</h2>
          <div className="flex flex-wrap justify-center gap-3 sm:gap-6">
            {streamingPlatforms.map((platform) => (
              <motion.div
                key={platform.name}
                className="flex items-center justify-center px-4 py-2"
                title={platform.name}
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <img
                  src={platform.icon}
                  alt={`${platform.name} logo`}
                  className="h-5 max-w-[80px] sm:h-6 w-auto sm:max-w-[112px] object-contain"
                />
                <span className="sr-only">{platform.name}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Footer */}
        <footer className="mt-16 sm:mt-24 pt-8 border-t border-border text-center pb-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <img src="/logo.png" alt="Scout" className="w-6 h-6" />
            <span className="text-sm font-semibold text-foreground">Scout</span>
          </div>
          <p className="text-xs text-muted-foreground">Track Your Shows</p>
        </footer>
      </div>
    </div>
  );
}
