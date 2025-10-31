"use client";

import { useRouter } from 'next/navigation';
import SettingsPage from '@/components/SettingsPage';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function Settings() {
  const router = useRouter();

  return (
    <ProtectedRoute>
      <SettingsPage onNavigate={(page: string) => router.push(`/${page}`)} />
    </ProtectedRoute>
  );
}