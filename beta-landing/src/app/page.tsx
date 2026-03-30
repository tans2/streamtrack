'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, Loader2, List, Search, Bell, Users } from 'lucide-react';

export default function BetaLandingPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [signupCount, setSignupCount] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/signup-count')
      .then(r => r.json())
      .then(d => { if (d.count > 0) setSignupCount(d.count); })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      title: 'My Watchlist',
      description: 'Save shows you love, track where you left off, and pick back up anytime across every platform.',
    },
    {
      icon: <Search className="w-6 h-6" />,
      title: 'Universal Search',
      description: 'Find any show and see exactly where to watch it, which seasons are available, and on what platform.',
    },
    {
      icon: <Bell className="w-6 h-6" />,
      title: 'Drop Alerts',
      description: 'Get notified when new episodes and seasons drop so you\'re never the last to know.',
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Watch Groups',
      description: 'Track shows with friends and know exactly where everyone\'s at, even from miles apart.',
    },
  ];

  const platforms = ['Netflix', 'Disney+', 'Prime Video', 'Max', 'Apple TV+', 'Hulu', 'Peacock', 'Paramount+'];

  return (
    <div className="min-h-screen" style={{ background: 'hsl(30 20% 97%)' }}>

      {/* Subtle background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl float-animation" />
        <div className="absolute top-60 right-16 w-96 h-96 bg-accent/5 rounded-full blur-3xl float-animation-delayed" />
        <div className="absolute bottom-32 left-1/3 w-80 h-80 bg-secondary/5 rounded-full blur-3xl float-animation-slow" />
      </div>

      <div className="relative z-10">
        {/* Nav */}
        <header className="px-6 pt-6">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img src="/logo.png" alt="Scout" className="w-9 h-9" />
              <span className="text-xl font-bold text-foreground">Scout</span>
            </div>
            <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full tracking-wide uppercase">
              Private Beta
            </span>
          </div>
        </header>

        {/* Hero */}
        <main className="px-6 pt-16 pb-24">
          <div className="max-w-5xl mx-auto">

            {/* Centered hero text */}
            <div className="text-center max-w-2xl mx-auto mb-14">
              <img src="/logo.png" alt="Scout fox" className="w-32 h-32 mx-auto mb-6" />
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-5 leading-tight">
                Meet Scout,{' '}
                <span className="text-primary">your TV sidekick</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed mb-3">
                Track every show across every platform, get notified when new episodes drop,
                and watch together with friends — all in one place.
              </p>
              <p className="text-sm text-muted-foreground">
                Spots are limited. Sign up for early access and we'll reach out when you're in.
              </p>
            </div>

            {/* Two-column: features left, signup right */}
            <div className="grid md:grid-cols-2 gap-10 items-start max-w-4xl mx-auto mb-20">

              {/* Features */}
              <div className="space-y-5">
                {features.map((feature, i) => (
                  <div key={i} className="flex gap-4 p-4 bg-white rounded-2xl border border-border shadow-sm">
                    <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center text-primary flex-shrink-0">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-0.5">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Signup card */}
              <div className="sticky top-8">
                <div className="bg-white rounded-2xl shadow-xl border border-border p-8">
                  {isSubmitted ? (
                    <div className="text-center py-6">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-primary" />
                      </div>
                      <h3 className="text-xl font-bold text-foreground mb-2">You're on the list!</h3>
                      <p className="text-muted-foreground text-sm">
                        We'll email you as soon as your early access is ready.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="mb-6">
                        <h2 className="text-xl font-bold text-foreground mb-1">Get Early Access</h2>
                        <p className="text-sm text-muted-foreground">
                          {signupCount !== null
                            ? `Join ${signupCount} others on the waitlist`
                            : 'No spam, ever.'}
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
                            className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:border-primary transition-colors text-sm"
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
                            className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:border-primary transition-colors text-sm"
                          />
                        </div>

                        {error && (
                          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                            {error}
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full py-3 px-4 bg-primary text-white font-semibold rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-sm"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Signing up...
                            </>
                          ) : (
                            'Join the Beta'
                          )}
                        </button>
                      </form>
                    </>
                  )}
                </div>

              </div>
            </div>

            {/* Platforms strip */}
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
                Works with all your platforms
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {platforms.map((p) => (
                  <span
                    key={p}
                    className="px-3 py-1.5 bg-white border border-border rounded-full text-xs text-muted-foreground font-medium shadow-sm"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="px-6 py-8 border-t border-border">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Scout" className="w-6 h-6" />
              <span className="text-sm font-semibold text-foreground">Scout</span>
              <span className="text-sm text-muted-foreground">· Track Your Shows</span>
            </div>
            <p className="text-xs text-muted-foreground">
              © 2025 Scout
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
