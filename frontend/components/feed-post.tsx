'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal } from 'lucide-react';
import type { Post } from '@/types';
import { posts as postsApi } from '@/lib/api';

interface FeedPostProps {
  post: Post;
}

export function FeedPost({ post }: FeedPostProps) {
  const [liked, setLiked] = useState(post.isLiked || false);
  const [likeCount, setLikeCount] = useState(post._count?.likes || 0);
  const [bookmarked, setBookmarked] = useState(post.isBookmarked || false);

  const author = post.aiCharacter || post.author;
  const isAI = !!post.aiCharacter;
  const displayName = author?.displayName || 'Unknown';
  const username = author?.username || 'unknown';
  const avatarUrl = author?.avatarUrl;

  const toggleLike = async () => {
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => (next ? c + 1 : c - 1));
    try {
      if (next) await postsApi.like(post.id);
      else await postsApi.unlike(post.id);
    } catch {
      setLiked(!next);
      setLikeCount((c) => (next ? c - 1 : c + 1));
    }
  };

  return (
    <article className="border-b border-neutral-200">
      <div className="flex items-center justify-between px-3 py-2.5">
        <Link href={isAI ? `/profile/${post.aiCharacterId}` : `/profile/${post.authorId}`} className="flex items-center gap-2.5">
          <div className="h-8 w-8 overflow-hidden rounded-full bg-neutral-200 ring-1 ring-neutral-200">
            {avatarUrl ? (
              <Image src={avatarUrl} alt={displayName} width={32} height={32} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[12px] font-semibold text-neutral-500">
                {displayName.charAt(0)}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-semibold text-black">{username}</span>
            {isAI && (
              <span className="rounded bg-neutral-100 px-1 py-0.5 text-[8px] font-medium text-neutral-500">AI</span>
            )}
          </div>
        </Link>
        <button type="button" aria-label="More options" className="text-black">
          <MoreHorizontal className="h-5 w-5" strokeWidth={2} />
        </button>
      </div>

      {post.mediaUrls.length > 0 && (
        <div className="relative aspect-square w-full bg-neutral-100">
          <Image
            src={post.mediaUrls[0]}
            alt="Post media"
            fill
            sizes="430px"
            className="object-cover"
          />
        </div>
      )}

      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-3">
          <button type="button" onClick={toggleLike} aria-label={liked ? 'Unlike' : 'Like'} className="text-black transition-transform active:scale-90">
            <Heart className={`h-7 w-7 ${liked ? 'fill-red-500 text-red-500' : 'fill-none'}`} strokeWidth={1.8} />
          </button>
          <Link href={`/post/${post.id}`} aria-label="Comment" className="text-black -scale-x-100">
            <MessageCircle className="h-7 w-7 fill-none" strokeWidth={1.8} />
          </Link>
          <button type="button" aria-label="Share" className="text-black">
            <Share2 className="h-6 w-6" strokeWidth={1.8} />
          </button>
        </div>
        <button type="button" onClick={() => setBookmarked(!bookmarked)} aria-label="Bookmark" className="text-black">
          <Bookmark className={`h-7 w-7 ${bookmarked ? 'fill-black' : 'fill-none'}`} strokeWidth={1.8} />
        </button>
      </div>

      {likeCount > 0 && (
        <div className="px-3 text-[13px] text-black">
          <p><span className="font-semibold">{likeCount.toLocaleString()}</span> {likeCount === 1 ? 'like' : 'likes'}</p>
        </div>
      )}

      <div className="px-3 pb-3 pt-1 text-[13px] text-black">
        <p className="leading-snug">
          <span className="font-semibold">{username}</span>{' '}
          <span>{post.content}</span>
        </p>
        {(post._count?.comments || 0) > 0 && (
          <Link href={`/post/${post.id}`} className="mt-1 block text-neutral-400">
            View all {post._count?.comments} comments
          </Link>
        )}
        <p className="mt-1 text-[11px] text-neutral-400">
          {new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </p>
      </div>
    </article>
  );
}
