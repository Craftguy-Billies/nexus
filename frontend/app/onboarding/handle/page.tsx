'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

export default function OnboardingHandle() {
  const router = useRouter();
  const { firebaseUser, isAuthenticated, isNewUser, completeOnboarding, isLoading } = useAuth();

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [usernameValid, setUsernameValid] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Guard: if auth is done loading and user is not new (returning user), go to feed
  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && !isNewUser) {
        router.replace('/feed');
      } else if (!isAuthenticated && !firebaseUser) {
        // Not signed in at all → back to onboarding start
        router.replace('/onboarding');
      }
    }
  }, [isLoading, isAuthenticated, isNewUser, firebaseUser, router]);

  const checkUsername = (val: string) => {
    setUsername(val);
    if (val.length >= 3 && /^[a-zA-Z0-9_]+$/.test(val)) {
      setUsernameValid(true);
    } else if (val.length > 0) {
      setUsernameValid(false);
    } else {
      setUsernameValid(null);
    }
  };

  const isValid = usernameValid === true && displayName.trim().length > 0;

  const handleSubmit = async () => {
    if (!isValid) return;
    setLoading(true);
    setError('');
    try {
      await completeOnboarding(username, displayName.trim());
      router.push('/onboarding/interests');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col px-6 py-4">
      <div className="mb-2 flex gap-1 mt-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full ${i <= 1 ? 'bg-black' : 'bg-neutral-200'}`} />
        ))}
      </div>

      <h1 className="mb-1 mt-6 text-[22px] font-semibold text-black">Create Your Identity</h1>
      <p className="mb-6 text-[13px] text-neutral-500">Choose your handle and display name</p>

      <div className="mb-4 flex justify-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100 text-[24px] font-semibold text-neutral-400">
          {displayName ? displayName.charAt(0).toUpperCase() : '?'}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-600">{error}</div>
      )}

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-[13px] font-medium text-black">Handle</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-neutral-400">@</span>
            <input
              value={username}
              onChange={(e) => checkUsername(e.target.value)}
              placeholder="your_handle"
              className="w-full rounded-lg border border-neutral-200 py-2.5 pl-8 pr-10 text-[14px] text-black outline-none focus:border-black"
            />
            {usernameValid !== null && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                {usernameValid ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <X className="h-4 w-4 text-red-500" />
                )}
              </span>
            )}
          </div>
          <p className="mt-1 text-[11px] text-neutral-400">
            3–30 characters, letters, numbers, underscores only. Duplicates are allowed.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-[13px] font-medium text-black">Display Name</label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="How should AI characters call you?"
            className="w-full rounded-lg border border-neutral-200 py-2.5 px-3 text-[14px] text-black outline-none focus:border-black"
          />
        </div>
      </div>

      <div className="mt-auto pt-6">
        <button
          onClick={handleSubmit}
          disabled={!isValid || loading}
          className="w-full rounded-lg bg-black py-3.5 text-[15px] font-semibold text-white disabled:opacity-40 active:opacity-80"
        >
          {loading ? 'Creating...' : 'Continue'}
        </button>
      </div>
    </div>
  );
}
