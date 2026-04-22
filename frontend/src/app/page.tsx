"use client";

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { List, Search, Bell, Users, ArrowRight } from "lucide-react";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { NavBar } from '@/components/ui/nav-bar';
import { staggerContainer, fadeInUp, fadeIn } from '@/lib/animations';

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) router.replace('/search');
  }, [user, loading]);

  if (loading || user) return null;

  const features = [
    {
      icon: List,
      title: "My Watchlist",
      description: "Save shows you love, track where you left off, and pick back up anytime across every platform.",
    },
    {
      icon: Search,
      title: "Universal Search",
      description: "Find any show and see exactly where to watch it, which seasons are available, and on what platform.",
    },
    {
      icon: Bell,
      title: "Drop Alerts",
      description: "Get notified when new episodes and seasons drop so you're never the last to know.",
    },
    {
      icon: Users,
      title: "Watch Groups",
      description: "Track shows with friends and know exactly where everyone's at, even from miles apart.",
    },
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
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6"
              onClick={() => router.push('/auth')}
            >
              Sign In
            </Button>
          </>
        }
      />

      {/* Hero + Features Section — 2-column on desktop, stacked on mobile */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-start mb-16 sm:mb-24">
          {/* Left column — Logo, headline, subtitle, CTA */}
          <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="show"
            className="flex flex-col items-center sm:items-start text-center sm:text-left"
          >
            <img
              src="/logo.png"
              alt="Scout mascot"
              className="w-36 h-36 sm:w-44 sm:h-44 mb-5 mx-auto sm:mx-0"
            />
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">
              <span className="text-foreground">Meet </span>
              <span className="text-primary">Scout</span>
              <br />
              <span className="text-foreground">your TV sidekick</span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground mt-4 sm:mt-6 max-w-md">
              Track your favorite shows across streaming platforms with friends.
            </p>
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8"
                onClick={() => router.push('/signup')}
              >
                Get Started
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-8"
                onClick={() => router.push('/search')}
              >
                Explore Shows
              </Button>
            </div>
          </motion.div>

          {/* Right column — Feature heading + stacked feature cards */}
          <motion.div
            className="space-y-4"
            variants={staggerContainer}
            initial="hidden"
            animate="show"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-xl sm:text-2xl font-bold text-foreground mb-2"
            >
              Never miss a new episode again
            </motion.h2>

            {features.map((feature) => (
              <motion.div key={feature.title} variants={fadeInUp}>
                <div className="flex items-start gap-4 p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-card-foreground">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Footer */}
        <footer className="pt-8 border-t border-border text-center pb-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <img src="/logo.png" alt="Scout" className="w-6 h-6" />
            <span className="text-sm font-semibold text-foreground">Scout</span>
          </div>
          <p className="text-xs text-muted-foreground mb-2">
            &copy; 2026 Scout TV Tracking. All rights reserved.
          </p>
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <a href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="/terms" className="hover:text-foreground transition-colors">Terms of Service</a>
          </div>
        </footer>
      </div>
    </div>
  );
}
