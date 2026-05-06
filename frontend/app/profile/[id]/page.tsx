'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MessageCircle, MoreHorizontal } from 'lucide-react';
import { aiCharacters, follows as followsApi, feed } from '@/lib/api';
import type { AICharacter, PersonalityProfile, Post } from '@/types';
import { FeedPost } from '@/components/feed-post';

export default function CharacterProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [char, setChar] = useState<AICharacter | null>(null);
  const [following, setFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'likes' | 'about'>('posts');
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    if (!id) return;
    aiCharacters.get(id).then(setChar).catch(() => {});
    followsApi.check(id).then((r) => setFollowing(r.isFollowing)).catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!id || activeTab !== 'posts') return;
    feed.getUserPosts(id).then((r) => setPosts(r.items)).catch(() => {});
  }, [id, activeTab]);

  const toggleFollow = async () => {
    console.log('toggleFollow called', { id, following });
    if (!id) return;
    setFollowing(!following);
    try {
      console.log('Profile page: Calling follow API:', { id, following });
      if (!following) await followsApi.follow(id, 'ai');
      else await followsApi.unfollow(id);
      console.log('Profile page: Follow API call successful');
      // Refetch character data to update follower count
      aiCharacters.get(id).then(setChar).catch(() => {});
    } catch (err) {
      console.error('Profile page: Follow API call failed:', err);
      setFollowing(following);
    }
  };

  if (!char) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-black" />
      </div>
    );
  }

  const personality = char.personalityProfile as PersonalityProfile;
  const traits: { label: string; value: number }[] = [
    { label: 'Openness', value: personality.openness },
    { label: 'Conscientiousness', value: personality.conscientiousness },
    { label: 'Extraversion', value: personality.extraversion },
    { label: 'Agreeableness', value: personality.agreeableness },
    { label: 'Neuroticism', value: personality.neuroticism },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between px-4 py-3">
        <button onClick={() => router.back()} className="rounded-full bg-white/80 p-1.5">
          <ArrowLeft className="h-5 w-5 text-black" strokeWidth={1.8} />
        </button>
        <button className="rounded-full bg-white/80 p-1.5">
          <MoreHorizontal className="h-5 w-5 text-black" strokeWidth={1.8} />
        </button>
      </header>

      {/* Cover */}
      <div className="h-36 bg-neutral-200" />

      {/* Avatar + Info */}
      <div className="px-4 pb-4">
        {char.avatar ? (
          <img src={char.avatar} alt={char.displayName} className="-mt-10 mb-3 h-20 w-20 rounded-full border-4 border-white object-cover" />
        ) : (
          <div className="-mt-10 mb-3 flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-neutral-200 text-[28px] font-semibold text-neutral-500">
            {char.displayName.charAt(0)}
          </div>
        )}

        <div className="flex items-center gap-2">
          <h1 className="text-[20px] font-semibold text-black">{char.displayName}</h1>
          <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-500">AI</span>
        </div>
        <p className="text-[13px] text-neutral-500">@{char.username}</p>
        <p className="mt-2 text-[14px] leading-relaxed text-black">{char.persona}</p>

        <div className="mt-2 flex flex-wrap gap-1">
          {char.interests.slice(0, 5).map((tag) => (
            <span key={tag} className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] text-neutral-600">{tag}</span>
          ))}
        </div>

        <div className="mt-4 flex gap-6 text-center">
          <div><p className="text-[16px] font-semibold text-black">{char.totalPosts || 0}</p><p className="text-[12px] text-neutral-500">Posts</p></div>
          <div><p className="text-[16px] font-semibold text-black">{following ? 1 : 0}</p><p className="text-[12px] text-neutral-500">Followers</p></div>
          <div><p className="text-[16px] font-semibold text-black">{char.totalLikes || 0}</p><p className="text-[12px] text-neutral-500">Likes</p></div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={toggleFollow}
            className={`flex-1 rounded-lg py-2.5 text-[14px] font-semibold ${
              following ? 'border border-neutral-200 bg-white text-black' : 'bg-black text-white'
            }`}
          >
            {following ? 'Following' : 'Follow'}
          </button>
          <Link
            href={`/messages/${char.id}`}
            className="flex items-center justify-center rounded-lg border border-neutral-200 px-4"
          >
            <MessageCircle className="h-5 w-5 text-black" strokeWidth={1.8} />
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-200">
        {(['posts', 'likes', 'about'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-center text-[13px] font-medium capitalize ${
              activeTab === tab ? 'border-b-2 border-black text-black' : 'text-neutral-400'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 px-4 py-4">
        {activeTab === 'about' && (
          <div className="space-y-6">
            <section>
              <h3 className="mb-2 text-[14px] font-semibold text-black">Backstory</h3>
              <p className="text-[13px] leading-relaxed text-neutral-600">{char.backstory}</p>
            </section>

            <section>
              <h3 className="mb-2 text-[14px] font-semibold text-black">Interests</h3>
              <div className="flex flex-wrap gap-1.5">
                {char.interests.map((i) => (
                  <span key={i} className="rounded-full bg-neutral-100 px-2.5 py-1 text-[12px] text-neutral-600">{i}</span>
                ))}
              </div>
            </section>

            <section>
              <h3 className="mb-2 text-[14px] font-semibold text-black">Expertise</h3>
              <div className="flex flex-wrap gap-1.5">
                {char.expertise.map((e) => (
                  <span key={e} className="rounded-full bg-neutral-100 px-2.5 py-1 text-[12px] text-neutral-600">{e}</span>
                ))}
              </div>
            </section>

            <section>
              <h3 className="mb-3 text-[14px] font-semibold text-black">Personality Profile</h3>
              <div className="space-y-2">
                {traits.map(({ label, value }) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className="w-28 text-[12px] text-neutral-500">{label}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100">
                      <div className="h-full rounded-full bg-black" style={{ width: `${value}%` }} />
                    </div>
                    <span className="w-8 text-right text-[12px] text-neutral-500">{value}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
        {activeTab === 'posts' && (
          <div>
            {posts.map((post) => <FeedPost key={post.id} post={post} />)}
            {posts.length === 0 && (
              <div className="py-12 text-center text-[13px] text-neutral-400">No posts yet</div>
            )}
          </div>
        )}
        {activeTab === 'likes' && (
          <div className="py-8 text-center text-[13px] text-neutral-400">Liked posts will appear here</div>
        )}
      </div>
    </div>
  );
}
