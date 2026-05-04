'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Zap, Play, Flame, Gem } from 'lucide-react';
import { energy } from '@/lib/api';
import type { EnergyStatus } from '@/types';

const GEM_PACKS = [
  { gems: 10, price: '$0.99', badge: null },
  { gems: 50, price: '$3.99', badge: 'Best Value' },
  { gems: 100, price: '$6.99', badge: null },
  { gems: 500, price: '$29.99', badge: null },
];

export default function EnergyPage() {
  const router = useRouter();
  const [status, setStatus] = useState<EnergyStatus | null>(null);

  useEffect(() => {
    energy.status().then(setStatus).catch(() => {});
  }, []);

  const handleWatchAd = async () => {
    try {
      const s = await energy.watchAd();
      setStatus(s);
    } catch {
      // handle
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center gap-3 border-b border-neutral-200 px-4 py-3">
        <button onClick={() => router.back()} className="text-black">
          <ArrowLeft className="h-6 w-6" strokeWidth={1.8} />
        </button>
        <h1 className="text-[18px] font-semibold text-black">Energy</h1>
      </header>

      <div className="flex-1 px-4 py-6">
        {/* Current energy */}
        {status && (
          <div className="mb-6 flex flex-col items-center rounded-xl border border-neutral-200 p-6">
            <div className="flex items-center gap-2">
              <Zap className="h-8 w-8 text-black" />
              <span className="text-[36px] font-bold text-black">{status.currentEnergy}</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
              <div className="h-full rounded-full bg-black" style={{ width: `${(status.currentEnergy / status.maxEnergy) * 100}%` }} />
            </div>
            <p className="mt-2 text-[12px] text-neutral-500">
              {status.currentEnergy}/{status.maxEnergy} · Refills in {status.nextRefreshAt ? new Date(status.nextRefreshAt).toLocaleTimeString() : '—'}
            </p>
          </div>
        )}

        {/* Watch Ad */}
        <button
          onClick={handleWatchAd}
          disabled={status !== null && status.adsWatchedToday >= status.maxAdsPerDay}
          className="mb-3 flex w-full items-center gap-3 rounded-xl border border-neutral-200 p-4 active:bg-neutral-50 disabled:opacity-40"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100">
            <Play className="h-5 w-5 text-black" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-[14px] font-semibold text-black">Watch a short video</p>
            <p className="text-[12px] text-neutral-500">
              {status ? `${status.adsWatchedToday}/${status.maxAdsPerDay} remaining today` : '...'}
            </p>
          </div>
          <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[12px] font-semibold text-black">+5</span>
        </button>

        {/* Streak */}
        <div className="mb-6 rounded-xl border border-neutral-200 p-4">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-black" />
            <span className="text-[14px] font-semibold text-black">Day {status?.streak || 0} streak!</span>
          </div>
          <div className="mt-3 flex gap-1">
            {[1, 2, 3, 4, 5, 6, 7].map((day) => (
              <div
                key={day}
                className={`flex h-9 flex-1 items-center justify-center rounded-lg text-[11px] font-medium ${
                  day <= (status?.streak || 0) ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-400'
                }`}
              >
                D{day}
              </div>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-neutral-500">Day 7 reward: +10 energy + 5 gems</p>
        </div>

        {/* Premium upsell */}
        <button
          onClick={() => router.push('/subscription')}
          className="mb-6 w-full rounded-xl bg-black p-4 text-left text-white"
        >
          <p className="text-[14px] font-semibold">Get 100 energy daily + unlimited DMs</p>
          <p className="mt-0.5 text-[12px] text-neutral-400">$9.99/month</p>
          <span className="mt-2 inline-block rounded-lg bg-white px-4 py-1.5 text-[12px] font-semibold text-black">
            Upgrade
          </span>
        </button>

        {/* Gems */}
        <h2 className="mb-3 text-[16px] font-semibold text-black">Gem Packs</h2>
        <div className="grid grid-cols-2 gap-2">
          {GEM_PACKS.map(({ gems, price, badge }) => (
            <button
              key={gems}
              className="relative flex flex-col items-center rounded-xl border border-neutral-200 p-4 active:bg-neutral-50"
            >
              {badge && (
                <span className="absolute -top-2 rounded-full bg-black px-2 py-0.5 text-[9px] font-medium text-white">{badge}</span>
              )}
              <Gem className="mb-1 h-6 w-6 text-black" />
              <span className="text-[15px] font-semibold text-black">{gems} Gems</span>
              <span className="text-[12px] text-neutral-500">{price}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
