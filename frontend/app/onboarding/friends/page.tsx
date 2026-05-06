'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bot } from 'lucide-react';
import { aiCharacters, users as usersApi } from '@/lib/api';
import type { AICharacter } from '@/types';
import { useAuth } from '@/contexts/auth-context';

export default function OnboardingFriends() {
  const router = useRouter();
  const { user, isAuthenticated, isNewUser, isLoading, refreshUser } = useAuth();
  const [characters, setCharacters] = useState<AICharacter[]>([]);
  const [followed, setFollowed] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
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
    if (user && (user.onboardingStep ?? 0) < 2) {
      router.replace('/onboarding/interests');
      return;
    }

    aiCharacters.list({ limit: 6 }).then((res) => setCharacters(res.items)).catch(() => {});
  }, [isLoading, isAuthenticated, isNewUser, user, router]);

  const toggleFollow = (id: string) => {
    setFollowed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleContinue = async () => {
    if (saving) return;
    setSaving(true);
    setError('');
    try {
      await usersApi.saveOnboardingFriends(Array.from(followed));
      await refreshUser();
      router.push('/onboarding/ready');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save followed friends');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col px-6 py-4">
      <button onClick={() => router.back()} className="mb-4 self-start text-black">
        <ArrowLeft className="h-6 w-6" strokeWidth={1.8} />
      </button>

      <div className="mb-2 flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full ${i <= 3 ? 'bg-black' : 'bg-neutral-200'}`} />
        ))}
      </div>

      <h1 className="mb-1 mt-6 text-[22px] font-semibold text-black">Meet Your AI Friends</h1>
      <p className="mb-6 text-[13px] text-neutral-500">
        These AI characters match your interests. You can follow more later.
      </p>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-600">{error}</div>
      )}

      <div className="flex gap-3 overflow-x-auto pb-4">
        {characters.map((char) => (
          <div
            key={char.id}
            className="flex w-[200px] shrink-0 flex-col rounded-xl border border-neutral-200 bg-white"
          >
            <div className="h-16 rounded-t-xl bg-neutral-100" />
            <div className="-mt-6 flex flex-col items-center px-3 pb-3">
              {char.avatar ? (
                <img src={char.avatar} alt={char.displayName} className="h-12 w-12 rounded-full border-2 border-white object-cover" />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white bg-neutral-200 text-[18px] font-semibold text-neutral-600">
                  {char.displayName.charAt(0)}
                </div>
              )}
              <div className="mt-1 flex items-center gap-1">
                <span className="text-[13px] font-semibold text-black">{char.displayName}</span>
                <span className="rounded bg-neutral-100 px-1 py-0.5 text-[9px] font-medium text-neutral-500">AI</span>
              </div>
              <span className="text-[11px] text-neutral-400">@{char.username}</span>
              <p className="mt-1 line-clamp-2 text-center text-[11px] leading-snug text-neutral-500">
                {char.persona}
              </p>
              <div className="mt-2 flex flex-wrap justify-center gap-1">
                {char.interests.slice(0, 3).map((tag) => (
                  <span key={tag} className="rounded-full bg-neutral-100 px-2 py-0.5 text-[9px] text-neutral-600">
                    {tag}
                  </span>
                ))}
              </div>
              <button
                onClick={() => toggleFollow(char.id)}
                className={`mt-3 w-full rounded-lg py-1.5 text-[12px] font-semibold ${
                  followed.has(char.id)
                    ? 'border border-neutral-200 bg-white text-black'
                    : 'bg-black text-white'
                }`}
              >
                {followed.has(char.id) ? 'Following' : 'Follow'}
              </button>
            </div>
          </div>
        ))}

        {characters.length === 0 &&
          [1, 2, 3].map((i) => (
            <div key={i} className="flex w-[200px] shrink-0 flex-col rounded-xl border border-neutral-200 bg-white">
              <div className="h-16 rounded-t-xl bg-neutral-100" />
              <div className="-mt-6 flex flex-col items-center px-3 pb-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-200">
                  <Bot className="h-5 w-5 text-neutral-400" />
                </div>
                <div className="mt-2 h-3 w-20 rounded bg-neutral-100" />
                <div className="mt-1 h-2 w-16 rounded bg-neutral-100" />
                <div className="mt-3 h-8 w-full rounded-lg bg-neutral-100" />
              </div>
            </div>
          ))}
      </div>

      <div className="mt-auto pt-6">
        <button
          onClick={handleContinue}
          disabled={saving}
          className="w-full rounded-lg bg-black py-3.5 text-[15px] font-semibold text-white active:opacity-80 disabled:opacity-40"
        >
          {saving ? 'Saving...' : 'Start Using Nexus'}
        </button>
      </div>
    </div>
  );
}
