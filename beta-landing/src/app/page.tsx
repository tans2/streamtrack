'use client';

import { useState } from 'react';
import { Tv, CheckCircle, Sparkles, Play, List, Bell, Loader2 } from 'lucide-react';

export default function BetaLandingPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      setIsSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign up. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const features = [
    {
      icon: <List className="w-6 h-6" />,
      title: 'Unified Watchlist',
      description: 'One place for all your shows across Netflix, Hulu, Disney+, and more.',
    },
    {
      icon: <Tv className="w-6 h-6" />,
      title: 'Track Your Progress',
      description: 'Never forget where you left off. Track seasons and episodes effortlessly.',
    },
    {
      icon: <Bell className="w-6 h-6" />,
      title: 'Stay Updated',
      description: 'Know exactly which platforms have your favorite shows available.',
    },
  ];

  const streamingLogos = ['Netflix', 'Hulu', 'Disney+', 'HBO Max', 'Prime Video', 'Apple TV+'];

  return (
    <div className="min-h-screen animated-gradient overflow-hidden">
      {/* Decorative floating elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl float-animation" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-accent/5 rounded-full blur-3xl float-animation-delayed" />
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-secondary/5 rounded-full blur-3xl float-animation-slow" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="pt-8 px-6">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Tv className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold text-foreground">Scout</span>
            </div>
            <div className="px-4 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-full">
              Private Beta
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <main className="px-6 pt-16 pb-24">
          <div className="max-w-6xl mx-auto">
            {/* Hero Content */}
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-card rounded-full shadow-sm mb-6">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">Coming Soon</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
                Always Know{' '}
                <span className="text-primary">Where</span> &{' '}
                <span className="text-primary">When</span> to Watch
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
                Your unified watchlist across all streaming platforms. 
                Track your shows, find where they&apos;re streaming, and never lose your place again.
              </p>

              {/* Streaming platforms ticker */}
              <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
                {streamingLogos.map((platform) => (
                  <span
                    key={platform}
                    className="px-4 py-2 bg-card/80 backdrop-blur-sm rounded-lg text-sm text-muted-foreground font-medium shadow-sm"
                  >
                    {platform}
                  </span>
                ))}
              </div>
            </div>

            {/* Signup Card */}
            <div className="max-w-md mx-auto mb-24">
              <div className="bg-card rounded-2xl shadow-xl p-8 border border-border/50">
                {isSubmitted ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-accent" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      You&apos;re on the list!
                    </h3>
                    <p className="text-muted-foreground">
                      We&apos;ll notify you when Scout is ready for you.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="text-center mb-6">
                      <h2 className="text-xl font-semibold text-foreground mb-2">
                        Get Early Access
                      </h2>
                      <p className="text-muted-foreground text-sm">
                        Be among the first to try Scout
                      </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1.5">
                          Name
                        </label>
                        <input
                          type="text"
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          placeholder="Your name"
                          className="w-full px-4 py-3 bg-muted/50 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                      </div>

                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
                          Email
                        </label>
                        <input
                          type="email"
                          id="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          placeholder="you@example.com"
                          className="w-full px-4 py-3 bg-muted/50 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                      </div>

                      {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                          {error}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 px-4 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Signing up...
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4" />
                            Join the Beta
                          </>
                        )}
                      </button>
                    </form>

                    <p className="text-center text-xs text-muted-foreground mt-4">
                      No spam, ever. We&apos;ll only email you about Scout.
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Features Section */}
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-foreground text-center mb-12">
                Why Scout?
              </h2>
              <div className="grid md:grid-cols-3 gap-8">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="bg-card/60 backdrop-blur-sm rounded-xl p-6 border border-border/30 hover:shadow-lg transition-all hover:-translate-y-1"
                  >
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4">
                      {feature.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="px-6 py-8 border-t border-border/30">
          <div className="max-w-6xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Tv className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold text-foreground">Scout</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Scout. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}





