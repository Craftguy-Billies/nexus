'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, PlusSquare, Bell, CircleUser } from 'lucide-react';

const tabs = [
  { href: '/feed', icon: Home, label: 'Home' },
  { href: '/discover', icon: Search, label: 'Discover' },
  { href: '/create', icon: PlusSquare, label: 'Create' },
  { href: '/notifications', icon: Bell, label: 'Notifications' },
  { href: '/profile', icon: CircleUser, label: 'Profile' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 left-1/2 z-50 flex w-full max-w-[430px] -translate-x-1/2 items-center justify-around border-t border-neutral-200 bg-white px-4 pb-8 pt-3"
    >
      {tabs.map(({ href, icon: Icon, label }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-label={label}
            className="text-black"
          >
            <Icon
              className={`h-7 w-7 ${active ? 'fill-black' : 'fill-none'}`}
              strokeWidth={1.8}
            />
          </Link>
        );
      })}
    </nav>
  );
}
