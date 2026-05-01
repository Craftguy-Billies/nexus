'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

const INTERESTS = [
  { emoji: '🎮', label: 'Gaming' },
  { emoji: '🎵', label: 'Music' },
  { emoji: '💻', label: 'Tech & Code' },
  { emoji: '🎨', label: 'Art & Design' },
  { emoji: '📸', label: 'Photography' },
  { emoji: '🍕', label: 'Food & Cooking' },
  { emoji: '📚', label: 'Books & Writing' },
  { emoji: '🎬', label: 'Movies & TV' },
  { emoji: '🏋️', label: 'Fitness' },
  { emoji: '🌍', label: 'Travel' },
  { emoji: '🎭', label: 'K-Pop / K-Drama' },
  { emoji: '🧠', label: 'Philosophy' },
  { emoji: '🚀', label: 'Science' },
  { emoji: '💼', label: 'Business' },
  { emoji: '🐾', label: 'Pets & Animals' },
  { emoji: '🎯', label: 'Anime & Manga' },
  { emoji: '⚽', label: 'Sports' },
  { emoji: '💄', label: 'Fashion & Beauty' },
];

export default function OnboardingInterests() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (label: string) => {
    setSelected((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : prev.length < 5 ? [...prev, label] : prev
    );
  };

  return (
    <div className="flex min-h-screen flex-col px-6 py-4">
      <button onClick={() => router.back()} className="mb-4 self-start text-black">
        <ArrowLeft className="h-6 w-6" strokeWidth={1.8} />
      </button>

      <div className="mb-2 flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full ${i <= 3 ? 'bg-black' : 'bg-neutral-200'}`} />
        ))}
      </div>

      <h1 className="mb-1 mt-6 text-[22px] font-semibold text-black">What are you into?</h1>
      <p className="mb-6 text-[13px] text-neutral-500">
        Pick 3-5 interests. We&apos;ll introduce you to AI characters who share them.
      </p>

      <div className="grid grid-cols-3 gap-2">
        {INTERESTS.map(({ emoji, label }) => {
          const active = selected.includes(label);
          return (
            <button
              key={label}
              onClick={() => toggle(label)}
              className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-center transition-colors ${
                active ? 'border-black bg-black text-white' : 'border-neutral-200 bg-white text-black'
              }`}
            >
              <span className="text-[20px]">{emoji}</span>
              <span className="text-[11px] font-medium leading-tight">{label}</span>
            </button>
          );
        })}
      </div>

      <p className="mt-4 text-center text-[13px] text-neutral-500">{selected.length}/5 selected</p>

      <div className="mt-auto pt-6">
        <button
          onClick={() => router.push('/onboarding/friends')}
          disabled={selected.length < 3}
          className="w-full rounded-lg bg-black py-3.5 text-[15px] font-semibold text-white disabled:opacity-40 active:opacity-80"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
