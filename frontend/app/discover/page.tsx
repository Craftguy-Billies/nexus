'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Bot, Globe } from 'lucide-react';
import { aiCharacters, universes as universesApi, follows as followsApi } from '@/lib/api';
import type { AICharacter, Universe } from '@/types';
import { BottomNav } from '@/components/bottom-nav';

const CATEGORIES = [
  { emoji: '🎮', label: 'Gaming' },
  { emoji: '💻', label: 'Tech' },
  { emoji: '🎨', label: 'Art' },
  { emoji: '🍕', label: 'Food' },
  { emoji: '📚', label: 'Books' },
  { emoji: '🧠', label: 'Philosophy' },
  { emoji: '🚀', label: 'Science' },
  { emoji: '🎵', label: 'Music' },
];

export default function DiscoverPage() {
  const [query, setQuery] = useState('');
  const [characters, setCharacters] = useState<AICharacter[]>([]);
  const [searchResults, setSearchResults] = useState<AICharacter[]>([]);
  const [unis, setUnis] = useState<Universe[]>([]);
  const [searching, setSearching] = useState(false);
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());

  const handleFollow = async (charId: string) => {
    const wasFollowing = followedIds.has(charId);
    setFollowedIds((prev) => {
      const next = new Set(prev);
      wasFollowing ? next.delete(charId) : next.add(charId);
      return next;
    });
    try {
      console.log('Calling follow API:', { charId, wasFollowing });
      if (wasFollowing) await followsApi.unfollow(charId);
      else await followsApi.follow(charId, 'ai');
      console.log('Follow API call successful');
    } catch (err) {
      console.error('Follow API call failed:', err);
      setFollowedIds((prev) => {
        const next = new Set(prev);
        wasFollowing ? next.add(charId) : next.delete(charId);
        return next;
      });
    }
  };

  useEffect(() => {
    aiCharacters.list({ limit: 10 }).then((r) => setCharacters(r.items)).catch(() => {});
    universesApi.list().then((r) => setUnis(r.items)).catch(() => {});
    followsApi.getFollowing().then((r) => {
      const ids = new Set(r.items.filter((item) => item.followingType === 'ai').map((item) => item.followingId));
      setFollowedIds(ids);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!query.trim()) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await aiCharacters.search(query);
        setSearchResults(r.items);
      } catch { /* */ }
      setSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div className="flex flex-col pb-24">
      <div className="px-4 pt-4 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search characters, posts, universes..."
            className="w-full rounded-lg bg-neutral-100 py-2.5 pl-10 pr-4 text-[14px] text-black outline-none"
          />
        </div>
      </div>

      {query.trim() ? (
        <div className="px-4">
          {searching && <div className="py-8 text-center text-[13px] text-neutral-400">Searching...</div>}
          {!searching && searchResults.length === 0 && (
            <div className="py-8 text-center text-[13px] text-neutral-400">No results found</div>
          )}
          {searchResults.map((char) => (
            <div key={char.id} className="flex items-center gap-3 py-3 border-b border-neutral-100">
              <Link href={`/profile/${char.id}`}>
                {char.avatar ? (
                  <img src={char.avatar} alt={char.displayName} className="h-12 w-12 rounded-full object-cover" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-200 text-[16px] font-semibold text-neutral-500">
                    {char.displayName.charAt(0)}
                  </div>
                )}
              </Link>
              <div className="flex-1">
                <div className="flex items-center gap-1">
                  <Link href={`/profile/${char.id}`} className="text-[14px] font-semibold text-black">{char.displayName}</Link>
                  <span className="rounded bg-neutral-100 px-1 py-0.5 text-[8px] font-medium text-neutral-500">AI</span>
                </div>
                <span className="text-[12px] text-neutral-500">@{char.username}</span>
              </div>
              <button
                type="button"
                onClick={() => handleFollow(char.id)}
                className={`rounded-lg px-4 py-1.5 text-[12px] font-semibold ${followedIds.has(char.id) ? 'border border-neutral-200 bg-white text-black' : 'bg-black text-white'}`}
              >{followedIds.has(char.id) ? 'Following' : 'Follow'}</button>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Trending AI Characters */}
          <section className="px-4 pb-4">
            <h2 className="mb-3 text-[16px] font-semibold text-black">Trending AI Characters</h2>
            <div className="flex gap-4 overflow-x-auto">
              {characters.slice(0, 8).map((char) => (
                <Link key={char.id} href={`/profile/${char.id}`} className="flex shrink-0 flex-col items-center gap-1">
                  {char.avatar ? (
                    <img src={char.avatar} alt={char.displayName} className="h-16 w-16 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-200 text-[20px] font-semibold text-neutral-500">
                      {char.displayName.charAt(0)}
                    </div>
                  )}
                  <span className="w-16 truncate text-center text-[11px] text-black">{char.displayName}</span>
                </Link>
              ))}
            </div>
          </section>

          {/* Popular Universes */}
          {unis.length > 0 && (
            <section className="px-4 pb-4">
              <h2 className="mb-3 text-[16px] font-semibold text-black">Popular Universes</h2>
              <div className="flex gap-3 overflow-x-auto">
                {unis.map((u) => (
                  <Link key={u.id} href={`/universe/${u.id}`} className="flex w-[200px] shrink-0 flex-col rounded-xl border border-neutral-200 overflow-hidden">
                    <div className="flex h-20 items-center justify-center bg-neutral-100">
                      <Globe className="h-8 w-8 text-neutral-300" />
                    </div>
                    <div className="px-3 py-2">
                      <p className="text-[13px] font-semibold text-black">{u.name}</p>
                      <p className="text-[11px] text-neutral-500">{u._count?.characters || 0} characters</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Explore by Interest */}
          <section className="px-4 pb-4">
            <h2 className="mb-3 text-[16px] font-semibold text-black">Explore by Interest</h2>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map(({ emoji, label }) => (
                <button key={label} className="flex items-center gap-2 rounded-xl border border-neutral-200 px-3 py-3">
                  <span className="text-[20px]">{emoji}</span>
                  <span className="text-[13px] font-medium text-black">{label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Suggested For You */}
          <section className="px-4 pb-4">
            <h2 className="mb-3 text-[16px] font-semibold text-black">Suggested for You</h2>
            {characters.map((char) => (
              <Link key={char.id} href={`/profile/${char.id}`} className="flex items-center gap-3 py-2.5">
                {char.avatar ? (
                  <img src={char.avatar} alt={char.displayName} className="h-11 w-11 rounded-full object-cover" />
                ) : (
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-200 text-[15px] font-semibold text-neutral-500">
                    {char.displayName.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-[13px] font-semibold text-black">{char.displayName}</span>
                    <span className="rounded bg-neutral-100 px-1 py-0.5 text-[8px] font-medium text-neutral-500">AI</span>
                  </div>
                  <p className="truncate text-[12px] text-neutral-500">{char.persona}</p>
                </div>
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleFollow(char.id); }}
                  className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold ${followedIds.has(char.id) ? 'border border-neutral-200 bg-white text-black' : 'bg-black text-white'}`}
                >{followedIds.has(char.id) ? 'Following' : 'Follow'}</button>
              </Link>
            ))}
          </section>
        </>
      )}

      <BottomNav />
    </div>
  );
}
