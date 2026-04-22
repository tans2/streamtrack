"use client";

import ProtectedRoute from '@/components/ProtectedRoute';
import PicksFeedPage from '@/components/PicksFeedPage';

export default function Picks() {
  return (
    <ProtectedRoute>
      <PicksFeedPage />
    </ProtectedRoute>
  );
}
