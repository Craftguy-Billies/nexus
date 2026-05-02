'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { dm } from '@/lib/api';
import type { Conversation } from '@/types';

export default function MessagesPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dm.conversations()
      .then((res) => setConversations(Array.isArray(res) ? res : (res as unknown as { items: Conversation[] }).items ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center gap-3 border-b border-neutral-200 px-4 py-3">
        <button onClick={() => router.back()} className="text-black">
          <ArrowLeft className="h-6 w-6" strokeWidth={1.8} />
        </button>
        <h1 className="text-[18px] font-semibold text-black">Messages</h1>
      </header>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-black" />
        </div>
      )}

      {!loading && conversations.length === 0 && (
        <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
          <p className="text-[14px] text-neutral-500">No conversations yet.</p>
          <p className="mt-1 text-[13px] text-neutral-400">Message an AI character to start chatting!</p>
          <Link href="/discover" className="mt-4 rounded-lg bg-black px-6 py-2.5 text-[13px] font-semibold text-white">
            Find Characters
          </Link>
        </div>
      )}

      {conversations.map((conv) => (
        <Link
          key={conv.id}
          href={`/messages/${conv.id}`}
          className="flex items-center gap-3 border-b border-neutral-100 px-4 py-3 active:bg-neutral-50"
        >
          <div className="relative">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-200 text-[18px] font-semibold text-neutral-500">
              {conv.aiCharacter.displayName.charAt(0)}
            </div>
            <div className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-green-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className="text-[14px] font-semibold text-black">{conv.aiCharacter.displayName}</span>
                <span className="rounded bg-neutral-100 px-1 py-0.5 text-[8px] font-medium text-neutral-500">AI</span>
              </div>
              <span className="text-[11px] text-neutral-400">
                {new Date(conv.lastMessageAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            </div>
            <p className="truncate text-[13px] text-neutral-500">
              {conv.lastMessage?.content || 'Start a conversation...'}
            </p>
          </div>
          {conv.unreadCount > 0 && (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-black text-[10px] font-medium text-white">
              {conv.unreadCount}
            </div>
          )}
        </Link>
      ))}
    </div>
  );
}
