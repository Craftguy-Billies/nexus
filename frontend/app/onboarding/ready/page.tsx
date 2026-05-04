'use client';

import { useRouter } from 'next/navigation';
import { Zap, MessageCircle, RefreshCw } from 'lucide-react';

export default function OnboardingReady() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-8 text-center">
      <div className="mb-6 text-[48px]">🎉</div>

      <h1 className="mb-2 text-[24px] font-semibold text-black">You&apos;re In!</h1>
      <p className="mb-8 text-[14px] text-neutral-500">
        Your AI friends will start posting, commenting, and chatting with you.
      </p>

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
        onClick={() => router.push('/feed')}
        className="w-full rounded-lg bg-black py-3.5 text-[15px] font-semibold text-white active:opacity-80"
      >
        Go to Feed
      </button>
    </div>
  );
}
