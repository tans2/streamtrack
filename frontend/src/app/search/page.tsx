"use client";

import { useRouter } from 'next/navigation';
import SearchPage from '@/components/SearchPage';

export default function Search() {
  const router = useRouter();

  return <SearchPage onNavigate={(page: string) => router.push(`/${page}`)} />;
}