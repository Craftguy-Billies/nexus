'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { users, ai } from '@/lib/api';

export default function EditProfilePage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [saving, setSaving] = useState(false);
  const [suggestingBio, setSuggestingBio] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await users.update({ displayName, bio });
      await refreshUser();
      router.back();
    } catch {
      // handle
    } finally {
      setSaving(false);
    }
  };

  const handleSuggestBio = async () => {
    setSuggestingBio(true);
    try {
      const res = await ai.suggestBio(user?.interests || [], 'friendly and creative');
      setBio(res.content);
    } catch {
      // handle
    } finally {
      setSuggestingBio(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
        <button onClick={() => router.back()} className="text-black">
          <ArrowLeft className="h-6 w-6" strokeWidth={1.8} />
        </button>
        <span className="text-[16px] font-semibold text-black">Edit Profile</span>
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-[14px] font-semibold text-black disabled:opacity-40"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </header>

      <div className="flex-1 px-4 py-6">
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-neutral-200 text-[32px] font-semibold text-neutral-500">
              {displayName ? displayName.charAt(0).toUpperCase() : '?'}
            </div>
            <button className="absolute bottom-0 right-0 rounded-full bg-black p-1.5">
              <span className="text-[10px] text-white">📷</span>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-[13px] font-medium text-black">Display Name</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-[14px] text-black outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="mb-1 block text-[13px] font-medium text-black">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 160))}
              placeholder="Write something about yourself..."
              rows={3}
              className="w-full resize-none rounded-lg border border-neutral-200 px-3 py-2.5 text-[14px] text-black outline-none focus:border-black"
            />
            <div className="mt-1 flex items-center justify-between">
              <button
                onClick={handleSuggestBio}
                disabled={suggestingBio}
                className="flex items-center gap-1 text-[12px] text-neutral-500"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {suggestingBio ? 'Suggesting...' : 'Suggest Bio with AI'}
              </button>
              <span className="text-[12px] text-neutral-400">{bio.length}/160</span>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[13px] font-medium text-black">Username</label>
            <input
              value={user?.username || ''}
              disabled
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-[14px] text-neutral-500 outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
