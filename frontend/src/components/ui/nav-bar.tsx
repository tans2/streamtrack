'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Button } from './button';
import { ArrowLeft } from 'lucide-react';
import React from 'react';

interface NavBarProps {
  variant: 'landing' | 'auth' | 'authenticated';
  backHref?: string;
  backLabel?: string;
  pageTitle?: string;
  actions?: React.ReactNode;
}

function ScoutBrand() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push('/')}
      className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
    >
      <img src="/logo.png" alt="Scout" className="w-8 h-8" />
      <span className="text-xl sm:text-2xl font-bold text-primary">Scout</span>
    </button>
  );
}

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Search', href: '/search' },
  { label: 'Watchlist', href: '/profile' },
];

export function NavBar({ variant, backHref, backLabel, pageTitle, actions }: NavBarProps) {
  const router = useRouter();
  const pathname = usePathname();

  if (variant === 'landing') {
    return (
      <nav className="flex items-center justify-between p-3 sm:p-6">
        <ScoutBrand />
        {actions && (
          <div className="flex items-center space-x-2 sm:space-x-4">
            {actions}
          </div>
        )}
      </nav>
    );
  }

  if (variant === 'auth') {
    return (
      <nav className="flex items-center p-3 sm:p-6">
        <div className="flex items-center">
          {backHref && (
            <Button
              variant="ghost"
              size="sm"
              className="text-primary hover:text-primary hover:bg-primary/10 mr-2 sm:mr-4"
              onClick={() => router.push(backHref)}
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">{backLabel || 'Back'}</span>
            </Button>
          )}
          <ScoutBrand />
        </div>
      </nav>
    );
  }

  // authenticated variant
  return (
    <div className="border-b border-border bg-card/50">
      <div className="container mx-auto px-3 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <ScoutBrand />

          {/* Center nav links — hidden on mobile (bottom tab bar handles it) */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ label, href }) => {
              const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
              return (
                <button
                  key={href}
                  onClick={() => router.push(href)}
                  className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  {label}
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                  )}
                </button>
              );
            })}
          </nav>

          {actions && (
            <div className="flex items-center space-x-2 sm:space-x-4">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
