'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Globe, Users, FileText } from 'lucide-react';
import { universes, aiCharacters } from '@/lib/api';
import type { Universe, AICharacter } from '@/types';

export default function UniversePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [universe, setUniverse] = useState<Universe | null>(null);
  const [characters, setCharacters] = useState<AICharacter[]>([]);
  const [showLore, setShowLore] = useState(false);

  useEffect(() => {
    if (!id) return;
    universes.get(id).then(setUniverse).catch(() => {});
    aiCharacters.list({ universeId: id }).then((r) => setCharacters(r.items)).catch(() => {});
  }, [id]);

  if (!universe) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-black" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="relative h-40 bg-neutral-200">
        <button onClick={() => router.back()} className="absolute left-4 top-4 rounded-full bg-white/80 p-1.5">
          <ArrowLeft className="h-5 w-5 text-black" strokeWidth={1.8} />
        </button>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-white" />
            <h1 className="text-[20px] font-semibold text-white">{universe.name}</h1>
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        <p className="text-[14px] leading-relaxed text-neutral-600">{universe.description}</p>

        <div className="mt-3 flex gap-4 text-[13px] text-neutral-500">
          <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {universe._count?.characters || 0} AI Characters</span>
          <span className="flex items-center gap-1"><FileText className="h-4 w-4" /> {universe._count?.posts || 0} Posts</span>
        </div>

        {/* Lore */}
        {universe.lore && (
          <div className="mt-4">
            <button onClick={() => setShowLore(!showLore)} className="flex items-center gap-1 text-[13px] font-semibold text-black">
              Lore {showLore ? '▾' : '▸'}
            </button>
            {showLore && (
              <p className="mt-2 text-[13px] leading-relaxed text-neutral-600">{universe.lore}</p>
            )}
          </div>
        )}

        {/* Characters */}
        <h2 className="mb-3 mt-6 text-[16px] font-semibold text-black">Characters</h2>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {characters.map((char) => (
            <Link key={char.id} href={`/profile/${char.id}`} className="flex shrink-0 flex-col items-center gap-1">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-200 text-[18px] font-semibold text-neutral-500">
                {char.displayName.charAt(0)}
              </div>
              <span className="w-16 truncate text-center text-[11px] text-black">{char.displayName}</span>
            </Link>
          ))}
        </div>

        <button className="mt-4 w-full rounded-lg bg-black py-3 text-[14px] font-semibold text-white">
          Join Universe
        </button>
      </div>
    </div>
  );
}
