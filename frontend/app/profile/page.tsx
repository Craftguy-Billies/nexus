'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Settings, Zap, Edit } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { feed, energy } from '@/lib/api';
import type { Post, EnergyStatus } from '@/types';
import { BottomNav } from '@/components/bottom-nav';
import { FeedPost } from '@/components/feed-post';

export default function ProfilePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'posts' | 'liked' | 'friends'>('posts');
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [energyStatus, setEnergyStatus] = useState<EnergyStatus | null>(null);

  useEffect(() => {
    feed.get('following').then((r) => setMyPosts(r.items)).catch(() => {});
    energy.status().then((res) => {
      const r = res as unknown as { energy: number; gems: number; tier: string };
      setEnergyStatus({
        currentEnergy: r.energy ?? 0,
        maxEnergy: r.tier === 'pro' ? 100 : r.tier === 'premium' ? 60 : 30,
        tier: (r.tier as 'free' | 'premium' | 'pro') ?? 'free',
        dailyRefresh: r.tier === 'pro' ? 100 : r.tier === 'premium' ? 60 : 30,
        nextRefreshAt: '',
        streak: 0,
        adsWatchedToday: 0,
        maxAdsPerDay: 5,
      });
    }).catch(() => {});
  }, []);

  if (!user) return null;

  return (
    <div className="flex flex-col pb-24">
      <header className="flex items-center justify-between px-4 py-3">
        <span className="text-[16px] font-semibold text-black">@{user.username}</span>
        <Link href="/settings" className="text-black">
          <Settings className="h-6 w-6" strokeWidth={1.5} />
        </Link>
      </header>

      {/* Profile info */}
      <div className="px-4 pb-4">
        <div className="flex items-center gap-5">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-neutral-200 text-[28px] font-semibold text-neutral-500">
            {user.displayName.charAt(0)}
          </div>
          <div className="flex flex-1 justify-around text-center">
            <div>
              <p className="text-[16px] font-semibold text-black">{user._count?.posts || 0}</p>
              <p className="text-[12px] text-neutral-500">Posts</p>
            </div>
            <div>
              <p className="text-[16px] font-semibold text-black">{user._count?.followers || 0}</p>
              <p className="text-[12px] text-neutral-500">Followers</p>
            </div>
            <div>
              <p className="text-[16px] font-semibold text-black">{user._count?.following || 0}</p>
              <p className="text-[12px] text-neutral-500">Following</p>
            </div>
          </div>
        </div>

        <p className="mt-3 text-[14px] font-semibold text-black">{user.displayName}</p>
        {user.bio && <p className="mt-1 text-[13px] text-neutral-600">{user.bio}</p>}

        {energyStatus && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-neutral-50 px-3 py-2">
            <Zap className="h-4 w-4 text-black" />
            <span className="text-[13px] font-medium text-black">
              {energyStatus.currentEnergy}/{energyStatus.maxEnergy} Energy
            </span>
            <div className="ml-auto h-1.5 w-20 overflow-hidden rounded-full bg-neutral-200">
              <div
                className="h-full rounded-full bg-black"
                style={{ width: `${(energyStatus.currentEnergy / energyStatus.maxEnergy) * 100}%` }}
              />
            </div>
          </div>
        )}

        <Link
          href="/profile/edit"
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-neutral-200 py-2 text-[13px] font-semibold text-black"
        >
          <Edit className="h-4 w-4" />
          Edit Profile
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-200">
        {(['posts', 'liked', 'friends'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-center text-[13px] font-medium capitalize ${
              activeTab === tab ? 'border-b-2 border-black text-black' : 'text-neutral-400'
            }`}
          >
            {tab === 'friends' ? 'AI Friends' : tab === 'posts' ? 'My Posts' : 'Liked'}
          </button>
        ))}
      </div>

      <div>
        {activeTab === 'posts' && myPosts.map((p) => <FeedPost key={p.id} post={p} />)}
        {activeTab === 'posts' && myPosts.length === 0 && (
          <div className="py-12 text-center text-[13px] text-neutral-400">No posts yet</div>
        )}
        {activeTab === 'liked' && (
          <div className="py-12 text-center text-[13px] text-neutral-400">No liked posts yet</div>
        )}
        {activeTab === 'friends' && (
          <div className="py-12 text-center text-[13px] text-neutral-400">Follow AI characters to see them here</div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
