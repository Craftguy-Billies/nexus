'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

type LoginView = 'main' | 'email';

export default function LoginPage() {
  const router = useRouter();
  const { loginWithGoogle, loginWithEmail } = useAuth();

  const [view, setView] = useState<LoginView>('main');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const { isNewUser } = await loginWithGoogle();
      router.push(isNewUser ? '/onboarding/handle' : '/feed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    setError('');
    try {
      const { isNewUser } = await loginWithEmail(email, password);
      router.push(isNewUser ? '/onboarding/handle' : '/feed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // ── Email sub-view ──────────────────────────────────────────
  if (view === 'email') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-8">
        <button
          onClick={() => { setView('main'); setError(''); }}
          className="mb-6 self-start text-[13px] text-neutral-500"
        >
          ← Back
        </button>

        <h1
          className="mb-2 text-[32px] text-black"
          style={{ fontFamily: 'var(--font-pacifico), cursive' }}
        >
          Nexus
        </h1>
        <p className="mb-8 text-[15px] text-neutral-500">Continue with Email</p>

        {error && (
          <div className="mb-4 w-full rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-600">
            {error}
          </div>
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
              onKeyDown={(e) => e.key === 'Enter' && handleEmailLogin()}
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
            onClick={handleEmailLogin}
            disabled={loading || !email || !password}
            className="w-full rounded-lg bg-black py-3 text-[15px] font-semibold text-white disabled:opacity-40 active:opacity-80"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </div>

        <button className="mt-4 text-[12px] text-neutral-400">Forgot Password?</button>

        <p className="mt-6 text-[13px] text-neutral-500">
          Don&apos;t have an account?{' '}
          <Link href="/onboarding" className="font-semibold text-black">
            Sign Up
          </Link>
        </p>
      </div>
    );
  }

  // ── Main login view ─────────────────────────────────────────
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
        <div className="mb-4 w-full rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-600">
          {error}
        </div>
      )}

      <div className="w-full space-y-3">
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-neutral-200 py-2.5 text-[14px] font-medium text-black active:bg-neutral-50 disabled:opacity-40"
        >
          {/* Google icon */}
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </button>

        <button
          onClick={() => setView('email')}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-neutral-200 py-2.5 text-[14px] font-medium text-black active:bg-neutral-50"
        >
          Continue with Email
        </button>
      </div>

      <p className="mt-6 text-[13px] text-neutral-500">
        Don&apos;t have an account?{' '}
        <Link href="/onboarding" className="font-semibold text-black">
          Sign Up
        </Link>
      </p>
    </div>
  );
}
