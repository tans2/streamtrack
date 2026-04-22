'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Sparkles, Search, Bookmark, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const tabs = [
  { label: 'Search', icon: Search, href: '/search' },
  { label: 'Watchlist', icon: Bookmark, href: '/profile' },
  { label: 'Groups', icon: Users, href: '/groups' },
  { label: 'Picks', icon: Sparkles, href: '/picks' },
];

export function BottomTabBar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  if (!user) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t border-border" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="flex items-center justify-around h-16">
        {tabs.map(({ label, icon: Icon, href }) => {
          const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));

          return (
            <button
              key={href}
              onClick={() => router.push(href)}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors ${
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
