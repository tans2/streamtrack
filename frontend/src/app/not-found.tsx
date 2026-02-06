"use client";

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen text-foreground flex flex-col items-center justify-center p-6 text-center">
      <img src="/logo.png" alt="" className="w-24 h-24 mb-6 opacity-80" />
      <h1 className="text-2xl font-bold text-foreground mb-2">Page Not Found</h1>
      <p className="text-muted-foreground mb-6 max-w-md">
        The fox couldn't find what you're looking for.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={() => router.push('/')}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Home className="w-4 h-4" />
          Back to Home
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push('/search')}
        >
          <Search className="w-4 h-4" />
          Search Shows
        </Button>
      </div>
    </div>
  );
}
