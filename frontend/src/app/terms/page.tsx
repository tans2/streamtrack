"use client";

import { NavBar } from '@/components/ui/nav-bar';

export default function TermsPage() {
  return (
    <div className="min-h-screen text-foreground">
      <NavBar variant="landing" />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: April 2026</p>

        <div className="prose prose-sm max-w-none space-y-8 text-foreground">

          <section>
            <h2 className="text-lg font-semibold mb-2">1. Beta Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              Scout is currently in private beta. The service is provided <strong className="text-foreground">"as is"</strong> for testing and feedback purposes. Features may change, break, or be removed without notice during the beta period. By using Scout, you acknowledge this and agree not to rely on it for mission-critical purposes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">2. Eligibility</h2>
            <p className="text-muted-foreground leading-relaxed">
              You must be at least 13 years old to use Scout. By creating an account, you confirm you meet this requirement.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">3. Your Account</h2>
            <p className="text-muted-foreground leading-relaxed">
              You are responsible for maintaining the confidentiality of your password and for all activity under your account. Notify us immediately at <a href="mailto:stephanietan616@gmail.com" className="text-primary hover:underline">stephanietan616@gmail.com</a> if you suspect unauthorised access.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">4. Acceptable Use</h2>
            <p className="text-muted-foreground leading-relaxed">
              You agree not to:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
              <li>Use Scout for any unlawful purpose</li>
              <li>Attempt to access other users' data or accounts</li>
              <li>Scrape, reverse-engineer, or overload Scout's servers</li>
              <li>Use Scout to harass, impersonate, or harm other users</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">5. Content</h2>
            <p className="text-muted-foreground leading-relaxed">
              Show metadata (titles, posters, episode data) is sourced from <strong className="text-foreground">TMDB (The Movie Database)</strong> and is subject to their terms. Scout does not host any copyrighted media content.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">6. No Warranty</h2>
            <p className="text-muted-foreground leading-relaxed">
              Scout is provided without warranty of any kind, express or implied. We do not guarantee that the service will be uninterrupted, error-free, or that data will be preserved indefinitely, particularly during the beta period.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">7. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              To the maximum extent permitted by law, Scout and its team shall not be liable for any indirect, incidental, or consequential damages arising from your use of the service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">8. Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to suspend or terminate accounts that violate these terms. You may delete your account at any time from <strong className="text-foreground">Settings → Danger Zone</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">9. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update these terms as the product evolves. Continued use of Scout after changes constitutes acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">10. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              Questions? Reach us at <a href="mailto:stephanietan616@gmail.com" className="text-primary hover:underline">stephanietan616@gmail.com</a>.
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
