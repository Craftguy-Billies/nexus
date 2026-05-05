'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye, EyeOff, Check, X } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { isFirebaseWebConfigured } from '@/lib/firebase';

export default function OnboardingIdentity() {
  const router = useRouter();
  const { register, registerWithGoogle } = useAuth();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [usernameValid, setUsernameValid] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const isValid = usernameValid === true && displayName.length > 0 && email.includes('@') && password.length >= 6;

  const handleSubmit = async () => {
    if (!isValid) return;
    setLoading(true);
    setError('');
    try {
      await register(email, password, username, displayName);
      router.push('/onboarding/interests');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    if (usernameValid !== true || !displayName) return;
    setLoading(true);
    setError('');
    try {
      await registerWithGoogle(username, displayName);
      router.push('/onboarding/interests');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col px-6 py-4">
      <button onClick={() => router.back()} className="mb-4 self-start text-black">
        <ArrowLeft className="h-6 w-6" strokeWidth={1.8} />
      </button>

      <div className="mb-2 flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full ${i <= 2 ? 'bg-black' : 'bg-neutral-200'}`} />
        ))}
      </div>

      <h1 className="mb-1 mt-6 text-[22px] font-semibold text-black">Create Your Identity</h1>
      <p className="mb-6 text-[13px] text-neutral-500">Set up your profile to join Nexus</p>

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
          <label className="mb-1 block text-[13px] font-medium text-black">Username</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-neutral-400">@</span>
            <input
              value={username}
              onChange={(e) => checkUsername(e.target.value)}
              placeholder="your_username"
              className="w-full rounded-lg border border-neutral-200 py-2.5 pl-8 pr-10 text-[14px] text-black outline-none focus:border-black"
            />
            {usernameValid !== null && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                {usernameValid ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-500" />}
              </span>
            )}
          </div>
          <p className="mt-1 text-[11px] text-neutral-400">3-30 characters, letters, numbers, underscores only</p>
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

        <div>
          <label className="mb-1 block text-[13px] font-medium text-black">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-lg border border-neutral-200 py-2.5 px-3 text-[14px] text-black outline-none focus:border-black"
          />
        </div>

        <div>
          <label className="mb-1 block text-[13px] font-medium text-black">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full rounded-lg border border-neutral-200 py-2.5 px-3 pr-10 text-[14px] text-black outline-none focus:border-black"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
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

        <button
          onClick={handleGoogleRegister}
          disabled={!isFirebaseWebConfigured() || usernameValid !== true || !displayName || loading}
          className="mt-2 w-full rounded-lg border border-neutral-200 py-3.5 text-[15px] font-semibold text-black disabled:opacity-40 active:bg-neutral-50"
        >
          Continue with Google
        </button>
      </div>
    </div>
  );
}
