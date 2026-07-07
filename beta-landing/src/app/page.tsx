import { List, Search, Bell, Users, Ticket, ArrowRight } from 'lucide-react';

const APP_URL = 'https://tvscout.vercel.app';

export default function BetaLandingPage() {
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
                Scout is currently invite-only.
              </p>
            </div>

            {/* Two-column: features left, invite card right */}
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

              {/* Invite-only card */}
              <div className="sticky top-8">
                <div className="bg-white rounded-2xl shadow-xl border border-border p-8 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Ticket className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground mb-2">Scout is invite-only</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                    Every Scout member has a referral code to share.
                    Got one from a friend? You're in — create your account below.
                  </p>
                  <a
                    href={`${APP_URL}/auth`}
                    className="w-full py-3 px-4 bg-primary text-white font-semibold rounded-full hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    Create your account
                    <ArrowRight className="w-4 h-4" />
                  </a>
                  <p className="text-xs text-muted-foreground mt-4">
                    No code yet? Ask a friend who's already on Scout —
                    or join a Watch Group they invite you to.
                  </p>
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
              © 2026 Scout
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
