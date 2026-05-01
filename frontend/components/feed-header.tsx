'use client';

import Link from 'next/link';
import { MessageCircle } from 'lucide-react';

export function FeedHeader() {
  return (
    <header className="flex items-center justify-between px-4 pb-3 pt-3">
      <h1
        className="text-[28px] leading-none text-black"
        style={{ fontFamily: 'var(--font-pacifico), cursive' }}
      >
        Nexus
      </h1>
      <Link
        href="/messages"
        aria-label="Messages"
        className="flex h-7 w-7 items-center justify-center text-black"
      >
        <MessageCircle className="h-6 w-6" strokeWidth={1.8} />
      </Link>
    </header>
  );
}
