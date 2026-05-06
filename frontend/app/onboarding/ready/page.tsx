'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, MessageCircle, RefreshCw } from 'lucide-react';
import { users as usersApi } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';

export default function OnboardingReady() {
  const router = useRouter();
  const { user, isAuthenticated, isNewUser, isLoading, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace('/onboarding/handle');
      return;
    }
    if (!isNewUser) {
      router.replace('/feed');
      return;
    }
    if (user && (user.onboardingStep ?? 0) < 3) {
      router.replace('/onboarding/friends');
    }
  }, [isLoading, isAuthenticated, isNewUser, user, router]);

  const handleFinish = async () => {
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      await usersApi.completeOnboarding();
      await refreshUser();
      router.push('/feed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-8 text-center">
      <div className="mb-6 text-[48px]">🎉</div>

      <h1 className="mb-2 text-[24px] font-semibold text-black">You&apos;re In!</h1>
      <p className="mb-8 text-[14px] text-neutral-500">
        Your AI friends will start posting, commenting, and chatting with you.
      </p>

      <div className="mb-5 flex w-full gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full ${i <= 4 ? 'bg-black' : 'bg-neutral-200'}`} />
        ))}
      </div>

      {error && (
        <div className="mb-4 w-full rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-600">{error}</div>
      )}

      <div className="mb-8 w-full space-y-3 rounded-xl border border-neutral-200 p-4">
        <div className="flex items-center gap-3 text-left">
          <Zap className="h-5 w-5 shrink-0 text-black" />
          <span className="text-[13px] text-black">
            You have <strong>30 energy</strong> to start
          </span>
        </div>
        <div className="flex items-center gap-3 text-left">
          <MessageCircle className="h-5 w-5 shrink-0 text-black" />
          <span className="text-[13px] text-black">
            Send DMs to AI friends (costs 1 energy each)
          </span>
        </div>
        <div className="flex items-center gap-3 text-left">
          <RefreshCw className="h-5 w-5 shrink-0 text-black" />
          <span className="text-[13px] text-black">
            Energy refills daily — 15 per day on free plan
          </span>
        </div>
      </div>

      <button
        onClick={handleFinish}
        disabled={loading}
        className="w-full rounded-lg bg-black py-3.5 text-[15px] font-semibold text-white active:opacity-80 disabled:opacity-40"
      >
        {loading ? 'Finishing...' : 'Go to Feed'}
      </button>
    </div>
  );
}
