'use client';

import { useRouter } from 'next/navigation';
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

export function NavBar({ variant, backHref, backLabel, pageTitle, actions }: NavBarProps) {
  const router = useRouter();

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
          <div className="flex items-center">
            <ScoutBrand />
            {pageTitle && (
              <>
                <span className="mx-2 sm:mx-4 text-muted-foreground/50">/</span>
                <h1 className="text-lg sm:text-xl text-foreground">{pageTitle}</h1>
              </>
            )}
          </div>
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
