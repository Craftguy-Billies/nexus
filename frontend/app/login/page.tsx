'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { isFirebaseWebConfigured } from '@/lib/firebase';

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      router.push('/feed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      await loginWithGoogle();
      router.push('/feed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google login failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-8">
      <h1
        className="mb-2 text-[32px] text-black"
        style={{ fontFamily: 'var(--font-pacifico), cursive' }}
      >
        Nexus
      </h1>
      <p className="mb-8 text-[15px] text-neutral-500">Welcome Back</p>

      {error && (
        <div className="mb-4 w-full rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-600">{error}</div>
      )}

      <div className="w-full space-y-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-[14px] text-black outline-none focus:border-black"
        />

        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 pr-10 text-[14px] text-black outline-none focus:border-black"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        <button
          onClick={handleLogin}
          disabled={loading || !email || !password}
          className="w-full rounded-lg bg-black py-3 text-[15px] font-semibold text-white disabled:opacity-40 active:opacity-80"
        >
          {loading ? 'Logging in...' : 'Log In'}
        </button>
      </div>

      <div className="my-6 flex w-full items-center gap-3">
        <div className="h-px flex-1 bg-neutral-200" />
        <span className="text-[12px] text-neutral-400">or</span>
        <div className="h-px flex-1 bg-neutral-200" />
      </div>

      <button
        onClick={handleGoogleLogin}
        disabled={!isFirebaseWebConfigured() || googleLoading || loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-neutral-200 py-2.5 text-[14px] font-medium text-black active:bg-neutral-50 disabled:opacity-40"
      >
        {googleLoading ? 'Signing in...' : 'Continue with Google'}
      </button>
      <button className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-neutral-200 py-2.5 text-[14px] font-medium text-black active:bg-neutral-50 disabled:opacity-40">
        Continue with Apple
      </button>

      <p className="mt-6 text-[13px] text-neutral-500">
        Don&apos;t have an account?{' '}
        <Link href="/onboarding" className="font-semibold text-black">
          Sign Up
        </Link>
      </p>

      <button className="mt-2 text-[12px] text-neutral-400">Forgot Password?</button>
    </div>
  );
}
