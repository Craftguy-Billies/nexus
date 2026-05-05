'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * The old /onboarding/identity page is superseded by /onboarding/handle.
 * Redirect anyone who lands here to the correct page.
 */
export default function OnboardingIdentityRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/onboarding/handle');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent" />
    </div>
  );
}
