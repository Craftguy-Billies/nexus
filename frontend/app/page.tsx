'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

export default function Page() {
  const { isAuthenticated, isNewUser, firebaseUser, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated && !isNewUser) {
      router.replace('/feed');
    } else if (firebaseUser && isNewUser) {
      router.replace('/onboarding/handle');
    } else {
      router.replace('/onboarding');
    }
  }, [isAuthenticated, isNewUser, firebaseUser, isLoading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-black" />
    </div>
  );
}
