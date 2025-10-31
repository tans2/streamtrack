"use client";

import { useRouter } from 'next/navigation';
import SignUpPage from '@/components/SignUpPage';

export default function SignUp() {
  const router = useRouter();

  return <SignUpPage onNavigate={(page: string) => router.push(`/${page}`)} />;
}
