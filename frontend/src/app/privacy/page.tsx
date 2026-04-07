"use client";

import { NavBar } from '@/components/ui/nav-bar';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen text-foreground">
      <NavBar variant="landing" />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: April 2026</p>

        <div className="prose prose-sm max-w-none space-y-8 text-foreground">

          <section>
            <h2 className="text-lg font-semibold mb-2">1. What We Collect</h2>
            <p className="text-muted-foreground leading-relaxed">
              Scout collects the minimum information needed to run the service:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
              <li>Your email address and display name when you create an account</li>
              <li>Your watchlist: the TV shows you add, your watch progress (season &amp; episode), and watch status</li>
              <li>Your streaming platform preferences and region setting</li>
              <li>Watch group membership and group names</li>
              <li>Notification preferences you configure</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">2. How We Store Your Data</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your data is stored in <strong className="text-foreground">Supabase</strong> (PostgreSQL), a secure cloud database provider. Passwords are hashed using bcrypt and are never stored in plain text. Authentication tokens are short-lived JWTs stored in your browser's local storage.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">3. How We Use Your Data</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use your data exclusively to provide the Scout service:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
              <li>Displaying your watchlist and progress across devices</li>
              <li>Sending new episode and season notifications via email (only if you opt in)</li>
              <li>Powering Watch Groups so you can track shows with friends</li>
              <li>Show recommendations based on what you're watching (future feature)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">4. Email Communication</h2>
            <p className="text-muted-foreground leading-relaxed">
              Transactional emails (verification, password reset, episode digests) are sent via <strong className="text-foreground">Resend</strong>. We do not send unsolicited marketing emails. You can disable all email notifications at any time in Settings → Preferences.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">5. Third-Party Services</h2>
            <p className="text-muted-foreground leading-relaxed">
              Scout uses the following third-party services to operate:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
              <li><strong className="text-foreground">TMDB (The Movie Database)</strong> — show metadata, episode data, and posters. No personal data is shared with TMDB.</li>
              <li><strong className="text-foreground">Supabase</strong> — database and authentication infrastructure</li>
              <li><strong className="text-foreground">Resend</strong> — transactional email delivery</li>
              <li><strong className="text-foreground">Vercel</strong> — hosting and deployment</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">6. We Do Not Sell Your Data</h2>
            <p className="text-muted-foreground leading-relaxed">
              Scout does not sell, rent, or share your personal data with advertisers or third parties for commercial purposes. Full stop.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">7. Data Retention & Deletion</h2>
            <p className="text-muted-foreground leading-relaxed">
              You can permanently delete your account and all associated data at any time from <strong className="text-foreground">Settings → Danger Zone</strong>. Deletion removes your email, watchlist, group memberships, and all notification history from our systems immediately.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">8. Beta Period</h2>
            <p className="text-muted-foreground leading-relaxed">
              Scout is currently in private beta. During this period, we may review aggregate usage patterns (e.g. most-added shows, feature engagement) to improve the product. This analysis never includes personally identifiable information.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">9. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              Questions about your data? Email us at <a href="mailto:stephanietan616@gmail.com" className="text-primary hover:underline">stephanietan616@gmail.com</a>.
            </p>
          </section>

        </div>
      </div>

      <footer className="border-t border-border py-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <img src="/logo.png" alt="Scout" className="w-5 h-5" />
          <span className="text-sm font-semibold">Scout</span>
        </div>
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <a href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</a>
          <a href="/terms" className="hover:text-foreground transition-colors">Terms of Service</a>
        </div>
      </footer>
    </div>
  );
}
