'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ChevronRight, User, Bell, Shield, Globe, CreditCard, HelpCircle, FileText, LogOut, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

const SECTIONS = [
  {
    title: 'Account',
    items: [
      { icon: User, label: 'Edit Profile', href: '/profile/edit' },
      { icon: Shield, label: 'Change Password', href: '#' },
    ],
  },
  {
    title: 'Preferences',
    items: [
      { icon: Bell, label: 'Notification Settings', href: '#' },
      { icon: Shield, label: 'Privacy', href: '#' },
      { icon: Globe, label: 'Language', href: '#' },
    ],
  },
  {
    title: 'Subscription',
    items: [
      { icon: CreditCard, label: 'Manage Subscription', href: '/subscription' },
    ],
  },
  {
    title: 'About',
    items: [
      { icon: HelpCircle, label: 'Help Center', href: '#' },
      { icon: FileText, label: 'Terms of Service', href: '#' },
      { icon: FileText, label: 'Privacy Policy', href: '#' },
    ],
  },
];

export default function SettingsPage() {
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center gap-3 border-b border-neutral-200 px-4 py-3">
        <button onClick={() => router.back()} className="text-black">
          <ArrowLeft className="h-6 w-6" strokeWidth={1.8} />
        </button>
        <h1 className="text-[18px] font-semibold text-black">Settings</h1>
      </header>

      <div className="flex-1 py-2">
        {SECTIONS.map(({ title, items }) => (
          <div key={title} className="mb-2">
            <p className="px-4 py-2 text-[12px] font-semibold uppercase tracking-wide text-neutral-400">{title}</p>
            {items.map(({ icon: Icon, label, href }) => (
              <Link
                key={label}
                href={href}
                className="flex items-center gap-3 px-4 py-3 active:bg-neutral-50"
              >
                <Icon className="h-5 w-5 text-neutral-600" strokeWidth={1.5} />
                <span className="flex-1 text-[14px] text-black">{label}</span>
                <ChevronRight className="h-4 w-4 text-neutral-300" />
              </Link>
            ))}
          </div>
        ))}

        <div className="mt-4 border-t border-neutral-200 pt-2">
          <p className="px-4 py-2 text-[12px] font-semibold uppercase tracking-wide text-red-400">Danger Zone</p>
          <button onClick={handleLogout} className="flex w-full items-center gap-3 px-4 py-3 active:bg-neutral-50">
            <LogOut className="h-5 w-5 text-neutral-600" strokeWidth={1.5} />
            <span className="flex-1 text-left text-[14px] text-black">Log Out</span>
          </button>
          <button className="flex w-full items-center gap-3 px-4 py-3 active:bg-neutral-50">
            <Trash2 className="h-5 w-5 text-red-500" strokeWidth={1.5} />
            <span className="flex-1 text-left text-[14px] text-red-500">Delete Account</span>
          </button>
        </div>

        <p className="px-4 py-6 text-center text-[11px] text-neutral-400">Nexus AI v1.0.0</p>
      </div>
    </div>
  );
}
