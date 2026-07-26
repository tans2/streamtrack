'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import posthog from 'posthog-js';
import { useAuth } from '@/contexts/AuthContext';

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

/**
 * Product analytics. Entirely inert when NEXT_PUBLIC_POSTHOG_KEY is unset, so
 * local dev and any environment without the key behaves exactly as before.
 *
 * Deliberately does NOT use useSearchParams — in the App Router that forces a
 * Suspense boundary and will fail the production build without one. Pathname
 * changes are enough for pageviews, and the full URL (query included) is read
 * off window.location at capture time.
 */
export function AnalyticsProvider() {
  const pathname = usePathname();
  const { user } = useAuth();
  const ready = useRef(false);
  const identified = useRef<string | null>(null);

  useEffect(() => {
    if (!POSTHOG_KEY || ready.current) return;

    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      // Captured manually below; the automatic one misses App Router navigations.
      capture_pageview: false,
      capture_pageleave: true,
      persistence: 'localStorage+cookie',
    });
    ready.current = true;
  }, []);

  useEffect(() => {
    if (!POSTHOG_KEY || !ready.current) return;
    posthog.capture('$pageview', { $current_url: window.location.href });
  }, [pathname]);

  useEffect(() => {
    if (!POSTHOG_KEY || !ready.current) return;

    if (user?.id) {
      if (identified.current !== user.id) {
        posthog.identify(user.id, { email: user.email, name: user.name });
        identified.current = user.id;
      }
    } else if (identified.current) {
      // Signed out — stop attributing this browser to the previous account.
      posthog.reset();
      identified.current = null;
    }
  }, [user?.id, user?.email, user?.name]);

  return null;
}

/**
 * Fire a product event. Safe to call anywhere, including when analytics is
 * disabled — it no-ops rather than throwing.
 *
 * Activation funnel events worth adding as the app grows:
 *   'show_added'  · 'group_created' · 'group_joined' · 'pick_added'
 */
export function trackEvent(event: string, properties?: Record<string, unknown>) {
  if (!POSTHOG_KEY) return;
  try {
    posthog.capture(event, properties);
  } catch (err) {
    console.error('[Scout] trackEvent failed:', err);
  }
}
