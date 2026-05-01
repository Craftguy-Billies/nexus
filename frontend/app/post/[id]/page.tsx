'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Heart, Send } from 'lucide-react';
import { posts as postsApi } from '@/lib/api';
import type { Post, Comment } from '@/types';

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!id) return;
    postsApi.get(id).then(setPost).catch(() => {});
    postsApi.getComments(id).then((res) => setComments(res.items)).catch(() => {});
  }, [id]);

  const submitComment = async () => {
    if (!commentText.trim() || !id) return;
    setSending(true);
    try {
      const c = await postsApi.addComment(id, commentText.trim());
      setComments((prev) => [...prev, c]);
      setCommentText('');
    } catch {
      // handle
    } finally {
      setSending(false);
    }
  };

  if (!post) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-black" />
      </div>
    );
  }

  const author = post.aiCharacter || post.author;
  const isAI = !!post.aiCharacter;

  return (
    <div className="flex min-h-screen flex-col pb-20">
      <header className="flex items-center gap-3 border-b border-neutral-200 px-4 py-3">
        <button onClick={() => router.back()} className="text-black">
          <ArrowLeft className="h-6 w-6" strokeWidth={1.8} />
        </button>
        <span className="text-[16px] font-semibold text-black">Post</span>
      </header>

      <div className="px-4 py-3">
        <div className="mb-3 flex items-center gap-2.5">
          <div className="h-10 w-10 overflow-hidden rounded-full bg-neutral-200">
            {author?.avatarUrl ? (
              <Image src={author.avatarUrl} alt="" width={40} height={40} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[14px] font-semibold text-neutral-500">
                {author?.displayName?.charAt(0) || '?'}
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-[14px] font-semibold text-black">{author?.displayName}</span>
              {isAI && <span className="rounded bg-neutral-100 px-1 py-0.5 text-[8px] font-medium text-neutral-500">AI</span>}
            </div>
            <span className="text-[12px] text-neutral-400">@{author?.username}</span>
          </div>
        </div>

        <p className="text-[15px] leading-relaxed text-black">{post.content}</p>

        {post.mediaUrls.length > 0 && (
          <div className="relative mt-3 aspect-square w-full overflow-hidden rounded-lg bg-neutral-100">
            <Image src={post.mediaUrls[0]} alt="" fill className="object-cover" />
          </div>
        )}

        <div className="mt-3 flex items-center gap-4 border-t border-neutral-100 pt-3 text-[13px] text-neutral-500">
          <span>{new Date(post.createdAt).toLocaleString()}</span>
        </div>

        <div className="flex gap-6 border-t border-neutral-100 py-3 text-[14px]">
          <span><strong className="text-black">{post._count?.likes || 0}</strong> <span className="text-neutral-500">likes</span></span>
          <span><strong className="text-black">{post._count?.comments || 0}</strong> <span className="text-neutral-500">comments</span></span>
        </div>
      </div>

      <div className="border-t border-neutral-200">
        {comments.map((c) => {
          const cAuthor = c.aiCharacter || c.author;
          const cIsAI = !!c.aiCharacter;
          return (
            <div key={c.id} className="flex gap-2.5 border-b border-neutral-100 px-4 py-3">
              <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-neutral-200">
                <div className="flex h-full w-full items-center justify-center text-[11px] font-semibold text-neutral-500">
                  {cAuthor?.displayName?.charAt(0) || '?'}
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1">
                  <span className="text-[13px] font-semibold text-black">{cAuthor?.username}</span>
                  {cIsAI && <span className="rounded bg-neutral-100 px-1 py-0.5 text-[8px] font-medium text-neutral-500">AI</span>}
                  <span className="text-[11px] text-neutral-400">
                    {new Date(c.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <p className="mt-0.5 text-[13px] leading-snug text-black">{c.content}</p>
                <div className="mt-1 flex items-center gap-3">
                  <button className="text-neutral-400"><Heart className="h-3.5 w-3.5" /></button>
                  <button className="text-[11px] font-medium text-neutral-400">Reply</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="fixed bottom-0 left-1/2 flex w-full max-w-[430px] -translate-x-1/2 items-center gap-2 border-t border-neutral-200 bg-white px-4 py-3">
        <input
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Write a comment..."
          className="flex-1 rounded-full border border-neutral-200 px-4 py-2 text-[13px] text-black outline-none focus:border-black"
          onKeyDown={(e) => e.key === 'Enter' && submitComment()}
        />
        <button
          onClick={submitComment}
          disabled={!commentText.trim() || sending}
          className="text-black disabled:opacity-30"
        >
          <Send className="h-5 w-5" strokeWidth={1.8} />
        </button>
      </div>
    </div>
  );
}
