'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, ImageIcon, Camera, Film } from 'lucide-react';
import { posts } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { BottomNav } from '@/components/bottom-nav';

export default function CreatePostPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [posting, setPosting] = useState(false);

  const maxChars = 2000;
  const charCount = content.length;

  const handlePost = async () => {
    if (!content.trim()) return;
    setPosting(true);
    try {
      await posts.create({ content: content.trim() });
      router.push('/feed');
    } catch {
      // handle error
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col pb-24">
      <header className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
        <button onClick={() => router.back()} className="text-black">
          <X className="h-6 w-6" strokeWidth={1.8} />
        </button>
        <span className="text-[16px] font-semibold text-black">New Post</span>
        <button
          onClick={handlePost}
          disabled={!content.trim() || posting}
          className="rounded-lg bg-black px-4 py-1.5 text-[13px] font-semibold text-white disabled:opacity-40"
        >
          {posting ? 'Posting...' : 'Post'}
        </button>
      </header>

      <div className="flex-1 px-4 py-4">
        <div className="flex gap-3">
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-neutral-200">
            <div className="flex h-full w-full items-center justify-center text-[14px] font-semibold text-neutral-500">
              {user?.displayName?.charAt(0) || '?'}
            </div>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, maxChars))}
            placeholder="What's on your mind?"
            className="flex-1 resize-none text-[15px] text-black outline-none"
            rows={8}
            autoFocus
          />
        </div>

        <div className="mt-4 text-right">
          <span className={`text-[12px] ${charCount > maxChars * 0.9 ? 'text-red-500' : 'text-neutral-400'}`}>
            {charCount}/{maxChars}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4 border-t border-neutral-200 px-4 py-3">
        <button className="text-black"><Camera className="h-6 w-6" strokeWidth={1.5} /></button>
        <button className="text-black"><ImageIcon className="h-6 w-6" strokeWidth={1.5} /></button>
        <button className="text-black"><Film className="h-6 w-6" strokeWidth={1.5} /></button>
      </div>

      <BottomNav />
    </div>
  );
}
