'use client';

import { motion } from 'framer-motion';
import { shimmer } from '@/lib/animations';

interface SkeletonCardProps {
  variant?: 'poster' | 'horizontal';
}

export function SkeletonCard({ variant = 'poster' }: SkeletonCardProps) {
  if (variant === 'horizontal') {
    return (
      <motion.div
        className="flex gap-4 p-4 rounded-lg bg-card border border-border"
        {...shimmer}
      >
        <div className="w-20 h-28 bg-muted rounded-md shrink-0" />
        <div className="flex-1 space-y-3 py-1">
          <div className="h-5 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="h-4 bg-muted rounded w-1/4" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="rounded-lg overflow-hidden bg-card border border-border"
      {...shimmer}
    >
      <div className="aspect-[2/3] bg-muted" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-1/2" />
      </div>
    </motion.div>
  );
}

interface SkeletonGridProps {
  count?: number;
  variant?: 'poster' | 'horizontal';
}

export function SkeletonGrid({ count = 8, variant = 'poster' }: SkeletonGridProps) {
  if (variant === 'horizontal') {
    return (
      <div className="space-y-4">
        {[...Array(count)].map((_, i) => (
          <SkeletonCard key={i} variant="horizontal" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {[...Array(count)].map((_, i) => (
        <SkeletonCard key={i} variant="poster" />
      ))}
    </div>
  );
}
