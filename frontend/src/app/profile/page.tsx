"use client";

import { useRouter } from 'next/navigation';
import ProfilePage from '@/components/ProfilePage';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function Profile() {
  const router = useRouter();

  return (
    <ProtectedRoute>
      <ProfilePage onNavigate={(page: string) => router.push(`/${page}`)} />
    </ProtectedRoute>
  );
}