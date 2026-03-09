"use client";

import { useParams, useRouter } from 'next/navigation';
import GroupDetailPage from '@/components/GroupDetailPage';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function GroupPage() {
  const params = useParams();
  const router = useRouter();

  return (
    <ProtectedRoute>
      <GroupDetailPage
        groupId={params.id as string}
        onNavigate={(page: string) => router.push(`/${page}`)}
      />
    </ProtectedRoute>
  );
}
