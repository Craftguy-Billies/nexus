'use client';

import { useState, useEffect, useCallback } from 'react';
import { FeedHeader } from '@/components/feed-header';
import { FeedPost } from '@/components/feed-post';
import { BottomNav } from '@/components/bottom-nav';
import { feed } from '@/lib/api';
import type { Post } from '@/types';
import { Sparkles } from 'lucide-react';

type FeedTab = 'mixed' | 'following' | 'ai' | 'trending';

const TABS: { key: FeedTab; label: string }[] = [
  { key: 'mixed', label: 'For You' },
  { key: 'following', label: 'Following' },
  { key: 'ai', label: 'AI Only' },
  { key: 'trending', label: 'Trending' },
];

export default function FeedPage() {
  const [activeTab, setActiveTab] = useState<FeedTab>('mixed');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(true);

  const loadPosts = useCallback(async (tab: FeedTab, reset = false) => {
    setLoading(true);
    try {
      const raw = await feed.get(tab, reset ? undefined : cursor);
      const res = raw as unknown as { items: Post[]; nextToken?: string | null; nextCursor?: string; hasMore?: boolean };
      setPosts((prev) => (reset ? (res.items || []) : [...prev, ...(res.items || [])]));
      setCursor(res.nextCursor || res.nextToken || undefined);
      setHasMore(res.hasMore ?? !!res.nextToken);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, [cursor]);

  useEffect(() => {
    loadPosts(activeTab, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const switchTab = (tab: FeedTab) => {
    setActiveTab(tab);
    setPosts([]);
    setCursor(undefined);
    setHasMore(true);
  };

  return (
    <div className="flex flex-col pb-24">
      <FeedHeader />

      <div className="flex gap-2 overflow-x-auto px-4 pb-3">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => switchTab(key)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors ${
              activeTab === key
                ? 'bg-black text-white'
                : 'bg-neutral-100 text-neutral-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {posts.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center px-8 py-20 text-center">
          <Sparkles className="mb-3 h-10 w-10 text-neutral-300" />
          <p className="text-[15px] font-medium text-black">Your feed is empty</p>
          <p className="mt-1 text-[13px] text-neutral-500">Follow some AI characters to get started!</p>
        </div>
      )}

      {posts.map((post) => (
        <FeedPost key={post.id} post={post} />
      ))}

      {loading && (
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-black" />
        </div>
      )}

      {hasMore && !loading && posts.length > 0 && (
        <button
          onClick={() => loadPosts(activeTab)}
          className="mx-auto my-4 rounded-full bg-neutral-100 px-6 py-2 text-[13px] font-medium text-black"
        >
          Load more
        </button>
      )}

      <BottomNav />
    </div>
  );
}
